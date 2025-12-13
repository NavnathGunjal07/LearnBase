import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import TopicSelector from "./TopicSelector";
import { onboardingService } from "@/api";
import { useAuth } from "@/context/AuthContext";
import { OnboardingLayout } from "../Onboarding/OnboardingLayout";
import { GoogleAuthButton } from "../Auth/GoogleAuthButton";

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
    onboardingStep,
  } = chatHook;
  const [isLoadingSession, setIsLoadingSession] = useState(!isAuthMode);
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(!isAuthMode);
  const hasLoadedSession = useRef(false);
  const hasCheckedOnboarding = useRef(false);
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  // Scroll refs and state
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const prevMessagesLength = useRef(messages.length);

  // Handle scroll events to detect if user is at bottom
  // Handle scroll events to detect if user is at bottom
  const handleScroll = () => {
    const div = scrollViewportRef.current;
    if (!div) return;

    const threshold = 100; // Increased threshold for better UX
    const newIsAtBottom =
      div.scrollHeight - div.scrollTop - div.clientHeight < threshold;
    setIsAtBottom(newIsAtBottom);
  };

  // Auto-scroll logic
  useEffect(() => {
    const div = scrollViewportRef.current;
    if (!div) return;

    const isNewMessage = messages.length > prevMessagesLength.current;
    const lastMessage = messages[messages.length - 1];
    const isUserMessage = lastMessage?.sender === "user";

    // Always use smooth scrolling as requested by user
    // Now that layout is stable (min-h-0), this should work without flickering
    const behavior = "smooth";

    // Scroll if:
    // 1. User is already close to bottom (following stream)
    // 2. It's a new message (jump to bottom to show it)
    // 3. Specifically if it's a user message (always follow user own input)
    if (isAtBottom || isNewMessage || isUserMessage) {
      div.scrollTo({
        top: div.scrollHeight,
        behavior: behavior,
      });
    }

    prevMessagesLength.current = messages.length;
  }, [messages, isTyping, isAtBottom]);

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

  // --- Onboarding / Auth View ---
  if (isAuthMode || isOnboarding) {
    return (
      <OnboardingLayout currentStep={onboardingStep as any}>
        <div className="flex flex-col h-full w-full">
          {/* Content Container with max-width and padding */}
          <div className="flex flex-col h-full w-full max-w-4xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
            {/* Google Auth Button (Only in Auth Step) - Fixed at top */}
            {onboardingStep === "auth" && (
              <div className="flex-shrink-0 pt-4 sm:pt-6 pb-4 flex justify-center">
                <GoogleAuthButton />
              </div>
            )}

            {/* Chat Messages (Scrollable) */}
            <div
              ref={scrollViewportRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto space-y-4 sm:space-y-6 py-4 pr-2 min-h-0"
            >
              {messages.length === 0 && (
                <div className="text-center text-gray-500 py-4">
                  {isAuthMode ? "Connecting..." : "Starting conversation..."}
                </div>
              )}
              {messages.map((msg, i) => (
                <ChatMessage key={i} message={msg} />
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white rounded-2xl rounded-tl-none py-3 px-4 shadow-sm border border-gray-100">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-0" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-300" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input (Fixed at Bottom) */}
            {onboardingStep !== "auth" && (
              <div className="flex-shrink-0 py-4 sm:py-6">
                <ChatInput
                  onSend={sendMessage}
                  placeholder="Type your answer..."
                  inputType={chatHook.inputConfig?.inputType}
                  options={chatHook.inputConfig?.options}
                  suggestions={chatHook.inputConfig?.suggestions}
                  language={chatHook.inputConfig?.language}
                  visualizerData={chatHook.inputConfig?.visualizerData}
                  onVisualizerClick={chatHook.triggerVisualizer}
                  isGeneratingVisualizer={chatHook.isGeneratingVisualizer}
                  hideModeSwitcher={true}
                />
              </div>
            )}
          </div>
        </div>
      </OnboardingLayout>
    );
  }

  // --- Main Chat View ---
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
      {/* Chat Messages or Topic Selector */}
      <>
        <div
          ref={scrollViewportRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 lg:p-12 pr-2 sm:pr-4 md:pr-6 lg:pr-8 bg-gray-50 scroll-smooth min-h-0"
        >
          <div className="w-full max-w-3xl md:max-w-4xl mx-auto space-y-4 sm:space-y-6 pb-4">
            {messages.map((msg, i) => (
              <ChatMessage key={i} message={msg} />
            ))}
            {/* Auto-scroll target */}
            <div ref={messagesEndRef} />
          </div>
        </div>
        {(isAuthMode || isOnboarding || !hasCompletedOnboarding || true) && ( // Always show input
          <div className="w-full bg-gray-50 border-t border-gray-100">
            <div className="w-full max-w-3xl md:max-w-4xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
              <ChatInput
                onSend={sendMessage}
                placeholder={isAuthMode ? "Type here..." : undefined}
                inputType={chatHook.inputConfig?.inputType}
                options={chatHook.inputConfig?.options}
                suggestions={chatHook.inputConfig?.suggestions}
                language={chatHook.inputConfig?.language}
                visualizerData={chatHook.inputConfig?.visualizerData}
                onVisualizerClick={chatHook.triggerVisualizer}
                isGeneratingVisualizer={chatHook.isGeneratingVisualizer}
              />
            </div>
          </div>
        )}
      </>
      {/* Removed dedicated TopicSelector block */}
    </div>
  );
}
