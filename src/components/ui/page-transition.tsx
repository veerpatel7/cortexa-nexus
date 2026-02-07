import { motion, AnimatePresence, Variants } from "framer-motion";
import { ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
  mode?: "fade" | "slide" | "scale" | "slideUp";
}

const variants: Record<string, Variants> = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  slide: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  },
  scale: {
    initial: { opacity: 0, scale: 0.96 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.96 },
  },
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
  },
};

const transition = {
  type: "spring" as const,
  stiffness: 300,
  damping: 30,
};

export function PageTransition({ 
  children, 
  className,
  mode = "slideUp" 
}: PageTransitionProps) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={variants[mode]}
      transition={transition}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Wrapper for AnimatePresence with proper mode
interface PageTransitionWrapperProps {
  children: ReactNode;
  pageKey: string;
  className?: string;
  mode?: "fade" | "slide" | "scale" | "slideUp";
}

export function PageTransitionWrapper({
  children,
  pageKey,
  className,
  mode = "slideUp",
}: PageTransitionWrapperProps) {
  return (
    <AnimatePresence mode="wait">
      <PageTransition key={pageKey} className={className} mode={mode}>
        {children}
      </PageTransition>
    </AnimatePresence>
  );
}

// Stagger container for list items
interface StaggerContainerProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25,
    },
  },
};

export function StaggerContainer({ children, className }: StaggerContainerProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  );
}

// Panel slide-in animation
interface SlidePanelProps {
  children: ReactNode;
  isOpen: boolean;
  direction?: "left" | "right";
  className?: string;
}

export function SlidePanel({ 
  children, 
  isOpen, 
  direction = "right",
  className 
}: SlidePanelProps) {
  const xOffset = direction === "right" ? "100%" : "-100%";
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: xOffset, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: xOffset, opacity: 0 }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 30,
          }}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Modal/Dialog animation
interface ModalTransitionProps {
  children: ReactNode;
  isOpen: boolean;
  className?: string;
}

export function ModalTransition({ children, isOpen, className }: ModalTransitionProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
          />
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 25,
            }}
            className={className}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
