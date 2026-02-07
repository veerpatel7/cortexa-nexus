import { cn } from "@/lib/utils";
import { Brain, Mic, CheckCircle2 } from "lucide-react";
import novaAiLogo from "@/assets/nova-ai-logo.png";

interface AIParticipantCardProps {
  isListening?: boolean;
  isProcessing?: boolean;
  lastInsight?: string;
  className?: string;
}

export function AIParticipantCard({
  isListening = true,
  isProcessing = false,
  lastInsight,
  className,
}: AIParticipantCardProps) {
  return (
    <div
      className={cn(
        "relative rounded-xl overflow-hidden bg-gradient-to-br from-surface-1 to-surface-2 border border-primary/20 p-4 transition-all duration-300",
        isProcessing && "shadow-glow-md",
        className
      )}
    >
      {/* AI Avatar */}
      <div className="flex items-start gap-3">
        <div className={cn(
          "w-12 h-12 rounded-xl overflow-hidden shrink-0",
          (isListening || isProcessing) && "ai-pulse"
        )}>
          <img src={novaAiLogo} alt="Nova AI" className="w-full h-full object-cover" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground">Nova AI</span>
            <span className="px-1.5 py-0.5 rounded-full bg-aurora-teal/20 text-aurora-teal text-[10px]">
              AI
            </span>
          </div>
          
          <div className="flex items-center gap-1.5 mt-1">
            {isProcessing ? (
              <>
                <Brain className="w-3 h-3 text-aurora-violet animate-pulse" />
                <span className="text-xs text-aurora-violet">Analyzing...</span>
              </>
            ) : isListening ? (
              <>
                <Mic className="w-3 h-3 text-primary" />
                <span className="text-xs text-muted-foreground">Listening</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Ready</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Last Insight */}
      {lastInsight && (
        <div className="mt-3 p-2 rounded-lg bg-surface-2/50 border-l-2 border-l-primary">
          <p className="text-xs text-muted-foreground italic line-clamp-2">
            "{lastInsight}"
          </p>
        </div>
      )}

      {/* Listening Animation */}
      {isListening && (
        <div className="absolute top-2 right-2 flex items-center gap-0.5">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="w-0.5 bg-primary rounded-full"
              style={{
                height: "6px",
                animation: `audio-wave 0.6s ease-in-out infinite`,
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
