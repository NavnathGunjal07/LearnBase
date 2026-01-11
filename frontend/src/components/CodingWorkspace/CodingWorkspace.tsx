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
  const [lastExecutionResult, setLastExecutionResult] = useState<any>(
    initialExecutionResult
  );

  // Switch to console on result
  const handleExecutionResult = (result: any) => {
    setLastExecutionResult(result);
    setActiveTab("console");
    if (isLeftPanelCollapsed) setIsLeftPanelCollapsed(false);
    // You might want to parse 'result' here to match your expected 'executionResult' shape
    // OneCompiler 'result' object vs your app's internal 'executionResult' shape might differ.
    // Ideally update the state or call a parent handler if you want to save it.
  };

  useEffect(() => {
    if (initialExecutionResult) {
      setLastExecutionResult(initialExecutionResult);
    }
  }, [initialExecutionResult]);

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
                  {!lastExecutionResult ? (
                    <div className="text-center text-gray-500 py-10 flex flex-col items-center gap-2">
                      <Terminal className="w-8 h-8 opacity-20" />
                      <span className="italic">
                        Run your code to see output
                      </span>
                    </div>
                  ) : (
                    <div className="font-mono text-sm">
                      {/* Raw output display for now - can be enhanced to parse test results if OneCompiler returns them structured */}
                      <div className="whitespace-pre-wrap text-gray-800">
                        {lastExecutionResult.stdout ||
                          lastExecutionResult.result?.output ||
                          "No output"}
                      </div>
                      {lastExecutionResult.stderr && (
                        <div className="mt-2 text-red-600 whitespace-pre-wrap border-t pt-2">
                          {lastExecutionResult.stderr}
                        </div>
                      )}
                      {lastExecutionResult.exception && (
                        <div className="mt-2 text-red-600 whitespace-pre-wrap border-t pt-2">
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
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1">
            <CodeEditor
              initialCode={challenge.starterCode || ""}
              language={challenge.language || "python"}
              onExecutionResult={handleExecutionResult}
              showHeader={false} // CodingWorkspace has its own header
              className="border-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
