import { useEffect } from "react";

interface CodeEditorProps {
  onRunCode?: (code: string) => void;
  onExecutionResult?: (result: any) => void;
  initialCode?: string;
  className?: string;
  language?: string;
  showHeader?: boolean;
  theme?: "light" | "dark";
}

export default function CodeEditor({
  onRunCode,
  onExecutionResult,
  initialCode = "",
  className = "",
  language = "python",
  showHeader = true,
  theme = "dark",
}: CodeEditorProps) {
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      // Verify origin if possible, but OneCompiler docs might not specify a strict one for embeds
      // if (e.origin !== "https://onecompiler.com") return;

      if (e.data && e.data.language) {
        console.log("OneCompiler Event:", e.data);

        if (onExecutionResult) {
          onExecutionResult(e.data);
        }

        // If there's a specific 'result' or 'stdout' in the data, extract it.
        // Based on typical OneCompiler embeds, e.data might contain 'result', 'stdout', 'stderr', etc.
        // For now, logging and storing the whole object to inspect structure.

        if (onRunCode && e.data.files && e.data.files.length > 0) {
          onRunCode(e.data.files[0].content);
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [onRunCode, onExecutionResult]);

  // Map our language names to OneCompiler's expected slugs if needed
  const getLanguageSlug = (lang: string) => {
    const map: Record<string, string> = {
      python: "python",
      javascript: "javascript",
      typescript: "typescript",
      java: "java",
      cpp: "cpp",
      c: "c",
    };
    return map[lang.toLowerCase()] || "python";
  };

  const embedUrl = `https://onecompiler.com/embed/${getLanguageSlug(
    language
  )}?code=${encodeURIComponent(
    initialCode
  )}&theme=${theme}&hideNew=true&hideTitle=true&hideSidebar=true`;

  return (
    <div
      className={`w-full h-full bg-[var(--bg-default)] flex flex-col ${className}`}
    >
      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-default)] bg-[var(--bg-elevated)] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-50 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
              <span className="text-[var(--accent)] font-mono text-sm uppercase">
                {getLanguageSlug(language).slice(0, 2)}
              </span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--fg-default)]">
                {language.charAt(0).toUpperCase() + language.slice(1)} Editor
              </h2>
              <p className="text-sm text-[var(--fg-muted)]">
                Powered by OneCompiler
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 relative">
        <iframe
          frameBorder="0"
          height="100%"
          src={embedUrl}
          width="100%"
          title="OneCompiler Editor"
          allow="clipboard-write" // Allow copy-paste inside iframe
        ></iframe>
      </div>
    </div>
  );
}
