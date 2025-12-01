export default function TypingIndicator() {
  return (
    <div className="flex items-center space-x-2 px-4 py-2 text-muted">
      <span className="animate-bounce">•</span>
      <span className="animate-bounce [animation-delay:100ms]">•</span>
      <span className="animate-bounce [animation-delay:200ms]">•</span>
    </div>
  );
}
