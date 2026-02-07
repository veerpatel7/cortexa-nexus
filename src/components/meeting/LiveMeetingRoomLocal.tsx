import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useRealtimeMeeting, RealtimeParticipant } from "@/hooks/useRealtimeMeeting";
import { useRealtimePresence } from "@/hooks/useRealtimePresence";
import { useMeetingAI } from "@/hooks/useMeetingAI";
import { useLiveTranscription } from "@/hooks/useLiveTranscription";
import { usePushToTalk } from "@/hooks/usePushToTalk";
import { useIdleDetection } from "@/hooks/useIdleDetection";
import { useLocalRecording } from "@/hooks/useLocalRecording";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useFloatingReactions } from "@/hooks/useFloatingReactions";
import { AIParticipantCard } from "./AIParticipantCard";
import { MeetingControlsReal } from "./MeetingControlsReal";
import { FloatingControls } from "./FloatingControls";
import { FloatingReactions } from "./FloatingReactions";
import { ReactionPicker } from "./ReactionPicker";
import { ReactionActivityFeed } from "./ReactionActivityFeed";
import { ChatPanel } from "./ChatPanel";
import { DecisionCapture } from "./DecisionCapture";
import { ParticipantsList } from "./ParticipantsList";
import { LiveParticipantsList } from "./LiveParticipantsList";
import { ParticipantJoinNotification } from "./ParticipantJoinNotification";
import { InviteModal } from "./InviteModal";
import { LiveTranscript } from "./LiveTranscript";
import { AINudge } from "./AIInsightCard";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useMeetingChat } from "@/hooks/useMeetingChat";
import { NetworkQualityIndicator } from "./NetworkQualityIndicator";
import { RecordingIndicator } from "./RecordingIndicator";
import { HostAdmitPanel } from "./HostAdmitPanel";
import { Meeting } from "@/types/meeting";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock, 
  MessageSquare, 
  Target,
  X,
  LayoutGrid,
  User,
  Users,
  UserPlus,
  Mic,
  Radio,
  MonitorOff,
  Pin,
  PinOff,
  Keyboard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface LiveMeetingRoomLocalProps {
  meeting: Meeting;
  userId: string;
  userName: string;
  isHost: boolean;
  localMeeting: ReturnType<typeof useRealtimeMeeting>;
  onEndMeeting: () => void;
  className?: string;
}

type LayoutMode = "grid" | "speaker" | "spotlight";
type SidePanel = "none" | "chat" | "decisions" | "participants" | "transcript" | "reactions";

export function LiveMeetingRoomLocal({
  meeting,
  userId,
  userName,
  isHost,
  localMeeting,
  onEndMeeting,
  className,
}: LiveMeetingRoomLocalProps) {
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("speaker");
  const [activePanel, setActivePanel] = useState<SidePanel>("none");
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isAIEnabled, setIsAIEnabled] = useState(true);
  const [currentAgendaIndex, setCurrentAgendaIndex] = useState(0);
  const [showInvite, setShowInvite] = useState(false);
  const [aiNudge, setAiNudge] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(true);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const screenShareRef = useRef<HTMLVideoElement>(null);

  const {
    participants,
    localParticipant,
    waitingParticipants,
    activeSpeakerId,
    spotlightedId,
    isJoined,
    isScreenSharing,
    localStream,
    screenStream,
    toggleMicrophone,
    toggleCamera,
    startScreenShare,
    stopScreenShare,
    toggleRaiseHand,
    lowerAllHands,
    muteParticipant,
    muteAll,
    removeParticipant,
    setSpotlight,
    admitParticipant,
    denyParticipant,
    admitAll,
    denyAll,
    leaveMeeting,
  } = localMeeting;

  // Auto-hide controls on idle
  const { isIdle, resetIdle } = useIdleDetection({ timeout: 4000 });

  // Recording hook
  const recording = useLocalRecording({
    onRecordingStarted: () => {
      chat.addRecordingMessage(true);
      toast.success("Recording started");
    },
    onRecordingStopped: () => {
      chat.addRecordingMessage(false);
      toast.info("Recording saved");
    },
  });

  // Chat hook
  const chat = useMeetingChat();

  // Floating reactions hook - with current user info for avatars and realtime sync
  const currentReactionUser = {
    id: userId,
    name: userName,
    avatar: localParticipant?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`,
  };
  const floatingReactions = useFloatingReactions({
    meetingId: meeting.id,
    currentUser: currentReactionUser,
    enableRealtime: true,
  });

  // Real-time presence tracking
  const realtimePresence = useRealtimePresence({
    meetingId: meeting.id,
    userId,
    userName,
    isHost,
    avatarUrl: localParticipant?.avatarUrl,
    onUserJoined: (user) => {
      console.log(`[Presence] ${user.userName} joined the meeting`);
    },
    onUserLeft: (user) => {
      console.log(`[Presence] ${user.userName} left the meeting`);
    },
  });

  // Join presence channel when meeting joins
  useEffect(() => {
    if (isJoined && !realtimePresence.isConnected) {
      realtimePresence.joinPresence();
    }
  }, [isJoined]);

  // Sync local participant state with presence
  useEffect(() => {
    if (localParticipant && realtimePresence.isConnected) {
      realtimePresence.updateLocalState({
        isMuted: localParticipant.isMuted,
        isVideoOn: localParticipant.isVideoOn,
        isSpeaking: localParticipant.isSpeaking,
        isHandRaised: localParticipant.isHandRaised,
      });
    }
  }, [
    localParticipant?.isMuted,
    localParticipant?.isVideoOn,
    localParticipant?.isSpeaking,
    localParticipant?.isHandRaised,
    realtimePresence.isConnected,
  ]);

  // Attach local video stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Attach screen share stream
  useEffect(() => {
    if (screenShareRef.current && screenStream) {
      screenShareRef.current.srcObject = screenStream;
    }
  }, [screenStream]);

  // Notify chat when screen sharing changes
  useEffect(() => {
    if (isScreenSharing) {
      chat.addScreenShareMessage(userName, true);
    }
  }, [isScreenSharing, userName]);

  // AI Assistant hook
  const meetingAI = useMeetingAI({
    isEnabled: isAIEnabled,
    meetingId: meeting.id,
    participants,
    onDecisionDetected: (decision) => {
      console.log("Decision detected:", decision);
      setAiNudge(`Decision captured: "${decision.content.slice(0, 50)}..."`);
      setTimeout(() => setAiNudge(null), 5000);
    },
    onActionItemDetected: (action) => {
      console.log("Action detected:", action);
      setAiNudge(`Action item: ${action.task.slice(0, 50)}...`);
      setTimeout(() => setAiNudge(null), 5000);
    },
  });

  // Live transcription hook
  const transcription = useLiveTranscription({
    isEnabled: isTranscribing && isJoined,
    speakerName: userName,
    onTranscript: (entry) => {
      meetingAI.addToTranscript(entry.speaker, entry.text);
    },
  });

  // Push-to-talk hook
  const pushToTalk = usePushToTalk({
    isEnabled: isJoined,
    onActivate: () => {
      if (localParticipant?.isMuted) {
        toggleMicrophone();
        toast.info("Microphone activated", { duration: 1000 });
      }
    },
    onDeactivate: () => {
      if (localParticipant && !localParticipant.isMuted) {
        toggleMicrophone();
      }
    },
  });

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const togglePanel = (panel: SidePanel) => {
    setActivePanel((prev) => (prev === panel ? "none" : panel));
  };

  const handleEndCall = async () => {
    if (recording.isRecording) {
      recording.stopRecording();
    }
    await leaveMeeting();
    onEndMeeting();
  };

  const handleStartRecording = () => {
    if (localStream) {
      recording.startRecording(localStream);
    }
  };

  const handleToggleSpotlight = (participantId: string) => {
    if (spotlightedId === participantId) {
      setSpotlight(null);
      setLayoutMode("speaker");
    } else {
      setSpotlight(participantId);
      setLayoutMode("spotlight");
    }
  };

  const currentAgendaItem = meeting.agenda?.[currentAgendaIndex];

  // Get the main display participant
  const getMainParticipant = (): RealtimeParticipant | null => {
    if (layoutMode === "spotlight" && spotlightedId) {
      return participants.find(p => p.id === spotlightedId) || null;
    }
    return participants.find(p => p.id === activeSpeakerId) || localParticipant;
  };

  const mainParticipant = getMainParticipant();

  // Force controls visible when screen sharing, recording, or PTT active
  const forceControlsVisible = isScreenSharing || recording.isRecording || pushToTalk.isPTTMode;

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onToggleMute: toggleMicrophone,
    onToggleVideo: toggleCamera,
    onToggleScreenShare: isScreenSharing ? stopScreenShare : startScreenShare,
    onToggleRaiseHand: toggleRaiseHand,
    onToggleAI: () => setIsAIEnabled(!isAIEnabled),
    onToggleRecording: recording.isRecording ? recording.stopRecording : handleStartRecording,
    onToggleChat: () => togglePanel("chat"),
    onToggleParticipants: () => togglePanel("participants"),
    onEndCall: handleEndCall,
  });

  return (
    <div className={cn("h-screen bg-background flex flex-col overflow-hidden relative", className)}>
      {/* Ambient Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div 
          className="absolute -top-1/2 -left-1/4 w-[80%] h-[80%] rounded-full blur-[120px] bg-gradient-radial from-aurora-teal to-transparent opacity-[0.04]"
          style={{ animation: "ambient-float-1 25s ease-in-out infinite" }}
        />
        <div 
          className="absolute -bottom-1/4 -right-1/4 w-[70%] h-[70%] rounded-full blur-[100px] bg-gradient-radial from-aurora-violet to-transparent opacity-[0.04]"
          style={{ animation: "ambient-float-2 30s ease-in-out infinite" }}
        />
      </div>

      <style>{`
        @keyframes ambient-float-1 {
          0%, 100% { transform: translate(0%, 0%) rotate(0deg); }
          33% { transform: translate(5%, 3%) rotate(5deg); }
          66% { transform: translate(-3%, 5%) rotate(-3deg); }
        }
        @keyframes ambient-float-2 {
          0%, 100% { transform: translate(0%, 0%) rotate(0deg); }
          33% { transform: translate(-4%, -2%) rotate(-4deg); }
          66% { transform: translate(3%, -4%) rotate(3deg); }
        }
      `}</style>

      {/* Top Bar */}
      <div className="h-14 bg-surface-0/80 backdrop-blur-sm flex items-center justify-between px-6 border-b border-border/50 shrink-0 relative z-10">
        <div className="flex items-center gap-4">
          <h1 className="text-sm font-medium text-foreground">{meeting.title}</h1>
          <div className="flex items-center gap-1.5 text-xs text-aurora-rose">
            <div className="w-1.5 h-1.5 rounded-full bg-aurora-rose animate-pulse" />
            Live
          </div>
          <span className="text-xs text-muted-foreground">
            {participants.length} participant{participants.length !== 1 ? "s" : ""}
          </span>
          
          {/* Recording Indicator */}
          <RecordingIndicator 
            isRecording={recording.isRecording} 
            duration={recording.formattedDuration}
          />
        </div>

        <div className="flex items-center gap-3">
          {/* Agenda Item */}
          {currentAgendaItem && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-1 text-xs">
              <span className="text-primary font-medium">Now:</span>
              <span className="text-foreground">{currentAgendaItem.title}</span>
            </div>
          )}

          {/* Timer, Network Quality & Live Presence Count */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            <span className="font-mono">{formatTime(elapsedTime)}</span>
            <NetworkQualityIndicator />
            
            {/* Live presence indicator */}
            {realtimePresence.isConnected && realtimePresence.users.length > 0 && (
              <div className="flex items-center gap-1.5 ml-2 px-2 py-1 rounded-full bg-primary/10 border border-primary/20">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-xs font-medium text-primary">
                  {realtimePresence.users.length} live
                </span>
              </div>
            )}
          </div>

          {/* Layout Modes */}
          <div className="hidden sm:flex items-center gap-1 border-l border-border/50 pl-3">
            <Button
              variant={layoutMode === "speaker" ? "secondary" : "ghost"}
              size="iconSm"
              onClick={() => { setLayoutMode("speaker"); setSpotlight(null); }}
              title="Speaker view"
            >
              <User className="w-4 h-4" />
            </Button>
            <Button
              variant={layoutMode === "grid" ? "secondary" : "ghost"}
              size="iconSm"
              onClick={() => { setLayoutMode("grid"); setSpotlight(null); }}
              title="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            {spotlightedId && (
              <Button
                variant={layoutMode === "spotlight" ? "secondary" : "ghost"}
                size="iconSm"
                onClick={() => setSpotlight(null)}
                title="Exit spotlight"
              >
                <PinOff className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Theme Toggle */}
          <div className="border-l border-border/50 pl-3">
            <ThemeToggle />
          </div>

          {/* Side Panel Toggles */}
          <div className="flex items-center gap-1 border-l border-border/50 pl-3">
            <Button
              variant={activePanel === "participants" ? "secondary" : "ghost"}
              size="iconSm"
              onClick={() => togglePanel("participants")}
              className="relative"
            >
              <Users className="w-4 h-4" />
              <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] rounded-full bg-surface-3 text-[10px] flex items-center justify-center text-foreground">
                {participants.length}
              </span>
            </Button>
            <Button
              variant={activePanel === "chat" ? "secondary" : "ghost"}
              size="iconSm"
              onClick={() => togglePanel("chat")}
            >
              <MessageSquare className="w-4 h-4" />
            </Button>
            <Button
              variant={activePanel === "decisions" ? "secondary" : "ghost"}
              size="iconSm"
              onClick={() => togglePanel("decisions")}
            >
              <Target className="w-4 h-4" />
            </Button>
            <Button
              variant={activePanel === "transcript" ? "secondary" : "ghost"}
              size="iconSm"
              onClick={() => togglePanel("transcript")}
              className="relative"
            >
              <Mic className="w-4 h-4" />
              {transcription.isListening && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-aurora-teal animate-pulse" />
              )}
            </Button>
            <Button
              variant={activePanel === "reactions" ? "secondary" : "ghost"}
              size="iconSm"
              onClick={() => togglePanel("reactions")}
              className="relative"
            >
              <span className="text-sm">🎉</span>
              {floatingReactions.reactionHistory.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] rounded-full bg-primary text-[10px] flex items-center justify-center text-primary-foreground">
                  {floatingReactions.reactionHistory.length > 9 ? "9+" : floatingReactions.reactionHistory.length}
                </span>
              )}
            </Button>
            <Button
              variant="ghost"
              size="iconSm"
              onClick={() => setShowInvite(true)}
            >
              <UserPlus className="w-4 h-4" />
            </Button>
            <Button
              variant={pushToTalk.isPTTMode ? "secondary" : "ghost"}
              size="iconSm"
              onClick={pushToTalk.togglePTTMode}
              title={pushToTalk.isPTTMode ? "Push-to-talk: ON (Space to speak)" : "Push-to-talk: OFF"}
            >
              <Radio className="w-4 h-4" />
            </Button>

            {/* Keyboard Shortcuts Hint */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="iconSm">
                  <Keyboard className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" align="end" className="max-w-xs">
                <div className="space-y-1 text-xs">
                  <p className="font-medium mb-2">Keyboard Shortcuts</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    <span className="text-muted-foreground">M</span>
                    <span>Toggle mute</span>
                    <span className="text-muted-foreground">V</span>
                    <span>Toggle video</span>
                    <span className="text-muted-foreground">S</span>
                    <span>Screen share</span>
                    <span className="text-muted-foreground">H</span>
                    <span>Raise hand</span>
                    <span className="text-muted-foreground">R</span>
                    <span>Recording</span>
                    <span className="text-muted-foreground">C</span>
                    <span>Toggle chat</span>
                    <span className="text-muted-foreground">P</span>
                    <span>Participants</span>
                    <span className="text-muted-foreground">Space</span>
                    <span>Push-to-talk</span>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>

      {/* Host Admit Panel */}
      {isHost && waitingParticipants.length > 0 && (
        <HostAdmitPanel
          waitingParticipants={waitingParticipants}
          onAdmit={admitParticipant}
          onDeny={denyParticipant}
          onAdmitAll={admitAll}
          onDenyAll={denyAll}
        />
      )}

      {/* Participant Join/Leave Notifications */}
      <ParticipantJoinNotification events={realtimePresence.recentEvents} />

      {/* AI Nudge */}
      <AnimatePresence>
        {aiNudge && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-20 left-1/2 -translate-x-1/2 z-20"
          >
            <AINudge 
              message={aiNudge} 
              type="decision" 
              onDismiss={() => setAiNudge(null)} 
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Push-to-talk indicator */}
      <AnimatePresence>
        {pushToTalk.isPTTMode && pushToTalk.isPressed && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed bottom-32 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground shadow-glow-lg">
              <Mic className="w-5 h-5" />
              <span className="font-medium">Speaking...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        {/* Video Area */}
        <div className="flex-1 flex flex-col p-4 min-w-0">
          {/* Screen Share Display */}
          {isScreenSharing && screenStream && (
            <div className="relative rounded-2xl overflow-hidden bg-surface-1 border border-primary/30 mb-3 flex-1">
              <video
                ref={screenShareRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-contain"
              />
              <div className="absolute top-4 left-4 glass-panel rounded-lg px-3 py-1.5 flex items-center gap-2">
                <MonitorOff className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">You're sharing your screen</span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={stopScreenShare}
                  className="ml-2 h-7"
                >
                  Stop sharing
                </Button>
              </div>
            </div>
          )}

          {/* Main Video Grid */}
          <div className={cn(
            "flex-1 min-h-0 grid gap-3",
            isScreenSharing && "max-h-32"
          )} style={{
            gridTemplateColumns: layoutMode === "grid" 
              ? `repeat(${Math.min(Math.ceil(Math.sqrt(participants.length)), 3)}, 1fr)` 
              : "1fr",
            gridTemplateRows: layoutMode === "grid" 
              ? `repeat(${Math.ceil(participants.length / 3)}, 1fr)` 
              : "1fr",
          }}>
            {(layoutMode === "speaker" || layoutMode === "spotlight") ? (
              // Speaker/Spotlight view - show main participant large
              <div className="relative rounded-2xl overflow-hidden bg-surface-1 border border-border/50">
                {mainParticipant?.isLocal && mainParticipant?.isVideoOn && localStream ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transform -scale-x-100"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-24 h-24 rounded-full bg-surface-2 flex items-center justify-center">
                      <span className="text-4xl font-semibold text-foreground">
                        {mainParticipant?.userName.charAt(0) || userName.charAt(0)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Speaking indicator */}
                {mainParticipant?.isSpeaking && (
                  <div className="absolute inset-0 border-2 border-primary rounded-2xl pointer-events-none animate-pulse" />
                )}

                {/* Spotlight badge */}
                {layoutMode === "spotlight" && spotlightedId && (
                  <div className="absolute top-4 right-4 glass-panel rounded-lg px-3 py-1.5 flex items-center gap-2">
                    <Pin className="w-4 h-4 text-primary" />
                    <span className="text-xs font-medium text-foreground">Spotlighted</span>
                  </div>
                )}

                {/* Name badge */}
                <div className="absolute bottom-4 left-4 glass-panel rounded-lg px-3 py-1.5">
                  <div className="flex items-center gap-2">
                    {mainParticipant?.isMuted && <Mic className="w-3 h-3 text-destructive" />}
                    <span className="text-sm font-medium text-foreground">
                      {mainParticipant?.userName || userName}
                    </span>
                    {mainParticipant?.isLocal && (
                      <span className="text-xs text-muted-foreground">(You)</span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              // Grid view - show all participants
              participants.map((participant) => (
                <motion.div 
                  key={participant.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={cn(
                    "relative rounded-xl overflow-hidden bg-surface-1 border border-border/50 cursor-pointer group",
                    participant.isSpeaking && "ring-2 ring-primary"
                  )}
                  onClick={() => handleToggleSpotlight(participant.id)}
                >
                  {participant.isLocal && participant.isVideoOn && localStream ? (
                    <video
                      ref={participant.isLocal ? localVideoRef : undefined}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover transform -scale-x-100"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-surface-1 to-surface-2">
                      <div className="w-16 h-16 rounded-full bg-surface-3 flex items-center justify-center">
                        <span className="text-2xl font-semibold text-foreground">
                          {participant.userName.charAt(0)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Spotlight button on hover */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="glass"
                      size="iconSm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleSpotlight(participant.id);
                      }}
                    >
                      <Pin className="w-3 h-3" />
                    </Button>
                  </div>

                  {/* Hand raised */}
                  {participant.isHandRaised && (
                    <div className="absolute top-2 left-2">
                      <div className="w-6 h-6 rounded-full bg-aurora-violet flex items-center justify-center animate-bounce">
                        <span className="text-xs">✋</span>
                      </div>
                    </div>
                  )}

                  <div className="absolute bottom-2 left-2 glass-panel rounded-lg px-2 py-1">
                    <div className="flex items-center gap-1.5">
                      {participant.isMuted && <Mic className="w-3 h-3 text-destructive" />}
                      <span className="text-xs font-medium text-foreground">
                        {participant.userName}
                        {participant.isLocal && " (You)"}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* AI Participant Card */}
          {isAIEnabled && !isScreenSharing && (
            <div className="mt-3">
              <AIParticipantCard
                isListening={isJoined}
                isProcessing={meetingAI.isProcessing}
                lastInsight={meetingAI.insights[meetingAI.insights.length - 1]?.content}
              />
            </div>
          )}
        </div>

        {/* Side Panel */}
        <AnimatePresence>
          {activePanel !== "none" && (
            <motion.div 
              initial={{ x: 320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 320, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-80 border-l border-border/50 flex flex-col bg-surface-0/50 backdrop-blur-sm"
            >
              {activePanel === "participants" && (
                <LiveParticipantsList
                  users={realtimePresence.users}
                  localUserId={userId}
                  isConnected={realtimePresence.isConnected}
                  recentEvents={realtimePresence.recentEvents}
                  onClose={() => setActivePanel("none")}
                />
              )}
              {activePanel === "chat" && (
                <ChatPanel
                  messages={chat.messages}
                  onSendMessage={chat.sendMessage}
                  onAddReaction={chat.addReaction}
                  onClose={() => setActivePanel("none")}
                />
              )}
              {activePanel === "decisions" && (
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="flex items-center justify-between p-4 border-b border-border/50">
                    <span className="font-medium text-foreground">Decisions & Actions</span>
                    <Button variant="ghost" size="iconSm" onClick={() => setActivePanel("none")}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4">
                    <DecisionCapture
                      decisions={meetingAI.decisions}
                      actionItems={meetingAI.actionItems}
                    />
                  </div>
                </div>
              )}
              {activePanel === "transcript" && (
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="flex items-center justify-between p-3 border-b border-border/50">
                    <div className="flex items-center gap-2">
                      <Mic className="w-4 h-4 text-primary" />
                      <span className="font-medium text-foreground">Live Transcript</span>
                    </div>
                    <Button variant="ghost" size="iconSm" onClick={() => setActivePanel("none")}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <LiveTranscript
                    transcripts={transcription.transcripts}
                    interimText={transcription.interimText}
                    currentSpeaker={userName}
                    isAIProcessing={meetingAI.isProcessing}
                    className="flex-1"
                  />
                </div>
              )}
              {activePanel === "reactions" && (
                <ReactionActivityFeed
                  reactionHistory={floatingReactions.reactionHistory}
                  onClose={() => setActivePanel("none")}
                  onClearHistory={floatingReactions.clearHistory}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Invite Modal */}
      <InviteModal
        isOpen={showInvite}
        onClose={() => setShowInvite(false)}
        meetingId={meeting.id}
        meetingTitle={meeting.title}
      />

      {/* Floating Emoji Reactions */}
      <FloatingReactions reactions={floatingReactions.reactions} />

      {/* Bottom Controls with Auto-Hide */}
      <FloatingControls
        isIdle={isIdle}
        forceVisible={forceControlsVisible}
        className="py-4 flex items-center justify-center shrink-0 gap-3"
      >
        {/* Reaction Picker - Left of controls */}
        <ReactionPicker
          onSelectReaction={floatingReactions.addReaction}
          onBurstReaction={floatingReactions.addBurstReaction}
          availableEmojis={floatingReactions.availableEmojis}
          soundEnabled={floatingReactions.soundEnabled}
          onToggleSound={floatingReactions.toggleSound}
        />

        <MeetingControlsReal
          isMuted={localParticipant?.isMuted ?? true}
          isVideoOn={localParticipant?.isVideoOn ?? false}
          isAIEnabled={isAIEnabled}
          isScreenSharing={isScreenSharing}
          isRecording={recording.isRecording}
          isHandRaised={localParticipant?.isHandRaised ?? false}
          participantCount={participants.length}
          onToggleMute={toggleMicrophone}
          onToggleVideo={toggleCamera}
          onToggleAI={() => setIsAIEnabled(!isAIEnabled)}
          onStartScreenShare={startScreenShare}
          onStopScreenShare={stopScreenShare}
          onStartRecording={handleStartRecording}
          onStopRecording={recording.stopRecording}
          onToggleRaiseHand={toggleRaiseHand}
          onEndCall={handleEndCall}
        />
      </FloatingControls>
    </div>
  );
}
