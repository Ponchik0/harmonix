import { openDB, DBSchema, IDBPDatabase } from "idb";
import type { Track, ThemeConfig, EqualizerConfig } from "../types";

const DB_NAME = "harmonix-db";
const DB_VERSION = 1;

interface StoredTrack extends Track {
  addedAt: number;
  lastPlayedAt?: number;
  playCount: number;
  liked: boolean;
}

interface StoredPlaylist {
  id: string;
  name: string;
  description?: string;
  trackIds: string[];
  artworkUrl?: string;
  createdAt: number;
  updatedAt: number;
}

interface PreferenceEntry {
  key: string;
  value: unknown;
  updatedAt: number;
}

interface PlatformAuth {
  platform: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  userId?: string;
}

interface CacheEntry {
  key: string;
  data: unknown;
  expiresAt: number;
  createdAt: number;
}

interface HarmonixDB extends DBSchema {
  tracks: {
    key: string;
    value: StoredTrack;
    indexes: {
      "by-platform": string;
      "by-artist": string;
      "by-addedAt": number;
    };
  };
  playlists: {
    key: string;
    value: StoredPlaylist;
    indexes: {
      "by-createdAt": number;
      "by-updatedAt": number;
    };
  };
  preferences: {
    key: string;
    value: PreferenceEntry;
  };
  auth: {
    key: string;
    value: PlatformAuth;
  };
  cache: {
    key: string;
    value: CacheEntry;
    indexes: {
      "by-expiresAt": number;
    };
  };
}

class StorageService {
  private db: IDBPDatabase<HarmonixDB> | null = null;
  private initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = this.initDB();
    return this.initPromise;
  }

  private async initDB(): Promise<void> {
    this.db = await openDB<HarmonixDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Tracks store
        if (!db.objectStoreNames.contains("tracks")) {
          const trackStore = db.createObjectStore("tracks", { keyPath: "id" });
          trackStore.createIndex("by-platform", "platform");
          trackStore.createIndex("by-artist", "artist");
          trackStore.createIndex("by-addedAt", "addedAt");
        }

        // Playlists store
        if (!db.objectStoreNames.contains("playlists")) {
          const playlistStore = db.createObjectStore("playlists", {
            keyPath: "id",
          });
          playlistStore.createIndex("by-createdAt", "createdAt");
          playlistStore.createIndex("by-updatedAt", "updatedAt");
        }

        // Preferences store
        if (!db.objectStoreNames.contains("preferences")) {
          db.createObjectStore("preferences", { keyPath: "key" });
        }

        // Auth store
        if (!db.objectStoreNames.contains("auth")) {
          db.createObjectStore("auth", { keyPath: "platform" });
        }

        // Cache store
        if (!db.objectStoreNames.contains("cache")) {
          const cacheStore = db.createObjectStore("cache", { keyPath: "key" });
          cacheStore.createIndex("by-expiresAt", "expiresAt");
        }
      },
    });
  }

  private async ensureDB(): Promise<IDBPDatabase<HarmonixDB>> {
    await this.init();
    if (!this.db) throw new Error("Database not initialized");
    return this.db;
  }

  // Preferences
  async savePreference<T>(key: string, value: T): Promise<void> {
    const db = await this.ensureDB();
    await db.put("preferences", {
      key,
      value,
      updatedAt: Date.now(),
    });
  }

  async getPreference<T>(key: string): Promise<T | undefined> {
    const db = await this.ensureDB();
    const entry = await db.get("preferences", key);
    return entry?.value as T | undefined;
  }

  async getAllPreferences(): Promise<Record<string, unknown>> {
    const db = await this.ensureDB();
    const entries = await db.getAll("preferences");
    return entries.reduce((acc, entry) => {
      acc[entry.key] = entry.value;
      return acc;
    }, {} as Record<string, unknown>);
  }

  // Theme
  async saveTheme(theme: ThemeConfig): Promise<void> {
    await this.savePreference("currentTheme", theme);
  }

  async getTheme(): Promise<ThemeConfig | undefined> {
    return this.getPreference<ThemeConfig>("currentTheme");
  }

  // Equalizer
  async saveEqualizerConfig(config: EqualizerConfig): Promise<void> {
    await this.savePreference("equalizerConfig", config);
  }

  async getEqualizerConfig(): Promise<EqualizerConfig | undefined> {
    return this.getPreference<EqualizerConfig>("equalizerConfig");
  }

  // Volume
  async saveVolume(volume: number): Promise<void> {
    await this.savePreference("volume", volume);
  }

  async getVolume(): Promise<number> {
    return (await this.getPreference<number>("volume")) ?? 0.7;
  }

  // Tracks
  async saveTrack(track: Track): Promise<void> {
    const db = await this.ensureDB();
    const existing = await db.get("tracks", track.id);

    const storedTrack: StoredTrack = {
      ...track,
      addedAt: existing?.addedAt ?? Date.now(),
      lastPlayedAt: existing?.lastPlayedAt,
      playCount: existing?.playCount ?? 0,
      liked: existing?.liked ?? false,
    };

    await db.put("tracks", storedTrack);
  }

  async getTrack(id: string): Promise<StoredTrack | undefined> {
    const db = await this.ensureDB();
    return db.get("tracks", id);
  }

  async getAllTracks(): Promise<StoredTrack[]> {
    const db = await this.ensureDB();
    return db.getAll("tracks");
  }

  async getLikedTracks(): Promise<StoredTrack[]> {
    const db = await this.ensureDB();
    const tracks = await db.getAll("tracks");
    return tracks.filter((t) => t.liked);
  }

  async toggleLike(trackId: string): Promise<boolean> {
    const db = await this.ensureDB();
    const track = await db.get("tracks", trackId);
    if (!track) return false;

    track.liked = !track.liked;
    await db.put("tracks", track);
    return track.liked;
  }

  async addLikedTrack(track: Track): Promise<void> {
    const db = await this.ensureDB();
    const storedTrack: StoredTrack = {
      ...track,
      addedAt: Date.now(),
      playCount: 0,
      liked: true,
    };
    await db.put("tracks", storedTrack);
  }

  async removeLikedTrack(trackId: string): Promise<void> {
    const db = await this.ensureDB();
    const track = await db.get("tracks", trackId);
    if (track) {
      track.liked = false;
      await db.put("tracks", track);
    }
  }

  async updatePlayCount(trackId: string): Promise<void> {
    const db = await this.ensureDB();
    const track = await db.get("tracks", trackId);
    if (!track) return;

    track.playCount++;
    track.lastPlayedAt = Date.now();
    await db.put("tracks", track);
  }

  // Playlists
  async savePlaylist(playlist: any): Promise<void> {
    const db = await this.ensureDB();
    const storedPlaylist: StoredPlaylist = {
      id: playlist.id,
      name: playlist.name,
      description: playlist.description,
      trackIds: playlist.tracks?.map((t: Track) => t.id) || [],
      artworkUrl: playlist.artworkUrl,
      createdAt: playlist.createdAt || Date.now(),
      updatedAt: Date.now(),
    };
    await db.put("playlists", storedPlaylist);
  }

  async createPlaylist(playlist: any): Promise<void> {
    await this.savePlaylist(playlist);
  }

  async getPlaylists(): Promise<any[]> {
    const db = await this.ensureDB();
    const playlists = await db.getAll("playlists");
    return playlists.map((p) => ({
      id: p.id,
      name: p.name,
      tracks: [],
      createdAt: p.createdAt,
      artworkUrl: p.artworkUrl,
    }));
  }

  async getPlaylist(id: string): Promise<StoredPlaylist | undefined> {
    const db = await this.ensureDB();
    return db.get("playlists", id);
  }

  async getAllPlaylists(): Promise<StoredPlaylist[]> {
    const db = await this.ensureDB();
    return db.getAll("playlists");
  }

  async deletePlaylist(id: string): Promise<void> {
    const db = await this.ensureDB();
    await db.delete("playlists", id);
  }

  // Auth
  async saveAuth(auth: PlatformAuth): Promise<void> {
    const db = await this.ensureDB();
    await db.put("auth", auth);
  }

  async getAuth(platform: string): Promise<PlatformAuth | undefined> {
    const db = await this.ensureDB();
    return db.get("auth", platform);
  }

  async deleteAuth(platform: string): Promise<void> {
    const db = await this.ensureDB();
    await db.delete("auth", platform);
  }

  // Cache
  async setCache<T>(
    key: string,
    data: T,
    ttlMs: number = 3600000
  ): Promise<void> {
    const db = await this.ensureDB();
    await db.put("cache", {
      key,
      data,
      createdAt: Date.now(),
      expiresAt: Date.now() + ttlMs,
    });
  }

  async getCache<T>(key: string): Promise<T | undefined> {
    const db = await this.ensureDB();
    const entry = await db.get("cache", key);

    if (!entry) return undefined;
    if (entry.expiresAt < Date.now()) {
      await db.delete("cache", key);
      return undefined;
    }

    return entry.data as T;
  }

  async clearExpiredCache(): Promise<void> {
    const db = await this.ensureDB();
    const tx = db.transaction("cache", "readwrite");
    const index = tx.store.index("by-expiresAt");
    const now = Date.now();

    let cursor = await index.openCursor(IDBKeyRange.upperBound(now));
    while (cursor) {
      await cursor.delete();
      cursor = await cursor.continue();
    }
  }

  // Session state
  async saveSessionState(state: {
    currentTrackId?: string;
    queueTrackIds: string[];
    historyTrackIds: string[];
    volume: number;
    shuffle: boolean;
    repeatMode: "off" | "one" | "all";
  }): Promise<void> {
    await this.savePreference("sessionState", state);
  }

  async getSessionState(): Promise<
    | {
        currentTrackId?: string;
        queueTrackIds: string[];
        historyTrackIds: string[];
        volume: number;
        shuffle: boolean;
        repeatMode: "off" | "one" | "all";
      }
    | undefined
  > {
    return this.getPreference("sessionState");
  }
}

export const storageService = new StorageService();
