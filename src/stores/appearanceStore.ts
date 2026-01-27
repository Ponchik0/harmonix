import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Типы настроек внешнего вида
export type AnimationSpeed = 'none' | 'slow' | 'normal' | 'fast';
export type AnimationStyle = 'minimal' | 'smooth' | 'bouncy' | 'spring';
export type BlurIntensity = 'none' | 'light' | 'medium' | 'heavy';
export type CornerRadius = 'none' | 'small' | 'medium' | 'large' | 'full';
export type FontWeight = 'light' | 'normal' | 'medium' | 'bold';
export type Density = 'compact' | 'comfortable' | 'spacious';
export type VisualizerType = 'none' | 'bars' | 'wave' | 'circle' | 'particles';
export type GlowIntensity = 'none' | 'subtle' | 'medium' | 'strong';

interface AppearanceState {
  // Анимации
  animationSpeed: AnimationSpeed;
  animationStyle: AnimationStyle;
  reduceMotion: boolean;
  
  // Эффекты
  blurIntensity: BlurIntensity;
  glowEffects: boolean;
  glowIntensity: GlowIntensity;
  glassmorphism: boolean;
  shadows: boolean;
  
  // Скругления
  cornerRadius: CornerRadius;
  
  // Шрифты
  fontWeight: FontWeight;
  fontSize: number; // 12-18
  
  // Плотность интерфейса
  density: Density;
  
  // Визуализатор
  visualizerEnabled: boolean;
  visualizerType: VisualizerType;
  visualizerSensitivity: number; // 0.1 - 2.0
  visualizerColor: 'accent' | 'rainbow' | 'monochrome';
  
  // Дополнительно
  smoothScrolling: boolean;
  hoverEffects: boolean;
  transitionDuration: number; // 100-500ms
  
  // Акцентный цвет (кастомный)
  customAccentColor: string | null;
  
  // Actions
  setAnimationSpeed: (speed: AnimationSpeed) => void;
  setAnimationStyle: (style: AnimationStyle) => void;
  setReduceMotion: (reduce: boolean) => void;
  setBlurIntensity: (intensity: BlurIntensity) => void;
  setGlowEffects: (enabled: boolean) => void;
  setGlowIntensity: (intensity: GlowIntensity) => void;
  setGlassmorphism: (enabled: boolean) => void;
  setShadows: (enabled: boolean) => void;
  setCornerRadius: (radius: CornerRadius) => void;
  setFontWeight: (weight: FontWeight) => void;
  setFontSize: (size: number) => void;
  setDensity: (density: Density) => void;
  setVisualizerEnabled: (enabled: boolean) => void;
  setVisualizerType: (type: VisualizerType) => void;
  setVisualizerSensitivity: (sensitivity: number) => void;
  setVisualizerColor: (color: 'accent' | 'rainbow' | 'monochrome') => void;
  setSmoothScrolling: (enabled: boolean) => void;
  setHoverEffects: (enabled: boolean) => void;
  setTransitionDuration: (duration: number) => void;
  setCustomAccentColor: (color: string | null) => void;
  resetToDefaults: () => void;
}

const defaultState = {
  animationSpeed: 'normal' as AnimationSpeed,
  animationStyle: 'smooth' as AnimationStyle,
  reduceMotion: false,
  blurIntensity: 'medium' as BlurIntensity,
  glowEffects: true,
  glowIntensity: 'subtle' as GlowIntensity,
  glassmorphism: true,
  shadows: true,
  cornerRadius: 'medium' as CornerRadius,
  fontWeight: 'normal' as FontWeight,
  fontSize: 14,
  density: 'comfortable' as Density,
  visualizerEnabled: true,
  visualizerType: 'bars' as VisualizerType,
  visualizerSensitivity: 1.0,
  visualizerColor: 'accent' as const,
  smoothScrolling: true,
  hoverEffects: true,
  transitionDuration: 200,
  customAccentColor: null,
};

export const useAppearanceStore = create<AppearanceState>()(
  persist(
    (set) => ({
      ...defaultState,
      
      setAnimationSpeed: (speed) => set({ animationSpeed: speed }),
      setAnimationStyle: (style) => set({ animationStyle: style }),
      setReduceMotion: (reduce) => set({ reduceMotion: reduce }),
      setBlurIntensity: (intensity) => set({ blurIntensity: intensity }),
      setGlowEffects: (enabled) => set({ glowEffects: enabled }),
      setGlowIntensity: (intensity) => set({ glowIntensity: intensity }),
      setGlassmorphism: (enabled) => set({ glassmorphism: enabled }),
      setShadows: (enabled) => set({ shadows: enabled }),
      setCornerRadius: (radius) => set({ cornerRadius: radius }),
      setFontWeight: (weight) => set({ fontWeight: weight }),
      setFontSize: (size) => set({ fontSize: Math.max(12, Math.min(18, size)) }),
      setDensity: (density) => set({ density: density }),
      setVisualizerEnabled: (enabled) => set({ visualizerEnabled: enabled }),
      setVisualizerType: (type) => set({ visualizerType: type }),
      setVisualizerSensitivity: (sensitivity) => set({ visualizerSensitivity: Math.max(0.1, Math.min(2.0, sensitivity)) }),
      setVisualizerColor: (color) => set({ visualizerColor: color }),
      setSmoothScrolling: (enabled) => set({ smoothScrolling: enabled }),
      setHoverEffects: (enabled) => set({ hoverEffects: enabled }),
      setTransitionDuration: (duration) => set({ transitionDuration: Math.max(100, Math.min(500, duration)) }),
      setCustomAccentColor: (color) => set({ customAccentColor: color }),
      resetToDefaults: () => set(defaultState),
    }),
    {
      name: 'harmonix-appearance',
    }
  )
);

// Хелперы для получения CSS значений
export const getAnimationDuration = (speed: AnimationSpeed): string => {
  switch (speed) {
    case 'none': return '0ms';
    case 'slow': return '400ms';
    case 'normal': return '200ms';
    case 'fast': return '100ms';
  }
};

export const getAnimationEasing = (style: AnimationStyle): string => {
  switch (style) {
    case 'minimal': return 'linear';
    case 'smooth': return 'ease-out';
    case 'bouncy': return 'cubic-bezier(0.68, -0.55, 0.265, 1.55)';
    case 'spring': return 'cubic-bezier(0.16, 1, 0.3, 1)';
  }
};

export const getBlurValue = (intensity: BlurIntensity): string => {
  switch (intensity) {
    case 'none': return '0px';
    case 'light': return '8px';
    case 'medium': return '16px';
    case 'heavy': return '24px';
  }
};

export const getBorderRadius = (radius: CornerRadius): string => {
  switch (radius) {
    case 'none': return '0px';
    case 'small': return '4px';
    case 'medium': return '12px';
    case 'large': return '20px';
    case 'full': return '9999px';
  }
};

export const getDensitySpacing = (density: Density): { padding: string; gap: string } => {
  switch (density) {
    case 'compact': return { padding: '8px', gap: '4px' };
    case 'comfortable': return { padding: '12px', gap: '8px' };
    case 'spacious': return { padding: '16px', gap: '12px' };
  }
};
