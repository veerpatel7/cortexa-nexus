import { useState, useEffect, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useDailyMeeting, MeetingParticipant } from "@/hooks/useDailyMeeting";
import { useMeetingAI } from "@/hooks/useMeetingAI";
import { useLiveTranscription } from "@/hooks/useLiveTranscription";
import { usePushToTalk } from "@/hooks/usePushToTalk";
import { MeetingGrid } from "./MeetingGrid";
import { AIParticipantCard } from "./AIParticipantCard";
import { MeetingControlsReal } from "./MeetingControlsReal";
import { ChatPanel } from "./ChatPanel";
import { DecisionCapture } from "./DecisionCapture";
import { ParticipantsList } from "./ParticipantsList";
import { InviteModal } from "./InviteModal";
import { LiveTranscript } from "./LiveTranscript";
import { AINudge } from "./AIInsightCard";
import { JoiningState, EmptyMeetingState, ReconnectingState } from "./MeetingStates";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useMeetingChat } from "@/hooks/useMeetingChat";
import { Meeting, Decision, ActionItem, AgendaItem } from "@/types/meeting";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Clock, 
  MessageSquare, 
  Target,
  X,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  User,
  Maximize2,
  Users,
  UserPlus,
  Mic,
  Radio
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface LiveMeetingRoomProps {
  meeting: Meeting;
  userId: string;
  userName: string;
  isHost: boolean;
  onEndMeeting: () => void;
  className?: string;
}

type LayoutMode = "grid" | "speaker" | "sidebar";
type SidePanel = "none" | "chat" | "decisions" | "participants" | "transcript";

export function LiveMeetingRoom({
  meeting,
  userId,
  userName,
  isHost,
  onEndMeeting,
  className,
}: LiveMeetingRoomProps) {
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("speaker");
  const [activePanel, setActivePanel] = useState<SidePanel>("none");
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isAIEnabled, setIsAIEnabled] = useState(true);
  const [currentAgendaIndex, setCurrentAgendaIndex] = useState(0);
  const [showInvite, setShowInvite] = useState(false);
  const [aiNudge, setAiNudge] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(true);

  // Daily.co meeting hook
  const {
    participants,
    localParticipant,
    activeSpeakerId,
    isJoined,
    error,
    leaveMeeting,
    toggleMicrophone,
    toggleCamera,
    startScreenShare,
    stopScreenShare,
  } = useDailyMeeting({
    meetingId: meeting.id,
    userId,
    userName,
    isHost,
    onMeetingJoined: () => console.log("Meeting joined!"),
    onMeetingLeft: () => {
      console.log("Meeting left");
      onEndMeeting();
    },
    onError: (err) => console.error("Meeting error:", err),
  });

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
      // Feed transcript to AI
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

  // Chat hook
  const { messages, sendMessage, addReaction } = useMeetingChat();

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
    await leaveMeeting();
    onEndMeeting();
  };

  // Current agenda item
  const currentAgendaItem = meeting.agenda?.[currentAgendaIndex];

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
        </div>

        <div className="flex items-center gap-3">
          {/* Now / Next Indicator */}
          {currentAgendaItem && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-1 text-xs">
              <span className="text-primary font-medium">Now:</span>
              <span className="text-foreground">{currentAgendaItem.title}</span>
              {meeting.agenda?.[currentAgendaIndex + 1] && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground">
                    Next: {meeting.agenda[currentAgendaIndex + 1].title}
                  </span>
                </>
              )}
            </div>
          )}

          {/* Timer */}
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            <span className="font-mono">{formatTime(elapsedTime)}</span>
          </div>

          {/* Layout Toggle */}
          <div className="hidden sm:flex items-center gap-1 border-l border-border/50 pl-3">
            <Button
              variant={layoutMode === "speaker" ? "secondary" : "ghost"}
              size="iconSm"
              onClick={() => setLayoutMode("speaker")}
              title="Speaker View"
            >
              <User className="w-4 h-4" />
            </Button>
            <Button
              variant={layoutMode === "grid" ? "secondary" : "ghost"}
              size="iconSm"
              onClick={() => setLayoutMode("grid")}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
          </div>

          {/* Theme Toggle */}
          <div className="border-l border-border/50 pl-3">
            <ThemeToggle />
          </div>

          {/* Panel Toggles */}
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
              className="relative"
            >
              <MessageSquare className="w-4 h-4" />
              {messages.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-primary" />
              )}
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
              variant="ghost"
              size="iconSm"
              onClick={() => setShowInvite(true)}
            >
              <UserPlus className="w-4 h-4" />
            </Button>
            {/* PTT Mode Toggle */}
            <Button
              variant={pushToTalk.isPTTMode ? "secondary" : "ghost"}
              size="iconSm"
              onClick={pushToTalk.togglePTTMode}
              title={pushToTalk.isPTTMode ? "Push-to-talk: ON (Space to talk)" : "Push-to-talk: OFF"}
              className="relative"
            >
              <Radio className="w-4 h-4" />
              {pushToTalk.isPTTMode && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-aurora-violet" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {/* AI Nudge (floating notification) */}
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

      <div className="flex-1 flex min-h-0">
        {/* Video Area */}
        <div className="flex-1 flex flex-col p-4 min-w-0">
          {/* Main Grid */}
          <div className="flex-1 min-h-0">
            <MeetingGrid
              participants={participants}
              activeSpeakerId={activeSpeakerId}
              layout={layoutMode}
              className="h-full"
            />
          </div>

          {/* AI Participant Card (if enabled) */}
          {isAIEnabled && (
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
        {activePanel !== "none" && (
          <motion.div 
            initial={{ x: 320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 320, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-80 border-l border-border/50 flex flex-col bg-surface-0/50 backdrop-blur-sm"
          >
            {activePanel === "participants" && (
              <ParticipantsList
                participants={participants}
                meetingId={meeting.id}
                meetingTitle={meeting.title}
                isHost={isHost}
                isAIEnabled={isAIEnabled}
                onClose={() => setActivePanel("none")}
              />
            )}
            {activePanel === "chat" && (
              <ChatPanel
                messages={messages}
                onSendMessage={sendMessage}
                onAddReaction={addReaction}
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
                    {transcription.isListening && (
                      <span className="w-2 h-2 rounded-full bg-aurora-teal animate-pulse" />
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant={isTranscribing ? "secondary" : "ghost"}
                      size="iconSm"
                      onClick={() => setIsTranscribing(!isTranscribing)}
                    >
                      {isTranscribing ? (
                        <Mic className="w-4 h-4 text-primary" />
                      ) : (
                        <Mic className="w-4 h-4 text-muted-foreground" />
                      )}
                    </Button>
                    <Button variant="ghost" size="iconSm" onClick={() => setActivePanel("none")}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
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
          </motion.div>
        )}
      </div>

      {/* Invite Modal */}
      <InviteModal
        isOpen={showInvite}
        onClose={() => setShowInvite(false)}
        meetingId={meeting.id}
        meetingTitle={meeting.title}
      />

      {/* Bottom Controls */}
      <div className="py-4 flex items-center justify-center shrink-0">
        <MeetingControlsReal
          isMuted={localParticipant?.isMuted ?? true}
          isVideoOn={localParticipant?.isVideoOn ?? false}
          isAIEnabled={isAIEnabled}
          participantCount={participants.length}
          onToggleMute={toggleMicrophone}
          onToggleVideo={toggleCamera}
          onToggleAI={() => setIsAIEnabled(!isAIEnabled)}
          onStartScreenShare={startScreenShare}
          onEndCall={handleEndCall}
        />
      </div>
    </div>
  );
}
