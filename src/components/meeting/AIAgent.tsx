import { cn } from "@/lib/utils";
import { AIInsight, AIMode } from "@/types/meeting";
import { 
  Lightbulb, 
  AlertTriangle, 
  CheckCircle2,
  Brain,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import novaAiLogo from "@/assets/nova-ai-logo.png";

interface AIAgentProps {
  mode: AIMode;
  onModeChange: (mode: AIMode) => void;
  insights: AIInsight[];
  isThinking?: boolean;
  className?: string;
}

const modeLabels: Record<AIMode, string> = {
  assist: "Assist",
  "semi-auto": "Semi-Auto",
  auto: "Auto",
};

const insightIcons = {
  summary: Brain,
  suggestion: Lightbulb,
  question: Lightbulb,
  risk: AlertTriangle,
  decision: CheckCircle2,
};

export function AIAgent({ 
  mode, 
  onModeChange, 
  insights, 
  isThinking = false,
  className 
}: AIAgentProps) {
  const modes: AIMode[] = ["assist", "semi-auto", "auto"];

  // Only show the most relevant insight (highest relevance score)
  const topInsight = insights.length > 0 
    ? insights.reduce((prev, curr) => curr.relevance > prev.relevance ? curr : prev)
    : null;

  return (
    <div className={cn("space-y-4", className)}>
      {/* AI Header - Minimal */}
      <div className="flex items-center gap-3 mb-4">
        <div className={cn(
          "w-9 h-9 rounded-xl overflow-hidden transition-all",
          isThinking && "ai-pulse"
        )}>
          <img src={novaAiLogo} alt="Nova AI" className="w-full h-full object-cover" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">Nova AI</p>
          <p className="text-xs text-muted-foreground">
            {isThinking ? "Processing..." : `${modeLabels[mode]} mode`}
          </p>
        </div>
      </div>

      {/* Mode Toggle - Compact */}
      <div className="flex gap-1 p-1 rounded-lg bg-surface-1">
        {modes.map((m) => (
          <Button
            key={m}
            variant={mode === m ? "secondary" : "ghost"}
            size="sm"
            onClick={() => onModeChange(m)}
            className="flex-1 text-xs h-7"
          >
            {modeLabels[m]}
          </Button>
        ))}
      </div>

      {/* Cognitive Nudge - Single Most Relevant Insight */}
      {topInsight && (
        <div className="cognitive-nudge">
          <div className="space-y-2">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
              AI Insight
            </span>
            <CognitiveNudge insight={topInsight} />
          </div>
        </div>
      )}

      {/* Secondary Insights (collapsed) */}
      {insights.length > 1 && (
        <div className="space-y-1.5">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground/50">
            Other observations
          </span>
          {insights
            .filter(i => i.id !== topInsight?.id)
            .slice(0, 2)
            .map((insight) => (
              <MinimalInsight key={insight.id} insight={insight} />
            ))}
        </div>
      )}
    </div>
  );
}

function CognitiveNudge({ insight }: { insight: AIInsight }) {
  const Icon = insightIcons[insight.type];
  
  return (
    <div
      className={cn(
        "relative p-4 rounded-xl border transition-all",
        "bg-gradient-to-br from-surface-1 to-surface-2",
        insight.type === "risk" && "border-aurora-rose/30",
        insight.type === "decision" && "border-primary/30",
        insight.type === "suggestion" && "border-aurora-cyan/30",
        (insight.type === "summary" || insight.type === "question") && "border-secondary/30"
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
          insight.type === "risk" && "bg-aurora-rose/10",
          insight.type === "decision" && "bg-primary/10",
          insight.type === "suggestion" && "bg-aurora-cyan/10",
          (insight.type === "summary" || insight.type === "question") && "bg-secondary/10"
        )}>
          <Icon className={cn(
            "w-4 h-4",
            insight.type === "risk" && "text-aurora-rose",
            insight.type === "decision" && "text-primary",
            insight.type === "suggestion" && "text-aurora-cyan",
            (insight.type === "summary" || insight.type === "question") && "text-secondary"
          )} />
        </div>
        <p className="text-sm text-foreground/90 leading-relaxed italic">
          "{insight.content}"
        </p>
      </div>
    </div>
  );
}

function MinimalInsight({ insight }: { insight: AIInsight }) {
  const Icon = insightIcons[insight.type];
  
  return (
    <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-surface-1/50 opacity-60 hover:opacity-100 transition-opacity">
      <Icon className={cn(
        "w-3 h-3 shrink-0",
        insight.type === "risk" && "text-aurora-rose",
        insight.type === "decision" && "text-primary",
        insight.type === "suggestion" && "text-aurora-cyan",
        (insight.type === "summary" || insight.type === "question") && "text-secondary"
      )} />
      <p className="text-xs text-muted-foreground truncate">
        {insight.content}
      </p>
    </div>
  );
}
