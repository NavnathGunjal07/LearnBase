import { useState, useCallback } from "react";

export interface VisualizerData {
  html: string;
  css: string;
  js: string;
  isSingleFile?: boolean;
}

export const useVisualizer = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [visualizerData, setVisualizerData] = useState<VisualizerData | null>(
    null
  );

  const openVisualizer = useCallback((data: VisualizerData) => {
    setVisualizerData(data);
    setIsOpen(true);
  }, []);

  const closeVisualizer = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggleVisualizer = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return {
    isOpen,
    visualizerData,
    openVisualizer,
    closeVisualizer,
    toggleVisualizer,
  };
};
