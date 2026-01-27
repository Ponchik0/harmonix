import type { Track } from "../types";

const API_BASE = "https://harmonix-youtube-api.vercel.app";

class TrendingService {
  private cache: Track[] = [];
  private cacheTime: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Get global trending tracks
  async getTrending(limit: number = 20): Promise<Track[]> {
    // Return cache if fresh
    if (
      this.cache.length > 0 &&
      Date.now() - this.cacheTime < this.CACHE_DURATION
    ) {
      console.log("[TrendingService] Returning cached trending");
      return this.cache.slice(0, limit);
    }

    try {
      console.log("[TrendingService] Fetching global trending...");
      const response = await fetch(`${API_BASE}/api/trending?limit=${limit}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.tracks) {
        this.cache = data.tracks;
        this.cacheTime = Date.now();
        console.log(
          "[TrendingService] Got",
          data.tracks.length,
          "trending tracks"
        );
        return data.tracks;
      }

      return [];
    } catch (error) {
      console.error("[TrendingService] Error fetching trending:", error);
      return this.cache; // Return stale cache on error
    }
  }

  // Record a track play (disabled - API not available)
  async recordPlay(_track: Track): Promise<boolean> {
    // API endpoint не работает, отключаем запись
    // Можно включить когда будет свой сервер
    return false;
  }

  // Clear cache to force refresh
  clearCache(): void {
    this.cache = [];
    this.cacheTime = 0;
  }
}

export const trendingService = new TrendingService();
