import { cn } from "@/lib/utils";
import { MeetingState, Participant, AIMode, MeetingUIMode } from "@/types/meeting";
import { SpeakerView } from "./SpeakerView";
import { MeetingControls } from "./MeetingControls";
import { AIAgent } from "./AIAgent";
import { AgendaTimeline } from "./AgendaTimeline";
import { DecisionCapture } from "./DecisionCapture";
import { ChatPanel } from "./ChatPanel";
import { BreakoutRooms } from "./BreakoutRooms";
import { Whiteboard } from "./Whiteboard";
import { FileSharing } from "./FileSharing";
import { useMeetingChat } from "@/hooks/useMeetingChat";
import { useBreakoutRooms } from "@/hooks/useBreakoutRooms";
import { useWhiteboard } from "@/hooks/useWhiteboard";
import { useMeetingUIMode } from "@/hooks/useMeetingUIMode";
import { useState } from "react";
import { 
  Clock, 
  MessageSquare, 
  Users, 
  PenTool, 
  Paperclip,
  ListChecks,
  Target,
  X,
  Sparkles,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface LiveMeetingProps {
  state: MeetingState;
  currentUser: Participant;
  onEndMeeting: () => void;
  className?: string;
}

type SidePanel = "none" | "chat" | "breakout" | "files";

export function LiveMeeting({
  state,
  currentUser,
  onEndMeeting,
  className,
}: LiveMeetingProps) {
  const [isMuted, setIsMuted] = useState(currentUser.isMuted);
  const [isVideoOn, setIsVideoOn] = useState(currentUser.isVideoOn);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [isCaptionsOn, setIsCaptionsOn] = useState(state.isCaptionsEnabled);
  const [isRecording, setIsRecording] = useState(state.isRecording);
  const [aiMode, setAiMode] = useState<AIMode>(state.aiMode);
  const [activePanel, setActivePanel] = useState<SidePanel>("none");
  const [showWhiteboard, setShowWhiteboard] = useState(false);

  const { messages, sendMessage, addReaction } = useMeetingChat();
  const { rooms, unassignedParticipants, createRoom, deleteRoom, assignParticipant } = useBreakoutRooms();
  const { annotations, addAnnotation, undo, clear } = useWhiteboard();
  
  // Progressive Intelligence Panels
  const {
    mode,
    setMode,
    isLeftPanelVisible,
    isRightPanelVisible,
    toggleLeftPanel,
    toggleRightPanel,
    aiMessage,
    dismissAiMessage,
    getModeLabel,
  } = useMeetingUIMode({ state, elapsedTime: state.elapsedTime });

  const activeSpeaker = state.meeting.participants.find((p) => p.isSpeaking) || 
    state.meeting.participants[0];

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const togglePanel = (panel: SidePanel) => {
    setActivePanel((prev) => (prev === panel ? "none" : panel));
  };

  if (showWhiteboard) {
    return (
      <div className={cn("h-screen bg-background", className)}>
        <Whiteboard
          annotations={annotations}
          onAddAnnotation={addAnnotation}
          onClear={clear}
          onUndo={undo}
          onClose={() => setShowWhiteboard(false)}
        />
      </div>
    );
  }

  return (
    <div className={cn("h-screen bg-background flex flex-col overflow-hidden", className)}>
      {/* AI Intelligence Toast */}
      {aiMessage && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
          <div className="flex items-center gap-3 px-4 py-3 bg-surface-1/95 backdrop-blur-lg border border-primary/20 rounded-2xl shadow-glow-sm">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-aurora-teal to-aurora-cyan flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-background" />
            </div>
            <p className="text-sm text-foreground max-w-md">{aiMessage.message}</p>
            <Button variant="ghost" size="iconSm" onClick={dismissAiMessage}>
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Minimal Top Bar */}
      <div className="h-12 bg-surface-0/80 backdrop-blur-sm flex items-center justify-between px-6 border-b border-border/50 shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-sm font-medium text-foreground">{state.meeting.title}</h1>
          <div className="flex items-center gap-1.5 text-xs text-aurora-rose">
            <div className="w-1.5 h-1.5 rounded-full bg-aurora-rose animate-pulse" />
            Live
          </div>
          {/* Mode Indicator */}
          <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-2 text-xs text-muted-foreground">
            {getModeLabel(mode)}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Timer */}
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            <span className="font-mono">{formatTime(state.elapsedTime)}</span>
          </div>

          {/* Recording Badge */}
          {isRecording && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-xs">
              <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              REC
            </div>
          )}

          {/* Panel Toggle Controls */}
          <div className="hidden lg:flex items-center gap-1 ml-2 border-l border-border/50 pl-3">
            <Button
              variant={isLeftPanelVisible ? "secondary" : "ghost"}
              size="iconSm"
              onClick={toggleLeftPanel}
              title="Toggle Agenda"
            >
              <ListChecks className="w-4 h-4" />
            </Button>
            <Button
              variant={isRightPanelVisible ? "secondary" : "ghost"}
              size="iconSm"
              onClick={toggleRightPanel}
              title="Toggle Decisions"
            >
              <Target className="w-4 h-4" />
            </Button>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-1 ml-2">
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
              variant={activePanel === "breakout" ? "secondary" : "ghost"}
              size="iconSm"
              onClick={() => togglePanel("breakout")}
            >
              <Users className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="iconSm"
              onClick={() => setShowWhiteboard(true)}
            >
              <PenTool className="w-4 h-4" />
            </Button>
            <Button
              variant={activePanel === "files" ? "secondary" : "ghost"}
              size="iconSm"
              onClick={() => togglePanel("files")}
            >
              <Paperclip className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0 relative">
        {/* Left Panel - Agenda (Progressive) */}
        <div 
          className={cn(
            "hidden lg:flex flex-col border-r border-border/50 bg-surface-0/50 transition-all duration-500 ease-out overflow-hidden",
            isLeftPanelVisible ? "w-72 opacity-100" : "w-0 opacity-0"
          )}
        >
          {isLeftPanelVisible && (
            <div className="flex-1 overflow-y-auto p-4 animate-fade-in">
              <AgendaTimeline
                items={state.meeting.agenda}
                currentIndex={state.currentAgendaIndex}
                className="mb-6"
              />
              <AIAgent
                mode={aiMode}
                onModeChange={setAiMode}
                insights={state.meeting.aiInsights}
                isThinking={false}
              />
            </div>
          )}
        </div>

        {/* Left Panel Toggle (when hidden) */}
        {!isLeftPanelVisible && (
          <button
            onClick={toggleLeftPanel}
            className="hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 w-6 h-16 bg-surface-1/80 backdrop-blur-sm border border-border/50 rounded-r-lg items-center justify-center hover:bg-surface-2 transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        )}

        {/* Center - Main View */}
        <div className="flex-1 flex flex-col p-4 min-w-0">
          <SpeakerView
            activeSpeaker={activeSpeaker}
            participants={state.meeting.participants}
            mode={mode}
            currentAgendaItem={state.meeting.agenda[state.currentAgendaIndex]}
            elapsedTime={state.elapsedTime}
            className="flex-1"
          />

          {/* Captions */}
          {isCaptionsOn && (
            <div className="mt-3 bg-surface-1/80 backdrop-blur-sm rounded-xl p-3 text-center animate-fade-in">
              <p className="text-sm text-foreground">
                <span className="text-primary font-medium">Sarah Chen: </span>
                "I think we should prioritize the API integration before moving to the new dashboard..."
              </p>
            </div>
          )}
        </div>

        {/* Right Panel Toggle (when hidden) */}
        {!isRightPanelVisible && activePanel === "none" && (
          <button
            onClick={toggleRightPanel}
            className="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 w-6 h-16 bg-surface-1/80 backdrop-blur-sm border border-border/50 rounded-l-lg items-center justify-center hover:bg-surface-2 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </button>
        )}

        {/* Right Panel - Decisions or Dynamic Panel */}
        {activePanel !== "none" ? (
          <div className="w-80 border-l border-border/50 flex flex-col animate-slide-in-right">
            {activePanel === "chat" && (
              <ChatPanel
                messages={messages}
                onSendMessage={sendMessage}
                onAddReaction={addReaction}
                onClose={() => setActivePanel("none")}
              />
            )}
            {activePanel === "breakout" && (
              <BreakoutRooms
                rooms={rooms}
                unassignedParticipants={unassignedParticipants}
                onCreateRoom={createRoom}
                onDeleteRoom={deleteRoom}
                onAssignParticipant={assignParticipant}
                onClose={() => setActivePanel("none")}
              />
            )}
            {activePanel === "files" && (
              <FileSharing onClose={() => setActivePanel("none")} />
            )}
          </div>
        ) : (
          <div 
            className={cn(
              "hidden lg:flex flex-col border-l border-border/50 bg-surface-0/50 transition-all duration-500 ease-out overflow-hidden",
              isRightPanelVisible ? "w-72 opacity-100" : "w-0 opacity-0"
            )}
          >
            {isRightPanelVisible && (
              <div className="flex-1 overflow-y-auto p-4 animate-fade-in">
                <DecisionCapture
                  decisions={state.meeting.decisions}
                  actionItems={state.meeting.actionItems}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Controls - Floating Style */}
      <div className="py-4 flex items-center justify-center shrink-0">
        <MeetingControls
          isMuted={isMuted}
          isVideoOn={isVideoOn}
          isScreenSharing={isScreenSharing}
          isHandRaised={isHandRaised}
          isCaptionsOn={isCaptionsOn}
          isRecording={isRecording}
          participantCount={state.meeting.participants.length}
          onToggleMute={() => setIsMuted(!isMuted)}
          onToggleVideo={() => setIsVideoOn(!isVideoOn)}
          onToggleScreenShare={() => setIsScreenSharing(!isScreenSharing)}
          onToggleHand={() => setIsHandRaised(!isHandRaised)}
          onToggleCaptions={() => setIsCaptionsOn(!isCaptionsOn)}
          onToggleRecording={() => setIsRecording(!isRecording)}
          onOpenChat={() => togglePanel("chat")}
          onOpenParticipants={() => togglePanel("breakout")}
          onEndCall={onEndMeeting}
        />
      </div>
    </div>
  );
}
