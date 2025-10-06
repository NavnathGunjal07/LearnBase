import { ChatMessageType } from '../../utils/types';

export default function ChatMessage({ message }: { message: ChatMessageType }) {
  const isUser = message.sender === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] md:max-w-[75%] px-4 py-2 rounded-xl ${
          isUser
            ? 'bg-white border border-gray-200 text-gray-800'
            :'bg-gray-100 text-gray-900' 
        } shadow-none`}
      >
        {message.content}
      </div>
    </div>
  );
}
