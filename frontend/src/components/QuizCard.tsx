import { useState, useEffect } from "react";

interface Question {
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
  index: number;
}

interface QuizCardProps {
  questions: Question[];
  onAnswer: (
    allAnswers: Array<{
      questionIndex: number;
      questionText: string;
      selectedIndex: number;
    }>
  ) => void;
  userAnswers?: Array<{
    selectedIndex: number;
    isCorrect: boolean;
    isSkipped: boolean;
  }>;
}

export const QuizCard = ({
  questions,
  onAnswer, // For optional backend submission (not currently used with immediate feedback)
  userAnswers = [],
}: QuizCardProps) => {
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<(number | null)[]>(
    new Array(questions.length).fill(null)
  );
  // Local state for immediate feedback
  const [localAnswerFeedback, setLocalAnswerFeedback] = useState<
    Array<{ selectedIndex: number; isCorrect: boolean; isSkipped: boolean }>
  >([]);

  // Update selected answers from userAnswers prop (results from backend)
  useEffect(() => {
    if (userAnswers.length > 0) {
      const answers = questions.map((_, idx) =>
        userAnswers[idx] ? userAnswers[idx].selectedIndex : null
      );
      setSelectedAnswers(answers);
      // Also populate local feedback from backend results
      setLocalAnswerFeedback(userAnswers);
    }
  }, [userAnswers, questions]);

  // Handle answer selection - show immediate feedback
  const handleSelectOption = (optionIndex: number) => {
    if (selectedAnswers[activeQuestionIndex] !== null) return; // Already answered this question

    const newAnswers = [...selectedAnswers];
    newAnswers[activeQuestionIndex] = optionIndex;
    setSelectedAnswers(newAnswers);

    // Create immediate feedback for this answer
    const isCorrect = optionIndex === currentQuestion.correctIndex;
    const newFeedback = [...localAnswerFeedback];
    newFeedback[activeQuestionIndex] = {
      selectedIndex: optionIndex,
      isCorrect: isCorrect,
      isSkipped: false,
    };
    setLocalAnswerFeedback(newFeedback);
  };

  // Navigate between questions
  const goToQuestion = (index: number) => {
    if (index >= 0 && index < questions.length) {
      setActiveQuestionIndex(index);
    }
  };

  // Get current question and answer
  const currentQuestion = questions[activeQuestionIndex];
  // Check local feedback first (immediate), then submitted results
  const userAnswer =
    localAnswerFeedback[activeQuestionIndex] ||
    userAnswers[activeQuestionIndex];

  // Check if all questions have been answered
  const allQuestionsAnswered = selectedAnswers.every(
    (answer) => answer !== null
  );
  const isSubmitted = userAnswers.length > 0;

  // Handle quiz submission
  const handleSubmit = () => {
    if (allQuestionsAnswered && !isSubmitted) {
      // Create structured answer array with question mapping
      const structuredAnswers = questions.map((q, idx) => ({
        questionIndex: idx,
        questionText: q.question,
        selectedIndex: selectedAnswers[idx] ?? -1, // -1 for unanswered (should not happen due to allQuestionsAnswered check)
      }));
      onAnswer(structuredAnswers);
    }
  };

  const getOptionStyles = (idx: number) => {
    if (!userAnswer) {
      // Not yet submitted
      return selectedAnswers[activeQuestionIndex] === idx
        ? "border-[var(--accent)] bg-orange-50 dark:bg-orange-900/20 ring-1 ring-[var(--accent)]"
        : "border-[var(--border-default)] hover:border-[var(--accent)] hover:bg-[var(--bg-input)]";
    }

    // Submitted - show feedback
    if (idx === currentQuestion.correctIndex) {
      return "border-green-500 bg-green-50 dark:bg-green-900/20 ring-1 ring-green-500";
    }
    if (idx === userAnswer.selectedIndex && !userAnswer.isSkipped) {
      return "border-red-500 bg-red-50 dark:bg-red-900/20 ring-1 ring-red-500";
    }
    return "border-[var(--border-default)] opacity-60";
  };

  return (
    <div className="quiz-card-container my-4 w-full">
      <div className="bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
        {/* Header with Progress */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-orange-50 dark:bg-orange-900/20 text-[var(--accent)] rounded-lg flex items-center justify-center">
              <span className="text-lg">🎯</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--accent)] uppercase tracking-wide mb-1">
                Quick Quiz
              </h3>
              <p className="text-[var(--fg-default)] font-medium text-base leading-relaxed">
                {currentQuestion.question}
              </p>
            </div>
          </div>
          <div className="text-xs font-medium text-[var(--fg-muted)] whitespace-nowrap bg-[var(--bg-input)] px-2 py-1 rounded">
            Question {activeQuestionIndex + 1} of {questions.length}
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="flex gap-1 mb-4">
          {questions.map((_, idx) => (
            <div
              key={idx}
              onClick={() => goToQuestion(idx)}
              className={`flex-1 h-1 rounded-full transition-all cursor-pointer hover:opacity-80 ${
                localAnswerFeedback[idx]?.isCorrect ||
                userAnswers[idx]?.isCorrect
                  ? "bg-green-500"
                  : (localAnswerFeedback[idx] || userAnswers[idx]) &&
                      !localAnswerFeedback[idx]?.isCorrect
                    ? "bg-red-500"
                    : selectedAnswers[idx] !== null
                      ? "bg-[var(--accent)]"
                      : "bg-gray-200 dark:bg-gray-700"
              }`}
            />
          ))}
        </div>

        {/* Options */}
        <div className="space-y-3">
          {currentQuestion.options.map((option: string, idx: number) => (
            <button
              key={idx}
              onClick={() =>
                selectedAnswers[activeQuestionIndex] === null &&
                handleSelectOption(idx)
              }
              disabled={selectedAnswers[activeQuestionIndex] !== null}
              className={`
                w-full text-left px-4 py-3 rounded-lg border transition-all duration-200 flex items-center gap-3
                ${getOptionStyles(idx)}
                ${selectedAnswers[activeQuestionIndex] !== null ? "cursor-default" : "cursor-pointer"}
              `}
            >
              <div
                className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                  userAnswer && idx === currentQuestion.correctIndex
                    ? "border-green-500 bg-green-500 text-white"
                    : userAnswer && idx === userAnswer.selectedIndex
                      ? "border-red-500 bg-red-500 text-white"
                      : selectedAnswers[activeQuestionIndex] === idx
                        ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                        : "border-[var(--border-default)] text-[var(--fg-muted)]"
                }`}
              >
                {userAnswer
                  ? idx === currentQuestion.correctIndex
                    ? "✓"
                    : idx === userAnswer.selectedIndex
                      ? "✕"
                      : ""
                  : selectedAnswers[activeQuestionIndex] === idx && (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
              </div>
              <span className="text-sm text-[var(--fg-default)]">{option}</span>
            </button>
          ))}
        </div>

        {/* Navigation - Always visible */}
        <div className="mt-5 flex gap-3">
          {/* Previous/Next Navigation */}
          <button
            onClick={() => goToQuestion(activeQuestionIndex - 1)}
            disabled={activeQuestionIndex === 0}
            className={`px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 border border-[var(--border-default)] ${
              activeQuestionIndex === 0
                ? "text-[var(--fg-muted)] opacity-50 cursor-not-allowed"
                : "text-[var(--fg-default)] hover:bg-[var(--bg-input)]"
            }`}
          >
            ← Previous
          </button>

          {activeQuestionIndex < questions.length - 1 && (
            <button
              onClick={() => goToQuestion(activeQuestionIndex + 1)}
              className="flex-1 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 border border-[var(--border-default)] text-[var(--fg-default)] hover:bg-[var(--bg-input)]"
            >
              Next →
            </button>
          )}
        </div>

        {/* Submit Button - Show when all questions answered */}
        {allQuestionsAnswered && !isSubmitted && (
          <div className="mt-4">
            <button
              onClick={handleSubmit}
              className="w-full py-3 rounded-lg font-medium text-sm transition-all duration-200 bg-[var(--accent)] text-white hover:opacity-90 shadow-md hover:shadow-lg"
            >
              Submit Quiz & Continue Learning
            </button>
          </div>
        )}

        {/* Completion Message - Show when submitted */}
        {isSubmitted && (
          <div className="mt-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
            <p className="text-sm text-green-700 dark:text-green-300 text-center font-medium">
              ✅ Quiz completed! Continue reading below to learn more.
            </p>
          </div>
        )}

        {/* Results Display - Shows immediately when answered */}
        {userAnswer && (
          <div className="mt-4 flex flex-col gap-3 animate-fade-in">
            <div
              className={`p-3 rounded-lg text-sm text-center font-medium ${
                userAnswer.isCorrect
                  ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                  : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
              }`}
            >
              {userAnswer.isCorrect
                ? "Correct! 🎉"
                : userAnswer.isSkipped
                  ? `Skipped. The answer was ${
                      currentQuestion.options[currentQuestion.correctIndex]
                    }.`
                  : `Incorrect. The answer was ${
                      currentQuestion.options[currentQuestion.correctIndex]
                    }.`}
            </div>
            {currentQuestion.explanation && (
              <div className="text-xs text-[var(--fg-muted)] bg-[var(--bg-input)] p-3 rounded-lg">
                <strong>Explanation:</strong> {currentQuestion.explanation}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
