import { useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";

export interface ReactionBroadcast {
  emoji: string;
  sender: {
    id: string;
    name: string;
    avatar: string;
  };
  isBurst: boolean;
  timestamp: number;
}

interface UseRealtimeReactionsOptions {
  meetingId: string;
  currentUser: {
    id: string;
    name: string;
    avatar: string;
  };
  onReactionReceived: (reaction: ReactionBroadcast) => void;
}

export function useRealtimeReactions({
  meetingId,
  currentUser,
  onReactionReceived,
}: UseRealtimeReactionsOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    // Create a broadcast channel for this meeting's reactions
    const channel = supabase.channel(`meeting-reactions:${meetingId}`, {
      config: {
        broadcast: {
          self: false, // Don't receive our own broadcasts
        },
      },
    });

    channel
      .on("broadcast", { event: "reaction" }, (payload) => {
        console.log("Received reaction broadcast:", payload);
        const reaction = payload.payload as ReactionBroadcast;
        onReactionReceived(reaction);
      })
      .subscribe((status) => {
        console.log("Reaction channel status:", status);
      });

    channelRef.current = channel;

    return () => {
      console.log("Cleaning up reaction channel");
      channel.unsubscribe();
    };
  }, [meetingId, onReactionReceived]);

  // Broadcast a reaction to all participants
  const broadcastReaction = useCallback(
    async (emoji: string, isBurst: boolean = false) => {
      if (!channelRef.current) {
        console.warn("Reaction channel not initialized");
        return;
      }

      const reaction: ReactionBroadcast = {
        emoji,
        sender: currentUser,
        isBurst,
        timestamp: Date.now(),
      };

      console.log("Broadcasting reaction:", reaction);

      await channelRef.current.send({
        type: "broadcast",
        event: "reaction",
        payload: reaction,
      });
    },
    [currentUser]
  );

  return {
    broadcastReaction,
  };
}
