import { useState, useEffect, useRef } from "react";
import { X, Code, Eye } from "lucide-react";
import { VisualizerData } from "../../hooks/useVisualizer";

interface ConceptVisualizerProps {
  isOpen: boolean;
  data: VisualizerData | null;
  onClose: () => void;
}

const ConceptVisualizer = ({
  isOpen,
  data,
  onClose,
}: ConceptVisualizerProps) => {
  const [activeTab, setActiveTab] = useState<"preview" | "code">("preview");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Reset state when data changes
  useEffect(() => {
    if (data && isOpen) {
      setActiveTab("preview");
    }
  }, [data, isOpen]);

  if (!isOpen || !data) return null;

  const { html, css, js, isSingleFile } = data;

  console.log(js);

  const srcDoc = isSingleFile
    ? html
    : `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { margin: 0; padding: 0; overflow: hidden; font-family: sans-serif; }
          /* User CSS */
          ${css}
        </style>
      </head>
      <body>
        ${html}
        <script>
          try {
            ${js}
          } catch (err) {
            console.error("Visualizer Error:", err);
            document.body.innerHTML += '<div style="color:red; padding:10px; background:#ffe6e6;">Runtime Error: ' + err.message + '</div>';
          }
        </script>
      </body>
    </html>
  `;

  console.log(srcDoc);

  return (
    <div
      className={`fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200`}
    >
      <div className="bg-[var(--bg-default)] w-full max-w-6xl h-[85vh] rounded-xl border border-[var(--border-default)] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="h-14 border-b border-[var(--border-default)] flex items-center justify-between px-4 bg-[var(--bg-elevated)] flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 p-1.5 rounded-lg">
              <Eye className="w-4 h-4" />
            </div>
            <h2 className="font-semibold text-[var(--fg-default)]">
              Concept Visualizer
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 hover:bg-[var(--bg-input)] rounded-md transition-colors text-[var(--fg-muted)]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs & Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex border-b border-[var(--border-default)] bg-[var(--bg-elevated)]">
            <button
              onClick={() => setActiveTab("preview")}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === "preview"
                  ? "border-purple-500 text-purple-600 dark:text-purple-400"
                  : "border-transparent text-[var(--fg-muted)] hover:text-[var(--fg-default)]"
              }`}
            >
              <Eye className="w-4 h-4" />
              Preview
            </button>
            <button
              onClick={() => setActiveTab("code")}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === "code"
                  ? "border-purple-500 text-purple-600 dark:text-purple-400"
                  : "border-transparent text-[var(--fg-muted)] hover:text-[var(--fg-default)]"
              }`}
            >
              <Code className="w-4 h-4" />
              Source Code
            </button>
          </div>

          <div className="flex-1 relative bg-[var(--bg-default)]">
            {activeTab === "preview" ? (
              <iframe
                ref={iframeRef}
                title="Visualizer Preview"
                srcDoc={srcDoc}
                className="w-full h-full border-0 bg-white"
                sandbox="allow-scripts allow-same-origin allow-modals allow-popups allow-forms"
              />
            ) : (
              <div className="absolute inset-0 overflow-auto bg-[#1e1e1e] text-white p-6 font-mono text-sm leading-relaxed">
                <div className="max-w-4xl mx-auto space-y-8">
                  <div>
                    <h3 className="text-blue-400 font-bold mb-3 flex items-center gap-2">
                      <span className="opacity-50">&lt;</span>
                      HTML
                      <span className="opacity-50">/&gt;</span>
                    </h3>
                    <pre className="bg-black/30 p-4 rounded-lg border border-white/10 whitespace-pre-wrap">
                      {html}
                    </pre>
                  </div>
                  {css && (
                    <div>
                      <h3 className="text-yellow-400 font-bold mb-3 flex items-center gap-2">
                        <span className="opacity-50">#</span>
                        CSS
                      </h3>
                      <pre className="bg-black/30 p-4 rounded-lg border border-white/10 whitespace-pre-wrap">
                        {css}
                      </pre>
                    </div>
                  )}
                  {js && (
                    <div>
                      <h3 className="text-green-400 font-bold mb-3 flex items-center gap-2">
                        <span className="opacity-50">function</span>
                        JS
                        <span className="opacity-50">()</span>
                      </h3>
                      <pre className="bg-black/30 p-4 rounded-lg border border-white/10 whitespace-pre-wrap">
                        {js}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConceptVisualizer;
