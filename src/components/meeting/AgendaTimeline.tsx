import { cn } from "@/lib/utils";
import { AgendaItem } from "@/types/meeting";
import { CheckCircle2, Circle, Sparkles } from "lucide-react";

interface AgendaTimelineProps {
  items: AgendaItem[];
  currentIndex: number;
  className?: string;
}

export function AgendaTimeline({ items, currentIndex, className }: AgendaTimelineProps) {
  return (
    <div className={cn("", className)}>
      <span className="text-sm font-medium text-foreground mb-3 block">Agenda</span>
      <div className="space-y-1">
        {items.map((item, index) => {
          const isCompleted = item.status === "completed";
          const isActive = index === currentIndex;
          const isPending = item.status === "pending";

          return (
            <div
              key={item.id}
              className={cn(
                "flex items-start gap-3 p-2 rounded-lg transition-all duration-300",
                isActive && "agenda-active",
                isCompleted && "opacity-60"
              )}
            >
              {/* Status Icon */}
              <div className="mt-0.5">
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                ) : isActive ? (
                  <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  </div>
                ) : (
                  <Circle className="w-4 h-4 text-muted-foreground/50" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-sm truncate",
                  isCompleted && "text-muted-foreground line-through",
                  isActive && "text-foreground font-medium",
                  isPending && "text-muted-foreground"
                )}>
                  {item.title}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  <span>{item.duration}m</span>
                  {item.aiSuggested && (
                    <Sparkles className="w-3 h-3 text-primary" />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
