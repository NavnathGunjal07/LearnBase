import { useState, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { Play, RotateCcw, Download } from 'lucide-react';

interface CodeEditorProps {
  onRunCode: (code: string) => void;
  initialCode?: string;
  className?: string;
}

export default function CodeEditor({ onRunCode, initialCode = '', className = '' }: CodeEditorProps) {
  const [code, setCode] = useState(initialCode);
  const [isRunning, setIsRunning] = useState(false);
  const editorRef = useRef<any>(null);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;

    // Configure Monaco for JavaScript
    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.Latest,
      allowNonTsExtensions: true,
      lib: ['es2020'],
    });
  };

  const handleRunCode = async () => {
    if (!code.trim()) return;

    setIsRunning(true);
    try {
      await onRunCode(code);
    } finally {
      setIsRunning(false);
    }
  };

  const handleReset = () => {
    setCode(initialCode);
    if (editorRef.current) {
      editorRef.current.setValue(initialCode);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'practice.js';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`w-full h-[500px] bg-white rounded-lg shadow-lg overflow-hidden flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
            <span className="text-yellow-600 font-mono text-sm">JS</span>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">JavaScript Practice</h2>
            <p className="text-sm text-gray-600">Write and run JavaScript code</p>
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          defaultLanguage="javascript"
          value={code}
          onChange={(value: string | undefined) => setCode(value || '')}
          onMount={handleEditorDidMount}
          theme="vs-light"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineHeight: 21,
            padding: { top: 16, bottom: 16 },
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            automaticLayout: true,
            tabSize: 2,
            insertSpaces: true,
          }}
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition"
            title="Reset code"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition"
            title="Download code"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRunCode}
            disabled={isRunning || !code.trim()}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition ${
              isRunning || !code.trim()
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700 focus:ring-2 focus:ring-green-500'
            }`}
          >
            {isRunning ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Run Code
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
