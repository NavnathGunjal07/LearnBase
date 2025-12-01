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
      console.log("🔑 Saving token:", token ? "present" : "missing");
      console.log("👤 User data:", user);

      // Store token in localStorage
      localStorage.setItem("token", token);
      console.log("💾 Token saved to localStorage");

      // Refresh user in context
      await refreshUser();
      console.log("🔄 User context refreshed");

      console.log("🚀 Navigating to /home");
      // Redirect to home
      navigate("/home");
    } catch (error) {
      handleError(error, "Authentication Handler");
      console.error("❌ Authentication failed:", error);
    }
  };

  const chatHook = useChat(true, handleAuthenticated);

  return (
    <div className="flex h-screen bg-[var(--bg-default)]">
      <ChatContainer chatHook={chatHook} isAuthMode={true} />
    </div>
  );
}
