import { useEffect, useCallback } from "react";

interface KeyboardShortcutHandlers {
  onToggleMute?: () => void;
  onToggleVideo?: () => void;
  onToggleScreenShare?: () => void;
  onToggleRaiseHand?: () => void;
  onToggleAI?: () => void;
  onToggleRecording?: () => void;
  onToggleChat?: () => void;
  onToggleParticipants?: () => void;
  onEndCall?: () => void;
}

/**
 * Hook to handle keyboard shortcuts in the meeting room
 * Supports standard meeting shortcuts like M for mute, V for video, etc.
 */
export function useKeyboardShortcuts({
  onToggleMute,
  onToggleVideo,
  onToggleScreenShare,
  onToggleRaiseHand,
  onToggleAI,
  onToggleRecording,
  onToggleChat,
  onToggleParticipants,
  onEndCall,
}: KeyboardShortcutHandlers) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      // Handle shortcuts
      switch (event.key.toLowerCase()) {
        case "m":
          event.preventDefault();
          onToggleMute?.();
          break;
        case "v":
          event.preventDefault();
          onToggleVideo?.();
          break;
        case "s":
          event.preventDefault();
          onToggleScreenShare?.();
          break;
        case "h":
          event.preventDefault();
          onToggleRaiseHand?.();
          break;
        case "a":
          event.preventDefault();
          onToggleAI?.();
          break;
        case "r":
          event.preventDefault();
          onToggleRecording?.();
          break;
        case "c":
          event.preventDefault();
          onToggleChat?.();
          break;
        case "p":
          event.preventDefault();
          onToggleParticipants?.();
          break;
        case "escape":
          // End call with Cmd/Ctrl + Escape
          if (event.metaKey || event.ctrlKey) {
            event.preventDefault();
            onEndCall?.();
          }
          break;
      }
    },
    [
      onToggleMute,
      onToggleVideo,
      onToggleScreenShare,
      onToggleRaiseHand,
      onToggleAI,
      onToggleRecording,
      onToggleChat,
      onToggleParticipants,
      onEndCall,
    ]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
