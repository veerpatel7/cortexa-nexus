import { cn } from "@/lib/utils";
import { PresenceUser, PresenceEvent } from "@/hooks/useRealtimePresence";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  X, 
  Crown, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Hand,
  Sparkles,
  Wifi,
  WifiOff,
  Clock,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface LiveParticipantsListProps {
  users: PresenceUser[];
  localUserId: string;
  isConnected: boolean;
  recentEvents: PresenceEvent[];
  onClose?: () => void;
  className?: string;
}

export function LiveParticipantsList({
  users,
  localUserId,
  isConnected,
  recentEvents,
  onClose,
  className,
}: LiveParticipantsListProps) {
  // Sort users: local first, then hosts, then by join time
  const sortedUsers = [...users].sort((a, b) => {
    if (a.id === localUserId) return -1;
    if (b.id === localUserId) return 1;
    if (a.isHost && !b.isHost) return -1;
    if (!a.isHost && b.isHost) return 1;
    return a.joinedAt.getTime() - b.joinedAt.getTime();
  });

  // Get users with raised hands
  const raisedHands = users.filter(u => u.isHandRaised);

  return (
    <div className={cn("flex flex-col h-full bg-surface-0", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="font-semibold text-foreground">
              Participants
            </span>
            <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary text-xs font-medium">
              {users.length} live
            </span>
          </div>
          
          {/* Connection Status */}
          <div className={cn(
            "flex items-center gap-1 text-xs",
            isConnected ? "text-primary" : "text-destructive"
          )}>
            {isConnected ? (
              <>
                <Wifi className="w-3 h-3" />
                <span>Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3" />
                <span>Reconnecting...</span>
              </>
            )}
          </div>
        </div>

        {onClose && (
          <Button variant="ghost" size="iconSm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Raised Hands Alert */}
      <AnimatePresence>
        {raisedHands.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 py-2 bg-aurora-gold/10 border-b border-aurora-gold/30">
              <div className="flex items-center gap-2 text-sm text-aurora-gold">
                <Hand className="w-4 h-4" />
                <span className="font-medium">
                  {raisedHands.length} hand{raisedHands.length > 1 ? 's' : ''} raised
                </span>
                <div className="flex items-center gap-1 ml-2">
                  {raisedHands.slice(0, 3).map(u => (
                    <img
                      key={u.id}
                      src={u.avatarUrl}
                      alt={u.userName}
                      className="w-5 h-5 rounded-full ring-2 ring-aurora-gold/50"
                    />
                  ))}
                  {raisedHands.length > 3 && (
                    <span className="text-xs">+{raisedHands.length - 3}</span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Assistant */}
      <div className="px-4 py-3 border-b border-border/30">
        <motion.div 
          className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20"
          animate={{ opacity: [0.9, 1, 0.9] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-glow-sm">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Nova AI</p>
            <p className="text-xs text-primary">Listening & taking notes</p>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" style={{ animationDelay: "0.2s" }} />
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" style={{ animationDelay: "0.4s" }} />
          </div>
        </motion.div>
      </div>

      {/* Participants List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          <AnimatePresence mode="popLayout">
            {sortedUsers.map((user, index) => (
              <ParticipantRow 
                key={user.id} 
                user={user} 
                isLocal={user.id === localUserId}
                index={index}
              />
            ))}
          </AnimatePresence>

          {users.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Waiting for participants...</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Recent Activity */}
      {recentEvents.length > 0 && (
        <div className="border-t border-border/50 p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
            Recent Activity
          </p>
          <div className="space-y-1">
            {recentEvents.slice(0, 3).map((event, i) => (
              <motion.div
                key={`${event.type}-${event.user.id}-${event.timestamp.getTime()}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-2 text-xs text-muted-foreground"
              >
                <img
                  src={event.user.avatarUrl}
                  alt={event.user.userName}
                  className="w-4 h-4 rounded-full"
                />
                <span className="font-medium text-foreground">
                  {event.user.userName}
                </span>
                <span>
                  {event.type === 'join' ? 'joined' : 'left'}
                </span>
                <span className="ml-auto flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDistanceToNow(event.timestamp, { addSuffix: true })}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ParticipantRow({ 
  user, 
  isLocal,
  index,
}: { 
  user: PresenceUser;
  isLocal: boolean;
  index: number;
}) {
  const statusColors = {
    joining: "text-aurora-gold",
    active: "text-primary",
    idle: "text-muted-foreground",
    leaving: "text-destructive",
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ 
        type: "spring", 
        stiffness: 400, 
        damping: 25,
        delay: index * 0.03,
      }}
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl transition-all duration-200",
        isLocal ? "bg-primary/10 border border-primary/20" : "bg-surface-1 hover:bg-surface-2",
        user.isSpeaking && !user.isMuted && "ring-2 ring-primary/50"
      )}
    >
      {/* Avatar */}
      <div className="relative">
        <motion.div
          animate={user.isSpeaking && !user.isMuted ? {
            scale: [1, 1.05, 1],
          } : {}}
          transition={{ duration: 0.5, repeat: user.isSpeaking ? Infinity : 0 }}
          className={cn(
            "w-10 h-10 rounded-full overflow-hidden ring-2",
            user.isSpeaking && !user.isMuted ? "ring-primary" : "ring-transparent"
          )}
        >
          <img
            src={user.avatarUrl}
            alt={user.userName}
            className="w-full h-full object-cover"
          />
        </motion.div>

        {/* Online indicator */}
        <motion.div
          animate={user.status === 'active' ? { 
            scale: [1, 1.2, 1],
            opacity: [1, 0.8, 1],
          } : {}}
          transition={{ duration: 2, repeat: Infinity }}
          className={cn(
            "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-background",
            user.status === 'joining' ? "bg-aurora-gold" :
            user.status === 'active' ? "bg-primary" :
            user.status === 'leaving' ? "bg-destructive" : "bg-muted-foreground"
          )}
        />
      </div>

      {/* User Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground truncate">
            {user.userName}
          </span>
          {isLocal && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary font-medium">
              You
            </span>
          )}
          {user.isHost && (
            <Crown className="w-3.5 h-3.5 text-aurora-gold flex-shrink-0" />
          )}
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className={cn(statusColors[user.status], "capitalize")}>
            {user.status === 'active' ? 'In meeting' : user.status}
          </span>
        </div>
      </div>

      {/* Status Icons */}
      <div className="flex items-center gap-1.5">
        {user.isHandRaised && (
          <motion.div
            animate={{ y: [0, -2, 0] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          >
            <Hand className="w-4 h-4 text-aurora-gold" />
          </motion.div>
        )}
        <div className={cn(
          "p-1.5 rounded-lg",
          user.isMuted ? "bg-destructive/20 text-destructive" : "bg-surface-2 text-muted-foreground"
        )}>
          {user.isMuted ? (
            <MicOff className="w-3.5 h-3.5" />
          ) : (
            <Mic className="w-3.5 h-3.5" />
          )}
        </div>
        <div className={cn(
          "p-1.5 rounded-lg",
          !user.isVideoOn ? "bg-destructive/20 text-destructive" : "bg-surface-2 text-muted-foreground"
        )}>
          {user.isVideoOn ? (
            <Video className="w-3.5 h-3.5" />
          ) : (
            <VideoOff className="w-3.5 h-3.5" />
          )}
        </div>
      </div>
    </motion.div>
  );
}
