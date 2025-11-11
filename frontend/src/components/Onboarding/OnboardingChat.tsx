import { useEffect, useRef } from 'react';
import ChatMessage from '../Chat/ChatMessage';
import ChatInput from '../Chat/ChatInput';
import TypingIndicator from '../Chat/TypingIndicator';
import { ChatMessageType } from '../../utils/types';

interface OnboardingChatProps {
  messages: ChatMessageType[];
  sendMessage: (msg: string) => void;
  isTyping: boolean;
  isConnected: boolean;
}

export default function OnboardingChat({
  messages,
  sendMessage,
  isTyping,
  isConnected,
}: OnboardingChatProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Welcome to LearnBase!</h2>
          <p className="text-sm text-gray-500">Let's get to know you better</p>
        </div>
        {!isConnected && (
          <div className="text-xs text-yellow-600">Connecting...</div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50">
        <div className="w-full max-w-3xl mx-auto space-y-4 sm:space-y-6">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              Starting conversation...
            </div>
          )}
          {messages.map((msg, i) => (
            <ChatMessage key={i} message={msg} />
          ))}
          {isTyping && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="w-full flex justify-center px-4 sm:px-6 pb-[calc(1rem+env(safe-area-inset-bottom))] bg-gray-50">
        <div className="w-full max-w-3xl">
          <ChatInput onSend={sendMessage} />
        </div>
      </div>
    </div>
  );
}

