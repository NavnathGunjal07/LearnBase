import Editor from "@monaco-editor/react";
import { useState, useEffect } from "react";
import {
  X,
  Play,
  Terminal,
  CheckCircle,
  XCircle,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  FileText,
} from "lucide-react";

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
  executionResult,
  onClose,
  onRunCode,
  viewMode,
  onToggleViewMode,
}: CodingWorkspaceProps) => {
  const [code, setCode] = useState(challenge?.starterCode || "");
  const [activeTab, setActiveTab] = useState<"problem" | "console">("problem");
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false);

  // Update code when challenge changes
  useEffect(() => {
    if (challenge?.starterCode) {
      setCode(challenge.starterCode);
    }
  }, [challenge]);

  // Switch to console on run
  useEffect(() => {
    if (executionResult?.status === "running") {
      setActiveTab("console");
      if (isLeftPanelCollapsed) setIsLeftPanelCollapsed(false);
    }
  }, [executionResult, isLeftPanelCollapsed]);

  if (!isOpen || !challenge) return null;

  return (
    <div
      className={`bg-white flex flex-col animate-fade-in transition-all duration-300 ${
        viewMode === "fullscreen"
          ? "fixed inset-0 z-[100]"
          : "relative w-full h-full border-l"
      }`}
    >
      {/* Header */}
      <div className="h-14 border-b flex items-center justify-between px-4 bg-gray-50 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-1.5 rounded-lg">
            <Terminal className="w-4 h-4 text-white" />
          </div>
          <h2 className="font-semibold text-gray-800 line-clamp-1">
            {challenge.title || "Coding Challenge"}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleViewMode}
            className="p-2 hover:bg-gray-200 rounded-md transition-colors text-gray-600"
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

          <div className="h-6 w-px bg-gray-300 mx-1" />

          <button
            onClick={() => onRunCode(code, challenge.language)}
            disabled={executionResult?.status === "running"}
            className="flex items-center gap-2 px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50"
          >
            <Play className="w-4 h-4" />
            <span className="hidden sm:inline">
              {executionResult?.status === "running" ? "Running..." : "Run"}
            </span>
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-md transition-colors text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Left: Problem & Output (Collapsible) */}
        <div
          className={`${
            isLeftPanelCollapsed ? "w-0" : "w-[40%]"
          } flex flex-col bg-gray-50 border-r transition-all duration-300 relative`}
        >
          {/* Collapse Toggle Button */}
          <button
            onClick={() => setIsLeftPanelCollapsed(!isLeftPanelCollapsed)}
            className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 bg-white border border-gray-200 rounded-full p-1 shadow-md hover:bg-gray-50 text-gray-500"
            title={isLeftPanelCollapsed ? "Expand Panel" : "Collapse Panel"}
          >
            {isLeftPanelCollapsed ? (
              <ChevronRight size={14} />
            ) : (
              <ChevronLeft size={14} />
            )}
          </button>

          <div
            className={`flex-1 flex flex-col overflow-hidden ${
              isLeftPanelCollapsed
                ? "opacity-0 invisible"
                : "opacity-100 visible"
            } transition-opacity duration-200`}
          >
            <div className="flex border-b bg-white">
              <button
                onClick={() => setActiveTab("problem")}
                className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${
                  activeTab === "problem"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <FileText className="w-4 h-4" />
                Problem
              </button>
              <button
                onClick={() => setActiveTab("console")}
                className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${
                  activeTab === "console"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <Terminal className="w-4 h-4" />
                Console
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {activeTab === "problem" ? (
                <div className="prose prose-sm max-w-none">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {challenge.title}
                  </h3>
                  <div className="text-gray-700 leading-relaxed mb-6 whitespace-pre-wrap">
                    {challenge.description}
                  </div>

                  <h4 className="font-semibold text-gray-900 mb-3">
                    Test Cases:
                  </h4>
                  <div className="space-y-3">
                    {challenge.testCases?.map((tc: any, i: number) => (
                      <div
                        key={i}
                        className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm text-xs font-mono"
                      >
                        <div className="text-gray-500 mb-1">
                          Input:{" "}
                          <span className="text-gray-900 select-all">
                            {tc.input}
                          </span>
                        </div>
                        <div className="text-gray-500">
                          Expected:{" "}
                          <span className="text-green-700 font-semibold select-all">
                            {tc.expected}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {!executionResult ? (
                    <div className="text-center text-gray-500 py-10 flex flex-col items-center gap-2">
                      <Terminal className="w-8 h-8 opacity-20" />
                      <span className="italic">
                        Run your code to see output
                      </span>
                    </div>
                  ) : (
                    <>
                      {executionResult.status === "error" && (
                        <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200 text-sm font-mono whitespace-pre-wrap">
                          <span className="font-bold">Error:</span>{" "}
                          {executionResult.error}
                        </div>
                      )}

                      {executionResult.result?.results?.map(
                        (res: any, i: number) => (
                          <div
                            key={i}
                            className={`p-4 rounded-lg border ${
                              res.passed
                                ? "bg-green-50 border-green-200"
                                : "bg-red-50 border-red-200"
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              {res.passed ? (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-600" />
                              )}
                              <span
                                className={`font-semibold text-sm ${
                                  res.passed ? "text-green-800" : "text-red-800"
                                }`}
                              >
                                Test Case {i + 1}
                              </span>
                            </div>
                            <div className="text-xs font-mono space-y-1 ml-6">
                              <div className="text-gray-600">
                                Input:{" "}
                                <span className="text-gray-900">
                                  {res.input}
                                </span>
                              </div>
                              <div className="text-gray-600">
                                Expected:{" "}
                                <span className="text-gray-900">
                                  {res.expected}
                                </span>
                              </div>
                              <div className="text-gray-600">
                                Actual:{" "}
                                <span
                                  className={`${
                                    res.passed
                                      ? "text-green-700"
                                      : "text-red-700"
                                  }`}
                                >
                                  {res.actual}
                                </span>
                              </div>
                              {res.consoleOutput && (
                                <div className="mt-2 pt-2 border-t border-gray-200 text-gray-500 whitespace-pre-wrap">
                                  <span className="font-semibold text-gray-400">
                                    Console:
                                  </span>{" "}
                                  {res.consoleOutput}
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      )}

                      {executionResult.result?.passedCount !== undefined && (
                        <div className="mt-4 p-3 bg-gray-100 rounded-lg text-center font-semibold text-gray-700">
                          Result: {executionResult.result.passedCount} /{" "}
                          {executionResult.result.totalCount} Passed
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Editor */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1">
            <Editor
              height="100%"
              defaultLanguage="javascript"
              language={challenge.language || "javascript"}
              value={code}
              onChange={(val) => setCode(val || "")}
              theme="vs-light"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                padding: { top: 16 },
                wordWrap: "on",
                automaticLayout: true,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
