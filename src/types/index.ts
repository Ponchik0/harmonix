// Track represents a single audio item
export interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration: number; // in seconds
  artworkUrl?: string;
  streamUrl: string;
  platform: "soundcloud" | "local" | "youtube" | "vk" | "spotify" | "yandex" | "offline";
  url?: string; // Original URL for sharing/Discord
  metadata: TrackMetadata;
}

export interface TrackMetadata {
  genre?: string;
  releaseDate?: string;
  playCount?: number;
  likeCount?: number;
  waveformUrl?: string;
}

// Player state
export interface PlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  volume: number; // 0-1
  progress: number; // 0-1
  duration: number;
  shuffle: boolean;
  repeatMode: "off" | "one" | "all";
}

// Queue state
export interface QueueState {
  upcoming: Track[];
  history: Track[];
  currentIndex: number;
}

// Theme configuration
export interface ThemeConfig {
  id: string;
  name: string;
  mode: "light" | "dark" | "custom";
  colors: ThemeColors;
  effects: ThemeEffects;
}

export interface ThemeColors {
  background: string;
  surface: string;
  accent: string;
  secondary: string;
  success: string;
  error: string;
  textPrimary: string;
  textSecondary: string;
}

export interface ThemeEffects {
  glassmorphism: boolean;
  backdropBlur: number;
  borderOpacity: number;
}

// Equalizer configuration
export interface EqualizerConfig {
  enabled: boolean;
  bands: EqualizerBand[];
  presetId: string | null;
}

export interface EqualizerBand {
  frequency: number; // Hz
  gain: number; // -12 to +12 dB
}

export interface EqualizerPreset {
  id: string;
  name: string;
  bands: number[]; // gain values for each band
  isCustom: boolean;
}

// Visualizer configuration
export interface VisualizerConfig {
  style: "waveform" | "spectrum" | "circular";
  colorMode: "theme" | "custom";
  customColors?: string[];
  sensitivity: number;
}

// SoundCloud types
export interface SoundCloudAuth {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface SoundCloudSearchResult {
  tracks: Track[];
  playlists: SoundCloudPlaylist[];
  users: SoundCloudUser[];
  nextPageUrl?: string;
}

export interface SoundCloudPlaylist {
  id: string;
  title: string;
  trackCount: number;
  artworkUrl?: string;
  creator: SoundCloudUser;
}

export interface SoundCloudUser {
  id: string;
  username: string;
  avatarUrl?: string;
  verified?: boolean;
  followersCount?: number;
  trackCount?: number;
}


// Local Playlist
export interface Playlist {
  id: string;
  name: string;
  description?: string;
  artworkUrl?: string;
  coverUrl?: string;
  icon?: string;
  tracks: Track[];
  createdAt: string;
  updatedAt: string;
  source?: string; // soundcloud, youtube, local, etc.
}
