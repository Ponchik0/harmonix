import { create } from "zustand";

// Theme IDs matching tokens.css
export type ThemeId =
  | "dark" | "dark-slate" | "dark-rose" | "dark-emerald" | "dark-violet"
  | "dark-amber" | "dark-cyan" | "dark-fuchsia" | "dark-amoled" | "dark-nord"
  | "light" | "light-sky" | "light-rose" | "light-emerald" | "light-violet"
  | "light-amber" | "light-cyan" | "light-fuchsia" | "light-stone" | "light-slate";

export interface ThemeInfo {
  id: ThemeId;
  name: string;
  mode: "dark" | "light";
  accent: string;
  preview: string; // Background color for preview
}

// All available themes with nice Russian names - matching tokens.css
export const themes: ThemeInfo[] = [
  // Dark themes - vibrant accents with deep backgrounds
  { id: "dark", name: "Чёрная", mode: "dark", accent: "#ffffff", preview: "#0a0a0a" },
  { id: "dark-slate", name: "Синий Сланец", mode: "dark", accent: "#60a5fa", preview: "#0f1419" },
  { id: "dark-rose", name: "Розовая", mode: "dark", accent: "#fb7185", preview: "#1a0f13" },
  { id: "dark-emerald", name: "Изумрудная", mode: "dark", accent: "#34d399", preview: "#0a1612" },
  { id: "dark-violet", name: "Фиолетовая", mode: "dark", accent: "#a78bfa", preview: "#110f1a" },
  { id: "dark-amber", name: "Янтарная", mode: "dark", accent: "#fbbf24", preview: "#1a1510" },
  { id: "dark-cyan", name: "Бирюзовая", mode: "dark", accent: "#22d3ee", preview: "#0a1619" },
  { id: "dark-fuchsia", name: "Фуксия", mode: "dark", accent: "#e879f9", preview: "#1a0f19" },
  { id: "dark-amoled", name: "AMOLED", mode: "dark", accent: "#ffffff", preview: "#000000" },
  { id: "dark-nord", name: "Нордик", mode: "dark", accent: "#88c0d0", preview: "#2e3440" },
  // Light themes - softer backgrounds with vibrant accents
  { id: "light", name: "Белая", mode: "light", accent: "#18181b", preview: "#fafafa" },
  { id: "light-sky", name: "Небесная", mode: "light", accent: "#0284c7", preview: "#f0f9ff" },
  { id: "light-rose", name: "Розовая", mode: "light", accent: "#e11d48", preview: "#fff1f2" },
  { id: "light-emerald", name: "Мятная", mode: "light", accent: "#059669", preview: "#ecfdf5" },
  { id: "light-violet", name: "Лавандовая", mode: "light", accent: "#7c3aed", preview: "#f5f3ff" },
  { id: "light-amber", name: "Песочная", mode: "light", accent: "#d97706", preview: "#fffbeb" },
  { id: "light-cyan", name: "Океаническая", mode: "light", accent: "#0891b2", preview: "#ecfeff" },
  { id: "light-fuchsia", name: "Сиреневая", mode: "light", accent: "#c026d3", preview: "#fdf4ff" },
  { id: "light-stone", name: "Каменная", mode: "light", accent: "#44403c", preview: "#fafaf9" },
  { id: "light-slate", name: "Туманная", mode: "light", accent: "#334155", preview: "#f8fafc" },
];

const STORAGE_KEY = "harmonix-theme";

// Legacy compatibility
const legacyThemeMap: Record<string, ThemeId> = {
  "dark-default": "dark",
  "dark-midnight": "dark-slate",
  "dark-ocean": "dark-cyan",
  "dark-forest": "dark-emerald",
  "dark-sunset": "dark-amber",
  "dark-rose": "dark-rose",
  "dark-nord": "dark-nord",
  "dark-dracula": "dark-violet",
  "dark-amoled": "dark-amoled",
  "dark-cyberpunk": "dark-cyan",
  "light-default": "light",
  "light-snow": "light",
  "light-sky": "light-sky",
  "light-mint": "light-emerald",
  "light-peach": "light-amber",
  "light-lavender": "light-violet",
  "light-rose": "light-rose",
  "light-sand": "light-amber",
  "light-cream": "light-stone",
  "light-paper": "light-slate",
  // Old new theme IDs
  "dark-blue": "dark-slate",
  "dark-red": "dark-rose",
  "dark-green": "dark-emerald",
  "dark-purple": "dark-violet",
  "dark-orange": "dark-amber",
  "dark-pink": "dark-fuchsia",
  "dark-yellow": "dark-amber",
  "dark-teal": "dark-cyan",
  "light-blue": "light-sky",
  "light-red": "light-rose",
  "light-green": "light-emerald",
  "light-purple": "light-violet",
  "light-orange": "light-amber",
  "light-pink": "light-fuchsia",
  "light-yellow": "light-amber",
  "light-teal": "light-cyan",
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
  
  if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: light)").matches) {
    return "light";
  }
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
  
  // Set initial taskbar icon based on saved theme
  const isLightTheme = initialThemeId.startsWith("light");
  if (window.electronAPI?.setIcon) {
    window.electronAPI.setIcon(isLightTheme);
  }
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
    
    // Change taskbar icon based on theme
    const isLightTheme = newId.startsWith("light");
    if (window.electronAPI?.setIcon) {
      window.electronAPI.setIcon(isLightTheme);
    }
    
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
  isDark: () => get().currentThemeId.startsWith("dark"),
  isLight: () => get().currentThemeId.startsWith("light"),
  getDarkThemes: () => themes.filter(t => t.mode === "dark"),
  getLightThemes: () => themes.filter(t => t.mode === "light"),
}));
