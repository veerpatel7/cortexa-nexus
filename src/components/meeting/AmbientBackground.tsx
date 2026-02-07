import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";

interface AmbientBackgroundProps {
  className?: string;
  intensity?: "low" | "medium" | "high";
}

export function AmbientBackground({ 
  className,
  intensity = "medium" 
}: AmbientBackgroundProps) {
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === "light";

  const opacityMap = {
    low: isLight ? 0.03 : 0.05,
    medium: isLight ? 0.05 : 0.08,
    high: isLight ? 0.07 : 0.12,
  };

  const blurMap = {
    low: isLight ? 180 : 140,
    medium: isLight ? 150 : 120,
    high: isLight ? 120 : 100,
  };

  const baseOpacity = opacityMap[intensity];
  const blurAmount = blurMap[intensity];

  return (
    <div className={cn("fixed inset-0 pointer-events-none overflow-hidden", className)}>
      {/* Primary aurora gradient - teal/cyan */}
      <motion.div 
        className="absolute -top-1/2 -left-1/4 w-[100%] h-[100%] rounded-full"
        style={{
          background: `radial-gradient(circle, hsl(var(--aurora-teal)) 0%, transparent 70%)`,
          filter: `blur(${blurAmount}px)`,
          opacity: baseOpacity,
        }}
        animate={{
          x: ["0%", "3%", "5%", "2%", "0%"],
          y: ["0%", "2%", "4%", "3%", "0%"],
          scale: [1, 1.02, 1.04, 1.01, 1],
          rotate: [0, 3, 5, 2, 0],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      {/* Secondary aurora gradient - violet/purple */}
      <motion.div 
        className="absolute -bottom-1/3 -right-1/4 w-[80%] h-[80%] rounded-full"
        style={{
          background: `radial-gradient(circle, hsl(var(--aurora-violet)) 0%, transparent 70%)`,
          filter: `blur(${blurAmount - 20}px)`,
          opacity: baseOpacity,
        }}
        animate={{
          x: ["0%", "-3%", "2%", "0%"],
          y: ["0%", "-2%", "-3%", "0%"],
          scale: [1, 1.03, 0.98, 1],
          rotate: [0, -3, 2, 0],
        }}
        transition={{
          duration: 35,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Tertiary accent - cyan/blue */}
      <motion.div 
        className="absolute top-1/4 right-1/3 w-[50%] h-[50%] rounded-full"
        style={{
          background: `radial-gradient(circle, hsl(var(--aurora-cyan)) 0%, transparent 70%)`,
          filter: `blur(${blurAmount - 40}px)`,
          opacity: isLight ? baseOpacity * 0.5 : baseOpacity * 0.6,
        }}
        animate={{
          x: ["0%", "-4%", "0%"],
          y: ["0%", "4%", "0%"],
          scale: [1, 1.08, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Gold accent - warm touch */}
      <motion.div 
        className="absolute bottom-1/4 left-1/4 w-[40%] h-[40%] rounded-full"
        style={{
          background: `radial-gradient(circle, hsl(var(--aurora-gold)) 0%, transparent 70%)`,
          filter: `blur(${blurAmount}px)`,
          opacity: isLight ? baseOpacity * 0.3 : baseOpacity * 0.2,
        }}
        animate={{
          x: ["0%", "5%", "0%"],
          y: ["0%", "-3%", "0%"],
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 32,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Light mode: rose gold accent overlay */}
      {isLight && (
        <motion.div 
          className="absolute -bottom-1/2 left-1/4 w-[60%] h-[60%] rounded-full"
          style={{
            background: `radial-gradient(circle, hsl(var(--aurora-rose)) 0%, transparent 70%)`,
            filter: `blur(${blurAmount}px)`,
            opacity: 0.08,
          }}
          animate={{
            x: ["0%", "3%", "0%"],
            y: ["0%", "-3%", "0%"],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 28,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}

      {/* Subtle noise texture overlay */}
      <div 
        className="absolute inset-0"
        style={{
          opacity: isLight ? 0.015 : 0.01,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Shimmer overlay effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/[0.01] to-transparent"
        animate={{
          x: ["-100%", "100%"],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "linear",
          repeatDelay: 4,
        }}
      />
    </div>
  );
}
