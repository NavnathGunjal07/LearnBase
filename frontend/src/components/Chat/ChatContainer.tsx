import { useEffect, useState, useRef } from 'react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import TypingIndicator from './TypingIndicator';
import CodeEditor from '../CodeEditor/CodeEditor';
import { Code, MessageSquare } from 'lucide-react';
import { useLearning } from '@/hooks/useLearning';


interface ChatContainerProps {
  chatHook: ReturnType<typeof import('../../hooks/useChat').useChat>;
}

export default function ChatContainer({ chatHook }: ChatContainerProps) {
  const { messages, sendMessage, isTyping, isConnected, sendTopicSelection } = chatHook;
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [executionResults, setExecutionResults] = useState<string[]>([]);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const hasLoadedSession = useRef(false);

  useEffect(() => {
    console.log('Messages:', messages);
  }, [messages]);

  // Auto-load last session on mount (only once)
  useEffect(() => {
    if (hasLoadedSession.current) return;
    hasLoadedSession.current = true;

    const loadLastSession = async () => {
      try {
        const { userService } = await import('@/api');
        const data = await userService.getLastSession();
        
        if (data.hasSession && data.topicId && data.topicName) {
          // Auto-resume last session
          await sendTopicSelection(
            data.topicName,
            data.subtopicName || '',
            data.topicId,
            data.subtopicId || undefined
          );
        }
        // If no session, topic selector will show automatically
      } catch (error) {
        console.error('Failed to load last session:', error);
      } finally {
        setIsLoadingSession(false);
      }
    };

    loadLastSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRunCode = async (code: string) => {
    try {
      // Here you would integrate with your backend API
      // For now, let's simulate code execution
      const result = `Executed: ${code.length} characters of code`;
      setExecutionResults(prev => [...prev, result]);

      // Send the result back to chat
      sendMessage(`Code execution result: ${result}`);
    } catch (error) {
      const errorMessage = `Error executing code: ${error}`;
      setExecutionResults(prev => [...prev, errorMessage]);
      sendMessage(errorMessage);
    }
  };

  const toggleCodeEditor = () => {
    setShowCodeEditor(!showCodeEditor);
  };

  // Show loading state while checking for last session
  if (isLoadingSession) {
    return (
      <div className="flex flex-col flex-1 overflow-hidden bg-gray-50">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your learning session...</p>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-gray-50">
      {/* Header with toggle button */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
        <h2 className="text-lg font-semibold text-gray-900">Chat</h2>
        <button
          onClick={toggleCodeEditor}
          className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition ${
            showCodeEditor
              ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {showCodeEditor ? <MessageSquare className="w-4 h-4" /> : <Code className="w-4 h-4" />}
          <span className="hidden sm:inline">{showCodeEditor ? 'Hide Editor' : 'Show Editor'}</span>
        </button>
      </div>

      {/* Connection Status */}
      {!isConnected && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 text-center">
          <span className="text-xs text-yellow-800">🔄 Connecting to chat server...</span>
        </div>
      )}

      {/* Code Editor or Chat Messages */}
      {showCodeEditor ? (
        <div className="flex-1 overflow-hidden">
          <CodeEditor onRunCode={handleRunCode} />
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50">
            <div className="w-full max-w-3xl mx-auto space-y-4 sm:space-y-6">
              {messages.map((msg, i) => (
                <ChatMessage key={i} message={msg} />
              ))}
              {isTyping && <TypingIndicator />}
            </div>
          </div>
          <div className="w-full flex justify-center px-4 sm:px-6 pb-[calc(1rem+env(safe-area-inset-bottom))] bg-gray-50">
            <div className="w-full max-w-3xl">
              <ChatInput onSend={sendMessage} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
