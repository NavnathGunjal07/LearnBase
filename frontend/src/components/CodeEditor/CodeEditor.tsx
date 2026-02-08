import { useEffect, useMemo, useState } from "react";

interface CodeEditorProps {
  onRunCode?: (code: string) => void;
  onExecutionResult?: (result: any) => void;
  initialCode?: string;
  className?: string;
  language?: string;
  showHeader?: boolean;
  theme?: "light" | "dark";
}

interface VibeAnalysis {
  summary: string;
  suggestions: string[];
  mistakes: string[];
}

const maxSuggestions = 5;
const maxMistakes = 5;

const analyzeCode = (
  code: string,
  language: string,
  executionResult?: any
): VibeAnalysis => {
  const suggestions = new Set<string>();
  const mistakes = new Set<string>();
  const trimmed = code.trim();

  if (!trimmed) {
    suggestions.add("Start by outlining a plan in comments before coding.");
    suggestions.add("Add a small test case to validate your approach.");
  }

  if (/\b(TODO|FIXME)\b/i.test(code)) {
    mistakes.add("You still have TODO/FIXME markers in the code.");
  }

  if (/\b(console\.log|print)\(/.test(code)) {
    suggestions.add("Remove debug logging before final submission.");
  }

  const longLines = code
    .split("\n")
    .filter((line) => line.length > 120).length;
  if (longLines > 0) {
    suggestions.add(
      `Break up ${longLines} long line${longLines > 1 ? "s" : ""} for readability.`
    );
  }

  const bracketPairs: Array<[string, string]> = [
    ["(", ")"],
    ["{", "}"],
    ["[", "]"],
  ];
  const stack: string[] = [];
  const openers = new Set(bracketPairs.map(([open]) => open));
  const closerMap = new Map(bracketPairs.map(([open, close]) => [close, open]));
  for (const char of code) {
    if (openers.has(char)) {
      stack.push(char);
    } else if (closerMap.has(char)) {
      const expected = closerMap.get(char);
      const last = stack.pop();
      if (last !== expected) {
        mistakes.add("Unmatched or misordered brackets detected.");
        break;
      }
    }
  }
  if (stack.length > 0) {
    mistakes.add("Unclosed brackets detected.");
  }

  if (/\bvar\s+/.test(code) && /javascript|typescript/i.test(language)) {
    suggestions.add("Prefer let/const over var for clearer scoping.");
  }

  if (/==\s*None/.test(code) && /python/i.test(language)) {
    suggestions.add("Use 'is None' instead of '== None' in Python.");
  }

  if (executionResult?.stderr || executionResult?.exception) {
    const rawError = executionResult.stderr || executionResult.exception;
    const firstLine = String(rawError).split("\n")[0];
    mistakes.add(`Runtime error detected: ${firstLine}`);
  }

  const summary = !trimmed
    ? "Warm start: add a plan and iterate in small steps."
    : "Keep iterating. Fix the flagged issues and rerun the code.";

  return {
    summary,
    suggestions: Array.from(suggestions).slice(0, maxSuggestions),
    mistakes: Array.from(mistakes).slice(0, maxMistakes),
  };
};

export default function CodeEditor({
  onRunCode,
  onExecutionResult,
  initialCode = "",
  className = "",
  language = "python",
  showHeader = true,
  theme = "dark",
}: CodeEditorProps) {
  const [analysis, setAnalysis] = useState<VibeAnalysis>(() =>
    analyzeCode(initialCode, language)
  );

  useEffect(() => {
    setAnalysis(analyzeCode(initialCode, language));
  }, [initialCode, language]);

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

        if (e.data.files && e.data.files.length > 0) {
          const content = e.data.files[0].content || "";
          setAnalysis(analyzeCode(content, language, e.data));
          if (onRunCode) {
            onRunCode(content);
          }
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

  const analysisTitle = useMemo(
    () =>
      analysis.mistakes.length > 0
        ? "Needs attention"
        : "Clean run vibe",
    [analysis.mistakes.length]
  );

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
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
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
        <aside className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-[var(--border-default)] bg-[var(--bg-elevated)] p-4 flex flex-col gap-4">
          <div>
            <div className="text-xs uppercase tracking-wide text-[var(--fg-muted)]">
              Vibe Coding
            </div>
            <div className="text-lg font-semibold text-[var(--fg-default)]">
              {analysisTitle}
            </div>
            <p className="text-sm text-[var(--fg-muted)] mt-1">
              {analysis.summary}
            </p>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-semibold text-[var(--fg-default)]">
              Suggestions
            </div>
            {analysis.suggestions.length === 0 ? (
              <p className="text-sm text-[var(--fg-muted)]">
                You are in flow. Keep refining with tests.
              </p>
            ) : (
              <ul className="space-y-2">
                {analysis.suggestions.map((item) => (
                  <li
                    key={item}
                    className="text-sm text-[var(--fg-default)] bg-[var(--bg-input)] border border-[var(--border-default)] rounded-md px-3 py-2"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="space-y-2">
            <div className="text-sm font-semibold text-[var(--fg-default)]">
              Mistakes
            </div>
            {analysis.mistakes.length === 0 ? (
              <p className="text-sm text-green-600 dark:text-green-400">
                No obvious issues detected.
              </p>
            ) : (
              <ul className="space-y-2">
                {analysis.mistakes.map((item) => (
                  <li
                    key={item}
                    className="text-sm text-red-600 dark:text-red-400 bg-[var(--bg-input)] border border-red-200 dark:border-red-900/40 rounded-md px-3 py-2"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
