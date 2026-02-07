import { useState, useEffect, useCallback, useRef } from "react";

interface UsePushToTalkOptions {
  isEnabled: boolean;
  key?: string; // Default: Space
  onActivate?: () => void;
  onDeactivate?: () => void;
}

export function usePushToTalk({
  isEnabled,
  key = " ", // Space key
  onActivate,
  onDeactivate,
}: UsePushToTalkOptions) {
  const [isPressed, setIsPressed] = useState(false);
  const [isPTTMode, setIsPTTMode] = useState(false);
  const wasPressed = useRef(false);

  useEffect(() => {
    if (!isEnabled || !isPTTMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if in input field
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === key && !wasPressed.current) {
        e.preventDefault();
        wasPressed.current = true;
        setIsPressed(true);
        onActivate?.();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === key && wasPressed.current) {
        e.preventDefault();
        wasPressed.current = false;
        setIsPressed(false);
        onDeactivate?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isEnabled, isPTTMode, key, onActivate, onDeactivate]);

  const togglePTTMode = useCallback(() => {
    setIsPTTMode(prev => !prev);
  }, []);

  const enablePTTMode = useCallback(() => {
    setIsPTTMode(true);
  }, []);

  const disablePTTMode = useCallback(() => {
    setIsPTTMode(false);
    setIsPressed(false);
    wasPressed.current = false;
  }, []);

  return {
    isPressed,
    isPTTMode,
    togglePTTMode,
    enablePTTMode,
    disablePTTMode,
  };
}
