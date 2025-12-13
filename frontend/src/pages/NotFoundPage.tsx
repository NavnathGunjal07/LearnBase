import { useEffect } from "react";

export const NotFoundPage = () => {
  useEffect(() => {
    window.open("https://www.youtube.com/watch?v=dQw4w9WgXcQ", "_blank");
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--bg-default)] text-[var(--fg-default)] p-4">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">404</h1>
        <h2 className="text-2xl font-semibold">Page Not Found</h2>
        <p className="text-[var(--fg-muted)]">
          The page you are looking for does not exist.
        </p>
        <div className="pt-4">
          <a
            href="/"
            className="px-4 py-2 bg-[var(--accent)] text-white rounded hover:opacity-90 transition-opacity"
          >
            Go back home
          </a>
        </div>
      </div>
    </div>
  );
};
