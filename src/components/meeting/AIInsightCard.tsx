import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { 
  Sparkles, 
  Lightbulb, 
  AlertCircle, 
  MessageSquare,
  CheckCircle,
  ArrowRight
} from "lucide-react";
import { AIInsight } from "@/types/meeting";

interface AIInsightCardProps {
  insight: AIInsight;
  onDismiss?: () => void;
  className?: string;
}

const insightIcons: Record<AIInsight["type"], React.ReactNode> = {
  suggestion: <Lightbulb className="w-4 h-4" />,
  warning: <AlertCircle className="w-4 h-4" />,
  summary: <MessageSquare className="w-4 h-4" />,
  decision: <CheckCircle className="w-4 h-4" />,
  action: <ArrowRight className="w-4 h-4" />,
  question: <MessageSquare className="w-4 h-4" />,
  risk: <AlertCircle className="w-4 h-4" />,
};

const insightColors: Record<AIInsight["type"], string> = {
  suggestion: "from-aurora-cyan/20 to-transparent border-aurora-cyan/30",
  warning: "from-aurora-rose/20 to-transparent border-aurora-rose/30",
  summary: "from-aurora-violet/20 to-transparent border-aurora-violet/30",
  decision: "from-primary/20 to-transparent border-primary/30",
  action: "from-aurora-teal/20 to-transparent border-aurora-teal/30",
  question: "from-aurora-cyan/20 to-transparent border-aurora-cyan/30",
  risk: "from-aurora-rose/20 to-transparent border-aurora-rose/30",
};

const insightIconColors: Record<AIInsight["type"], string> = {
  suggestion: "text-aurora-cyan",
  warning: "text-aurora-rose",
  summary: "text-aurora-violet",
  decision: "text-primary",
  action: "text-aurora-teal",
  question: "text-aurora-cyan",
  risk: "text-aurora-rose",
};

export function AIInsightCard({ insight, onDismiss, className }: AIInsightCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn(
        "relative rounded-lg p-3 border bg-gradient-to-br backdrop-blur-sm",
        insightColors[insight.type],
        className
      )}
    >
      <div className="flex items-start gap-2.5">
        {/* Icon */}
        <div className={cn(
          "shrink-0 mt-0.5",
          insightIconColors[insight.type]
        )}>
          {insightIcons[insight.type]}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <Sparkles className="w-3 h-3 text-primary" />
            <span className="text-xs font-medium text-primary">Nova AI</span>
            <span className="text-[10px] text-muted-foreground">
              {insight.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <p className="text-sm text-foreground leading-relaxed">
            {insight.content}
          </p>
        </div>

        {/* Dismiss */}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          >
            ×
          </button>
        )}
      </div>

      {/* Relevance indicator */}
      {insight.relevance && (
        <div className="absolute bottom-1 right-2">
          <div 
            className="h-0.5 rounded-full bg-primary/50"
            style={{ width: `${insight.relevance * 40}px` }}
          />
        </div>
      )}
    </motion.div>
  );
}

// Floating AI nudge that appears at the top of the meeting
interface AINudgeProps {
  message: string;
  type?: "info" | "action" | "decision";
  onDismiss?: () => void;
}

export function AINudge({ message, type = "info", onDismiss }: AINudgeProps) {
  const colors = {
    info: "bg-surface-2/90 border-border/50",
    action: "bg-aurora-teal/10 border-aurora-teal/30",
    decision: "bg-primary/10 border-primary/30",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={cn(
        "inline-flex items-center gap-2 px-4 py-2 rounded-full border backdrop-blur-sm",
        colors[type]
      )}
    >
      <Sparkles className="w-4 h-4 text-primary" />
      <span className="text-sm text-foreground">{message}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-muted-foreground hover:text-foreground ml-1"
        >
          ×
        </button>
      )}
    </motion.div>
  );
}
