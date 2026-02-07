import { cn } from "@/lib/utils";
import { MeetingUIMode, AgendaItem } from "@/types/meeting";
import { Brain, Target, Compass, CheckCircle2, Sparkles } from "lucide-react";

interface MeetingContextLayerProps {
  mode: MeetingUIMode;
  currentAgendaItem?: AgendaItem;
  elapsedTime: number;
  className?: string;
}

type MeetingIntent = "exploration" | "alignment" | "decision-making" | "review";

export function MeetingContextLayer({
  mode,
  currentAgendaItem,
  elapsedTime,
  className,
}: MeetingContextLayerProps) {
  // Derive meeting intent from mode
  const getIntent = (): MeetingIntent => {
    switch (mode) {
      case "focus":
        return "exploration";
      case "guided":
        return "alignment";
      case "decision":
        return "decision-making";
      case "review":
        return "review";
    }
  };

  const intent = getIntent();

  const intentConfig = {
    exploration: {
      label: "Exploration",
      icon: Compass,
      color: "text-aurora-cyan",
      bgColor: "bg-aurora-cyan/10",
      borderColor: "border-aurora-cyan/20",
      description: "Open discussion",
    },
    alignment: {
      label: "Alignment",
      icon: Target,
      color: "text-aurora-teal",
      bgColor: "bg-aurora-teal/10",
      borderColor: "border-aurora-teal/20",
      description: "Building consensus",
    },
    "decision-making": {
      label: "Decision",
      icon: Brain,
      color: "text-aurora-violet",
      bgColor: "bg-aurora-violet/10",
      borderColor: "border-aurora-violet/20",
      description: "Forming decisions",
    },
    review: {
      label: "Review",
      icon: CheckCircle2,
      color: "text-primary",
      bgColor: "bg-primary/10",
      borderColor: "border-primary/20",
      description: "Summarizing outcomes",
    },
  };

  const config = intentConfig[intent];
  const Icon = config.icon;

  return (
    <div className={cn("absolute inset-x-0 top-0 pointer-events-none", className)}>
      {/* Central Context Indicator */}
      <div className="flex flex-col items-center pt-6 animate-fade-in">
        {/* Intent Badge */}
        <div
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full border backdrop-blur-sm transition-all duration-500",
            config.bgColor,
            config.borderColor
          )}
        >
          <Icon className={cn("w-4 h-4", config.color)} />
          <span className={cn("text-sm font-medium", config.color)}>
            {config.label}
          </span>
          <span className="text-xs text-muted-foreground">
            {config.description}
          </span>
        </div>

        {/* Current Topic */}
        {currentAgendaItem && mode !== "focus" && (
          <div className="mt-3 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-1/60 backdrop-blur-sm border border-border/30 animate-fade-in">
            {currentAgendaItem.aiSuggested && (
              <Sparkles className="w-3 h-3 text-primary" />
            )}
            <span className="text-xs text-muted-foreground">
              {currentAgendaItem.title}
            </span>
          </div>
        )}
      </div>

      {/* Subtle Phase Timeline (only in guided/decision mode) */}
      {(mode === "guided" || mode === "decision") && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1">
          {["exploration", "alignment", "decision-making", "review"].map((phase, i) => (
            <div
              key={phase}
              className={cn(
                "h-1 rounded-full transition-all duration-500",
                phase === intent ? "w-8 bg-primary" : "w-2 bg-surface-3"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
