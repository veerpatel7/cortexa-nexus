import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PresenceEvent, PresenceUser } from "@/hooks/useRealtimePresence";
import { cn } from "@/lib/utils";
import { UserPlus, UserMinus, Sparkles } from "lucide-react";

interface ParticipantJoinNotificationProps {
  events: PresenceEvent[];
  className?: string;
}

interface NotificationItem {
  id: string;
  event: PresenceEvent;
  visible: boolean;
}

export function ParticipantJoinNotification({
  events,
  className,
}: ParticipantJoinNotificationProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Process new events
  useEffect(() => {
    if (events.length === 0) return;

    const latestEvent = events[0];
    const notificationId = `${latestEvent.type}-${latestEvent.user.id}-${latestEvent.timestamp.getTime()}`;

    // Check if we already have this notification
    const exists = notifications.some(n => n.id === notificationId);
    if (exists) return;

    // Only show join/leave notifications
    if (latestEvent.type !== 'join' && latestEvent.type !== 'leave') return;

    // Add new notification
    setNotifications(prev => [
      { id: notificationId, event: latestEvent, visible: true },
      ...prev.slice(0, 4), // Keep max 5 notifications
    ]);

    // Auto-dismiss after 4 seconds
    setTimeout(() => {
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, visible: false } : n)
      );
    }, 4000);

    // Remove from list after animation
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    }, 4500);
  }, [events]);

  return (
    <div className={cn("fixed top-20 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none", className)}>
      <AnimatePresence mode="popLayout">
        {notifications.filter(n => n.visible).map(({ id, event }) => (
          <NotificationToast key={id} event={event} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function NotificationToast({ event }: { event: PresenceEvent }) {
  const isJoin = event.type === 'join';
  const user = event.user;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{
        type: "spring",
        stiffness: 500,
        damping: 30,
      }}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-2xl shadow-elevation-3 pointer-events-auto",
        "backdrop-blur-xl border",
        isJoin 
          ? "bg-primary/10 border-primary/30" 
          : "bg-muted/80 border-border/50"
      )}
    >
      {/* Avatar */}
      <div className="relative">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 500 }}
          className={cn(
            "w-10 h-10 rounded-full overflow-hidden ring-2",
            isJoin ? "ring-primary/50" : "ring-muted-foreground/30"
          )}
        >
          <img
            src={user.avatarUrl}
            alt={user.userName}
            className="w-full h-full object-cover"
          />
        </motion.div>
        
        {/* Status Badge */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 600 }}
          className={cn(
            "absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center",
            isJoin ? "bg-primary" : "bg-muted-foreground"
          )}
        >
          {isJoin ? (
            <UserPlus className="w-3 h-3 text-primary-foreground" />
          ) : (
            <UserMinus className="w-3 h-3 text-background" />
          )}
        </motion.div>
      </div>

      {/* Content */}
      <div className="flex flex-col">
        <motion.span
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          className="text-sm font-semibold text-foreground"
        >
          {user.userName}
        </motion.span>
        <motion.span
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className={cn(
            "text-xs",
            isJoin ? "text-primary" : "text-muted-foreground"
          )}
        >
          {isJoin ? "joined the meeting" : "left the meeting"}
        </motion.span>
      </div>

      {/* Sparkle effect for joins */}
      {isJoin && (
        <motion.div
          initial={{ opacity: 0, rotate: -30 }}
          animate={{ opacity: 1, rotate: 0 }}
          transition={{ delay: 0.25, type: "spring" }}
        >
          <Sparkles className="w-4 h-4 text-aurora-gold" />
        </motion.div>
      )}
    </motion.div>
  );
}

// Compact inline notification for use in meeting room
export function ParticipantJoinBanner({
  user,
  type,
  onDismiss,
  className,
}: {
  user: PresenceUser;
  type: 'join' | 'leave';
  onDismiss?: () => void;
  className?: string;
}) {
  const isJoin = type === 'join';

  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss?.();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-xl text-sm",
        isJoin 
          ? "bg-primary/15 text-primary border border-primary/30" 
          : "bg-muted/50 text-muted-foreground border border-border/50",
        className
      )}
    >
      <img
        src={user.avatarUrl}
        alt={user.userName}
        className="w-6 h-6 rounded-full"
      />
      <span className="font-medium">{user.userName}</span>
      <span className="text-xs opacity-70">
        {isJoin ? "joined" : "left"}
      </span>
    </motion.div>
  );
}
