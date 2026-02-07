import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RealtimeChannel } from "@supabase/supabase-js";
import { useWebRTC } from "./useWebRTC";

export interface RealtimeParticipant {
  id: string;
  sessionId: string;
  userName: string;
  isLocal: boolean;
  isOwner: boolean;
  isMuted: boolean;
  isVideoOn: boolean;
  isSpeaking: boolean;
  isHandRaised: boolean;
  joinedAt: Date;
  avatarUrl?: string;
  remoteStream?: MediaStream | null;
}

export interface WaitingParticipant {
  id: string;
  userName: string;
  joinRequestTime: Date;
}

interface UseRealtimeMeetingOptions {
  meetingId: string;
  userId: string;
  userName: string;
  isHost: boolean;
  waitingRoomEnabled?: boolean;
  onMeetingJoined?: () => void;
  onMeetingLeft?: () => void;
  onParticipantJoined?: (participant: RealtimeParticipant) => void;
  onParticipantLeft?: (participantId: string, userName: string) => void;
  onError?: (error: Error) => void;
}

/**
 * Real-time meeting with WebRTC peer connections for actual audio/video streaming
 * Uses Supabase Realtime for presence + signaling
 */
export function useRealtimeMeetingWebRTC({
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
}: UseRealtimeMeetingOptions) {
  const [participants, setParticipants] = useState<RealtimeParticipant[]>([]);
  const [localParticipant, setLocalParticipant] = useState<RealtimeParticipant | null>(null);
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
  const channelRef = useRef<RealtimeChannel | null>(null);

  // WebRTC for actual audio/video
  const webrtc = useWebRTC({
    meetingId,
    localUserId: userId,
    localStream: localStreamRef.current,
    onRemoteStream: (peerId, stream) => {
      console.log(`Received remote stream from ${peerId}`);
      setParticipants((prev) =>
        prev.map((p) =>
          p.id === peerId ? { ...p, remoteStream: stream } : p
        )
      );
    },
    onPeerDisconnected: (peerId) => {
      console.log(`Peer disconnected: ${peerId}`);
    },
  });

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

  // Track presence state
  const trackPresence = useCallback(async (state: Partial<RealtimeParticipant>) => {
    if (!channelRef.current || !localParticipant) return;
    
    await channelRef.current.track({
      id: userId,
      userName,
      isHost,
      isMuted: state.isMuted ?? localParticipant.isMuted,
      isVideoOn: state.isVideoOn ?? localParticipant.isVideoOn,
      isSpeaking: state.isSpeaking ?? localParticipant.isSpeaking,
      isHandRaised: state.isHandRaised ?? localParticipant.isHandRaised,
      joinedAt: localParticipant.joinedAt.toISOString(),
    });
  }, [userId, userName, isHost, localParticipant]);

  // Join meeting
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
      const local: RealtimeParticipant = {
        id: userId,
        sessionId: `session-${userId}-${Date.now()}`,
        userName,
        isLocal: true,
        isOwner: isHost,
        isMuted: false,
        isVideoOn: true,
        isSpeaking: false,
        isHandRaised: false,
        joinedAt: new Date(),
      };

      setLocalParticipant(local);
      setParticipants([local]);

      // Setup audio analysis
      setupAudioAnalysis(stream);

      // Subscribe to presence channel
      const channel = supabase.channel(`meeting:${meetingId}`, {
        config: { presence: { key: userId } },
      });

      channel
        .on("presence", { event: "sync" }, () => {
          const presenceState = channel.presenceState();
          
          const remoteParticipants: RealtimeParticipant[] = [];
          
          Object.entries(presenceState).forEach(([key, presences]) => {
            if (key === userId) return;
            
            const presence = (presences as any[])[0];
            if (presence) {
              // Get remote stream if available
              const existingStream = webrtc.remoteStreams.get(presence.id);
              
              remoteParticipants.push({
                id: presence.id,
                sessionId: `session-${presence.id}`,
                userName: presence.userName,
                isLocal: false,
                isOwner: presence.isHost,
                isMuted: presence.isMuted,
                isVideoOn: presence.isVideoOn,
                isSpeaking: presence.isSpeaking,
                isHandRaised: presence.isHandRaised,
                joinedAt: new Date(presence.joinedAt),
                remoteStream: existingStream || null,
              });
            }
          });
          
          setParticipants((prev) => {
            const localP = prev.find((p) => p.isLocal);
            return localP ? [localP, ...remoteParticipants] : remoteParticipants;
          });
        })
        .on("presence", { event: "join" }, ({ key, newPresences }) => {
          const presence = (newPresences as any[])[0];
          if (presence && presence.id !== userId) {
            const newParticipant: RealtimeParticipant = {
              id: presence.id,
              sessionId: `session-${presence.id}`,
              userName: presence.userName,
              isLocal: false,
              isOwner: presence.isHost,
              isMuted: presence.isMuted,
              isVideoOn: presence.isVideoOn,
              isSpeaking: false,
              isHandRaised: presence.isHandRaised,
              joinedAt: new Date(presence.joinedAt),
            };
            
            onParticipantJoined?.(newParticipant);
            toast.info(`${presence.userName} joined the meeting`);
          }
        })
        .on("presence", { event: "leave" }, ({ key, leftPresences }) => {
          const presence = (leftPresences as any[])[0];
          if (presence && presence.id !== userId) {
            onParticipantLeft?.(presence.id, presence.userName);
            toast.info(`${presence.userName} left the meeting`);
          }
        });

      // Broadcast event handlers
      channel.on("broadcast", { event: "mute_participant" }, ({ payload }) => {
        if ((payload as any).participantId === userId) {
          const audioTrack = localStreamRef.current?.getAudioTracks()[0];
          if (audioTrack) {
            audioTrack.enabled = false;
            setLocalParticipant((prev) => prev ? { ...prev, isMuted: true } : null);
            setParticipants((prev) => prev.map((p) => p.isLocal ? { ...p, isMuted: true } : p));
            toast.info("You were muted by the host");
          }
        }
      });

      channel.on("broadcast", { event: "mute_all" }, () => {
        if (!isHost) {
          const audioTrack = localStreamRef.current?.getAudioTracks()[0];
          if (audioTrack) {
            audioTrack.enabled = false;
            setLocalParticipant((prev) => prev ? { ...prev, isMuted: true } : null);
            setParticipants((prev) => prev.map((p) => p.isLocal ? { ...p, isMuted: true } : p));
            toast.info("You were muted by the host");
          }
        }
      });

      channel.on("broadcast", { event: "lower_all_hands" }, () => {
        setLocalParticipant((prev) => prev ? { ...prev, isHandRaised: false } : null);
        setParticipants((prev) => prev.map((p) => ({ ...p, isHandRaised: false })));
      });

      channel.on("broadcast", { event: "remove_participant" }, ({ payload }) => {
        if ((payload as any).participantId === userId) {
          toast.error("You were removed from the meeting");
          leaveMeeting();
        }
      });

      await channel.subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            id: userId,
            userName,
            isHost,
            isMuted: false,
            isVideoOn: true,
            isSpeaking: false,
            isHandRaised: false,
            joinedAt: new Date().toISOString(),
          });
          
          // Initialize WebRTC signaling
          await webrtc.initializeSignaling();
        }
      });

      channelRef.current = channel;

      setIsJoined(true);
      setIsJoining(false);
      onMeetingJoined?.();

    } catch (err) {
      console.error("Failed to join meeting:", err);
      const error = err instanceof Error ? err : new Error("Failed to access camera/microphone");
      setError(error);
      setIsJoining(false);
      onError?.(error);
    }
  }, [meetingId, userId, userName, isHost, isJoining, isJoined, setupAudioAnalysis, webrtc, onMeetingJoined, onParticipantJoined, onParticipantLeft, onError]);

  // Leave meeting
  const leaveMeeting = useCallback(async () => {
    // Cleanup WebRTC
    webrtc.cleanup();

    // Unsubscribe from presence
    if (channelRef.current) {
      await supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Stop tracks
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

    setIsJoined(false);
    setIsScreenSharing(false);
    setParticipants([]);
    setLocalParticipant(null);
    setSpotlightedId(null);
    onMeetingLeft?.();
  }, [webrtc, onMeetingLeft]);

  // Toggle microphone
  const toggleMicrophone = useCallback(async () => {
    if (!localStreamRef.current) return;
    
    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      const newMuted = !audioTrack.enabled;
      
      setLocalParticipant((prev) => {
        if (!prev) return null;
        trackPresence({ isMuted: newMuted });
        return { ...prev, isMuted: newMuted };
      });
      
      setParticipants((prev) =>
        prev.map((p) => p.isLocal ? { ...p, isMuted: newMuted } : p)
      );
    }
  }, [trackPresence]);

  // Toggle camera
  const toggleCamera = useCallback(async () => {
    if (!localStreamRef.current) return;
    
    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      const newVideoOn = videoTrack.enabled;
      
      setLocalParticipant((prev) => {
        if (!prev) return null;
        trackPresence({ isVideoOn: newVideoOn });
        return { ...prev, isVideoOn: newVideoOn };
      });
      
      setParticipants((prev) =>
        prev.map((p) => p.isLocal ? { ...p, isVideoOn: newVideoOn } : p)
      );
    }
  }, [trackPresence]);

  // Screen sharing
  const startScreenShare = useCallback(async () => {
    if (isScreenSharing) return;

    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: "always" } as MediaTrackConstraints,
        audio: true,
      });

      screenStreamRef.current = screenStream;
      setIsScreenSharing(true);

      screenStream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };

      toast.success("Screen sharing started");
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        console.error("Screen share error:", err);
        toast.error("Failed to share screen");
      }
    }
  }, [isScreenSharing]);

  const stopScreenShare = useCallback(() => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }
    setIsScreenSharing(false);
    toast.info("Screen sharing stopped");
  }, []);

  // Raise hand
  const toggleRaiseHand = useCallback(() => {
    setLocalParticipant((prev) => {
      if (!prev) return null;
      const newRaised = !prev.isHandRaised;
      if (newRaised) toast.info("Hand raised");
      trackPresence({ isHandRaised: newRaised });
      return { ...prev, isHandRaised: newRaised };
    });
    
    setParticipants((prev) =>
      prev.map((p) => p.isLocal ? { ...p, isHandRaised: !p.isHandRaised } : p)
    );
  }, [trackPresence]);

  // Host controls
  const lowerAllHands = useCallback(() => {
    if (!isHost) return;
    channelRef.current?.send({
      type: "broadcast",
      event: "lower_all_hands",
      payload: {},
    });
    setParticipants((prev) => prev.map((p) => ({ ...p, isHandRaised: false })));
    setLocalParticipant((prev) => prev ? { ...prev, isHandRaised: false } : null);
    toast.info("All hands lowered");
  }, [isHost]);

  const muteParticipant = useCallback((participantId: string) => {
    if (!isHost) return;
    channelRef.current?.send({
      type: "broadcast",
      event: "mute_participant",
      payload: { participantId },
    });
    const participant = participants.find((p) => p.id === participantId);
    if (participant) toast.info(`${participant.userName} was muted`);
  }, [isHost, participants]);

  const muteAll = useCallback(() => {
    if (!isHost) return;
    channelRef.current?.send({
      type: "broadcast",
      event: "mute_all",
      payload: {},
    });
    toast.info("All participants muted");
  }, [isHost]);

  const removeParticipant = useCallback((participantId: string) => {
    if (!isHost) return;
    const participant = participants.find((p) => p.id === participantId);
    if (participant && !participant.isLocal) {
      channelRef.current?.send({
        type: "broadcast",
        event: "remove_participant",
        payload: { participantId },
      });
      setParticipants((prev) => prev.filter((p) => p.id !== participantId));
      onParticipantLeft?.(participantId, participant.userName);
      toast.info(`${participant.userName} was removed from the meeting`);
    }
  }, [isHost, participants, onParticipantLeft]);

  const setSpotlight = useCallback((participantId: string | null) => {
    setSpotlightedId(participantId);
    if (participantId) {
      const participant = participants.find((p) => p.id === participantId);
      if (participant) toast.info(`Spotlighting ${participant.userName}`);
    }
  }, [participants]);

  // Waiting room stubs
  const admitParticipant = useCallback((_id: string) => {}, []);
  const denyParticipant = useCallback((_id: string) => {}, []);
  const admitAll = useCallback(() => {}, []);
  const denyAll = useCallback(() => {}, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
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
    };
  }, []);

  // Sort participants
  const sortedParticipants = [...participants].sort((a, b) => {
    if (a.isHandRaised && !b.isHandRaised) return -1;
    if (!a.isHandRaised && b.isHandRaised) return 1;
    if (a.isSpeaking && !b.isSpeaking) return -1;
    if (!a.isSpeaking && b.isSpeaking) return 1;
    return a.joinedAt.getTime() - b.joinedAt.getTime();
  });

  return {
    participants: sortedParticipants,
    localParticipant,
    waitingParticipants,
    activeSpeakerId,
    spotlightedId,
    isJoining,
    isJoined,
    isScreenSharing,
    roomUrl: `${window.location.origin}/meeting/${meetingId}`,
    error,
    callObject: null,
    localStream: localStreamRef.current,
    screenStream: screenStreamRef.current,
    remoteStreams: webrtc.remoteStreams,
    
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
