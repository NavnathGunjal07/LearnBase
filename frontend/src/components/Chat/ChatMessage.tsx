import { ChatMessageType } from '../../utils/types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';

export default function ChatMessage({ message }: { message: ChatMessageType }) {
  const isUser = message.sender === 'user';
  const content = message.content?.trim() || '';
   if (!content) {
    return (
      <div
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} w-full opacity-60`}
      >
        <div
          className={`max-w-[90%] md:max-w-[75%] px-4 py-2 rounded-xl italic text-gray-400 ${
            isUser ? 'bg-white border border-gray-200' : 'bg-gray-50'
          }`}
        >
          {isUser ? '...' : 'Thinking...'}
        </div>
      </div>
    );
  }
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} w-full`}>
      <div
        className={`${isUser ? 'max-w-[90%] md:max-w-[75%]' : 'w-[90%] max-w-[90%]'} px-4 py-2 rounded-xl ${
          isUser
            ? 'bg-white border border-gray-200 text-gray-800'
            : 'bg-gray-50 text-gray-900'
        } shadow-sm`}
      >
        {isUser ? (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        ) : (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
            className="prose prose-sm max-w-none prose-headings:mt-2 prose-headings:mb-1 prose-p:my-1 prose-pre:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 text-sm leading-relaxed"
            components={{
              code({ node, inline, className, children, ...props }: any) {
                const match = /language-(\w+)/.exec(className || '');
                return !inline ? (
                  <code className={className} {...props}>
                    {children}
                  </code>
                ) : (
                  <code className="bg-gray-200 px-1 py-0.5 rounded text-sm font-mono" {...props}>
                    {children}
                  </code>
                );
              },
              pre({ children, ...props }: any) {
                return (
                  <pre className="bg-gray-900 text-gray-100 p-3 rounded-lg overflow-x-auto text-sm" {...props}>
                    {children}
                  </pre>
                );
              },
              a({ children, ...props }: any) {
                return (
                  <a className="text-blue-600 hover:text-blue-700 underline" target="_blank" rel="noopener noreferrer" {...props}>
                    {children}
                  </a>
                );
              },
              table({ children, ...props }: any) {
                return (
                  <div className="overflow-x-auto my-2">
                    <table className="min-w-full border-collapse border border-gray-300" {...props}>
                      {children}
                    </table>
                  </div>
                );
              },
              th({ children, ...props }: any) {
                return (
                  <th className="border border-gray-300 bg-gray-50 px-3 py-2 text-left font-semibold text-sm" {...props}>
                    {children}
                  </th>
                );
              },
              td({ children, ...props }: any) {
                return (
                  <td className="border border-gray-300 px-3 py-2 text-sm" {...props}>
                    {children}
                  </td>
                );
              },
              p({ children, ...props }: any) {
                return (
                  <p className="my-1 leading-relaxed text-sm" {...props}>
                    {children}
                  </p>
                );
              },
              h1({ children, ...props }: any) {
                return (
                  <h1 className="text-lg font-semibold mt-2 mb-1 text-gray-900" {...props}>
                    {children}
                  </h1>
                );
              },
              h2({ children, ...props }: any) {
                return (
                  <h2 className="text-base font-semibold mt-2 mb-1 text-gray-900" {...props}>
                    {children}
                  </h2>
                );
              },
              h3({ children, ...props }: any) {
                return (
                  <h3 className="text-sm font-semibold mt-2 mb-1 text-gray-900" {...props}>
                    {children}
                  </h3>
                );
              },
            }}
          >
            {message.content}
          </ReactMarkdown>
        )}
      </div>
    </div>
  );
}
