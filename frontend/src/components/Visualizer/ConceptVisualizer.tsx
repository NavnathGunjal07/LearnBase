import { useState, useEffect, useRef } from "react";
import { X, Maximize2, Minimize2, Code, Eye } from "lucide-react";
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
  const [isExpanded, setIsExpanded] = useState(false);
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
      className={`fixed bottom-4 right-4 bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl rounded-xl overflow-hidden transition-all duration-300 ease-in-out z-50 flex flex-col ${
        isExpanded
          ? "w-[90vw] h-[90vh] bottom-[5vh] right-[5vw]"
          : "w-[450px] h-[350px]"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-black/20 border-b border-white/10 cursor-move">
        <div className="flex items-center gap-2">
          <span className="text-white font-semibold text-sm">
            ✨ Concept Visualizer
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-md transition"
            title={isExpanded ? "Minimize" : "Maximize"}
          >
            {isExpanded ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-red-400 hover:bg-white/10 rounded-md transition"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center px-2 pt-2 gap-1 bg-black/10">
        <button
          onClick={() => setActiveTab("preview")}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-t-md transition-colors ${
            activeTab === "preview"
              ? "bg-white/10 text-white"
              : "text-white/50 hover:text-white/80 hover:bg-white/5"
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          Preview
        </button>
        <button
          onClick={() => setActiveTab("code")}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-t-md transition-colors ${
            activeTab === "code"
              ? "bg-white/10 text-white"
              : "text-white/50 hover:text-white/80 hover:bg-white/5"
          }`}
        >
          <Code className="w-3.5 h-3.5" />
          Source
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 relative bg-white">
        {activeTab === "preview" ? (
          <iframe
            ref={iframeRef}
            title="Visualizer Preview"
            srcDoc={srcDoc}
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin allow-modals allow-popups allow-forms"
          />
        ) : (
          <div className="absolute inset-0 overflow-auto bg-[#1e1e1e] text-white p-4 font-mono text-xs">
            <div className="mb-4">
              <h3 className="text-blue-400 font-bold mb-1">HTML</h3>
              <pre className="bg-black/30 p-2 rounded border border-white/10 whitespace-pre-wrap">
                {html}
              </pre>
            </div>
            <div className="mb-4">
              <h3 className="text-yellow-400 font-bold mb-1">CSS</h3>
              <pre className="bg-black/30 p-2 rounded border border-white/10 whitespace-pre-wrap">
                {css}
              </pre>
            </div>
            <div>
              <h3 className="text-green-400 font-bold mb-1">JS</h3>
              <pre className="bg-black/30 p-2 rounded border border-white/10 whitespace-pre-wrap">
                {js}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConceptVisualizer;
