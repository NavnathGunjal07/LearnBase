import { useEffect } from "react";
import ChatContainer from "../components/Chat/ChatContainer";
import { useChat } from "../hooks/useChat";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { handleError } from "@/utils/errorHandler";

export default function AuthPage() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const handleAuthenticated = async (token: string, user: any) => {
    try {
      console.log("✅ Authentication callback triggered");

      // Store token in localStorage
      localStorage.setItem("token", token);

      // Refresh user in context
      await refreshUser();

      // Redirect to home
      navigate("/home");
    } catch (error) {
      handleError(error, "Authentication Handler");
      console.error("❌ Authentication failed:", error);
    }
  };

  // Handle URL params from Google Auth redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const userId = params.get("userId");

    if (token) {
      // Create a minimal user object since we'll fetch full profile in handleAuthenticated
      handleAuthenticated(token, { id: userId });
    }
  }, []);

  const chatHook = useChat(true, handleAuthenticated);

  return (
    <div className="h-screen bg-[var(--bg-default)]">
      <ChatContainer chatHook={chatHook} isAuthMode={true} />
    </div>
  );
}
