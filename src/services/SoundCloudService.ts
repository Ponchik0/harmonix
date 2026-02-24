import { storageService } from "./StorageService";
import { proxyService } from "./ProxyService";
import type {
  Track,
  SoundCloudSearchResult,
  SoundCloudPlaylist,
  SoundCloudUser,
} from "../types";

const SOUNDCLOUD_API_V2 = "https://api-v2.soundcloud.com";
const STORAGE_KEY = "harmonix-srv-soundcloud";

interface SoundCloudTrack {
  id: number;
  title: string;
  user: { username: string; avatar_url?: string };
  artwork_url?: string;
  duration: number;
  stream_url?: string;
  media?: {
    transcodings: Array<{
      url: string;
      format: { protocol: string; mime_type: string };
    }>;
  };
  genre?: string;
  created_at?: string;
  playback_count?: number;
  likes_count?: number;
  waveform_url?: string;
  permalink_url?: string;
}

interface SoundCloudCollection<T> {
  collection: T[];
  next_href?: string;
}

interface SoundCloudSettings {
  activeToken: "id1" | "custom" | "none";
  customToken: string;
  token: string;
  enabled: boolean;
}

class SoundCloudService {
  // Service identification (for registry)
  readonly serviceId = "soundcloud";
  readonly serviceName = "SoundCloud";
  readonly serviceIcon = "🎵";
  readonly serviceColor = "#ff5500";

  private _clientId: string | null = null;
  private _enabled: boolean = true;

  // Fallback tokens (public, may expire - updated Feb 2026)
  // These are extracted from SoundCloud's web app and may need periodic updates
  private fallbackTokens = [
    "EnTrn2ZjaZXfOU7iRsFicZvTOi1Pl3rK", // Token 1 (Primary - Default, extracted Feb 2026)
  ];
  private fallbackIndex = 0; // Начинаем с токена 1
  private tokenFetchAttempted = false;
  private lastTokenTest = 0; // Timestamp of last token test
  
  // Rate limiting with priority
  private highPriorityQueue: Array<() => Promise<any>> = [];
  private lowPriorityQueue: Array<() => Promise<any>> = [];
  private isProcessingQueue = false;
  private lastRequestTime = 0;
  private minRequestInterval = 300; // Minimum 300ms between requests

  constructor() {
    // Устанавливаем токен 1 по умолчанию при первом запуске
    this.initializeDefaultToken();
    
    // Слушаем событие обновления токена из настроек
    window.addEventListener("soundcloud-token-updated", () => {
      this.refreshToken();
      console.log("[SoundCloud] Token updated from settings");
    });
  }

  // Инициализация токена 1 по умолчанию
  private initializeDefaultToken(): void {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        // Первый запуск - устанавливаем токен 1
        const defaultSettings: SoundCloudSettings = {
          activeToken: "id1",
          customToken: "",
          token: this.fallbackTokens[0], // Токен 1
          enabled: true,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultSettings));
        this._clientId = this.fallbackTokens[0];
        this._enabled = true;
        console.log("[SoundCloud] Initialized with Token 1 (default)");
      }
    } catch (e) {
      console.error("[SoundCloud] Error initializing default token:", e);
    }
  }

  // Получаем токен из localStorage
  get clientId(): string | null {
    // Сначала проверяем кэшированный
    if (this._clientId) return this._clientId;

    // Пробуем получить из localStorage
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const settings: SoundCloudSettings = JSON.parse(saved);
        if (settings.token) {
          this._clientId = settings.token;
          return this._clientId;
        }
        // Load enabled state
        if (settings.enabled !== undefined) {
          this._enabled = settings.enabled;
        }
      }
      // Также проверяем старый ключ
      const oldToken = localStorage.getItem("soundcloud_client_id");
      if (oldToken) {
        this._clientId = oldToken;
        return this._clientId;
      }
    } catch (e) {
      console.error("[SoundCloud] Error reading token from storage:", e);
    }

    // Use fallback token if no user token
    if (this.fallbackTokens.length > 0) {
      this._clientId = this.fallbackTokens[this.fallbackIndex];
      console.log("[SoundCloud] Using fallback token");
      return this._clientId;
    }

    return null;
  }

  // Try next fallback token
  private tryNextToken(): boolean {
    this.fallbackIndex = (this.fallbackIndex + 1) % this.fallbackTokens.length;
    this._clientId = this.fallbackTokens[this.fallbackIndex];
    console.log("[SoundCloud] Switching to fallback token", this.fallbackIndex);
    return true;
  }

  // Fetch fresh client_id from SoundCloud website
  async fetchFreshClientId(): Promise<string | null> {
    if (this.tokenFetchAttempted) return null;
    this.tokenFetchAttempted = true;

    try {
      console.log("[SoundCloud] Attempting to fetch fresh client_id...");
      
      // Fetch SoundCloud homepage
      const response = await fetch("https://soundcloud.com", {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
      });
      
      if (!response.ok) return null;
      
      const html = await response.text();
      
      // Find script URLs
      const scriptMatches = html.match(/https:\/\/a-v2\.sndcdn\.com\/assets\/[^"]+\.js/g);
      if (!scriptMatches) return null;

      // Check ALL scripts for client_id (not just first 5)
      for (const scriptUrl of scriptMatches) {
        try {
          const scriptResponse = await fetch(scriptUrl);
          const scriptContent = await scriptResponse.text();
          
          // Look for client_id pattern - multiple regex variants for resilience
          const clientIdMatch = 
            scriptContent.match(/client_id[=:]\s*["']([a-zA-Z0-9]{20,40})["']/) ||
            scriptContent.match(/clientId[=:]\s*["']([a-zA-Z0-9]{20,40})["']/);
          if (clientIdMatch) {
            const newClientId = clientIdMatch[1];
            console.log("[SoundCloud] Found fresh client_id:", newClientId.substring(0, 8) + "...");
            
            // Add to beginning of fallback tokens
            if (!this.fallbackTokens.includes(newClientId)) {
              this.fallbackTokens.unshift(newClientId);
            }
            
            this._clientId = newClientId;
            this.fallbackIndex = 0;
            return newClientId;
          }
        } catch {
          continue;
        }
      }
    } catch (error) {
      console.error("[SoundCloud] Error fetching fresh client_id:", error);
    }
    
    return null;
  }

  // Проверка есть ли токен
  hasToken(): boolean {
    return !!this.clientId;
  }

  // Verify token by making a test API call
  async verifyToken(token?: string): Promise<boolean> {
    const testToken = token || this.clientId;
    if (!testToken) return false;

    // Don't test too frequently
    const now = Date.now();
    if (now - this.lastTokenTest < 30000) { // 30 seconds cooldown
      return true; // Assume it's still valid
    }

    try {
      const response = await fetch(
        `${SOUNDCLOUD_API_V2}/search/tracks?q=test&limit=1&client_id=${testToken}`,
        { signal: AbortSignal.timeout(5000) }
      );
      const isValid = response.ok;
      if (isValid) {
        this.lastTokenTest = now;
      }
      return isValid;
    } catch {
      return false;
    }
  }

  // Обновить токен (вызывается когда пользователь сохраняет новый)
  refreshToken(): void {
    this._clientId = null; // Сбросить кэш, чтобы перечитать из localStorage
    console.log(
      "[SoundCloud] Token refreshed:",
      this.clientId ? "found" : "not found"
    );
  }

  async init(): Promise<void> {
    this.refreshToken();
    console.log(
      "[SoundCloud] Service initialized, token:",
      this.clientId ? "present" : "missing"
    );
  }

  // Reset token state (useful for debugging)
  resetTokenState(): void {
    this._clientId = null;
    this.fallbackIndex = 0;
    this.tokenFetchAttempted = false;
    console.log("[SoundCloud] Token state reset");
  }

  // Rate limiting queue processor
  private async processRequestQueue() {
    if (this.isProcessingQueue) return;
    this.isProcessingQueue = true;

    while (this.highPriorityQueue.length > 0 || this.lowPriorityQueue.length > 0) {
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      
      if (timeSinceLastRequest < this.minRequestInterval) {
        await new Promise(resolve => setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest));
      }

      // Process high priority first
      const request = this.highPriorityQueue.shift() || this.lowPriorityQueue.shift();
      if (request) {
        this.lastRequestTime = Date.now();
        try {
          await request();
        } catch (error) {
          console.error("[SoundCloud] Request from queue failed:", error);
        }
      }
    }

    this.isProcessingQueue = false;
  }

  // Add request to queue with priority
  private queueRequest<T>(request: () => Promise<T>, highPriority = false): Promise<T> {
    return new Promise((resolve, reject) => {
      const wrappedRequest = async () => {
        try {
          const result = await request();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };
      
      if (highPriority) {
        this.highPriorityQueue.push(wrappedRequest);
      } else {
        this.lowPriorityQueue.push(wrappedRequest);
      }
      
      this.processRequestQueue();
    });
  }

  // Service methods
  isEnabled(): boolean {
    return this._enabled && this.hasToken();
  }

  setEnabled(enabled: boolean): void {
    this._enabled = enabled;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const settings = saved ? JSON.parse(saved) : {};
      settings.enabled = enabled;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {}
  }

  getStatus(): { connected: boolean; authenticated: boolean; error?: string } {
    return {
      connected: this.hasToken(),
      authenticated: this.hasToken(),
      error: this.hasToken() ? undefined : "Token not configured",
    };
  }

  isAuthenticated(): boolean {
    return this.hasToken();
  }

  private async fetchWithRetry(url: string, retries = 4, highPriority = false): Promise<Response> {
    // Use queue for rate limiting
    return this.queueRequest(async () => {
      let token = this.clientId;

      if (!token) {
        throw new Error(
          "SoundCloud token not configured. Please add a token in Settings → Services → SoundCloud"
        );
      }

      for (let i = 0; i < retries; i++) {
        try {
          const separator = url.includes("?") ? "&" : "?";
          const fullUrl = `${url}${separator}client_id=${token}`;

          console.log(`[SoundCloud] Fetching (${i + 1}/${retries}): ${fullUrl.substring(0, 100)}...`);

          // Use proxy service if enabled
          const response = await proxyService.proxyFetch("soundcloud", fullUrl, {
            method: "GET",
            headers: {
              Accept: "application/json",
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            },
          });

          console.log(`[SoundCloud] Response: ${response.status} ${response.statusText}`);

          if (response.ok) {
            return response;
          }

          if (response.status === 401 || response.status === 403) {
            console.warn(`[SoundCloud] Token invalid (${response.status}), trying next fallback...`);
            
            // On last retry, try to fetch fresh token
            if (i === retries - 2 && !this.tokenFetchAttempted) {
              console.log("[SoundCloud] Attempting to fetch fresh token...");
              const freshToken = await this.fetchFreshClientId();
              if (freshToken) {
                token = freshToken;
                continue;
              }
            }
            
            this.tryNextToken();
            token = this.clientId;
            continue; // Retry with new token
          }

          if (response.status === 404) {
            console.error("[SoundCloud] Resource not found (404)");
            throw new Error(`Resource not found: ${response.status}`);
          }

          if (response.status === 429) {
            console.warn(`[SoundCloud] Rate limited (429), waiting before retry...`);
            // Wait for rate limiting - shorter delay for high priority requests
            const delay = highPriority ? 2000 * (i + 1) : 5000 * (i + 1);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }

          if (response.status >= 500) {
            console.warn(`[SoundCloud] Server error (${response.status}), retrying...`);
            // Don't change token for server errors, just retry
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
            continue;
          }

          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        } catch (error) {
          console.error(`[SoundCloud] Fetch error (attempt ${i + 1}):`, error);
          if (i === retries - 1) throw error;
          
          // For network errors, try next token
          if (
            (error instanceof TypeError) ||
            (error instanceof Error && error.message.includes('fetch'))
          ) {
            this.tryNextToken();
            token = this.clientId;
          }
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)));
        }
      }
      throw new Error("All retries failed");
    }, highPriority);
  }

  async search(
    query: string,
    limit: number = 20
  ): Promise<SoundCloudSearchResult> {
    if (!this.hasToken()) {
      console.warn("[SoundCloud] No token configured, search disabled");
      return { tracks: [], playlists: [], users: [] };
    }

    console.log(`[SoundCloud] Searching for: "${query}"`);

    try {
      const params = new URLSearchParams({
        q: query,
        limit: limit.toString(),
      });

      // Search tracks
      console.log(`[SoundCloud] Fetching tracks...`);
      const tracksResponse = await this.fetchWithRetry(
        `${SOUNDCLOUD_API_V2}/search/tracks?${params}`,
        4,
        false // Low priority for search
      );
      
      let tracksData: SoundCloudCollection<SoundCloudTrack>;
      
      // Проверяем что ответ валидный
      if (!tracksResponse.ok) {
        console.error(`[SoundCloud] Tracks search failed: ${tracksResponse.status}`);
        return { tracks: [], playlists: [], users: [] };
      }
      
      // Читаем текст ответа для отладки
      const tracksText = await tracksResponse.text();
      
      // Проверяем что это не пустой ответ
      if (!tracksText || tracksText.trim().length === 0) {
        console.error("[SoundCloud] Empty response from tracks search");
        return { tracks: [], playlists: [], users: [] };
      }
      
      // Парсим JSON
      try {
        tracksData = JSON.parse(tracksText);
      } catch (parseError) {
        console.error("[SoundCloud] Failed to parse tracks JSON:", parseError);
        console.error("[SoundCloud] Response text:", tracksText.substring(0, 200));
        return { tracks: [], playlists: [], users: [] };
      }

      console.log(
        `[SoundCloud] Found ${tracksData.collection?.length || 0} tracks`
      );

      // Search playlists
      let playlists: SoundCloudPlaylist[] = [];
      try {
        const playlistsResponse = await this.fetchWithRetry(
          `${SOUNDCLOUD_API_V2}/search/playlists?${params}`
        );
        if (playlistsResponse.ok) {
          const playlistsText = await playlistsResponse.text();
          if (playlistsText && playlistsText.trim().length > 0) {
            const playlistsData = JSON.parse(playlistsText);
            playlists = playlistsData.collection?.map(this.mapPlaylist) || [];
          }
        }
      } catch (e) {
        console.warn("Playlists search failed:", e);
      }

      // Search users
      let users: SoundCloudUser[] = [];
      try {
        const usersResponse = await this.fetchWithRetry(
          `${SOUNDCLOUD_API_V2}/search/users?${params}`
        );
        if (usersResponse.ok) {
          const usersText = await usersResponse.text();
          if (usersText && usersText.trim().length > 0) {
            const usersData = JSON.parse(usersText);
            users = usersData.collection?.map(this.mapUser) || [];
          }
        }
      } catch (e) {
        console.warn("Users search failed:", e);
      }

      const result: SoundCloudSearchResult = {
        tracks: tracksData.collection?.map(this.mapTrack) || [],
        playlists,
        users,
        nextPageUrl: tracksData.next_href,
      };

      console.log(`[SoundCloud] Search complete:`, {
        tracks: result.tracks.length,
        playlists: result.playlists.length,
        users: result.users.length,
      });

      return result;
    } catch (error) {
      console.error("SoundCloud search error:", error);
      return { tracks: [], playlists: [], users: [] };
    }
  }

  async getStreamUrl(trackId: string): Promise<string | null> {
    if (!this.hasToken()) {
      console.error("[SoundCloud] No token configured");
      // Показываем уведомление об ошибке
      window.dispatchEvent(
        new CustomEvent("show-toast", {
          detail: { 
            message: "SoundCloud: Токен не настроен. Перейдите в настройки сервисов.", 
            type: "error" 
          },
        })
      );
      return null;
    }

    console.log(`[SoundCloud] Getting stream URL for track: ${trackId}`);

    // Try up to 5 times with different tokens
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        console.log(`[SoundCloud] Attempt ${attempt + 1} with token: ${this.clientId?.substring(0, 8)}...`);

        // HIGH PRIORITY - this is for playback
        const response = await this.fetchWithRetry(
          `${SOUNDCLOUD_API_V2}/tracks/${trackId}`,
          4,
          true // High priority
        );
        
        if (!response.ok) {
          console.error(`[SoundCloud] Track fetch failed: ${response.status} ${response.statusText}`);
          
          // Если 401/403 - токен не работает
          if (response.status === 401 || response.status === 403) {
            if (attempt === 0) {
              // Показываем уведомление только при первой попытке
              window.dispatchEvent(
                new CustomEvent("show-toast", {
                  detail: { 
                    message: `SoundCloud: Токен не работает (${response.status}). Переключаюсь на резервный...`, 
                    type: "warning" 
                  },
                })
              );
            }
          }
          continue;
        }

        const track: SoundCloudTrack = await response.json();
        console.log(`[SoundCloud] Track data received:`, {
          title: track.title,
          hasMedia: !!track.media,
          transcodingCount: track.media?.transcodings?.length || 0
        });

        if (!track.media?.transcodings || track.media.transcodings.length === 0) {
          console.error("[SoundCloud] No transcodings available for track:", track.title);
          // This track might be geo-restricted or removed - don't retry with different token
          return null;
        }

        console.log(`[SoundCloud] Available transcodings:`, 
          track.media.transcodings.map((t) => `${t.format.protocol} (${t.format.mime_type})`)
        );

        // Try to get progressive stream URL first (direct MP3 - best for Howler.js)
        const progressiveTranscoding = track.media.transcodings.find(
          (t) => t.format.protocol === "progressive"
        );

        if (progressiveTranscoding) {
          console.log("[SoundCloud] Using progressive stream");
          try {
            const streamResponse = await this.fetchWithRetry(progressiveTranscoding.url, 4, true);
            if (streamResponse.ok) {
              const streamData = await streamResponse.json();
              if (streamData.url) {
                console.log("[SoundCloud] Progressive stream URL obtained:", streamData.url?.substring(0, 50) + "...");
                return streamData.url;
              }
            }
          } catch (e) {
            console.warn("[SoundCloud] Progressive stream failed:", e);
          }
        }

        // Try HLS stream with mpeg - Howler supports it with html5 mode
        const hlsMpegTranscoding = track.media.transcodings.find(
          (t) => t.format.protocol === "hls" && t.format.mime_type.includes("audio/mpeg")
        );

        if (hlsMpegTranscoding) {
          console.log("[SoundCloud] Using HLS mpeg stream");
          try {
            const streamResponse = await this.fetchWithRetry(hlsMpegTranscoding.url, 4, true);
            if (streamResponse.ok) {
              const streamData = await streamResponse.json();
              if (streamData.url) {
                console.log("[SoundCloud] HLS mpeg stream URL obtained:", streamData.url?.substring(0, 50) + "...");
                return streamData.url;
              }
            }
          } catch (e) {
            console.warn("[SoundCloud] HLS mpeg stream failed:", e);
          }
        }

        // Try HLS stream with opus
        const hlsOpusTranscoding = track.media.transcodings.find(
          (t) => t.format.protocol === "hls" && t.format.mime_type.includes("opus")
        );

        if (hlsOpusTranscoding) {
          console.log("[SoundCloud] Using HLS opus stream");
          try {
            const streamResponse = await this.fetchWithRetry(hlsOpusTranscoding.url, 4, true);
            if (streamResponse.ok) {
              const streamData = await streamResponse.json();
              if (streamData.url) {
                console.log("[SoundCloud] HLS opus stream URL obtained");
                return streamData.url;
              }
            }
          } catch (e) {
            console.warn("[SoundCloud] HLS opus stream failed:", e);
          }
        }

        // Fallback to any HLS stream
        const anyHls = track.media.transcodings.find(
          (t) => t.format.protocol === "hls"
        );

        if (anyHls) {
          console.log("[SoundCloud] Using any HLS stream");
          try {
            const streamResponse = await this.fetchWithRetry(anyHls.url, 4, true);
            if (streamResponse.ok) {
              const streamData = await streamResponse.json();
              if (streamData.url) {
                console.log("[SoundCloud] Fallback HLS stream URL obtained");
                return streamData.url;
              }
            }
          } catch (e) {
            console.warn("[SoundCloud] Fallback HLS stream failed:", e);
          }
        }

        console.error("[SoundCloud] No suitable stream found for track:", track.title);
        // Показываем уведомление
        window.dispatchEvent(
          new CustomEvent("show-toast", {
            detail: { 
              message: "SoundCloud: Трек недоступен для воспроизведения", 
              type: "error" 
            },
          })
        );
        return null;
      } catch (error) {
        console.error(`[SoundCloud] Error getting stream URL (attempt ${attempt + 1}):`, error);
        // Try next token
        if (attempt < 4) {
          this.tryNextToken();
          console.log(`[SoundCloud] Trying next token: ${this.clientId?.substring(0, 8)}...`);
          // Small delay before retry
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
    }

    console.error("[SoundCloud] All attempts failed for track:", trackId);
    // Показываем финальное уведомление об ошибке
    window.dispatchEvent(
      new CustomEvent("show-toast", {
        detail: { 
          message: "SoundCloud: Не удалось загрузить трек. Все токены не работают.", 
          type: "error" 
        },
      })
    );
    return null;
  }

  async getTrack(trackId: string): Promise<Track | null> {
    if (!this.hasToken()) return null;

    try {
      const response = await this.fetchWithRetry(
        `${SOUNDCLOUD_API_V2}/tracks/${trackId}`
      );
      const track: SoundCloudTrack = await response.json();
      return this.mapTrack(track);
    } catch (error) {
      console.error("Error getting track:", error);
      return null;
    }
  }

  async getPlaylistTracks(playlistId: string): Promise<Track[]> {
    if (!this.hasToken()) return [];

    try {
      const response = await this.fetchWithRetry(
        `${SOUNDCLOUD_API_V2}/playlists/${playlistId}`
      );
      const data = await response.json();
      return data.tracks?.map(this.mapTrack) || [];
    } catch (error) {
      console.error("Error getting playlist tracks:", error);
      return [];
    }
  }

  async getTrending(limit: number = 20): Promise<Track[]> {
    if (!this.hasToken()) return [];

    const cacheKey = `sc-trending-${limit}`;
    const cached = await storageService.getCache<Track[]>(cacheKey);
    if (cached) return cached;

    try {
      const response = await this.fetchWithRetry(
        `${SOUNDCLOUD_API_V2}/charts?kind=trending&genre=all-music&limit=${limit}`
      );
      const data = await response.json();
      const tracks =
        data.collection?.map((item: { track: SoundCloudTrack }) =>
          this.mapTrack(item.track)
        ) || [];

      await storageService.setCache(cacheKey, tracks, 600000);
      return tracks;
    } catch (error) {
      console.error("Error getting trending:", error);
      return [];
    }
  }

  async getNewReleases(limit: number = 20): Promise<Track[]> {
    if (!this.hasToken()) return [];

    const cacheKey = `sc-new-${limit}`;
    const cached = await storageService.getCache<Track[]>(cacheKey);
    if (cached) return cached;

    try {
      const response = await this.fetchWithRetry(
        `${SOUNDCLOUD_API_V2}/charts?kind=top&genre=all-music&limit=${limit}`
      );
      const data = await response.json();
      const tracks =
        data.collection?.map((item: { track: SoundCloudTrack }) =>
          this.mapTrack(item.track)
        ) || [];

      await storageService.setCache(cacheKey, tracks, 600000);
      return tracks;
    } catch (error) {
      console.error("Error getting new releases:", error);
      return [];
    }
  }

  private mapTrack = (sc: SoundCloudTrack): Track => ({
    id: `sc-${sc.id}`,
    title: sc.title,
    artist: sc.user.username,
    duration: Math.floor(sc.duration / 1000),
    artworkUrl: sc.artwork_url?.replace("-large", "-t500x500") || "",
    streamUrl: "",
    platform: "soundcloud",
    url: sc.permalink_url || `https://soundcloud.com/track/${sc.id}`,
    metadata: {
      genre: sc.genre,
      releaseDate: sc.created_at,
      playCount: sc.playback_count,
      likeCount: sc.likes_count,
      waveformUrl: sc.waveform_url,
    },
  });

  private mapPlaylist = (sc: any): SoundCloudPlaylist => ({
    id: `sc-playlist-${sc.id}`,
    title: sc.title,
    trackCount: sc.track_count || 0,
    artworkUrl: sc.artwork_url?.replace("-large", "-t500x500") || "",
    creator: this.mapUser(sc.user),
  });

  private mapUser = (sc: any): SoundCloudUser => ({
    id: `sc-user-${sc.id}`,
    username: sc.username,
    avatarUrl: sc.avatar_url || "",
    verified: sc.verified || false,
    followersCount: sc.followers_count || 0,
    trackCount: sc.track_count || 0,
  });

  // Get user's tracks
  async getUserTracks(userId: string, limit: number = 50, username?: string): Promise<Track[]> {
    if (!this.hasToken()) return [];

    try {
      console.log(`[SoundCloud] Getting tracks for user: ${userId}`);
      const response = await this.fetchWithRetry(
        `${SOUNDCLOUD_API_V2}/users/${userId}/tracks?limit=${limit}`
      );
      
      const text = await response.text();
      if (!text || text.trim().length === 0) {
        console.error("[SoundCloud] Empty response from getUserTracks");
        return this.getUserTracksBySearch(username || userId, limit);
      }
      
      let data: any;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error("[SoundCloud] Failed to parse getUserTracks JSON:", parseError);
        return this.getUserTracksBySearch(username || userId, limit);
      }

      // API can return { collection: [...] } or just an array
      const rawTracks = Array.isArray(data) ? data : (data.collection || []);
      const tracks = rawTracks.map(this.mapTrack);
      console.log(`[SoundCloud] Found ${tracks.length} tracks for user ${userId}`);
      
      if (tracks.length === 0 && username) {
        console.log(`[SoundCloud] No tracks from API, trying search fallback for "${username}"`);
        return this.getUserTracksBySearch(username, limit);
      }
      
      return tracks;
    } catch (error) {
      console.error("[SoundCloud] Error getting user tracks, trying search fallback:", error);
      return this.getUserTracksBySearch(username || userId, limit);
    }
  }

  // Fallback: get user tracks via search API when /users/{id}/tracks returns 403
  private async getUserTracksBySearch(username: string, limit: number = 50): Promise<Track[]> {
    try {
      console.log(`[SoundCloud] Fallback: searching tracks by "${username}"`);
      const params = new URLSearchParams({
        q: username,
        limit: Math.min(limit, 50).toString(),
      });
      
      const response = await this.fetchWithRetry(
        `${SOUNDCLOUD_API_V2}/search/tracks?${params}`
      );
      
      if (!response.ok) {
        console.error(`[SoundCloud] Search fallback failed: ${response.status}`);
        return [];
      }
      
      const text = await response.text();
      if (!text || text.trim().length === 0) return [];
      
      const data = JSON.parse(text);
      const allTracks: Track[] = (data.collection || []).map(this.mapTrack);
      
      // Filter to only tracks by this artist (case-insensitive match)
      const artistName = username.toLowerCase();
      const artistTracks = allTracks.filter(t => 
        t.artist.toLowerCase() === artistName ||
        t.artist.toLowerCase().includes(artistName) ||
        artistName.includes(t.artist.toLowerCase())
      );
      
      console.log(`[SoundCloud] Search fallback found ${artistTracks.length} tracks for "${username}" (of ${allTracks.length} total)`);
      return artistTracks.length > 0 ? artistTracks : allTracks;
    } catch (error) {
      console.error("[SoundCloud] Search fallback error:", error);
      return [];
    }
  }

  // Get full user info
  async getUser(userId: string): Promise<SoundCloudUser | null> {
    if (!this.hasToken()) return null;

    try {
      const response = await this.fetchWithRetry(
        `${SOUNDCLOUD_API_V2}/users/${userId}`
      );
      const data = await response.json();
      return this.mapUser(data);
    } catch (error) {
      console.error("[SoundCloud] Error getting user:", error);
      return null;
    }
  }

  // Get user's liked tracks
  async getUserLikes(userId: string, limit: number = 50): Promise<Track[]> {
    if (!this.hasToken()) return [];

    try {
      console.log(`[SoundCloud] Getting likes for user: ${userId}`);
      const response = await this.fetchWithRetry(
        `${SOUNDCLOUD_API_V2}/users/${userId}/likes?limit=${limit}`
      );
      const data = await response.json();

      // Filter only tracks (not playlists)
      const tracks =
        data.collection
          ?.filter((item: any) => item.track)
          .map((item: any) => this.mapTrack(item.track)) || [];

      console.log(`[SoundCloud] Found ${tracks.length} liked tracks`);
      return tracks;
    } catch (error) {
      console.error("[SoundCloud] Error getting user likes:", error);
      return [];
    }
  }

  // Get user's playlists
  async getUserPlaylists(
    userId: string,
    limit: number = 50
  ): Promise<SoundCloudPlaylist[]> {
    if (!this.hasToken()) return [];

    try {
      console.log(`[SoundCloud] Getting playlists for user: ${userId}`);
      const response = await this.fetchWithRetry(
        `${SOUNDCLOUD_API_V2}/users/${userId}/playlists?limit=${limit}`
      );
      const data = await response.json();

      const playlists = data.collection?.map(this.mapPlaylist) || [];
      console.log(`[SoundCloud] Found ${playlists.length} playlists`);
      return playlists;
    } catch (error) {
      console.error("[SoundCloud] Error getting user playlists:", error);
      return [];
    }
  }

  // Resolve user profile URL to get user ID
  async resolveUser(profileUrl: string): Promise<SoundCloudUser | null> {
    if (!this.hasToken()) return null;

    try {
      console.log(`[SoundCloud] Resolving user: ${profileUrl}`);
      const response = await this.fetchWithRetry(
        `${SOUNDCLOUD_API_V2}/resolve?url=${encodeURIComponent(profileUrl)}`
      );
      const data = await response.json();

      if (data.kind === "user") {
        return this.mapUser(data);
      }
      return null;
    } catch (error) {
      console.error("[SoundCloud] Error resolving user:", error);
      return null;
    }
  }

  // Resolve playlist URL and get tracks
  async resolvePlaylistUrl(playlistUrl: string): Promise<Track[]> {
    if (!this.hasToken()) return [];

    try {
      console.log(`[SoundCloud] Resolving playlist URL: ${playlistUrl}`);
      const response = await this.fetchWithRetry(
        `${SOUNDCLOUD_API_V2}/resolve?url=${encodeURIComponent(playlistUrl)}`
      );
      const data = await response.json();

      if (data.kind === "playlist") {
        const tracks: Track[] = [];
        const trackIds: number[] = [];
        
        // First pass - get tracks with full data and collect IDs of mini tracks
        for (const t of data.tracks || []) {
          if (!t.id) continue;
          
          // Check if track has full data (has title) or is mini (only id)
          if (t.title) {
            tracks.push({
              id: `sc-${t.id}`,
              title: t.title,
              artist: t.user?.username || "Unknown Artist",
              duration: Math.floor((t.duration || 0) / 1000),
              artworkUrl: t.artwork_url?.replace("-large", "-t500x500") || t.user?.avatar_url || "",
              streamUrl: "",
              platform: "soundcloud",
              url: t.permalink_url || "",
              metadata: {
                genre: t.genre,
                playCount: t.playback_count,
                likeCount: t.likes_count,
              },
            });
          } else {
            // Mini track - need to fetch full data
            trackIds.push(t.id);
          }
        }

        // Fetch full data for mini tracks in batches of 50
        if (trackIds.length > 0) {
          console.log(`[SoundCloud] Fetching ${trackIds.length} additional tracks...`);
          for (let i = 0; i < trackIds.length; i += 50) {
            const batch = trackIds.slice(i, i + 50);
            try {
              const batchResponse = await this.fetchWithRetry(
                `${SOUNDCLOUD_API_V2}/tracks?ids=${batch.join(",")}`
              );
              const batchData = await batchResponse.json();
              
              for (const t of batchData) {
                if (!t.id || !t.title) continue;
                tracks.push({
                  id: `sc-${t.id}`,
                  title: t.title,
                  artist: t.user?.username || "Unknown Artist",
                  duration: Math.floor((t.duration || 0) / 1000),
                  artworkUrl: t.artwork_url?.replace("-large", "-t500x500") || t.user?.avatar_url || "",
                  streamUrl: "",
                  platform: "soundcloud",
                  url: t.permalink_url || "",
                  metadata: {
                    genre: t.genre,
                    playCount: t.playback_count,
                    likeCount: t.likes_count,
                  },
                });
              }
            } catch (batchError) {
              console.error(`[SoundCloud] Error fetching batch:`, batchError);
            }
          }
        }

        console.log(`[SoundCloud] Resolved ${tracks.length} tracks from playlist`);
        return tracks;
      }
      return [];
    } catch (error) {
      console.error("[SoundCloud] Error resolving playlist URL:", error);
      return [];
    }
  }

  // Get full playlist with tracks
  async getFullPlaylist(
    playlistId: string
  ): Promise<{ title: string; tracks: Track[] } | null> {
    if (!this.hasToken()) return null;

    try {
      // Remove prefix if present
      const cleanId = playlistId.replace("sc-playlist-", "");
      console.log(`[SoundCloud] Getting full playlist: ${cleanId}`);

      const response = await this.fetchWithRetry(
        `${SOUNDCLOUD_API_V2}/playlists/${cleanId}`
      );
      const data = await response.json();

      const tracks: Track[] = [];
      const clientId = this.clientId;

      for (const t of data.tracks || []) {
        if (!t.id) continue;

        let trackData = t;

        // If track data is incomplete, fetch full data
        if (!t.title || !t.artwork_url || !t.duration || t.duration === 0) {
          try {
            const trackUrl = `${SOUNDCLOUD_API_V2}/tracks/${t.id}?client_id=${clientId}`;
            const trackResponse = await proxyService.proxyFetch("soundcloud", trackUrl);
            if (trackResponse.ok) {
              trackData = await trackResponse.json();
            }
            await new Promise((r) => setTimeout(r, 100));
          } catch {
            continue;
          }
        }

        if (!trackData.title && !trackData.user?.username) continue;

        tracks.push(this.mapTrack(trackData));
      }

      return {
        title: data.title || "Плейлист",
        tracks,
      };
    } catch (error) {
      console.error("[SoundCloud] Error getting full playlist:", error);
      return null;
    }
  }
}

export const soundCloudService = new SoundCloudService();
