import { useState, useEffect, useRef } from "react";
import { ChevronDown, Check, X, Play } from "lucide-react";
import { APP_NAME } from "@/utils/constants";
import ChatCodeEditor from "./ChatCodeEditor";

interface ChatInputProps {
  onSend: (msg: string, mode?: "chat" | "visualizer") => void;
  placeholder?: string;
  inputType?: "text" | "email" | "password" | "select" | "code";
  options?: string[];
  suggestions?: string[];
  language?: string;
  visualizerData?: any;
  onVisualizerClick?: () => void;
  isGeneratingVisualizer?: boolean;
  hideModeSwitcher?: boolean;
}

export default function ChatInput({
  onSend,
  placeholder,
  inputType = "text",
  options = [],
  suggestions = [],
  language = "javascript",
  visualizerData,
  onVisualizerClick,
  isGeneratingVisualizer = false,
  hideModeSwitcher = false,
}: ChatInputProps) {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"chat" | "visualizer">("chat");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Reset state when inputType changes
    setInput("");
    setValidationError(null);
    setSelectedOptions([]);
    setIsDropdownOpen(false);
    setSearchTerm("");
  }, [inputType]);

  useEffect(() => {
    // Close dropdown when clicking outside
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputType === "select") {
      if (selectedOptions.length === 0) return;
      onSend(selectedOptions.join(", "));
      setSelectedOptions([]);
      setIsDropdownOpen(false);
    } else if (inputType === "code") {
      if (!input.trim()) return;
      // Prefix with CODE_EXECUTION_REQUEST: for the backend to recognize it
      onSend(`CODE_EXECUTION_REQUEST:\n${input}`);
      setInput("");
    } else {
      if (!input.trim()) return;

      if (inputType === "email") {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(input)) {
          setValidationError("Please enter a valid email address");
          return;
        }
      }

      onSend(input, mode);
      setInput("");
      setValidationError(null);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  const toggleOption = (option: string) => {
    setSelectedOptions((prev) =>
      prev.includes(option)
        ? prev.filter((item) => item !== option)
        : [...prev, option]
    );
  };

  const removeOption = (option: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedOptions((prev) => prev.filter((item) => item !== option));
  };

  if (inputType === "select") {
    return (
      <div className="w-full relative" ref={dropdownRef}>
        <div
          className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl shadow-sm cursor-pointer min-h-[50px]"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          <div className="flex-1 flex flex-wrap gap-2">
            {selectedOptions.length === 0 ? (
              <span className="text-gray-500">Select options...</span>
            ) : (
              selectedOptions.map((option) => (
                <span
                  key={option}
                  className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex items-center gap-1"
                >
                  {option}
                  <X
                    className="w-3 h-3 cursor-pointer hover:text-blue-600"
                    onClick={(e) => removeOption(option, e)}
                  />
                </span>
              ))
            )}
          </div>
          <ChevronDown
            className={`w-5 h-5 text-gray-400 transition-transform ${
              isDropdownOpen ? "rotate-180" : ""
            }`}
          />
        </div>

        {isDropdownOpen && (
          <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto z-50 p-2">
            {/* Search Input */}
            <div className="sticky top-0 bg-white pb-2 border-b border-gray-100 mb-1">
              <input
                type="text"
                autoFocus
                placeholder="Search interests..."
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            {options
              .filter((opt) =>
                opt.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((option) => (
                <div
                  key={option}
                  className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                    selectedOptions.includes(option)
                      ? "bg-blue-50 text-blue-700"
                      : "hover:bg-gray-50 text-gray-700"
                  }`}
                  onClick={() => toggleOption(option)}
                >
                  <span>{option}</span>
                  {selectedOptions.includes(option) && (
                    <Check className="w-4 h-4 text-blue-600" />
                  )}
                </div>
              ))}
            {options.filter((opt) =>
              opt.toLowerCase().includes(searchTerm.toLowerCase())
            ).length === 0 && (
              <div className="p-4 text-center text-gray-400 text-sm">
                No matches found
              </div>
            )}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={selectedOptions.length === 0}
          className={`absolute right-2 bottom-2 top-2 px-4 rounded-lg text-sm font-medium transition-colors ${
            selectedOptions.length > 0
              ? "bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}
          style={{
            position: "absolute",
            right: "12px",
            top: "50%",
            transform: "translateY(-50%)",
            height: "36px",
          }}
        >
          Send
        </button>
      </div>
    );
  }

  if (inputType === "code") {
    return (
      <div className="flex flex-col gap-2 w-full relative">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200">
            <span className="text-xs font-medium text-gray-500 uppercase">
              {language} Editor
            </span>
            <button
              onClick={handleSubmit}
              disabled={!input.trim()}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                input.trim()
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              <Play className="w-3 h-3" />
              Run Code
            </button>
          </div>
          <ChatCodeEditor
            value={input}
            onChange={setInput}
            language={language}
            className="border-0 rounded-none h-[150px] sm:h-[200px]"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 w-full relative">
      {validationError && (
        <div className="absolute bottom-full left-0 mb-2 px-3 py-1.5 bg-red-50 text-red-600 text-xs font-medium rounded-lg border border-red-100 shadow-sm animate-in fade-in slide-in-from-bottom-1 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
          {validationError}
        </div>
      )}
      {isGeneratingVisualizer && (
        <div className="flex justify-center mb-2 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 text-sm font-medium rounded-full shadow-sm">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span>Generating visualization...</span>
          </div>
        </div>
      )}
      {!isGeneratingVisualizer && visualizerData && (
        <div className="flex justify-center mb-2 animate-in fade-in slide-in-from-bottom-2">
          <button
            onClick={onVisualizerClick}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
          >
            <span>✨</span>
            <span>View Visualization</span>
          </button>
        </div>
      )}
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2 px-1">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="px-3 py-1.5 bg-blue-50 text-blue-600 text-xs font-medium rounded-full hover:bg-blue-100 transition-colors border border-blue-100 cursor-pointer"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Tool Selector - Hidden during onboarding */}
      {!hideModeSwitcher && (
        <div className="flex gap-2 px-1">
          <button
            type="button"
            onClick={() => setMode("chat")}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors border ${
              mode === "chat"
                ? "bg-blue-100 text-blue-700 border-blue-200"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            }`}
          >
            💬 Chat
          </button>
          <button
            type="button"
            onClick={() => setMode("visualizer")}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors border ${
              mode === "visualizer"
                ? "bg-purple-100 text-purple-700 border-purple-200"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            }`}
          >
            ✨ Visualizer
          </button>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-white border border-gray-200 rounded-xl shadow-sm w-full"
      >
        <input
          type={inputType}
          className="flex-1 bg-transparent text-gray-900 px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-md"
          placeholder={
            placeholder ||
            (mode === "visualizer"
              ? "Describe what to visualize..."
              : `Message ${APP_NAME}...`)
          }
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            if (validationError) setValidationError(null);
          }}
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            input.trim()
              ? "bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}
        >
          Send
        </button>
      </form>
    </div>
  );
}
