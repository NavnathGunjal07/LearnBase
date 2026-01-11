interface LinearProgressProps {
  value: number;
  height?: number;
  showLabel?: boolean;
  className?: string;
}

export function LinearProgress({
  value,
  height = 4,
  showLabel = false,
  className = "",
}: LinearProgressProps) {
  // Color gradient based on progress
  const getBarColor = (val: number) => {
    if (val >= 100) return "bg-green-500";
    if (val >= 50) return "bg-amber-500";
    return "bg-blue-500";
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between mb-1">
        {showLabel && (
          <span className="text-xs font-medium text-[var(--fg-muted)]">
            {Math.round(value)}%
          </span>
        )}
      </div>
      <div
        className={`w-full bg-[var(--bg-input)] rounded-full overflow-hidden`}
        style={{ height }}
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${getBarColor(
            value
          )}`}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
}
