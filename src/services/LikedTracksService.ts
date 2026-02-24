// Simple localStorage-based service for liked tracks
import type { Track } from "../types";

const LIKED_TRACKS_KEY = "harmonix-liked-tracks";
const LIKED_SOURCE_URL_KEY = "harmonix-liked-source-url";

export interface LikedTrack extends Track {
  likedAt: number;
}

// Helper to decode HTML entities in URLs
const decodeUrlEntities = (url: string): string => {
  if (!url) return "";
  
  let decoded = url;
  let previous = "";
  
  while (decoded !== previous) {
    previous = decoded;
    decoded = decoded.replace(/&amp;/g, "&");
    decoded = decoded.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => 
      String.fromCharCode(parseInt(hex, 16))
    );
    decoded = decoded.replace(/&#(\d+);/g, (_, dec) => 
      String.fromCharCode(parseInt(dec, 10))
    );
    decoded = decoded
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&nbsp;/g, " ");
  }
  
  return decoded.replace(/\[link_removed\]/g, "").trim();
};

class LikedTracksService {
  private getLikedTracksFromStorage(): LikedTrack[] {
    try {
      const data = localStorage.getItem(LIKED_TRACKS_KEY);
      if (!data) return [];
      const tracks = JSON.parse(data);
      // Fix encoded URLs on read
      return tracks.map((t: any) => ({
        ...t,
        artworkUrl: decodeUrlEntities(t.artworkUrl || ""),
        streamUrl: decodeUrlEntities(t.streamUrl || ""),
      }));
    } catch (e) {
      console.error("[LikedTracksService] Error reading:", e);
      return [];
    }
  }

  private saveLikedTracksToStorage(tracks: LikedTrack[]): void {
    try {
      localStorage.setItem(LIKED_TRACKS_KEY, JSON.stringify(tracks));
    } catch (e) {
      console.error("[LikedTracksService] Error saving:", e);
    }
  }

  // Get/Set source URL for liked tracks (for refreshing)
  getSourceUrl(): string | null {
    try {
      return localStorage.getItem(LIKED_SOURCE_URL_KEY);
    } catch {
      return null;
    }
  }

  setSourceUrl(url: string): void {
    try {
      localStorage.setItem(LIKED_SOURCE_URL_KEY, url);
      console.log("[LikedTracksService] Saved source URL:", url);
    } catch (e) {
      console.error("[LikedTracksService] Error saving source URL:", e);
    }
  }

  getLikedTracks(): LikedTrack[] {
    return this.getLikedTracksFromStorage();
  }

  isLiked(trackId: string): boolean {
    const tracks = this.getLikedTracksFromStorage();
    return tracks.some(t => t.id === trackId);
  }

  addLikedTrack(track: Track): void {
    const tracks = this.getLikedTracksFromStorage();
    
    // Check if already liked
    if (tracks.some(t => t.id === track.id)) {
      console.log("[LikedTracksService] Track already liked:", track.title);
      return;
    }

    const likedTrack: LikedTrack = {
      ...track,
      likedAt: Date.now(),
    };

    tracks.unshift(likedTrack); // Add to beginning
    this.saveLikedTracksToStorage(tracks);
    console.log("[LikedTracksService] Added:", track.title);
  }

  removeLikedTrack(trackId: string): void {
    const tracks = this.getLikedTracksFromStorage();
    const filtered = tracks.filter(t => t.id !== trackId);
    this.saveLikedTracksToStorage(filtered);
    console.log("[LikedTracksService] Removed track:", trackId);
  }

  toggleLike(track: Track): boolean {
    if (this.isLiked(track.id)) {
      this.removeLikedTrack(track.id);
      return false;
    } else {
      this.addLikedTrack(track);
      return true;
    }
  }

  getCount(): number {
    return this.getLikedTracksFromStorage().length;
  }
}

export const likedTracksService = new LikedTracksService();
