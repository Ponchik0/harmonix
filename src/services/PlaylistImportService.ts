// Playlist Import Service - imports playlists from harmonix.lol API

import { storageService } from "./StorageService";
import { soundCloudService } from "./SoundCloudService";
import { youtubeService } from "./YouTubeService";
import { vkMusicService } from "./VKMusicService";
import type { Track } from "../types";

const API_BASE = "https://harmonix-site.vercel.app/api";

export interface ImportedTrack {
  title: string;
  artist: string;
  album?: string;
  duration: number;
  cover?: string;
  url?: string;
}

export interface ImportedPlaylist {
  code: string;
  source: string;
  sourceUrl: string;
  name: string;
  description?: string;
  cover?: string;
  trackCount: number;
  tracks: ImportedTrack[];
  createdAt: string;
  expiresAt: string;
}

class PlaylistImportService {
  async fetchPlaylist(code: string): Promise<ImportedPlaylist | null> {
    try {
      console.log("[PlaylistImport] Fetching playlist:", code);
      console.log("[PlaylistImport] URL:", `${API_BASE}/playlist/${code}`);
      
      const response = await fetch(`${API_BASE}/playlist/${code}`);
      
      console.log("[PlaylistImport] Response status:", response.status);
      
      if (!response.ok) {
        const text = await response.text();
        console.error("[PlaylistImport] API error:", response.status, text);
        return null;
      }
      
      const data = await response.json();
      console.log("[PlaylistImport] Received data:", data);
      return data as ImportedPlaylist;
    } catch (error) {
      console.error("[PlaylistImport] Fetch error:", error);
      return null;
    }
  }

  async importPlaylist(code: string): Promise<{ success: boolean; playlistId?: string; name?: string; trackCount?: number; error?: string }> {
    try {
      // Fetch playlist data from API
      const playlist = await this.fetchPlaylist(code);
      
      if (!playlist) {
        return { success: false, error: "Не удалось получить плейлист" };
      }

      // Check if expired
      if (new Date(playlist.expiresAt) < new Date()) {
        return { success: false, error: "Код плейлиста истёк" };
      }

      await storageService.init();

      // Convert tracks to app format
      const tracks = await this.convertTracks(playlist.tracks, playlist.source);

      // Create playlist in storage
      const playlistId = `imported-${Date.now()}`;
      await storageService.createPlaylist({
        id: playlistId,
        name: playlist.name,
        description: playlist.description || `Импортировано из ${playlist.source}`,
        artworkUrl: playlist.cover || "",
        tracks: tracks,
        createdAt: Date.now(),
      });

      console.log(`[PlaylistImport] Successfully imported "${playlist.name}" with ${tracks.length} tracks`);
      
      // Notify UI about new playlist
      window.dispatchEvent(new CustomEvent("playlist-imported", { 
        detail: { playlistId, name: playlist.name, trackCount: tracks.length } 
      }));

      return { success: true, playlistId, name: playlist.name, trackCount: tracks.length };
    } catch (error) {
      console.error("[PlaylistImport] Import error:", error);
      return { success: false, error: "Ошибка импорта плейлиста" };
    }
  }

  private async convertTracks(tracks: ImportedTrack[], source: string): Promise<Track[]> {
    const convertedTracks: Track[] = [];

    for (const track of tracks) {
      const searchQuery = `${track.artist} ${track.title}`;
      let foundTrack: Track | null = null;
      
      try {
        // Try searching on the original source first
        if (source === "youtube" && youtubeService.isEnabled()) {
          const results = await youtubeService.search(searchQuery, 1);
          if (results.length > 0) {
            foundTrack = results[0];
          }
        } else if (source === "vk" && vkMusicService.isEnabled()) {
          const results = await vkMusicService.search(searchQuery, 1);
          if (results.length > 0) {
            foundTrack = results[0];
          }
        }
        
        // Fallback to SoundCloud if not found or source is soundcloud/spotify
        if (!foundTrack) {
          const results = await soundCloudService.search(searchQuery, 1);
          if (Array.isArray(results) && results.length > 0) {
            foundTrack = results[0];
          }
        }
        
        // Try YouTube as second fallback
        if (!foundTrack && youtubeService.isEnabled()) {
          const results = await youtubeService.search(searchQuery, 1);
          if (results.length > 0) {
            foundTrack = results[0];
          }
        }
        
        // Try VK as third fallback
        if (!foundTrack && vkMusicService.isEnabled()) {
          const results = await vkMusicService.search(searchQuery, 1);
          if (results.length > 0) {
            foundTrack = results[0];
          }
        }
        
        if (foundTrack) {
          convertedTracks.push(foundTrack);
        } else {
          // Add as placeholder if not found on any service
          convertedTracks.push({
            id: `imported-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            title: track.title,
            artist: track.artist,
            duration: track.duration,
            artworkUrl: track.cover || "",
            streamUrl: "",
            platform: "local",
            metadata: {},
          });
        }
      } catch (error) {
        console.warn(`[PlaylistImport] Error searching for "${searchQuery}":`, error);
        // Add as placeholder on error
        convertedTracks.push({
          id: `imported-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          title: track.title,
          artist: track.artist,
          duration: track.duration,
          artworkUrl: track.cover || "",
          streamUrl: "",
          platform: "local",
          metadata: {},
        });
      }
    }

    return convertedTracks;
  }

  // Parse import code from URL or direct code
  parseCode(input: string): string | null {
    // Direct code format: HRMX-XXXX-XXXX
    if (/^HRMX-[A-Z0-9]{4}-[A-Z0-9]{4}$/i.test(input)) {
      return input.toUpperCase();
    }

    // URL format: harmonix://import/HRMX-XXXX-XXXX
    const deepLinkMatch = input.match(/harmonix:\/\/import\/([A-Z0-9-]+)/i);
    if (deepLinkMatch) {
      return deepLinkMatch[1].toUpperCase();
    }

    // Web URL format: https://harmonix-site.vercel.app/import/HRMX-XXXX-XXXX
    const webMatch = input.match(/harmonix.*\/import\/([A-Z0-9-]+)/i);
    if (webMatch) {
      return webMatch[1].toUpperCase();
    }

    return null;
  }
}

export const playlistImportService = new PlaylistImportService();
