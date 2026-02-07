"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { ChevronLeft, Check } from "lucide-react";
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
    hidden: (dir: "forward" | "backward") => ({
      opacity: 0,
      scale: 0.9,
      // If moving forward, new items enter from standard. If backing, they emerge from center?
      // Simple fade + scale is cleaner for "zoom" feel.
      filter: "blur(10px)",
    }),
    visible: {
      opacity: 1,
      scale: 1,
      filter: "blur(0px)",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
      },
    },
    exit: (dir: "forward" | "backward") => ({
      opacity: 0,
      scale: dir === "forward" ? 1.1 : 0.9, // Expand out when going forward, shrink when going back
      filter: "blur(10px)",
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
      className="group relative flex flex-col items-center justify-center p-6 gap-3 rounded-2xl bg-orange-50 dark:bg-orange-900/10 hover:bg-[var(--accent)] transition-all duration-300 aspect-square shadow-sm hover:shadow-md"
    >
      <div className="p-3 rounded-full bg-white/50 dark:bg-black/20 group-hover:bg-white/20 transition-colors">
        {Icon && (
          <Icon className="w-8 h-8 text-[var(--accent)] group-hover:text-white transition-colors" />
        )}
      </div>

      <h3 className="text-base font-semibold text-[var(--fg-default)] group-hover:text-white text-center leading-tight">
        {item.label}
      </h3>
    </motion.button>
  );
};
