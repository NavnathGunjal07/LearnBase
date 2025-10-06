import { useState } from 'react';

export default function ChatInput({ onSend }: { onSend: (msg: string) => void }) {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSend(input);
    setInput('');
  };

  return (
    <form onSubmit={handleSubmit} className="sticky bottom-0 inset-x-0 flex items-center gap-2 sm:gap-3 p-2 sm:p-3 border border-default bg-gray-50 rounded-xl shadow-subtle">
      <input
        type="text"
        className="flex-1 bg-gray-50 text-gray-900 px-3 sm:px-4 py-2 rounded-md placeholder:text-gray-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 border border-gray-200"
        placeholder="Type your message..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <button
        type="submit"
        className="ml-0 px-3 sm:px-4 py-2 rounded-xl bg-white text-gray-900 border border-gray-200 hover:bg-gray-100 active:bg-gray-200 transition-colors"
      >
        Send
      </button>
    </form>
  );
}
