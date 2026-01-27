import { create } from "zustand";

export type SidebarPosition = "left" | "top" | "right";
export type SliderStyle = "default" | "ios" | "thin" | "wavy";
export type TitleAlignment = "left" | "center" | "right";
export type MiniPlayerStyle = "classic" | "minimal" | "compact" | "glass";
export type VisualizerStyle = "bars" | "wave" | "circle" | "particles" | "none";
export type IconStyle = "outline" | "solid" | "duotone";
export type FontStyle = "default" | "inter" | "roboto" | "poppins" | "nunito" | "montserrat" | "opensans" | "raleway" | "ubuntu" | "comfortaa" | "quicksand" | "lexend" | "outfit" | "sora" | "jetbrains" | "fira" | "orbitron" | "audiowide" | "rajdhani" | "exo2" | "teko" | "russo";
export type LyricsStyle = "default" | "karaoke" | "minimal" | "gradient" | "glow";
export type LyricsFontSize = "xs" | "small" | "medium" | "large" | "xlarge" | "xxlarge";
export type LyricsAlignment = "left" | "center" | "right";
export type ArtworkShape = "square" | "rounded" | "circle";
export type ArtworkPosition = "left" | "right";
export type QueuePosition = "left" | "right" | "bottom";
export type ParticleShape = "circle" | "square" | "star" | "note";
export type WaveService = "soundcloud" | "youtube" | "vk" | "yandex" | "spotify";

export interface LibraryItem {
  id: string;
  url: string;
  name: string;
  type: "image" | "gif" | "video";
  addedAt: number;
}

interface PlayerSettings {
  // Modal state - hides player when modal is open
  isModalOpen: boolean;
  
  // Sidebar
  sidebarPosition: SidebarPosition;
  
  // Player style
  sliderStyle: SliderStyle;
  titleAlignment: TitleAlignment;
  
  // Mini player
  miniPlayerStyle: MiniPlayerStyle;
  miniPlayerHidden: boolean;
  showQueueButton: boolean;
  compactQueueButton: boolean;
  
  // Visualizer
  visualizerStyle: VisualizerStyle;
  visualizerEnabled: boolean;
  
  // Interface settings
  windowOpacity: number; // 0.5 - 1
  blurEnabled: boolean;
  iconStyle: IconStyle;
  fontStyle: FontStyle;
  borderRadius: number; // 0 - 24
  uiScale: number; // 0.8 - 1.2
  
  // Lyrics
  lyricsSync: boolean;
  lyricsStyle: LyricsStyle;
  lyricsFontSize: LyricsFontSize;
  lyricsAlignment: LyricsAlignment;
  lyricsAutoScroll: boolean;
  lyricsHighlightColor: string;
  
  // Text size settings
  textScale: number; // 0.8 - 1.4 (separate from UI scale)
  
  // Player elements visibility
  showTime: boolean;
  showVolume: boolean;
  showQueue: boolean;
  showLyrics: boolean;
  
  // Background effects
  artworkBlur: boolean;
  artworkBlurAmount: number; // 0 - 50
  artworkGlow: boolean;
  
  // Artwork effects
  artworkShape: ArtworkShape;
  artworkRotate: boolean;
  artworkPulse: boolean;
  artworkReflection: boolean;
  artworkShadow: boolean;
  artworkBorder: boolean;
  
  // Artwork layout
  artworkPosition: ArtworkPosition;
  autoThemeFromArtwork: boolean;
  customArtworkUrl: string | null;
  
  // Queue layout
  queuePosition: QueuePosition;
  showNextTrackPreview: boolean;
  
  // Background settings
  backgroundImageUrl: string | null;
  backgroundImageEnabled: boolean;
  backgroundImageOpacity: number; // 0 - 100
  backgroundImageBlur: number; // 0 - 50
  
  // Particles
  particlesEnabled: boolean;
  particleCount: number; // 10 - 200
  particleSpeed: number; // 0.1 - 5
  particleSize: number; // 1 - 10
  particleShape: ParticleShape;
  particleColor: string;
  particleOpacity: number; // 0 - 100
  parallaxEnabled: boolean;
  parallaxStrength: number; // 0 - 10
  
  // Settings window
  settingsTransparent: boolean;
  
  // Customization
  customBackgroundUrl: string | null;
  customBackgroundFile: string | null; // base64 or local path
  customArtworkEnabled: boolean;
  customVisualizerColor: string;
  customCursorEnabled: boolean;
  customCursorUrl: string | null;
  
  // Discord integration
  discordUseCustomArtwork: boolean;
  
  // Audio settings
  crossfadeDuration: number; // 0 - 10 seconds
  
  // Wave (Моя волна)
  waveService: WaveService;
  
  // Library
  libraryItems: LibraryItem[];
  
  // Actions
  setSidebarPosition: (position: SidebarPosition) => void;
  setSliderStyle: (style: SliderStyle) => void;
  setTitleAlignment: (alignment: TitleAlignment) => void;
  setMiniPlayerStyle: (style: MiniPlayerStyle) => void;
  setMiniPlayerHidden: (hidden: boolean) => void;
  setShowQueueButton: (show: boolean) => void;
  setCompactQueueButton: (compact: boolean) => void;
  setVisualizerStyle: (style: VisualizerStyle) => void;
  setVisualizerEnabled: (enabled: boolean) => void;
  setWindowOpacity: (opacity: number) => void;
  setBlurEnabled: (enabled: boolean) => void;
  setIconStyle: (style: IconStyle) => void;
  setFontStyle: (style: FontStyle) => void;
  setBorderRadius: (radius: number) => void;
  setUiScale: (scale: number) => void;
  setLyricsSync: (enabled: boolean) => void;
  setLyricsStyle: (style: LyricsStyle) => void;
  setLyricsFontSize: (size: LyricsFontSize) => void;
  setLyricsAlignment: (alignment: LyricsAlignment) => void;
  setLyricsAutoScroll: (enabled: boolean) => void;
  setLyricsHighlightColor: (color: string) => void;
  setTextScale: (scale: number) => void;
  setShowTime: (show: boolean) => void;
  setShowVolume: (show: boolean) => void;
  setShowQueue: (show: boolean) => void;
  setShowLyrics: (show: boolean) => void;
  setArtworkBlur: (enabled: boolean) => void;
  setArtworkBlurAmount: (amount: number) => void;
  setArtworkGlow: (enabled: boolean) => void;
  setArtworkShape: (shape: ArtworkShape) => void;
  setArtworkRotate: (enabled: boolean) => void;
  setArtworkPulse: (enabled: boolean) => void;
  setArtworkReflection: (enabled: boolean) => void;
  setArtworkShadow: (enabled: boolean) => void;
  setArtworkBorder: (enabled: boolean) => void;
  setArtworkPosition: (position: ArtworkPosition) => void;
  setAutoThemeFromArtwork: (enabled: boolean) => void;
  setCustomArtworkUrl: (url: string | null) => void;
  setQueuePosition: (position: QueuePosition) => void;
  setShowNextTrackPreview: (show: boolean) => void;
  setBackgroundImageUrl: (url: string | null) => void;
  setBackgroundImageEnabled: (enabled: boolean) => void;
  setBackgroundImageOpacity: (opacity: number) => void;
  setBackgroundImageBlur: (blur: number) => void;
  setParticlesEnabled: (enabled: boolean) => void;
  setParticleCount: (count: number) => void;
  setParticleSpeed: (speed: number) => void;
  setParticleSize: (size: number) => void;
  setParticleShape: (shape: ParticleShape) => void;
  setParticleColor: (color: string) => void;
  setParticleOpacity: (opacity: number) => void;
  setParallaxEnabled: (enabled: boolean) => void;
  setParallaxStrength: (strength: number) => void;
  setSettingsTransparent: (enabled: boolean) => void;
  setIsModalOpen: (open: boolean) => void;
  setCustomBackgroundUrl: (url: string | null) => void;
  setCustomBackgroundFile: (file: string | null) => void;
  setCustomArtworkEnabled: (enabled: boolean) => void;
  setCustomVisualizerColor: (color: string) => void;
  setCustomCursorEnabled: (enabled: boolean) => void;
  setCustomCursorUrl: (url: string | null) => void;
  setDiscordUseCustomArtwork: (enabled: boolean) => void;
  setCrossfadeDuration: (duration: number) => void;
  setWaveService: (service: WaveService) => void;
  addLibraryItem: (item: Omit<LibraryItem, "id" | "addedAt">) => void;
  removeLibraryItem: (id: string) => void;
}

const STORAGE_KEY = "harmonix-player-settings";

const loadSettings = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return {};
};

const saveSettings = (settings: Partial<PlayerSettings>) => {
  try {
    const current = loadSettings();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...settings }));
  } catch {}
};

const defaults = loadSettings();

export const usePlayerSettingsStore = create<PlayerSettings>((set) => ({
  isModalOpen: false,
  sidebarPosition: defaults.sidebarPosition || "left",
  sliderStyle: defaults.sliderStyle || "default",
  titleAlignment: defaults.titleAlignment || "left",
  miniPlayerStyle: defaults.miniPlayerStyle || "classic",
  miniPlayerHidden: defaults.miniPlayerHidden ?? false,
  showQueueButton: defaults.showQueueButton ?? true,
  compactQueueButton: defaults.compactQueueButton ?? false,
  visualizerStyle: defaults.visualizerStyle || "bars",
  visualizerEnabled: defaults.visualizerEnabled ?? true,
  windowOpacity: defaults.windowOpacity ?? 1,
  blurEnabled: defaults.blurEnabled ?? true,
  iconStyle: defaults.iconStyle || "outline",
  fontStyle: defaults.fontStyle || "default",
  borderRadius: defaults.borderRadius ?? 12,
  uiScale: defaults.uiScale ?? 1,
  lyricsSync: defaults.lyricsSync ?? true,
  lyricsStyle: defaults.lyricsStyle || "default",
  lyricsFontSize: defaults.lyricsFontSize || "medium",
  lyricsAlignment: defaults.lyricsAlignment || "left",
  lyricsAutoScroll: defaults.lyricsAutoScroll ?? true,
  lyricsHighlightColor: defaults.lyricsHighlightColor || "accent",
  textScale: defaults.textScale ?? 1,
  showTime: defaults.showTime ?? true,
  showVolume: defaults.showVolume ?? true,
  showQueue: defaults.showQueue ?? true,
  showLyrics: defaults.showLyrics ?? true,
  artworkBlur: defaults.artworkBlur ?? true,
  artworkBlurAmount: defaults.artworkBlurAmount ?? 20,
  artworkGlow: defaults.artworkGlow ?? false,
  artworkShape: defaults.artworkShape || "rounded",
  artworkRotate: defaults.artworkRotate ?? false,
  artworkPulse: defaults.artworkPulse ?? false,
  artworkReflection: defaults.artworkReflection ?? false,
  artworkShadow: defaults.artworkShadow ?? true,
  artworkBorder: defaults.artworkBorder ?? false,
  artworkPosition: defaults.artworkPosition || "left",
  autoThemeFromArtwork: defaults.autoThemeFromArtwork ?? false,
  customArtworkUrl: defaults.customArtworkUrl || null,
  queuePosition: defaults.queuePosition || "right",
  showNextTrackPreview: defaults.showNextTrackPreview ?? true,
  backgroundImageUrl: defaults.backgroundImageUrl || null,
  backgroundImageEnabled: defaults.backgroundImageEnabled ?? false,
  backgroundImageOpacity: defaults.backgroundImageOpacity ?? 30,
  backgroundImageBlur: defaults.backgroundImageBlur ?? 8,
  particlesEnabled: defaults.particlesEnabled ?? false,
  particleCount: defaults.particleCount ?? 50,
  particleSpeed: defaults.particleSpeed ?? 1,
  particleSize: defaults.particleSize ?? 3,
  particleShape: defaults.particleShape || "circle",
  particleColor: defaults.particleColor || "var(--interactive-accent)",
  particleOpacity: defaults.particleOpacity ?? 30,
  parallaxEnabled: defaults.parallaxEnabled ?? true,
  parallaxStrength: defaults.parallaxStrength ?? 5,
  settingsTransparent: defaults.settingsTransparent ?? true,
  customBackgroundUrl: defaults.customBackgroundUrl || null,
  customBackgroundFile: defaults.customBackgroundFile || null,
  customArtworkEnabled: defaults.customArtworkEnabled ?? false,
  customVisualizerColor: defaults.customVisualizerColor || "var(--interactive-accent)",
  customCursorEnabled: defaults.customCursorEnabled ?? false,
  customCursorUrl: defaults.customCursorUrl || null,
  discordUseCustomArtwork: defaults.discordUseCustomArtwork ?? false,
  crossfadeDuration: defaults.crossfadeDuration ?? 5,
  waveService: defaults.waveService || "soundcloud",
  libraryItems: defaults.libraryItems || [],

  setSidebarPosition: (position) => { set({ sidebarPosition: position }); saveSettings({ sidebarPosition: position }); },
  setSliderStyle: (style) => { set({ sliderStyle: style }); saveSettings({ sliderStyle: style }); },
  setTitleAlignment: (alignment) => { set({ titleAlignment: alignment }); saveSettings({ titleAlignment: alignment }); },
  setMiniPlayerStyle: (style) => { set({ miniPlayerStyle: style }); saveSettings({ miniPlayerStyle: style }); },
  setMiniPlayerHidden: (hidden) => { set({ miniPlayerHidden: hidden }); saveSettings({ miniPlayerHidden: hidden }); },
  setShowQueueButton: (show) => { set({ showQueueButton: show }); saveSettings({ showQueueButton: show }); },
  setCompactQueueButton: (compact) => { set({ compactQueueButton: compact }); saveSettings({ compactQueueButton: compact }); },
  setVisualizerStyle: (style) => { set({ visualizerStyle: style }); saveSettings({ visualizerStyle: style }); },
  setVisualizerEnabled: (enabled) => { set({ visualizerEnabled: enabled }); saveSettings({ visualizerEnabled: enabled }); },
  setWindowOpacity: (opacity) => { set({ windowOpacity: opacity }); saveSettings({ windowOpacity: opacity }); },
  setBlurEnabled: (enabled) => { set({ blurEnabled: enabled }); saveSettings({ blurEnabled: enabled }); },
  setIconStyle: (style) => { set({ iconStyle: style }); saveSettings({ iconStyle: style }); },
  setFontStyle: (style) => { set({ fontStyle: style }); saveSettings({ fontStyle: style }); },
  setBorderRadius: (radius) => { set({ borderRadius: radius }); saveSettings({ borderRadius: radius }); },
  setUiScale: (scale) => { set({ uiScale: scale }); saveSettings({ uiScale: scale }); },
  setLyricsSync: (enabled) => { set({ lyricsSync: enabled }); saveSettings({ lyricsSync: enabled }); },
  setLyricsStyle: (style) => { set({ lyricsStyle: style }); saveSettings({ lyricsStyle: style }); },
  setLyricsFontSize: (size) => { set({ lyricsFontSize: size }); saveSettings({ lyricsFontSize: size }); },
  setLyricsAlignment: (alignment) => { set({ lyricsAlignment: alignment }); saveSettings({ lyricsAlignment: alignment }); },
  setLyricsAutoScroll: (enabled) => { set({ lyricsAutoScroll: enabled }); saveSettings({ lyricsAutoScroll: enabled }); },
  setLyricsHighlightColor: (color) => { set({ lyricsHighlightColor: color }); saveSettings({ lyricsHighlightColor: color }); },
  setTextScale: (scale) => { set({ textScale: Math.max(0.8, Math.min(1.4, scale)) }); saveSettings({ textScale: Math.max(0.8, Math.min(1.4, scale)) }); },
  setShowTime: (show) => { set({ showTime: show }); saveSettings({ showTime: show }); },
  setShowVolume: (show) => { set({ showVolume: show }); saveSettings({ showVolume: show }); },
  setShowQueue: (show) => { set({ showQueue: show }); saveSettings({ showQueue: show }); },
  setShowLyrics: (show) => { set({ showLyrics: show }); saveSettings({ showLyrics: show }); },
  setArtworkBlur: (enabled) => { set({ artworkBlur: enabled }); saveSettings({ artworkBlur: enabled }); },
  setArtworkBlurAmount: (amount) => { set({ artworkBlurAmount: amount }); saveSettings({ artworkBlurAmount: amount }); },
  setArtworkGlow: (enabled) => { set({ artworkGlow: enabled }); saveSettings({ artworkGlow: enabled }); },
  setArtworkShape: (shape) => { set({ artworkShape: shape }); saveSettings({ artworkShape: shape }); },
  setArtworkRotate: (enabled) => { set({ artworkRotate: enabled }); saveSettings({ artworkRotate: enabled }); },
  setArtworkPulse: (enabled) => { set({ artworkPulse: enabled }); saveSettings({ artworkPulse: enabled }); },
  setArtworkReflection: (enabled) => { set({ artworkReflection: enabled }); saveSettings({ artworkReflection: enabled }); },
  setArtworkShadow: (enabled) => { set({ artworkShadow: enabled }); saveSettings({ artworkShadow: enabled }); },
  setArtworkBorder: (enabled) => { set({ artworkBorder: enabled }); saveSettings({ artworkBorder: enabled }); },
  setArtworkPosition: (position) => { set({ artworkPosition: position }); saveSettings({ artworkPosition: position }); },
  setAutoThemeFromArtwork: (enabled) => { set({ autoThemeFromArtwork: enabled }); saveSettings({ autoThemeFromArtwork: enabled }); },
  setCustomArtworkUrl: (url) => { set({ customArtworkUrl: url }); saveSettings({ customArtworkUrl: url }); },
  setQueuePosition: (position) => { set({ queuePosition: position }); saveSettings({ queuePosition: position }); },
  setShowNextTrackPreview: (show) => { set({ showNextTrackPreview: show }); saveSettings({ showNextTrackPreview: show }); },
  setBackgroundImageUrl: (url) => { set({ backgroundImageUrl: url }); saveSettings({ backgroundImageUrl: url }); },
  setBackgroundImageEnabled: (enabled) => { set({ backgroundImageEnabled: enabled }); saveSettings({ backgroundImageEnabled: enabled }); },
  setBackgroundImageOpacity: (opacity) => { set({ backgroundImageOpacity: opacity }); saveSettings({ backgroundImageOpacity: opacity }); },
  setBackgroundImageBlur: (blur) => { set({ backgroundImageBlur: blur }); saveSettings({ backgroundImageBlur: blur }); },
  setParticlesEnabled: (enabled) => { set({ particlesEnabled: enabled }); saveSettings({ particlesEnabled: enabled }); },
  setParticleCount: (count) => { set({ particleCount: count }); saveSettings({ particleCount: count }); },
  setParticleSpeed: (speed) => { set({ particleSpeed: speed }); saveSettings({ particleSpeed: speed }); },
  setParticleSize: (size) => { set({ particleSize: size }); saveSettings({ particleSize: size }); },
  setParticleShape: (shape) => { set({ particleShape: shape }); saveSettings({ particleShape: shape }); },
  setParticleColor: (color) => { set({ particleColor: color }); saveSettings({ particleColor: color }); },
  setParticleOpacity: (opacity) => { set({ particleOpacity: opacity }); saveSettings({ particleOpacity: opacity }); },
  setParallaxEnabled: (enabled) => { set({ parallaxEnabled: enabled }); saveSettings({ parallaxEnabled: enabled }); },
  setParallaxStrength: (strength) => { set({ parallaxStrength: strength }); saveSettings({ parallaxStrength: strength }); },
  setSettingsTransparent: (enabled) => { set({ settingsTransparent: enabled }); saveSettings({ settingsTransparent: enabled }); },
  setIsModalOpen: (open) => { set({ isModalOpen: open }); },
  setCustomBackgroundUrl: (url) => { set({ customBackgroundUrl: url }); saveSettings({ customBackgroundUrl: url }); },
  setCustomBackgroundFile: (file) => { set({ customBackgroundFile: file }); saveSettings({ customBackgroundFile: file }); },
  setCustomArtworkEnabled: (enabled) => { set({ customArtworkEnabled: enabled }); saveSettings({ customArtworkEnabled: enabled }); },
  setCustomVisualizerColor: (color) => { set({ customVisualizerColor: color }); saveSettings({ customVisualizerColor: color }); },
  setCustomCursorEnabled: (enabled) => { set({ customCursorEnabled: enabled }); saveSettings({ customCursorEnabled: enabled }); },
  setCustomCursorUrl: (url) => { set({ customCursorUrl: url }); saveSettings({ customCursorUrl: url }); },
  setDiscordUseCustomArtwork: (enabled) => { set({ discordUseCustomArtwork: enabled }); saveSettings({ discordUseCustomArtwork: enabled }); },
  setCrossfadeDuration: (duration) => { set({ crossfadeDuration: duration }); saveSettings({ crossfadeDuration: duration }); },
  setWaveService: (service) => { set({ waveService: service }); saveSettings({ waveService: service }); },
  addLibraryItem: (item) => {
    const newItem: LibraryItem = { ...item, id: crypto.randomUUID(), addedAt: Date.now() };
    set((state) => {
      const items = [...state.libraryItems, newItem];
      saveSettings({ libraryItems: items });
      return { libraryItems: items };
    });
  },
  removeLibraryItem: (id) => {
    set((state) => {
      const items = state.libraryItems.filter((i) => i.id !== id);
      saveSettings({ libraryItems: items });
      return { libraryItems: items };
    });
  },
}));
