import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  MonitorUp,
  MonitorOff,
  PhoneOff,
  Sparkles,
  MoreHorizontal,
  Hand,
  Circle,
  Square,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
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

interface MeetingControlsRealProps {
  isMuted: boolean;
  isVideoOn: boolean;
  isAIEnabled: boolean;
  isScreenSharing?: boolean;
  isRecording?: boolean;
  isHandRaised?: boolean;
  participantCount: number;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onToggleAI: () => void;
  onStartScreenShare: () => void;
  onStopScreenShare?: () => void;
  onStartRecording?: () => void;
  onStopRecording?: () => void;
  onToggleRaiseHand?: () => void;
  onEndCall: () => void;
  className?: string;
}

const buttonMotion = {
  whileHover: { scale: 1.08 },
  whileTap: { scale: 0.95 },
  transition: { type: "spring" as const, stiffness: 500, damping: 25 },
};

export function MeetingControlsReal({
  isMuted,
  isVideoOn,
  isAIEnabled,
  isScreenSharing = false,
  isRecording = false,
  isHandRaised = false,
  participantCount,
  onToggleMute,
  onToggleVideo,
  onToggleAI,
  onStartScreenShare,
  onStopScreenShare,
  onStartRecording,
  onStopRecording,
  onToggleRaiseHand,
  onEndCall,
  className,
}: MeetingControlsRealProps) {
  return (
    <motion.div 
      className={cn(
        "flex items-center gap-2 px-4 py-3 rounded-2xl glass-panel shadow-glow-lg",
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      {/* Microphone */}
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div {...buttonMotion}>
            <Button
              variant={isMuted ? "controlActive" : "control"}
              size="iconLg"
              onClick={onToggleMute}
            >
              {isMuted ? (
                <MicOff className="w-5 h-5" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </Button>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent>
          {isMuted ? "Unmute (M)" : "Mute (M)"}
        </TooltipContent>
      </Tooltip>

      {/* Camera */}
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div {...buttonMotion}>
            <Button
              variant={isVideoOn ? "control" : "controlActive"}
              size="iconLg"
              onClick={onToggleVideo}
            >
              {isVideoOn ? (
                <Video className="w-5 h-5" />
              ) : (
                <VideoOff className="w-5 h-5" />
              )}
            </Button>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent>
          {isVideoOn ? "Turn off camera (V)" : "Turn on camera (V)"}
        </TooltipContent>
      </Tooltip>

      {/* Screen Share */}
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div {...buttonMotion}>
            <Button
              variant={isScreenSharing ? "secondary" : "control"}
              size="iconLg"
              onClick={isScreenSharing ? onStopScreenShare : onStartScreenShare}
              className={cn(
                isScreenSharing && "ring-2 ring-primary/50"
              )}
            >
              {isScreenSharing ? (
                <MonitorOff className="w-5 h-5" />
              ) : (
                <MonitorUp className="w-5 h-5" />
              )}
            </Button>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent>
          {isScreenSharing ? "Stop sharing" : "Share screen (S)"}
        </TooltipContent>
      </Tooltip>

      {/* Raise Hand */}
      {onToggleRaiseHand && (
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div {...buttonMotion}>
              <Button
                variant={isHandRaised ? "secondary" : "control"}
                size="iconLg"
                onClick={onToggleRaiseHand}
                className={cn(
                  isHandRaised && "ring-2 ring-aurora-violet/50 text-aurora-violet"
                )}
              >
                <Hand className={cn(
                  "w-5 h-5",
                  isHandRaised && "fill-current"
                )} />
              </Button>
            </motion.div>
          </TooltipTrigger>
          <TooltipContent>
            {isHandRaised ? "Lower hand" : "Raise hand (H)"}
          </TooltipContent>
        </Tooltip>
      )}

      {/* Recording */}
      {(onStartRecording || onStopRecording) && (
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div {...buttonMotion}>
              <Button
                variant={isRecording ? "destructive" : "control"}
                size="iconLg"
                onClick={isRecording ? onStopRecording : onStartRecording}
                className={cn(
                  isRecording && "animate-pulse"
                )}
              >
                {isRecording ? (
                  <Square className="w-4 h-4 fill-current" />
                ) : (
                  <Circle className="w-5 h-5" />
                )}
              </Button>
            </motion.div>
          </TooltipTrigger>
          <TooltipContent>
            {isRecording ? "Stop recording" : "Start recording (R)"}
          </TooltipContent>
        </Tooltip>
      )}

      {/* AI Toggle */}
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div {...buttonMotion}>
            <Button
              variant={isAIEnabled ? "secondary" : "control"}
              size="iconLg"
              className={cn(
                "relative",
                isAIEnabled && "ring-2 ring-primary/50"
              )}
              onClick={onToggleAI}
            >
              <Sparkles className={cn(
                "w-5 h-5",
                isAIEnabled ? "text-primary" : "text-muted-foreground"
              )} />
              {isAIEnabled && (
                <motion.span 
                  className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-primary"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
            </Button>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent>
          {isAIEnabled ? "Disable AI Assistant" : "Enable AI Assistant (A)"}
        </TooltipContent>
      </Tooltip>

      {/* Divider */}
      <div className="w-px h-8 bg-border/50 mx-1" />

      {/* Participant Count */}
      <motion.div 
        className="flex items-center gap-1.5 text-sm text-muted-foreground px-2"
        whileHover={{ scale: 1.05 }}
      >
        <Users className="w-4 h-4" />
        <span>{participantCount}</span>
      </motion.div>

      {/* More Options */}
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <motion.div {...buttonMotion}>
                <Button
                  variant="control"
                  size="iconLg"
                >
                  <MoreHorizontal className="w-5 h-5" />
                </Button>
              </motion.div>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>More options</TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="center" className="w-48">
          <DropdownMenuItem onClick={onToggleAI}>
            <Sparkles className="w-4 h-4 mr-2" />
            {isAIEnabled ? "Disable" : "Enable"} AI Assistant
          </DropdownMenuItem>
          {onStartRecording && !isRecording && (
            <DropdownMenuItem onClick={onStartRecording}>
              <Circle className="w-4 h-4 mr-2" />
              Start Recording
            </DropdownMenuItem>
          )}
          {onStopRecording && isRecording && (
            <DropdownMenuItem onClick={onStopRecording}>
              <Square className="w-4 h-4 mr-2 fill-current" />
              Stop Recording
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive" onClick={onEndCall}>
            <PhoneOff className="w-4 h-4 mr-2" />
            Leave Meeting
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Divider */}
      <div className="w-px h-8 bg-border/50 mx-1" />

      {/* End Call */}
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant="destructive"
              size="lg"
              className="w-14 h-12 rounded-full"
              onClick={onEndCall}
            >
              <PhoneOff className="w-5 h-5" />
            </Button>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent>Leave meeting</TooltipContent>
      </Tooltip>
    </motion.div>
  );
}
