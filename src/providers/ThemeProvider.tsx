import { ReactNode, useEffect } from "react";
import { useThemeStore } from "../stores/themeStore";

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { currentTheme } = useThemeStore();

  useEffect(() => {
    const root = document.documentElement;
    const { colors } = currentTheme;

    root.style.setProperty("--color-background", colors.background);
    root.style.setProperty("--color-surface", colors.surface);
    root.style.setProperty("--color-accent", colors.accent);
    root.style.setProperty("--color-secondary", colors.secondary);
    root.style.setProperty("--color-success", colors.success);
    root.style.setProperty("--color-error", colors.error);
    root.style.setProperty("--color-text-primary", colors.textPrimary);
    root.style.setProperty("--color-text-secondary", colors.textSecondary);
  }, [currentTheme]);

  return <>{children}</>;
}
