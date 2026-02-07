import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Smile, ChevronUp, Volume2, VolumeX } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ReactionPickerProps {
  onSelectReaction: (emoji: string) => void;
  onBurstReaction?: (emoji: string) => void;
  availableEmojis: string[];
  soundEnabled?: boolean;
  onToggleSound?: () => void;
  className?: string;
}

const quickEmojis = ["👍", "❤️", "🎉", "👏"];

export function ReactionPicker({
  onSelectReaction,
  onBurstReaction,
  availableEmojis,
  soundEnabled = true,
  onToggleSound,
  className,
}: ReactionPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSelectEmoji = (emoji: string, isBurst: boolean = false) => {
    if (isBurst && onBurstReaction) {
      onBurstReaction(emoji);
    } else {
      onSelectReaction(emoji);
    }
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {/* Quick Reaction Buttons */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="flex items-center gap-1"
            initial={{ opacity: 0, x: 20, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            {quickEmojis.map((emoji, index) => (
              <motion.div
                key={emoji}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ delay: index * 0.05 }}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.button
                      className="w-10 h-10 flex items-center justify-center text-xl rounded-full bg-surface-2 hover:bg-surface-3 transition-colors"
                      onClick={() => handleSelectEmoji(emoji)}
                      onDoubleClick={() => handleSelectEmoji(emoji, true)}
                      whileHover={{ scale: 1.2, y: -4 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      {emoji}
                    </motion.button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Click to react, double-click for burst!</p>
                  </TooltipContent>
                </Tooltip>
              </motion.div>
            ))}

            {/* Sound Toggle */}
            {onToggleSound && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ delay: quickEmojis.length * 0.05 }}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.button
                      className={cn(
                        "w-8 h-8 flex items-center justify-center rounded-full transition-colors",
                        soundEnabled 
                          ? "bg-primary/20 text-primary" 
                          : "bg-surface-2 text-muted-foreground"
                      )}
                      onClick={onToggleSound}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      {soundEnabled ? (
                        <Volume2 className="w-4 h-4" />
                      ) : (
                        <VolumeX className="w-4 h-4" />
                      )}
                    </motion.button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">{soundEnabled ? "Mute sounds" : "Enable sounds"}</p>
                  </TooltipContent>
                </Tooltip>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Quick Reactions */}
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
          >
            <Button
              variant={isExpanded ? "secondary" : "control"}
              size="iconLg"
              onClick={() => setIsExpanded(!isExpanded)}
              className={cn(
                isExpanded && "ring-2 ring-primary/50"
              )}
            >
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <ChevronUp className="w-5 h-5" />
              </motion.div>
            </Button>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent>
          {isExpanded ? "Hide reactions" : "Show reactions"}
        </TooltipContent>
      </Tooltip>

      {/* Full Emoji Picker */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <motion.div
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 500, damping: 25 }}
              >
                <Button
                  variant="control"
                  size="iconLg"
                >
                  <Smile className="w-5 h-5" />
                </Button>
              </motion.div>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent>All reactions</TooltipContent>
        </Tooltip>
        <PopoverContent 
          className="w-auto p-3" 
          align="center"
          side="top"
          sideOffset={12}
        >
          <motion.div 
            className="space-y-2"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <p className="text-xs text-muted-foreground text-center mb-2">
              Click to react • Double-click for burst!
            </p>
            <div className="grid grid-cols-5 gap-1">
              {availableEmojis.map((emoji, index) => (
                <motion.button
                  key={emoji}
                  className="w-10 h-10 flex items-center justify-center text-xl rounded-lg hover:bg-surface-2 transition-colors"
                  onClick={() => {
                    handleSelectEmoji(emoji);
                    setIsOpen(false);
                  }}
                  onDoubleClick={() => {
                    handleSelectEmoji(emoji, true);
                    setIsOpen(false);
                  }}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.02 }}
                  whileHover={{ scale: 1.3, y: -2 }}
                  whileTap={{ scale: 0.85 }}
                >
                  {emoji}
                </motion.button>
              ))}
            </div>
          </motion.div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
