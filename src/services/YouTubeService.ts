/**
 * YouTube Music Service
 * Поиск через YouTube Data API, воспроизведение через SoundCloud fallback
 */

import type { Track } from "../types";
import { proxyService } from './ProxyService';

class YouTubeService {
  readonly serviceId = "youtube";
  readonly serviceName = "YouTube";

  // API ключ захардкожен и скрыт от пользователя
  private readonly _apiKey = "AIzaSyBqjE9utIqpSsP2G05iyd2QS36mEBuTJlc";
  private _enabled: boolean = true;

  constructor() {
    this.loadSettings();
  }

  async init(): Promise<void> {
    this.loadSettings();
    console.log("[YouTube] Service initialized, enabled:", this._enabled);
  }

  private loadSettings() {
    try {
      const settings = localStorage.getItem("harmonix-youtube-settings");
      if (settings) {
        const { enabled } = JSON.parse(settings);
        this._enabled = enabled !== false;
      }
    } catch {
      this._enabled = true;
    }
  }

  private saveSettings() {
    localStorage.setItem(
      "harmonix-youtube-settings",
      JSON.stringify({ enabled: this._enabled })
    );
  }

  isEnabled(): boolean {
    return this._enabled;
  }

  setEnabled(enabled: boolean): void {
    this._enabled = enabled;
    this.saveSettings();
  }

  hasApiKey(): boolean {
    return true; // Всегда есть захардкоженный ключ
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=test&type=video&maxResults=1&key=${this._apiKey}`;
      const response = await proxyService.proxyFetch('youtube', url, { signal: AbortSignal.timeout(10000) });
      if (!response.ok) {
        return { success: false, message: "Ошибка API" };
      }

      return {
        success: true,
        message: "Поиск работает! (воспроизведение через SoundCloud)",
      };
    } catch {
      return { success: false, message: "Ошибка сети" };
    }
  }

  async search(query: string, limit: number = 20): Promise<Track[]> {
    if (!this._enabled || !this._apiKey) return [];

    console.log(`[YouTube] Searching for: ${query}`);

    try {
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
        query + " music"
      )}&type=video&videoCategoryId=10&maxResults=${limit}&key=${this._apiKey}`;
      
      // Use proxy for YouTube API requests
      const response = await proxyService.proxyFetch('youtube', url, { 
        signal: AbortSignal.timeout(15000),
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        console.error('[YouTube] Search failed:', response.status, response.statusText);
        return [];
      }

      const data = await response.json();
      const items = data.items || [];
      if (items.length === 0) return [];

      // Get video details with duration
      const videoIds = items.map((item: any) => item.id.videoId).join(",");
      const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIds}&key=${this._apiKey}`;
      const detailsResponse = await proxyService.proxyFetch('youtube', detailsUrl, {
        headers: {
          'Accept': 'application/json',
        }
      });
      const detailsData = await detailsResponse.json();

      const durationMap = new Map<string, number>();
      for (const video of detailsData.items || []) {
        durationMap.set(
          video.id,
          this.parseDuration(video.contentDetails.duration)
        );
      }

      const tracks: Track[] = [];
      for (const item of items) {
        const videoId = item.id.videoId;
        const duration = durationMap.get(videoId) || 0;

        if (duration > 30 && duration < 900) {
          tracks.push({
            id: `yt-${videoId}`,
            title: this.cleanTitle(item.snippet.title),
            artist:
              item.snippet.channelTitle?.replace(" - Topic", "") || "Unknown",
            duration,
            artworkUrl: item.snippet.thumbnails?.high?.url || "",
            platform: "youtube",
            streamUrl: "",
            url: `https://youtube.com/watch?v=${videoId}`,
            metadata: {},
          });
        }
      }

      console.log(`[YouTube] Found ${tracks.length} tracks`);
      return tracks;
    } catch (error) {
      console.error("[YouTube] Search error:", error);
      return [];
    }
  }

  private parseDuration(iso8601: string): number {
    const match = iso8601.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    return (
      parseInt(match[1] || "0") * 3600 +
      parseInt(match[2] || "0") * 60 +
      parseInt(match[3] || "0")
    );
  }

  private cleanTitle(title: string): string {
    return title
      .replace(
        /\s*[\(\[].*?(official|video|audio|lyrics|hd|4k|music video).*?[\)\]]/gi,
        ""
      )
      .replace(/\s*-\s*(official|video|audio|lyrics).*$/gi, "")
      .trim();
  }

  async getStreamUrl(_videoId: string): Promise<string | null> {
    // YouTube streaming через публичные API не работает стабильно
    // Сразу возвращаем null - fallback на SoundCloud в SearchView
    console.log(`[YouTube] Streaming unavailable, using SoundCloud fallback`);
    return null;
  }
}

export const youtubeService = new YouTubeService();
