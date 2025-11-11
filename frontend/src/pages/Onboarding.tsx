import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import OnboardingChat from '../components/Onboarding/OnboardingChat';
import { useOnboarding } from '../hooks/useOnboarding';
import { useAuth } from '../context/AuthContext';

const Onboarding = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    messages,
    sendMessage,
    isTyping,
    isConnected,
    hasCompletedOnboarding,
    isLoading,
  } = useOnboarding();

  useEffect(() => {
    if (!isLoading && hasCompletedOnboarding) {
      // Redirect to home if onboarding is completed
      setTimeout(() => {
        navigate('/home', { replace: true });
      }, 2000); // Give user time to see completion message
    }
  }, [hasCompletedOnboarding, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (hasCompletedOnboarding) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-[var(--bg-default)] text-[var(--fg-default)]">
      <div className="flex h-dvh max-h-dvh">
        <div className="flex-1 flex flex-col max-w-6xl mx-auto w-full">
          <OnboardingChat
            messages={messages}
            sendMessage={sendMessage}
            isTyping={isTyping}
            isConnected={isConnected}
          />
        </div>
      </div>
    </div>
  );
};

export default Onboarding;

