import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Smile, X, UserPlus, UserMinus, Circle, MonitorUp, Hand } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChatMessage } from "@/hooks/useMeetingChat";
import { motion, AnimatePresence } from "framer-motion";

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (content: string) => void;
  onAddReaction: (messageId: string, emoji: string) => void;
  onClose: () => void;
  className?: string;
}

const EMOJI_OPTIONS = ["👍", "❤️", "😂", "🎉", "🤔", "👏", "🔥", "💯"];

const messageVariants = {
  initial: { opacity: 0, x: 20, scale: 0.95 },
  animate: { 
    opacity: 1, 
    x: 0, 
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 25,
    }
  },
  exit: { opacity: 0, x: -10, scale: 0.95 },
};

const reactionVariants = {
  initial: { scale: 0 },
  animate: { 
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 500,
      damping: 20,
    }
  },
};

export function ChatPanel({
  messages,
  onSendMessage,
  onAddReaction,
  onClose,
  className,
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hoveredMessage, setHoveredMessage] = useState<string | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (input.trim()) {
      onSendMessage(input.trim());
      setInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getSystemIcon = (type?: string) => {
    switch (type) {
      case "join": return <UserPlus className="w-3 h-3" />;
      case "leave": return <UserMinus className="w-3 h-3" />;
      case "recording": return <Circle className="w-3 h-3 fill-current" />;
      case "screenshare": return <MonitorUp className="w-3 h-3" />;
      case "hand": return <Hand className="w-3 h-3" />;
      default: return null;
    }
  };

  const getSystemColor = (type?: string) => {
    switch (type) {
      case "join": return "text-aurora-teal";
      case "leave": return "text-muted-foreground";
      case "recording": return "text-destructive";
      case "screenshare": return "text-primary";
      case "hand": return "text-aurora-violet";
      default: return "text-muted-foreground";
    }
  };

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
        <h3 className="font-medium text-foreground">Chat</h3>
        <Button variant="ghost" size="iconSm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {messages.map((message, index) => (
              <motion.div 
                key={message.id}
                variants={messageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                layout
              >
                {message.isSystem ? (
                  // System message
                  <motion.div 
                    className={cn(
                      "flex items-center justify-center gap-2 py-2 text-xs",
                      getSystemColor(message.systemType)
                    )}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {getSystemIcon(message.systemType)}
                    <span>{message.content}</span>
                    <span className="text-muted-foreground/60">
                      {formatTime(message.timestamp)}
                    </span>
                  </motion.div>
                ) : (
                  // Regular message
                  <div
                    className="group relative"
                    onMouseEnter={() => setHoveredMessage(message.id)}
                    onMouseLeave={() => setHoveredMessage(null)}
                  >
                    <div className="flex gap-3">
                      <img
                        src={message.userAvatar}
                        alt={message.userName}
                        className="w-8 h-8 rounded-full object-cover shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm font-medium text-foreground">
                            {message.userName}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatTime(message.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm text-foreground/90 mt-0.5 break-words">
                          {message.content}
                        </p>

                        {/* Reactions */}
                        <AnimatePresence>
                          {message.reactions.length > 0 && (
                            <motion.div 
                              className="flex flex-wrap gap-1 mt-2"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                            >
                              {message.reactions.map((reaction) => (
                                <motion.button
                                  key={reaction.emoji}
                                  variants={reactionVariants}
                                  initial="initial"
                                  animate="animate"
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => onAddReaction(message.id, reaction.emoji)}
                                  className={cn(
                                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-colors",
                                    reaction.hasReacted
                                      ? "bg-primary/20 text-primary"
                                      : "bg-surface-2 hover:bg-surface-3 text-muted-foreground"
                                  )}
                                >
                                  <span>{reaction.emoji}</span>
                                  <span>{reaction.count}</span>
                                </motion.button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    {/* Reaction Picker */}
                    <AnimatePresence>
                      {hoveredMessage === message.id && (
                        <Popover>
                          <PopoverTrigger asChild>
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                            >
                              <Button
                                variant="ghost"
                                size="iconSm"
                                className="absolute right-0 top-0"
                              >
                                <Smile className="w-4 h-4" />
                              </Button>
                            </motion.div>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-2" align="end">
                            <div className="flex gap-1">
                              {EMOJI_OPTIONS.map((emoji) => (
                                <motion.button
                                  key={emoji}
                                  whileHover={{ scale: 1.2 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => onAddReaction(message.id, emoji)}
                                  className="p-1.5 hover:bg-surface-2 rounded transition-colors text-lg"
                                >
                                  {emoji}
                                </motion.button>
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {messages.length === 0 && (
            <motion.div 
              className="text-center py-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <p className="text-sm text-muted-foreground">
                No messages yet. Start the conversation!
              </p>
            </motion.div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 bg-surface-1 border-transparent focus:border-primary/50"
          />
          <Button
            variant="aurora"
            size="icon"
            onClick={handleSend}
            disabled={!input.trim()}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
