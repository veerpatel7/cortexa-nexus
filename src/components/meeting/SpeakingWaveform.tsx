import { cn } from "@/lib/utils";

interface SpeakingWaveformProps {
  isActive: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function SpeakingWaveform({ 
  isActive, 
  size = "md",
  className 
}: SpeakingWaveformProps) {
  const barCount = size === "sm" ? 3 : size === "md" ? 4 : 5;
  
  const sizeConfig = {
    sm: { gap: "gap-0.5", width: "w-0.5", maxHeight: 8 },
    md: { gap: "gap-0.5", width: "w-0.5", maxHeight: 12 },
    lg: { gap: "gap-1", width: "w-1", maxHeight: 16 },
  };

  const config = sizeConfig[size];

  if (!isActive) return null;

  return (
    <div 
      className={cn(
        "flex items-end", 
        config.gap,
        className
      )}
      style={{ height: config.maxHeight }}
    >
      {[...Array(barCount)].map((_, i) => (
        <div
          key={i}
          className={cn(
            config.width,
            "bg-primary rounded-full transition-all"
          )}
          style={{
            height: `${20 + Math.random() * 80}%`,
            animation: `waveform-bar 0.5s ease-in-out infinite`,
            animationDelay: `${i * 80}ms`,
          }}
        />
      ))}
      <style>{`
        @keyframes waveform-bar {
          0%, 100% { 
            height: 20%; 
            opacity: 0.6;
          }
          50% { 
            height: 100%; 
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

// Audio level bar indicator
interface AudioLevelBarProps {
  level: number; // 0-1
  className?: string;
}

export function AudioLevelBar({ level, className }: AudioLevelBarProps) {
  const normalizedLevel = Math.min(Math.max(level, 0), 1);
  
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div className="w-16 h-1 bg-surface-3 rounded-full overflow-hidden">
        <div 
          className={cn(
            "h-full rounded-full transition-all duration-75",
            normalizedLevel > 0.7 ? "bg-aurora-rose" :
            normalizedLevel > 0.3 ? "bg-primary" :
            "bg-muted-foreground"
          )}
          style={{ width: `${normalizedLevel * 100}%` }}
        />
      </div>
    </div>
  );
}

// Circular audio visualizer (for AI participant)
interface AudioVisualizerCircleProps {
  isActive: boolean;
  isProcessing?: boolean;
  className?: string;
}

export function AudioVisualizerCircle({
  isActive,
  isProcessing = false,
  className,
}: AudioVisualizerCircleProps) {
  return (
    <div className={cn("relative", className)}>
      {/* Outer glow ring */}
      <div className={cn(
        "absolute inset-0 rounded-full transition-all duration-500",
        isActive && "animate-pulse",
        isProcessing && "bg-primary/20"
      )} />
      
      {/* Animated rings */}
      {isActive && (
        <>
          <div 
            className="absolute inset-[-4px] rounded-full border border-primary/30"
            style={{
              animation: "ring-pulse 2s ease-in-out infinite",
            }}
          />
          <div 
            className="absolute inset-[-8px] rounded-full border border-primary/20"
            style={{
              animation: "ring-pulse 2s ease-in-out infinite 0.5s",
            }}
          />
        </>
      )}
      
      <style>{`
        @keyframes ring-pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.5;
          }
          50% {
            transform: scale(1.05);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
