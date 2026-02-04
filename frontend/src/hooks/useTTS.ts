import { useState, useEffect, useRef, useCallback } from "react";

export interface TTSSettings {
  enabled: boolean;
  autoPlay: boolean;
  voice: string | null;
  rate: number; // 0.5 to 2
  pitch: number; // 0 to 2
  volume: number; // 0 to 1
}

const DEFAULT_SETTINGS: TTSSettings = {
  enabled: true,
  autoPlay: false,
  voice: null,
  rate: 1.0,
  pitch: 1.0,
  volume: 1.0,
};

const SETTINGS_KEY = "learnbase_tts_settings";

export const useTTS = () => {
  const [settings, setSettings] = useState<TTSSettings>(() => {
    const saved = localStorage.getItem(SETTINGS_KEY);
    return saved
      ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) }
      : DEFAULT_SETTINGS;
  });

  const [isSupported, setIsSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<
    SpeechSynthesisVoice[]
  >([]);
  const [currentText, setCurrentText] = useState<string>("");

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Check if speech synthesis is supported
  useEffect(() => {
    const supported = "speechSynthesis" in window;
    setIsSupported(supported);

    if (supported) {
      // Load voices
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        setAvailableVoices(voices);

        // Set default voice if not already set
        if (!settings.voice && voices.length > 0) {
          // Try to find an English voice
          const englishVoice =
            voices.find((v) => v.lang.startsWith("en")) || voices[0];
          setSettings((prev) => ({ ...prev, voice: englishVoice.name }));
        }
      };

      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  const cleanText = useCallback((text: string): string => {
    // Remove markdown code blocks
    let cleaned = text.replace(/```[\s\S]*?```/g, "");

    // Remove inline code
    cleaned = cleaned.replace(/`[^`]+`/g, "");

    // Remove markdown links but keep the text
    cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

    // Remove markdown headings markers
    cleaned = cleaned.replace(/^#{1,6}\s+/gm, "");

    // Remove markdown bold/italic
    cleaned = cleaned.replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, "$1");

    // Remove URLs
    cleaned = cleaned.replace(/https?:\/\/[^\s]+/g, "");

    // Clean up extra whitespace
    cleaned = cleaned.replace(/\s+/g, " ").trim();

    return cleaned;
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!isSupported || !settings.enabled || !text) return;

      // Stop any current speech
      window.speechSynthesis.cancel();

      const cleanedText = cleanText(text);
      if (!cleanedText) return;

      const utterance = new SpeechSynthesisUtterance(cleanedText);

      // Apply settings
      utterance.rate = settings.rate;
      utterance.pitch = settings.pitch;
      utterance.volume = settings.volume;

      // Set voice
      if (settings.voice) {
        const voice = availableVoices.find((v) => v.name === settings.voice);
        if (voice) {
          utterance.voice = voice;
        }
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
        setIsPaused(false);
        setCurrentText(cleanedText);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setIsPaused(false);
        setCurrentText("");
        utteranceRef.current = null;
      };

      utterance.onerror = (event) => {
        console.error("Speech synthesis error:", event);
        setIsSpeaking(false);
        setIsPaused(false);
        setCurrentText("");
        utteranceRef.current = null;
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [isSupported, settings, availableVoices, cleanText]
  );

  const pause = useCallback(() => {
    if (isSupported && isSpeaking && !isPaused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  }, [isSupported, isSpeaking, isPaused]);

  const resume = useCallback(() => {
    if (isSupported && isSpeaking && isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  }, [isSupported, isSpeaking, isPaused]);

  const stop = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
      setCurrentText("");
      utteranceRef.current = null;
    }
  }, [isSupported]);

  const updateSettings = useCallback((newSettings: Partial<TTSSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  return {
    isSupported,
    isSpeaking,
    isPaused,
    currentText,
    settings,
    availableVoices,
    speak,
    pause,
    resume,
    stop,
    updateSettings,
  };
};
