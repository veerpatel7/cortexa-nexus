import { motion, AnimatePresence } from "framer-motion";
import { FloatingReaction } from "@/hooks/useFloatingReactions";

interface FloatingReactionsProps {
  reactions: FloatingReaction[];
}

export function FloatingReactions({ reactions }: FloatingReactionsProps) {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      <AnimatePresence>
        {reactions.map((reaction) => (
          <motion.div
            key={reaction.id}
            className="absolute flex flex-col items-center"
            style={{
              left: `${reaction.x}%`,
              bottom: 120, // Start above the control bar
            }}
            initial={{ 
              opacity: 0, 
              scale: 0.5, 
              y: 0,
              rotate: -15 + Math.random() * 30,
            }}
            animate={{ 
              opacity: [0, 1, 1, 1, 0],
              scale: [0.5, 1.2, 1, 1, 0.8],
              y: [0, -100, -300, -500, -700],
              rotate: [-15 + Math.random() * 30, 0, 10, -5, 0],
              x: [0, Math.random() * 40 - 20, Math.random() * 60 - 30, Math.random() * 40 - 20, 0],
            }}
            exit={{ 
              opacity: 0, 
              scale: 0,
              y: -800,
            }}
            transition={{ 
              duration: 3.5,
              ease: [0.25, 0.46, 0.45, 0.94], // Custom easing for natural float
              times: [0, 0.15, 0.4, 0.7, 1],
            }}
          >
            {/* Emoji */}
            <span 
              className="text-4xl md:text-5xl select-none drop-shadow-lg"
              style={{
                filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.3))",
                textShadow: "0 2px 10px rgba(0,0,0,0.2)",
              }}
            >
              {reaction.emoji}
            </span>

            {/* Sender Avatar */}
            {reaction.sender && (
              <motion.div 
                className="relative mt-1"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 500, damping: 25 }}
              >
                <div className="relative">
                  <img
                    src={reaction.sender.avatar}
                    alt={reaction.sender.name}
                    className="w-6 h-6 rounded-full border-2 border-background shadow-md object-cover"
                  />
                  {/* Glow ring */}
                  <div className="absolute inset-0 rounded-full bg-primary/30 blur-sm -z-10 animate-pulse" />
                </div>
              </motion.div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
