import { useAuth } from "../context/AuthContext";
import LoginPage from "../components/Auth/Login";
import RegisterPage from "../components/Auth/Register";
import {useState} from "react"

const AuthWrapper = () => {
  const { user } = useAuth();
  const [showRegister, setShowRegister] = useState(false); // toggle between login/register

  if (user) return null; // user is logged in, render dashboard elsewhere

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      {showRegister ? (
        <>
          <RegisterPage />
          <p className="mt-2 text-sm text-gray-500">
            Already have an account?{" "}
            <button
              onClick={() => setShowRegister(false)}
              className="text-blue-500 underline"
            >
              Login
            </button>
          </p>
        </>
      ) : (
        <>
          <LoginPage />
          <p className="mt-2 text-sm text-gray-500">
            Don’t have an account?{" "}
            <button
              onClick={() => setShowRegister(true)}
              className="text-blue-500 underline"
            >
              Register
            </button>
          </p>
        </>
      )}
    </div>
  );
};

export default AuthWrapper;
