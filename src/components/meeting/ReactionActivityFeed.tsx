import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Sparkles, Trash2 } from "lucide-react";
import { ReactionHistoryItem } from "@/hooks/useFloatingReactions";
import { formatDistanceToNow } from "date-fns";

interface ReactionActivityFeedProps {
  reactionHistory: ReactionHistoryItem[];
  onClose: () => void;
  onClearHistory?: () => void;
  className?: string;
}

export function ReactionActivityFeed({
  reactionHistory,
  onClose,
  onClearHistory,
  className,
}: ReactionActivityFeedProps) {
  // Group reactions by time windows for cleaner display
  const groupedByMinute = reactionHistory.reduce((acc, reaction) => {
    const minuteKey = Math.floor(reaction.timestamp.getTime() / 60000);
    if (!acc[minuteKey]) {
      acc[minuteKey] = [];
    }
    acc[minuteKey].push(reaction);
    return acc;
  }, {} as Record<number, ReactionHistoryItem[]>);

  return (
    <motion.div 
      className={cn("flex flex-col h-full bg-surface-0", className)}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <h3 className="font-medium text-foreground">Reactions</h3>
          {reactionHistory.length > 0 && (
            <span className="text-xs text-muted-foreground bg-surface-2 px-1.5 py-0.5 rounded-full">
              {reactionHistory.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {onClearHistory && reactionHistory.length > 0 && (
            <Button 
              variant="ghost" 
              size="iconSm" 
              onClick={onClearHistory}
              className="text-muted-foreground hover:text-foreground"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
          <Button variant="ghost" size="iconSm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Reaction List */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          <AnimatePresence mode="popLayout">
            {reactionHistory.length === 0 ? (
              <motion.div 
                className="text-center py-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="text-4xl mb-3">🎉</div>
                <p className="text-sm text-muted-foreground">
                  No reactions yet
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  React to show your engagement!
                </p>
              </motion.div>
            ) : (
              reactionHistory.map((reaction, index) => (
                <motion.div
                  key={reaction.id}
                  initial={{ opacity: 0, x: 20, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -20, scale: 0.95 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 400, 
                    damping: 25,
                    delay: index * 0.02 
                  }}
                  layout
                  className={cn(
                    "flex items-center gap-3 p-2.5 rounded-xl transition-colors",
                    "bg-surface-1 hover:bg-surface-2",
                    reaction.isRemote ? "border-l-2 border-primary/30" : "border-l-2 border-aurora-teal/50"
                  )}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <img
                      src={reaction.sender.avatar}
                      alt={reaction.sender.name}
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-background"
                    />
                    {/* Emoji badge */}
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 flex items-center justify-center bg-background rounded-full shadow-sm text-sm">
                      {reaction.emoji}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground truncate">
                        {reaction.isRemote ? reaction.sender.name : "You"}
                      </span>
                      {reaction.isBurst && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                          burst
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>reacted with</span>
                      <span className="text-base">{reaction.emoji}</span>
                    </div>
                  </div>

                  {/* Timestamp */}
                  <div className="text-xs text-muted-foreground/70 shrink-0">
                    {formatDistanceToNow(reaction.timestamp, { addSuffix: true })}
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>

      {/* Stats Footer */}
      {reactionHistory.length > 0 && (
        <div className="p-3 border-t border-border/50">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Recent activity</span>
            <div className="flex items-center gap-2">
              {/* Emoji summary */}
              {Object.entries(
                reactionHistory.reduce((acc, r) => {
                  acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>)
              )
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([emoji, count]) => (
                  <div key={emoji} className="flex items-center gap-0.5">
                    <span>{emoji}</span>
                    <span className="text-[10px]">{count}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
