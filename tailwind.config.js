/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--color-background)",
        surface: "var(--color-surface)",
        accent: "var(--color-accent)",
        secondary: "var(--color-secondary)",
        success: "var(--color-success)",
        error: "var(--color-error)",
        "text-primary": "var(--color-text-primary)",
        "text-secondary": "var(--color-text-secondary)",
      },
      borderRadius: {
        fluid: "28px",
      },
      animation: {
        "fade-in": "fadeIn 300ms ease-in-out",
        "slide-up": "slideUp 300ms ease-in-out",
        "scale-in": "scaleIn 150ms ease-out",
        "pulse-slow": "pulse 3s ease-in-out infinite",
        "pulse-subtle": "pulseSubtle 2.5s ease-in-out infinite",
        "aurora-flow": "auroraFlow 8s ease infinite alternate",
        "blob-morph": "blobMorph 12s ease-in-out infinite",
        "fluid-shift": "fluidShift 15s ease infinite alternate",
        "glow-breathe": "glowBreathe 3s ease-in-out infinite",
        "shimmer-glass": "shimmerGlass 3s ease infinite",
        "float-rotate": "floatRotate 6s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        scaleIn: {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        pulseSubtle: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        auroraFlow: {
          "0%": { backgroundPosition: "0% 50%" },
          "25%": { backgroundPosition: "50% 0%" },
          "50%": { backgroundPosition: "100% 50%" },
          "75%": { backgroundPosition: "50% 100%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
        blobMorph: {
          "0%, 100%": { borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%" },
          "25%": { borderRadius: "30% 60% 70% 40% / 50% 60% 30% 60%" },
          "50%": { borderRadius: "50% 60% 30% 60% / 30% 40% 70% 60%" },
          "75%": { borderRadius: "40% 60% 50% 40% / 60% 50% 40% 70%" },
        },
        fluidShift: {
          "0%": { backgroundPosition: "0% 50%", backgroundSize: "200% 200%" },
          "50%": { backgroundPosition: "100% 50%", backgroundSize: "250% 250%" },
          "100%": { backgroundPosition: "0% 50%", backgroundSize: "200% 200%" },
        },
        glowBreathe: {
          "0%, 100%": { boxShadow: "0 0 20px var(--glow-color, rgba(255,255,255,0.1))", opacity: "0.6" },
          "50%": { boxShadow: "0 0 40px var(--glow-color, rgba(255,255,255,0.2))", opacity: "1" },
        },
        shimmerGlass: {
          "0%": { transform: "translateX(-100%) skewX(-15deg)" },
          "100%": { transform: "translateX(200%) skewX(-15deg)" },
        },
        floatRotate: {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "33%": { transform: "translateY(-10px) rotate(1.5deg)" },
          "66%": { transform: "translateY(-5px) rotate(-1deg)" },
        },
      },
      backdropBlur: {
        xl: "20px",
        "3xl": "60px",
        "4xl": "80px",
      },
      boxShadow: {
        "glow-sm": "0 0 15px var(--glow-color, rgba(255,255,255,0.08))",
        "glow-md": "0 0 30px var(--glow-color, rgba(255,255,255,0.12))",
        "glow-lg": "0 0 60px var(--glow-color, rgba(255,255,255,0.15))",
        "fluid": "0 8px 32px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.2)",
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
        fluid: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};
