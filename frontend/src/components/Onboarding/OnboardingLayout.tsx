import { FC, ReactNode } from "react";
import { Check } from "lucide-react";

interface OnboardingLayoutProps {
  children: ReactNode;
  currentStep: "auth" | "identity" | "interests" | "goals" | "complete";
}

const steps = [
  { id: "auth", label: "Account" },
  { id: "identity", label: "Identity" },
  { id: "interests", label: "Interests" },
  { id: "goals", label: "Goals" },
];

export const OnboardingLayout: FC<OnboardingLayoutProps> = ({
  children,
  currentStep,
}) => {
  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <div className="h-screen flex flex-col bg-[var(--bg-default)] transition-colors duration-500 overflow-hidden">
      {/* Header / Progress */}
      <div className="flex-shrink-0 w-full">
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-6 sm:py-8">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            {steps.map((step, index) => {
              const isActive = index === currentStepIndex;
              const isCompleted = index < currentStepIndex;

              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-2 transition-all duration-300 ${
                    isActive
                      ? "text-[var(--accent)] font-semibold"
                      : isCompleted
                      ? "text-[var(--fg-muted)]"
                      : "text-[var(--border-default)]"
                  }`}
                >
                  <div
                    className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs border ${
                      isActive
                        ? "border-[var(--accent)] bg-orange-50 dark:bg-orange-900/10 text-[var(--accent)]"
                        : isCompleted
                        ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                        : "border-[var(--border-default)] text-[var(--fg-muted)]"
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span className="hidden sm:inline text-sm">{step.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content - Full Height Container */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        <div className="flex-1 flex flex-col w-full animate-in fade-in zoom-in-95 duration-500 min-h-0">
          {children}
        </div>
      </div>
    </div>
  );
};
