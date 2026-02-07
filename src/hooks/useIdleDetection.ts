import { useState, useEffect, useCallback } from "react";

interface UseIdleDetectionOptions {
  timeout?: number; // ms before considering idle
  onIdle?: () => void;
  onActive?: () => void;
}

/**
 * Hook to detect user idle state based on mouse/keyboard activity
 * Used to auto-hide meeting controls for a "calm" UX
 */
export function useIdleDetection({
  timeout = 4000,
  onIdle,
  onActive,
}: UseIdleDetectionOptions = {}) {
  const [isIdle, setIsIdle] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());

  const handleActivity = useCallback(() => {
    setLastActivity(Date.now());
    if (isIdle) {
      setIsIdle(false);
      onActive?.();
    }
  }, [isIdle, onActive]);

  useEffect(() => {
    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"];
    
    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [handleActivity]);

  useEffect(() => {
    const checkIdle = () => {
      const now = Date.now();
      if (now - lastActivity >= timeout && !isIdle) {
        setIsIdle(true);
        onIdle?.();
      }
    };

    const interval = setInterval(checkIdle, 500);
    return () => clearInterval(interval);
  }, [lastActivity, timeout, isIdle, onIdle]);

  const resetIdle = useCallback(() => {
    setLastActivity(Date.now());
    setIsIdle(false);
  }, []);

  return {
    isIdle,
    resetIdle,
    lastActivity,
  };
}
