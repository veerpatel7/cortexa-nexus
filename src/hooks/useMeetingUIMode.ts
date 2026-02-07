import { useState, useCallback, useEffect } from "react";
import { MeetingUIMode, MeetingState } from "@/types/meeting";

interface UseMeetingUIModeProps {
  state: MeetingState;
  elapsedTime: number;
}

interface AIMessage {
  id: string;
  message: string;
  type: 'info' | 'suggestion' | 'decision';
  timestamp: Date;
}

export function useMeetingUIMode({ state, elapsedTime }: UseMeetingUIModeProps) {
  const [mode, setMode] = useState<MeetingUIMode>("focus");
  const [isLeftPanelVisible, setIsLeftPanelVisible] = useState(false);
  const [isRightPanelVisible, setIsRightPanelVisible] = useState(false);
  const [aiMessage, setAiMessage] = useState<AIMessage | null>(null);

  // Simulate AI-driven mode transitions based on meeting state
  useEffect(() => {
    // After 10 seconds, transition to guided mode (agenda becomes relevant)
    if (elapsedTime === 10 && mode === "focus") {
      transitionTo("guided", "Let's review the agenda for today's meeting.");
    }
    
    // After 30 seconds or when decisions exist, show decision mode
    if (elapsedTime === 30 && mode === "guided") {
      transitionTo("decision", "I'm detecting decision points forming.");
    }
    
    // If meeting is ending (e.g., > 2 minutes for demo), show review
    if (elapsedTime === 120 && mode !== "review") {
      transitionTo("review", "Let's summarize what we've accomplished.");
    }
  }, [elapsedTime, mode]);

  // Update panel visibility based on mode
  useEffect(() => {
    switch (mode) {
      case "focus":
        setIsLeftPanelVisible(false);
        setIsRightPanelVisible(false);
        break;
      case "guided":
        setIsLeftPanelVisible(true);
        setIsRightPanelVisible(false);
        break;
      case "decision":
        setIsLeftPanelVisible(false);
        setIsRightPanelVisible(true);
        break;
      case "review":
        setIsLeftPanelVisible(true);
        setIsRightPanelVisible(true);
        break;
    }
  }, [mode]);

  const transitionTo = useCallback((newMode: MeetingUIMode, message?: string) => {
    setMode(newMode);
    if (message) {
      setAiMessage({
        id: crypto.randomUUID(),
        message,
        type: newMode === "decision" ? "decision" : "info",
        timestamp: new Date(),
      });
      // Auto-dismiss AI message after 4 seconds
      setTimeout(() => setAiMessage(null), 4000);
    }
  }, []);

  const toggleLeftPanel = useCallback(() => {
    setIsLeftPanelVisible((prev) => !prev);
  }, []);

  const toggleRightPanel = useCallback(() => {
    setIsRightPanelVisible((prev) => !prev);
  }, []);

  const dismissAiMessage = useCallback(() => {
    setAiMessage(null);
  }, []);

  const getModeLabel = (m: MeetingUIMode): string => {
    switch (m) {
      case "focus": return "Focus";
      case "guided": return "Guided";
      case "decision": return "Decisions";
      case "review": return "Review";
    }
  };

  return {
    mode,
    setMode: transitionTo,
    isLeftPanelVisible,
    isRightPanelVisible,
    toggleLeftPanel,
    toggleRightPanel,
    aiMessage,
    dismissAiMessage,
    getModeLabel,
  };
}
