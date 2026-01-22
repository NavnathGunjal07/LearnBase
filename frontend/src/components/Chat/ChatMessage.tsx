import { useState, useEffect } from "react";
import { ChatMessageType } from "../../utils/types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import Avatar from "./Avatar";
import { QuizCard } from "../QuizCard";
import {
  ChevronDown,
  ChevronRight,
  Play,
  Terminal,
  Volume2,
  VolumeX,
  Pause,
} from "lucide-react";
import { useTTS } from "../../hooks/useTTS";

interface ChatMessageProps {
  message: ChatMessageType;
  onQuizAnswer?: (
    allAnswers: Array<{
      questionIndex: number;
      questionText: string;
      selectedIndex: number;
    }>
  ) => void;
  onOpenCodingChallenge?: (challenge: any) => void;
  isLoading?: boolean;
}

export default function ChatMessage({
  message,
  onQuizAnswer,
  onOpenCodingChallenge,
  isLoading,
}: ChatMessageProps) {
  const isUser = message.sender === "user";
  const rawContent = message.content?.trim() || "";
  const [isExpanded, setIsExpanded] = useState(false);
  const {
    speak,
    stop,
    isSpeaking,
    isPaused,
    pause,
    resume,
    settings,
    currentText,
  } = useTTS();

  // Convert literal \n to actual newlines for proper rendering
  const content = rawContent.replace(/\\n/g, "\n");

  // Auto-play for assistant messages if enabled
  useEffect(() => {
    if (
      !isUser &&
      content &&
      settings.autoPlay &&
      settings.enabled &&
      message.isComplete
    ) {
      speak(content);
    }
  }, [
    isUser,
    content,
    settings.autoPlay,
    settings.enabled,
    message.isComplete,
    speak,
  ]);

  const handleVoiceToggle = () => {
    if (isSpeaking && currentText === content) {
      if (isPaused) {
        resume();
      } else {
        pause();
      }
    } else {
      speak(content);
    }
  };

  const handleVoiceStop = (e: React.MouseEvent) => {
    e.stopPropagation();
    stop();
  };

  const isThisMessageSpeaking = isSpeaking && currentText === content;

  const AvatarWrapper = ({ children }: { children: React.ReactNode }) => (
    <div className="relative inline-block">
      {isLoading && (
        <div className="absolute -inset-1 rounded-full border-2 border-transparent border-t-[var(--accent)] border-r-purple-500 animate-spin z-10 pointer-events-none" />
      )}
      {children}
    </div>
  );

  // Check for coding challenge
  if (message.messageType === "coding_challenge" && message.codingChallenge) {
    return (
      <div className="flex justify-start items-end gap-3 w-full animate-fade-in">
        <AvatarWrapper>
          <Avatar message="Challenge!" size="small" />
        </AvatarWrapper>
        <div className="w-[90%] max-w-[90%]">
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-purple-100 p-2 rounded-lg text-purple-600">
                <Terminal size={20} />
              </div>
              <h3 className="font-semibold text-gray-800">
                {message.codingChallenge.title}
              </h3>
            </div>
            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
              {message.codingChallenge.description}
            </p>
            <button
              onClick={() => onOpenCodingChallenge?.(message.codingChallenge)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors w-full sm:w-auto justify-center"
            >
              <Play size={16} />
              Open Coding Workspace
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Check for coding submission
  if (message.messageType === "coding_submission" && message.codingSubmission) {
    const isSuccess = message.codingSubmission.status === "completed";
    return (
      <div className="flex justify-start items-end gap-3 w-full animate-fade-in">
        <AvatarWrapper>
          <Avatar
            message={isSuccess ? "Great Job!" : "Keep Trying!"}
            size="small"
          />
        </AvatarWrapper>
        <div className="w-[90%] max-w-[90%]">
          <div
            className={`bg-white border text-sm rounded-xl overflow-hidden shadow-sm transition-all duration-300 ${
              isSuccess ? "border-green-200" : "border-red-200"
            }`}
          >
            <div
              onClick={() => setIsExpanded(!isExpanded)}
              className={`p-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 ${
                isExpanded ? "border-b border-gray-100" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-1.5 rounded-md ${
                    isSuccess
                      ? "bg-green-100 text-green-600"
                      : "bg-red-100 text-red-600"
                  }`}
                >
                  {isSuccess ? (
                    <span className="text-lg">✅</span>
                  ) : (
                    <span className="text-lg">❌</span>
                  )}
                </div>
                <div>
                  <div className="font-semibold text-gray-800">
                    {isSuccess
                      ? "🎉🌈 Excellent! You got it right! 🚀"
                      : "Solution Failed"}
                  </div>
                  <div className="text-xs text-gray-500">
                    Passed: {message.codingSubmission.passedCount} /{" "}
                    {message.codingSubmission.totalCount} Test Cases
                  </div>
                </div>
              </div>
              <div className="text-gray-400">
                {isExpanded ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronRight size={16} />
                )}
              </div>
            </div>

            {isExpanded && (
              <div className="p-0">
                <div className="bg-gray-900 p-3 pt-2 text-xs font-mono text-gray-300 overflow-x-auto">
                  <div className="flex justify-between items-center mb-2 border-b border-gray-700 pb-1">
                    <span>{message.codingSubmission.language}</span>
                  </div>
                  <pre>{message.codingSubmission.code}</pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Check for quiz
  if (message.messageType === "quiz" && message.quiz) {
    // Extract quiz data from message
    const quizData = message.quiz;
    const questions = quizData.questions || [];
    const userAnswers = quizData.userAnswers || [];
    const status = quizData.status || "active";

    return (
      <div className="flex justify-start items-end gap-3 w-full animate-fade-in">
        <AvatarWrapper>
          <Avatar message="Quiz Time!" size="small" />
        </AvatarWrapper>
        <div className="w-[90%] max-w-[90%]">
          <div className="bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-xl overflow-hidden shadow-sm transition-all duration-300">
            {/* Header / Summary View */}
            <div
              onClick={() => setIsExpanded(!isExpanded)}
              className={`p-4 flex items-center justify-between cursor-pointer hover:bg-[var(--bg-input)] transition-colors ${
                isExpanded ? "border-b border-[var(--border-default)]" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="bg-orange-50 dark:bg-orange-900/20 text-[var(--accent)] p-1.5 rounded-md">
                  <span className="text-lg leading-none">🎯</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[var(--accent)] uppercase tracking-wide">
                    Quiz{" "}
                    {status === "completed"
                      ? "- Completed"
                      : status === "stopped"
                        ? "- Stopped"
                        : ""}
                  </span>
                  <span className="font-medium text-[var(--fg-default)] text-sm line-clamp-1">
                    {!isExpanded
                      ? `${quizData.topic || "Knowledge Check"} - ${
                          questions.length
                        } Questions`
                      : "Interactive Quiz"}
                  </span>
                </div>
              </div>
              <div className="text-gray-400">
                {isExpanded ? (
                  <ChevronDown size={20} />
                ) : (
                  <ChevronRight size={20} />
                )}
              </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="p-4 bg-[var(--bg-input)]/50">
                <QuizCard
                  questions={questions}
                  onAnswer={(allAnswers) => onQuizAnswer?.(allAnswers)}
                  userAnswers={userAnswers}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div
        className={`flex ${
          isUser ? "justify-end" : "justify-start items-start gap-3"
        } w-full opacity-60`}
      >
        {!isUser && (
          <AvatarWrapper>
            <Avatar isTyping={true} size="small" />
          </AvatarWrapper>
        )}
        <div
          className={`max-w-[90%] md:max-w-[75%] px-4 py-2 rounded-xl italic text-gray-400 ${
            isUser ? "bg-white border border-gray-200" : "bg-gray-50"
          }`}
        >
          {isUser ? "..." : "Thinking..."}
        </div>
      </div>
    );
  }
  return (
    <div
      className={`flex ${
        isUser ? "justify-end" : "justify-start items-end gap-3"
      } w-full animate-fade-in`}
    >
      {!isUser && (
        <AvatarWrapper>
          <Avatar message={content} size="small" />
        </AvatarWrapper>
      )}
      <div
        className={`${
          isUser ? "max-w-[90%] md:max-w-[75%]" : "w-[90%] max-w-[90%]"
        } px-4 py-2 rounded-xl ${
          isUser
            ? "bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--fg-default)]"
            : "bg-[var(--bg-input)] text-[var(--fg-default)]"
        } shadow-sm relative group`}
      >
        {!isUser && settings.enabled && content && (
          <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleVoiceToggle}
              className={`p-1.5 rounded-full shadow-md transition-all ${
                isThisMessageSpeaking
                  ? "bg-[var(--accent)] text-white"
                  : "bg-white hover:bg-gray-100 text-gray-700"
              }`}
              title={
                isThisMessageSpeaking
                  ? isPaused
                    ? "Resume"
                    : "Pause"
                  : "Play audio"
              }
            >
              {isThisMessageSpeaking ? (
                isPaused ? (
                  <Play size={14} />
                ) : (
                  <Pause size={14} />
                )
              ) : (
                <Volume2 size={14} />
              )}
            </button>
            {isThisMessageSpeaking && (
              <button
                onClick={handleVoiceStop}
                className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-md transition-all"
                title="Stop audio"
              >
                <VolumeX size={14} />
              </button>
            )}
          </div>
        )}
        {isUser ? (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {content}
          </p>
        ) : (
          <div className="relative">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              className="prose prose-sm max-w-none prose-headings:mt-2 prose-headings:mb-1 prose-p:my-1 prose-pre:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 text-sm leading-relaxed"
              components={{
                code: ({
                  node,
                  inline,
                  className,
                  children,
                  ...props
                }: any) => {
                  return !inline ? (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  ) : (
                    <code
                      className="bg-gray-200 px-1 py-0.5 rounded text-sm font-mono"
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
                pre: ({ children, ...props }: any) => {
                  return (
                    <pre
                      className="bg-gray-900 text-gray-100 p-3 rounded-lg overflow-x-auto text-sm"
                      {...props}
                    >
                      {children}
                    </pre>
                  );
                },
                a: ({ children, ...props }: any) => {
                  return (
                    <a
                      className="text-[var(--accent)] hover:text-orange-700 underline"
                      target="_blank"
                      rel="noopener noreferrer"
                      {...props}
                    >
                      {children}
                    </a>
                  );
                },
                table: ({ children, ...props }: any) => {
                  return (
                    <div className="overflow-x-auto my-2">
                      <table
                        className="min-w-full border-collapse border border-gray-300"
                        {...props}
                      >
                        {children}
                      </table>
                    </div>
                  );
                },
                th: ({ children, ...props }: any) => {
                  return (
                    <th
                      className="border border-gray-300 bg-gray-50 px-3 py-2 text-left font-semibold text-sm"
                      {...props}
                    >
                      {children}
                    </th>
                  );
                },
                td: ({ children, ...props }: any) => {
                  return (
                    <td
                      className="border border-gray-300 px-3 py-2 text-sm"
                      {...props}
                    >
                      {children}
                    </td>
                  );
                },
                p: ({ children, ...props }: any) => {
                  return (
                    <p className="my-1 leading-relaxed text-sm" {...props}>
                      {children}
                    </p>
                  );
                },
                h1: ({ children, ...props }: any) => {
                  return (
                    <h1
                      className="text-lg font-semibold mt-2 mb-1 text-gray-900"
                      {...props}
                    >
                      {children}
                    </h1>
                  );
                },
                h2: ({ children, ...props }: any) => {
                  return (
                    <h2
                      className="text-base font-semibold mt-2 mb-1 text-gray-900"
                      {...props}
                    >
                      {children}
                    </h2>
                  );
                },
                h3: ({ children, ...props }: any) => {
                  return (
                    <h3
                      className="text-sm font-semibold mt-2 mb-1 text-gray-900"
                      {...props}
                    >
                      {children}
                    </h3>
                  );
                },
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
