import { cn } from "@/lib/utils";
import { Decision, ActionItem } from "@/types/meeting";
import { CheckCircle2, AlertCircle, Clock, User, Sparkles, Lock } from "lucide-react";
import { useState, useEffect } from "react";

interface DecisionCaptureProps {
  decisions: Decision[];
  actionItems: ActionItem[];
  className?: string;
}

export function DecisionCapture({ decisions, actionItems, className }: DecisionCaptureProps) {
  const [recentlyConfirmed, setRecentlyConfirmed] = useState<Set<string>>(new Set());

  // Track newly confirmed decisions for glow animation
  useEffect(() => {
    const confirmedIds = decisions.filter(d => d.status === "confirmed").map(d => d.id);
    const newConfirmed = confirmedIds.filter(id => !recentlyConfirmed.has(id));
    
    if (newConfirmed.length > 0) {
      setRecentlyConfirmed(prev => new Set([...prev, ...newConfirmed]));
      
      // Remove glow after animation
      setTimeout(() => {
        setRecentlyConfirmed(prev => {
          const updated = new Set(prev);
          newConfirmed.forEach(id => updated.delete(id));
          return updated;
        });
      }, 1000);
    }
  }, [decisions]);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Decisions */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle2 className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Decisions</span>
          <span className="text-xs text-muted-foreground ml-auto">
            {decisions.filter((d) => d.status === "confirmed").length} confirmed
          </span>
        </div>

        <div className="space-y-2">
          {decisions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4 italic">
              Decisions will appear here as they form...
            </p>
          ) : (
            decisions.map((decision, index) => {
              const isConfirmed = decision.status === "confirmed";
              const showGlow = recentlyConfirmed.has(decision.id);

              return (
                <div
                  key={decision.id}
                  className={cn(
                    "relative p-3 rounded-xl border-l-2 transition-all duration-300",
                    isConfirmed && "bg-surface-1 border-l-primary",
                    decision.status === "proposed" && "bg-surface-1/60 border-l-aurora-cyan",
                    decision.status === "deferred" && "bg-surface-1/40 border-l-muted-foreground",
                    showGlow && "decision-confirmed"
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Confirmed Lock Icon */}
                  {isConfirmed && (
                    <div className="absolute top-2 right-2">
                      <Lock className="w-3 h-3 text-primary/60" />
                    </div>
                  )}

                  <p className={cn(
                    "text-sm pr-6",
                    isConfirmed ? "text-foreground font-medium" : "text-foreground/80"
                  )}>
                    {decision.content}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                    <User className="w-3 h-3" />
                    <span>{decision.owner}</span>
                    {isConfirmed && (
                      <span className="ml-auto flex items-center gap-1 text-primary/80">
                        <Sparkles className="w-3 h-3" />
                        Locked
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Action Items */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle className="w-4 h-4 text-secondary" />
          <span className="text-sm font-medium text-foreground">Actions</span>
          <span className="text-xs text-muted-foreground ml-auto">
            {actionItems.length} items
          </span>
        </div>

        <div className="space-y-2">
          {actionItems.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4 italic">
              Action items will be captured here...
            </p>
          ) : (
            actionItems.map((item, index) => (
              <div
                key={item.id}
                className={cn(
                  "p-3 rounded-xl bg-surface-1 border-l-2 decision-captured",
                  item.priority === "high" && "border-l-aurora-rose",
                  item.priority === "medium" && "border-l-secondary",
                  item.priority === "low" && "border-l-muted-foreground"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <p className="text-sm text-foreground mb-2">{item.task}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {item.assignee}
                  </span>
                  {item.deadline && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(item.deadline).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
