// localStorage-based playlist service
import type { Track, Playlist } from "../types";

const PLAYLISTS_KEY = "harmonix-playlists";

// Helper to decode HTML entities in URLs - decode multiple times until stable
const decodeUrlEntities = (url: string): string => {
  if (!url) return "";
  
  let decoded = url;
  let previous = "";
  
  // Keep decoding until the string stops changing (handles multiple encoding levels)
  while (decoded !== previous) {
    previous = decoded;
    
    // Decode &amp; first (most common double encoding)
    decoded = decoded.replace(/&amp;/g, "&");
    
    // Decode hex entities
    decoded = decoded.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => 
      String.fromCharCode(parseInt(hex, 16))
    );
    
    // Decode decimal entities
    decoded = decoded.replace(/&#(\d+);/g, (_, dec) => 
      String.fromCharCode(parseInt(dec, 10))
    );
    
    // Decode named entities
    decoded = decoded
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&nbsp;/g, " ");
  }
  
  // Remove any [link_removed] placeholders
  decoded = decoded.replace(/\[link_removed\]/g, "");
  
  return decoded.trim();
};

// Helper to check if URL is valid (has proper domain)
const isValidUrl = (url: string): boolean => {
  if (!url) return false;
  if (!url.startsWith('http://') && !url.startsWith('https://')) return false;
  try {
    const parsed = new URL(url);
    return Boolean(parsed.hostname && parsed.hostname.includes('.'));
  } catch {
    return false;
  }
};

class PlaylistService {
  private getPlaylists(): Playlist[] {
    try {
      const data = localStorage.getItem(PLAYLISTS_KEY);
      if (!data) return [];
      const playlists = JSON.parse(data);
      // Ensure all playlists have tracks array, fix encoded URLs, and clear invalid URLs
      return playlists.map((p: any) => {
        const decodedCoverUrl = decodeUrlEntities(p.coverUrl || "");
        return {
          ...p,
          tracks: (p.tracks || []).map((t: any) => {
            const decodedArtwork = decodeUrlEntities(t.artworkUrl || "");
            const decodedStream = decodeUrlEntities(t.streamUrl || "");
            return {
              ...t,
              artworkUrl: isValidUrl(decodedArtwork) ? decodedArtwork : "",
              streamUrl: isValidUrl(decodedStream) ? decodedStream : "",
            };
          }),
          coverUrl: isValidUrl(decodedCoverUrl) ? decodedCoverUrl : "",
        };
      });
    } catch (e) {
      console.error("[PlaylistService] Error reading:", e);
      return [];
    }
  }

  private savePlaylists(playlists: Playlist[]): void {
    try {
      localStorage.setItem(PLAYLISTS_KEY, JSON.stringify(playlists));
      window.dispatchEvent(new CustomEvent("playlists-changed"));
    } catch (e) {
      console.error("[PlaylistService] Error saving:", e);
    }
  }

  getAllPlaylists(): Playlist[] {
    return this.getPlaylists();
  }

  getPlaylist(id: string): Playlist | undefined {
    return this.getPlaylists().find((p) => p.id === id);
  }

  createPlaylist(name: string, description?: string): Playlist {
    const playlists = this.getPlaylists();
    const newPlaylist: Playlist = {
      id: `pl-${Date.now()}`,
      name,
      description,
      tracks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    playlists.push(newPlaylist);
    this.savePlaylists(playlists);
    console.log("[PlaylistService] Created:", name);
    return newPlaylist;
  }

  deletePlaylist(id: string): void {
    const playlists = this.getPlaylists().filter((p) => p.id !== id);
    this.savePlaylists(playlists);
    console.log("[PlaylistService] Deleted:", id);
  }

  updatePlaylist(id: string, updates: Partial<Playlist>): void {
    const playlists = this.getPlaylists();
    const index = playlists.findIndex((p) => p.id === id);
    if (index !== -1) {
      playlists[index] = {
        ...playlists[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      this.savePlaylists(playlists);
    }
  }

  updatePlaylistCover(id: string, coverUrl: string): void {
    const playlists = this.getPlaylists();
    const index = playlists.findIndex((p) => p.id === id);
    if (index !== -1) {
      playlists[index].coverUrl = coverUrl;
      playlists[index].updatedAt = new Date().toISOString();
      this.savePlaylists(playlists);
      console.log("[PlaylistService] Updated cover for:", id);
    }
  }

  updatePlaylistBanner(id: string, bannerUrl: string): void {
    const playlists = this.getPlaylists();
    const index = playlists.findIndex((p) => p.id === id);
    if (index !== -1) {
      (playlists[index] as any).bannerUrl = bannerUrl;
      playlists[index].updatedAt = new Date().toISOString();
      this.savePlaylists(playlists);
      console.log("[PlaylistService] Updated banner for:", id);
    }
  }

  addTrackToPlaylist(playlistId: string, track: Track, prepend: boolean = false): boolean {
    const playlists = this.getPlaylists();
    const playlist = playlists.find((p) => p.id === playlistId);
    if (!playlist) return false;

    // Check if track already exists
    if (playlist.tracks?.some((t) => t.id === track.id)) {
      console.log("[PlaylistService] Track already in playlist");
      return false;
    }

    // Clean track URLs before adding
    const cleanTrack: Track = {
      ...track,
      artworkUrl: decodeUrlEntities(track.artworkUrl || ""),
      streamUrl: decodeUrlEntities(track.streamUrl || ""),
    };

    playlist.tracks = playlist.tracks || [];
    
    // Add to beginning or end based on prepend flag
    if (prepend) {
      playlist.tracks.unshift(cleanTrack);
      console.log("[PlaylistService] Prepended track to playlist:", cleanTrack.title);
    } else {
      playlist.tracks.push(cleanTrack);
      console.log("[PlaylistService] Added track to playlist:", cleanTrack.title);
    }
    
    playlist.updatedAt = new Date().toISOString();
    this.savePlaylists(playlists);
    return true;
  }

  removeTrackFromPlaylist(playlistId: string, trackId: string): void {
    const playlists = this.getPlaylists();
    const playlist = playlists.find((p) => p.id === playlistId);
    if (!playlist) return;

    playlist.tracks = (playlist.tracks || []).filter((t) => t.id !== trackId);
    playlist.updatedAt = new Date().toISOString();
    this.savePlaylists(playlists);
    console.log("[PlaylistService] Removed track from playlist");
  }

  // Update artwork for a specific track in a playlist
  updateTrackArtwork(playlistId: string, trackId: string, artworkUrl: string): void {
    const playlists = this.getPlaylists();
    const playlist = playlists.find((p) => p.id === playlistId);
    if (!playlist) return;

    const track = playlist.tracks?.find((t) => t.id === trackId);
    if (track) {
      track.artworkUrl = artworkUrl;
      playlist.updatedAt = new Date().toISOString();
      this.savePlaylists(playlists);
      console.log("[PlaylistService] Updated track artwork:", trackId);
    }
  }

  // Batch update artworks for multiple tracks
  updateTrackArtworks(playlistId: string, artworks: Record<string, string>): void {
    const playlists = this.getPlaylists();
    const playlist = playlists.find((p) => p.id === playlistId);
    if (!playlist) return;

    let updated = false;
    for (const [trackId, artworkUrl] of Object.entries(artworks)) {
      const track = playlist.tracks?.find((t) => t.id === trackId);
      if (track && artworkUrl) {
        track.artworkUrl = artworkUrl;
        updated = true;
      }
    }

    if (updated) {
      playlist.updatedAt = new Date().toISOString();
      this.savePlaylists(playlists);
      console.log("[PlaylistService] Batch updated track artworks");
    }
  }

  getPlaylistCount(): number {
    return this.getPlaylists().length;
  }

  // Импорт плейлиста из JSON
  importFromJSON(jsonData: any): Playlist | null {
    try {
      console.log("[PlaylistService] Importing JSON:", jsonData);
      
      // Support both 'songs' and 'tracks' arrays
      const songsArray = jsonData.songs || jsonData.tracks || [];
      
      // Проверяем формат данных - нужен хотя бы name и треки
      if (!jsonData.name && !jsonData.id) {
        console.error("[PlaylistService] Invalid JSON format - no name or id");
        return null;
      }
      
      if (songsArray.length === 0) {
        console.error("[PlaylistService] Invalid JSON format - no tracks");
        return null;
      }

      const playlists = this.getPlaylists();
      
      // Generate ID if not present
      const playlistId = jsonData.id || `imported-${Date.now()}`;
      
      // Проверяем не существует ли уже плейлист с таким ID
      const existingIndex = playlists.findIndex((p) => p.id === playlistId);
      
      // Определяем источник по ID или первому треку
      let source = "soundcloud";
      if (playlistId.startsWith("soundcloud_") || playlistId.includes("soundcloud")) {
        source = "soundcloud";
      } else if (playlistId.startsWith("youtube_") || playlistId.includes("youtube")) {
        source = "youtube";
      } else if (songsArray[0]?.source) {
        source = songsArray[0].source;
      } else if (songsArray[0]?.platform) {
        source = songsArray[0].platform;
      }
      
      // Конвертируем songs в tracks
      const tracks: Track[] = songsArray.map((song: any, index: number) => {
        // Get artwork URL from various possible fields
        const rawArtwork = song.coverArt || song.artworkUrl || song.artwork || song.cover || song.thumbnail || song.image || "";
        const artworkUrl = decodeUrlEntities(rawArtwork);
        
        // Get stream URL from various possible fields
        const rawStream = song.url || song.streamUrl || song.stream || song.audioUrl || "";
        const streamUrl = decodeUrlEntities(rawStream);
        
        // Get platform/source
        const trackPlatform = song.source || song.platform || source;
        
        // Generate ID if not present
        const trackId = song.id || `imported-track-${Date.now()}-${index}`;
        
        console.log(`[PlaylistService] Track ${index}: "${song.title}" - artwork: ${artworkUrl ? artworkUrl.substring(0, 50) + '...' : 'EMPTY'}, stream: ${streamUrl ? streamUrl.substring(0, 50) + '...' : 'EMPTY'}`);
        
        return {
          id: trackId,
          title: song.title || "Без названия",
          artist: song.artist || "Неизвестный",
          duration: song.duration || 0,
          artworkUrl: artworkUrl,
          streamUrl: streamUrl,
          source: trackPlatform,
          platform: trackPlatform,
        };
      });

      const playlist: Playlist = {
        id: playlistId,
        name: jsonData.name || "Импортированный плейлист",
        description: jsonData.description || `Импортировано из ${source === "soundcloud" ? "SoundCloud" : source === "youtube" ? "YouTube" : "внешнего источника"} (${tracks.length} треков)`,
        tracks: tracks,
        coverUrl: tracks[0]?.artworkUrl || "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        source: source,
        sourceUrl: jsonData.sourceUrl || jsonData.url || jsonData.permalink_url || undefined, // Save source URL for refreshing
      };

      if (existingIndex !== -1) {
        playlists[existingIndex] = playlist;
        console.log("[PlaylistService] Updated existing playlist:", playlist.name);
      } else {
        playlists.push(playlist);
        console.log("[PlaylistService] Imported new playlist:", playlist.name);
      }

      console.log("[PlaylistService] Total tracks imported:", tracks.length);
      console.log("[PlaylistService] First track artwork:", tracks[0]?.artworkUrl?.substring(0, 80));
      console.log("[PlaylistService] First track stream:", tracks[0]?.streamUrl?.substring(0, 80));

      this.savePlaylists(playlists);
      return playlist;
    } catch (e) {
      console.error("[PlaylistService] Error importing JSON:", e);
      return null;
    }
  }

  // Импорт из файла
  async importFromFile(file: File): Promise<Playlist | null> {
    try {
      const text = await file.text();
      const jsonData = JSON.parse(text);
      return this.importFromJSON(jsonData);
    } catch (e) {
      console.error("[PlaylistService] Error reading file:", e);
      return null;
    }
  }

  // Force refresh all playlists (re-save to apply URL cleaning)
  refreshAllPlaylists(): void {
    const playlists = this.getPlaylists();
    this.savePlaylists(playlists);
    console.log("[PlaylistService] Refreshed all playlists, cleaned invalid URLs");
  }
}

export const playlistService = new PlaylistService();

// Expose to console for debugging
if (typeof window !== 'undefined') {
  (window as any).harmonixPlaylistService = {
    refresh: () => playlistService.refreshAllPlaylists(),
    clear: () => {
      localStorage.removeItem('harmonix-playlists');
      console.log("[PlaylistService] Cleared all playlists");
      window.location.reload();
    }
  };
}
