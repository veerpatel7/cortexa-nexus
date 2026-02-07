import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_2px_8px_hsl(var(--primary)/0.25)] hover:bg-primary/90 hover:shadow-[0_4px_16px_hsl(var(--primary)/0.35)] hover:scale-[1.02] active:scale-[0.98] active:shadow-[0_1px_4px_hsl(var(--primary)/0.2)]",
        destructive:
          "bg-destructive text-destructive-foreground shadow-[0_2px_8px_hsl(var(--destructive)/0.25)] hover:bg-destructive/90 hover:shadow-[0_4px_12px_hsl(var(--destructive)/0.3)] hover:scale-[1.02] active:scale-[0.98]",
        outline:
          "border border-border bg-transparent hover:bg-surface-2 hover:border-primary/40 hover:scale-[1.01] active:scale-[0.99]",
        secondary:
          "bg-secondary text-secondary-foreground shadow-[0_2px_8px_hsl(var(--secondary)/0.25)] hover:bg-secondary/90 hover:shadow-[0_4px_16px_hsl(var(--secondary)/0.35)] hover:scale-[1.02] active:scale-[0.98]",
        ghost: 
          "hover:bg-surface-2 hover:text-foreground active:scale-[0.98]",
        link: 
          "text-primary underline-offset-4 hover:underline",
        glass:
          "glass-panel text-foreground hover:bg-surface-2/80 hover:scale-[1.01] active:scale-[0.99]",
        aurora:
          "relative overflow-hidden bg-gradient-to-r from-primary via-aurora-cyan to-secondary text-primary-foreground font-bold shadow-[0_4px_20px_hsl(var(--primary)/0.3)] hover:shadow-[0_8px_32px_hsl(var(--primary)/0.4)] hover:scale-[1.03] active:scale-[0.98] transition-all duration-300",
        control:
          "bg-surface-2 text-foreground border border-border/50 hover:bg-surface-3 hover:border-border hover:scale-[1.05] rounded-full active:scale-95 transition-transform duration-150",
        controlActive:
          "bg-destructive text-destructive-foreground shadow-[0_0_12px_hsl(var(--destructive)/0.4)] hover:bg-destructive/90 rounded-full hover:scale-[1.05] active:scale-95 transition-transform duration-150",
        premium:
          "relative overflow-hidden bg-gradient-to-r from-aurora-gold via-aurora-rose to-aurora-violet text-white font-bold shadow-[0_4px_24px_hsl(38_92%_55%/0.35)] hover:shadow-[0_8px_40px_hsl(38_92%_55%/0.5)] hover:scale-[1.03] active:scale-[0.98]",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 rounded-lg px-3.5 text-xs",
        lg: "h-12 rounded-xl px-7 text-base",
        xl: "h-14 rounded-2xl px-8 text-lg",
        icon: "h-10 w-10",
        iconSm: "h-8 w-8",
        iconLg: "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
