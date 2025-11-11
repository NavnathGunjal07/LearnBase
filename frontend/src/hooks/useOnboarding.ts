import { useEffect, useState, useRef } from 'react';
import { ChatMessageType } from '../utils/types';
import { onboardingService } from '@/api';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws';

export const useOnboarding = () => {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const reconnectTimeoutRef = useRef<number | undefined>(undefined);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const hasConnected = useRef(false);
  const currentMessageRef = useRef<string>('');

  // Check onboarding status on mount
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const status = await onboardingService.getStatus();
        setHasCompletedOnboarding(status.hasCompletedOnboarding);
        if (!status.hasCompletedOnboarding) {
          connectWebSocket();
        }
      } catch (error) {
        console.error('Failed to check onboarding status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkStatus();
  }, []);

  const connectWebSocket = () => {
    if (hasConnected.current) return;
    hasConnected.current = true;

    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found for WebSocket connection');
      return;
    }

    const socket = new WebSocket(`${WS_URL}?token=${token}`);

    socket.onopen = () => {
      console.log('✅ Onboarding WebSocket connected');
      setIsConnected(true);
      reconnectAttemptsRef.current = 0;

      // Start onboarding conversation
      socket.send(JSON.stringify({ type: 'start_onboarding' }));
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'connected') {
          console.log('Connected:', data.message);
        } else if (data.type === 'delta') {
          // Streaming message
          setIsTyping(true);
          currentMessageRef.current += data.content;
          
          // Update the last message or create new one
          setMessages((prev) => {
            const newMessages = [...prev];
            if (newMessages.length > 0 && newMessages[newMessages.length - 1].sender === 'assistant' && !newMessages[newMessages.length - 1].isComplete) {
              newMessages[newMessages.length - 1] = {
                ...newMessages[newMessages.length - 1],
                content: currentMessageRef.current,
                isComplete: false,
              };
            } else {
              newMessages.push({
                sender: 'assistant',
                content: currentMessageRef.current,
                isComplete: false,
              });
            }
            return newMessages;
          });
        } else if (data.type === 'done') {
          setIsTyping(false);
          // Mark the last message as complete
          setMessages((prev) => {
            const newMessages = [...prev];
            if (newMessages.length > 0) {
              newMessages[newMessages.length - 1] = {
                ...newMessages[newMessages.length - 1],
                isComplete: true,
              };
            }
            return newMessages;
          });
          currentMessageRef.current = '';
        } else if (data.type === 'onboarding_complete') {
          // Onboarding completed, update status and redirect
          setHasCompletedOnboarding(true);
          if (ws) {
            ws.close();
          }
        } else if (data.type === 'error') {
          console.error('WebSocket error:', data.message);
          setIsTyping(false);
        }
      } catch (error) {
        // Handle non-JSON messages (shouldn't happen but just in case)
        console.error('Error parsing WebSocket message:', error);
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    socket.onclose = () => {
      console.log('WebSocket closed');
      setIsConnected(false);
      hasConnected.current = false;

      // Attempt to reconnect
      if (reconnectAttemptsRef.current < maxReconnectAttempts) {
        reconnectAttemptsRef.current++;
        reconnectTimeoutRef.current = window.setTimeout(() => {
          connectWebSocket();
        }, 3000 * reconnectAttemptsRef.current);
      }
    };

    setWs(socket);
  };

  useEffect(() => {
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
      ws.send(JSON.stringify({ type: 'message', content }));
    } else {
      console.error('WebSocket not connected');
    }
  };

  const completeOnboarding = async (data?: {
    background?: string;
    goals?: string;
    learningInterests?: string;
    skillLevel?: string;
  }) => {
    try {
      await onboardingService.complete(data || {});
      setHasCompletedOnboarding(true);
      if (ws) {
        ws.close();
      }
      return true;
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      throw error;
    }
  };

  return {
    messages,
    sendMessage,
    isTyping,
    isConnected,
    hasCompletedOnboarding,
    isLoading,
    completeOnboarding,
  };
};

