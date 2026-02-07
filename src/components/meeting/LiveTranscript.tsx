import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mic, Sparkles } from "lucide-react";

interface TranscriptEntry {
  id: string;
  speaker: string;
  text: string;
  timestamp: Date;
  isFinal: boolean;
}

interface LiveTranscriptProps {
  transcripts: TranscriptEntry[];
  interimText?: string;
  currentSpeaker?: string;
  isAIProcessing?: boolean;
  className?: string;
}

export function LiveTranscript({
  transcripts,
  interimText,
  currentSpeaker = "You",
  isAIProcessing,
  className,
}: LiveTranscriptProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcripts, interimText]);

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Mic className="w-4 h-4 text-primary" />
            {(interimText || transcripts.length > 0) && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-aurora-teal animate-pulse" />
            )}
          </div>
          <span className="text-sm font-medium text-foreground">Live Transcript</span>
        </div>
        {isAIProcessing && (
          <div className="flex items-center gap-1.5 text-xs text-primary">
            <Sparkles className="w-3 h-3 animate-pulse" />
            <span>AI analyzing...</span>
          </div>
        )}
      </div>

      {/* Transcript content */}
      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="p-3 space-y-2">
          {transcripts.length === 0 && !interimText ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <Mic className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>Listening for speech...</p>
              <p className="text-xs mt-1">Start talking to see live transcription</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {transcripts.map((entry) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="group"
                >
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-medium text-primary shrink-0 pt-0.5">
                      {entry.speaker}:
                    </span>
                    <p className="text-sm text-foreground leading-relaxed">
                      {entry.text}
                    </p>
                  </div>
                  <span className="text-[10px] text-muted-foreground ml-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    {entry.timestamp.toLocaleTimeString()}
                  </span>
                </motion.div>
              ))}

              {/* Interim (live) text */}
              {interimText && (
                <motion.div
                  key="interim"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-start gap-2"
                >
                  <span className="text-xs font-medium text-primary shrink-0 pt-0.5">
                    {currentSpeaker}:
                  </span>
                  <p className="text-sm text-muted-foreground italic leading-relaxed">
                    {interimText}
                    <span className="inline-block w-1.5 h-4 bg-primary/50 ml-0.5 animate-pulse" />
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
