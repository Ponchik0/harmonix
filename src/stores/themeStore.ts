import { create } from "zustand";

// Theme IDs matching tokens.css
export type ThemeId = "dark";

export interface ThemeInfo {
  id: ThemeId;
  name: string;
  mode: "dark" | "light";
  accent: string;
  preview: string; // Background color for preview
}

// Single theme - dark
export const themes: ThemeInfo[] = [
  { id: "dark", name: "Тёмная", mode: "dark", accent: "#ffffff", preview: "#0a0a0a" },
];

const STORAGE_KEY = "harmonix-theme";

// Legacy compatibility - all old themes map to dark
const legacyThemeMap: Record<string, ThemeId> = {
  "dark-default": "dark",
  "dark-midnight": "dark",
  "dark-ocean": "dark",
  "dark-forest": "dark",
  "dark-sunset": "dark",
  "dark-rose": "dark",
  "dark-nord": "dark",
  "dark-dracula": "dark",
  "dark-amoled": "dark",
  "dark-cyberpunk": "dark",
  "dark-slate": "dark",
  "dark-emerald": "dark",
  "dark-violet": "dark",
  "dark-amber": "dark",
  "dark-cyan": "dark",
  "dark-fuchsia": "dark",
  "light-default": "dark",
  "light-snow": "dark",
  "light-sky": "dark",
  "light-mint": "dark",
  "light-peach": "dark",
  "light-lavender": "dark",
  "light-rose": "dark",
  "light-sand": "dark",
  "light-cream": "dark",
  "light-paper": "dark",
  "light-slate": "dark",
  "light-stone": "dark",
  "light-emerald": "dark",
  "light-violet": "dark",
  "light-amber": "dark",
  "light-cyan": "dark",
  "light-fuchsia": "dark",
  "dark-blue": "dark",
  "dark-red": "dark",
  "dark-green": "dark",
  "dark-purple": "dark",
  "dark-orange": "dark",
  "dark-pink": "dark",
  "dark-yellow": "dark",
  "dark-teal": "dark",
  "light-blue": "dark",
  "light-red": "dark",
  "light-green": "dark",
  "light-purple": "dark",
  "light-orange": "dark",
  "light-pink": "dark",
  "light-yellow": "dark",
  "light-teal": "dark",
};


// Apply theme with smooth transition
function applyTheme(themeId: ThemeId) {
  document.documentElement.setAttribute("data-theme", themeId);
  
  const theme = themes.find(t => t.id === themeId);
  if (!theme) return;
  
  document.documentElement.style.colorScheme = theme.mode;
  
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", theme.preview);
  }
  
  localStorage.setItem(STORAGE_KEY, themeId);
  window.dispatchEvent(new CustomEvent("theme-changed", { detail: theme }));
}

// Load saved theme
function loadSavedTheme(): ThemeId {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      if (legacyThemeMap[saved]) return legacyThemeMap[saved];
      if (themes.some(t => t.id === saved)) return saved as ThemeId;
    }
  } catch {}
  
  return "dark";
}

function getThemeInfo(themeId: ThemeId): ThemeInfo {
  return themes.find(t => t.id === themeId) || themes[0];
}

// Legacy ThemeConfig for compatibility
export interface ThemeConfig {
  id: string;
  name: string;
  mode: "dark" | "light" | "custom";
  colors: {
    background: string;
    surface: string;
    accent: string;
    secondary: string;
    success: string;
    error: string;
    textPrimary: string;
    textSecondary: string;
  };
  effects: {
    glassmorphism: boolean;
    backdropBlur: number;
    borderOpacity: number;
  };
}

function toLegacyConfig(theme: ThemeInfo): ThemeConfig {
  const isDark = theme.mode === "dark";
  return {
    id: theme.id,
    name: theme.name,
    mode: theme.mode,
    colors: {
      background: theme.preview,
      surface: isDark ? "#171717" : "#ffffff",
      accent: theme.accent,
      secondary: theme.accent,
      success: "#22c55e",
      error: "#ef4444",
      textPrimary: isDark ? "#fafafa" : "#18181b",
      textSecondary: isDark ? "#a1a1aa" : "#52525b",
    },
    effects: {
      glassmorphism: true,
      backdropBlur: 20,
      borderOpacity: isDark ? 0.08 : 0.06,
    },
  };
}

interface ThemeStoreState {
  currentThemeId: ThemeId;
  currentTheme: ThemeConfig;
  availableThemes: ThemeConfig[];
  dynamicAccent: string | null;
  setTheme: (themeId: string) => void;
  setDynamicAccent: (color: string | null) => void;
  getThemeInfo: () => ThemeInfo;
  isDark: () => boolean;
  isLight: () => boolean;
  getDarkThemes: () => ThemeInfo[];
  getLightThemes: () => ThemeInfo[];
}

const initialThemeId = loadSavedTheme();
if (typeof window !== "undefined") {
  applyTheme(initialThemeId);
}

export const useThemeStore = create<ThemeStoreState>((set, get) => ({
  currentThemeId: initialThemeId,
  currentTheme: toLegacyConfig(getThemeInfo(initialThemeId)),
  availableThemes: themes.map(toLegacyConfig),
  dynamicAccent: null,

  setTheme: (themeId: string) => {
    let newId = themeId as ThemeId;
    if (legacyThemeMap[themeId]) newId = legacyThemeMap[themeId];
    if (!themes.some(t => t.id === newId)) return;
    
    applyTheme(newId);
    
    // Clear dynamic accent when theme changes
    set({
      currentThemeId: newId,
      currentTheme: toLegacyConfig(getThemeInfo(newId)),
      dynamicAccent: null,
    });
    
    // Reset CSS variable
    document.documentElement.style.removeProperty('--dynamic-accent');
  },

  setDynamicAccent: (color: string | null) => {
    set({ dynamicAccent: color });
    
    if (color) {
      // Apply dynamic accent color as CSS variable
      document.documentElement.style.setProperty('--dynamic-accent', color);
      document.documentElement.style.setProperty('--interactive-accent', color);
    } else {
      // Reset to theme default
      document.documentElement.style.removeProperty('--dynamic-accent');
      document.documentElement.style.removeProperty('--interactive-accent');
      // Re-apply theme to restore original accent
      applyTheme(get().currentThemeId);
    }
  },

  getThemeInfo: () => getThemeInfo(get().currentThemeId),
  isDark: () => true, // Always dark now
  isLight: () => false, // No light themes
  getDarkThemes: () => themes,
  getLightThemes: () => [],
}));
