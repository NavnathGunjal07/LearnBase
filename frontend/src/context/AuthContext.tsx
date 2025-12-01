import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useRef,
} from "react";
import { useNavigate } from "react-router-dom";
import { authService, User } from "@/services/auth";
import { useToast } from "@/components/ui/use-toast";
import { handleError } from "@/utils/errorHandler";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  logout: () => void;
  isAuthenticated: () => boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  const hasCheckedAuth = useRef(false);

  // Check for existing session on initial load
  useEffect(() => {
    if (hasCheckedAuth.current) return;
    hasCheckedAuth.current = true;

    const checkAuth = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        handleError(error, "Check Authentication");
        // No valid token or user not found
        localStorage.removeItem("token");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Refresh user data (called after WebSocket auth)
  const refreshUser = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      handleError(error, "Refresh User");
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    toast({
      title: "✓ Logged out",
      description: "You have been logged out successfully",
    });
    navigate("/auth");
  };

  const isAuthenticated = () => authService.isAuthenticated();

  const value = {
    user,
    isLoading,
    logout,
    isAuthenticated,
    refreshUser,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--bg-default)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[var(--border-default)] border-t-[var(--accent)] rounded-full animate-spin" />
          <p className="text-[var(--fg-muted)] text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
