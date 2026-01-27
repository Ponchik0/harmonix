/**
 * VK Music Service
 * Поиск музыки через VK API
 */

import type { Track } from '../types';
import { proxyService } from './ProxyService';

const STORAGE_KEY = 'harmonix-srv-vk';

interface VKAudio {
  id: number;
  owner_id: number;
  artist: string;
  title: string;
  duration: number;
  url: string;
  date: number;
  album?: {
    thumb?: {
      photo_300?: string;
      photo_600?: string;
    };
  };
}

interface VKResponse<T> {
  response: {
    count: number;
    items: T[];
  };
}

class VKMusicService {
  // Service identification
  readonly serviceId = 'vk';
  readonly serviceName = 'VK Music';
  readonly serviceIcon = '🎶';
  readonly serviceColor = '#0077ff';

  private _accessToken: string | null = null;
  private _enabled: boolean = false;

  constructor() {
    this.loadSettings();
  }

  private loadSettings(): void {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const settings = JSON.parse(saved);
        // Support both 'accessToken' and 'token' fields (ServicePages uses 'token')
        this._accessToken = settings.accessToken || settings.token || null;
        this._enabled = settings.enabled ?? (!!this._accessToken);
      }
    } catch {
      this._accessToken = null;
      this._enabled = false;
    }
  }

  private saveSettings(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      accessToken: this._accessToken,
      enabled: this._enabled,
    }));
  }

  async init(): Promise<void> {
    this.loadSettings();
    console.log('[VK Music] Service initialized, token:', this._accessToken ? 'present' : 'missing');
  }

  isEnabled(): boolean {
    return this._enabled && !!this._accessToken;
  }

  setEnabled(enabled: boolean): void {
    this._enabled = enabled;
    this.saveSettings();
  }

  isAuthenticated(): boolean {
    return !!this._accessToken;
  }

  getStatus(): { connected: boolean; authenticated: boolean; error?: string } {
    return {
      connected: !!this._accessToken,
      authenticated: !!this._accessToken,
      error: this._accessToken ? undefined : 'Access token not configured',
    };
  }

  setAccessToken(token: string): void {
    this._accessToken = token;
    this.saveSettings();
  }

  // Verify token by making a test API call
  async verifyToken(token?: string): Promise<boolean> {
    const testToken = token || this._accessToken;
    if (!testToken) return false;

    try {
      const params = new URLSearchParams({
        access_token: testToken,
        v: '5.131',
      });

      const response = await proxyService.proxyFetch('vk', `https://api.vk.com/method/users.get?${params}`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) return false;

      const data = await response.json();
      
      // Check for VK API errors
      if (data.error) {
        console.log('[VK Music] Token verification failed:', data.error.error_msg);
        return false;
      }

      // Check if we got valid user data
      if (data.response && data.response.length > 0) {
        console.log('[VK Music] Token verified successfully');
        return true;
      }

      return false;
    } catch (error) {
      console.error('[VK Music] Token verification error:', error);
      return false;
    }
  }

  async search(query: string, limit: number = 20, offset: number = 0): Promise<Track[]> {
    if (!this._enabled || !this._accessToken) {
      return [];
    }

    try {
      const params = new URLSearchParams({
        q: query,
        count: limit.toString(),
        offset: offset.toString(),
        access_token: this._accessToken,
        v: '5.131',
      });

      const response = await proxyService.proxyFetch('vk', `https://api.vk.com/method/audio.search?${params}`, {
        method: 'GET',
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data: VKResponse<VKAudio> = await response.json();
      
      if (!data.response?.items) {
        return [];
      }

      const tracks = data.response.items
        .filter(item => item.url) // Only tracks with valid URLs
        .map(item => this.mapToTrack(item));

      console.log(`[VK Music] Found ${tracks.length} tracks`);
      return tracks;
    } catch (error) {
      console.error('[VK Music] Search error:', error);
      return [];
    }
  }

  private mapToTrack(audio: VKAudio): Track {
    return {
      id: `vk-${audio.owner_id}_${audio.id}`,
      title: audio.title,
      artist: audio.artist,
      duration: audio.duration,
      artworkUrl: audio.album?.thumb?.photo_600 || audio.album?.thumb?.photo_300 || '',
      streamUrl: audio.url,
      platform: 'vk',
      url: `https://vk.com/audio${audio.owner_id}_${audio.id}`,
      metadata: {
        releaseDate: new Date(audio.date * 1000).toISOString(),
      },
    };
  }

  async getStreamUrl(trackId: string): Promise<string | null> {
    // VK provides stream URL directly in search results
    console.log('[VK Music] getStreamUrl called for:', trackId);
    return null;
  }

  async getTrackInfo(trackId: string): Promise<Track | null> {
    if (!this._accessToken) return null;

    try {
      // Parse track ID (format: vk-ownerid_audioid)
      const cleanId = trackId.replace('vk-', '');
      
      const params = new URLSearchParams({
        audios: cleanId,
        access_token: this._accessToken,
        v: '5.131',
      });

      const response = await proxyService.proxyFetch('vk', `https://api.vk.com/method/audio.getById?${params}`);
      const data = await response.json();

      if (data.response?.[0]) {
        return this.mapToTrack(data.response[0]);
      }
      return null;
    } catch (error) {
      console.error('[VK Music] getTrackInfo error:', error);
      return null;
    }
  }

  // Get popular tracks
  async getTrending(limit: number = 20): Promise<Track[]> {
    if (!this._enabled || !this._accessToken) return [];

    try {
      const params = new URLSearchParams({
        count: limit.toString(),
        access_token: this._accessToken,
        v: '5.131',
      });

      const response = await proxyService.proxyFetch('vk', `https://api.vk.com/method/audio.getPopular?${params}`);
      const data: VKResponse<VKAudio> = await response.json();

      if (!data.response?.items) return [];

      return data.response.items
        .filter(item => item.url)
        .map(item => this.mapToTrack(item));
    } catch (error) {
      console.error('[VK Music] getTrending error:', error);
      return [];
    }
  }
}

export const vkMusicService = new VKMusicService();
