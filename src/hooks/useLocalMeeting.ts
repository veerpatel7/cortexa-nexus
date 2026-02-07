import { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";

export interface LocalParticipant {
  id: string;
  sessionId: string;
  userName: string;
  isLocal: boolean;
  isOwner: boolean;
  audioTrack: MediaStreamTrack | null;
  videoTrack: MediaStreamTrack | null;
  isMuted: boolean;
  isVideoOn: boolean;
  isSpeaking: boolean;
  isHandRaised: boolean;
  joinedAt: Date;
}

export interface WaitingParticipant {
  id: string;
  userName: string;
  joinRequestTime: Date;
}

interface UseLocalMeetingOptions {
  meetingId: string;
  userId: string;
  userName: string;
  isHost: boolean;
  waitingRoomEnabled?: boolean;
  onMeetingJoined?: () => void;
  onMeetingLeft?: () => void;
  onParticipantJoined?: (participant: LocalParticipant) => void;
  onParticipantLeft?: (participantId: string, userName: string) => void;
  onError?: (error: Error) => void;
}

/**
 * Local-only meeting hook with full feature set
 * Screen sharing, host controls, raise hand, waiting room
 */
export function useLocalMeeting({
  meetingId,
  userId,
  userName,
  isHost,
  waitingRoomEnabled = false,
  onMeetingJoined,
  onMeetingLeft,
  onParticipantJoined,
  onParticipantLeft,
  onError,
}: UseLocalMeetingOptions) {
  const [participants, setParticipants] = useState<LocalParticipant[]>([]);
  const [localParticipant, setLocalParticipant] = useState<LocalParticipant | null>(null);
  const [waitingParticipants, setWaitingParticipants] = useState<WaitingParticipant[]>([]);
  const [activeSpeakerId, setActiveSpeakerId] = useState<string | null>(null);
  const [spotlightedId, setSpotlightedId] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const simulationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Create simulated participants for demo
  const createSimulatedParticipants = useCallback((): LocalParticipant[] => {
    return [
      {
        id: "sim-1",
        sessionId: "sim-session-1",
        userName: "Alex Rivera",
        isLocal: false,
        isOwner: false,
        audioTrack: null,
        videoTrack: null,
        isMuted: false,
        isVideoOn: true,
        isSpeaking: false,
        isHandRaised: false,
        joinedAt: new Date(),
      },
      {
        id: "sim-2",
        sessionId: "sim-session-2",
        userName: "Jordan Lee",
        isLocal: false,
        isOwner: false,
        audioTrack: null,
        videoTrack: null,
        isMuted: true,
        isVideoOn: false,
        isSpeaking: false,
        isHandRaised: false,
        joinedAt: new Date(),
      },
      {
        id: "sim-3",
        sessionId: "sim-session-3",
        userName: "Morgan Chen",
        isLocal: false,
        isOwner: false,
        audioTrack: null,
        videoTrack: null,
        isMuted: false,
        isVideoOn: true,
        isSpeaking: false,
        isHandRaised: false,
        joinedAt: new Date(Date.now() - 120000), // Joined 2 min ago
      },
    ];
  }, []);

  // Setup audio analysis for speaking detection
  const setupAudioAnalysis = useCallback((stream: MediaStream) => {
    try {
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      
      analyser.fftSize = 256;
      source.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const checkAudioLevel = () => {
        if (!analyserRef.current) return;
        
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        const isSpeaking = average > 30;

        setLocalParticipant((prev) => {
          if (!prev || prev.isSpeaking === isSpeaking) return prev;
          return { ...prev, isSpeaking };
        });

        if (isSpeaking) {
          setActiveSpeakerId(userId);
        }

        animationFrameRef.current = requestAnimationFrame(checkAudioLevel);
      };

      checkAudioLevel();
    } catch (err) {
      console.warn("Audio analysis not available:", err);
    }
  }, [userId]);

  // Simulate speaking activity from other participants
  const startSpeakingSimulation = useCallback((simulated: LocalParticipant[]) => {
    const interval = setInterval(() => {
      const unmutedParticipants = simulated.filter(p => !p.isMuted);
      if (unmutedParticipants.length === 0) return;
      
      const randomIdx = Math.floor(Math.random() * unmutedParticipants.length);
      const speakerId = unmutedParticipants[randomIdx].id;
      
      setParticipants((prev) =>
        prev.map((p) => ({
          ...p,
          isSpeaking: p.id === speakerId,
        }))
      );
      
      setActiveSpeakerId(speakerId);

      // Stop speaking after a random duration
      setTimeout(() => {
        setParticipants((prev) =>
          prev.map((p) => ({
            ...p,
            isSpeaking: p.id === speakerId ? false : p.isSpeaking,
          }))
        );
      }, 2000 + Math.random() * 3000);
    }, 5000 + Math.random() * 5000);

    simulationIntervalRef.current = interval;
    return () => clearInterval(interval);
  }, []);

  // Join meeting - gets local media and simulates joining
  const joinMeeting = useCallback(async () => {
    if (isJoining || isJoined) return;
    setIsJoining(true);
    setError(null);

    try {
      // Request camera and microphone
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user"
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      localStreamRef.current = stream;

      // Create local participant
      const local: LocalParticipant = {
        id: userId,
        sessionId: `session-${userId}`,
        userName,
        isLocal: true,
        isOwner: isHost,
        audioTrack: stream.getAudioTracks()[0] || null,
        videoTrack: stream.getVideoTracks()[0] || null,
        isMuted: false,
        isVideoOn: true,
        isSpeaking: false,
        isHandRaised: false,
        joinedAt: new Date(),
      };

      setLocalParticipant(local);

      // Add simulated participants after a delay for realism
      const simulated = createSimulatedParticipants();
      
      setTimeout(() => {
        setParticipants([local, ...simulated]);
        
        // Notify of simulated joins
        simulated.forEach((p, i) => {
          setTimeout(() => {
            onParticipantJoined?.(p);
            toast.info(`${p.userName} joined the meeting`);
          }, i * 800);
        });
      }, 500);

      // Set up audio level detection for speaking indicator
      setupAudioAnalysis(stream);

      setIsJoined(true);
      setIsJoining(false);
      onMeetingJoined?.();

      // Simulate random speaking activity from other participants
      startSpeakingSimulation(simulated);

    } catch (err) {
      console.error("Failed to join meeting:", err);
      const error = err instanceof Error ? err : new Error("Failed to access camera/microphone");
      setError(error);
      setIsJoining(false);
      onError?.(error);
    }
  }, [meetingId, userId, userName, isHost, isJoining, isJoined, createSimulatedParticipants, setupAudioAnalysis, startSpeakingSimulation, onMeetingJoined, onParticipantJoined, onError]);

  // Leave meeting
  const leaveMeeting = useCallback(async () => {
    // Stop all tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }

    // Stop audio analysis
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }

    // Stop simulation
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
    }

    setIsJoined(false);
    setIsScreenSharing(false);
    setParticipants([]);
    setLocalParticipant(null);
    setSpotlightedId(null);
    onMeetingLeft?.();
  }, [onMeetingLeft]);

  // Toggle microphone
  const toggleMicrophone = useCallback(async () => {
    if (!localStreamRef.current) return;
    
    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      const newMuted = !audioTrack.enabled;
      
      setLocalParticipant((prev) =>
        prev ? { ...prev, isMuted: newMuted } : null
      );
      
      // Update in participants list too
      setParticipants((prev) =>
        prev.map((p) => p.isLocal ? { ...p, isMuted: newMuted } : p)
      );
    }
  }, []);

  // Toggle camera
  const toggleCamera = useCallback(async () => {
    if (!localStreamRef.current) return;
    
    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      const newVideoOn = videoTrack.enabled;
      
      setLocalParticipant((prev) =>
        prev ? { ...prev, isVideoOn: newVideoOn } : null
      );
      
      // Update in participants list too
      setParticipants((prev) =>
        prev.map((p) => p.isLocal ? { ...p, isVideoOn: newVideoOn } : p)
      );
    }
  }, []);

  // Start screen share
  const startScreenShare = useCallback(async () => {
    if (isScreenSharing) return;

    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { 
          cursor: "always",
          displaySurface: "monitor",
        } as MediaTrackConstraints,
        audio: true,
      });

      screenStreamRef.current = screenStream;
      setIsScreenSharing(true);

      // Handle user stopping share via browser UI
      screenStream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };

      toast.success("Screen sharing started");
    } catch (err) {
      // User cancelled - not an error
      if ((err as Error).name !== "AbortError") {
        console.error("Screen share error:", err);
        toast.error("Failed to share screen");
      }
    }
  }, [isScreenSharing]);

  // Stop screen share
  const stopScreenShare = useCallback(() => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }
    setIsScreenSharing(false);
    toast.info("Screen sharing stopped");
  }, []);

  // Toggle raise hand
  const toggleRaiseHand = useCallback(() => {
    setLocalParticipant((prev) => {
      if (!prev) return null;
      const newRaised = !prev.isHandRaised;
      if (newRaised) {
        toast.info("Hand raised");
      }
      return { ...prev, isHandRaised: newRaised };
    });
    
    // Update in participants list
    setParticipants((prev) =>
      prev.map((p) => p.isLocal ? { ...p, isHandRaised: !p.isHandRaised } : p)
    );
  }, []);

  // Lower all hands (host only)
  const lowerAllHands = useCallback(() => {
    if (!isHost) return;
    
    setParticipants((prev) =>
      prev.map((p) => ({ ...p, isHandRaised: false }))
    );
    setLocalParticipant((prev) =>
      prev ? { ...prev, isHandRaised: false } : null
    );
    toast.info("All hands lowered");
  }, [isHost]);

  // Mute participant (host only)
  const muteParticipant = useCallback((participantId: string) => {
    if (!isHost) return;
    
    setParticipants((prev) =>
      prev.map((p) => p.id === participantId ? { ...p, isMuted: true } : p)
    );
    
    const participant = participants.find(p => p.id === participantId);
    if (participant) {
      toast.info(`${participant.userName} was muted`);
    }
  }, [isHost, participants]);

  // Mute all participants (host only)
  const muteAll = useCallback(() => {
    if (!isHost) return;
    
    setParticipants((prev) =>
      prev.map((p) => p.isLocal ? p : { ...p, isMuted: true })
    );
    toast.info("All participants muted");
  }, [isHost]);

  // Remove participant (host only)
  const removeParticipant = useCallback((participantId: string) => {
    if (!isHost) return;
    
    const participant = participants.find(p => p.id === participantId);
    if (participant && !participant.isLocal) {
      setParticipants((prev) => prev.filter((p) => p.id !== participantId));
      onParticipantLeft?.(participantId, participant.userName);
      toast.info(`${participant.userName} was removed from the meeting`);
    }
  }, [isHost, participants, onParticipantLeft]);

  // Set spotlight on participant
  const setSpotlight = useCallback((participantId: string | null) => {
    setSpotlightedId(participantId);
    if (participantId) {
      const participant = participants.find(p => p.id === participantId);
      if (participant) {
        toast.info(`Spotlighting ${participant.userName}`);
      }
    }
  }, [participants]);

  // Admit participant from waiting room (host only)
  const admitParticipant = useCallback((participantId: string) => {
    if (!isHost) return;
    
    const waiting = waitingParticipants.find(p => p.id === participantId);
    if (waiting) {
      setWaitingParticipants(prev => prev.filter(p => p.id !== participantId));
      
      // Add to participants
      const newParticipant: LocalParticipant = {
        id: waiting.id,
        sessionId: `session-${waiting.id}`,
        userName: waiting.userName,
        isLocal: false,
        isOwner: false,
        audioTrack: null,
        videoTrack: null,
        isMuted: true,
        isVideoOn: false,
        isSpeaking: false,
        isHandRaised: false,
        joinedAt: new Date(),
      };
      
      setParticipants(prev => [...prev, newParticipant]);
      onParticipantJoined?.(newParticipant);
      toast.success(`${waiting.userName} has joined the meeting`);
    }
  }, [isHost, waitingParticipants, onParticipantJoined]);

  // Deny participant from waiting room (host only)
  const denyParticipant = useCallback((participantId: string) => {
    if (!isHost) return;
    
    const waiting = waitingParticipants.find(p => p.id === participantId);
    if (waiting) {
      setWaitingParticipants(prev => prev.filter(p => p.id !== participantId));
      toast.info(`${waiting.userName} was denied entry`);
    }
  }, [isHost, waitingParticipants]);

  // Admit all waiting participants
  const admitAll = useCallback(() => {
    if (!isHost) return;
    waitingParticipants.forEach(p => admitParticipant(p.id));
  }, [isHost, waitingParticipants, admitParticipant]);

  // Deny all waiting participants
  const denyAll = useCallback(() => {
    if (!isHost) return;
    setWaitingParticipants([]);
    toast.info("All waiting participants denied");
  }, [isHost]);

  // Simulate waiting room participants (for demo)
  useEffect(() => {
    if (!isJoined || !isHost || !waitingRoomEnabled) return;

    // Simulate someone joining the waiting room after 10 seconds
    const timeout = setTimeout(() => {
      setWaitingParticipants([
        {
          id: "waiting-1",
          userName: "Sam Wilson",
          joinRequestTime: new Date(),
        },
      ]);
    }, 10000);

    return () => clearTimeout(timeout);
  }, [isJoined, isHost, waitingRoomEnabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
      }
    };
  }, []);

  // Get participants sorted by raised hand status
  const sortedParticipants = [...participants].sort((a, b) => {
    // Raised hands first
    if (a.isHandRaised && !b.isHandRaised) return -1;
    if (!a.isHandRaised && b.isHandRaised) return 1;
    // Then by speaking status
    if (a.isSpeaking && !b.isSpeaking) return -1;
    if (!a.isSpeaking && b.isSpeaking) return 1;
    // Then by join time
    return a.joinedAt.getTime() - b.joinedAt.getTime();
  });

  return {
    // State
    participants: sortedParticipants,
    localParticipant,
    waitingParticipants,
    activeSpeakerId,
    spotlightedId,
    isJoining,
    isJoined,
    isScreenSharing,
    roomUrl: `local://${meetingId}`,
    error,
    callObject: null,
    localStream: localStreamRef.current,
    screenStream: screenStreamRef.current,
    
    // Actions
    joinMeeting,
    leaveMeeting,
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
  };
}
