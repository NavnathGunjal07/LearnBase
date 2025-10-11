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
    <form onSubmit={handleSubmit} className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl shadow-sm">
      <input
        type="text"
        className="flex-1 bg-transparent text-gray-900 px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-md"
        placeholder="Message LearnBase..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <button
        type="submit"
        disabled={!input.trim()}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          input.trim()
            ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        }`}
      >
        Send
      </button>
    </form>
  );
}
