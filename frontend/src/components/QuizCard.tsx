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
  onAnswer: (questionIndex: number, selectedIndex: number) => void;
  userAnswers?: Array<{
    selectedIndex: number;
    isCorrect: boolean;
    isSkipped: boolean;
  }>;
  currentIndex?: number;
  status?: "active" | "completed" | "stopped";
  totalQuestions?: number;
  correctAnswers?: number;
}

export const QuizCard = ({
  questions,
  onAnswer,
  userAnswers = [],
  currentIndex = 0,
  status = "active",
  totalQuestions,
  correctAnswers,
}: QuizCardProps) => {
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(currentIndex);
  const [selectedAnswers, setSelectedAnswers] = useState<(number | null)[]>(
    new Array(questions.length).fill(null)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync with prop changes
  useEffect(() => {
    setActiveQuestionIndex(currentIndex);
  }, [currentIndex]);

  // Update selected answers from userAnswers prop
  useEffect(() => {
    if (userAnswers.length > 0) {
      const answers = questions.map((_, idx) =>
        userAnswers[idx] ? userAnswers[idx].selectedIndex : null
      );
      setSelectedAnswers(answers);
      setIsSubmitting(false); // Reset when answer received
    }
  }, [userAnswers, questions]);

  const currentQuestion = questions[activeQuestionIndex];
  const userAnswer = userAnswers[activeQuestionIndex];

  const handleSelectOption = (optionIndex: number) => {
    if (userAnswer || isSubmitting) return; // Prevent if answered or submitting

    const newAnswers = [...selectedAnswers];
    newAnswers[activeQuestionIndex] = optionIndex;
    setSelectedAnswers(newAnswers);
  };

  const handleSubmit = () => {
    const selected = selectedAnswers[activeQuestionIndex];
    if (selected === null || isSubmitting) return;

    setIsSubmitting(true);
    onAnswer(activeQuestionIndex, selected);
  };

  const handleSkip = () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    onAnswer(activeQuestionIndex, -1); // -1 for skip
  };

  const getOptionStyles = (idx: number) => {
    if (!userAnswer) {
      // Not yet answered
      return selectedAnswers[activeQuestionIndex] === idx
        ? "border-[var(--accent)] bg-orange-50 dark:bg-orange-900/20 ring-1 ring-[var(--accent)]"
        : "border-[var(--border-default)] hover:border-[var(--accent)] hover:bg-[var(--bg-input)]";
    }

    // Answered - show feedback
    if (idx === currentQuestion.correctIndex) {
      return "border-green-500 bg-green-50 dark:bg-green-900/20 ring-1 ring-green-500";
    }
    if (idx === userAnswer.selectedIndex && !userAnswer.isSkipped) {
      return "border-red-500 bg-red-50 dark:bg-red-900/20 ring-1 ring-red-500";
    }
    return "border-[var(--border-default)] opacity-60";
  };

  if (status === "stopped") {
    return (
      <div className="quiz-card-container my-4 w-full">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">🛑</span>
            <h3 className="text-lg font-bold text-red-700 dark:text-red-400">
              Assessment Stopped
            </h3>
          </div>
          <p className="text-[var(--fg-default)] mb-4">
            You missed too many questions. Don't worry! We'll switch gears and
            start with the basics.
          </p>
        </div>
      </div>
    );
  }

  if (status === "completed") {
    return (
      <div className="quiz-card-container my-4 w-full">
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">🎉</span>
            <h3 className="text-lg font-bold text-green-700 dark:text-green-400">
              Quiz Completed!
            </h3>
          </div>
          <p className="text-[var(--fg-default)] mb-4">
            You scored {correctAnswers} out of{" "}
            {totalQuestions || questions.length} questions correct!
          </p>
          <div className="text-sm text-[var(--fg-muted)] italic">
            Great job! Let's continue with the lesson.
          </div>
        </div>
      </div>
    );
  }

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
              className={`flex-1 h-1 rounded-full transition-all ${
                idx < activeQuestionIndex
                  ? userAnswers[idx]?.isCorrect
                    ? "bg-green-500"
                    : "bg-red-500"
                  : idx === activeQuestionIndex
                  ? "bg-[var(--accent)]"
                  : "bg-gray-200 dark:bg-gray-700"
              }`}
            />
          ))}
        </div>

        {/* Options */}
        <div className="space-y-3">
          {currentQuestion.options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => !userAnswer && handleSelectOption(idx)}
              disabled={!!userAnswer}
              className={`
                w-full text-left px-4 py-3 rounded-lg border transition-all duration-200 flex items-center gap-3
                ${getOptionStyles(idx)}
                ${userAnswer ? "cursor-default" : "cursor-pointer"}
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

        {/* Actions / Feedback */}
        {!userAnswer && (
          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              onClick={handleSkip}
              disabled={isSubmitting}
              className={`py-2.5 rounded-lg font-medium text-sm transition-all duration-200 border border-[var(--border-default)] ${
                isSubmitting
                  ? "text-[var(--fg-muted)] opacity-50 cursor-not-allowed"
                  : "text-[var(--fg-muted)] hover:bg-[var(--bg-input)]"
              }`}
            >
              {isSubmitting ? "Submitting..." : "Skip"}
            </button>
            <button
              onClick={handleSubmit}
              disabled={
                selectedAnswers[activeQuestionIndex] === null || isSubmitting
              }
              className={`
                py-2.5 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2
                ${
                  selectedAnswers[activeQuestionIndex] !== null && !isSubmitting
                    ? "bg-[var(--accent)] text-white hover:opacity-90 shadow-sm hover:shadow"
                    : "bg-[var(--bg-input)] text-[var(--fg-muted)] cursor-not-allowed"
                }
              `}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Submitting...
                </>
              ) : (
                "Submit Answer"
              )}
            </button>
          </div>
        )}

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
            {activeQuestionIndex < questions.length - 1 && (
              <div className="text-center text-xs text-[var(--fg-muted)] italic">
                Moving to next question...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
