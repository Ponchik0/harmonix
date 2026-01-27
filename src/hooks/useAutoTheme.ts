import { useEffect, useRef } from 'react';
import { usePlayerStore } from '../stores/playerStore';
import { usePlayerSettingsStore } from '../stores/playerSettingsStore';
import { useThemeStore } from '../stores/themeStore';
import { colorExtractorService } from '../services/ColorExtractorService';

export function useAutoTheme() {
  // Use selector to only subscribe to currentTrack changes, not progress
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const { autoThemeFromArtwork } = usePlayerSettingsStore();
  const { setDynamicAccent } = useThemeStore();
  const lastArtworkRef = useRef<string | null>(null);

  useEffect(() => {
    if (!autoThemeFromArtwork) {
      // Reset to default theme accent when disabled
      setDynamicAccent(null);
      lastArtworkRef.current = null;
      return;
    }

    const artworkUrl = currentTrack?.artworkUrl;
    
    // Skip if same artwork
    if (artworkUrl === lastArtworkRef.current) return;
    lastArtworkRef.current = artworkUrl || null;

    if (!artworkUrl) {
      setDynamicAccent(null);
      return;
    }

    // Extract color from artwork
    const extractColor = async () => {
      try {
        const color = await colorExtractorService.extractDominantColor(artworkUrl);
        if (color && autoThemeFromArtwork) {
          console.log('[AutoTheme] Extracted color:', color, 'from:', artworkUrl);
          setDynamicAccent(color);
        }
      } catch (e) {
        console.error('[AutoTheme] Failed to extract color:', e);
      }
    };

    extractColor();
  }, [currentTrack?.artworkUrl, autoThemeFromArtwork, setDynamicAccent]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setDynamicAccent(null);
    };
  }, [setDynamicAccent]);
}
