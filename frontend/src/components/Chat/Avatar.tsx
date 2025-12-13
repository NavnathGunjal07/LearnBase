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
  gifUrl?: string; // Configurable GIF URL
  quotes?: string[]; // Configurable quotes
}

const DEFAULT_QUOTES = [
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

// Default pixel art wolf GIF - replace with your actual GIF URL
const DEFAULT_GIF_URL = "src/assets/learnbaselogo.png";

const Avatar: React.FC<AvatarProps> = ({
  mood: propMood,
  isTyping = false,
  size = "small",
  message = "",
  gifUrl = DEFAULT_GIF_URL,
  quotes = DEFAULT_QUOTES,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [currentQuote, setCurrentQuote] = useState("");
  const [showTooltip, setShowTooltip] = useState(false);

  const containerRef = React.useRef<HTMLDivElement>(null);
  const [tooltipPos, setTooltipPos] = useState<{
    top: number;
    left: number;
  } | null>(null);

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
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    setCurrentQuote(randomQuote);

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setTooltipPos({
        top: rect.top + rect.height / 2,
        left: rect.left - 15,
      });
    }
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
    small: 50,
    medium: 85,
    large: 120,
  };

  const containerSize = sizeMap[size];

  // Mood-specific filters and effects
  const getMoodStyles = (): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      cursor: "pointer",
      transition: "all 0.3s ease",
      imageRendering: "pixelated",
      transform: isHovered
        ? "scale(1.1)"
        : clickCount >= 2
        ? "scale(0.95)"
        : "scale(1)",
    };

    switch (mood) {
      case "angry":
        return {
          ...baseStyles,
          filter: isHovered
            ? "brightness(1.3) saturate(1.5) hue-rotate(-10deg) drop-shadow(0 0 10px rgba(255, 0, 85, 0.8))"
            : "brightness(1.1) saturate(1.3) hue-rotate(-10deg) drop-shadow(0 0 5px rgba(255, 0, 85, 0.6))",
          animation: "shake 0.5s infinite",
        };
      case "happy":
        return {
          ...baseStyles,
          filter: isHovered
            ? "brightness(1.3) saturate(1.4) hue-rotate(20deg) drop-shadow(0 0 8px rgba(0, 255, 136, 0.7))"
            : "brightness(1.2) saturate(1.2) hue-rotate(20deg) drop-shadow(0 0 4px rgba(0, 255, 136, 0.5))",
        };
      case "surprised":
        return {
          ...baseStyles,
          filter: isHovered
            ? "brightness(1.3) saturate(1.5) hue-rotate(30deg) drop-shadow(0 0 8px rgba(255, 170, 0, 0.7))"
            : "brightness(1.2) saturate(1.3) hue-rotate(30deg) drop-shadow(0 0 4px rgba(255, 170, 0, 0.5))",
          animation: "bounce 0.6s infinite",
        };
      case "wise":
        return {
          ...baseStyles,
          filter: isHovered
            ? "brightness(1.2) saturate(1.4) hue-rotate(270deg) drop-shadow(0 0 10px rgba(170, 0, 255, 0.7))"
            : "brightness(1.1) saturate(1.2) hue-rotate(270deg) drop-shadow(0 0 5px rgba(170, 0, 255, 0.5))",
        };
      case "concerned":
        return {
          ...baseStyles,
          filter: isHovered
            ? "brightness(1.2) saturate(1.3) hue-rotate(15deg) drop-shadow(0 0 8px rgba(255, 136, 0, 0.7))"
            : "brightness(1.1) saturate(1.2) hue-rotate(15deg) drop-shadow(0 0 4px rgba(255, 136, 0, 0.5))",
        };
      case "thinking":
        return {
          ...baseStyles,
          filter: isHovered
            ? "brightness(1.2) saturate(1.4) hue-rotate(180deg) drop-shadow(0 0 8px rgba(0, 170, 255, 0.7))"
            : "brightness(1.1) saturate(1.2) hue-rotate(180deg) drop-shadow(0 0 4px rgba(0, 170, 255, 0.5))",
        };
      default: // idle
        return {
          ...baseStyles,
          filter: isHovered
            ? "brightness(1.2) drop-shadow(0 0 6px rgba(0, 136, 255, 0.6))"
            : "brightness(1) drop-shadow(0 0 3px rgba(0, 136, 255, 0.4))",
        };
    }
  };

  const getMoodOpacity = () => {
    return isTyping ? 0.7 : 1;
  };

  return (
    <>
      <style>
        {`
          @keyframes shake {
            0%, 100% { transform: translate(0, 0) rotate(0deg) scale(0.95); }
            25% { transform: translate(-2px, 0) rotate(-2deg) scale(0.95); }
            75% { transform: translate(2px, 0) rotate(-2deg) scale(0.95); }
          }
          
          @keyframes bounce {
            0%, 100% { transform: translateY(0) scale(1.1); }
            50% { transform: translateY(-5px) scale(1.1); }
          }
          
          @keyframes tooltipFadeIn {
            from {
              opacity: 0;
              transform: translate(-100%, -50%) scale(0.9);
            }
            to {
              opacity: 1;
              transform: translate(-100%, -50%) scale(1);
            }
          }
        `}
      </style>
      <div
        ref={containerRef}
        style={{
          position: "relative",
          width: `${containerSize}px`,
          height: `${containerSize}px`,
          flexShrink: 0,
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        {/* Tooltip */}
        {showTooltip && tooltipPos && (
          <div
            style={{
              ...styles.tooltip,
              top: tooltipPos.top,
              left: tooltipPos.left,
              transform: "translate(-100%, -50%)",
            }}
          >
            <div style={styles.tooltipText}>{currentQuote}</div>
          </div>
        )}

        {/* GIF Avatar */}
        <img
          src={gifUrl}
          alt="Avatar"
          style={{
            width: "100%",
            height: "100%",
            opacity: getMoodOpacity(),
            ...getMoodStyles(),
          }}
        />
      </div>
    </>
  );
};

const styles: Record<string, React.CSSProperties> = {
  tooltip: {
    position: "fixed",
    width: "max-content",
    maxWidth: "300px",
    background: "white",
    color: "black",
    padding: "12px 16px",
    borderRadius: "12px",
    fontSize: "13px",
    fontWeight: "500",
    whiteSpace: "nowrap",
    textAlign: "center",
    boxShadow: "0 8px 25px rgba(0, 0, 0, 0.15), 0 0 20px rgba(0, 0, 0, 0.1)",
    zIndex: 99999,
    animation: "tooltipFadeIn 0.3s ease",
    pointerEvents: "none",
  },
  tooltipText: {
    whiteSpace: "normal",
    lineHeight: "1.4",
  },
};

export default Avatar;
