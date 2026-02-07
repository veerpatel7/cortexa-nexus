import { useState } from "react";
import { cn } from "@/lib/utils";
import { 
  Mic, 
  MicOff, 
  Crown, 
  Sparkles,
  MoreHorizontal,
  UserMinus,
  Hand,
  Pin,
  VolumeX
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";

// Base participant type that works with both MeetingParticipant and LocalParticipant
export interface BaseParticipant {
  id: string;
  sessionId: string;
  userName: string;
  isLocal: boolean;
  isOwner: boolean;
  isMuted: boolean;
  isVideoOn: boolean;
  isSpeaking: boolean;
  isHandRaised?: boolean; // Optional for backward compatibility
  joinedAt: Date;
}

// Role type mapping for visual styling
type RoleCategory = "engineering" | "product" | "design" | "ai" | "default";

interface RoleConfig {
  category: RoleCategory;
  accentClass: string;
  glowClass: string;
  borderClass: string;
  bgGradient: string;
}

const roleConfigs: Record<string, RoleConfig> = {
  "Engineering Lead": { 
    category: "engineering", 
    accentClass: "text-aurora-cyan",
    glowClass: "shadow-[0_0_24px_hsl(186_100%_50%/0.2)]",
    borderClass: "border-aurora-cyan/40",
    bgGradient: "from-aurora-cyan/10 to-transparent"
  },
  "Frontend Developer": { 
    category: "engineering", 
    accentClass: "text-aurora-cyan",
    glowClass: "shadow-[0_0_24px_hsl(186_100%_50%/0.2)]",
    borderClass: "border-aurora-cyan/40",
    bgGradient: "from-aurora-cyan/10 to-transparent"
  },
  "Backend Developer": { 
    category: "engineering", 
    accentClass: "text-aurora-cyan",
    glowClass: "shadow-[0_0_24px_hsl(186_100%_50%/0.2)]",
    borderClass: "border-aurora-cyan/40",
    bgGradient: "from-aurora-cyan/10 to-transparent"
  },
  "AI Engineer": { 
    category: "ai", 
    accentClass: "text-primary",
    glowClass: "shadow-[0_0_28px_hsl(var(--primary)/0.25)]",
    borderClass: "border-primary/50",
    bgGradient: "from-primary/15 to-aurora-violet/10"
  },
  "Product Manager": { 
    category: "product", 
    accentClass: "text-aurora-violet",
    glowClass: "shadow-[0_0_24px_hsl(258_90%_66%/0.2)]",
    borderClass: "border-aurora-violet/40",
    bgGradient: "from-aurora-violet/10 to-transparent"
  },
  "Program Manager": { 
    category: "product", 
    accentClass: "text-aurora-violet",
    glowClass: "shadow-[0_0_24px_hsl(258_90%_66%/0.2)]",
    borderClass: "border-aurora-violet/40",
    bgGradient: "from-aurora-violet/10 to-transparent"
  },
  "Designer": { 
    category: "design", 
    accentClass: "text-aurora-rose",
    glowClass: "shadow-[0_0_24px_hsl(345_80%_58%/0.2)]",
    borderClass: "border-aurora-rose/40",
    bgGradient: "from-aurora-rose/10 to-transparent"
  },
  "UX Designer": { 
    category: "design", 
    accentClass: "text-aurora-rose",
    glowClass: "shadow-[0_0_24px_hsl(345_80%_58%/0.2)]",
    borderClass: "border-aurora-rose/40",
    bgGradient: "from-aurora-rose/10 to-transparent"
  },
};

const defaultRoleConfig: RoleConfig = {
  category: "default",
  accentClass: "text-muted-foreground",
  glowClass: "",
  borderClass: "border-border/50",
  bgGradient: "from-surface-2/50 to-transparent"
};

function getRoleConfig(roleTitle: string): RoleConfig {
  return roleConfigs[roleTitle] || defaultRoleConfig;
}

type PresenceState = "speaking" | "listening" | "muted" | "idle";

function getPresenceState(participant: BaseParticipant): PresenceState {
  if (participant.isSpeaking && !participant.isMuted) return "speaking";
  if (participant.isMuted) return "muted";
  return "listening";
}

interface ParticipantCardProps {
  participant: BaseParticipant;
  roleTitle?: string;
  department?: string;
  isHost?: boolean;
  isAI?: boolean;
  isCurrentUserHost?: boolean;
  onMute?: () => void;
  onRemove?: () => void;
  onSpotlight?: () => void;
  className?: string;
}

export function ParticipantCard({
  participant,
  roleTitle = "Member",
  department = "",
  isHost = false,
  isAI = false,
  isCurrentUserHost = false,
  onMute,
  onRemove,
  onSpotlight,
  className,
}: ParticipantCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const roleConfig = getRoleConfig(roleTitle);
  const presenceState = getPresenceState(participant);
  const isHandRaised = participant.isHandRaised ?? false;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -8 }}
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={cn(
        "group relative rounded-xl p-3 transition-all duration-300 border",
        "bg-gradient-to-br",
        roleConfig.bgGradient,
        roleConfig.borderClass,
        presenceState === "speaking" && roleConfig.glowClass,
        isHovered && "bg-surface-2/50 shadow-elevation-2",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center gap-3">
        {/* Avatar with presence indicator */}
        <div className="relative">
          <Avatar className={cn(
            "w-10 h-10 ring-2 ring-offset-2 ring-offset-background transition-all duration-300",
            presenceState === "speaking" ? "ring-primary" : 
            presenceState === "muted" ? "ring-destructive/50" :
            "ring-transparent"
          )}>
            <AvatarFallback className={cn(
              "text-sm font-medium transition-all duration-200",
              isAI ? "bg-gradient-to-br from-primary to-aurora-violet text-primary-foreground" :
              "bg-surface-3 text-foreground"
            )}>
              {isAI ? (
                <Sparkles className="w-4 h-4" />
              ) : (
                participant.userName.charAt(0).toUpperCase()
              )}
            </AvatarFallback>
          </Avatar>

          {/* Speaking waveform indicator */}
          <AnimatePresence>
            {presenceState === "speaking" && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex items-end gap-0.5 h-3"
              >
                {[...Array(4)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-0.5 bg-primary rounded-full"
                    animate={{ height: [4, 8 + Math.random() * 4, 4] }}
                    transition={{
                      duration: 0.5,
                      repeat: Infinity,
                      delay: i * 0.1,
                    }}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mute indicator */}
          <AnimatePresence>
            {presenceState === "muted" && (
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-destructive flex items-center justify-center"
              >
                <MicOff className="w-2.5 h-2.5 text-destructive-foreground" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Hand raised indicator */}
          <AnimatePresence>
            {isHandRaised && (
              <motion.div 
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 45 }}
                transition={{ type: "spring", stiffness: 500, damping: 25 }}
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-aurora-violet flex items-center justify-center shadow-glow-violet"
              >
                <Hand className="w-3 h-3 text-white fill-current" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Name and role info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium text-foreground truncate">
              {participant.userName}
            </span>
            {participant.isLocal && (
              <span className="text-[10px] text-muted-foreground">(You)</span>
            )}
            {isHost && (
              <Tooltip>
                <TooltipTrigger>
                  <Crown className="w-3 h-3 text-aurora-violet" />
                </TooltipTrigger>
                <TooltipContent>Host</TooltipContent>
              </Tooltip>
            )}
            {isAI && (
              <motion.div 
                className="w-1.5 h-1.5 rounded-full bg-primary"
                animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
          </div>
          <p className={cn("text-xs truncate", roleConfig.accentClass)}>
            {roleTitle}
          </p>
          {department && (
            <p className="text-[10px] text-muted-foreground truncate mt-0.5">
              {department}
            </p>
          )}
        </div>

        {/* Actions (visible on hover for host) */}
        <AnimatePresence>
          {isHovered && isCurrentUserHost && !participant.isLocal && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <DropdownMenu>
                <DropdownMenuTrigger className="focus:outline-none">
                  <div className="w-6 h-6 rounded-md bg-surface-3 flex items-center justify-center hover:bg-surface-2 transition-colors">
                    <MoreHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onSpotlight && (
                    <DropdownMenuItem onClick={onSpotlight}>
                      <Pin className="w-4 h-4 mr-2" />
                      Spotlight
                    </DropdownMenuItem>
                  )}
                  {onMute && !participant.isMuted && (
                    <DropdownMenuItem onClick={onMute}>
                      <VolumeX className="w-4 h-4 mr-2" />
                      Mute
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  {onRemove && (
                    <DropdownMenuItem onClick={onRemove} className="text-destructive">
                      <UserMinus className="w-4 h-4 mr-2" />
                      Remove from meeting
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Presence state indicator line at bottom */}
      <motion.div 
        className={cn(
          "absolute bottom-0 left-2 right-2 h-0.5 rounded-full",
          presenceState === "speaking" ? "bg-primary" :
          presenceState === "listening" ? "bg-muted-foreground/30" :
          presenceState === "muted" ? "bg-destructive/50" :
          "bg-transparent"
        )}
        layoutId={`presence-${participant.id}`}
        transition={{ duration: 0.3 }}
      />
    </motion.div>
  );
}

// Compact version for sidebar/filmstrip
export function ParticipantCardCompact({
  participant,
  roleTitle = "Member",
  isAI = false,
  className,
}: Omit<ParticipantCardProps, "department" | "isHost" | "onRemove" | "onMute" | "onSpotlight" | "isCurrentUserHost">) {
  const roleConfig = getRoleConfig(roleTitle);
  const presenceState = getPresenceState(participant);
  const isHandRaised = participant.isHandRaised ?? false;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.div 
          className={cn(
            "relative p-1.5 rounded-lg transition-all duration-200",
            presenceState === "speaking" && "bg-primary/10 ring-1 ring-primary/30",
            className
          )}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Avatar className={cn(
            "w-8 h-8",
            presenceState === "speaking" && "speaker-ring"
          )}>
            <AvatarFallback className={cn(
              "text-xs font-medium",
              isAI ? "bg-gradient-to-br from-primary to-aurora-violet text-primary-foreground" :
              "bg-surface-3 text-foreground"
            )}>
              {isAI ? (
                <Sparkles className="w-3 h-3" />
              ) : (
                participant.userName.charAt(0).toUpperCase()
              )}
            </AvatarFallback>
          </Avatar>

          {participant.isMuted && (
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-destructive flex items-center justify-center"
            >
              <MicOff className="w-2 h-2 text-destructive-foreground" />
            </motion.div>
          )}

          {isHandRaised && (
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-aurora-violet flex items-center justify-center"
            >
              <Hand className="w-2 h-2 text-white fill-current" />
            </motion.div>
          )}
        </motion.div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        <p className="font-medium">{participant.userName}</p>
        <p className={cn("text-xs", roleConfig.accentClass)}>{roleTitle}</p>
        {isHandRaised && (
          <p className="text-aurora-violet">✋ Hand raised</p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
