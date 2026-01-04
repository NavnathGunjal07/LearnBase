import { useEffect, useState, useRef } from "react";
import { ChatMessageType } from "../utils/types";
import { chatService, onboardingService } from "@/api";

const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8080/ws";

// Helper to map backend steps to frontend IDs
const getStepId = (backendStep: string) => {
  switch (backendStep) {
    case "AUTH_EMAIL":
    case "AUTH_PASSWORD":
    case "AUTH_SIGNUP_PASSWORD":
      return "auth";
    case "ASK_NAME":
      return "identity";
    case "ASK_INTERESTS":
      return "interests";
    case "ASK_GOALS":
    case "ASK_EDUCATION":
      return "goals";
    case "COMPLETE":
      return "complete";
    default:
      return "auth";
  }
};

export interface UseChatOptions {
  isAuthMode?: boolean;
  onAuthenticated?: (token: string, user: any) => void;
  onVisualizer?: (data: any) => void;
}

export const useChat = (
  optionsOrIsAuthMode?: boolean | UseChatOptions,
  onAuthenticatedLegacy?: (token: string, user: any) => void
) => {
  const options: UseChatOptions =
    typeof optionsOrIsAuthMode === "object"
      ? optionsOrIsAuthMode
      : {
          isAuthMode: optionsOrIsAuthMode,
          onAuthenticated: onAuthenticatedLegacy,
        };

  const { isAuthMode, onAuthenticated, onVisualizer } = options;
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [currentTopicId, setCurrentTopicId] = useState<number | null>(null);
  const [currentSubtopicId, setCurrentSubtopicId] = useState<number | null>(
    null
  );
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState<string>("auth"); // Default to auth
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const reconnectTimeoutRef = useRef<number | undefined>(undefined);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const hasConnected = useRef(false);
  const currentMessageRef = useRef<string>("");
  const shouldReconnectRef = useRef(true); // Flag to control reconnection
  const [lastProgressUpdate, setLastProgressUpdate] = useState<{
    topicId: number;
    subtopicId: number;
    progress: number;
    topicProgress: number;
    timestamp: number;
  } | null>(null);
  const [lastTopicUpdate, setLastTopicUpdate] = useState<number | null>(null);
  // Last progress update ref for sync
  const lastProgressUpdateRef = useRef(lastProgressUpdate); // Ref to access current value in return without re-creating object if not needed, though state is fine
  const [visualizerAvailability, setVisualizerAvailability] = useState<{
    status: "idle" | "loading" | "available" | "unavailable";
    message?: string;
  }>({ status: "idle" });

  const [inputConfig, setInputConfig] = useState<{
    inputType: "text" | "email" | "password" | "select" | "code";
    options?: string[];
    suggestions?: string[];
    visualizerSuggestions?: string[];
    language?: string;
    visualizerData?: any;
  }>({ inputType: "text" });
  const [isGeneratingVisualizer, setIsGeneratingVisualizer] = useState(false);

  const [codingWorkspace, setCodingWorkspace] = useState<{
    isOpen: boolean;
    challenge?: any;
    executionResult?: any;
  }>({ isOpen: false });

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
        }

        // Update onboarding step if present
        if (data.currentStep) {
          setOnboardingStep(getStepId(data.currentStep));
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
        } else if (data.type === "visualizer_suggestions") {
          // Legacy support or if we keep using metadata for something else
          setInputConfig((prev) => ({
            ...prev,
            visualizerSuggestions: data.suggestions,
          }));
        } else if (data.type === "visualizer_check_result") {
          const { isVisualizable, suggestions } = data.payload;
          setVisualizerAvailability({
            status: isVisualizable ? "available" : "unavailable",
            message: isVisualizable
              ? undefined
              : "This topic doesn't seem suitable for visualization.",
          });

          if (isVisualizable) {
            setInputConfig((prev) => ({
              ...prev,
              visualizerSuggestions: suggestions,
            }));
          } else {
            setInputConfig((prev) => ({
              ...prev,
              visualizerSuggestions: [],
            }));
          }
        } else if (data.type === "code_request") {
          setInputConfig((prev) => ({
            ...prev,
            inputType: "code",
            language: data.language || "javascript",
          }));
        } else if (data.type === "code_request") {
          // Defer to coding workspace logic if challenge is present
          setInputConfig((prev) => ({
            ...prev,
            inputType: "code",
            language: data.language || "javascript",
          }));
        } else if (data.type === "coding_challenge") {
          setCodingWorkspace({
            isOpen: true,
            challenge: data.challenge,
            executionResult: null,
          });
          // Also add a message to the chat history
          setMessages((prev) => [
            ...prev,
            {
              sender: "assistant",
              content:
                "Coding Challenge: " + (data.challenge.title || "Untitled"),
              messageType: "coding_challenge",
              codingChallenge: data.challenge,
              isComplete: true,
            },
          ]);
        } else if (data.type === "code_execution_result") {
          setCodingWorkspace((prev) => ({
            ...prev,
            executionResult: {
              status: data.status,
              result: data.result,
              error: data.error,
            },
          }));
        } else if (data.type === "quiz") {
          // Handle quiz card - add as a message
          setMessages((prev) => [
            ...prev,
            {
              sender: "assistant",
              content: "Quiz Time!", // Fallback content
              messageType: "quiz",
              quiz: data.quiz,
              isComplete: true,
            },
          ]);
        } else if (data.type === "quiz_result") {
          // Quiz answer result received
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
          // Clear messages to show topic selector / fresh chat
          setMessages([]);
          setInputConfig({ inputType: "text" }); // Reset input
        } else if (data.type === "authenticated") {
          // Authentication successful - only in auth mode
          if (isAuthMode && onAuthenticated) {
            const { token, user } = data;
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
        } else if (data.type === "progress_updated") {
          // Handle progress update
          setLastProgressUpdate({
            topicId: data.topicId,
            subtopicId: data.subtopicId,
            progress: data.progress,
            topicProgress: data.topicProgress,
            timestamp: Date.now(),
          });
        } else if (data.type === "topics_updated") {
          setLastTopicUpdate(Date.now());
        } else if (data.type === "visualizer_progress") {
          setIsGeneratingVisualizer(true);
        } else if (data.type === "visualizer") {
          // Handle visualizer data - store in inputConfig for manual triggering
          setIsGeneratingVisualizer(false);
          if (data.payload) {
            setInputConfig((prev) => ({
              ...prev,
              visualizerData: data.payload,
            }));
          }
        } else if (data.type === "visualizer_complete") {
          setIsGeneratingVisualizer(false);
        } else if (data.type === "error") {
          setIsTyping(false);
          setIsGeneratingVisualizer(false);
          const content = data.content || data.message || "An error occurred";
          setMessages((prev) => [
            ...prev,
            { sender: "assistant", content, isComplete: true, isError: true },
          ]);
        } else {
          // Backward compatibility: treat as a full message object
          console.warn("⚠️ Received unhandled message type:", data);
          setIsTyping(false);
          if (data.content || data.message) {
            setMessages((prev) => [...prev, data]);
          }
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

  const sendMessage = (
    content: string,
    mode: "chat" | "visualizer" = "chat"
  ) => {
    const userMsg: ChatMessageType = { sender: "user", content };
    setMessages((prev) => [...prev, userMsg]);

    // Clear suggestions and reset input to text when user sends a message
    setInputConfig((prev) => ({
      ...prev,
      suggestions: undefined,
      inputType: "text",
      language: undefined,
      visualizerData: undefined,
    }));
    setIsGeneratingVisualizer(false);

    if (ws && ws.readyState === WebSocket.OPEN) {
      // Always send as JSON with type=message and include mode
      ws.send(
        JSON.stringify({
          type: "message",
          content,
          mode,
          sessionId: currentTopicId ? undefined : null, // Optional: include session context if needed, but backend handles it via state
        })
      );
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

  const checkVisualizerAvailability = () => {
    // Use ws state or socketRef if available?
    // Looking at file content, there is no socketRef visible in top 50 lines.
    // Actually, looking at View 392, line 50 `const [ws, setWs]`.
    // And `connectWebSocket` sets `socket` and does NOT seem to set a ref named `socketRef`.
    // Wait, line 109 `const socket = new WebSocket(wsUrl)`.
    // It seems `socketRef` might be missing entirely if I didn't see it.
    // BUT `triggerVisualizer` exists.
    // Let's use `ws` state if it's updated.
    // Wait, `ws` is state. `setWs(socket)` must be called somewhere?
    // In `connectWebSocket`, I don't see `setWs(socket)`.
    // I need to verify if `ws` state is populated.
    // Actually, let's use the local `ws` state variable if it's available in scope, but `ws` is state.
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "visualizer_check" }));
    }
  };

  const triggerVisualizer = () => {
    if (inputConfig.visualizerData && onVisualizer) {
      onVisualizer(inputConfig.visualizerData);
    }
  };

  const resetChat = () => {
    // Clear local state immediately for UI responsiveness
    setMessages([]);
    setCurrentTopicId(null);
    setCurrentSubtopicId(null);
    setInputConfig({ inputType: "text" });
    setIsGeneratingVisualizer(false);
    setIsTyping(false);

    // Notify backend to reset session and send greeting
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "new_chat" }));
    }
  };

  const submitQuizAnswer = (selectedIndex: number, correctIndex: number) => {
    if (ws?.readyState !== WebSocket.OPEN) return;

    ws.send(
      JSON.stringify({
        type: "quiz_answer",
        selectedIndex,
        correctIndex,
      })
    );
  };

  const submitCode = (code: string, language: string) => {
    if (!codingWorkspace.challenge || ws?.readyState !== WebSocket.OPEN) return;

    ws.send(
      JSON.stringify({
        type: "code_execution",
        code,
        language,
        challenge: codingWorkspace.challenge,
      })
    );
  };

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
    triggerVisualizer,
    isGeneratingVisualizer,
    onboardingStep,
    lastTopicUpdate,
    checkVisualizerAvailability,
    visualizerAvailability,
    resetChat,

    submitQuizAnswer,
    submitCode,
    codingWorkspace,
    setCodingWorkspace,
  };
};
