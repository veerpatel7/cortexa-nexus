import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";

export interface PresenceUser {
  id: string;
  userName: string;
  avatarUrl?: string;
  isHost: boolean;
  joinedAt: Date;
  lastSeen: Date;
  status: 'joining' | 'active' | 'idle' | 'leaving';
  isMuted: boolean;
  isVideoOn: boolean;
  isSpeaking: boolean;
  isHandRaised: boolean;
}

export interface PresenceEvent {
  type: 'join' | 'leave' | 'update';
  user: PresenceUser;
  timestamp: Date;
}

interface UseRealtimePresenceOptions {
  meetingId: string;
  userId: string;
  userName: string;
  isHost: boolean;
  avatarUrl?: string;
  onUserJoined?: (user: PresenceUser) => void;
  onUserLeft?: (user: PresenceUser) => void;
  onUserUpdated?: (user: PresenceUser) => void;
  onPresenceSync?: (users: PresenceUser[]) => void;
}

/**
 * Real-time presence tracking hook using Supabase Realtime
 * Provides live updates when participants join, leave, or update their state
 */
export function useRealtimePresence({
  meetingId,
  userId,
  userName,
  isHost,
  avatarUrl,
  onUserJoined,
  onUserLeft,
  onUserUpdated,
  onPresenceSync,
}: UseRealtimePresenceOptions) {
  const [users, setUsers] = useState<PresenceUser[]>([]);
  const [recentEvents, setRecentEvents] = useState<PresenceEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  
  const channelRef = useRef<RealtimeChannel | null>(null);
  const localUserRef = useRef<PresenceUser | null>(null);

  // Generate avatar URL
  const generateAvatarUrl = useCallback((name: string, seed?: string) => {
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed || name}&backgroundColor=transparent`;
  }, []);

  // Create presence user object
  const createPresenceUser = useCallback((
    id: string,
    name: string,
    host: boolean,
    avatar?: string,
    extras?: Partial<PresenceUser>
  ): PresenceUser => ({
    id,
    userName: name,
    avatarUrl: avatar || generateAvatarUrl(name, id),
    isHost: host,
    joinedAt: new Date(),
    lastSeen: new Date(),
    status: 'active',
    isMuted: false,
    isVideoOn: true,
    isSpeaking: false,
    isHandRaised: false,
    ...extras,
  }), [generateAvatarUrl]);

  // Add event to recent events (keep last 20)
  const addEvent = useCallback((event: PresenceEvent) => {
    setRecentEvents(prev => {
      const updated = [event, ...prev].slice(0, 20);
      return updated;
    });
  }, []);

  // Track local user presence
  const trackPresence = useCallback(async (updates?: Partial<PresenceUser>) => {
    if (!channelRef.current || !localUserRef.current) return;

    const currentUser = localUserRef.current;
    const updatedUser = { ...currentUser, ...updates, lastSeen: new Date() };
    localUserRef.current = updatedUser;

    try {
      await channelRef.current.track({
        id: updatedUser.id,
        userName: updatedUser.userName,
        avatarUrl: updatedUser.avatarUrl,
        isHost: updatedUser.isHost,
        joinedAt: updatedUser.joinedAt.toISOString(),
        lastSeen: new Date().toISOString(),
        status: updatedUser.status,
        isMuted: updatedUser.isMuted,
        isVideoOn: updatedUser.isVideoOn,
        isSpeaking: updatedUser.isSpeaking,
        isHandRaised: updatedUser.isHandRaised,
      });
    } catch (error) {
      console.error('Failed to track presence:', error);
    }
  }, []);

  // Update local user state
  const updateLocalState = useCallback((updates: Partial<PresenceUser>) => {
    if (localUserRef.current) {
      localUserRef.current = { ...localUserRef.current, ...updates };
      trackPresence(updates);
      
      // Update local users list
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, ...updates } : u
      ));
    }
  }, [userId, trackPresence]);

  // Join presence channel
  const joinPresence = useCallback(async () => {
    if (channelRef.current) return;

    setConnectionStatus('connecting');

    // Create local user
    const localUser = createPresenceUser(userId, userName, isHost, avatarUrl);
    localUserRef.current = localUser;

    // Create presence channel
    const channel = supabase.channel(`presence:${meetingId}`, {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    // Handle presence sync
    channel.on('presence', { event: 'sync' }, () => {
      const presenceState = channel.presenceState();
      const allUsers: PresenceUser[] = [];

      Object.entries(presenceState).forEach(([key, presences]) => {
        const presence = (presences as any[])[0];
        if (presence) {
          allUsers.push({
            id: presence.id,
            userName: presence.userName,
            avatarUrl: presence.avatarUrl,
            isHost: presence.isHost,
            joinedAt: new Date(presence.joinedAt),
            lastSeen: new Date(presence.lastSeen),
            status: key === userId ? 'active' : presence.status,
            isMuted: presence.isMuted,
            isVideoOn: presence.isVideoOn,
            isSpeaking: presence.isSpeaking,
            isHandRaised: presence.isHandRaised,
          });
        }
      });

      setUsers(allUsers);
      onPresenceSync?.(allUsers);
    });

    // Handle user join
    channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
      const presence = (newPresences as any[])[0];
      if (presence && presence.id !== userId) {
        const joinedUser: PresenceUser = {
          id: presence.id,
          userName: presence.userName,
          avatarUrl: presence.avatarUrl,
          isHost: presence.isHost,
          joinedAt: new Date(presence.joinedAt),
          lastSeen: new Date(presence.lastSeen),
          status: 'joining',
          isMuted: presence.isMuted,
          isVideoOn: presence.isVideoOn,
          isSpeaking: false,
          isHandRaised: false,
        };

        // Add join event
        addEvent({
          type: 'join',
          user: joinedUser,
          timestamp: new Date(),
        });

        onUserJoined?.(joinedUser);

        // Update status to active after a brief moment
        setTimeout(() => {
          setUsers(prev => prev.map(u => 
            u.id === joinedUser.id ? { ...u, status: 'active' } : u
          ));
        }, 1500);
      }
    });

    // Handle user leave
    channel.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
      const presence = (leftPresences as any[])[0];
      if (presence && presence.id !== userId) {
        const leftUser: PresenceUser = {
          id: presence.id,
          userName: presence.userName,
          avatarUrl: presence.avatarUrl,
          isHost: presence.isHost,
          joinedAt: new Date(presence.joinedAt),
          lastSeen: new Date(),
          status: 'leaving',
          isMuted: presence.isMuted,
          isVideoOn: presence.isVideoOn,
          isSpeaking: false,
          isHandRaised: false,
        };

        // Add leave event
        addEvent({
          type: 'leave',
          user: leftUser,
          timestamp: new Date(),
        });

        onUserLeft?.(leftUser);
      }
    });

    // Handle broadcasts for real-time updates
    channel.on('broadcast', { event: 'user_update' }, ({ payload }) => {
      if (payload.userId !== userId) {
        const updatedUser = payload as PresenceUser;
        
        setUsers(prev => prev.map(u => 
          u.id === updatedUser.id ? { ...u, ...updatedUser } : u
        ));

        addEvent({
          type: 'update',
          user: updatedUser,
          timestamp: new Date(),
        });

        onUserUpdated?.(updatedUser);
      }
    });

    // Subscribe to channel
    await channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        setIsConnected(true);
        setConnectionStatus('connected');

        // Track initial presence
        await channel.track({
          id: userId,
          userName,
          avatarUrl: avatarUrl || generateAvatarUrl(userName, userId),
          isHost,
          joinedAt: new Date().toISOString(),
          lastSeen: new Date().toISOString(),
          status: 'active',
          isMuted: false,
          isVideoOn: true,
          isSpeaking: false,
          isHandRaised: false,
        });

        console.log(`[Presence] Joined channel for meeting: ${meetingId}`);
      }
    });

    channelRef.current = channel;
  }, [meetingId, userId, userName, isHost, avatarUrl, createPresenceUser, generateAvatarUrl, addEvent, onUserJoined, onUserLeft, onUserUpdated, onPresenceSync]);

  // Leave presence channel
  const leavePresence = useCallback(async () => {
    if (channelRef.current) {
      await supabase.removeChannel(channelRef.current);
      channelRef.current = null;
      localUserRef.current = null;
      setIsConnected(false);
      setConnectionStatus('disconnected');
      setUsers([]);
      console.log(`[Presence] Left channel for meeting: ${meetingId}`);
    }
  }, [meetingId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  // Get other users (exclude self)
  const otherUsers = users.filter(u => u.id !== userId);

  // Get local user from state
  const localUser = users.find(u => u.id === userId) || localUserRef.current;

  return {
    users,
    otherUsers,
    localUser,
    recentEvents,
    isConnected,
    connectionStatus,
    joinPresence,
    leavePresence,
    updateLocalState,
    trackPresence,
  };
}
