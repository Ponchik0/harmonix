import { useThemeStore } from "../stores/themeStore";

export function useTheme() {
  const { currentTheme } = useThemeStore();
  return currentTheme;
}

export function useThemeColors() {
  const { currentTheme } = useThemeStore();
  return currentTheme.colors;
}

export function useIsDarkMode() {
  const { currentTheme } = useThemeStore();
  return currentTheme.mode === 'dark';
}
