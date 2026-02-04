import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import Avatar from "./Avatar";
import { onboardingService } from "@/api";
import { useAuth } from "@/context/AuthContext";
import { OnboardingLayout } from "../Onboarding/OnboardingLayout";
import { GoogleAuthButton } from "../Auth/GoogleAuthButton";
import { GoogleOneTap } from "../Auth/GoogleOneTap";

interface ChatContainerProps {
  chatHook: ReturnType<typeof import("../../hooks/useChat").useChat>;
  isAuthMode?: boolean;
}

const LoadingView = () => {
  const [index, setIndex] = useState(0);
  const texts = [
    "Getting things ready...",
    "Wait for a sec...",
    "Setting up your space...",
    "Almost done...",
  ];

  useEffect(() => {
    const timer = setInterval(
      () => setIndex((i) => (i + 1) % texts.length),
      2000
    );
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-[var(--bg-default)]">
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent)] mx-auto mb-4"></div>
          <p className="text-[var(--fg-muted)] text-lg animate-fade-in font-medium">
            {texts[index]}
          </p>
        </div>
      </div>
    </div>
  );
};

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
    onboardingStep,
    currentTopicId,
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
  const isAtBottomRef = useRef(true); // Use ref instead of state to avoid render lag issues
  const prevMessagesLength = useRef(messages.length);

  // Handle scroll events to detect if user is at bottom
  const handleScroll = () => {
    const div = scrollViewportRef.current;
    if (!div) return;

    const threshold = 50;
    const isAtBottom =
      div.scrollHeight - div.scrollTop - div.clientHeight < threshold;
    isAtBottomRef.current = isAtBottom;
  };

  // Auto-scroll logic
  useEffect(() => {
    const div = scrollViewportRef.current;
    if (!div) return;

    const isNewMessage = messages.length > prevMessagesLength.current;
    const lastMessage = messages[messages.length - 1];
    const isUserMessage = lastMessage?.sender === "user";

    // If user sent a message, force "at bottom" state to true so we follow it
    if (isNewMessage && isUserMessage) {
      isAtBottomRef.current = true;
    }

    const behavior = "smooth";

    // Scroll if:
    // 1. We were already at the bottom (isAtBottomRef.current)
    // 2. OR we just forced it because it's a user message
    if (isAtBottomRef.current) {
      div.scrollTo({
        top: div.scrollHeight,
        behavior: behavior,
      });
    }

    prevMessagesLength.current = messages.length;
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
    return <LoadingView />;
  }

  // --- Onboarding / Auth View ---
  if (isAuthMode || isOnboarding) {
    return (
      <OnboardingLayout currentStep={onboardingStep as any}>
        {onboardingStep === "auth" && <GoogleOneTap />}
        <div className="flex flex-col h-full w-full">
          {/* Content Container with max-width and padding */}
          <div className="flex flex-col h-full w-full max-w-4xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
            {/* Google Auth Button (Only in Auth Step) - Fixed at top */}
            {onboardingStep === "auth" && (
              <div className="flex-shrink-0 pt-10 sm:pt-12 pb-4 flex flex-col items-center justify-center space-y-4">
                <p className="text-gray-600 font-medium text-lg">
                  Please log in to continue
                </p>
                <div className="w-full max-w-sm">
                  <GoogleAuthButton />
                </div>
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
                <ChatMessage
                  key={i}
                  message={msg}
                  isLoading={
                    i === messages.length - 1 &&
                    (chatHook.generationStatus?.status === "loading" ||
                      isTyping)
                  }
                  onQuizAnswer={chatHook.submitQuizAnswer}
                  onOpenCodingChallenge={(challenge) =>
                    chatHook.setCodingWorkspace({
                      isOpen: true,
                      challenge,
                      executionResult: null,
                    })
                  }
                />
              ))}
              {/* Only show dots if there's no active message being streamed? Actually isTyping usually means thinking before stream. 
                  But now we want the loader on the avatar. 
                  If we have a "Thinking..." message (empty content) it will show there.
                  If `isTyping` is true and no partial message, we might need a placeholder.
              */}
              {isTyping &&
                messages.length > 0 &&
                messages[messages.length - 1].sender === "user" && (
                  // If last message was user, we typically wait for backend to send an empty assistant message or we show a placeholder.
                  // The `useChat` hook usually appends an empty assistant message when stream starts.
                  // If `isTyping` is true but no assistant message yet, we can show a placeholder.
                  // However, let's rely on useChat appending the message.
                  // If `useChat` DOES NOT append placeholder immediately, we'd need one here.
                  // Let's assume useChat appends it or we just show the placeholder below.
                  <div className="flex justify-start items-start gap-3 w-full opacity-60">
                    <div className="relative inline-block">
                      <div className="absolute -inset-1 rounded-full border-2 border-transparent border-t-[var(--accent)] border-r-purple-500 animate-spin z-10 pointer-events-none" />
                      <Avatar isTyping={true} size="small" />
                    </div>
                    <div className="max-w-[90%] md:max-w-[75%] px-4 py-2 rounded-xl italic text-gray-400 bg-gray-50">
                      Thinking...
                    </div>
                  </div>
                )}

              {chatHook.generationStatus?.status === "loading" && (
                <div className="flex justify-center my-2 animate-fade-in">
                  <div className="bg-orange-50 text-[var(--accent)] text-xs py-1 px-3 rounded-full flex items-center gap-2 border border-orange-100">
                    <div className="w-3 h-3 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
                    {chatHook.generationStatus.message ||
                      "Generating content..."}
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
                  hideModeSwitcher={isOnboarding}
                  visualizerSuggestions={
                    chatHook.inputConfig?.visualizerSuggestions
                  }
                  generationStatus={chatHook.generationStatus}
                />
              </div>
            )}
          </div>
        </div>
      </OnboardingLayout>
    );
  }

  // --- Main Chat View ---
  const hasTopicSelection = currentTopicId !== null;

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-[var(--bg-default)]">
      {/* Connection Status */}
      {!isConnected && (
        <div className="bg-yellow-50 dark:bg-yellow-900/10 border-b border-yellow-200 dark:border-yellow-900/20 px-4 py-2 text-center">
          <span className="text-xs text-yellow-800 dark:text-yellow-400">
            🔄 Connecting to chat server...
          </span>
        </div>
      )}

      {/* Chat Messages or Topic Selector */}
      <>
        <div
          ref={scrollViewportRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 lg:p-12 pr-2 sm:pr-4 md:pr-6 lg:pr-8 bg-[var(--bg-default)] scroll-smooth min-h-0"
        >
          <div className="w-full max-w-3xl md:max-w-4xl mx-auto space-y-4 sm:space-y-6 pb-4">
            {!hasTopicSelection && messages.length === 0 && (
              <div className="flex flex-col items-center justify-center text-center py-16 px-4 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-2xl">
                <div className="text-4xl mb-4">🧭</div>
                <h2 className="text-lg font-semibold text-[var(--fg-default)]">
                  Choose a topic to get started
                </h2>
                <p className="text-sm text-[var(--fg-muted)] mt-2 max-w-md">
                  Pick a topic and subtopic from the sidebar to begin your
                  learning session.
                </p>
              </div>
            )}
            {messages.map((msg, i) => (
              <ChatMessage
                key={i}
                message={msg}
                isLoading={
                  i === messages.length - 1 &&
                  (chatHook.generationStatus?.status === "loading" || isTyping)
                }
                onQuizAnswer={chatHook.submitQuizAnswer}
                onOpenCodingChallenge={(challenge) =>
                  chatHook.setCodingWorkspace({
                    isOpen: true,
                    challenge,
                    executionResult: null,
                  })
                }
              />
            ))}

            {/* Immediate loading state for user message */}
            {isTyping &&
              messages.length > 0 &&
              messages[messages.length - 1].sender === "user" && (
                <div className="flex justify-start items-start gap-3 w-full opacity-60">
                  <div className="relative inline-block">
                    <div className="absolute -inset-1 rounded-full border-2 border-transparent border-t-[var(--accent)] border-r-purple-500 animate-spin z-10 pointer-events-none" />
                    <Avatar isTyping={true} size="small" />
                  </div>
                  <div className="max-w-[90%] md:max-w-[75%] px-4 py-2 rounded-xl italic text-[var(--fg-muted)] bg-[var(--bg-input)]">
                    Thinking...
                  </div>
                </div>
              )}

            {chatHook.generationStatus?.status === "loading" && (
              <div className="flex justify-center my-2 animate-fade-in">
                <div className="bg-orange-50 dark:bg-orange-900/10 text-[var(--accent)] text-xs py-1 px-3 rounded-full flex items-center gap-2 border border-orange-100 dark:border-orange-900/20">
                  <div className="w-3 h-3 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
                  {chatHook.generationStatus.message ||
                    (chatHook.generationStatus.type === "quiz"
                      ? "Generating Quiz..."
                      : chatHook.generationStatus.type === "coding_challenge"
                      ? "Generating Coding Challenge..."
                      : "Generating content...")}
                </div>
              </div>
            )}
            {/* Auto-scroll target */}
            <div ref={messagesEndRef} />
          </div>
        </div>
        {hasTopicSelection && (
          <div className="w-full bg-[var(--bg-default)] border-t border-[var(--border-default)]">
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
                onModeChange={(mode) => {
                  if (mode === "visualizer") {
                    chatHook.checkVisualizerAvailability();
                  }
                }}
                generationStatus={chatHook.generationStatus}
              />
            </div>
          </div>
        )}
      </>
      {/* Removed dedicated TopicSelector block */}
    </div>
  );
}
