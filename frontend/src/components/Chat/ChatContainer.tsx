import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import TopicSelector from "./TopicSelector";
import { onboardingService } from "@/api";
import { useAuth } from "@/context/AuthContext";

interface ChatContainerProps {
  chatHook: ReturnType<typeof import("../../hooks/useChat").useChat>;
  isAuthMode?: boolean;
}

export default function ChatContainer({
  chatHook,
  isAuthMode = false,
}: ChatContainerProps) {
  const {
    messages,
    sendMessage,
    isTyping,
    isConnected,
    sendTopicSelection,
    isOnboarding,
    hasCompletedOnboarding,
    currentTopicId,
  } = chatHook;
  const [isLoadingSession, setIsLoadingSession] = useState(!isAuthMode);
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(!isAuthMode);
  const hasLoadedSession = useRef(false);
  const hasCheckedOnboarding = useRef(false);
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    console.log("📜 Messages updated:", messages);
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Check onboarding status on mount and start onboarding if needed (skip in auth mode)
  useEffect(() => {
    if (isAuthMode || hasCheckedOnboarding.current) return; // Skip if in auth mode or already checked

    const checkOnboarding = async () => {
      if (!user) {
        setIsCheckingOnboarding(false);
        return;
      }

      try {
        hasCheckedOnboarding.current = true;
        const status = await onboardingService.getStatus();
        if (
          !status.hasCompletedOnboarding &&
          chatHook.isConnected &&
          chatHook.startOnboarding
        ) {
          // Start onboarding if not completed and websocket is connected
          setTimeout(() => {
            chatHook.startOnboarding();
          }, 500); // Small delay to ensure websocket is fully ready
        }
      } catch (error) {
        console.error("Failed to check onboarding status:", error);
        hasCheckedOnboarding.current = false; // Retry on failure
      } finally {
        setIsCheckingOnboarding(false);
      }
    };

    // Wait for websocket connection before checking onboarding
    if (chatHook.isConnected) {
      checkOnboarding();
    } else {
      // If not connected yet, wait a bit and check again
      const timer = setTimeout(() => {
        if (chatHook.isConnected) {
          checkOnboarding();
        } else {
          setIsCheckingOnboarding(false);
        }
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isAuthMode, user, chatHook.isConnected, chatHook.startOnboarding]);

  // Handle URL params and session loading
  useEffect(() => {
    if (isAuthMode) return;
    if (hasLoadedSession.current || isOnboarding || !hasCompletedOnboarding)
      return;

    // Only proceed if connected to avoid race conditions
    if (!isConnected) return;

    hasLoadedSession.current = true;

    const initSession = async () => {
      try {
        // Check URL params first
        const topicParam = searchParams.get("topic");
        const subtopicParam = searchParams.get("subtopic");
        const topicIdParam = searchParams.get("topicId");
        const subtopicIdParam = searchParams.get("subtopicId");

        if (topicParam && topicIdParam) {
          console.log("🔗 Initializing from URL params:", {
            topicParam,
            subtopicParam,
          });
          await sendTopicSelection(
            topicParam,
            subtopicParam || "",
            parseInt(topicIdParam),
            subtopicIdParam ? parseInt(subtopicIdParam) : undefined
          );
        } else {
          // Fallback to last session if no URL params
          const { userService } = await import("@/api");
          const data = await userService.getLastSession();

          if (data.hasSession && data.topicId && data.topicName) {
            // Update URL to match restored session
            setSearchParams({
              topic: data.topicName,
              topicId: data.topicId.toString(),
              ...(data.subtopicName && { subtopic: data.subtopicName }),
              ...(data.subtopicId && {
                subtopicId: data.subtopicId.toString(),
              }),
            });

            await sendTopicSelection(
              data.topicName,
              data.subtopicName || "",
              data.topicId,
              data.subtopicId || undefined
            );
          }
        }
      } catch (error) {
        console.error("Failed to initialize session:", error);
      } finally {
        setIsLoadingSession(false);
      }
    };

    initSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthMode, isOnboarding, hasCompletedOnboarding, isConnected]); // Added isConnected dependency

  // Show loading state while checking onboarding or last session
  if (isCheckingOnboarding || (isLoadingSession && !isOnboarding)) {
    return (
      <div className="flex flex-col flex-1 overflow-hidden bg-gray-50">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">
              {isCheckingOnboarding
                ? "Checking onboarding status..."
                : "Loading your learning session..."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-gray-50">
      {/* Connection Status */}
      {!isConnected && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 text-center">
          <span className="text-xs text-yellow-800">
            🔄 Connecting to chat server...
          </span>
        </div>
      )}

      {/* Chat Messages or Topic Selector */}
      {!isAuthMode &&
      hasCompletedOnboarding &&
      !isOnboarding &&
      messages.length === 0 &&
      !currentTopicId ? (
        // Show topic selector after onboarding is complete, no messages, and no topic selected
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <TopicSelector
            onTopicSelected={async (
              topicId,
              topicName,
              subtopicId,
              subtopicName
            ) => {
              // Update URL params on selection
              setSearchParams({
                topic: topicName,
                topicId: topicId.toString(),
                ...(subtopicName && { subtopic: subtopicName }),
                ...(subtopicId && { subtopicId: subtopicId.toString() }),
              });

              await sendTopicSelection(
                topicName,
                subtopicName || "",
                topicId,
                subtopicId
              );
            }}
          />
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50 scroll-smooth">
            <div className="w-full max-w-3xl mx-auto space-y-4 sm:space-y-6 pb-4">
              {messages.length === 0 && (isOnboarding || isAuthMode) && (
                <div className="text-center text-gray-500 py-8">
                  {isAuthMode ? "Connecting..." : "Starting conversation..."}
                </div>
              )}
              {messages.map((msg, i) => (
                <ChatMessage key={i} message={msg} />
              ))}
              {/* Auto-scroll target */}
              <div ref={messagesEndRef} />
            </div>
          </div>
          {(isAuthMode ||
            isOnboarding ||
            !hasCompletedOnboarding ||
            messages.length > 0) && (
            <div className="w-full bg-gray-50 border-t border-gray-100">
              <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
                <ChatInput
                  onSend={sendMessage}
                  placeholder={isAuthMode ? "Type here..." : undefined}
                  inputType={chatHook.inputConfig?.inputType}
                  options={chatHook.inputConfig?.options}
                  suggestions={chatHook.inputConfig?.suggestions}
                  language={chatHook.inputConfig?.language}
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
