import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface RecordingIndicatorProps {
  isRecording: boolean;
  duration?: string;
  className?: string;
}

/**
 * Pulsing red indicator shown when meeting is being recorded
 * Visible to all participants as a recording notice
 */
export function RecordingIndicator({
  isRecording,
  duration,
  className,
}: RecordingIndicatorProps) {
  if (!isRecording) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-full bg-destructive/10 border border-destructive/30",
        className
      )}
    >
      {/* Pulsing dot */}
      <div className="relative">
        <div className="w-2 h-2 rounded-full bg-destructive" />
        <motion.div
          className="absolute inset-0 w-2 h-2 rounded-full bg-destructive"
          animate={{ scale: [1, 1.8, 1], opacity: [1, 0, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
      
      {/* Label */}
      <span className="text-xs font-medium text-destructive">REC</span>
      
      {/* Duration */}
      {duration && (
        <span className="text-xs font-mono text-destructive/80">{duration}</span>
      )}
    </motion.div>
  );
}
