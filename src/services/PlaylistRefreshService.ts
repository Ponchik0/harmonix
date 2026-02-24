// Service for refreshing playlists from their original sources
import { soundCloudService } from "./SoundCloudService";
import { playlistService } from "./PlaylistService";
import { likedTracksService } from "./LikedTracksService";
import type { Track, Playlist } from "../types";

interface RefreshResult {
  success: boolean;
  addedCount: number;
  addedTracks: Track[];
  error?: string;
}

class PlaylistRefreshService {
  /**
   * Refresh a SoundCloud playlist by fetching latest tracks from the source
   */
  async refreshSoundCloudPlaylist(playlist: Playlist): Promise<RefreshResult> {
    try {
      // Check if this playlist is from user likes
      if (playlist.sourceUrl && playlist.sourceUrl.includes("/likes")) {
        console.log(`[PlaylistRefresh] Detected likes playlist, using likes refresh logic`);
        console.log(`[PlaylistRefresh] Playlist name: ${playlist.name}`);
        console.log(`[PlaylistRefresh] Source URL: ${playlist.sourceUrl}`);
        console.log(`[PlaylistRefresh] Saved user ID: ${playlist.sourceUserId || 'NOT SAVED'}`);
        
        // ONLY use saved userId - no fallback to resolve
        if (!playlist.sourceUserId) {
          return {
            success: false,
            addedCount: 0,
            addedTracks: [],
            error: "Плейлист создан в старой версии. Пожалуйста, удалите и создайте заново через импорт профиля.",
          };
        }
        
        const userId = playlist.sourceUserId;
        console.log(`[PlaylistRefresh] Using saved user ID: ${userId}`);
        
        try {
          // Get last refresh date to filter only truly new tracks
          const lastRefreshDate = playlist.lastRefreshDate ? new Date(playlist.lastRefreshDate) : null;
          console.log(`[PlaylistRefresh] Last refresh: ${lastRefreshDate?.toISOString() || 'never'}`);
          
          // Fetch ALL current user likes to compare
          console.log(`[PlaylistRefresh] Fetching likes for user ID: ${userId}...`);
          const allCurrentLikes = await soundCloudService.getUserLikes(userId, 200);
          
          if (allCurrentLikes.length === 0) {
            return {
              success: false,
              addedCount: 0,
              addedTracks: [],
              error: "Не удалось загрузить лайки из SoundCloud. Возможно, профиль приватный.",
            };
          }
          
          console.log(`[PlaylistRefresh] Loaded ${allCurrentLikes.length} current likes from SoundCloud for user ${userId}`);
          console.log(`[PlaylistRefresh] First 3 likes: ${allCurrentLikes.slice(0, 3).map(t => t.title).join(', ')}`);
          
          // Find tracks that are in user's likes but not in playlist
          const currentTrackIds = new Set(playlist.tracks?.map(t => t.id) || []);
          
          // Only add tracks that are in user's current likes and not in the playlist yet
          let newTracks = allCurrentLikes.filter(t => !currentTrackIds.has(t.id));
          
          console.log(`[PlaylistRefresh] Found ${newTracks.length} tracks not in playlist`);
          if (newTracks.length > 0) {
            console.log(`[PlaylistRefresh] First 3 new tracks: ${newTracks.slice(0, 3).map(t => t.title).join(', ')}`);
          }
          
          // If we have a last refresh date, be more conservative
          if (lastRefreshDate) {
            // Only take the first few tracks (newest ones)
            newTracks = newTracks.slice(0, 10);
            console.log(`[PlaylistRefresh] Limited to ${newTracks.length} newest tracks`);
          } else {
            // First refresh - still limit but allow more
            newTracks = newTracks.slice(0, 20);
            console.log(`[PlaylistRefresh] First refresh, limited to ${newTracks.length} tracks`);
          }
          
          // Add new tracks to playlist at the TOP (prepend)
          for (const track of newTracks) {
            playlistService.addTrackToPlaylist(playlist.id, track, true); // true = prepend
          }
          
          // Update last refresh date
          const now = new Date().toISOString();
          playlistService.updatePlaylist(playlist.id, { lastRefreshDate: now });
          
          console.log(`[PlaylistRefresh] Successfully added ${newTracks.length} new tracks from likes at the TOP`);
          
          return {
            success: true,
            addedCount: newTracks.length,
            addedTracks: newTracks,
          };
        } catch (error) {
          console.error("[PlaylistRefresh] Error refreshing likes playlist:", error);
          return {
            success: false,
            addedCount: 0,
            addedTracks: [],
            error: error instanceof Error ? error.message : "Ошибка обновления лайков",
          };
        }
      }
      
      // Regular playlist refresh logic
      // First try to get playlist ID from sourceUrl
      let playlistId: string | null = null;
      
      if (playlist.sourceUrl) {
        console.log(`[PlaylistRefresh] Using sourceUrl: ${playlist.sourceUrl}`);
        
        // Extract playlist ID from URL
        // Format: https://soundcloud.com/username/sets/playlist-name
        const match = playlist.sourceUrl.match(/soundcloud\.com\/[^/]+\/sets\/([^/?]+)/);
        if (match) {
          // This is a permalink, need to resolve to numeric ID
          try {
            const response = await fetch(
              `https://api-v2.soundcloud.com/resolve?url=${encodeURIComponent(playlist.sourceUrl)}&client_id=${soundCloudService.clientId}`
            );
            
            if (response.ok) {
              const data = await response.json();
              if (data.id) {
                playlistId = String(data.id);
                console.log(`[PlaylistRefresh] Resolved playlist ID: ${playlistId}`);
              }
            }
          } catch (error) {
            console.warn("[PlaylistRefresh] Failed to resolve URL:", error);
          }
        }
        
        // Try direct numeric ID from URL
        if (!playlistId) {
          const numericMatch = playlist.sourceUrl.match(/\/playlists\/(\d+)/);
          if (numericMatch) {
            playlistId = numericMatch[1];
          }
        }
      }
      
      // Fallback to extracting from playlist ID
      if (!playlistId) {
        playlistId = this.extractSoundCloudPlaylistId(playlist);
      }

      if (!playlistId) {
        return {
          success: false,
          addedCount: 0,
          addedTracks: [],
          error: "Не удалось определить ID плейлиста SoundCloud. Убедитесь что плейлист импортирован из SoundCloud.",
        };
      }

      console.log(`[PlaylistRefresh] Refreshing SoundCloud playlist: ${playlistId}`);

      // Fetch fresh tracks from SoundCloud
      const freshTracks = await soundCloudService.getPlaylistTracks(playlistId);
      
      if (freshTracks.length === 0) {
        return {
          success: false,
          addedCount: 0,
          addedTracks: [],
          error: "Не удалось загрузить треки из SoundCloud. Возможно, плейлист удален или приватный.",
        };
      }

      // Find new tracks (not in current playlist)
      const currentTrackIds = new Set(playlist.tracks?.map(t => t.id) || []);
      const newTracks = freshTracks.filter(t => !currentTrackIds.has(t.id));

      // Add new tracks to playlist at the TOP (prepend)
      for (const track of newTracks) {
        playlistService.addTrackToPlaylist(playlist.id, track, true); // true = prepend
      }

      console.log(`[PlaylistRefresh] Added ${newTracks.length} new tracks at the TOP`);

      return {
        success: true,
        addedCount: newTracks.length,
        addedTracks: newTracks,
      };
    } catch (error) {
      console.error("[PlaylistRefresh] Error refreshing SoundCloud playlist:", error);
      return {
        success: false,
        addedCount: 0,
        addedTracks: [],
        error: error instanceof Error ? error.message : "Неизвестная ошибка",
      };
    }
  }

  /**
   * Extract SoundCloud user ID from existing liked tracks by fetching track details
   */
  private async extractUserIdFromLikedTracks(): Promise<string | null> {
    try {
      const likedTracks = likedTracksService.getLikedTracks();
      
      if (likedTracks.length === 0) {
        return null;
      }

      // Find SoundCloud tracks
      const scTracks = likedTracks.filter(t => 
        t.id.startsWith("sc-") || 
        t.platform === "soundcloud"
      );

      if (scTracks.length === 0) {
        return null;
      }

      console.log(`[PlaylistRefresh] Trying to extract user ID from ${scTracks.length} SoundCloud tracks...`);
      
      // Try to fetch track details to get user ID
      for (const track of scTracks.slice(0, 3)) {
        try {
          const trackId = track.id.replace("sc-", "");
          
          // Fetch track details from SoundCloud API
          const response = await fetch(
            `https://api-v2.soundcloud.com/tracks/${trackId}?client_id=${soundCloudService.clientId}`
          );
          
          if (response.ok) {
            const trackData = await response.json();
            if (trackData.user && trackData.user.id) {
              const userId = String(trackData.user.id);
              console.log(`[PlaylistRefresh] Found user ID: ${userId} from track: ${track.title}`);
              return userId;
            }
          }
        } catch (error) {
          console.warn(`[PlaylistRefresh] Failed to get user ID from track ${track.id}:`, error);
          continue;
        }
      }

      return null;
    } catch (error) {
      console.error("[PlaylistRefresh] Error extracting user ID:", error);
      return null;
    }
  }

  /**
   * Refresh liked tracks from SoundCloud user - auto-detects user from existing tracks
   */
  async refreshSoundCloudLikes(userId?: string): Promise<RefreshResult> {
    try {
      // First try to get sourceUrl from storage
      const savedSourceUrl = likedTracksService.getSourceUrl();
      
      if (savedSourceUrl) {
        console.log(`[PlaylistRefresh] Using saved source URL: ${savedSourceUrl}`);
        
        // Extract user ID from URL if it's a likes URL
        // Format: https://soundcloud.com/username/likes
        const match = savedSourceUrl.match(/soundcloud\.com\/([^/]+)\/likes/);
        if (match) {
          try {
            // Resolve username to user ID
            const response = await fetch(
              `https://api-v2.soundcloud.com/resolve?url=${encodeURIComponent(savedSourceUrl)}&client_id=${soundCloudService.clientId}`
            );
            
            if (response.ok) {
              const data = await response.json();
              if (data.id) {
                userId = String(data.id);
                console.log(`[PlaylistRefresh] Resolved user ID from saved URL: ${userId}`);
              }
            }
          } catch (error) {
            console.warn("[PlaylistRefresh] Failed to resolve saved URL:", error);
          }
        }
      }
      
      // If no userId yet, try to extract from existing liked tracks
      if (!userId) {
        const likedTracks = likedTracksService.getLikedTracks();
        
        if (likedTracks.length === 0) {
          return {
            success: false,
            addedCount: 0,
            addedTracks: [],
            error: "Нет лайкнутых треков. Добавьте хотя бы один трек из SoundCloud для автоопределения пользователя.",
          };
        }

        // Try to extract user ID from existing tracks
        const extractedUserId = await this.extractUserIdFromLikedTracks();
        
        if (!extractedUserId) {
          return {
            success: false,
            addedCount: 0,
            addedTracks: [],
            error: "Не удалось определить пользователя SoundCloud. Убедитесь что есть треки из SoundCloud.",
          };
        }
        
        userId = extractedUserId;
      }

      console.log(`[PlaylistRefresh] Refreshing SoundCloud likes for user: ${userId}`);

      // Fetch fresh liked tracks from SoundCloud (only recent ones)
      const freshLikes = await soundCloudService.getUserLikes(userId, 50);
      
      if (freshLikes.length === 0) {
        return {
          success: false,
          addedCount: 0,
          addedTracks: [],
          error: "Не удалось загрузить лайки из SoundCloud. Возможно, профиль приватный или ID неверный.",
        };
      }

      // Save source URL for future refreshes if we got the user ID
      if (userId && !savedSourceUrl) {
        // We can't construct the exact URL without username, but we can save the user ID
        likedTracksService.setSourceUrl(`soundcloud://user/${userId}/likes`);
      }

      // Find new tracks (not in current liked tracks)
      const currentLikedIds = new Set(likedTracksService.getLikedTracks().map(t => t.id));
      const newLikes = freshLikes.filter(t => !currentLikedIds.has(t.id));
      
      // Limit to prevent adding too many old tracks at once
      const tracksToAdd = newLikes.slice(0, 20); // Max 20 new tracks per refresh

      // Add new liked tracks
      for (const track of tracksToAdd) {
        likedTracksService.addLikedTrack(track);
      }

      console.log(`[PlaylistRefresh] Added ${tracksToAdd.length} new liked tracks (${newLikes.length} total new found)`);

      return {
        success: true,
        addedCount: tracksToAdd.length,
        addedTracks: tracksToAdd,
      };
    } catch (error) {
      console.error("[PlaylistRefresh] Error refreshing SoundCloud likes:", error);
      return {
        success: false,
        addedCount: 0,
        addedTracks: [],
        error: error instanceof Error ? error.message : "Неизвестная ошибка",
      };
    }
  }

  /**
   * Refresh any playlist based on its source
   */
  async refreshPlaylist(playlist: Playlist): Promise<RefreshResult> {
    const source = playlist.source || this.detectPlaylistSource(playlist);

    switch (source) {
      case "soundcloud":
        return this.refreshSoundCloudPlaylist(playlist);
      
      // Add more sources here (YouTube, Spotify, etc.)
      
      default:
        return {
          success: false,
          addedCount: 0,
          addedTracks: [],
          error: `Обновление для источника "${source}" пока не поддерживается`,
        };
    }
  }

  /**
   * Extract SoundCloud playlist ID from various formats
   */
  private extractSoundCloudPlaylistId(playlist: Playlist): string | null {
    // Try from playlist ID
    if (playlist.id.startsWith("soundcloud_")) {
      return playlist.id.replace("soundcloud_", "");
    }
    
    if (playlist.id.startsWith("sc-playlist-")) {
      return playlist.id.replace("sc-playlist-", "");
    }

    // Try from first track's metadata
    if (playlist.tracks && playlist.tracks.length > 0) {
      const firstTrack = playlist.tracks[0];
      if ((firstTrack as any).metadata?.playlistId) {
        return (firstTrack as any).metadata.playlistId;
      }
    }

    // Try from description or other metadata
    if ((playlist as any).sourceUrl) {
      const match = (playlist as any).sourceUrl.match(/soundcloud\.com\/[^/]+\/sets\/([^/?]+)/);
      if (match) return match[1];
    }

    return null;
  }

  /**
   * Detect playlist source from tracks
   */
  private detectPlaylistSource(playlist: Playlist): string {
    if (!playlist.tracks || playlist.tracks.length === 0) {
      return "unknown";
    }

    // Count tracks by platform
    const platformCounts: Record<string, number> = {};
    for (const track of playlist.tracks) {
      const platform = track.platform || "unknown";
      platformCounts[platform] = (platformCounts[platform] || 0) + 1;
    }

    // Return most common platform
    let maxCount = 0;
    let dominantPlatform = "unknown";
    for (const [platform, count] of Object.entries(platformCounts)) {
      if (count > maxCount) {
        maxCount = count;
        dominantPlatform = platform;
      }
    }

    return dominantPlatform;
  }
}

export const playlistRefreshService = new PlaylistRefreshService();
