import { cn } from "@/lib/utils";
import { Participant } from "@/types/meeting";
import { Mic, MicOff, Video, VideoOff, Sparkles } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface ParticipantAvatarProps {
  participant: Participant;
  size?: "sm" | "md" | "lg" | "xl";
  showControls?: boolean;
  showRole?: boolean;
  onClick?: () => void;
}

const sizeClasses = {
  sm: "w-10 h-10",
  md: "w-14 h-14",
  lg: "w-20 h-20",
  xl: "w-32 h-32",
};

const ringClasses = {
  sm: "ring-2",
  md: "ring-2",
  lg: "ring-[3px]",
  xl: "ring-4",
};

export function ParticipantAvatar({
  participant,
  size = "md",
  showControls = true,
  showRole = false,
  onClick,
}: ParticipantAvatarProps) {
  const authorityColors = {
    executive: "from-aurora-violet to-aurora-rose",
    lead: "from-aurora-teal to-aurora-cyan",
    senior: "from-aurora-cyan to-aurora-teal",
    member: "from-muted-foreground/50 to-muted-foreground/30",
    guest: "from-muted/50 to-muted/30",
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            "relative group cursor-pointer transition-transform duration-200 hover:scale-105",
            onClick && "cursor-pointer"
          )}
          onClick={onClick}
        >
          {/* Avatar Container */}
          <div
            className={cn(
              "relative rounded-full overflow-hidden",
              sizeClasses[size],
              participant.isSpeaking && ringClasses[size],
              participant.isSpeaking && "ring-aurora-teal speaker-ring",
              participant.isAI && "ai-pulse"
            )}
          >
            {/* Avatar Image */}
            <img
              src={participant.avatar}
              alt={participant.name}
              className="w-full h-full object-cover"
            />

            {/* AI Overlay */}
            {participant.isAI && (
              <div className="absolute inset-0 bg-gradient-to-br from-aurora-teal/20 to-aurora-violet/20 flex items-center justify-center">
                <Sparkles className="w-1/3 h-1/3 text-aurora-teal" />
              </div>
            )}

            {/* Muted/Video Off Overlay */}
            {!participant.isVideoOn && !participant.isAI && (
              <div className="absolute inset-0 bg-surface-2 flex items-center justify-center">
                <span className="text-xl font-semibold text-foreground">
                  {participant.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Authority Ring Indicator */}
          <div
            className={cn(
              "absolute -inset-0.5 rounded-full bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity -z-10 blur-sm",
              authorityColors[participant.role.authorityLevel]
            )}
          />

          {/* Status Indicators */}
          {showControls && (
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
              <div
                className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center",
                  participant.isMuted
                    ? "bg-destructive/90"
                    : "bg-surface-3/90"
                )}
              >
                {participant.isMuted ? (
                  <MicOff className="w-3 h-3 text-destructive-foreground" />
                ) : (
                  <Mic className="w-3 h-3 text-aurora-teal" />
                )}
              </div>
            </div>
          )}

          {/* Host Badge */}
          {participant.isHost && (
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-aurora-violet flex items-center justify-center">
              <span className="text-[10px] font-bold text-background">H</span>
            </div>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        className="glass-panel border-border/50 p-3 max-w-xs"
      >
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-medium">{participant.name}</span>
            {participant.isAI && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-aurora-teal/20 text-aurora-teal">
                AI
              </span>
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            {participant.role.title} • {participant.role.department}
          </div>
          {showRole && (
            <div className="flex flex-wrap gap-1 mt-2">
              {participant.role.skills.slice(0, 3).map((skill) => (
                <span
                  key={skill}
                  className="text-[10px] px-1.5 py-0.5 rounded-full bg-surface-3 text-muted-foreground"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
