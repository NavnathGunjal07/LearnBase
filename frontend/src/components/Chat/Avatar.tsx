import React, { useState, useEffect } from "react";

type Mood =
  | "idle"
  | "thinking"
  | "happy"
  | "surprised"
  | "wise"
  | "concerned"
  | "angry";

interface AvatarProps {
  mood?: Mood;
  isTyping?: boolean;
  size?: "small" | "medium" | "large";
  message?: string;
}

const LEARNING_QUOTES = [
  "The expert in anything was once a beginner.",
  "Learning never exhausts the mind. - Leonardo da Vinci",
  "The beautiful thing about learning is that no one can take it away from you.",
  "Live as if you were to die tomorrow. Learn as if you were to live forever. - Mahatma Gandhi",
  "The capacity to learn is a gift; the ability to learn is a skill; the willingness to learn is a choice.",
  "Education is the passport to the future. - Malcolm X",
  "Anyone who stops learning is old. - Henry Ford",
  "The more that you read, the more things you will know. - Dr. Seuss",
  "Develop a passion for learning. If you do, you will never cease to grow.",
  "Learning is a treasure that will follow its owner everywhere.",
  "The best time to plant a tree was 20 years ago. The second best time is now.",
  "Success is the sum of small efforts repeated day in and day out.",
  "Mistakes are proof that you are trying.",
  "Don't watch the clock; do what it does. Keep going.",
  "The future depends on what you do today.",
  "Knowledge is power. - Francis Bacon",
  "The only way to do great work is to love what you do.",
  "Believe you can and you're halfway there.",
  "Every accomplishment starts with the decision to try.",
  "Your limitation—it's only your imagination.",
];

export const Avatar: React.FC<AvatarProps> = ({
  mood: propMood,
  isTyping = false,
  size = "small",
  message = "",
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [currentQuote, setCurrentQuote] = useState("");
  const [showTooltip, setShowTooltip] = useState(false);

  // Auto-analyze mood from message if not provided
  const analyzeMood = (text: string): Mood => {
    const lower = text.toLowerCase();
    if (lower.includes("?")) return "thinking";
    if (
      lower.includes("!") ||
      lower.includes("wow") ||
      lower.includes("amazing")
    )
      return "surprised";
    if (
      lower.includes("thanks") ||
      lower.includes("great") ||
      lower.includes("correct") ||
      lower.includes("excellent")
    )
      return "happy";
    if (
      lower.includes("help") ||
      lower.includes("problem") ||
      lower.includes("worry") ||
      lower.includes("incorrect")
    )
      return "concerned";
    if (
      lower.includes("wisdom") ||
      lower.includes("learn") ||
      lower.includes("remember")
    )
      return "wise";
    return "idle";
  };

  const baseMood = propMood || analyzeMood(message);
  const mood = clickCount >= 2 ? "angry" : baseMood;

  // Reset click count after 3 seconds
  useEffect(() => {
    if (clickCount >= 2) {
      const timer = setTimeout(() => setClickCount(0), 3000);
      return () => clearTimeout(timer);
    }
  }, [clickCount]);

  // Get random quote on hover
  const handleMouseEnter = () => {
    setIsHovered(true);
    const randomQuote =
      LEARNING_QUOTES[Math.floor(Math.random() * LEARNING_QUOTES.length)];
    setCurrentQuote(randomQuote);
    setShowTooltip(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setShowTooltip(false);
  };

  const handleClick = () => {
    setClickCount((prev) => prev + 1);
  };

  const sizeMap = {
    small: { container: 50 },
    medium: { container: 85 },
    large: { container: 120 },
  };

  const { container } = sizeMap[size];

  return (
    <div
      style={{
        position: "relative",
        width: `${container}px`,
        height: `${container}px`,
        flexShrink: 0,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {/* Tooltip */}
      {showTooltip && (
        <div style={styles.tooltip}>
          <div style={styles.tooltipText}>{currentQuote}</div>
        </div>
      )}

      {/* SVG Avatar */}
      <svg
        width={container}
        height={container}
        viewBox="0 0 120 120"
        style={{
          cursor: "pointer",
          filter: isHovered ? "brightness(1.2)" : "brightness(1)",
          transition: "all 0.3s ease",
          transform: isHovered
            ? "scale(1.1)"
            : clickCount >= 2
            ? "scale(0.95)"
            : "scale(1)",
        }}
      >
        <defs>
          {/* Gradient definitions for neon effect */}
          <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#000000" />
            <stop offset="50%" stopColor="#0044ff" />
            <stop offset="100%" stopColor="#00aaff" />
          </linearGradient>
          <linearGradient id="gradient2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#00aaff" />
            <stop offset="50%" stopColor="#0044ff" />
            <stop offset="100%" stopColor="#000000" />
          </linearGradient>
          <linearGradient id="gradient3" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#000000" />
            <stop offset="50%" stopColor="#0088ff" />
            <stop offset="100%" stopColor="#000000" />
          </linearGradient>

          {/* Glow filter */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Main Fox/Wolf Head Outline */}
        <g filter="url(#glow)">
          {/* Left Ear - Triangle */}
          <path
            d="M 35 35 L 25 10 L 50 35 Z"
            fill="none"
            stroke="url(#gradient1)"
            strokeWidth={mood === "angry" ? "3" : "2"}
            opacity={isTyping ? 0.7 : 1}
          />

          {/* Right Ear - Triangle */}
          <path
            d="M 85 35 L 95 10 L 70 35 Z"
            fill="none"
            stroke="url(#gradient1)"
            strokeWidth={mood === "angry" ? "3" : "2"}
            opacity={isTyping ? 0.7 : 1}
          />

          {/* Head outline - Wolf-like */}
          <path
            d="M 30 40 L 15 60 L 25 85 L 45 95 L 60 100 L 75 95 L 95 85 L 105 60 L 90 40 L 60 25 Z"
            fill="none"
            stroke="url(#gradient3)"
            strokeWidth={mood === "angry" ? "3.5" : "2.5"}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Eyes */}
          {mood === "angry" ? (
            // Angry eyes - sharp angles
            <>
              <path
                d="M 40 50 L 48 55 L 40 58"
                fill="none"
                stroke="#ff0055"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M 80 50 L 72 55 L 80 58"
                fill="none"
                stroke="#ff0055"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle cx="44" cy="54" r="3" fill="#ff0055" opacity="0.8">
                <animate
                  attributeName="opacity"
                  values="0.8;1;0.8"
                  dur="0.5s"
                  repeatCount="indefinite"
                />
              </circle>
              <circle cx="76" cy="54" r="3" fill="#ff0055" opacity="0.8">
                <animate
                  attributeName="opacity"
                  values="0.8;1;0.8"
                  dur="0.5s"
                  repeatCount="indefinite"
                />
              </circle>
            </>
          ) : mood === "thinking" ? (
            // Thinking eyes - looking up
            <>
              <circle
                cx="42"
                cy="52"
                r="4"
                fill="none"
                stroke="url(#gradient2)"
                strokeWidth="2"
              />
              <circle cx="42" cy="50" r="2" fill="#00ffff" />
              <circle
                cx="78"
                cy="52"
                r="4"
                fill="none"
                stroke="url(#gradient2)"
                strokeWidth="2"
              />
              <circle cx="78" cy="50" r="2" fill="#00ffff" />
            </>
          ) : mood === "happy" ? (
            // Happy eyes - curved
            <>
              <path
                d="M 38 52 Q 44 48 50 52"
                fill="none"
                stroke="url(#gradient2)"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M 70 52 Q 76 48 82 52"
                fill="none"
                stroke="url(#gradient2)"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </>
          ) : (
            // Normal eyes
            <>
              <circle
                cx="42"
                cy="52"
                r="4"
                fill="none"
                stroke="url(#gradient2)"
                strokeWidth="2"
              />
              <circle cx="42" cy="52" r="2" fill="#00ffff">
                {isTyping && (
                  <animate
                    attributeName="r"
                    values="2;1;2"
                    dur="1s"
                    repeatCount="indefinite"
                  />
                )}
              </circle>
              <circle
                cx="78"
                cy="52"
                r="4"
                fill="none"
                stroke="url(#gradient2)"
                strokeWidth="2"
              />
              <circle cx="78" cy="52" r="2" fill="#00ffff">
                {isTyping && (
                  <animate
                    attributeName="r"
                    values="2;1;2"
                    dur="1s"
                    repeatCount="indefinite"
                  />
                )}
              </circle>
            </>
          )}

          {/* Nose - Simple Pointy Dark Circle */}
          <circle cx="60" cy="70" r="4" fill="#000000" />

          {/* Mouth - Single Line */}
          <path
            d="M 50 85 L 70 85"
            fill="none"
            stroke={mood === "angry" ? "#ff0055" : "url(#gradient3)"}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>

        {/* Animated particles when wise or hovered */}
        {(mood === "wise" || isHovered) && (
          <>
            <circle cx="20" cy="60" r="2" fill="#00ffff" opacity="0.8">
              <animate
                attributeName="cy"
                values="60;30;60"
                dur="3s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0;0.8;0"
                dur="3s"
                repeatCount="indefinite"
              />
            </circle>
            <circle cx="100" cy="70" r="2" fill="#ff00ff" opacity="0.8">
              <animate
                attributeName="cy"
                values="70;40;70"
                dur="3.5s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0;0.8;0"
                dur="3.5s"
                repeatCount="indefinite"
              />
            </circle>
            <circle cx="60" cy="100" r="2" fill="#ffaa00" opacity="0.8">
              <animate
                attributeName="cy"
                values="100;70;100"
                dur="4s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0;0.8;0"
                dur="4s"
                repeatCount="indefinite"
              />
            </circle>
          </>
        )}

        {/* Thinking indicator */}
        {mood === "thinking" && (
          <g>
            <circle cx="85" cy="30" r="3" fill="#00ffff" opacity="0.6">
              <animate
                attributeName="opacity"
                values="0.3;0.8;0.3"
                dur="1s"
                repeatCount="indefinite"
              />
            </circle>
            <circle cx="92" cy="25" r="2" fill="#00ffff" opacity="0.6">
              <animate
                attributeName="opacity"
                values="0.3;0.8;0.3"
                dur="1s"
                begin="0.2s"
                repeatCount="indefinite"
              />
            </circle>
            <circle cx="98" cy="22" r="1.5" fill="#00ffff" opacity="0.6">
              <animate
                attributeName="opacity"
                values="0.3;0.8;0.3"
                dur="1s"
                begin="0.4s"
                repeatCount="indefinite"
              />
            </circle>
          </g>
        )}
      </svg>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  tooltip: {
    position: "absolute",
    right: "100%",
    top: "50%",
    transform: "translateY(-50%)",
    marginRight: "15px",
    width: "max-content",
    maxWidth: "300px",
    background: "white",
    color: "black",
    padding: "8px 12px",
    borderRadius: "8px",
    fontSize: "11px",
    fontWeight: "500",
    whiteSpace: "nowrap",

    textAlign: "center",
    boxShadow: "0 4px 15px rgba(0, 0, 0, 0.1), 0 0 20px rgba(0, 0, 0, 0.1)",
    zIndex: 9999,
    animation: "tooltipFadeIn 0.3s ease",
    pointerEvents: "none",
  },
  tooltipText: {
    whiteSpace: "normal",
    lineHeight: "1.3",
  },
};

export default Avatar;
