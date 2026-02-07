import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { MeetingParticipant } from "@/hooks/useDailyMeeting";
import { Sparkles, Mic, MicOff, Crown, Shield, Star, Volume2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Role-based accent colors
const roleAccents: Record<string, string> = {
  "Engineering Lead": "from-aurora-cyan/20 to-aurora-cyan/5",
  "Frontend Developer": "from-aurora-cyan/20 to-aurora-cyan/5",
  "Backend Developer": "from-aurora-cyan/20 to-aurora-cyan/5",
  "AI Engineer": "from-primary/20 to-aurora-violet/10",
  "Product Manager": "from-aurora-violet/20 to-aurora-violet/5",
  "UX Designer": "from-aurora-rose/20 to-aurora-rose/5",
  "Designer": "from-aurora-rose/20 to-aurora-rose/5",
};

interface VideoTileProps {
  participant: MeetingParticipant;
  isActive?: boolean;
  size?: "sm" | "md" | "lg";
  showName?: boolean;
  roleTitle?: string;
  className?: string;
}

export function VideoTile({
  participant,
  isActive = false,
  size = "md",
  showName = true,
  roleTitle = "Member",
  className,
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const roleAccent = roleAccents[roleTitle] || "from-surface-2/50 to-transparent";

  // Attach video track
  useEffect(() => {
    if (videoRef.current && participant.videoTrack) {
      const stream = new MediaStream([participant.videoTrack]);
      videoRef.current.srcObject = stream;
    } else if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [participant.videoTrack]);

  const sizeClasses = {
    sm: "w-20 h-14",
    md: "w-40 h-28",
    lg: "flex-1 min-h-0",
  };

  return (
    <div
      className={cn(
        "relative rounded-xl overflow-hidden bg-surface-1 transition-all duration-300 group",
        sizeClasses[size],
        isActive && "ring-2 ring-primary shadow-glow-sm",
        participant.isSpeaking && !participant.isMuted && "ring-2 ring-aurora-teal shadow-[0_0_30px_hsl(168_76%_50%/0.2)]",
        className
      )}
    >
      {/* Video or Avatar */}
      {participant.isVideoOn && participant.videoTrack ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={participant.isLocal}
          className={cn(
            "w-full h-full object-cover",
            participant.isLocal && "transform -scale-x-100"
          )}
        />
      ) : (
        <div className={cn(
          "absolute inset-0 flex items-center justify-center bg-gradient-to-br",
          roleAccent
        )}>
          <div className={cn(
            "rounded-full bg-surface-3/80 backdrop-blur-sm flex items-center justify-center transition-all duration-300",
            size === "sm" ? "w-8 h-8" : size === "md" ? "w-12 h-12" : "w-24 h-24",
            participant.isSpeaking && !participant.isMuted && "speaker-ring"
          )}>
            <span className={cn(
              "font-semibold text-foreground",
              size === "sm" ? "text-xs" : size === "md" ? "text-lg" : "text-3xl"
            )}>
              {participant.userName.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>
      )}

      {/* Speaking Indicator Wave - Top Right */}
      {participant.isSpeaking && !participant.isMuted && (
        <div className="absolute top-2 right-2 flex items-end gap-0.5 h-4 px-2 py-1 rounded-full bg-surface-0/70 backdrop-blur-sm">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="w-0.5 bg-primary rounded-full"
              style={{
                height: `${4 + Math.random() * 10}px`,
                animation: `waveform-bar 0.5s ease-in-out infinite`,
                animationDelay: `${i * 80}ms`,
              }}
            />
          ))}
        </div>
      )}

      {/* Mute Indicator */}
      {participant.isMuted && (
        <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-destructive/90 backdrop-blur-sm flex items-center justify-center">
          <MicOff className="w-3.5 h-3.5 text-destructive-foreground" />
        </div>
      )}

      {/* Gradient overlay for name */}
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Name Badge - Enhanced */}
      {showName && (
        <div className="absolute bottom-0 left-0 right-0 p-2.5 transition-all duration-300">
          <div className="flex items-center gap-1.5">
            {participant.isOwner && (
              <Tooltip>
                <TooltipTrigger>
                  <Crown className="w-3 h-3 text-aurora-violet" />
                </TooltipTrigger>
                <TooltipContent>Host</TooltipContent>
              </Tooltip>
            )}
            <span className="text-xs text-white font-medium truncate drop-shadow-md">
              {participant.userName}
              {participant.isLocal && " (You)"}
            </span>
          </div>
          {roleTitle && roleTitle !== "Member" && (
            <span className="text-[10px] text-white/70 truncate drop-shadow-sm">
              {roleTitle}
            </span>
          )}
        </div>
      )}

      {/* Waveform animation keyframes */}
      <style>{`
        @keyframes waveform-bar {
          0%, 100% { 
            height: 4px; 
            opacity: 0.6;
          }
          50% { 
            height: 14px; 
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
