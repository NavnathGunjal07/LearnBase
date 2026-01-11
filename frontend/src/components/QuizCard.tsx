import { useState } from "react";

interface QuizCardProps {
  question: string;
  options: string[];
  correctIndex: number;
  onAnswer: (selectedIndex: number) => void;
}

export const QuizCard = ({
  question,
  options,
  correctIndex,
  onAnswer,
}: QuizCardProps) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = () => {
    if (selectedIndex === null) return;
    setIsSubmitted(true);
    onAnswer(selectedIndex);
  };

  const getOptionStyles = (index: number) => {
    if (!isSubmitted) {
      // Hover and selection state before submission
      return selectedIndex === index
        ? "border-[var(--accent)] bg-orange-50 dark:bg-orange-900/20 ring-1 ring-[var(--accent)]"
        : "border-[var(--border-default)] hover:border-[var(--accent)] hover:bg-[var(--bg-input)]";
    }

    // Post-submission states
    if (index === correctIndex) {
      return "border-green-500 bg-green-50 dark:bg-green-900/20 ring-1 ring-green-500";
    }

    if (selectedIndex === index && selectedIndex !== correctIndex) {
      return "border-red-500 bg-red-50 dark:bg-red-900/20 ring-1 ring-red-500";
    }

    return "border-[var(--border-default)] opacity-60";
  };

  const getIconStyles = (index: number) => {
    if (!isSubmitted) {
      return selectedIndex === index
        ? "border-[var(--accent)] bg-[var(--accent)] text-white"
        : "border-[var(--border-default)] text-[var(--fg-muted)]";
    }

    if (index === correctIndex) {
      return "border-green-500 bg-green-500 text-white";
    }

    if (selectedIndex === index && selectedIndex !== correctIndex) {
      return "border-red-500 bg-red-500 text-white";
    }

    return "border-[var(--border-default)] text-[var(--fg-muted)]";
  };

  return (
    <div className="quiz-card-container my-4 w-full">
      <div className="bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="flex items-start gap-4 mb-4">
          <div className="flex-shrink-0 w-8 h-8 bg-orange-50 dark:bg-orange-900/20 text-[var(--accent)] rounded-lg flex items-center justify-center">
            <span className="text-lg">🎯</span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--accent)] uppercase tracking-wide mb-1">
              Quick Quiz
            </h3>
            <p className="text-[var(--fg-default)] font-medium text-base leading-relaxed">
              {question}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {options.map((option, index) => (
            <button
              key={index}
              onClick={() => !isSubmitted && setSelectedIndex(index)}
              disabled={isSubmitted}
              className={`
                w-full text-left px-4 py-3 rounded-lg border transition-all duration-200 flex items-center gap-3
                ${getOptionStyles(index)}
                ${isSubmitted ? "cursor-default" : "cursor-pointer"}
              `}
            >
              <div
                className={`
                  w-5 h-5 rounded-full border flex items-center justify-center transition-colors
                  ${getIconStyles(index)}
                `}
              >
                {isSubmitted ? (
                  index === correctIndex ? (
                    <span className="text-xs">✓</span>
                  ) : selectedIndex === index ? (
                    <span className="text-xs">✕</span>
                  ) : null
                ) : (
                  selectedIndex === index && (
                    <div className="w-2 h-2 bg-white rounded-full" />
                  )
                )}
              </div>
              <span
                className={`text-sm ${
                  isSubmitted && index === correctIndex
                    ? "font-medium text-green-700 dark:text-green-400"
                    : isSubmitted &&
                      selectedIndex === index &&
                      index !== correctIndex
                    ? "text-red-700 dark:text-red-400"
                    : "text-[var(--fg-default)]"
                }`}
              >
                {option}
              </span>
            </button>
          ))}
        </div>

        {!isSubmitted && (
          <button
            onClick={handleSubmit}
            disabled={selectedIndex === null}
            className={`
              mt-5 w-full py-2.5 rounded-lg font-medium text-sm transition-all duration-200
              ${
                selectedIndex !== null
                  ? "bg-[var(--accent)] text-white hover:opacity-90 shadow-sm hover:shadow"
                  : "bg-[var(--bg-input)] text-[var(--fg-muted)] cursor-not-allowed"
              }
            `}
          >
            Submit Answer
          </button>
        )}

        {isSubmitted && (
          <div
            className={`mt-4 text-center text-sm font-medium ${
              selectedIndex === correctIndex
                ? "text-green-600 dark:text-green-400"
                : "text-[var(--fg-muted)]"
            }`}
          >
            {selectedIndex === correctIndex ? (
              <span>🎉 Correct! Well done!</span>
            ) : (
              <span>
                👀 The correct answer is:{" "}
                <span className="text-green-600 dark:text-green-400 font-semibold">
                  {options[correctIndex]}
                </span>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
