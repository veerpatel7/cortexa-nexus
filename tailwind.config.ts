import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        aurora: {
          teal: "hsl(var(--aurora-teal))",
          violet: "hsl(var(--aurora-violet))",
          cyan: "hsl(var(--aurora-cyan))",
          rose: "hsl(var(--aurora-rose))",
          gold: "hsl(var(--aurora-gold))",
          emerald: "hsl(var(--aurora-emerald))",
        },
        surface: {
          0: "hsl(var(--surface-0))",
          1: "hsl(var(--surface-1))",
          2: "hsl(var(--surface-2))",
          3: "hsl(var(--surface-3))",
        },
        chart: {
          1: "hsl(var(--chart-1))",
          2: "hsl(var(--chart-2))",
          3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))",
          5: "hsl(var(--chart-5))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "calc(var(--radius) + 4px)",
        "2xl": "calc(var(--radius) + 8px)",
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-sm': '0 0 15px hsl(var(--aurora-teal) / 0.15)',
        'glow-md': '0 0 30px hsl(var(--aurora-teal) / 0.2)',
        'glow-lg': '0 0 50px hsl(var(--aurora-teal) / 0.25)',
        'glow-violet': '0 0 30px hsl(var(--aurora-violet) / 0.2)',
        'inner-glow': 'inset 0 1px 0 hsl(var(--foreground) / 0.06)',
        'elevation-1': '0 2px 8px hsl(var(--background) / 0.08), 0 1px 2px hsl(var(--background) / 0.06)',
        'elevation-2': '0 4px 16px hsl(var(--background) / 0.1), 0 2px 4px hsl(var(--background) / 0.06)',
        'elevation-3': '0 8px 32px hsl(var(--background) / 0.12), 0 4px 8px hsl(var(--background) / 0.08)',
        'premium': '0 4px 24px hsl(var(--primary) / 0.1), 0 12px 48px hsl(var(--background) / 0.15)',
        'premium-hover': '0 8px 32px hsl(var(--primary) / 0.15), 0 16px 64px hsl(var(--background) / 0.2)',
        'card-hover': '0 8px 30px -12px hsl(var(--primary) / 0.2)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0", opacity: "0" },
          to: { height: "var(--radix-accordion-content-height)", opacity: "1" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)", opacity: "1" },
          to: { height: "0", opacity: "0" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-out": {
          "0%": { opacity: "1", transform: "translateY(0)" },
          "100%": { opacity: "0", transform: "translateY(8px)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "scale-out": {
          "0%": { opacity: "1", transform: "scale(1)" },
          "100%": { opacity: "0", transform: "scale(0.95)" },
        },
        "slide-in-right": {
          "0%": { opacity: "0", transform: "translateX(24px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "slide-out-right": {
          "0%": { opacity: "1", transform: "translateX(0)" },
          "100%": { opacity: "0", transform: "translateX(24px)" },
        },
        "slide-in-left": {
          "0%": { opacity: "0", transform: "translateX(-24px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "slide-in-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-down": {
          "0%": { opacity: "0", transform: "translateY(-16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 20px hsl(var(--aurora-teal) / 0.2)" },
          "50%": { boxShadow: "0 0 40px hsl(var(--aurora-teal) / 0.4), 0 0 60px hsl(var(--aurora-teal) / 0.2)" },
        },
        "pop": {
          "0%": { opacity: "0", transform: "scale(0.85)" },
          "60%": { transform: "scale(1.08)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "rubber-band": {
          "0%": { transform: "scale(1)" },
          "30%": { transform: "scale(1.15, 0.85)" },
          "40%": { transform: "scale(0.85, 1.15)" },
          "50%": { transform: "scale(1.08, 0.92)" },
          "65%": { transform: "scale(0.95, 1.05)" },
          "75%": { transform: "scale(1.02, 0.98)" },
          "100%": { transform: "scale(1)" },
        },
        "breathe": {
          "0%, 100%": { transform: "scale(1)", opacity: "0.8" },
          "50%": { transform: "scale(1.03)", opacity: "1" },
        },
        "pulse-ring": {
          "0%": { boxShadow: "0 0 0 0 hsl(var(--primary) / 0.5)" },
          "70%": { boxShadow: "0 0 0 8px hsl(var(--primary) / 0)" },
          "100%": { boxShadow: "0 0 0 0 hsl(var(--primary) / 0)" },
        },
        "bounce-subtle": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.25s ease-out",
        "accordion-up": "accordion-up 0.25s ease-out",
        "float": "float 4s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
        "fade-in": "fade-in 0.3s ease-out forwards",
        "fade-out": "fade-out 0.3s ease-out forwards",
        "scale-in": "scale-in 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        "scale-out": "scale-out 0.2s ease-out forwards",
        "slide-in-right": "slide-in-right 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "slide-out-right": "slide-out-right 0.3s ease-out forwards",
        "slide-in-left": "slide-in-left 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "slide-in-up": "slide-in-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "slide-in-down": "slide-in-down 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
        "pop": "pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        "rubber-band": "rubber-band 0.5s ease-out",
        "breathe": "breathe 3s ease-in-out infinite",
        "pulse-ring": "pulse-ring 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "bounce-subtle": "bounce-subtle 1s ease-in-out infinite",
        "enter": "fade-in 0.3s ease-out, scale-in 0.25s ease-out",
        "exit": "fade-out 0.2s ease-out, scale-out 0.2s ease-out",
      },
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
        "out-back": "cubic-bezier(0.34, 1.56, 0.64, 1)",
        "spring": "cubic-bezier(0.43, 0.195, 0.02, 1)",
        "smooth": "cubic-bezier(0.4, 0, 0.2, 1)",
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-aurora': 'linear-gradient(135deg, hsl(var(--aurora-teal) / 0.1), hsl(var(--aurora-violet) / 0.1))',
        'shimmer': 'linear-gradient(90deg, transparent, hsl(var(--foreground) / 0.05), transparent)',
        'gradient-premium': 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--aurora-cyan)))',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
