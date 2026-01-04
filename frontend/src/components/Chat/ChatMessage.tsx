import { useState } from "react";
import { ChatMessageType } from "../../utils/types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import Avatar from "./Avatar";
import { QuizCard } from "../QuizCard";
import { ChevronDown, ChevronRight, Play, Terminal } from "lucide-react";

interface ChatMessageProps {
  message: ChatMessageType;
  onQuizAnswer?: (selectedIndex: number, correctIndex: number) => void;
  onOpenCodingChallenge?: (challenge: any) => void;
}

export default function ChatMessage({
  message,
  onQuizAnswer,
  onOpenCodingChallenge,
}: ChatMessageProps) {
  const isUser = message.sender === "user";
  const rawContent = message.content?.trim() || "";
  const [isExpanded, setIsExpanded] = useState(false);

  // Convert literal \n to actual newlines for proper rendering
  const content = rawContent.replace(/\\n/g, "\n");

  // Check for coding challenge
  if (message.messageType === "coding_challenge" && message.codingChallenge) {
    return (
      <div className="flex justify-start items-end gap-3 w-full animate-fade-in">
        <Avatar message="Challenge!" size="small" />
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

  // Check for quiz
  if (message.messageType === "quiz" && message.quiz) {
    return (
      <div className="flex justify-start items-end gap-3 w-full animate-fade-in">
        <Avatar message="Quiz Time!" size="small" />
        <div className="w-[90%] max-w-[90%]">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm transition-all duration-300">
            {/* Header / Summary View */}
            <div
              onClick={() => setIsExpanded(!isExpanded)}
              className={`p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors ${
                isExpanded ? "border-b border-gray-100" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 text-blue-600 p-1.5 rounded-md">
                  <span className="text-lg leading-none">🎯</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-wide">
                    Quiz
                  </span>
                  <span className="font-medium text-gray-800 text-sm line-clamp-1">
                    {message.quiz.question}
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
              <div className="p-4 bg-gray-50/30">
                <QuizCard
                  question={message.quiz.question}
                  options={message.quiz.options}
                  correctIndex={message.quiz.correctIndex}
                  onAnswer={(selectedIndex) =>
                    onQuizAnswer?.(selectedIndex, message.quiz!.correctIndex)
                  }
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
        {!isUser && <Avatar isTyping={true} size="small" />}
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
      {!isUser && <Avatar message={content} size="small" />}
      <div
        className={`${
          isUser ? "max-w-[90%] md:max-w-[75%]" : "w-[90%] max-w-[90%]"
        } px-4 py-2 rounded-xl ${
          isUser
            ? "bg-white border border-gray-200 text-gray-800"
            : "bg-gray-50 text-gray-900"
        } shadow-sm`}
      >
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
                      className="text-blue-600 hover:text-blue-700 underline"
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
