import { useChat } from '../../hooks/useChat';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import TypingIndicator from './TypingIndicator';
import type { Subtopic } from '../../utils/types';

export default function ChatContainer({ selectedSubtopic, onComplete }: { selectedSubtopic: Subtopic | null; onComplete: (progress: number) => void; }) {
  const { messages, sendMessage, isTyping } = useChat();

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-white">
        {selectedSubtopic && (
          <div className="w-full max-w-3xl mx-auto mb-4">
            <div className="rounded-lg border border-gray-200 bg-white p-3">
              <div className="text-xs uppercase text-gray-500 mb-1">Goal</div>
              <div className="text-sm text-gray-700">
                {selectedSubtopic.objectives.length > 0 ? selectedSubtopic.objectives.map((o) => o.text).join(' • ') : 'Explore this subtopic interactively.'}
              </div>
            </div>
          </div>
        )}
        <div className="w-full max-w-3xl mx-auto space-y-3 sm:space-y-4">
          {messages.map((msg, i) => (
            <ChatMessage key={i} message={msg} />
          ))}
          {isTyping && <TypingIndicator />}
        </div>
      </div>
      <div className="w-full flex justify-center px-4 sm:px-6 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <div className="w-full max-w-3xl">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-xs text-gray-500">
              {selectedSubtopic ? `${selectedSubtopic.name} • ${selectedSubtopic.progress}%` : 'Select a subtopic to start'}
            </div>
            {selectedSubtopic && (
              <div className="flex items-center gap-2">
                <button
                  className="text-xs px-2 py-1 rounded bg-gray-200 hover:bg-gray-300"
                  onClick={() => onComplete(Math.min(100, (selectedSubtopic.progress ?? 0) + 10))}
                >
                  Mark +10%
                </button>
                <button
                  className="text-xs px-2 py-1 rounded bg-teal-500 text-white hover:bg-teal-600"
                  onClick={() => onComplete(100)}
                >
                  Mark Complete
                </button>
              </div>
            )}
          </div>
          <ChatInput onSend={sendMessage} />
        </div>
      </div>
    </div>
  );
}
