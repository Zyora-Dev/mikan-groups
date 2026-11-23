import type { Config } from "tailwindcss";
import colors from "tailwindcss/colors";

export default {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: "1.25rem", lg: "2rem" },
      screens: { "2xl": "1360px" },
    },
    extend: {
      colors: {
        neutral: colors.neutral,
        white: colors.white,
        black: colors.black,
        transparent: "transparent",
        current: "currentColor",
        brand: {
          green: "hsl(var(--brand-green))",
          blue: "hsl(var(--brand-blue))",
          cyan: "hsl(var(--brand-cyan))",
          orange: "hsl(var(--brand-orange))",
          ember: "hsl(var(--brand-ember))",
        },
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },
      fontFamily: {
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
        "fade-up": { from: { opacity: "0", transform: "translateY(12px)" }, to: { opacity: "1", transform: "none" } },
        "hero-rise": {
          from: { opacity: "0", transform: "translateY(28px)", filter: "blur(6px)" },
          to: { opacity: "1", transform: "none", filter: "blur(0)" },
        },
        "rule-grow": { from: { transform: "scaleX(0)" }, to: { transform: "scaleX(1)" } },
        "step-in": {
          from: { opacity: "0", transform: "translateX(26px)" },
          to: { opacity: "1", transform: "none" },
        },
        "step-in-back": {
          from: { opacity: "0", transform: "translateX(-26px)" },
          to: { opacity: "1", transform: "none" },
        },
        "pop": { "0%": { transform: "scale(1)" }, "45%": { transform: "scale(1.06)" }, "100%": { transform: "scale(1)" } },
        "draw": { from: { strokeDashoffset: "1" }, to: { strokeDashoffset: "0" } },
        "scan": { "0%,100%": { opacity: "0.25" }, "50%": { opacity: "0.65" } },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-up": "fade-up 0.6s cubic-bezier(0.22,1,0.36,1) both",
        "hero-rise": "hero-rise 1s cubic-bezier(0.16,1,0.3,1) both",
        "rule-grow": "rule-grow 0.8s cubic-bezier(0.16,1,0.3,1) both",
        "step-in": "step-in 0.45s cubic-bezier(0.16,1,0.3,1) both",
        "step-in-back": "step-in-back 0.45s cubic-bezier(0.16,1,0.3,1) both",
        "pop": "pop 0.35s ease-out",
        "scan": "scan 6s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
