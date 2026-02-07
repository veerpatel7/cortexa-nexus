import { cn } from "@/lib/utils";
import { useNetworkQuality, NetworkQualityLevel } from "@/hooks/useNetworkQuality";
import { Wifi, WifiOff } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface NetworkQualityIndicatorProps {
  className?: string;
}

/**
 * Visual indicator for network connection quality
 * Shows bars like a signal strength meter with tooltip details
 */
export function NetworkQualityIndicator({ className }: NetworkQualityIndicatorProps) {
  const { level, rtt, getLevelColor, getLevelLabel } = useNetworkQuality();

  const bars = getBarsForLevel(level);
  const colorClass = getLevelColor(level);
  const label = getLevelLabel(level);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={cn("flex items-center gap-1", className)}>
          {level === "disconnected" ? (
            <WifiOff className={cn("w-4 h-4", colorClass)} />
          ) : (
            <div className="flex items-end gap-0.5 h-4">
              {[1, 2, 3, 4].map((bar) => (
                <div
                  key={bar}
                  className={cn(
                    "w-1 rounded-sm transition-all duration-300",
                    bar <= bars ? colorClass.replace("text-", "bg-") : "bg-muted/30",
                    bar === 1 && "h-1",
                    bar === 2 && "h-2",
                    bar === 3 && "h-3",
                    bar === 4 && "h-4"
                  )}
                />
              ))}
            </div>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        <div className="space-y-1">
          <p className="font-medium">Connection: {label}</p>
          {rtt && (
            <p className="text-muted-foreground">
              Latency: {rtt}ms
            </p>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

function getBarsForLevel(level: NetworkQualityLevel): number {
  switch (level) {
    case "excellent": return 4;
    case "good": return 3;
    case "fair": return 2;
    case "poor": return 1;
    case "disconnected": return 0;
  }
}
