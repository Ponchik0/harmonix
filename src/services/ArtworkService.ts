/**
 * Artwork Service
 * 
 * Сервис для поиска обложек треков по названию
 * Использует SoundCloud для поиска похожих треков и извлечения artwork
 */

import { soundCloudService } from "./SoundCloudService";
import type { Track } from "../types";

const ARTWORK_CACHE_KEY = "harmonix-artwork-cache";
const MAX_CACHE_SIZE = 1000;

interface ArtworkCache {
  [key: string]: {
    artworkUrl: string;
    timestamp: number;
  };
}

class ArtworkService {
  private cache: ArtworkCache = {};
  private pendingRequests: Map<string, Promise<string | null>> = new Map();

  constructor() {
    this.loadCache();
  }

  private loadCache() {
    try {
      const saved = localStorage.getItem(ARTWORK_CACHE_KEY);
      if (saved) {
        this.cache = JSON.parse(saved);
        // Clean old entries (older than 7 days)
        const now = Date.now();
        const weekMs = 7 * 24 * 60 * 60 * 1000;
        for (const key of Object.keys(this.cache)) {
          if (now - this.cache[key].timestamp > weekMs) {
            delete this.cache[key];
          }
        }
        this.saveCache();
      }
    } catch (e) {
      console.error("[ArtworkService] Failed to load cache:", e);
      this.cache = {};
    }
  }

  private saveCache() {
    try {
      // Limit cache size
      const keys = Object.keys(this.cache);
      if (keys.length > MAX_CACHE_SIZE) {
        // Remove oldest entries
        const sorted = keys.sort((a, b) => this.cache[a].timestamp - this.cache[b].timestamp);
        for (let i = 0; i < keys.length - MAX_CACHE_SIZE; i++) {
          delete this.cache[sorted[i]];
        }
      }
      localStorage.setItem(ARTWORK_CACHE_KEY, JSON.stringify(this.cache));
    } catch (e) {
      console.error("[ArtworkService] Failed to save cache:", e);
    }
  }

  private getCacheKey(track: Track): string {
    return `${track.artist?.toLowerCase()}_${track.title?.toLowerCase()}`.replace(/\s+/g, "_");
  }

  /**
   * Check if artwork URL is valid
   */
  isValidArtworkUrl(url: string | undefined): boolean {
    if (!url) return false;
    if (!url.startsWith("http://") && !url.startsWith("https://")) return false;
    try {
      const parsed = new URL(url);
      return Boolean(parsed.hostname && parsed.hostname.includes(".")) && !url.includes("[link_removed]");
    } catch {
      return false;
    }
  }

  /**
   * Get cached artwork for a track
   */
  getCachedArtwork(track: Track): string | null {
    const key = this.getCacheKey(track);
    const cached = this.cache[key];
    if (cached && this.isValidArtworkUrl(cached.artworkUrl)) {
      return cached.artworkUrl;
    }
    return null;
  }

  /**
   * Search for artwork by track name
   */
  async searchArtwork(track: Track): Promise<string | null> {
    const key = this.getCacheKey(track);

    // Check cache first
    const cached = this.getCachedArtwork(track);
    if (cached) {
      return cached;
    }

    // Check if already searching for this track
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)!;
    }

    // Search for artwork
    const promise = this.doSearchArtwork(track, key);
    this.pendingRequests.set(key, promise);

    try {
      const result = await promise;
      return result;
    } finally {
      this.pendingRequests.delete(key);
    }
  }

  private async doSearchArtwork(track: Track, cacheKey: string): Promise<string | null> {
    try {
      // Build search query
      const query = `${track.artist || ""} ${track.title || ""}`.trim();
      if (!query) return null;

      console.log(`[ArtworkService] Searching artwork for: ${query}`);

      const results = await soundCloudService.search(query, 3);
      
      if (results.tracks.length === 0) {
        // Try title only
        const titleResults = await soundCloudService.search(track.title || "", 3);
        if (titleResults.tracks.length === 0) {
          return null;
        }
        results.tracks = titleResults.tracks;
      }

      // Find best match with artwork
      for (const result of results.tracks) {
        if (this.isValidArtworkUrl(result.artworkUrl)) {
          // Get higher quality artwork
          const artworkUrl = result.artworkUrl!.replace("-large.", "-t500x500.");
          
          // Cache the result
          this.cache[cacheKey] = {
            artworkUrl,
            timestamp: Date.now(),
          };
          this.saveCache();

          console.log(`[ArtworkService] Found artwork for "${track.title}": ${artworkUrl}`);
          return artworkUrl;
        }
      }

      return null;
    } catch (error) {
      console.error(`[ArtworkService] Search failed for "${track.title}":`, error);
      return null;
    }
  }

  /**
   * Fetch artworks for multiple tracks in background
   * Returns a callback to cancel the operation
   */
  fetchArtworksInBackground(
    tracks: Track[],
    onArtworkFound: (trackId: string, artworkUrl: string) => void,
    onComplete?: () => void
  ): () => void {
    let cancelled = false;

    const run = async () => {
      const tracksNeedingArtwork = tracks.filter(
        t => !this.isValidArtworkUrl(t.artworkUrl) && !this.getCachedArtwork(t)
      );

      console.log(`[ArtworkService] Fetching artworks for ${tracksNeedingArtwork.length} tracks...`);

      // Limit to first 5 tracks to avoid rate limiting
      const limitedTracks = tracksNeedingArtwork.slice(0, 5);

      for (const track of limitedTracks) {
        if (cancelled) break;

        const artworkUrl = await this.searchArtwork(track);
        if (artworkUrl && !cancelled) {
          onArtworkFound(track.id, artworkUrl);
        }

        // Increased delay to avoid rate limiting (2 seconds between requests)
        if (!cancelled) {
          await new Promise(r => setTimeout(r, 2000));
        }
      }

      if (!cancelled && onComplete) {
        onComplete();
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }

  /**
   * Get artwork for a track (from cache or search)
   */
  async getArtwork(track: Track): Promise<string | null> {
    // If track already has valid artwork, return it
    if (this.isValidArtworkUrl(track.artworkUrl)) {
      return track.artworkUrl!;
    }

    // Check cache
    const cached = this.getCachedArtwork(track);
    if (cached) {
      return cached;
    }

    // Search for artwork
    return this.searchArtwork(track);
  }

  /**
   * Clear the artwork cache
   */
  clearCache() {
    this.cache = {};
    localStorage.removeItem(ARTWORK_CACHE_KEY);
    console.log("[ArtworkService] Cache cleared");
  }
}

export const artworkService = new ArtworkService();

// Expose to window for debugging
if (typeof window !== "undefined") {
  (window as any).harmonixArtworkService = {
    clearCache: () => artworkService.clearCache(),
    getCached: (artist: string, title: string) => {
      return artworkService.getCachedArtwork({ id: "", artist, title } as Track);
    },
    search: (artist: string, title: string) => {
      return artworkService.searchArtwork({ id: "", artist, title } as Track);
    },
  };
}
