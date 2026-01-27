// Spotify Service for search and recommendations
import type { Track } from "../types";
import { proxyService } from './ProxyService';

// Support both storage keys for backwards compatibility
const STORAGE_KEY = 'harmonix-spotify-credentials';
const STORAGE_KEY_ALT = 'harmonix-srv-spotify';

interface SpotifyCredentials {
  clientId: string;
  clientSecret: string;
}

interface SpotifyToken {
  access_token: string;
  expires_at: number;
}

class SpotifyServiceClass {
  private token: SpotifyToken | null = null;
  private credentials: SpotifyCredentials | null = null;

  constructor() {
    this.loadCredentials();
  }

  private loadCredentials(): void {
    try {
      // Try primary key first
      let saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        this.credentials = JSON.parse(saved);
        console.log('[Spotify] Loaded credentials from primary key');
        return;
      }
      
      // Try alternative key (from ServicePages)
      saved = localStorage.getItem(STORAGE_KEY_ALT);
      if (saved) {
        this.credentials = JSON.parse(saved);
        console.log('[Spotify] Loaded credentials from ServicePages key');
        return;
      }
    } catch (e) {
      console.log('[Spotify] No credentials found');
    }
  }

  isConnected(): boolean {
    return !!(this.credentials?.clientId && this.credentials?.clientSecret);
  }

  // Verify credentials by attempting to get an access token
  async verifyToken(clientId?: string, clientSecret?: string): Promise<boolean> {
    const testId = clientId || this.credentials?.clientId;
    const testSecret = clientSecret || this.credentials?.clientSecret;
    
    if (!testId || !testSecret) return false;

    try {
      const response = await proxyService.proxyFetch('spotify', 'https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `grant_type=client_credentials&client_id=${testId}&client_secret=${testSecret}`,
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private async getAccessToken(): Promise<string | null> {
    if (!this.credentials) {
      this.loadCredentials();
      if (!this.credentials) return null;
    }

    // Check if token is still valid
    if (this.token && this.token.expires_at > Date.now()) {
      return this.token.access_token;
    }

    try {
      const response = await proxyService.proxyFetch('spotify', 'https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `grant_type=client_credentials&client_id=${this.credentials.clientId}&client_secret=${this.credentials.clientSecret}`,
      });

      if (!response.ok) {
        console.error('[Spotify] Failed to get token:', response.status);
        return null;
      }

      const data = await response.json();
      this.token = {
        access_token: data.access_token,
        expires_at: Date.now() + (data.expires_in - 60) * 1000, // Refresh 1 min early
      };

      return this.token.access_token;
    } catch (e) {
      console.error('[Spotify] Token error:', e);
      return null;
    }
  }

  async search(query: string, limit: number = 20): Promise<Track[]> {
    const token = await this.getAccessToken();
    if (!token) {
      console.log('[Spotify] No token available');
      return [];
    }

    try {
      const response = await proxyService.proxyFetch('spotify',
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        console.error('[Spotify] Search failed:', response.status);
        return [];
      }

      const data = await response.json();
      
      return data.tracks.items.map((item: any) => ({
        id: `spotify-${item.id}`,
        title: item.name,
        artist: item.artists.map((a: any) => a.name).join(', '),
        duration: Math.floor(item.duration_ms / 1000),
        artworkUrl: item.album.images[0]?.url || '',
        platform: 'spotify' as const,
        // Spotify doesn't provide direct stream URLs with client credentials
        // We'll need to search on SoundCloud/YouTube to play
        streamUrl: '',
        spotifyUri: item.uri,
        previewUrl: item.preview_url, // 30 second preview
      }));
    } catch (e) {
      console.error('[Spotify] Search error:', e);
      return [];
    }
  }

  // Get stream URL by searching on SoundCloud (since Spotify doesn't allow direct streaming)
  async getPlayableTrack(track: Track): Promise<Track | null> {
    // Import dynamically to avoid circular dependency
    const { soundCloudService } = await import('./SoundCloudService');
    
    try {
      const searchQuery = `${track.artist} ${track.title}`;
      const results = await soundCloudService.search(searchQuery, 5);
      
      if (results.tracks.length > 0) {
        const scTrack = results.tracks[0];
        const streamUrl = await soundCloudService.getStreamUrl(scTrack.id.replace('sc-', ''));
        
        if (streamUrl) {
          return {
            ...track,
            streamUrl,
            // Keep original Spotify metadata but use SoundCloud stream
          };
        }
      }
    } catch (e) {
      console.error('[Spotify] Failed to get playable track:', e);
    }
    
    return null;
  }

  clearCredentials(): void {
    this.credentials = null;
    this.token = null;
    localStorage.removeItem(STORAGE_KEY);
  }
}

export const spotifyService = new SpotifyServiceClass();
