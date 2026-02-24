import { memo, useEffect, useState, useMemo } from "react";
import { useThemeStore } from "../../stores/themeStore";

/**
 * AuroraBackground — fluid mesh gradient + animated blobs
 * Creates a modern liquid aurora effect behind the app content.
 * Respects optimization settings and prefers-reduced-motion.
 */
export const AuroraBackground = memo(function AuroraBackground() {
  const { currentTheme, dynamicAccent } = useThemeStore();
  const [isDisabled, setIsDisabled] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  // Check optimization settings
  useEffect(() => {
    const checkSettings = () => {
      try {
        const saved = localStorage.getItem("harmonix-optimization");
        if (saved) {
          const settings = JSON.parse(saved);
          setIsDisabled(settings.disableEffects || settings.disableFluidEffects);
        }
        
        // Check appearance store for aurora toggle
        const appearance = localStorage.getItem("harmonix-appearance");
        if (appearance) {
          const parsed = JSON.parse(appearance);
          const state = parsed.state || parsed;
          if (state.auroraBackground === false) {
            setIsDisabled(true);
          }
        }
      } catch {}
    };
    
    checkSettings();
    window.addEventListener("optimization-changed", checkSettings);
    window.addEventListener("storage", checkSettings);
    return () => {
      window.removeEventListener("optimization-changed", checkSettings);
      window.removeEventListener("storage", checkSettings);
    };
  }, []);

  // Check prefers-reduced-motion
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setIsReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Compute blob colors from accent
  const accentColor = dynamicAccent || currentTheme.colors.accent || "#ffffff";
  
  const blobColors = useMemo(() => {
    // Parse hex to RGB
    const hex = accentColor.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16) || 255;
    const g = parseInt(hex.substring(2, 4), 16) || 255;
    const b = parseInt(hex.substring(4, 6), 16) || 255;
    
    // Generate complementary hues by shifting
    return {
      primary: `rgba(${r}, ${g}, ${b}, 0.12)`,
      secondary: `rgba(${Math.min(255, r + 40)}, ${Math.max(0, g - 30)}, ${Math.min(255, b + 20)}, 0.08)`,
      tertiary: `rgba(${Math.max(0, r - 30)}, ${Math.min(255, g + 40)}, ${Math.min(255, b + 30)}, 0.06)`,
    };
  }, [accentColor]);

  // Update CSS variables for fluid gradients
  useEffect(() => {
    if (isDisabled) return;
    const root = document.documentElement;
    root.style.setProperty("--fluid-gradient-1", blobColors.primary);
    root.style.setProperty("--fluid-gradient-2", blobColors.secondary);
    root.style.setProperty("--fluid-gradient-3", blobColors.tertiary);
    root.style.setProperty("--glow-color", blobColors.primary);
  }, [blobColors, isDisabled]);

  if (isDisabled) return null;

  const animStyle = isReducedMotion ? { animation: "none" } : {};

  return (
    <div
      className="fixed inset-0 overflow-hidden pointer-events-none"
      style={{ zIndex: 0, isolation: "isolate" }}
      aria-hidden="true"
    >
      {/* Aurora mesh gradient layer */}
      <div
        className="aurora-bg"
        style={animStyle}
      />

      {/* Blob 1 — large primary */}
      <div
        className="fluid-blob animate-blob-morph"
        style={{
          width: "50vw",
          height: "50vh",
          top: "10%",
          left: "15%",
          backgroundColor: blobColors.primary,
          transition: "background-color 2s ease",
          ...animStyle,
        }}
      />

      {/* Blob 2 — medium secondary */}
      <div
        className="fluid-blob animate-float-rotate"
        style={{
          width: "40vw",
          height: "40vh",
          bottom: "20%",
          right: "10%",
          backgroundColor: blobColors.secondary,
          animationDelay: "-4s",
          transition: "background-color 2s ease",
          ...animStyle,
        }}
      />

      {/* Blob 3 — small tertiary */}
      <div
        className="fluid-blob animate-fluid-shift"
        style={{
          width: "35vw",
          height: "35vh",
          top: "60%",
          left: "50%",
          backgroundColor: blobColors.tertiary,
          animationDelay: "-8s",
          transition: "background-color 2s ease",
          ...animStyle,
        }}
      />
    </div>
  );
});
