import { useState, useCallback, useEffect, useRef } from "react";
import DailyIframe, { DailyCall, DailyParticipant, DailyEventObjectParticipant, DailyEventObjectActiveSpeakerChange, DailyEventObjectParticipantLeft } from "@daily-co/daily-js";
import { supabase } from "@/integrations/supabase/client";

export interface MeetingParticipant {
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
  joinedAt: Date;
}

interface UseDailyMeetingOptions {
  meetingId: string;
  userId: string;
  userName: string;
  isHost: boolean;
  onParticipantJoined?: (participant: MeetingParticipant) => void;
  onParticipantLeft?: (participantId: string) => void;
  onActiveSpeakerChanged?: (participantId: string | null) => void;
  onMeetingJoined?: () => void;
  onMeetingLeft?: () => void;
  onError?: (error: Error) => void;
}

export function useDailyMeeting({
  meetingId,
  userId,
  userName,
  isHost,
  onParticipantJoined,
  onParticipantLeft,
  onActiveSpeakerChanged,
  onMeetingJoined,
  onMeetingLeft,
  onError,
}: UseDailyMeetingOptions) {
  const [callObject, setCallObject] = useState<DailyCall | null>(null);
  const [participants, setParticipants] = useState<Map<string, MeetingParticipant>>(new Map());
  const [localParticipant, setLocalParticipant] = useState<MeetingParticipant | null>(null);
  const [activeSpeakerId, setActiveSpeakerId] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [roomUrl, setRoomUrl] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const roomNameRef = useRef<string>("");

  // Convert Daily participant to our format
  const convertParticipant = useCallback((dailyP: DailyParticipant): MeetingParticipant => {
    const tracks = dailyP.tracks;
    return {
      id: dailyP.user_id || dailyP.session_id,
      sessionId: dailyP.session_id,
      userName: dailyP.user_name || "Guest",
      isLocal: dailyP.local,
      isOwner: dailyP.owner || false,
      audioTrack: tracks?.audio?.persistentTrack || null,
      videoTrack: tracks?.video?.persistentTrack || null,
      isMuted: tracks?.audio?.state !== "playable",
      isVideoOn: tracks?.video?.state === "playable",
      isSpeaking: false,
      joinedAt: new Date(dailyP.joined_at || Date.now()),
    };
  }, []);

  // Create or get room, then join
  const joinMeeting = useCallback(async () => {
    if (isJoining || isJoined) return;
    setIsJoining(true);
    setError(null);

    try {
      // Create/get room
      console.log("Creating/getting room for meeting:", meetingId);
      const { data: roomData, error: roomError } = await supabase.functions.invoke("daily-rooms/create", {
        body: { meetingId, meetingTitle: "Cortexa Meeting" },
      });

      if (roomError) throw new Error(roomError.message);
      if (!roomData?.room) throw new Error("Failed to create room");

      const room = roomData.room;
      roomNameRef.current = room.name;
      setRoomUrl(room.url);

      // Get meeting token
      console.log("Getting meeting token for user:", userName);
      const { data: tokenData, error: tokenError } = await supabase.functions.invoke("daily-rooms/token", {
        body: { roomName: room.name, userName, userId, isOwner: isHost },
      });

      if (tokenError) throw new Error(tokenError.message);
      if (!tokenData?.token) throw new Error("Failed to get meeting token");

      // Create Daily call object
      const call = DailyIframe.createCallObject({
        subscribeToTracksAutomatically: true,
      });

      // Set up event handlers
      call.on("joined-meeting", () => {
        console.log("Joined meeting successfully");
        setIsJoined(true);
        setIsJoining(false);
        onMeetingJoined?.();

        // Get initial participants
        const allParticipants = call.participants();
        const participantMap = new Map<string, MeetingParticipant>();
        
        Object.values(allParticipants).forEach((p) => {
          const converted = convertParticipant(p);
          if (p.local) {
            setLocalParticipant(converted);
          }
          participantMap.set(converted.id, converted);
        });
        
        setParticipants(participantMap);
      });

      call.on("left-meeting", () => {
        console.log("Left meeting");
        setIsJoined(false);
        setParticipants(new Map());
        setLocalParticipant(null);
        onMeetingLeft?.();
      });

      call.on("participant-joined", (event: DailyEventObjectParticipant | undefined) => {
        if (!event?.participant) return;
        const converted = convertParticipant(event.participant);
        console.log("Participant joined:", converted.userName);
        
        setParticipants((prev) => {
          const next = new Map(prev);
          next.set(converted.id, converted);
          return next;
        });
        
        onParticipantJoined?.(converted);
      });

      call.on("participant-left", (event: DailyEventObjectParticipantLeft | undefined) => {
        if (!event?.participant) return;
        const id = event.participant.user_id || event.participant.session_id;
        console.log("Participant left:", id);
        
        setParticipants((prev) => {
          const next = new Map(prev);
          next.delete(id);
          return next;
        });
        
        onParticipantLeft?.(id);
      });

      call.on("participant-updated", (event: DailyEventObjectParticipant | undefined) => {
        if (!event?.participant) return;
        const converted = convertParticipant(event.participant);
        
        setParticipants((prev) => {
          const next = new Map(prev);
          next.set(converted.id, converted);
          return next;
        });

        if (event.participant.local) {
          setLocalParticipant(converted);
        }
      });

      call.on("active-speaker-change", (event: DailyEventObjectActiveSpeakerChange | undefined) => {
        const speakerId = event?.activeSpeaker?.peerId || null;
        setActiveSpeakerId(speakerId);
        
        // Update speaking state for all participants
        setParticipants((prev) => {
          const next = new Map(prev);
          next.forEach((p, id) => {
            next.set(id, { ...p, isSpeaking: id === speakerId });
          });
          return next;
        });
        
        onActiveSpeakerChanged?.(speakerId);
      });

      call.on("error", (event) => {
        console.error("Daily error:", event);
        const err = new Error(event?.error?.message || "Meeting error");
        setError(err);
        onError?.(err);
      });

      setCallObject(call);

      // Join the meeting
      await call.join({ url: room.url, token: tokenData.token });
    } catch (err) {
      console.error("Failed to join meeting:", err);
      const error = err instanceof Error ? err : new Error("Failed to join meeting");
      setError(error);
      setIsJoining(false);
      onError?.(error);
    }
  }, [meetingId, userId, userName, isHost, isJoining, isJoined, convertParticipant, onParticipantJoined, onParticipantLeft, onActiveSpeakerChanged, onMeetingJoined, onMeetingLeft, onError]);

  // Leave meeting
  const leaveMeeting = useCallback(async () => {
    if (!callObject) return;
    
    try {
      await callObject.leave();
      callObject.destroy();
      setCallObject(null);
      setIsJoined(false);
      setParticipants(new Map());
      setLocalParticipant(null);

      // If host, delete the room
      if (isHost && roomNameRef.current) {
        await supabase.functions.invoke("daily-rooms/delete", {
          body: { roomName: roomNameRef.current },
        });
      }
    } catch (err) {
      console.error("Error leaving meeting:", err);
    }
  }, [callObject, isHost]);

  // Toggle microphone
  const toggleMicrophone = useCallback(async () => {
    if (!callObject) return;
    const current = callObject.localAudio();
    await callObject.setLocalAudio(!current);
  }, [callObject]);

  // Toggle camera
  const toggleCamera = useCallback(async () => {
    if (!callObject) return;
    const current = callObject.localVideo();
    await callObject.setLocalVideo(!current);
  }, [callObject]);

  // Start screen share
  const startScreenShare = useCallback(async () => {
    if (!callObject) return;
    try {
      await callObject.startScreenShare();
    } catch (err) {
      console.error("Screen share error:", err);
    }
  }, [callObject]);

  // Stop screen share
  const stopScreenShare = useCallback(async () => {
    if (!callObject) return;
    await callObject.stopScreenShare();
  }, [callObject]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (callObject) {
        callObject.leave();
        callObject.destroy();
      }
    };
  }, [callObject]);

  return {
    // State
    participants: Array.from(participants.values()),
    localParticipant,
    activeSpeakerId,
    isJoining,
    isJoined,
    roomUrl,
    error,
    callObject,
    
    // Actions
    joinMeeting,
    leaveMeeting,
    toggleMicrophone,
    toggleCamera,
    startScreenShare,
    stopScreenShare,
  };
}
