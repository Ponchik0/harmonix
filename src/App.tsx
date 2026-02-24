import { useEffect, useCallback } from "react";
import { ThemeProvider } from "./providers/ThemeProvider";
import { MainLayout } from "./components/layout/MainLayout";
import { AuthPage } from "./components/auth/AuthPage";
import { ToastContainer, showToast } from "./components/common/Toast";
import { UpdateNotification } from "./components/common/UpdateNotification";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useDeepLinkImport } from "./hooks/useDeepLinkImport";
import { useAutoTheme } from "./hooks/useAutoTheme";
import { useUserStore } from "./stores/userStore";
import { usePlayerStore } from "./stores/playerStore";
import { storageService } from "./services/StorageService";
import { dataSyncService } from "./services/DataSyncService";
import { soundCloudService } from "./services/SoundCloudService";
import { youtubeService } from "./services/YouTubeService";
import { vkMusicService } from "./services/VKMusicService";
import { discordRPCService } from "./services/DiscordRPCService";
import { supabaseService } from "./services/SupabaseService";
import { usePlayerSettingsStore } from "./stores/playerSettingsStore";
import { setProfilePinsUserId } from "./stores/profilePinsStore";
import { setUsernamesUserId } from "./stores/usernamesStore";

// Background Image Component
function BackgroundImage() {
  const {
    backgroundImageEnabled,
    customBackgroundUrl,
    customBackgroundFile,
    backgroundImageOpacity,
    backgroundImageBlur,
  } = usePlayerSettingsStore();

  const backgroundUrl = customBackgroundFile || customBackgroundUrl;

  if (!backgroundImageEnabled || !backgroundUrl) return null;

  return (
    <>
      {/* Background Image */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 0,
          backgroundImage: `url('${backgroundUrl}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          opacity: backgroundImageOpacity / 100,
          filter: `blur(${backgroundImageBlur}px)`,
          transform: "scale(1.1)",
          pointerEvents: "none",
        }}
      />
      {/* Gradient Overlay */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 1,
          background: "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.7) 100%)",
          pointerEvents: "none",
        }}
      />
    </>
  );
}

// Font mapping for applying fonts
const fontMap: Record<string, string> = {
  default: "system-ui, sans-serif",
  inter: '"Inter", sans-serif',
  roboto: '"Roboto", sans-serif',
  poppins: '"Poppins", sans-serif',
  nunito: '"Nunito", sans-serif',
  montserrat: '"Montserrat", sans-serif',
  opensans: '"Open Sans", sans-serif',
  raleway: '"Raleway", sans-serif',
  ubuntu: '"Ubuntu", sans-serif',
  comfortaa: '"Comfortaa", sans-serif',
  quicksand: '"Quicksand", sans-serif',
  lexend: '"Lexend", sans-serif',
  outfit: '"Outfit", sans-serif',
  sora: '"Sora", sans-serif',
  jetbrains: '"JetBrains Mono", monospace',
  fira: '"Fira Code", monospace',
  orbitron: '"Orbitron", sans-serif',
  audiowide: '"Audiowide", sans-serif',
  rajdhani: '"Rajdhani", sans-serif',
  exo2: '"Exo 2", sans-serif',
  teko: '"Teko", sans-serif',
  russo: '"Russo One", sans-serif',
};

interface AppProps {
  onReady?: () => void;
}

function App({ onReady }: AppProps) {
  useKeyboardShortcuts();
  useAutoTheme();
  const { importResult, clearResult } = useDeepLinkImport();

  // Show toast when import completes
  useEffect(() => {
    if (importResult) {
      if (importResult.success) {
        showToast(`Плейлист "${importResult.name}" импортирован (${importResult.trackCount} треков)`, "success");
      } else {
        showToast(importResult.error || "Ошибка импорта", "error");
      }
      clearResult();
    }
  }, [importResult, clearResult]);
  const { isAuthenticated, user } = useUserStore();
  const { fontStyle, borderRadius, uiScale } = usePlayerSettingsStore();

  // Set profile pins userId when user changes and start heartbeat
  useEffect(() => {
    if (user?.uid) {
      setProfilePinsUserId(user.uid);
      setUsernamesUserId(user.uid);
      // Start heartbeat for online status tracking
      supabaseService.updateLastSeen(user.uid);
      const heartbeatInterval = setInterval(() => {
        supabaseService.updateLastSeen(user.uid);
      }, 2 * 60 * 1000); // Every 2 minutes
      
      // Cleanup on unmount or user change
      return () => {
        clearInterval(heartbeatInterval);
        supabaseService.setOffline(user.uid);
      };
    } else {
      setProfilePinsUserId(null);
      setUsernamesUserId(null);
    }
  }, [user?.uid]);

  // Apply font, border radius, and UI scale on load and when changed
  useEffect(() => {
    const font = fontMap[fontStyle] || fontMap.default;
    document.documentElement.style.fontFamily = font;
    document.body.style.fontFamily = font;
  }, [fontStyle]);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--border-radius-base",
      `${borderRadius}px`
    );
  }, [borderRadius]);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--ui-scale",
      uiScale.toString()
    );
    document.documentElement.style.fontSize = `${16 * uiScale}px`;
  }, [uiScale]);

  const handleReady = useCallback(() => {
    // First hide loading screen
    onReady?.();
    // Then restore last track after a small delay (after loading screen is hidden)
    setTimeout(() => {
      usePlayerStore.getState().restoreLastTrack();
    }, 600);
  }, [onReady]);

  useEffect(() => {
    const init = async () => {
      // Initialize persistent storage sync FIRST 
      // (restores localStorage & IndexedDB from disk before anything reads them)
      await dataSyncService.init();

      await storageService.init();
      // Initialize all music services
      await soundCloudService.init();
      await youtubeService.init();
      await vkMusicService.init();
      
      // Initialize Yandex Music
      const { yandexMusicService } = await import('./services/YandexMusicService');
      await yandexMusicService.init();
      
      // Sync volume from playerStore to audioService
      const { audioService } = await import('./services/AudioService');
      const savedVolume = usePlayerStore.getState().volume;
      console.log('[App] Syncing volume on init:', savedVolume);
      audioService.setVolume(savedVolume);
      
      // Initialize Discord RPC (ignore errors)
      try {
        discordRPCService.connect();
      } catch (e) {
        console.log("[App] Discord RPC init skipped:", e);
      }
      // Notify that app is ready (track will be restored after loading screen hides)
      handleReady();

      // Save IndexedDB backup after everything is initialized
      // (delayed to avoid blocking startup)
      setTimeout(() => {
        dataSyncService.saveIndexedDBToDisk();
      }, 10000);
    };
    init();
  }, [handleReady]);

  // Handle custom toast events
  useEffect(() => {
    const handleShowToast = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { message, type } = customEvent.detail;
      showToast(message, type);
    };

    window.addEventListener('show-toast', handleShowToast);
    return () => window.removeEventListener('show-toast', handleShowToast);
  }, []);

  // Update Discord RPC when track changes
  useEffect(() => {
    const unsubscribe = usePlayerStore.subscribe((state, prevState) => {
      const { currentTrack, isPlaying, progress } = state;
      const prevTrack = prevState.currentTrack;
      const wasPlaying = prevState.isPlaying;

      // Skip if Discord RPC is not enabled
      if (!discordRPCService.isEnabled()) return;

      // Get custom artwork from settings
      const { customArtworkUrl, customArtworkEnabled, discordUseCustomArtwork } = usePlayerSettingsStore.getState();
      // Use custom artwork only if both customArtworkEnabled AND discordUseCustomArtwork are true
      const artworkUrl = (customArtworkEnabled && discordUseCustomArtwork && customArtworkUrl) ? customArtworkUrl : currentTrack?.artworkUrl;

      // Track changed
      if (currentTrack?.id !== prevTrack?.id) {
        if (currentTrack) {
          discordRPCService.onTrackChange(
            {
              id: currentTrack.id,
              title: currentTrack.title,
              artist: currentTrack.artist,
              artworkUrl: artworkUrl,
              duration: currentTrack.duration,
              source: currentTrack.platform as any,
              url: currentTrack.url,
            },
            0,
            isPlaying
          );
        } else {
          discordRPCService.onTrackChange(null);
        }
      }
      // Play/pause changed
      else if (isPlaying !== wasPlaying && currentTrack) {
        if (isPlaying) {
          const currentTime = progress * (currentTrack.duration || 0);
          discordRPCService.onResume(currentTime);
        } else {
          discordRPCService.onPause();
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Update Discord RPC when custom artwork settings change
  useEffect(() => {
    const unsubscribe = usePlayerSettingsStore.subscribe((state, prevState) => {
      const { customArtworkUrl, customArtworkEnabled, discordUseCustomArtwork } = state;
      const prevCustomArtworkUrl = prevState.customArtworkUrl;
      const prevCustomArtworkEnabled = prevState.customArtworkEnabled;
      const prevDiscordUseCustomArtwork = prevState.discordUseCustomArtwork;

      // Check if any custom artwork setting changed
      const artworkSettingsChanged = 
        customArtworkUrl !== prevCustomArtworkUrl ||
        customArtworkEnabled !== prevCustomArtworkEnabled ||
        discordUseCustomArtwork !== prevDiscordUseCustomArtwork;

      if (artworkSettingsChanged && discordRPCService.isEnabled()) {
        const currentTrack = usePlayerStore.getState().currentTrack;
        const isPlaying = usePlayerStore.getState().isPlaying;
        const progress = usePlayerStore.getState().progress;

        if (currentTrack) {
          // Determine which artwork to use
          const artworkUrl = (customArtworkEnabled && discordUseCustomArtwork && customArtworkUrl) 
            ? customArtworkUrl 
            : currentTrack.artworkUrl;

          // Update Discord with new artwork
          discordRPCService.onTrackChange(
            {
              id: currentTrack.id,
              title: currentTrack.title,
              artist: currentTrack.artist,
              artworkUrl: artworkUrl,
              duration: currentTrack.duration,
              source: currentTrack.platform as any,
              url: currentTrack.url,
            },
            progress * (currentTrack.duration || 0),
            isPlaying
          );
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Check maintenance mode
  const isMaintenanceMode = localStorage.getItem("harmonix-maintenance") === "true";

  return (
    <ThemeProvider>
      <BackgroundImage />
      {isAuthenticated ? <MainLayout /> : <AuthPage />}
      <ToastContainer />
      <UpdateNotification />
      
      {/* Maintenance Mode Banner */}
      {isMaintenanceMode && isAuthenticated && (
        <div className="fixed top-0 left-0 right-0 z-[100] px-4 py-2 text-center text-sm font-medium"
          style={{ background: 'linear-gradient(90deg, #EF4444, #F97316)', color: '#fff' }}>
          ⚠️ Режим обслуживания активен. Некоторые функции могут быть недоступны.
        </div>
      )}
    </ThemeProvider>
  );
}

export default App;
