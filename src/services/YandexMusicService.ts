/**
 * Yandex Music Service
 * Поиск и воспроизведение музыки через Yandex Music API
 */

import type { Track } from '../types';
import { proxyService } from './ProxyService';

const STORAGE_KEY = 'harmonix-srv-yandex';

interface YandexTrack {
  id: string;
  title: string;
  artists: Array<{ name: string }>;
  albums?: Array<{
    id: string;
    title: string;
    coverUri?: string;
  }>;
  durationMs: number;
  available?: boolean;
}

interface YandexSearchResponse {
  result: {
    tracks?: {
      results: YandexTrack[];
    };
  };
}

class YandexMusicService {
  // Service identification
  readonly serviceId = 'yandex';
  readonly serviceName = 'Yandex Music';
  readonly serviceIcon = '🎵';
  readonly serviceColor = '#FFCC00';

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
    console.log('[Yandex Music] Service initialized, token:', this._accessToken ? 'present' : 'missing');
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
      const response = await proxyService.proxyFetch('yandex', 'https://api.music.yandex.net/account/status', {
        method: 'GET',
        headers: {
          'Authorization': `OAuth ${testToken}`,
        },
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) return false;

      const data = await response.json();
      
      // Check if we got valid account data
      if (data.result && data.result.account) {
        console.log('[Yandex Music] Token verified successfully');
        return true;
      }

      return false;
    } catch (error) {
      console.error('[Yandex Music] Token verification error:', error);
      return false;
    }
  }

  async search(query: string, limit: number = 20): Promise<Track[]> {
    if (!this._enabled || !this._accessToken) {
      return [];
    }

    try {
      const params = new URLSearchParams({
        text: query,
        type: 'track',
        page: '0',
        'page-size': limit.toString(),
      });

      const response = await proxyService.proxyFetch('yandex', `https://api.music.yandex.net/search?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `OAuth ${this._accessToken}`,
        },
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data: YandexSearchResponse = await response.json();
      
      if (!data.result?.tracks?.results) {
        return [];
      }

      const tracks = data.result.tracks.results
        .filter(item => item.available !== false)
        .map(item => this.mapToTrack(item));

      console.log(`[Yandex Music] Found ${tracks.length} tracks`);
      return tracks;
    } catch (error) {
      console.error('[Yandex Music] Search error:', error);
      return [];
    }
  }

  private mapToTrack(track: YandexTrack): Track {
    const artist = track.artists.map(a => a.name).join(', ');
    const album = track.albums?.[0];
    const artworkUrl = album?.coverUri 
      ? `https://${album.coverUri.replace('%%', '400x400')}`
      : '';

    return {
      id: `yandex-${track.id}`,
      title: track.title,
      artist: artist,
      duration: Math.floor(track.durationMs / 1000),
      artworkUrl: artworkUrl,
      streamUrl: '', // Will be fetched when playing
      platform: 'yandex',
      url: `https://music.yandex.ru/album/${album?.id}/track/${track.id}`,
      metadata: {},
    };
  }

  async getStreamUrl(trackId: string): Promise<string | null> {
    if (!this._accessToken) return null;

    try {
      // Remove 'yandex-' prefix
      const cleanId = trackId.replace('yandex-', '');
      
      // Get download info
      const response = await proxyService.proxyFetch('yandex', `https://api.music.yandex.net/tracks/${cleanId}/download-info`, {
        method: 'GET',
        headers: {
          'Authorization': `OAuth ${this._accessToken}`,
        },
      });

      if (!response.ok) return null;

      const data = await response.json();
      
      if (!data.result || data.result.length === 0) return null;

      // Get highest quality stream (prefer mp3 320kbps)
      const streams = data.result.sort((a: any, b: any) => {
        const bitrateA = parseInt(a.bitrateInKbps) || 0;
        const bitrateB = parseInt(b.bitrateInKbps) || 0;
        return bitrateB - bitrateA;
      });

      const stream = streams[0];
      
      // Get direct download link
      const xmlResponse = await proxyService.proxyFetch('yandex', stream.downloadInfoUrl);
      const xmlText = await xmlResponse.text();
      
      // Parse XML to get host, path, ts, s
      const hostMatch = xmlText.match(/<host>(.*?)<\/host>/);
      const pathMatch = xmlText.match(/<path>(.*?)<\/path>/);
      const tsMatch = xmlText.match(/<ts>(.*?)<\/ts>/);
      const sMatch = xmlText.match(/<s>(.*?)<\/s>/);
      
      if (!hostMatch || !pathMatch || !tsMatch || !sMatch) return null;

      const host = hostMatch[1];
      const path = pathMatch[1];
      const ts = tsMatch[1];
      const s = sMatch[1];

      // Build direct URL
      const sign = await this.generateSign(`XGRlBW9FXlekgbPrRHuSiA${path.substring(1)}${s}`);
      const directUrl = `https://${host}/get-mp3/${sign}/${ts}${path}`;

      console.log('[Yandex Music] Got stream URL for:', trackId);
      return directUrl;
    } catch (error) {
      console.error('[Yandex Music] getStreamUrl error:', error);
      return null;
    }
  }

  private async generateSign(data: string): Promise<string> {
    // MD5 hash for Yandex Music signature
    // Using simple MD5 implementation since crypto.subtle doesn't support MD5
    const md5 = (str: string): string => {
      const rotateLeft = (n: number, s: number) => (n << s) | (n >>> (32 - s));
      const addUnsigned = (x: number, y: number) => {
        const lsw = (x & 0xFFFF) + (y & 0xFFFF);
        const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
        return (msw << 16) | (lsw & 0xFFFF);
      };
      
      const utf8Encode = (s: string) => unescape(encodeURIComponent(s));
      const str2binl = (s: string): number[] => {
        const bin: number[] = [];
        const mask = (1 << 8) - 1;
        for (let i = 0; i < s.length * 8; i += 8) {
          bin[i >> 5] |= (s.charCodeAt(i / 8) & mask) << (i % 32);
        }
        return bin;
      };
      
      const binl2hex = (binarray: number[]) => {
        const hexTab = '0123456789abcdef';
        let str = '';
        for (let i = 0; i < binarray.length * 4; i++) {
          str += hexTab.charAt((binarray[i >> 2] >> ((i % 4) * 8 + 4)) & 0xF) +
                 hexTab.charAt((binarray[i >> 2] >> ((i % 4) * 8)) & 0xF);
        }
        return str;
      };
      
      const md5cycle = (x: number[], k: number[]) => {
        let a = x[0], b = x[1], c = x[2], d = x[3];
        
        a = ff(a, b, c, d, k[0], 7, -680876936);
        d = ff(d, a, b, c, k[1], 12, -389564586);
        c = ff(c, d, a, b, k[2], 17, 606105819);
        b = ff(b, c, d, a, k[3], 22, -1044525330);
        a = ff(a, b, c, d, k[4], 7, -176418897);
        d = ff(d, a, b, c, k[5], 12, 1200080426);
        c = ff(c, d, a, b, k[6], 17, -1473231341);
        b = ff(b, c, d, a, k[7], 22, -45705983);
        a = ff(a, b, c, d, k[8], 7, 1770035416);
        d = ff(d, a, b, c, k[9], 12, -1958414417);
        c = ff(c, d, a, b, k[10], 17, -42063);
        b = ff(b, c, d, a, k[11], 22, -1990404162);
        a = ff(a, b, c, d, k[12], 7, 1804603682);
        d = ff(d, a, b, c, k[13], 12, -40341101);
        c = ff(c, d, a, b, k[14], 17, -1502002290);
        b = ff(b, c, d, a, k[15], 22, 1236535329);
        
        a = gg(a, b, c, d, k[1], 5, -165796510);
        d = gg(d, a, b, c, k[6], 9, -1069501632);
        c = gg(c, d, a, b, k[11], 14, 643717713);
        b = gg(b, c, d, a, k[0], 20, -373897302);
        a = gg(a, b, c, d, k[5], 5, -701558691);
        d = gg(d, a, b, c, k[10], 9, 38016083);
        c = gg(c, d, a, b, k[15], 14, -660478335);
        b = gg(b, c, d, a, k[4], 20, -405537848);
        a = gg(a, b, c, d, k[9], 5, 568446438);
        d = gg(d, a, b, c, k[14], 9, -1019803690);
        c = gg(c, d, a, b, k[3], 14, -187363961);
        b = gg(b, c, d, a, k[8], 20, 1163531501);
        a = gg(a, b, c, d, k[13], 5, -1444681467);
        d = gg(d, a, b, c, k[2], 9, -51403784);
        c = gg(c, d, a, b, k[7], 14, 1735328473);
        b = gg(b, c, d, a, k[12], 20, -1926607734);
        
        a = hh(a, b, c, d, k[5], 4, -378558);
        d = hh(d, a, b, c, k[8], 11, -2022574463);
        c = hh(c, d, a, b, k[11], 16, 1839030562);
        b = hh(b, c, d, a, k[14], 23, -35309556);
        a = hh(a, b, c, d, k[1], 4, -1530992060);
        d = hh(d, a, b, c, k[4], 11, 1272893353);
        c = hh(c, d, a, b, k[7], 16, -155497632);
        b = hh(b, c, d, a, k[10], 23, -1094730640);
        a = hh(a, b, c, d, k[13], 4, 681279174);
        d = hh(d, a, b, c, k[0], 11, -358537222);
        c = hh(c, d, a, b, k[3], 16, -722521979);
        b = hh(b, c, d, a, k[6], 23, 76029189);
        a = hh(a, b, c, d, k[9], 4, -640364487);
        d = hh(d, a, b, c, k[12], 11, -421815835);
        c = hh(c, d, a, b, k[15], 16, 530742520);
        b = hh(b, c, d, a, k[2], 23, -995338651);
        
        a = ii(a, b, c, d, k[0], 6, -198630844);
        d = ii(d, a, b, c, k[7], 10, 1126891415);
        c = ii(c, d, a, b, k[14], 15, -1416354905);
        b = ii(b, c, d, a, k[5], 21, -57434055);
        a = ii(a, b, c, d, k[12], 6, 1700485571);
        d = ii(d, a, b, c, k[3], 10, -1894986606);
        c = ii(c, d, a, b, k[10], 15, -1051523);
        b = ii(b, c, d, a, k[1], 21, -2054922799);
        a = ii(a, b, c, d, k[8], 6, 1873313359);
        d = ii(d, a, b, c, k[15], 10, -30611744);
        c = ii(c, d, a, b, k[6], 15, -1560198380);
        b = ii(b, c, d, a, k[13], 21, 1309151649);
        a = ii(a, b, c, d, k[4], 6, -145523070);
        d = ii(d, a, b, c, k[11], 10, -1120210379);
        c = ii(c, d, a, b, k[2], 15, 718787259);
        b = ii(b, c, d, a, k[9], 21, -343485551);
        
        x[0] = addUnsigned(a, x[0]);
        x[1] = addUnsigned(b, x[1]);
        x[2] = addUnsigned(c, x[2]);
        x[3] = addUnsigned(d, x[3]);
      };
      
      const cmn = (q: number, a: number, b: number, x: number, s: number, t: number) => {
        a = addUnsigned(addUnsigned(a, q), addUnsigned(x, t));
        return addUnsigned(rotateLeft(a, s), b);
      };
      
      const ff = (a: number, b: number, c: number, d: number, x: number, s: number, t: number) => {
        return cmn((b & c) | ((~b) & d), a, b, x, s, t);
      };
      
      const gg = (a: number, b: number, c: number, d: number, x: number, s: number, t: number) => {
        return cmn((b & d) | (c & (~d)), a, b, x, s, t);
      };
      
      const hh = (a: number, b: number, c: number, d: number, x: number, s: number, t: number) => {
        return cmn(b ^ c ^ d, a, b, x, s, t);
      };
      
      const ii = (a: number, b: number, c: number, d: number, x: number, s: number, t: number) => {
        return cmn(c ^ (b | (~d)), a, b, x, s, t);
      };
      
      const s = utf8Encode(str);
      const x = str2binl(s);
      const len = s.length * 8;
      
      x[len >> 5] |= 0x80 << (len % 32);
      x[(((len + 64) >>> 9) << 4) + 14] = len;
      
      const state = [1732584193, -271733879, -1732584194, 271733878];
      
      for (let i = 0; i < x.length; i += 16) {
        md5cycle(state, x.slice(i, i + 16));
      }
      
      return binl2hex(state);
    };
    
    return md5(data);
  }

  async getTrackInfo(trackId: string): Promise<Track | null> {
    if (!this._accessToken) return null;

    try {
      const cleanId = trackId.replace('yandex-', '');
      
      const response = await proxyService.proxyFetch('yandex', `https://api.music.yandex.net/tracks/${cleanId}`, {
        method: 'GET',
        headers: {
          'Authorization': `OAuth ${this._accessToken}`,
        },
      });

      if (!response.ok) return null;

      const data = await response.json();

      if (data.result?.[0]) {
        return this.mapToTrack(data.result[0]);
      }
      return null;
    } catch (error) {
      console.error('[Yandex Music] getTrackInfo error:', error);
      return null;
    }
  }

  // Get popular tracks
  async getTrending(limit: number = 20): Promise<Track[]> {
    if (!this._enabled || !this._accessToken) return [];

    try {
      const response = await proxyService.proxyFetch('yandex', 'https://api.music.yandex.net/feed', {
        method: 'GET',
        headers: {
          'Authorization': `OAuth ${this._accessToken}`,
        },
      });

      if (!response.ok) return [];

      const data = await response.json();
      
      // Extract tracks from feed
      const tracks: Track[] = [];
      if (data.result?.generatedPlaylists) {
        for (const playlist of data.result.generatedPlaylists.slice(0, 3)) {
          if (playlist.data?.tracks) {
            for (const item of playlist.data.tracks.slice(0, limit / 3)) {
              if (item.track) {
                tracks.push(this.mapToTrack(item.track));
              }
            }
          }
        }
      }

      return tracks.slice(0, limit);
    } catch (error) {
      console.error('[Yandex Music] getTrending error:', error);
      return [];
    }
  }
}

export const yandexMusicService = new YandexMusicService();
