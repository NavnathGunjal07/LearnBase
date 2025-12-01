import { useEffect, useState, useRef } from "react";
import { ChatMessageType } from "../utils/types";
import { chatService, onboardingService } from "@/api";

const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8080/ws";

export const useChat = (
  isAuthMode?: boolean,
  onAuthenticated?: (token: string, user: any) => void
) => {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [currentTopicId, setCurrentTopicId] = useState<number | null>(null);
  const [currentSubtopicId, setCurrentSubtopicId] = useState<number | null>(
    null
  );
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const reconnectTimeoutRef = useRef<number | undefined>(undefined);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const hasConnected = useRef(false);
  const currentMessageRef = useRef<string>("");
  const shouldReconnectRef = useRef(true); // Flag to control reconnection
  const [lastProgressUpdate] = useState<{
    topicId: number;
    subtopicId: number;
    progress: number;
    topicProgress: number;
    timestamp: number;
  } | null>(null);
  const lastProgressUpdateRef = useRef(lastProgressUpdate); // Ref to access current value in return without re-creating object if not needed, though state is fine

  const [inputConfig, setInputConfig] = useState<{
    inputType: "text" | "email" | "password" | "select";
    options?: string[];
    suggestions?: string[];
  }>({ inputType: "text" });

  // Keep ref in sync
  useEffect(() => {
    lastProgressUpdateRef.current = lastProgressUpdate;
  }, [lastProgressUpdate]);

  const connectWebSocket = () => {
    // Get token from localStorage (skip if in auth mode)
    const token = isAuthMode ? null : localStorage.getItem("token");
    const wsUrl = token ? `${WS_URL}?token=${token}` : WS_URL;

    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log(
        "✅ WebSocket connected" + (isAuthMode ? " (Auth Mode)" : "")
      );
      setIsConnected(true);
      reconnectAttemptsRef.current = 0;
    };

    socket.onerror = (error) => {
      console.error("❌ WebSocket error:", error);
      setIsConnected(false);
    };

    socket.onclose = () => {
      console.log("👋 WebSocket disconnected");
      setIsConnected(false);

      // Only attempt to reconnect if we should reconnect and haven't exceeded max attempts
      if (
        shouldReconnectRef.current &&
        reconnectAttemptsRef.current < maxReconnectAttempts
      ) {
        reconnectAttemptsRef.current++;
        const delay = Math.min(
          1000 * Math.pow(2, reconnectAttemptsRef.current),
          30000
        );
        console.log(
          `🔄 Reconnecting in ${delay}ms... (attempt ${reconnectAttemptsRef.current})`
        );

        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket();
        }, delay);
      } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
        console.error("❌ Max reconnection attempts reached");
      }
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // Handle input configuration if present
        if (data.inputType || data.suggestions) {
          setInputConfig((prev) => ({
            ...prev,
            ...(data.inputType ? { inputType: data.inputType } : {}),
            ...(data.options ? { options: data.options } : {}),
            ...(data.suggestions ? { suggestions: data.suggestions } : {}),
          }));
        } else if (data.type === "auth_required") {
          // Default to email for auth_required if not specified (though we added it in backend)
          if (!data.inputType) {
            setInputConfig({ inputType: "email" });
          }
        } else if (data.type === "suggestions") {
          setInputConfig((prev) => ({
            ...prev,
            suggestions: data.suggestions,
          }));
        }

        if (data.type === "typing") {
          setIsTyping(true);
          // Start a new assistant message placeholder
          setMessages((prev) => {
            const lastMsg = prev[prev.length - 1];
            // Only add new placeholder if last message isn't already an incomplete assistant message
            if (
              lastMsg &&
              lastMsg.sender === "assistant" &&
              !lastMsg.isComplete
            ) {
              return prev;
            }
            return [
              ...prev,
              { sender: "assistant", content: "", isComplete: false },
            ];
          });
        } else if (data.type === "delta") {
          setIsTyping(true);
          const delta: string = data.content || "";
          if (!delta) return;

          // Append delta to the last assistant message using functional update
          setMessages((prev) => {
            if (prev.length === 0) {
              // No messages yet, create new assistant message
              return [
                {
                  sender: "assistant",
                  content: delta,
                  isComplete: false,
                },
              ];
            }

            const lastMsg = prev[prev.length - 1];

            // If last message is not from assistant or is complete, create new message
            if (lastMsg.sender !== "assistant" || lastMsg.isComplete) {
              return [
                ...prev,
                {
                  sender: "assistant",
                  content: delta,
                  isComplete: false,
                },
              ];
            }

            // Append to existing incomplete assistant message
            const updated = [...prev];
            updated[updated.length - 1] = {
              ...lastMsg,
              content: (lastMsg.content || "") + delta,
              isComplete: false,
            };

            return updated;
          });
        } else if (data.type === "done") {
          setIsTyping(false);
          // Mark the last message as complete
          setMessages((prev) => {
            if (prev.length === 0) return prev;

            const lastMsg = prev[prev.length - 1];
            if (lastMsg.sender !== "assistant") return prev;

            const updated = [...prev];
            updated[updated.length - 1] = {
              ...lastMsg,
              isComplete: true,
            };
            return updated;
          });
          currentMessageRef.current = "";
        } else if (data.type === "onboarding_complete") {
          // Onboarding completed
          setIsOnboarding(false);
          setHasCompletedOnboarding(true);
          // Clear messages to show topic selector
          setMessages([]);
          setInputConfig({ inputType: "text" }); // Reset input
        } else if (data.type === "authenticated") {
          // Authentication successful - only in auth mode
          console.log("🔐 Received authenticated message:", data);
          if (isAuthMode && onAuthenticated) {
            const { token, user } = data;
            console.log("🔑 Token:", token ? "present" : "missing");
            console.log("👤 User:", user);
            onAuthenticated(token, user);
          } else {
            console.warn("⚠️ Authenticated message received but:", {
              isAuthMode,
              hasCallback: !!onAuthenticated,
            });
          }
        } else if (data.type === "auth_required" || data.type === "message") {
          // Auth-specific messages (show as assistant)
          if (data.message || data.content) {
            const content = data.message || data.content;
            setMessages((prev) => [
              ...prev,
              { sender: "assistant", content, isComplete: true },
            ]);
          }
        } else {
          // Backward compatibility: treat as a full message object
          setIsTyping(false);
          setMessages((prev) => [...prev, data]);
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    setWs(socket);
  };

  useEffect(() => {
    if (hasConnected.current) return;
    hasConnected.current = true;
    shouldReconnectRef.current = true; // Enable reconnection
    connectWebSocket();

    return () => {
      // Cleanup: disable reconnection and close connection
      shouldReconnectRef.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (ws) {
        ws.close();
      }
    };
  }, []);

  const sendMessage = (content: string) => {
    const userMsg: ChatMessageType = { sender: "user", content };
    setMessages((prev) => [...prev, userMsg]);

    // Clear suggestions when user sends a message
    setInputConfig((prev) => ({ ...prev, suggestions: undefined }));

    if (ws && ws.readyState === WebSocket.OPEN) {
      // In auth mode, send as JSON with type=message
      if (isAuthMode) {
        ws.send(JSON.stringify({ type: "message", content }));
      } else {
        ws.send(content); // Send just the content for regular chat
      }
    } else {
      console.error("WebSocket not connected");
    }
  };

  const loadChatHistory = async (topicId: number, subtopicId?: number) => {
    try {
      const data = await chatService.getChatHistory(topicId, subtopicId);
      const messages = data.messages || [];
      setMessages(messages);
      return { sessionId: data.sessionId, hasHistory: messages.length > 0 };
    } catch (error) {
      console.error("Failed to load chat history:", error);
      return { sessionId: null, hasHistory: false };
    }
  };

  const sendTopicSelection = async (
    topicName: string,
    subtopicName: string,
    topicId: number,
    subtopicId?: number
  ) => {
    // Don't allow topic selection during onboarding
    if (isOnboarding) return false;

    // Clear previous messages
    setMessages([]);

    // Update current topic/subtopic
    setCurrentTopicId(topicId);
    setCurrentSubtopicId(subtopicId || null);

    // Load chat history for this topic
    console.log("🔄 Loading chat history for topic:", topicId);
    const { sessionId, hasHistory } = await loadChatHistory(
      topicId,
      subtopicId
    );
    console.log("📜 Chat history loaded:", { sessionId, hasHistory });

    if (ws && ws.readyState === WebSocket.OPEN) {
      console.log("🟢 WebSocket is OPEN, sending selection message...");
      // Only send topic selection message if there's no existing history
      if (!hasHistory) {
        console.log("📤 Sending topic_selected");
        ws.send(
          JSON.stringify({
            type: "topic_selected",
            topic: {
              name: topicName,
              subtopic: subtopicName,
              topicId,
              subtopicId,
            },
          })
        );
      } else {
        console.log("📤 Sending session_resumed");
        // Just notify backend about the session without triggering welcome message
        ws.send(
          JSON.stringify({
            type: "session_resumed",
            sessionId,
            topicId,
            subtopicId,
          })
        );
      }
      return true;
    } else {
      console.error("🔴 WebSocket is NOT OPEN", { wsState: ws?.readyState });
    }
    return false;
  };

  const startOnboarding = () => {
    if (!isOnboarding && !hasCompletedOnboarding) {
      setIsOnboarding(true);
      setMessages([]);
      currentMessageRef.current = "";

      // Wait for websocket to be ready
      const sendOnboardingStart = () => {
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "start_onboarding" }));
        } else {
          // Retry after a short delay
          setTimeout(sendOnboardingStart, 100);
        }
      };

      sendOnboardingStart();
    }
  };

  // Check onboarding status on mount
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const status = await onboardingService.getStatus();
        setHasCompletedOnboarding(status.hasCompletedOnboarding);
      } catch (error) {
        console.error("Failed to check onboarding status:", error);
      }
    };

    checkOnboardingStatus();
  }, []);

  return {
    messages,
    isTyping,
    isConnected,
    sendMessage,
    sendTopicSelection,
    loadChatHistory,
    currentTopicId,
    currentSubtopicId,
    isOnboarding,
    hasCompletedOnboarding,
    startOnboarding,
    lastProgressUpdate,
    inputConfig,
  };
};
