import { useState, useEffect } from "react";
import { optimizationService, OptimizationSettings } from "../services/OptimizationService";

export function useOptimization() {
  const [settings, setSettings] = useState<OptimizationSettings>(optimizationService.getSettings());

  useEffect(() => {
    const handleChange = (e: CustomEvent<OptimizationSettings>) => {
      setSettings(e.detail);
    };

    window.addEventListener("optimization-changed", handleChange as EventListener);
    return () => window.removeEventListener("optimization-changed", handleChange as EventListener);
  }, []);

  return settings;
}

// Helper hook for checking specific settings
export function useDisableAnimations() {
  const settings = useOptimization();
  return settings.disableAnimations;
}

export function useDisableVisualizer() {
  const settings = useOptimization();
  return settings.disableVisualizer;
}

export function useReducedMotion() {
  const settings = useOptimization();
  return settings.reducedMotion || settings.disableAnimations;
}
