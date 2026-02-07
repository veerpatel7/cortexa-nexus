import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";
import { toast } from "sonner";

interface PeerConnection {
  peerId: string;
  connection: RTCPeerConnection;
  remoteStream: MediaStream | null;
}

interface SignalingMessage {
  type: "offer" | "answer" | "ice-candidate";
  from: string;
  to: string;
  payload: RTCSessionDescriptionInit | RTCIceCandidateInit;
}

interface UseWebRTCOptions {
  meetingId: string;
  localUserId: string;
  localStream: MediaStream | null;
  onRemoteStream?: (peerId: string, stream: MediaStream) => void;
  onPeerDisconnected?: (peerId: string) => void;
}

// ICE servers for STUN/TURN
const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
  ],
};

/**
 * WebRTC peer connections hook for real audio/video streaming
 * Uses Supabase Realtime for signaling
 */
export function useWebRTC({
  meetingId,
  localUserId,
  localStream,
  onRemoteStream,
  onPeerDisconnected,
}: UseWebRTCOptions) {
  const [peers, setPeers] = useState<Map<string, PeerConnection>>(new Map());
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [isConnecting, setIsConnecting] = useState(false);
  
  const signalingChannelRef = useRef<RealtimeChannel | null>(null);
  const peersRef = useRef<Map<string, PeerConnection>>(new Map());

  // Create a new peer connection
  const createPeerConnection = useCallback((peerId: string): RTCPeerConnection => {
    console.log(`Creating peer connection for: ${peerId}`);
    
    const pc = new RTCPeerConnection(ICE_SERVERS);

    // Add local tracks to connection
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });
    }

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        signalingChannelRef.current?.send({
          type: "broadcast",
          event: "signaling",
          payload: {
            type: "ice-candidate",
            from: localUserId,
            to: peerId,
            payload: event.candidate.toJSON(),
          } as SignalingMessage,
        });
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log(`Connection state with ${peerId}: ${pc.connectionState}`);
      
      if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
        removePeer(peerId);
        onPeerDisconnected?.(peerId);
      }
    };

    // Handle incoming remote tracks
    pc.ontrack = (event) => {
      console.log(`Received remote track from ${peerId}`);
      
      const remoteStream = event.streams[0];
      if (remoteStream) {
        setRemoteStreams((prev) => {
          const updated = new Map(prev);
          updated.set(peerId, remoteStream);
          return updated;
        });
        
        onRemoteStream?.(peerId, remoteStream);
      }
    };

    return pc;
  }, [localStream, localUserId, onRemoteStream, onPeerDisconnected]);

  // Remove a peer connection
  const removePeer = useCallback((peerId: string) => {
    const peer = peersRef.current.get(peerId);
    if (peer) {
      peer.connection.close();
      peersRef.current.delete(peerId);
      setPeers(new Map(peersRef.current));
      
      setRemoteStreams((prev) => {
        const updated = new Map(prev);
        updated.delete(peerId);
        return updated;
      });
    }
  }, []);

  // Initiate connection to a new peer (caller side)
  const connectToPeer = useCallback(async (peerId: string) => {
    if (peersRef.current.has(peerId)) {
      console.log(`Already connected to ${peerId}`);
      return;
    }

    console.log(`Initiating connection to ${peerId}`);
    
    const pc = createPeerConnection(peerId);
    
    peersRef.current.set(peerId, {
      peerId,
      connection: pc,
      remoteStream: null,
    });
    setPeers(new Map(peersRef.current));

    try {
      // Create and send offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      signalingChannelRef.current?.send({
        type: "broadcast",
        event: "signaling",
        payload: {
          type: "offer",
          from: localUserId,
          to: peerId,
          payload: offer,
        } as SignalingMessage,
      });
    } catch (err) {
      console.error(`Failed to create offer for ${peerId}:`, err);
      removePeer(peerId);
    }
  }, [localUserId, createPeerConnection, removePeer]);

  // Handle incoming signaling message
  const handleSignalingMessage = useCallback(async (message: SignalingMessage) => {
    // Ignore messages not meant for us
    if (message.to !== localUserId) return;

    const { type, from: peerId, payload } = message;

    switch (type) {
      case "offer": {
        console.log(`Received offer from ${peerId}`);
        
        let pc = peersRef.current.get(peerId)?.connection;
        
        if (!pc) {
          pc = createPeerConnection(peerId);
          peersRef.current.set(peerId, {
            peerId,
            connection: pc,
            remoteStream: null,
          });
          setPeers(new Map(peersRef.current));
        }

        try {
          await pc.setRemoteDescription(new RTCSessionDescription(payload as RTCSessionDescriptionInit));
          
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          signalingChannelRef.current?.send({
            type: "broadcast",
            event: "signaling",
            payload: {
              type: "answer",
              from: localUserId,
              to: peerId,
              payload: answer,
            } as SignalingMessage,
          });
        } catch (err) {
          console.error(`Failed to handle offer from ${peerId}:`, err);
        }
        break;
      }

      case "answer": {
        console.log(`Received answer from ${peerId}`);
        
        const pc = peersRef.current.get(peerId)?.connection;
        if (pc) {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(payload as RTCSessionDescriptionInit));
          } catch (err) {
            console.error(`Failed to set remote description from ${peerId}:`, err);
          }
        }
        break;
      }

      case "ice-candidate": {
        const pc = peersRef.current.get(peerId)?.connection;
        if (pc) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(payload as RTCIceCandidateInit));
          } catch (err) {
            console.error(`Failed to add ICE candidate from ${peerId}:`, err);
          }
        }
        break;
      }
    }
  }, [localUserId, createPeerConnection]);

  // Initialize signaling channel
  const initializeSignaling = useCallback(async () => {
    if (signalingChannelRef.current) return;
    
    setIsConnecting(true);

    const channel = supabase.channel(`webrtc:${meetingId}`);

    channel.on("broadcast", { event: "signaling" }, ({ payload }) => {
      handleSignalingMessage(payload as SignalingMessage);
    });

    // When a new participant joins, they announce themselves
    channel.on("broadcast", { event: "peer-joined" }, ({ payload }) => {
      const { peerId } = payload as { peerId: string };
      if (peerId !== localUserId) {
        // Existing peers initiate connection to new peer
        connectToPeer(peerId);
      }
    });

    channel.on("broadcast", { event: "peer-left" }, ({ payload }) => {
      const { peerId } = payload as { peerId: string };
      removePeer(peerId);
      onPeerDisconnected?.(peerId);
    });

    await channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        console.log("WebRTC signaling channel subscribed");
        
        // Announce ourselves to existing peers
        channel.send({
          type: "broadcast",
          event: "peer-joined",
          payload: { peerId: localUserId },
        });
        
        setIsConnecting(false);
      }
    });

    signalingChannelRef.current = channel;
  }, [meetingId, localUserId, handleSignalingMessage, connectToPeer, removePeer, onPeerDisconnected]);

  // Announce leaving
  const announceLeaving = useCallback(() => {
    signalingChannelRef.current?.send({
      type: "broadcast",
      event: "peer-left",
      payload: { peerId: localUserId },
    });
  }, [localUserId]);

  // Cleanup all connections
  const cleanup = useCallback(() => {
    announceLeaving();
    
    peersRef.current.forEach((peer) => {
      peer.connection.close();
    });
    peersRef.current.clear();
    setPeers(new Map());
    setRemoteStreams(new Map());

    if (signalingChannelRef.current) {
      supabase.removeChannel(signalingChannelRef.current);
      signalingChannelRef.current = null;
    }
  }, [announceLeaving]);

  // Update local stream tracks on all peers
  useEffect(() => {
    if (!localStream) return;

    peersRef.current.forEach((peer) => {
      const senders = peer.connection.getSenders();
      
      localStream.getTracks().forEach((track) => {
        const sender = senders.find((s) => s.track?.kind === track.kind);
        if (sender) {
          sender.replaceTrack(track);
        } else {
          peer.connection.addTrack(track, localStream);
        }
      });
    });
  }, [localStream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    peers,
    remoteStreams,
    isConnecting,
    initializeSignaling,
    connectToPeer,
    removePeer,
    cleanup,
  };
}
