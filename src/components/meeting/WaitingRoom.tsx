import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Clock, Users, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WaitingRoomProps {
  meetingTitle: string;
  userName: string;
  hostName?: string;
  position?: number;
  onLeave: () => void;
  className?: string;
}

/**
 * Calm waiting room UI shown when host approval is required
 * Displays while participant waits for host to admit them
 */
export function WaitingRoom({
  meetingTitle,
  userName,
  hostName = "the host",
  position = 1,
  onLeave,
  className,
}: WaitingRoomProps) {
  return (
    <div className={cn(
      "min-h-screen bg-background flex items-center justify-center p-6",
      className
    )}>
      {/* Ambient Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div 
          className="absolute top-1/4 left-1/4 w-[60%] h-[60%] rounded-full blur-[150px] bg-gradient-radial from-aurora-teal to-transparent opacity-[0.06]"
          style={{ animation: "ambient-float-1 20s ease-in-out infinite" }}
        />
        <div 
          className="absolute bottom-1/4 right-1/4 w-[50%] h-[50%] rounded-full blur-[120px] bg-gradient-radial from-aurora-violet to-transparent opacity-[0.05]"
          style={{ animation: "ambient-float-2 25s ease-in-out infinite" }}
        />
      </div>

      <style>{`
        @keyframes ambient-float-1 {
          0%, 100% { transform: translate(0%, 0%) scale(1); }
          50% { transform: translate(5%, -5%) scale(1.05); }
        }
        @keyframes ambient-float-2 {
          0%, 100% { transform: translate(0%, 0%) scale(1); }
          50% { transform: translate(-5%, 5%) scale(1.05); }
        }
      `}</style>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 max-w-md w-full"
      >
        {/* Card */}
        <div className="glass-panel rounded-3xl p-8 text-center space-y-6">
          {/* Icon */}
          <div className="mx-auto w-20 h-20 rounded-2xl bg-surface-2 flex items-center justify-center">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Shield className="w-10 h-10 text-primary" />
            </motion.div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-foreground">
              Waiting to join
            </h1>
            <p className="text-muted-foreground">
              {hostName} will let you in soon
            </p>
          </div>

          {/* Meeting Info */}
          <div className="glass-panel rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center">
                <Users className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="text-left">
                <p className="font-medium text-foreground">{meetingTitle}</p>
                <p className="text-xs text-muted-foreground">Meeting</p>
              </div>
            </div>
            
            <div className="border-t border-border/50 pt-3 flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center">
                <Clock className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="text-left">
                <p className="font-medium text-foreground">Your position: #{position}</p>
                <p className="text-xs text-muted-foreground">Waiting queue</p>
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-sm font-medium text-primary">
                {userName.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-sm text-foreground">
              Joining as <span className="font-medium">{userName}</span>
            </span>
          </div>

          {/* Pulse Animation */}
          <div className="flex justify-center gap-1">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-primary"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </div>

          {/* Leave Button */}
          <Button
            variant="ghost"
            onClick={onLeave}
            className="text-muted-foreground hover:text-foreground"
          >
            Leave waiting room
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
