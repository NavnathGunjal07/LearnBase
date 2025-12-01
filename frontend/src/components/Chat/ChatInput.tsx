import { useState, useEffect, useRef } from "react";
import { ChevronDown, Check, X } from "lucide-react";

interface ChatInputProps {
  onSend: (msg: string) => void;
  placeholder?: string;
  inputType?: "text" | "email" | "password" | "select";
  options?: string[];
  suggestions?: string[];
}

export default function ChatInput({
  onSend,
  placeholder,
  inputType = "text",
  options = [],
  suggestions = [],
}: ChatInputProps) {
  const [input, setInput] = useState("");
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Reset state when inputType changes
    setInput("");
    setSelectedOptions([]);
    setIsDropdownOpen(false);
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
    } else {
      if (!input.trim()) return;
      onSend(input);
      setInput("");
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
            {options.map((option) => (
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

  return (
    <div className="flex flex-col gap-2 w-full">
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
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl shadow-sm w-full"
      >
        <input
          type={inputType}
          className="flex-1 bg-transparent text-gray-900 px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-md"
          placeholder={placeholder || "Message LearnBase..."}
          value={input}
          onChange={(e) => setInput(e.target.value)}
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
