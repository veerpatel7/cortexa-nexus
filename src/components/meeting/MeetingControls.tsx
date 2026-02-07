import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  Hand,
  PhoneOff,
  Captions,
  Circle,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface MeetingControlsProps {
  isMuted: boolean;
  isVideoOn: boolean;
  isScreenSharing: boolean;
  isHandRaised: boolean;
  isCaptionsOn: boolean;
  isRecording: boolean;
  participantCount: number;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onToggleHand: () => void;
  onToggleCaptions: () => void;
  onToggleRecording: () => void;
  onOpenChat: () => void;
  onOpenParticipants: () => void;
  onEndCall: () => void;
  className?: string;
}

export function MeetingControls({
  isMuted,
  isVideoOn,
  isScreenSharing,
  isHandRaised,
  isCaptionsOn,
  isRecording,
  onToggleMute,
  onToggleVideo,
  onToggleScreenShare,
  onToggleHand,
  onToggleCaptions,
  onToggleRecording,
  onEndCall,
  className,
}: MeetingControlsProps) {
  return (
    <div
      className={cn(
        "glass-panel rounded-2xl px-3 py-2 flex items-center gap-1",
        className
      )}
    >
      {/* Primary Controls */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isMuted ? "controlActive" : "control"}
            size="icon"
            onClick={onToggleMute}
          >
            {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{isMuted ? "Unmute" : "Mute"}</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={!isVideoOn ? "controlActive" : "control"}
            size="icon"
            onClick={onToggleVideo}
          >
            {isVideoOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{isVideoOn ? "Turn off camera" : "Turn on camera"}</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isScreenSharing ? "aurora" : "control"}
            size="icon"
            onClick={onToggleScreenShare}
          >
            <Monitor className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{isScreenSharing ? "Stop sharing" : "Share screen"}</TooltipContent>
      </Tooltip>

      <div className="w-px h-6 bg-border/50 mx-1" />

      {/* Secondary Controls */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isHandRaised ? "secondary" : "control"}
            size="icon"
            onClick={onToggleHand}
          >
            <Hand className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{isHandRaised ? "Lower hand" : "Raise hand"}</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isCaptionsOn ? "secondary" : "control"}
            size="icon"
            onClick={onToggleCaptions}
          >
            <Captions className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{isCaptionsOn ? "Hide captions" : "Show captions"}</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="control"
            size="icon"
            onClick={onToggleRecording}
            className={cn(isRecording && "text-destructive")}
          >
            <Circle className={cn("w-4 h-4", isRecording && "fill-current animate-pulse")} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{isRecording ? "Stop recording" : "Start recording"}</TooltipContent>
      </Tooltip>

      <div className="w-px h-6 bg-border/50 mx-1" />

      {/* End Call */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="destructive"
            size="default"
            onClick={onEndCall}
            className="px-4"
          >
            <PhoneOff className="w-4 h-4 mr-1.5" />
            End
          </Button>
        </TooltipTrigger>
        <TooltipContent>Leave meeting</TooltipContent>
      </Tooltip>
    </div>
  );
}
