import { useEffect, useState, useRef } from 'react';
import { ChatMessageType } from '../utils/types';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws';

export const useChat = () => {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | undefined>(undefined);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const hasConnected = useRef(false)

  const connectWebSocket = () => {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    const wsUrl = token ? `${WS_URL}?token=${token}` : WS_URL;

    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log('✅ WebSocket connected');
      setIsConnected(true);
      reconnectAttemptsRef.current = 0;
    };

    socket.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
      setIsConnected(false);
    };

    socket.onclose = () => {
      console.log('👋 WebSocket disconnected');
      setIsConnected(false);

      // Attempt to reconnect
      if (reconnectAttemptsRef.current < maxReconnectAttempts) {
        reconnectAttemptsRef.current++;
        const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
        console.log(`🔄 Reconnecting in ${delay}ms... (attempt ${reconnectAttemptsRef.current})`);

        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket();
        }, delay);
      } else {
        console.error('❌ Max reconnection attempts reached');
      }
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'typing') {
          setIsTyping(true);
          // Start a new assistant message placeholder
          setMessages((prev) => [...prev, { sender: 'assistant', content: '' }]);
        } else if (data.type === 'delta') {
          setIsTyping(true);
          const delta: string = data.content || '';
          if (!delta) return;
          // Append delta to the last assistant message
          setMessages((prev) => {
            // No messages yet → start new with assistant
            if (prev.length === 0) {
              return [{ sender: 'assistant', content: delta ?? '' }];
            }

            const last = prev[prev.length - 1];

            // If last message not from assistant → start new assistant message
            if (last.sender !== 'assistant') {
              return [...prev, { sender: 'assistant', content: delta ?? '' }];
            }

            // Otherwise append to last assistant message safely
            const updated = [...prev];
            updated[updated.length - 1] = {
              ...last,
              content: (last.content ?? '') + (delta ?? ''),
            };

            return updated;
          });

        } else if (data.type === 'done') {
          setIsTyping(false);
          // Nothing else to do; stream already accumulated in last assistant message
        } else {
          // Backward compatibility: treat as a full message object
          setIsTyping(false);
          setMessages((prev) => [...prev, data]);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    setWs(socket);
  };

  useEffect(() => {
    if (hasConnected.current) return;
    hasConnected.current = true;
    connectWebSocket();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (ws) {
        ws.close();
      }
    };
  }, []);

  const sendMessage = (content: string) => {
    const userMsg: ChatMessageType = { sender: 'user', content };
    setMessages((prev) => [...prev, userMsg]);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(content); // Send just the content, not the full object
    } else {
      console.error('WebSocket not connected');
    }
  };

  const sendTopicSelection = (topicName: string, subtopicName: string) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      // Send WebSocket message
      ws.send(JSON.stringify({
        type: 'topic_selected',
        topic: {
          name: topicName,
          subtopic: subtopicName
        }
      }));
      return true;
    }
    return false;
  };

  return {
    messages,
    isTyping,
    isConnected,
    sendMessage,
    sendTopicSelection,
  };
};
