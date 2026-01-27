/**
 * Share Service
 * Создание уникальных ссылок для шаринга треков
 */

import type { Track } from "../types";

// Encode track data to base64
function encodeTrackData(track: Track): string {
  const data = {
    id: track.id,
    title: track.title,
    artist: track.artist,
    artworkUrl: track.artworkUrl,
    platform: track.platform,
    url: track.url,
    duration: track.duration,
  };
  
  // Use base64 encoding
  const json = JSON.stringify(data);
  const encoded = btoa(unescape(encodeURIComponent(json)));
  return encoded;
}

// Decode track data from base64
export function decodeTrackData(encoded: string): Partial<Track> | null {
  try {
    const json = decodeURIComponent(escape(atob(encoded)));
    return JSON.parse(json);
  } catch (e) {
    console.error("[ShareService] Failed to decode track data:", e);
    return null;
  }
}

class ShareService {
  /**
   * Generate a shareable link for a track
   */
  generateShareLink(track: Track): string {
    const encoded = encodeTrackData(track);
    // Use harmonix:// protocol for deep linking
    return `harmonix://track/${encoded}`;
  }

  /**
   * Generate a web-based share link (for copying)
   * This creates a link that can be opened in browser which redirects to app
   */
  generateWebShareLink(track: Track): string {
    const encoded = encodeTrackData(track);
    // For web share, we could use a redirect service or just the protocol link
    // Since we don't have a web service, we'll use the protocol link
    return `harmonix://track/${encoded}`;
  }

  /**
   * Copy share link to clipboard
   */
  async copyShareLink(track: Track): Promise<boolean> {
    try {
      const link = this.generateShareLink(track);
      await navigator.clipboard.writeText(link);
      
      window.dispatchEvent(
        new CustomEvent("show-toast", {
          detail: { 
            message: "Ссылка скопирована!", 
            type: "success" 
          },
        })
      );
      
      return true;
    } catch (error) {
      console.error("[ShareService] Failed to copy link:", error);
      
      window.dispatchEvent(
        new CustomEvent("show-toast", {
          detail: { 
            message: "Не удалось скопировать ссылку", 
            type: "error" 
          },
        })
      );
      
      return false;
    }
  }

  /**
   * Native share (uses Web Share API if available)
   */
  async nativeShare(track: Track): Promise<boolean> {
    const link = this.generateShareLink(track);
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${track.artist} - ${track.title}`,
          text: `Слушай "${track.title}" от ${track.artist} в Harmonix!`,
          url: link,
        });
        return true;
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("[ShareService] Native share failed:", error);
        }
        return false;
      }
    }
    
    // Fallback to copy
    return this.copyShareLink(track);
  }
}

export const shareService = new ShareService();
