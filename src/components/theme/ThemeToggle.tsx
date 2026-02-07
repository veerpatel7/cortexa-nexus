import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon, Monitor, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  variant?: "icon" | "full";
}

export function ThemeToggle({ className, variant = "icon" }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const isLight = resolvedTheme === "light";

  if (variant === "icon") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="iconSm"
            className={cn(
              "relative overflow-hidden group rounded-xl",
              "hover:bg-surface-2 transition-all duration-200",
              "hover:scale-105 active:scale-95",
              className
            )}
          >
            {/* Sun icon (visible in light mode) */}
            <motion.div
              initial={false}
              animate={{
                y: isLight ? 0 : -28,
                opacity: isLight ? 1 : 0,
                rotate: isLight ? 0 : -90,
                scale: isLight ? 1 : 0.5,
              }}
              transition={{ 
                duration: 0.4, 
                ease: [0.34, 1.56, 0.64, 1],
              }}
              className="absolute"
            >
              <Sun className="w-4 h-4 text-aurora-rose" />
            </motion.div>
            
            {/* Moon icon (visible in dark mode) */}
            <motion.div
              initial={false}
              animate={{
                y: isLight ? 28 : 0,
                opacity: isLight ? 0 : 1,
                rotate: isLight ? 90 : 0,
                scale: isLight ? 0.5 : 1,
              }}
              transition={{ 
                duration: 0.4, 
                ease: [0.34, 1.56, 0.64, 1],
              }}
              className="absolute"
            >
              <Moon className="w-4 h-4 text-aurora-cyan" />
            </motion.div>
            
            <span className="sr-only">Toggle theme</span>
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent 
          align="end" 
          className="min-w-[180px] p-2 glass-panel border-border/50"
          sideOffset={8}
        >
          {[
            { key: "light", icon: Sun, label: "Light", color: "text-aurora-rose" },
            { key: "dark", icon: Moon, label: "Dark", color: "text-aurora-cyan" },
            { key: "system", icon: Monitor, label: "System", color: "text-muted-foreground" },
          ].map(({ key, icon: Icon, label, color }) => (
            <DropdownMenuItem 
              key={key}
              onClick={() => setTheme(key)}
              className={cn(
                "flex items-center gap-3 cursor-pointer rounded-lg px-3 py-2.5 transition-all duration-200",
                theme === key 
                  ? "bg-primary/10 text-primary" 
                  : "hover:bg-surface-2"
              )}
            >
              <Icon className={cn("w-4 h-4", theme === key ? "text-primary" : color)} />
              <span className="font-medium flex-1">{label}</span>
              <AnimatePresence>
                {theme === key && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 25 }}
                  >
                    <Check className="w-4 h-4" />
                  </motion.div>
                )}
              </AnimatePresence>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Full variant with label - Pill style toggle
  return (
    <div className={cn(
      "flex items-center gap-1 p-1 rounded-xl bg-surface-2 border border-border/50", 
      className
    )}>
      {[
        { key: "light", icon: Sun, label: "Light" },
        { key: "dark", icon: Moon, label: "Dark" },
      ].map(({ key, icon: Icon, label }) => (
        <Button
          key={key}
          variant="ghost"
          size="sm"
          onClick={() => setTheme(key)}
          className={cn(
            "gap-1.5 rounded-lg px-3 transition-all duration-300 relative",
            theme === key 
              ? "text-foreground" 
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {theme === key && (
            <motion.div
              layoutId="theme-pill"
              className="absolute inset-0 bg-card shadow-sm rounded-lg"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <Icon className="w-3.5 h-3.5 relative z-10" />
          <span className="relative z-10">{label}</span>
        </Button>
      ))}
    </div>
  );
}
