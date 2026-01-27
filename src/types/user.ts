export interface User {
  uid: string;
  visibleId?: number; // Публичный ID (1, 2, 3...)
  username: string;
  displayName: string;
  email: string;
  avatar: string;
  banner: string;
  bannerType: "image" | "gradient" | "animated";
  bannerDisplayMode?: "cover" | "fill";
  avatarFrame: string;
  badges: Badge[];
  createdAt: string;
  birthDate?: string;
  isPublic: boolean;
  favoriteGenres: string[];
  connectedServices: string[];
  stats: UserStats;
  settings: UserSettings;
  achievements: Achievement[];
  friends: string[];
  status: "online" | "dnd" | "offline";
  currentlyPlaying?: string;
  // New fields
  statusMessage?: string;
  profileColor?: string;
  isAdmin?: boolean;
  isGuest?: boolean;
  readNews?: string[];
  socials?: {
    discord?: string;
    telegram?: string;
    tiktok?: string;
    youtube?: string;
  };
  equippedItems?: {
    banner: string;
    frame: string;
    title: string;
    background: string;
  };
  integrations?: {
    telegram?: {
      connected: boolean;
      username?: string;
      notifications: boolean;
    };
    discord?: {
      connected: boolean;
      username?: string;
      richPresence: boolean;
      showActivity: boolean;
    };
  };
  // Premium subscription
  isPremium?: boolean;
  premiumExpiresAt?: string;
  // Mini profile background
  miniProfileBg?: string;
  miniProfileBgType?: 'default' | 'gradient' | 'image';
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  color: string;
  animated?: boolean;
  rarity: "common" | "rare" | "epic" | "legendary";
}

export interface UserStats {
  tracksPlayed: number;
  hoursListened: number;
  playlists: number;
  friends: number;
  likedTracks: number;
  topGenres: { genre: string; percentage: number }[];
  weeklyActivity: number[];
  monthlyListening: { month: string; hours: number }[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  progress: number;
  maxProgress: number;
  unlocked: boolean;
  unlockedAt?: string;
  rarity: "common" | "rare" | "epic" | "legendary";
}

export interface UserSettings {
  appearance: AppearanceSettings;
  player: PlayerSettings;
  library: LibrarySettings;
  search: SearchSettings;
  shortcuts: ShortcutSettings;
  audio: AudioSettings;
  services: ServicesSettings;
  social: SocialSettings;
  storage: StorageSettings;
  advanced: AdvancedSettings;
}

export interface AppearanceSettings {
  theme: "dark" | "light" | "auto";
  themePreset: string;
  customTheme: CustomTheme;
  glassmorphism: boolean;
  blurStrength: number;
  shadows: boolean;
  shadowIntensity: number;
  animations: boolean;
  animationSpeed: number;
  particles: boolean;
  particleType: "snow" | "stars" | "circles" | "notes";
  ambientLighting: boolean;
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  borderRadius: number;
}

export interface CustomTheme {
  bgDarkest: string;
  bgDark: string;
  bgCard: string;
  bgElevated: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  accentStart: string;
  accentMid: string;
  accentEnd: string;
  saturation: number;
  contrast: number;
  transparency: number;
}

export interface PlayerSettings {
  style: "mini" | "standard" | "large" | "vinyl" | "compact";
  position: "bottom" | "top" | "side" | "floating";
  width: "narrow" | "medium" | "wide";
  showArtwork: boolean;
  showTitle: boolean;
  showProgress: boolean;
  progressStyle: "line" | "waveform" | "wave";
  showControls: boolean;
  showLike: boolean;
  showAddToPlaylist: boolean;
  showQueue: boolean;
  showVolume: boolean;
  showTime: boolean;
  visualizer: "none" | "bars" | "waveform" | "circular" | "particles";
  visualizerColor: "artwork" | "accent" | "custom";
  visualizerCustomColor: string;
  artworkSize: "small" | "medium" | "large";
  artworkEffect: "none" | "rotate" | "pulse" | "glow";
  artworkRadius: number;
  ambientBackground: boolean;
}

export interface LibrarySettings {
  view: "grid" | "list" | "compact";
  gridColumns: number;
  previewSize: "small" | "medium" | "large";
  showArtwork: boolean;
  showTitle: boolean;
  showArtist: boolean;
  showTrackCount: boolean;
  showDate: boolean;
  defaultSort: "date" | "name" | "artist" | "tracks";
  sortOrder: "asc" | "desc";
  showSystemPlaylists: boolean;
  groupBy: "none" | "platform" | "date";
}

export interface SearchSettings {
  searchOnType: boolean;
  debounceMs: number;
  showHistory: boolean;
  resultsCount: number;
  defaultFilter: "all" | "tracks" | "artists" | "playlists";
  defaultSort: "relevance" | "popularity";
  enabledPlatforms: {
    soundcloud: boolean;
    spotify: boolean;
    youtube: boolean;
    deezer: boolean;
    vk: boolean;
    yandex: boolean;
  };
}

export interface ShortcutSettings {
  playPause: string;
  nextTrack: string;
  prevTrack: string;
  volumeUp: string;
  volumeDown: string;
  like: string;
  addToPlaylist: string;
  openSearch: string;
  openSettings: string;
  mute: string;
  shuffle: string;
  repeat: string;
}

export interface AudioSettings {
  quality: "auto" | "128" | "256" | "320" | "flac";
  cacheEnabled: boolean;
  cacheLimit: number;
  equalizerEnabled: boolean;
  equalizerPreset: string;
  equalizerBands: number[];
  crossfade: boolean;
  crossfadeDuration: number;
  normalizeVolume: boolean;
  defaultSpeed: number;
}

export interface ServicesSettings {
  soundcloud: {
    tokens: string[];
    activeToken: number;
  };
  spotify: {
    token: string;
    connected: boolean;
  };
  youtube: {
    token: string;
    connected: boolean;
  };
  vk: {
    token: string;
    connected: boolean;
  };
  yandex: {
    token: string;
    connected: boolean;
  };
  deezer: {
    token: string;
    connected: boolean;
  };
  proxy: {
    enabled: boolean;
    type: "builtin" | "custom";
    host: string;
    port: number;
    username: string;
    password: string;
  };
  localServer: {
    autoStart: boolean;
    port: number;
    running: boolean;
  };
}

export interface SocialSettings {
  status: "online" | "dnd" | "offline";
  showListening: boolean;
  friendNotifications: boolean;
  discord: {
    richPresence: boolean;
    showTrack: boolean;
    showArtist: boolean;
    showArtwork: boolean;
    showTime: boolean;
    listenTogether: boolean;
  };
  lastfm: {
    scrobbling: boolean;
    apiKey: string;
    apiSecret: string;
    connected: boolean;
  };
}

export interface StorageSettings {
  offlineFolder: string;
  offlineFormat: "mp3" | "flac" | "ogg";
  offlineQuality: string;
  saveMetadata: boolean;
  cloudSync: boolean;
  syncPlaylists: boolean;
  syncLiked: boolean;
  syncSettings: boolean;
  lastSync: string;
}

export interface AdvancedSettings {
  performanceMode: boolean;
  fpsLimit: 30 | 60 | 120 | 0;
  lazyLoading: boolean;
  preloadTracks: number;
  notifications: boolean;
  notificationPosition:
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right";
  notificationDuration: number;
  notificationSound: boolean;
  language: "ru" | "en" | "uk";
  dateFormat: "DD.MM.YYYY" | "MM.DD.YYYY" | "YYYY-MM-DD";
  timeFormat: "24h" | "12h";
  autoUpdate: boolean;
  autoInstall: boolean;
  updateChannel: "stable" | "beta";
}

export interface Preset {
  id: string;
  name: string;
  description: string;
  author: string;
  authorId: string;
  preview: string;
  settings: Partial<AppearanceSettings>;
  downloads: number;
  likes: number;
  createdAt: string;
}
