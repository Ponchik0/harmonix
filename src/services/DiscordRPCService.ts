/**
 * Discord Rich Presence Service for Harmonix
 * Singleton service that manages Discord RPC state
 * Uses IPC to communicate with Electron main process
 */

export interface DiscordTrack {
  id: string;
  title: string;
  artist: string;
  artworkUrl?: string;
  duration: number;
  source: "soundcloud" | "youtube" | "vk" | "spotify" | "local";
  url?: string;
}

export interface DiscordActivity {
  details?: string;
  state?: string;
  startTimestamp?: number;
  endTimestamp?: number;
  largeImageKey?: string;
  largeImageText?: string;
  smallImageKey?: string;
  smallImageText?: string;
  buttons?: Array<{ label: string; url: string }>;
}

export interface DiscordStatus {
  connected: boolean;
  mode: "gateway" | "rpc" | "none";
  hasToken: boolean;
  enabled: boolean;
}

const SOURCE_CONFIG: Record<string, { name: string; icon: string }> = {
  soundcloud: { name: "SoundCloud", icon: "soundcloud" },
  youtube: { name: "YouTube", icon: "youtube" },
  vk: { name: "VK Music", icon: "vk" },
  spotify: { name: "Spotify", icon: "spotify" },
  local: { name: "Local File", icon: "local" },
};

const SETTINGS_KEY = "harmonix-discord-settings";
const UPDATE_THROTTLE = 1000;

class DiscordRPCService {
  private currentTrack: DiscordTrack | null = null;
  private currentProgress: number = 0;
  private enabled = false;
  private isConnected = false;
  private lastUpdateTime = 0;
  private pendingUpdate: (() => void) | null = null;
  private updateTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.loadSettings();
    if (this.enabled) {
      this.connect();
    }
  }

  private loadSettings(): void {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) {
        const settings = JSON.parse(saved);
        this.enabled = settings.enabled ?? false;
      }
    } catch {
      this.enabled = false;
    }
  }

  private saveSettings(): void {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ enabled: this.enabled }));
  }

  private get api() {
    if (typeof window !== "undefined" && (window as any).electronAPI?.discord) {
      return (window as any).electronAPI.discord;
    }
    return null;
  }

  private get isElectron(): boolean {
    return this.api !== null;
  }

  async connect(): Promise<boolean> {
    if (!this.isElectron) return false;
    if (this.isConnected) return true;
    try {
      const result = await this.api.connect();
      this.isConnected = result?.connected ?? false;
      console.log("[Discord RPC] Connected:", this.isConnected, "Mode:", result?.mode);
      return this.isConnected;
    } catch (error) {
      console.log("[Discord RPC] Connection skipped");
      this.isConnected = false;
      return false;
    }
  }

  async disconnect(): Promise<void> {
    this.isConnected = false;
    await this.clearActivity();
  }

  async setEnabled(enabled: boolean): Promise<boolean> {
    this.enabled = enabled;
    this.saveSettings();
    if (!this.isElectron) return false;
    try {
      const result = await this.api.setEnabled(enabled);
      this.isConnected = result?.connected ?? false;
      if (enabled && this.currentTrack) {
        this.updateActivity(this.currentTrack, this.currentProgress, true);
      }
      return result?.success ?? false;
    } catch (error) {
      console.error("[Discord RPC] SetEnabled error:", error);
      return false;
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  async getStatus(): Promise<DiscordStatus | null> {
    if (!this.isElectron) return null;
    try {
      return await this.api.getStatus();
    } catch {
      return null;
    }
  }

  private throttledUpdate(updateFn: () => void): void {
    const now = Date.now();
    const timeSinceLastUpdate = now - this.lastUpdateTime;
    if (timeSinceLastUpdate >= UPDATE_THROTTLE) {
      this.lastUpdateTime = now;
      updateFn();
    } else {
      this.pendingUpdate = updateFn;
      if (!this.updateTimeout) {
        this.updateTimeout = setTimeout(() => {
          this.updateTimeout = null;
          if (this.pendingUpdate) {
            this.lastUpdateTime = Date.now();
            this.pendingUpdate();
            this.pendingUpdate = null;
          }
        }, UPDATE_THROTTLE - timeSinceLastUpdate);
      }
    }
  }

  async updateActivity(track: DiscordTrack, currentTime: number = 0, isPlaying: boolean = true): Promise<void> {
    if (!this.enabled || !this.isElectron) return;
    if (!this.isConnected) {
      await this.connect();
      if (!this.isConnected) return;
    }
    this.currentTrack = track;
    this.currentProgress = currentTime;

    this.throttledUpdate(async () => {
      const sourceConfig = SOURCE_CONFIG[track.source] || SOURCE_CONFIG.local;
      const durationSec = track.duration > 1000 ? track.duration / 1000 : track.duration;

      // Validate artwork URL for Discord
      let artworkKey = "app"; // Default fallback
      if (track.artworkUrl) {
        // Discord only accepts:
        // 1. Asset keys (registered in Discord app)
        // 2. External HTTP/HTTPS URLs (must be publicly accessible)
        // 3. NOT base64, blob, or data URLs
        if (track.artworkUrl.startsWith('http://') || track.artworkUrl.startsWith('https://')) {
          // Check if it's not a blob or data URL
          if (!track.artworkUrl.startsWith('blob:') && !track.artworkUrl.startsWith('data:')) {
            artworkKey = track.artworkUrl;
            console.log("[Discord RPC] Using artwork URL:", track.artworkUrl.substring(0, 80) + "...");
          } else {
            console.warn("[Discord RPC] Blob/Data URL not supported by Discord, using fallback");
          }
        } else {
          console.warn("[Discord RPC] Invalid artwork URL format, using fallback");
        }
      }

      const activity: DiscordActivity = {
        details: track.title.slice(0, 128),
        state: `by ${track.artist}`.slice(0, 128),
        largeImageKey: artworkKey,
        largeImageText: "Harmonix",
        smallImageKey: isPlaying ? "play" : "pause",
        smallImageText: isPlaying ? sourceConfig.name : "Paused",
      };

      if (isPlaying && durationSec > 0) {
        const now = Math.floor(Date.now() / 1000);
        const trackStart = now - Math.floor(currentTime);
        const trackEnd = trackStart + Math.floor(durationSec);
        activity.startTimestamp = trackStart;
        activity.endTimestamp = trackEnd;
      }

      activity.buttons = [{ label: "Скачать Harmonix", url: "https://harmonix.lol" }];

      try {
        await this.api.setActivity(activity);
        console.log("[Discord RPC] ✅ Activity updated successfully with artwork:", artworkKey === "app" ? "fallback" : "custom");
      } catch (error) {
        console.error("[Discord RPC] Failed to set activity:", error);
      }
    });
  }

  async clearActivity(): Promise<void> {
    this.currentTrack = null;
    this.currentProgress = 0;
    if (!this.isElectron) return;
    try {
      await this.api.clearActivity();
    } catch (error) {
      console.error("[Discord RPC] Failed to clear activity:", error);
    }
  }

  onTrackChange(track: DiscordTrack | null, currentTime: number = 0, isPlaying: boolean = true): void {
    if (!track) {
      this.clearActivity();
      return;
    }
    this.updateActivity(track, currentTime, isPlaying);
  }

  onPause(): void {
    if (this.currentTrack) {
      this.updateActivity(this.currentTrack, this.currentProgress, false);
    }
  }

  onResume(currentTime: number): void {
    if (this.currentTrack) {
      this.updateActivity(this.currentTrack, currentTime, true);
    }
  }

  onSeek(currentTime: number, isPlaying: boolean): void {
    if (this.currentTrack) {
      this.updateActivity(this.currentTrack, currentTime, isPlaying);
    }
  }

  updateProgress(currentTime: number): void {
    this.currentProgress = currentTime;
  }

  async setToken(token: string): Promise<boolean> {
    if (!this.isElectron) return false;
    try {
      const result = await this.api.setToken(token);
      return result?.success ?? false;
    } catch {
      return false;
    }
  }

  async removeToken(): Promise<boolean> {
    if (!this.isElectron) return false;
    try {
      const result = await this.api.removeToken();
      return result?.success ?? false;
    } catch {
      return false;
    }
  }

  async autoExtractToken(): Promise<boolean> {
    if (!this.isElectron) return false;
    try {
      const result = await this.api.autoExtract();
      return result?.found ?? false;
    } catch {
      return false;
    }
  }

  getCurrentTrack(): DiscordTrack | null {
    return this.currentTrack;
  }
}

export const discordRPCService = new DiscordRPCService();
