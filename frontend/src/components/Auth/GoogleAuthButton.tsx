import { FC } from "react";

export const GoogleAuthButton: FC<{ className?: string }> = ({ className }) => {
  const handleGoogleLogin = () => {
    // Redirect to backend Google Auth route
    window.location.href = `${import.meta.env.VITE_API_BASE_URL}/auth/google`;
  };

  return (
    <button
      onClick={handleGoogleLogin}
      className={`flex items-center justify-center gap-3 w-full bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-700 border border-gray-300 dark:border-zinc-700 font-medium py-3 px-4 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md ${className}`}
    >
      <img
        src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
        alt="Google"
        className="w-5 h-5"
      />
      <span>Continue with Google</span>
    </button>
  );
};
