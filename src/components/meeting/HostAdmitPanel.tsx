import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Check, X, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface WaitingParticipant {
  id: string;
  userName: string;
  joinRequestTime: Date;
}

interface HostAdmitPanelProps {
  waitingParticipants: WaitingParticipant[];
  onAdmit: (participantId: string) => void;
  onDeny: (participantId: string) => void;
  onAdmitAll: () => void;
  onDenyAll: () => void;
  className?: string;
}

/**
 * Panel shown to hosts for managing waiting room participants
 * Allows admitting or denying entry to the meeting
 */
export function HostAdmitPanel({
  waitingParticipants,
  onAdmit,
  onDeny,
  onAdmitAll,
  onDenyAll,
  className,
}: HostAdmitPanelProps) {
  if (waitingParticipants.length === 0) return null;

  const formatWaitTime = (joinTime: Date) => {
    const seconds = Math.floor((Date.now() - joinTime.getTime()) / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ago`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        "fixed top-20 right-6 z-50 w-80",
        className
      )}
    >
      <div className="glass-panel rounded-2xl overflow-hidden shadow-glow-lg border border-primary/20">
        {/* Header */}
        <div className="px-4 py-3 bg-primary/10 border-b border-border/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Users className="w-4 h-4 text-primary" />
              <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-primary animate-pulse" />
            </div>
            <span className="font-medium text-foreground">
              Waiting ({waitingParticipants.length})
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onAdmitAll}
              className="h-7 px-2 text-xs text-primary hover:text-primary"
            >
              Admit all
            </Button>
          </div>
        </div>

        {/* Participants List */}
        <ScrollArea className="max-h-64">
          <div className="p-2 space-y-1">
            <AnimatePresence>
              {waitingParticipants.map((participant) => (
                <motion.div
                  key={participant.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-surface-2/50 transition-colors group"
                >
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-surface-3 flex items-center justify-center shrink-0">
                    <span className="text-sm font-medium text-foreground">
                      {participant.userName.charAt(0).toUpperCase()}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {participant.userName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatWaitTime(participant.joinRequestTime)}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="iconSm"
                      onClick={() => onDeny(participant.id)}
                      className="h-7 w-7 text-destructive hover:bg-destructive/10"
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="iconSm"
                      onClick={() => onAdmit(participant.id)}
                      className="h-7 w-7 bg-primary/20 text-primary hover:bg-primary/30"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </ScrollArea>

        {/* Footer */}
        {waitingParticipants.length > 1 && (
          <div className="px-3 py-2 border-t border-border/50 flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={onDenyAll}
              className="h-7 px-2 text-xs text-muted-foreground"
            >
              Deny all
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/**
 * Small notification badge for waiting room activity
 */
export function WaitingBadge({ 
  count, 
  onClick 
}: { 
  count: number; 
  onClick?: () => void;
}) {
  if (count === 0) return null;

  return (
    <motion.button
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      onClick={onClick}
      className="relative flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/20 text-primary text-xs font-medium hover:bg-primary/30 transition-colors"
    >
      <Bell className="w-3 h-3" />
      <span>{count} waiting</span>
      <motion.div
        className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-primary"
        animate={{ scale: [1, 1.3, 1] }}
        transition={{ duration: 1, repeat: Infinity }}
      />
    </motion.button>
  );
}
