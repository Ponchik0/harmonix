/**
 * React Hook for Discord Rich Presence
 * Communicates with Electron main process via IPC
 */

import { useEffect, useCallback, useRef } from "react";
import { usePlayerStore } from "../stores/playerStore";
import type { Track } from "../types";

// ============================================
// TYPES
// ============================================

export interface DiscordActivity {
  details?: string;
  state?: string;
  largeImageKey?: string;
  largeImageText?: string;
  smallImageKey?: string;
  smallImageText?: string;
  startTimestamp?: number;
  endTimestamp?: number;
  buttons?: Array<{ label: string; url: string }>;
}

export interface DiscordStatus {
  connected: boolean;
  mode: "gateway" | "rpc" | "none";
  hasToken: boolean;
  enabled: boolean;
}

// Source icons mapping
const SOURCE_ICONS: Record<string, { name: string; icon: string }> = {
  soundcloud: { name: "SoundCloud", icon: "soundcloud" },
  youtube: { name: "YouTube", icon: "youtube" },
  vk: { name: "VK Music", icon: "vk" },
  spotify: { name: "Spotify", icon: "spotify" },
  local: { name: "Local File", icon: "local" },
};

// ============================================
// ELECTRON API HELPERS
// ============================================

const isElectron = (): boolean => {
  return typeof window !== "undefined" && !!(window as any).electronAPI?.discord;
};

const discordAPI = () => {
  if (!isElectron()) return null;
  return (window as any).electronAPI.discord;
};

// ============================================
// PUBLIC API FUNCTIONS
// ============================================

export async function connectDiscord(): Promise<DiscordStatus | null> {
  const api = discordAPI();
  if (!api) return null;

  try {
    return await api.connect();
  } catch (error) {
    console.error("[useDiscordRPC] Connect error:", error);
    return null;
  }
}

export async function getDiscordStatus(): Promise<DiscordStatus | null> {
  const api = discordAPI();
  if (!api) return null;

  try {
    return await api.getStatus();
  } catch (error) {
    console.error("[useDiscordRPC] Status error:", error);
    return null;
  }
}

export async function setDiscordEnabled(enabled: boolean): Promise<boolean> {
  const api = discordAPI();
  if (!api) return false;

  try {
    const result = await api.setEnabled(enabled);
    return result?.success ?? false;
  } catch (error) {
    console.error("[useDiscordRPC] SetEnabled error:", error);
    return false;
  }
}

export async function setDiscordActivity(activity: DiscordActivity): Promise<boolean> {
  const api = discordAPI();
  if (!api) return false;

  try {
    const result = await api.setActivity(activity);
    return result?.success ?? false;
  } catch (error) {
    console.error("[useDiscordRPC] SetActivity error:", error);
    return false;
  }
}

export async function clearDiscordActivity(): Promise<boolean> {
  const api = discordAPI();
  if (!api) return false;

  try {
    const result = await api.clearActivity();
    return result?.success ?? false;
  } catch (error) {
    console.error("[useDiscordRPC] ClearActivity error:", error);
    return false;
  }
}

export async function setDiscordToken(token: string): Promise<boolean> {
  const api = discordAPI();
  if (!api) return false;

  try {
    const result = await api.setToken(token);
    return result?.success ?? false;
  } catch (error) {
    console.error("[useDiscordRPC] SetToken error:", error);
    return false;
  }
}

export async function removeDiscordToken(): Promise<boolean> {
  const api = discordAPI();
  if (!api) return false;

  try {
    const result = await api.removeToken();
    return result?.success ?? false;
  } catch (error) {
    console.error("[useDiscordRPC] RemoveToken error:", error);
    return false;
  }
}

export async function autoExtractDiscordToken(): Promise<boolean> {
  const api = discordAPI();
  if (!api) return false;

  try {
    const result = await api.autoExtract();
    return result?.found ?? false;
  } catch (error) {
    console.error("[useDiscordRPC] AutoExtract error:", error);
    return false;
  }
}

// ============================================
// ACTIVITY BUILDER
// ============================================

export function buildActivity(
  track: Track,
  currentTime: number,
  isPlaying: boolean
): DiscordActivity {
  const sourceConfig = SOURCE_ICONS[track.platform || "local"] || SOURCE_ICONS.local;

  // Normalize duration to seconds
  const durationSec = track.duration > 1000 ? track.duration / 1000 : track.duration;

  const activity: DiscordActivity = {
    details: track.title.slice(0, 128),
    state: `by ${track.artist}`.slice(0, 128),
    largeImageKey: track.artworkUrl || "app",
    largeImageText: "Harmonix",
    smallImageKey: isPlaying ? "play" : "pause",
    smallImageText: isPlaying ? sourceConfig.name : "Paused",
  };

  // Add timestamps for progress bar (only when playing)
  if (isPlaying && durationSec > 0) {
    const now = Math.floor(Date.now() / 1000);
    const trackStart = now - Math.floor(currentTime);
    const trackEnd = trackStart + Math.floor(durationSec);

    activity.startTimestamp = trackStart;
    activity.endTimestamp = trackEnd;
  }

  // Add button
  activity.buttons = [
    { label: "Скачать Harmonix", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  ];

  return activity;
}

// ============================================
// REACT HOOK
// ============================================

interface UseDiscordRPCOptions {
  enabled?: boolean;
  updateOnProgress?: boolean;
  progressUpdateInterval?: number;
}

export function useDiscordRPC(options: UseDiscordRPCOptions = {}) {
  const {
    enabled = true,
    updateOnProgress = false,
    progressUpdateInterval = 15000, // Update every 15 seconds
  } = options;

  // Use selectors to prevent re-renders from progress updates
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  // Only subscribe to progress if updateOnProgress is enabled
  const progress = usePlayerStore((state) => updateOnProgress ? state.progress : 0);

  const lastTrackIdRef = useRef<string | null>(null);
  const lastIsPlayingRef = useRef<boolean>(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Update Discord activity
  const updateActivity = useCallback(
    async (track: Track | null, playing: boolean, currentProgress: number) => {
      if (!enabled || !isElectron()) return;

      if (!track) {
        await clearDiscordActivity();
        return;
      }

      const currentTime = currentProgress * track.duration;
      const activity = buildActivity(track, currentTime, playing);
      await setDiscordActivity(activity);
    },
    [enabled]
  );

  // Handle track change
  useEffect(() => {
    if (!enabled) return;

    const trackChanged = currentTrack?.id !== lastTrackIdRef.current;
    const playStateChanged = isPlaying !== lastIsPlayingRef.current;

    if (trackChanged || playStateChanged) {
      lastTrackIdRef.current = currentTrack?.id || null;
      lastIsPlayingRef.current = isPlaying;
      updateActivity(currentTrack, isPlaying, progress);
    }
  }, [currentTrack?.id, isPlaying, enabled, updateActivity, progress]);

  // Periodic progress updates (optional)
  useEffect(() => {
    if (!enabled || !updateOnProgress || !isPlaying || !currentTrack) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      const { currentTrack, isPlaying, progress } = usePlayerStore.getState();
      if (currentTrack && isPlaying) {
        updateActivity(currentTrack, isPlaying, progress);
      }
    }, progressUpdateInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, updateOnProgress, isPlaying, currentTrack, progressUpdateInterval, updateActivity]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    updateActivity,
    clearActivity: clearDiscordActivity,
    setEnabled: setDiscordEnabled,
    getStatus: getDiscordStatus,
    connect: connectDiscord,
    setToken: setDiscordToken,
    removeToken: removeDiscordToken,
    autoExtract: autoExtractDiscordToken,
    isElectron: isElectron(),
  };
}

export default useDiscordRPC;
