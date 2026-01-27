// Optimization Service - manages performance settings

export interface OptimizationSettings {
  disableAnimations: boolean;
  disableEffects: boolean;
  disableBackdropBlur: boolean;
  disablePageTransitions: boolean;
  lazyLoadImages: boolean;
  unloadOffscreenImages: boolean;
  reducedMotion: boolean;
  lowQualityImages: boolean;
  disableVisualizer: boolean;
  limitConcurrentLoads: boolean;
  maxConcurrentLoads: number;
}

const DEFAULT_SETTINGS: OptimizationSettings = {
  disableAnimations: false,
  disableEffects: false,
  disableBackdropBlur: false,
  disablePageTransitions: false,
  lazyLoadImages: true,
  unloadOffscreenImages: false,
  reducedMotion: false,
  lowQualityImages: false,
  disableVisualizer: false,
  limitConcurrentLoads: false,
  maxConcurrentLoads: 5,
};

const STORAGE_KEY = "harmonix-optimization";

class OptimizationService {
  private settings: OptimizationSettings;
  private styleElement: HTMLStyleElement | null = null;

  constructor() {
    this.settings = this.load();
    this.applyStyles();
  }

  private load(): OptimizationSettings {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch {}
    return { ...DEFAULT_SETTINGS };
  }

  private save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
    this.applyStyles();
    window.dispatchEvent(new CustomEvent("optimization-changed", { detail: this.settings }));
  }

  private applyStyles() {
    if (!this.styleElement) {
      this.styleElement = document.createElement("style");
      this.styleElement.id = "harmonix-optimization-styles";
      document.head.appendChild(this.styleElement);
    }

    const rules: string[] = [];

    if (this.settings.disableAnimations) {
      rules.push(`
        *, *::before, *::after {
          animation-duration: 0.001ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.001ms !important;
        }
      `);
    }

    if (this.settings.reducedMotion) {
      rules.push(`
        *, *::before, *::after {
          animation-duration: 0.1s !important;
          transition-duration: 0.1s !important;
        }
      `);
    }

    if (this.settings.disableBackdropBlur) {
      rules.push(`
        * {
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
        }
      `);
    }

    if (this.settings.disableEffects) {
      rules.push(`
        * {
          box-shadow: none !important;
          text-shadow: none !important;
          filter: none !important;
        }
      `);
    }

    this.styleElement.textContent = rules.join("\n");
  }

  getSettings(): OptimizationSettings {
    return { ...this.settings };
  }

  getSetting<K extends keyof OptimizationSettings>(key: K): OptimizationSettings[K] {
    return this.settings[key];
  }

  updateSetting<K extends keyof OptimizationSettings>(key: K, value: OptimizationSettings[K]) {
    this.settings[key] = value;
    this.save();
  }

  updateSettings(partial: Partial<OptimizationSettings>) {
    this.settings = { ...this.settings, ...partial };
    this.save();
  }

  resetToDefaults() {
    this.settings = { ...DEFAULT_SETTINGS };
    this.save();
  }

  // Preset modes
  applyMaxPerformance() {
    this.settings = {
      disableAnimations: true,
      disableEffects: true,
      disableBackdropBlur: true,
      disablePageTransitions: true,
      lazyLoadImages: true,
      unloadOffscreenImages: true,
      reducedMotion: true,
      lowQualityImages: true,
      disableVisualizer: true,
      limitConcurrentLoads: true,
      maxConcurrentLoads: 2,
    };
    this.save();
  }

  applyBalanced() {
    this.settings = {
      disableAnimations: false,
      disableEffects: false,
      disableBackdropBlur: false,
      disablePageTransitions: false,
      lazyLoadImages: true,
      unloadOffscreenImages: false,
      reducedMotion: true,
      lowQualityImages: false,
      disableVisualizer: false,
      limitConcurrentLoads: true,
      maxConcurrentLoads: 5,
    };
    this.save();
  }

  applyQuality() {
    this.settings = { ...DEFAULT_SETTINGS };
    this.save();
  }
}

export const optimizationService = new OptimizationService();
