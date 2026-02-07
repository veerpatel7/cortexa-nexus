import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Meeting, Participant, MeetingState } from "@/types/meeting";
import { PreJoinLobby } from "./PreJoinLobbyReal";
import { LiveMeetingRoomLocal } from "./LiveMeetingRoomLocal";
import { PostMeetingSummary } from "./PostMeetingSummary";
import { MeetingErrorState } from "./MeetingStates";
import { useRealtimeMeetingWebRTC } from "@/hooks/useRealtimeMeetingWebRTC";
import { useMeetingAI } from "@/hooks/useMeetingAI";
import { motion, AnimatePresence } from "framer-motion";

type MeetingPhase = "lobby" | "live" | "ended" | "error";

interface MeetingOrchestratorProps {
  meeting: Meeting;
  currentUser: Participant;
  className?: string;
}

// Page transition variants
const pageVariants = {
  initial: { 
    opacity: 0, 
    scale: 0.98,
    filter: "blur(4px)",
  },
  animate: { 
    opacity: 1, 
    scale: 1,
    filter: "blur(0px)",
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 30,
      duration: 0.4,
    },
  },
  exit: { 
    opacity: 0, 
    scale: 0.96,
    filter: "blur(4px)",
    transition: {
      duration: 0.25,
      ease: [0.4, 0, 1, 1] as [number, number, number, number],
    },
  },
};

const errorVariants = {
  initial: { 
    opacity: 0, 
    x: -20,
  },
  animate: { 
    opacity: 1, 
    x: 0,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 25,
    },
  },
  exit: { 
    opacity: 0, 
    x: 20,
    transition: {
      duration: 0.2,
    },
  },
};

const summaryVariants = {
  initial: { 
    opacity: 0, 
    y: 40,
    scale: 0.95,
  },
  animate: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 30,
      delay: 0.1,
    },
  },
  exit: { 
    opacity: 0, 
    y: -20,
    transition: {
      duration: 0.2,
    },
  },
};

export function MeetingOrchestrator({
  meeting,
  currentUser,
  className,
}: MeetingOrchestratorProps) {
  const [phase, setPhase] = useState<MeetingPhase>("lobby");
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [meetingError, setMeetingError] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState(currentUser.name);

  // Real-time meeting with WebRTC for actual audio/video streaming
  const realtimeMeeting = useRealtimeMeetingWebRTC({
    meetingId: meeting.id,
    userId: currentUser.id,
    userName: displayName,
    isHost: currentUser.isHost,
    onMeetingJoined: () => {
      console.log("Successfully joined real-time meeting with WebRTC");
      setPhase("live");
      setMeetingError(null);
    },
    onMeetingLeft: () => {
      console.log("Left meeting");
      if (phase === "live") {
        setPhase("ended");
      }
    },
    onParticipantJoined: (participant) => {
      console.log("Participant joined:", participant.userName);
    },
    onParticipantLeft: (id, name) => {
      console.log("Participant left:", name);
    },
    onError: (err) => {
      console.error("Meeting error:", err);
      const errorMessage = err.message || "Failed to join meeting";
      
      if (errorMessage.includes("Permission denied") || errorMessage.includes("NotAllowedError")) {
        setMeetingError("Camera and microphone access is required. Please allow access in your browser and try again.");
      } else if (errorMessage.includes("NotFoundError")) {
        setMeetingError("No camera or microphone found. Please connect a device and try again.");
      } else {
        setMeetingError(errorMessage);
      }
      setPhase("error");
    },
  });

  // AI assistant
  const meetingAI = useMeetingAI({
    isEnabled: phase === "live",
    meetingId: meeting.id,
    participants: realtimeMeeting.participants,
  });

  const handleJoinMeeting = useCallback(async (audio: boolean, video: boolean, name: string) => {
    setAudioEnabled(audio);
    setVideoEnabled(video);
    setDisplayName(name);
    setMeetingError(null);
    await realtimeMeeting.joinMeeting();
  }, [realtimeMeeting]);

  const handleEndMeeting = useCallback(async () => {
    await realtimeMeeting.leaveMeeting();
    setPhase("ended");
  }, [realtimeMeeting]);

  const handleRejoin = useCallback(() => {
    setPhase("lobby");
    setMeetingError(null);
    meetingAI.reset();
  }, [meetingAI]);

  const handleRetry = useCallback(() => {
    setPhase("lobby");
    setMeetingError(null);
  }, []);

  // Build meeting state for summary
  const buildMeetingState = (): MeetingState => ({
    meeting: {
      ...meeting,
      decisions: meetingAI.decisions,
      actionItems: meetingAI.actionItems,
      aiInsights: meetingAI.insights,
      status: "ended",
    },
    currentAgendaIndex: 0,
    elapsedTime: 0,
    aiMode: "assist",
    isCaptionsEnabled: false,
    isRecording: false,
    uiMode: "review",
  });

  // Adapt realtimeMeeting to match expected interface
  const adaptedMeeting = {
    ...realtimeMeeting,
    // Map RealtimeParticipant to LocalParticipant interface
    participants: realtimeMeeting.participants.map(p => ({
      ...p,
      audioTrack: null,
      videoTrack: null,
    })),
    localParticipant: realtimeMeeting.localParticipant ? {
      ...realtimeMeeting.localParticipant,
      audioTrack: null,
      videoTrack: null,
    } : null,
  };

  return (
    <div className={cn("min-h-screen bg-background overflow-hidden", className)}>
      <AnimatePresence mode="wait">
        {phase === "lobby" && (
          <motion.div
            key="lobby"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="min-h-screen"
          >
            <PreJoinLobby
              meetingTitle={meeting.title}
              currentUser={currentUser}
              onJoinMeeting={handleJoinMeeting}
              isJoining={realtimeMeeting.isJoining}
            />
          </motion.div>
        )}

        {phase === "live" && (
          <motion.div
            key="live"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="h-screen"
          >
            <LiveMeetingRoomLocal
              meeting={meeting}
              userId={currentUser.id}
              userName={currentUser.name}
              isHost={currentUser.isHost}
              localMeeting={adaptedMeeting as any}
              onEndMeeting={handleEndMeeting}
            />
          </motion.div>
        )}

        {phase === "error" && (
          <motion.div
            key="error"
            variants={errorVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="min-h-screen"
          >
            <MeetingErrorState
              error={meetingError || "An unexpected error occurred"}
              onRetry={handleRetry}
            />
          </motion.div>
        )}

        {phase === "ended" && (
          <motion.div
            key="ended"
            variants={summaryVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="min-h-screen"
          >
            <PostMeetingSummary
              meeting={buildMeetingState().meeting}
              duration={0}
              onClose={handleRejoin}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
