import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { 
  Loader2, 
  WifiOff, 
  RefreshCw, 
  Video, 
  VideoOff,
  Mic,
  MicOff,
  AlertCircle,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface MeetingStateProps {
  className?: string;
}

// Joining meeting state
export function JoiningState({ className }: MeetingStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        "flex flex-col items-center justify-center h-full",
        className
      )}
    >
      <div className="relative">
        {/* Outer glow rings */}
        <motion.div
          className="absolute inset-0 rounded-full bg-primary/20"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.3, 0, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute inset-0 rounded-full bg-primary/20"
          animate={{
            scale: [1, 1.8, 1],
            opacity: [0.2, 0, 0.2],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5,
          }}
        />
        
        {/* Center spinner */}
        <div className="relative w-16 h-16 rounded-full bg-surface-2 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </div>
      
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-6 text-foreground font-medium"
      >
        Joining meeting...
      </motion.p>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-sm text-muted-foreground mt-1"
      >
        Setting up your audio and video
      </motion.p>
    </motion.div>
  );
}

// Reconnecting state
export function ReconnectingState({ onRetry }: MeetingStateProps & { onRetry?: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center h-full"
    >
      <div className="w-16 h-16 rounded-full bg-aurora-rose/10 flex items-center justify-center mb-4">
        <WifiOff className="w-8 h-8 text-aurora-rose" />
      </div>
      
      <h3 className="text-foreground font-medium mb-1">Connection Lost</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Attempting to reconnect...
      </p>
      
      <div className="flex items-center gap-2">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <RefreshCw className="w-4 h-4 text-primary" />
        </motion.div>
        <span className="text-sm text-primary">Reconnecting</span>
      </div>

      {onRetry && (
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      )}
    </motion.div>
  );
}

// Empty meeting state (waiting for others)
export function EmptyMeetingState({ className }: MeetingStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "flex flex-col items-center justify-center h-full text-center px-4",
        className
      )}
    >
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-2xl bg-surface-2 flex items-center justify-center">
          <Users className="w-10 h-10 text-muted-foreground" />
        </div>
        
        {/* Animated dots */}
        <motion.div
          className="absolute -right-2 -bottom-1 w-3 h-3 rounded-full bg-primary"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </div>
      
      <h3 className="text-lg font-medium text-foreground mb-1">
        Waiting for others
      </h3>
      <p className="text-sm text-muted-foreground max-w-xs">
        You're the first one here. Share the meeting link to invite others.
      </p>
    </motion.div>
  );
}

// Permission blocked states
interface PermissionBlockedProps extends MeetingStateProps {
  type: "camera" | "microphone" | "both";
  onRequestPermission?: () => void;
}

export function PermissionBlocked({ 
  type, 
  onRequestPermission,
  className 
}: PermissionBlockedProps) {
  const Icon = type === "microphone" ? MicOff : type === "camera" ? VideoOff : AlertCircle;
  const message = {
    camera: "Camera access blocked",
    microphone: "Microphone access blocked",
    both: "Camera and microphone blocked",
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        "flex flex-col items-center justify-center p-6 text-center",
        className
      )}
    >
      <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-3">
        <Icon className="w-6 h-6 text-destructive" />
      </div>
      
      <h4 className="text-sm font-medium text-foreground mb-1">
        {message[type]}
      </h4>
      <p className="text-xs text-muted-foreground mb-3">
        Enable access in your browser settings
      </p>
      
      {onRequestPermission && (
        <Button variant="outline" size="sm" onClick={onRequestPermission}>
          Request Permission
        </Button>
      )}
    </motion.div>
  );
}

// Meeting error state
interface MeetingErrorProps {
  error: string;
  onRetry?: () => void;
  className?: string;
}

export function MeetingErrorState({ error, onRetry, className }: MeetingErrorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "min-h-screen flex flex-col items-center justify-center bg-background px-4",
        className
      )}
    >
      {/* Background ambient */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full blur-[120px] bg-destructive/5" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-[100px] bg-aurora-rose/5" />
      </div>

      <div className="relative z-10 max-w-md text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.1 }}
          className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-destructive/10 flex items-center justify-center"
        >
          <AlertCircle className="w-10 h-10 text-destructive" />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-xl font-semibold text-foreground mb-2"
        >
          Unable to Join Meeting
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-muted-foreground mb-6 leading-relaxed"
        >
          {error}
        </motion.p>

        {onRetry && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Button onClick={onRetry} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

// Network quality indicator
interface NetworkQualityProps {
  quality: "good" | "fair" | "poor";
  className?: string;
}

export function NetworkQuality({ quality, className }: NetworkQualityProps) {
  const bars = quality === "good" ? 3 : quality === "fair" ? 2 : 1;
  const color = quality === "good" ? "bg-primary" : quality === "fair" ? "bg-aurora-violet" : "bg-destructive";

  return (
    <div className={cn("flex items-end gap-0.5 h-3", className)}>
      {[1, 2, 3].map((bar) => (
        <div
          key={bar}
          className={cn(
            "w-1 rounded-sm transition-colors",
            bar <= bars ? color : "bg-surface-3"
          )}
          style={{ height: `${bar * 4}px` }}
        />
      ))}
    </div>
  );
}
