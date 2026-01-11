import { useState, useEffect } from "react";
import {
  X,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Terminal,
} from "lucide-react";
import CodeEditor from "../CodeEditor/CodeEditor";

interface CodingWorkspaceProps {
  isOpen: boolean;
  challenge: any;
  executionResult: any;
  onClose: () => void;
  onRunCode: (code: string, language: string) => void;
  viewMode: "fullscreen" | "split";
  onToggleViewMode: () => void;
}

export const CodingWorkspace = ({
  isOpen,
  challenge,
  executionResult: initialExecutionResult, // Use this if provided initially, but we mostly track local runs
  onClose,
  viewMode,
  onToggleViewMode,
}: CodingWorkspaceProps) => {
  const [activeTab, setActiveTab] = useState<"problem" | "console">("problem");
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false);
  const [activeMobileSection, setActiveMobileSection] = useState<
    "info" | "code"
  >("info");
  const [lastExecutionResult, setLastExecutionResult] = useState<any>(
    initialExecutionResult
  );

  // Switch to console on result
  const handleExecutionResult = (result: any) => {
    setLastExecutionResult(result);
    setActiveTab("console");
    if (isLeftPanelCollapsed) setIsLeftPanelCollapsed(false);
    // Auto-switch to info view on mobile to see the console
    if (window.innerWidth < 768) {
      setActiveMobileSection("info");
    }
  };

  useEffect(() => {
    if (initialExecutionResult) {
      setLastExecutionResult(initialExecutionResult);
    }
  }, [initialExecutionResult]);

  if (!isOpen || !challenge) return null;

  return (
    <div
      className={`bg-[var(--bg-default)] flex flex-col animate-fade-in transition-all duration-300 ${
        viewMode === "fullscreen"
          ? "fixed inset-0 z-[100]"
          : "relative w-full h-full border-l border-[var(--border-default)]"
      }`}
    >
      {/* Header */}
      <div className="h-14 border-b border-[var(--border-default)] flex items-center justify-between px-4 bg-[var(--bg-elevated)] flex-shrink-0 gap-4">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="bg-orange-50 dark:bg-orange-900/20 text-[var(--accent)] p-1.5 rounded-lg flex-shrink-0">
            <Terminal className="w-4 h-4" />
          </div>
          <h2 className="font-semibold text-[var(--fg-default)] line-clamp-1 truncate">
            {challenge.title || "Coding Challenge"}
          </h2>
        </div>

        {/* Mobile View Toggle */}
        <div className="flex md:hidden bg-[var(--bg-input)] rounded-lg p-1">
          <button
            onClick={() => setActiveMobileSection("info")}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              activeMobileSection === "info"
                ? "bg-[var(--bg-elevated)] text-[var(--fg-default)] shadow-sm"
                : "text-[var(--fg-muted)]"
            }`}
          >
            Info
          </button>
          <button
            onClick={() => setActiveMobileSection("code")}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              activeMobileSection === "code"
                ? "bg-[var(--bg-elevated)] text-[var(--fg-default)] shadow-sm"
                : "text-[var(--fg-muted)]"
            }`}
          >
            Code
          </button>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onToggleViewMode}
            className="hidden md:block p-2 hover:bg-[var(--bg-input)] rounded-md transition-colors text-[var(--fg-muted)]"
            title={
              viewMode === "split"
                ? "Maximize (Full Screen)"
                : "Minimize (Split View)"
            }
          >
            {viewMode === "split" ? (
              <Maximize2 className="w-5 h-5" />
            ) : (
              <Minimize2 className="w-5 h-5" />
            )}
          </button>

          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--bg-input)] rounded-md transition-colors text-[var(--fg-muted)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Left: Problem & Output */}
        <div
          className={`
            flex flex-col bg-[var(--bg-default)] border-r border-[var(--border-default)] transition-all duration-300 relative
            ${
              // Mobile visibility
              activeMobileSection === "info" ? "w-full" : "hidden"
            }
            ${
              // Desktop visibility & sizing
              "md:flex md:w-[40%]"
            }
            ${
              // Collapse state (desktop only)
              isLeftPanelCollapsed
                ? "md:w-0 md:opacity-0 md:invisible"
                : "md:opacity-100 md:visible"
            }
          `}
        >
          {/* Collapse Toggle Button (Desktop Only) */}
          <button
            onClick={() => setIsLeftPanelCollapsed(!isLeftPanelCollapsed)}
            className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-full p-1 shadow-md hover:bg-[var(--bg-input)] text-[var(--fg-muted)]"
            title={isLeftPanelCollapsed ? "Expand Panel" : "Collapse Panel"}
          >
            {isLeftPanelCollapsed ? (
              <ChevronRight size={14} />
            ) : (
              <ChevronLeft size={14} />
            )}
          </button>

          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex border-b border-[var(--border-default)] bg-[var(--bg-elevated)]">
              <button
                onClick={() => setActiveTab("problem")}
                className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${
                  activeTab === "problem"
                    ? "border-[var(--accent)] text-[var(--accent)]"
                    : "border-transparent text-[var(--fg-muted)] hover:text-[var(--fg-default)]"
                }`}
              >
                <FileText className="w-4 h-4" />
                Problem
              </button>
              <button
                onClick={() => setActiveTab("console")}
                className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${
                  activeTab === "console"
                    ? "border-[var(--accent)] text-[var(--accent)]"
                    : "border-transparent text-[var(--fg-muted)] hover:text-[var(--fg-default)]"
                }`}
              >
                <Terminal className="w-4 h-4" />
                Console
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {activeTab === "problem" ? (
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <h3 className="text-lg font-bold text-[var(--fg-default)] mb-2">
                    {challenge.title}
                  </h3>
                  <div className="text-[var(--fg-default)] leading-relaxed mb-6 whitespace-pre-wrap">
                    {challenge.description}
                  </div>

                  <h4 className="font-semibold text-[var(--fg-default)] mb-3">
                    Test Cases:
                  </h4>
                  <div className="space-y-3">
                    {challenge.testCases?.map((tc: any, i: number) => (
                      <div
                        key={i}
                        className="bg-[var(--bg-input)] p-3 rounded-lg border border-[var(--border-default)] shadow-sm text-xs font-mono"
                      >
                        <div className="text-[var(--fg-muted)] mb-1">
                          Input:{" "}
                          <span className="text-[var(--fg-default)] select-all">
                            {tc.input}
                          </span>
                        </div>
                        <div className="text-[var(--fg-muted)]">
                          Expected:{" "}
                          <span className="text-green-600 dark:text-green-400 font-semibold select-all">
                            {tc.expected}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {!lastExecutionResult ? (
                    <div className="text-center text-[var(--fg-muted)] py-10 flex flex-col items-center gap-2">
                      <Terminal className="w-8 h-8 opacity-20" />
                      <span className="italic">
                        Run your code to see output
                      </span>
                    </div>
                  ) : (
                    <div className="font-mono text-sm">
                      {/* Raw output display for now */}
                      <div className="whitespace-pre-wrap text-[var(--fg-default)]">
                        {lastExecutionResult.stdout ||
                          lastExecutionResult.result?.output ||
                          "No output"}
                      </div>
                      {lastExecutionResult.stderr && (
                        <div className="mt-2 text-red-600 dark:text-red-400 whitespace-pre-wrap border-t border-[var(--border-default)] pt-2">
                          {lastExecutionResult.stderr}
                        </div>
                      )}
                      {lastExecutionResult.exception && (
                        <div className="mt-2 text-red-600 dark:text-red-400 whitespace-pre-wrap border-t border-[var(--border-default)] pt-2">
                          {lastExecutionResult.exception}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Editor */}
        <div
          className={`
            flex-col min-w-0
            ${
              // Mobile visibility
              activeMobileSection === "code" ? "flex w-full" : "hidden"
            }
            ${
              // Desktop visibility
              "md:flex md:flex-1"
            }
          `}
        >
          <div className="flex-1 flex flex-col">
            <CodeEditor
              initialCode={challenge.starterCode || ""}
              language={challenge.language || "python"}
              onExecutionResult={handleExecutionResult}
              showHeader={false} // CodingWorkspace has its own header
              className="border-none flex-1"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
