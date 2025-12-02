interface CircularProgressProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  icon?: string;
  showTooltip?: boolean;
  className?: string;
}

export function CircularProgress({
  value,
  size = 40,
  strokeWidth = 3,
  icon,
  showTooltip = true,
  className = "",
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  // Color gradient based on progress
  const getStrokeColor = (val: number) => {
    if (val >= 100) return "#10b981"; // Green-500
    if (val >= 50) return "#f59e0b"; // Amber-500
    return "#3b82f6"; // Blue-500
  };

  return (
    <div
      className={`relative group flex-none ${className}`}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-gray-200 dark:text-gray-700"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getStrokeColor(value)}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500 ease-out"
        />
      </svg>

      {/* Icon in center */}
      {icon && (
        <div className="absolute inset-0 flex items-center justify-center">
          {icon.startsWith("http") ? (
            <img
              src={icon}
              alt="Icon"
              className="object-contain"
              style={{ width: `${size * 0.6}px`, height: `${size * 0.6}px` }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <span style={{ fontSize: `${size * 0.5}px` }}>{icon}</span>
          )}
        </div>
      )}

      {/* Tooltip */}
      {showTooltip && (
        <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 whitespace-nowrap px-2 py-1 rounded bg-gray-800 text-white text-xs opacity-0 group-hover:opacity-100 transition z-10 shadow-lg">
          {Math.round(value)}% Complete
          <div className="absolute left-0 top-1/2 -translate-y-1/2 -ml-1 border-4 border-transparent border-r-gray-800"></div>
        </div>
      )}
    </div>
  );
}
