"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { InterestNode } from "../data/interestsData";

interface ProgressiveSelectorProps {
  data: InterestNode[];
  onComplete: (pathId: string[]) => void;
  className?: string; // Allow external styling
}

export const ProgressiveSelector: React.FC<ProgressiveSelectorProps> = ({
  data,
  onComplete,
  className = "",
}) => {
  const [history, setHistory] = useState<InterestNode[]>([]);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");

  // Determine current options based on the last selected item in history
  const currentOptions = useMemo(() => {
    if (history.length === 0) return data;
    const lastNode = history[history.length - 1];
    return lastNode.children || [];
  }, [data, history]);

  // Handle selection of a node
  const handleSelect = (node: InterestNode) => {
    setDirection("forward");
    const newHistory = [...history, node];

    // Check if leaf node (no children)
    if (!node.children || node.children.length === 0) {
      // Completed selection
      onComplete(newHistory.map((n) => n.id));
    }

    // Even if leaf, we update state to show "selected" state or move forward if logic changed.
    // However, for this UI pattern, if it has children we "zoom in".
    if (node.children && node.children.length > 0) {
      setHistory(newHistory);
    }
  };

  return (
    <div
      className={`w-full max-w-4xl mx-auto p-4 flex flex-col items-center justify-center min-h-[400px] ${className}`}
    >
      {/* Grid Content */}
      <LayoutGroup>
        <motion.div
          layout
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-fr"
        >
          <AnimatePresence mode="popLayout" custom={direction}>
            {currentOptions.map((item) => (
              <Card
                key={item.id}
                item={item}
                onClick={() => handleSelect(item)}
                direction={direction}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      </LayoutGroup>

      {/* Progress Indicator */}
      <div className="mt-auto pt-8 flex justify-center gap-2">
        {history.map((_, idx) => (
          <motion.div
            key={idx}
            layoutId={`dot-${idx}`}
            className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400"
          />
        ))}
        <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-700" />
      </div>
    </div>
  );
};

const Card = ({
  item,
  onClick,
  direction,
}: {
  item: InterestNode;
  onClick: () => void;
  direction: "forward" | "backward";
}) => {
  // Animation variants
  const variants = {
    hidden: () => ({
      opacity: 0,
      scale: 0.96,
      // If moving forward, new items enter from standard. If backing, they emerge from center?
      // Simple fade + scale is cleaner for "zoom" feel.
      filter: "blur(6px)",
    }),
    visible: {
      opacity: 1,
      scale: 1,
      filter: "blur(0px)",
      transition: {
        duration: 0.35,
        ease: [0.22, 1, 0.36, 1],
      },
    },
    exit: (dir: "forward" | "backward") => ({
      opacity: 0,
      scale: dir === "forward" ? 1.03 : 0.96, // Expand out when going forward, shrink when going back
      filter: "blur(6px)",
      transition: {
        duration: 0.25,
        ease: [0.4, 0, 0.2, 1],
      },
    }),
  };

  const Icon = item.icon;

  return (
    <motion.button
      layoutId={item.id}
      variants={variants}
      initial="hidden"
      animate="visible"
      exit="exit"
      custom={direction}
      onClick={onClick}
      className="group relative flex items-center gap-3 rounded-xl border border-[var(--accent)]/25 bg-transparent px-5 py-4 transition-transform duration-300 ease-out hover:scale-[1.02]"
    >
      {Icon && (
        <Icon className="w-7 h-7 text-[var(--accent)] transition-colors" />
      )}

      <h3 className="text-base font-semibold text-[var(--accent)] leading-tight whitespace-nowrap">
        {item.label}
      </h3>
    </motion.button>
  );
};
