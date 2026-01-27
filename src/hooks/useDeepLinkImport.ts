import { useEffect, useState } from "react";
import { playlistImportService } from "../services/PlaylistImportService";
import { useNavigationStore } from "../stores/navigationStore";
import { decodeTrackData } from "../services/ShareService";
import { audioService } from "../services/AudioService";
import { soundCloudService } from "../services/SoundCloudService";
import type { Track } from "../types";

export function useDeepLinkImport() {
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    name?: string;
    trackCount?: number;
    error?: string;
  } | null>(null);

  useEffect(() => {
    const handleImport = async (code: string) => {
      console.log("[DeepLinkImport] Received code:", code);
      setImporting(true);
      setImportResult(null);

      try {
        const result = await playlistImportService.importPlaylist(code);
        console.log("[DeepLinkImport] Import result:", result);

        if (result.success) {
          setImportResult({
            success: true,
            name: result.name || "Плейлист",
            trackCount: result.trackCount || 0,
          });
          // Dispatch event to refresh playlists in UI
          window.dispatchEvent(new CustomEvent("playlists-updated"));
          // Navigate to library to show imported playlist
          useNavigationStore.getState().navigate("library");
        } else {
          setImportResult({
            success: false,
            error: result.error,
          });
        }
      } catch (err) {
        console.error("[DeepLinkImport] Error:", err);
        setImportResult({
          success: false,
          error: "Ошибка импорта",
        });
      }
      
      setImporting(false);
    };

    // Handle track deep link
    const handleTrackLink = async (trackData: string) => {
      console.log("[DeepLinkImport] Received track data");
      
      try {
        const decodedTrack = decodeTrackData(trackData);
        if (!decodedTrack || !decodedTrack.id) {
          window.dispatchEvent(
            new CustomEvent("show-toast", {
              detail: { message: "Некорректная ссылка на трек", type: "error" },
            })
          );
          return;
        }

        console.log("[DeepLinkImport] Decoded track:", decodedTrack.title);
        
        // Show loading toast
        window.dispatchEvent(
          new CustomEvent("show-toast", {
            detail: { message: `Загрузка: ${decodedTrack.title}`, type: "info" },
          })
        );

        // Try to get stream URL
        let streamUrl: string | null = null;
        
        if (decodedTrack.platform === "soundcloud" && decodedTrack.id) {
          const trackId = decodedTrack.id.replace("sc-", "");
          streamUrl = await soundCloudService.getStreamUrl(trackId);
        }

        if (!streamUrl) {
          // Try fallback
          const { streamFallbackService } = await import("../services/StreamFallbackService");
          const result = await streamFallbackService.getStreamUrl(decodedTrack as Track);
          if (result.streamUrl) {
            streamUrl = result.streamUrl;
            // Use fallback track info if available
            if (result.fallbackTrack) {
              decodedTrack.artworkUrl = result.fallbackTrack.artworkUrl || decodedTrack.artworkUrl;
            }
          }
        }

        if (streamUrl) {
          const track: Track = {
            id: decodedTrack.id || `shared-${Date.now()}`,
            title: decodedTrack.title || "Unknown",
            artist: decodedTrack.artist || "Unknown",
            artworkUrl: decodedTrack.artworkUrl,
            streamUrl,
            platform: decodedTrack.platform || "soundcloud",
            duration: decodedTrack.duration ?? 0,
            url: decodedTrack.url,
            metadata: decodedTrack.metadata || {},
          };

          audioService.load(track);
          useNavigationStore.getState().navigate("player");

          window.dispatchEvent(
            new CustomEvent("show-toast", {
              detail: { message: `Играет: ${track.title}`, type: "success" },
            })
          );
        } else {
          window.dispatchEvent(
            new CustomEvent("show-toast", {
              detail: { message: "Не удалось загрузить трек", type: "error" },
            })
          );
        }
      } catch (error) {
        console.error("[DeepLinkImport] Track link error:", error);
        window.dispatchEvent(
          new CustomEvent("show-toast", {
            detail: { message: "Ошибка загрузки трека", type: "error" },
          })
        );
      }
    };

    // Listen for deep link import events from Electron
    if (window.electronAPI?.deepLink) {
      console.log("[DeepLinkImport] Registering listeners");
      window.electronAPI.deepLink.onImport(handleImport);
      window.electronAPI.deepLink.onTrack(handleTrackLink);
    }

    // Also listen for manual import events (from UI)
    const handleManualImport = (e: CustomEvent) => {
      handleImport(e.detail.code);
    };
    window.addEventListener("manual-playlist-import", handleManualImport as EventListener);

    return () => {
      if (window.electronAPI?.deepLink) {
        window.electronAPI.deepLink.removeImportListener();
        window.electronAPI.deepLink.removeTrackListener();
      }
      window.removeEventListener("manual-playlist-import", handleManualImport as EventListener);
    };
  }, []);

  const clearResult = () => setImportResult(null);

  return { importing, importResult, clearResult };
}
