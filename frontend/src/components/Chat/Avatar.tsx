import React, { useState } from "react";
import logo from "@/assets/learnbaselogo.png";

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
const DEFAULT_GIF_URL = logo;

const Avatar: React.FC<AvatarProps> = ({
  mood: _mood, // Unused
  isTyping = false,
  size = "small",
  message: _message, // Unused
  gifUrl = DEFAULT_GIF_URL,
  quotes = DEFAULT_QUOTES,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  // Unused click count removed
  const [currentQuote, setCurrentQuote] = useState("");
  const [showTooltip, setShowTooltip] = useState(false);

  const containerRef = React.useRef<HTMLDivElement>(null);
  const [tooltipPos, setTooltipPos] = useState<{
    top: number;
    left: number;
  } | null>(null);

  // Unused mood analysis for visual effects (removed for simplicity)
  // const analyzeMood = ...

  // Hover state only
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

  /* Removed unused handleClick */

  const sizeMap = {
    small: 50,
    medium: 85,
    large: 120,
  };

  const containerSize = sizeMap[size];

  // Mood-specific filters and effects
  const getMoodStyles = (): React.CSSProperties => {
    return {
      cursor: "pointer",
      transition: "transform 0.3s ease",
      imageRendering: "pixelated",
      // Simple hover effect, no filters or wobbling
      transform: isHovered ? "scale(1.05)" : "scale(1)",
    };
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
