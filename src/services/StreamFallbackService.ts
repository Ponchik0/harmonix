/**
 * Stream Fallback Service
 * 
 * Система fallback для получения stream URL:
 * 1. Пробуем оригинальный источник (YouTube, VK, etc.)
 * 2. Если не работает - ищем на SoundCloud по названию
 * 3. Если SoundCloud не работает - пробуем другие источники
 * 
 * Основано на идее из LavaSrc: https://github.com/topi314/LavaSrc
 */

import { soundCloudService } from "./SoundCloudService";
import { youtubeService } from "./YouTubeService";
import type { Track } from "../types";

export interface StreamResult {
  streamUrl: string | null;
  source: "original" | "soundcloud" | "youtube" | "fallback";
  fallbackTrack?: Track;
}

class StreamFallbackService {
  /**
   * Получить stream URL с fallback на другие источники
   */
  async getStreamUrl(track: Track): Promise<StreamResult> {
    console.log(`[Fallback] Getting stream for: ${track.title} by ${track.artist} (${track.platform})`);

    // 1. Пробуем оригинальный источник
    let streamUrl = await this.tryOriginalSource(track);
    if (streamUrl) {
      console.log(`[Fallback] Got stream from original source: ${track.platform}`);
      return { streamUrl, source: "original" };
    }

    // 2. Fallback на SoundCloud (основной fallback)
    const scResult = await this.trySoundCloudFallback(track);
    if (scResult.streamUrl) {
      console.log(`[Fallback] Got stream from SoundCloud fallback`);
      return scResult;
    }

    // 3. Если трек был с SoundCloud и не сработал - пробуем YouTube поиск
    if (track.platform === "soundcloud") {
      const ytResult = await this.tryYouTubeFallback(track);
      if (ytResult.streamUrl) {
        console.log(`[Fallback] Got stream from YouTube fallback`);
        return ytResult;
      }
    }

    console.log(`[Fallback] All sources failed for: ${track.title}`);
    return { streamUrl: null, source: "fallback" };
  }

  /**
   * Попробовать оригинальный источник трека
   */
  private async tryOriginalSource(track: Track): Promise<string | null> {
    try {
      // Если уже есть streamUrl - проверяем его
      if (track.streamUrl) {
        const isValid = await this.validateStreamUrl(track.streamUrl);
        if (isValid) return track.streamUrl;
      }

      // Получаем новый streamUrl
      switch (track.platform) {
        case "soundcloud": {
          const trackId = track.id.replace("sc-", "");
          return await soundCloudService.getStreamUrl(trackId);
        }
        case "youtube": {
          const videoId = track.id.replace("yt-", "");
          return await youtubeService.getStreamUrl(videoId);
        }
        default:
          return null;
      }
    } catch (error) {
      console.error(`[Fallback] Original source error:`, error);
      return null;
    }
  }

  /**
   * Fallback на SoundCloud - ищем похожий трек
   */
  private async trySoundCloudFallback(track: Track): Promise<StreamResult> {
    try {
      // Формируем поисковый запрос
      const searchQuery = `${track.artist} ${track.title}`.trim();
      console.log(`[Fallback] Searching SoundCloud for: ${searchQuery}`);

      const results = await soundCloudService.search(searchQuery, 5);
      
      if (results.tracks.length === 0) {
        // Пробуем только по названию
        const titleResults = await soundCloudService.search(track.title, 5);
        if (titleResults.tracks.length === 0) {
          return { streamUrl: null, source: "soundcloud" };
        }
        results.tracks = titleResults.tracks;
      }

      // Ищем наиболее похожий трек
      const bestMatch = this.findBestMatch(track, results.tracks);
      if (!bestMatch) {
        return { streamUrl: null, source: "soundcloud" };
      }

      // Получаем stream URL
      const trackId = bestMatch.id.replace("sc-", "");
      const streamUrl = await soundCloudService.getStreamUrl(trackId);

      if (streamUrl) {
        return { 
          streamUrl, 
          source: "soundcloud",
          fallbackTrack: bestMatch 
        };
      }

      return { streamUrl: null, source: "soundcloud" };
    } catch (error) {
      console.error(`[Fallback] SoundCloud fallback error:`, error);
      return { streamUrl: null, source: "soundcloud" };
    }
  }

  /**
   * Fallback на YouTube - ищем похожий трек
   */
  private async tryYouTubeFallback(track: Track): Promise<StreamResult> {
    try {
      const searchQuery = `${track.artist} ${track.title}`.trim();
      console.log(`[Fallback] Searching YouTube for: ${searchQuery}`);

      const results = await youtubeService.search(searchQuery, 5);
      
      if (results.length === 0) {
        return { streamUrl: null, source: "youtube" };
      }

      // YouTube не даёт прямой stream, но мы можем вернуть трек для дальнейшего fallback
      const bestMatch = this.findBestMatch(track, results);
      if (bestMatch) {
        // Пробуем найти этот трек на SoundCloud
        const scResult = await this.trySoundCloudFallback(bestMatch);
        if (scResult.streamUrl) {
          return scResult;
        }
      }

      return { streamUrl: null, source: "youtube" };
    } catch (error) {
      console.error(`[Fallback] YouTube fallback error:`, error);
      return { streamUrl: null, source: "youtube" };
    }
  }

  /**
   * Найти наиболее похожий трек
   */
  private findBestMatch(original: Track, candidates: Track[]): Track | null {
    if (candidates.length === 0) return null;

    const originalTitle = this.normalizeString(original.title);
    const originalArtist = this.normalizeString(original.artist);

    let bestMatch: Track | null = null;
    let bestScore = 0;

    for (const candidate of candidates) {
      const candidateTitle = this.normalizeString(candidate.title);
      const candidateArtist = this.normalizeString(candidate.artist);

      // Считаем score на основе совпадения
      let score = 0;

      // Совпадение названия
      if (candidateTitle.includes(originalTitle) || originalTitle.includes(candidateTitle)) {
        score += 50;
      } else {
        const titleSimilarity = this.calculateSimilarity(originalTitle, candidateTitle);
        score += titleSimilarity * 50;
      }

      // Совпадение артиста
      if (candidateArtist.includes(originalArtist) || originalArtist.includes(candidateArtist)) {
        score += 30;
      } else {
        const artistSimilarity = this.calculateSimilarity(originalArtist, candidateArtist);
        score += artistSimilarity * 30;
      }

      // Похожая длительность (±10 секунд)
      const durationDiff = Math.abs(original.duration - candidate.duration);
      if (durationDiff < 10) {
        score += 20;
      } else if (durationDiff < 30) {
        score += 10;
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatch = candidate;
      }
    }

    // Минимальный порог совпадения
    if (bestScore < 30) {
      console.log(`[Fallback] No good match found (best score: ${bestScore})`);
      return null;
    }

    console.log(`[Fallback] Best match: ${bestMatch?.title} (score: ${bestScore})`);
    return bestMatch;
  }

  /**
   * Нормализовать строку для сравнения
   */
  private normalizeString(str: string): string {
    return str
      .toLowerCase()
      .replace(/[\(\)\[\]\-\_\.\,\!\?\'\"\`]/g, " ")
      .replace(/\s+/g, " ")
      .replace(/(official|video|audio|lyrics|hd|4k|music video|remix|edit|extended|radio)/gi, "")
      .trim();
  }

  /**
   * Простой расчёт похожести строк (Jaccard similarity)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const words1 = new Set(str1.split(" ").filter(w => w.length > 2));
    const words2 = new Set(str2.split(" ").filter(w => w.length > 2));

    if (words1.size === 0 || words2.size === 0) return 0;

    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  /**
   * Проверить валидность stream URL
   */
  private async validateStreamUrl(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { 
        method: "HEAD",
        signal: AbortSignal.timeout(5000)
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const streamFallbackService = new StreamFallbackService();
