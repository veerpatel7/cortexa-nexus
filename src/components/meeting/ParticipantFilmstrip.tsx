import { cn } from "@/lib/utils";
import { Participant } from "@/types/meeting";
import { Sparkles, Crown, Shield, Star } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ParticipantFilmstripProps {
  participants: Participant[];
  activeSpeakerId?: string;
  className?: string;
}

const authorityIcons = {
  executive: Crown,
  lead: Shield,
  senior: Star,
  member: null,
  guest: null,
};

const authorityColors = {
  executive: "bg-aurora-violet text-aurora-violet",
  lead: "bg-aurora-teal text-aurora-teal",
  senior: "bg-aurora-cyan text-aurora-cyan",
  member: "bg-muted-foreground/50 text-muted-foreground",
  guest: "bg-muted/50 text-muted",
};

export function ParticipantFilmstrip({
  participants,
  activeSpeakerId,
  className,
}: ParticipantFilmstripProps) {
  const otherParticipants = participants.filter((p) => p.id !== activeSpeakerId);

  if (otherParticipants.length === 0) return null;

  return (
    <div className={cn("flex items-center gap-2 overflow-x-auto pb-1", className)}>
      {otherParticipants.map((participant) => {
        const AuthorityIcon = authorityIcons[participant.role.authorityLevel];
        const colorClass = authorityColors[participant.role.authorityLevel];

        return (
          <Tooltip key={participant.id}>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  "shrink-0 relative rounded-xl overflow-hidden transition-all duration-200 group cursor-pointer",
                  participant.isSpeaking && "ring-2 ring-primary scale-105"
                )}
              >
                {/* Video/Avatar */}
                {participant.isVideoOn ? (
                  <div className="w-20 h-14 bg-surface-1">
                    <img
                      src={participant.avatar}
                      alt={participant.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-20 h-14 bg-surface-2 flex items-center justify-center">
                    <span className="text-sm font-medium text-foreground">
                      {participant.name.charAt(0)}
                    </span>
                  </div>
                )}

                {/* Role Indicator Dot */}
                <div
                  className={cn(
                    "absolute top-1.5 right-1.5 w-2 h-2 rounded-full transition-all",
                    colorClass.split(" ")[0],
                    "opacity-60 group-hover:opacity-100"
                  )}
                />

                {/* AI Badge */}
                {participant.isAI && (
                  <div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-gradient-to-br from-aurora-teal to-aurora-cyan flex items-center justify-center">
                    <Sparkles className="w-2.5 h-2.5 text-background" />
                  </div>
                )}

                {/* Authority Icon (on hover) */}
                {AuthorityIcon && (
                  <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className={cn(
                      "w-4 h-4 rounded-full flex items-center justify-center",
                      colorClass.split(" ")[0] + "/80"
                    )}>
                      <AuthorityIcon className={cn("w-2.5 h-2.5", colorClass.split(" ")[1])} />
                    </div>
                  </div>
                )}

                {/* Name & Speaking Indicator */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1.5">
                  <div className="flex items-center justify-center gap-1">
                    {participant.isSpeaking && !participant.isMuted && (
                      <div className="flex items-center gap-0.5">
                        <span className="w-0.5 h-2 bg-primary rounded-full animate-pulse" />
                        <span className="w-0.5 h-3 bg-primary rounded-full animate-pulse delay-75" />
                        <span className="w-0.5 h-2 bg-primary rounded-full animate-pulse delay-150" />
                      </div>
                    )}
                    <p className="text-[10px] text-white text-center truncate">
                      {participant.name.split(" ")[0]}
                    </p>
                  </div>
                </div>
              </div>
            </TooltipTrigger>

            {/* Role Card Tooltip */}
            <TooltipContent
              side="top"
              className="glass-panel border-border/50 p-3 max-w-xs"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{participant.name}</span>
                  {participant.isAI && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-aurora-teal/20 text-aurora-teal">
                      AI
                    </span>
                  )}
                  {participant.isHost && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-aurora-violet/20 text-aurora-violet">
                      Host
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {participant.role.title} • {participant.role.department}
                </div>
                <div className="flex items-center gap-1.5 pt-1">
                  {AuthorityIcon && (
                    <AuthorityIcon className={cn("w-3 h-3", colorClass.split(" ")[1])} />
                  )}
                  <span className={cn("text-[10px] capitalize", colorClass.split(" ")[1])}>
                    {participant.role.authorityLevel}
                  </span>
                </div>
                {participant.role.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
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
      })}
    </div>
  );
}
