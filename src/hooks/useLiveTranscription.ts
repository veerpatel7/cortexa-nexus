import { useState, useCallback, useRef, useEffect } from "react";

interface TranscriptEntry {
  id: string;
  speaker: string;
  text: string;
  timestamp: Date;
  isFinal: boolean;
}

interface UseLiveTranscriptionOptions {
  isEnabled: boolean;
  speakerName: string;
  onTranscript?: (entry: TranscriptEntry) => void;
  onInterimTranscript?: (text: string) => void;
}

export function useLiveTranscription({
  isEnabled,
  speakerName,
  onTranscript,
  onInterimTranscript,
}: UseLiveTranscriptionOptions) {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState("");
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
  const [isSupported, setIsSupported] = useState(true);
  
  const recognitionRef = useRef<any>(null);
  const restartTimeoutRef = useRef<NodeJS.Timeout>();

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.warn("Speech Recognition not supported in this browser");
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onend = () => {
      setIsListening(false);
      // Auto-restart if still enabled
      if (isEnabled && recognitionRef.current) {
        restartTimeoutRef.current = setTimeout(() => {
          try {
            recognition.start();
          } catch (e) {
            console.error("Failed to restart recognition:", e);
          }
        }, 100);
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === "not-allowed") {
        setIsSupported(false);
      }
    };

    recognition.onresult = (event) => {
      let interim = "";
      let finalText = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;

        if (result.isFinal) {
          finalText += transcript;
        } else {
          interim += transcript;
        }
      }

      // Update interim text
      setInterimText(interim);
      onInterimTranscript?.(interim);

      // Add final transcript
      if (finalText.trim()) {
        const entry: TranscriptEntry = {
          id: crypto.randomUUID(),
          speaker: speakerName,
          text: finalText.trim(),
          timestamp: new Date(),
          isFinal: true,
        };

        setTranscripts(prev => [...prev, entry]);
        onTranscript?.(entry);
        setInterimText("");
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
      recognition.stop();
    };
  }, [speakerName, isEnabled, onTranscript, onInterimTranscript]);

  // Start/stop based on enabled state
  useEffect(() => {
    if (!recognitionRef.current || !isSupported) return;

    if (isEnabled) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        // Already started
      }
    } else {
      recognitionRef.current.stop();
    }
  }, [isEnabled, isSupported]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || !isSupported) return;
    try {
      recognitionRef.current.start();
    } catch (e) {
      // Already started
    }
  }, [isSupported]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    recognitionRef.current.stop();
  }, []);

  const clearTranscripts = useCallback(() => {
    setTranscripts([]);
    setInterimText("");
  }, []);

  return {
    isListening,
    isSupported,
    interimText,
    transcripts,
    startListening,
    stopListening,
    clearTranscripts,
  };
}
