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

const Avatar: React.FC<AvatarProps> = ({
  mood: propMood,
  isTyping = false,
  size = "small",
  message = "",
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
    const randomQuote =
      LEARNING_QUOTES[Math.floor(Math.random() * LEARNING_QUOTES.length)];
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
    small: { container: 50 },
    medium: { container: 85 },
    large: { container: 120 },
  };

  const { container } = sizeMap[size];

  // Mood-specific colors and effects
  const getMoodColors = () => {
    switch (mood) {
      case "angry":
        return {
          primary: "#ff0055",
          secondary: "#ff3366",
          glow: "#ff0055",
          earStroke: "3",
          headStroke: "3.5",
        };
      case "happy":
        return {
          primary: "#00ff88",
          secondary: "#00ffcc",
          glow: "#00ff88",
          earStroke: "2",
          headStroke: "2.5",
        };
      case "surprised":
        return {
          primary: "#ffaa00",
          secondary: "#ffcc44",
          glow: "#ffaa00",
          earStroke: "2.5",
          headStroke: "3",
        };
      case "wise":
        return {
          primary: "#aa00ff",
          secondary: "#cc44ff",
          glow: "#aa00ff",
          earStroke: "2",
          headStroke: "2.5",
        };
      case "concerned":
        return {
          primary: "#ff8800",
          secondary: "#ffaa44",
          glow: "#ff8800",
          earStroke: "2",
          headStroke: "2.5",
        };
      case "thinking":
        return {
          primary: "#00aaff",
          secondary: "#44ccff",
          glow: "#00aaff",
          earStroke: "2",
          headStroke: "2.5",
        };
      default: // idle
        return {
          primary: "#0088ff",
          secondary: "#44aaff",
          glow: "#0088ff",
          earStroke: "2",
          headStroke: "2.5",
        };
    }
  };

  const moodColors = getMoodColors();

  return (
    <div
      ref={containerRef}
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
      {/* Tooltip - Using Fixed Positioning to break out of containers */}
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
          {/* Dynamic gradient based on mood */}
          <linearGradient
            id="moodGradient1"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#000000" />
            <stop offset="50%" stopColor={moodColors.primary} />
            <stop offset="100%" stopColor={moodColors.secondary} />
          </linearGradient>
          <linearGradient
            id="moodGradient2"
            x1="100%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <stop offset="0%" stopColor={moodColors.secondary} />
            <stop offset="50%" stopColor={moodColors.primary} />
            <stop offset="100%" stopColor="#000000" />
          </linearGradient>
          <linearGradient
            id="moodGradient3"
            x1="0%"
            y1="100%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor="#000000" />
            <stop offset="50%" stopColor={moodColors.primary} />
            <stop offset="100%" stopColor="#000000" />
          </linearGradient>

          {/* Enhanced glow filter based on mood */}
          <filter id="moodGlow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Strong glow for angry mood */}
          <filter id="strongGlow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background glow effect for mood */}
        <circle
          cx="60"
          cy="60"
          r="55"
          fill="none"
          stroke={moodColors.glow}
          strokeWidth="0.5"
          opacity="0.2"
        >
          {(mood === "angry" || mood === "surprised") && (
            <animate
              attributeName="r"
              values="55;58;55"
              dur="1s"
              repeatCount="indefinite"
            />
          )}
        </circle>

        {/* Main Fox/Wolf Head Outline */}
        <g filter={mood === "angry" ? "url(#strongGlow)" : "url(#moodGlow)"}>
          {/* Left Ear - Triangle with mood-specific animation */}
          <path
            d="M 35 35 L 25 10 L 50 35 Z"
            fill="none"
            stroke="url(#moodGradient1)"
            strokeWidth={moodColors.earStroke}
            opacity={isTyping ? 0.7 : 1}
          >
            {mood === "surprised" && (
              <animateTransform
                attributeName="transform"
                type="translate"
                values="0,0; 0,-3; 0,0"
                dur="0.5s"
                repeatCount="indefinite"
              />
            )}
          </path>

          {/* Right Ear - Triangle with mood-specific animation */}
          <path
            d="M 85 35 L 95 10 L 70 35 Z"
            fill="none"
            stroke="url(#moodGradient1)"
            strokeWidth={moodColors.earStroke}
            opacity={isTyping ? 0.7 : 1}
          >
            {mood === "surprised" && (
              <animateTransform
                attributeName="transform"
                type="translate"
                values="0,0; 0,-3; 0,0"
                dur="0.5s"
                repeatCount="indefinite"
              />
            )}
          </path>

          {/* Head outline - Wolf-like */}
          <path
            d="M 30 40 L 15 60 L 25 85 L 45 95 L 60 100 L 75 95 L 95 85 L 105 60 L 90 40 L 60 25 Z"
            fill="none"
            stroke="url(#moodGradient3)"
            strokeWidth={moodColors.headStroke}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {mood === "angry" && (
              <animate
                attributeName="stroke-width"
                values="3.5;4.5;3.5"
                dur="0.8s"
                repeatCount="indefinite"
              />
            )}
          </path>

          {/* Eyes - Different for each mood */}
          {mood === "angry" ? (
            // Angry eyes - sharp angles with intense glow
            <>
              <path
                d="M 40 50 L 48 55 L 40 58"
                fill="none"
                stroke="#ff0055"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <path
                d="M 80 50 L 72 55 L 80 58"
                fill="none"
                stroke="#ff0055"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <circle cx="44" cy="54" r="4" fill="#ff0055" opacity="0.9">
                <animate
                  attributeName="opacity"
                  values="0.9;1;0.9"
                  dur="0.4s"
                  repeatCount="indefinite"
                />
              </circle>
              <circle cx="76" cy="54" r="4" fill="#ff0055" opacity="0.9">
                <animate
                  attributeName="opacity"
                  values="0.9;1;0.9"
                  dur="0.4s"
                  repeatCount="indefinite"
                />
              </circle>
            </>
          ) : mood === "thinking" ? (
            // Thinking eyes - looking up with movement
            <>
              <circle
                cx="42"
                cy="52"
                r="5"
                fill="none"
                stroke="url(#moodGradient2)"
                strokeWidth="2"
              />
              <circle cx="42" cy="49" r="2.5" fill="#00ffff">
                <animate
                  attributeName="cy"
                  values="49;48;49"
                  dur="2s"
                  repeatCount="indefinite"
                />
              </circle>
              <circle
                cx="78"
                cy="52"
                r="5"
                fill="none"
                stroke="url(#moodGradient2)"
                strokeWidth="2"
              />
              <circle cx="78" cy="49" r="2.5" fill="#00ffff">
                <animate
                  attributeName="cy"
                  values="49;48;49"
                  dur="2s"
                  repeatCount="indefinite"
                />
              </circle>
            </>
          ) : mood === "happy" ? (
            // Happy eyes - curved with sparkles
            <>
              <path
                d="M 36 52 Q 44 46 52 52"
                fill="none"
                stroke="url(#moodGradient2)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M 68 52 Q 76 46 84 52"
                fill="none"
                stroke="url(#moodGradient2)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              {/* Sparkle effect for happy */}
              <circle cx="38" cy="48" r="1.5" fill="#00ff88">
                <animate
                  attributeName="opacity"
                  values="0;1;0"
                  dur="1.5s"
                  repeatCount="indefinite"
                />
              </circle>
              <circle cx="82" cy="48" r="1.5" fill="#00ff88">
                <animate
                  attributeName="opacity"
                  values="0;1;0"
                  dur="1.5s"
                  begin="0.5s"
                  repeatCount="indefinite"
                />
              </circle>
            </>
          ) : mood === "surprised" ? (
            // Surprised eyes - wide open circles
            <>
              <circle
                cx="42"
                cy="52"
                r="6"
                fill="none"
                stroke="url(#moodGradient2)"
                strokeWidth="2.5"
              />
              <circle cx="42" cy="52" r="3" fill="#ffaa00">
                <animate
                  attributeName="r"
                  values="3;4;3"
                  dur="0.8s"
                  repeatCount="indefinite"
                />
              </circle>
              <circle
                cx="78"
                cy="52"
                r="6"
                fill="none"
                stroke="url(#moodGradient2)"
                strokeWidth="2.5"
              />
              <circle cx="78" cy="52" r="3" fill="#ffaa00">
                <animate
                  attributeName="r"
                  values="3;4;3"
                  dur="0.8s"
                  repeatCount="indefinite"
                />
              </circle>
            </>
          ) : mood === "concerned" ? (
            // Concerned eyes - slightly worried look
            <>
              <ellipse
                cx="42"
                cy="52"
                rx="4"
                ry="5"
                fill="none"
                stroke="url(#moodGradient2)"
                strokeWidth="2"
                transform="rotate(-15 42 52)"
              />
              <circle cx="42" cy="52" r="2" fill="#ff8800" />
              <ellipse
                cx="78"
                cy="52"
                rx="4"
                ry="5"
                fill="none"
                stroke="url(#moodGradient2)"
                strokeWidth="2"
                transform="rotate(15 78 52)"
              />
              <circle cx="78" cy="52" r="2" fill="#ff8800" />
              {/* Worried eyebrows */}
              <path
                d="M 36 45 Q 42 43 48 44"
                fill="none"
                stroke="#ff8800"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M 72 44 Q 78 43 84 45"
                fill="none"
                stroke="#ff8800"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </>
          ) : mood === "wise" ? (
            // Wise eyes - calm and knowing
            <>
              <path
                d="M 36 50 Q 44 52 52 50"
                fill="none"
                stroke="url(#moodGradient2)"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle cx="44" cy="52" r="2" fill="#aa00ff" opacity="0.8" />
              <path
                d="M 68 50 Q 76 52 84 50"
                fill="none"
                stroke="url(#moodGradient2)"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle cx="76" cy="52" r="2" fill="#aa00ff" opacity="0.8" />
            </>
          ) : (
            // Normal/Idle eyes
            <>
              <circle
                cx="42"
                cy="52"
                r="4"
                fill="none"
                stroke="url(#moodGradient2)"
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
                stroke="url(#moodGradient2)"
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

          {/* Nose - Mood-specific color */}
          <circle cx="60" cy="70" r="4" fill="#000000">
            {mood === "surprised" && (
              <animate
                attributeName="r"
                values="4;5;4"
                dur="0.6s"
                repeatCount="indefinite"
              />
            )}
          </circle>

          {/* Mouth - Different for each mood */}
          {mood === "angry" ? (
            // Angry mouth - frown with teeth
            <>
              <path
                d="M 48 83 Q 60 88 72 83"
                fill="none"
                stroke="#ff0055"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <line
                x1="54"
                y1="84"
                x2="54"
                y2="87"
                stroke="#ff0055"
                strokeWidth="1.5"
              />
              <line
                x1="60"
                y1="85"
                x2="60"
                y2="88"
                stroke="#ff0055"
                strokeWidth="1.5"
              />
              <line
                x1="66"
                y1="84"
                x2="66"
                y2="87"
                stroke="#ff0055"
                strokeWidth="1.5"
              />
            </>
          ) : mood === "happy" ? (
            // Happy mouth - big smile
            <path
              d="M 45 82 Q 60 92 75 82"
              fill="none"
              stroke="url(#moodGradient3)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          ) : mood === "surprised" ? (
            // Surprised mouth - O shape
            <ellipse
              cx="60"
              cy="85"
              rx="8"
              ry="10"
              fill="none"
              stroke="url(#moodGradient3)"
              strokeWidth="2.5"
            />
          ) : mood === "concerned" ? (
            // Concerned mouth - slight frown
            <path
              d="M 48 87 Q 60 84 72 87"
              fill="none"
              stroke="url(#moodGradient3)"
              strokeWidth="2"
              strokeLinecap="round"
            />
          ) : mood === "wise" ? (
            // Wise mouth - subtle smile
            <path
              d="M 48 85 Q 60 87 72 85"
              fill="none"
              stroke="url(#moodGradient3)"
              strokeWidth="2"
              strokeLinecap="round"
            />
          ) : (
            // Normal mouth
            <path
              d="M 50 85 L 70 85"
              fill="none"
              stroke="url(#moodGradient3)"
              strokeWidth="2"
              strokeLinecap="round"
            />
          )}
        </g>

        {/* Mood-specific particle effects */}
        {mood === "wise" && (
          <>
            <circle cx="20" cy="60" r="2" fill="#aa00ff" opacity="0.8">
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
            <circle cx="100" cy="70" r="2" fill="#cc44ff" opacity="0.8">
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
            <circle cx="60" cy="15" r="1.5" fill="#aa00ff" opacity="0.6">
              <animate
                attributeName="r"
                values="1.5;2.5;1.5"
                dur="2s"
                repeatCount="indefinite"
              />
            </circle>
          </>
        )}

        {mood === "happy" && (
          <>
            <path
              d="M 15 50 L 18 47 L 15 44"
              fill="none"
              stroke="#00ff88"
              strokeWidth="1.5"
            >
              <animate
                attributeName="opacity"
                values="0;1;0"
                dur="1.5s"
                repeatCount="indefinite"
              />
            </path>
            <path
              d="M 105 50 L 102 47 L 105 44"
              fill="none"
              stroke="#00ff88"
              strokeWidth="1.5"
            >
              <animate
                attributeName="opacity"
                values="0;1;0"
                dur="1.5s"
                begin="0.5s"
                repeatCount="indefinite"
              />
            </path>
          </>
        )}

        {mood === "concerned" && (
          <>
            <line
              x1="25"
              y1="75"
              x2="28"
              y2="78"
              stroke="#ff8800"
              strokeWidth="1.5"
              opacity="0.6"
            >
              <animate
                attributeName="opacity"
                values="0.6;0.3;0.6"
                dur="2s"
                repeatCount="indefinite"
              />
            </line>
            <line
              x1="95"
              y1="75"
              x2="92"
              y2="78"
              stroke="#ff8800"
              strokeWidth="1.5"
              opacity="0.6"
            >
              <animate
                attributeName="opacity"
                values="0.6;0.3;0.6"
                dur="2s"
                repeatCount="indefinite"
              />
            </line>
          </>
        )}

        {/* Thinking indicator - enhanced */}
        {mood === "thinking" && (
          <g>
            <circle cx="85" cy="32" r="3.5" fill="#00aaff" opacity="0.7">
              <animate
                attributeName="opacity"
                values="0.3;0.9;0.3"
                dur="1s"
                repeatCount="indefinite"
              />
            </circle>
            <circle cx="93" cy="26" r="2.5" fill="#00aaff" opacity="0.7">
              <animate
                attributeName="opacity"
                values="0.3;0.9;0.3"
                dur="1s"
                begin="0.2s"
                repeatCount="indefinite"
              />
            </circle>
            <circle cx="100" cy="21" r="2" fill="#00aaff" opacity="0.7">
              <animate
                attributeName="opacity"
                values="0.3;0.9;0.3"
                dur="1s"
                begin="0.4s"
                repeatCount="indefinite"
              />
            </circle>
          </g>
        )}

        {/* Angry smoke effect */}
        {mood === "angry" && (
          <>
            <circle cx="25" cy="45" r="2" fill="#ff0055" opacity="0.5">
              <animate
                attributeName="cy"
                values="45;25;45"
                dur="1.5s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0.5;0;0.5"
                dur="1.5s"
                repeatCount="indefinite"
              />
            </circle>
            <circle cx="95" cy="45" r="2" fill="#ff3366" opacity="0.5">
              <animate
                attributeName="cy"
                values="45;25;45"
                dur="1.5s"
                begin="0.5s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0.5;0;0.5"
                dur="1.5s"
                begin="0.5s"
                repeatCount="indefinite"
              />
            </circle>
          </>
        )}

        {/* Surprised stars */}
        {mood === "surprised" && (
          <>
            <path
              d="M 20 40 L 22 45 L 27 45 L 23 48 L 25 53 L 20 50 L 15 53 L 17 48 L 13 45 L 18 45 Z"
              fill="#ffaa00"
              opacity="0.8"
            >
              <animate
                attributeName="opacity"
                values="0.8;0.3;0.8"
                dur="1s"
                repeatCount="indefinite"
              />
            </path>
            <path
              d="M 100 40 L 102 45 L 107 45 L 103 48 L 105 53 L 100 50 L 95 53 L 97 48 L 93 45 L 98 45 Z"
              fill="#ffcc44"
              opacity="0.8"
            >
              <animate
                attributeName="opacity"
                values="0.8;0.3;0.8"
                dur="1s"
                begin="0.3s"
                repeatCount="indefinite"
              />
            </path>
          </>
        )}

        {/* Hover particles */}
        {isHovered && mood !== "wise" && (
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
      </svg>
    </div>
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
