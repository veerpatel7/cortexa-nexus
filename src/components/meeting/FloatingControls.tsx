import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ReactNode } from "react";

interface FloatingControlsProps {
  isIdle: boolean;
  forceVisible?: boolean;
  children: ReactNode;
  className?: string;
}

/**
 * Wrapper component that fades controls based on idle state
 * Provides calm, minimal UX by hiding controls when not needed
 */
export function FloatingControls({
  isIdle,
  forceVisible = false,
  children,
  className,
}: FloatingControlsProps) {
  const shouldShow = !isIdle || forceVisible;

  return (
    <motion.div
      initial={{ opacity: 1, y: 0 }}
      animate={{ 
        opacity: shouldShow ? 1 : 0,
        y: shouldShow ? 0 : 20,
      }}
      transition={{ 
        duration: 0.3,
        ease: "easeInOut",
      }}
      className={cn(
        "transition-all duration-300",
        !shouldShow && "pointer-events-none",
        className
      )}
    >
      {children}
    </motion.div>
  );
}
