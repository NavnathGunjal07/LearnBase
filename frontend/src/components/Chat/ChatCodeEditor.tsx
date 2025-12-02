import Editor from "@monaco-editor/react";
import { useRef, useEffect } from "react";

interface ChatCodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  className?: string;
}

export default function ChatCodeEditor({
  value,
  onChange,
  language = "javascript",
  className = "",
}: ChatCodeEditorProps) {
  const editorRef = useRef<any>(null);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;

    // Configure Monaco for JavaScript/TypeScript if needed
    if (language === "javascript" || language === "typescript") {
      monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
        target: monaco.languages.typescript.ScriptTarget.Latest,
        allowNonTsExtensions: true,
        lib: ["es2020"],
      });
    }
  };

  // Update editor value if prop changes externally (though usually controlled by internal state in parent)
  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.getValue()) {
      editorRef.current.setValue(value);
    }
  }, [value]);

  return (
    <div
      className={`w-full h-[200px] border border-gray-200 rounded-lg overflow-hidden ${className}`}
    >
      <Editor
        height="100%"
        defaultLanguage={language}
        language={language}
        value={value}
        onChange={(value) => onChange(value || "")}
        onMount={handleEditorDidMount}
        theme="vs-light"
        options={{
          minimap: { enabled: false },
          fontSize: 13,
          lineHeight: 20,
          padding: { top: 8, bottom: 8 },
          scrollBeyondLastLine: false,
          wordWrap: "on",
          automaticLayout: true,
          tabSize: 2,
          insertSpaces: true,
          lineNumbers: "off", // Cleaner look for chat input
          glyphMargin: false,
          folding: false,
          overviewRulerBorder: false,
          renderLineHighlight: "none",
        }}
      />
    </div>
  );
}
