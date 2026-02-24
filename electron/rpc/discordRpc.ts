/**
 * Discord Rich Presence Module for Harmonix
 * 
 * Uses @xhayper/discord-rpc for "Listening to" status with progress bar
 * Based on pear-desktop implementation
 */

import { Client as DiscordClient } from "@xhayper/discord-rpc";
import { ActivityType, StatusDisplayType } from "discord-api-types/v10";
import Store from "electron-store";

import type { SetActivity } from "@xhayper/discord-rpc/dist/structures/ClientUser";

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
  // New fields for progress bar
  songDuration?: number;
  elapsedSeconds?: number;
  isPaused?: boolean;
  trackUrl?: string;
  artistUrl?: string;
}

export interface DiscordStatus {
  connected: boolean;
  mode: "listening" | "rpc" | "none";
  hasToken: boolean;
  enabled: boolean;
}

// ============================================
// CONSTANTS
// ============================================

// Register your own Discord Application at https://discord.com/developers/applications
// and replace this with your Client ID
const DISCORD_CLIENT_ID = process.env.VITE_DISCORD_CLIENT_ID || "1459639329197527275";
const UPDATE_THROTTLE = 1000;
const PROGRESS_THROTTLE_MS = 15000;

// ============================================
// STATE
// ============================================

const store = new Store();

let discordRPC: DiscordClient | null = null;
let discordRPCConnected = false;
let discordReady = false;

let discordToken: string = "";
let discordEnabled: boolean = (store.get("discordEnabled") as boolean) ?? false;

let lastActivityUpdate = 0;
let lastProgressUpdate = 0;
let pendingActivity: DiscordActivity | null = null;
let updateTimeout: NodeJS.Timeout | null = null;
let lastSongInfo: DiscordActivity | null = null;

// ============================================
// UTILITY FUNCTIONS
// ============================================

function truncateString(str: string, length: number): string {
  if (str.length > length) {
    return `${str.substring(0, length - 3)}...`;
  }
  return str;
}

function isSeek(oldSeconds: number, newSeconds: number): boolean {
  return Math.abs(newSeconds - oldSeconds) > 2;
}

// ============================================
// RPC MODE (Using @xhayper/discord-rpc for "Listening to")
// ============================================

async function connectRPC(): Promise<boolean> {
  if (discordRPCConnected && discordRPC) return true;

  if (discordRPC) {
    try {
      await discordRPC.destroy();
    } catch {}
    discordRPC = null;
    discordRPCConnected = false;
    discordReady = false;
  }

  try {
    discordRPC = new DiscordClient({ clientId: DISCORD_CLIENT_ID });

    discordRPC.on("connected", () => {
      console.log("[Discord RPC] Connected");
      discordRPCConnected = true;
    });

    discordRPC.on("ready", () => {
      console.log("[Discord RPC] Ready");
      discordReady = true;
      // If we have pending activity, set it now
      if (lastSongInfo) {
        setRPCActivity(lastSongInfo);
      }
    });

    discordRPC.on("disconnected", () => {
      console.log("[Discord RPC] Disconnected");
      discordRPCConnected = false;
      discordReady = false;
      // Auto-reconnect after 5 seconds
      if (discordEnabled) {
        setTimeout(() => {
          if (discordEnabled && !discordRPCConnected) {
            connectRPC();
          }
        }, 5000);
      }
    });

    await discordRPC.login();
    return true;
  } catch (error) {
    console.log("[Discord RPC] Failed to connect (Discord may not be running)");
    discordRPCConnected = false;
    discordReady = false;
    discordRPC = null;
    return false;
  }
}

async function setRPCActivity(activity: DiscordActivity) {
  if (!discordRPC || !discordReady) {
    await connectRPC();
    if (!discordReady) return;
  }

  try {
    const activityData: SetActivity = {
      type: ActivityType.Listening, // This gives "Listening to" instead of "Playing"
      statusDisplayType: StatusDisplayType.Details,
      details: truncateString(activity.details || "Слушает музыку", 128),
      state: truncateString(activity.state || "", 128),
      largeImageText: activity.largeImageText || "Harmonix",
    };

    // Large image (album art or app icon)
    if (activity.largeImageKey) {
      activityData.largeImageKey = activity.largeImageKey;
    } else {
      activityData.largeImageKey = "app";
    }

    // Small image (play/pause indicator)
    if (activity.smallImageKey) {
      activityData.smallImageKey = activity.smallImageKey;
      activityData.smallImageText = activity.smallImageText || "";
    }

    // Progress bar timestamps - only when playing (not paused)
    if (activity.isPaused) {
      // When paused, show pause indicator
      activityData.largeImageText = "⏸︎ На паузе";
    } else if (activity.songDuration && activity.songDuration > 0 && typeof activity.elapsedSeconds === "number") {
      // Calculate timestamps for progress bar
      const songStartTime = Date.now() - (activity.elapsedSeconds * 1000);
      activityData.startTimestamp = Math.floor(songStartTime / 1000);
      activityData.endTimestamp = Math.floor((songStartTime + activity.songDuration * 1000) / 1000);
    } else if (activity.startTimestamp && activity.endTimestamp) {
      // Use provided timestamps
      activityData.startTimestamp = activity.startTimestamp;
      activityData.endTimestamp = activity.endTimestamp;
    } else if (activity.startTimestamp) {
      activityData.startTimestamp = activity.startTimestamp;
    }

    // URLs for details and state (clickable links)
    if (activity.trackUrl) {
      activityData.detailsUrl = activity.trackUrl;
    }
    if (activity.artistUrl) {
      activityData.stateUrl = activity.artistUrl;
    }

    // Buttons
    if (activity.buttons && activity.buttons.length > 0) {
      activityData.buttons = activity.buttons.slice(0, 2).map((btn) => ({
        label: truncateString(btn.label, 32),
        url: btn.url,
      }));
    }

    await discordRPC?.user?.setActivity(activityData);
  } catch (error) {
    console.log("[Discord RPC] Failed to set activity:", error);
  }
}

async function clearRPCActivity() {
  if (!discordRPC || !discordReady) return;

  try {
    await discordRPC.user?.clearActivity();
  } catch (error) {
    console.log("[Discord RPC] Failed to clear activity:", error);
  }
}

// ============================================
// PUBLIC API
// ============================================

export async function connect(): Promise<DiscordStatus> {
  if (!discordEnabled) {
    return getStatus();
  }

  const connected = await connectRPC();
  return { connected, mode: "listening", hasToken: !!discordToken, enabled: discordEnabled };
}

export async function disconnect(): Promise<void> {
  if (discordRPC) {
    try {
      await clearRPCActivity();
      await discordRPC.destroy();
    } catch {}
    discordRPC = null;
    discordRPCConnected = false;
    discordReady = false;
  }
}

export function setActivity(activity: DiscordActivity): { success: boolean; mode: string } {
  if (!discordEnabled) {
    return { success: false, mode: "disabled" };
  }

  const now = Date.now();
  const elapsedSeconds = activity.elapsedSeconds ?? 0;

  // Check if this is a significant change that needs immediate update
  const songChanged = activity.details !== lastSongInfo?.details;
  const pauseChanged = activity.isPaused !== lastSongInfo?.isPaused;
  const seeked = !songChanged && lastSongInfo && isSeek(lastSongInfo.elapsedSeconds ?? 0, elapsedSeconds);

  // Immediate update for song change, pause change, or seek
  if (songChanged || pauseChanged || seeked) {
    if (updateTimeout) {
      clearTimeout(updateTimeout);
      updateTimeout = null;
    }

    lastActivityUpdate = now;
    lastProgressUpdate = now;
    lastSongInfo = { ...activity };

    if (discordReady) {
      setRPCActivity(activity);
      return { success: true, mode: "listening" };
    }
    return { success: false, mode: "not_ready" };
  }

  // Throttled update for progress
  if (now - lastProgressUpdate > PROGRESS_THROTTLE_MS) {
    if (updateTimeout) {
      clearTimeout(updateTimeout);
      updateTimeout = null;
    }

    lastProgressUpdate = now;
    lastSongInfo = { ...activity };

    if (discordReady) {
      setRPCActivity(activity);
      return { success: true, mode: "listening" };
    }
    return { success: false, mode: "not_ready" };
  }

  // Schedule throttled update
  if (now - lastActivityUpdate < UPDATE_THROTTLE) {
    pendingActivity = activity;
    if (!updateTimeout) {
      updateTimeout = setTimeout(() => {
        updateTimeout = null;
        if (pendingActivity) {
          setActivity(pendingActivity);
          pendingActivity = null;
        }
      }, UPDATE_THROTTLE - (now - lastActivityUpdate));
    }
    return { success: true, mode: "throttled" };
  }

  lastActivityUpdate = now;
  lastSongInfo = { ...activity };

  if (discordReady) {
    setRPCActivity(activity);
    return { success: true, mode: "listening" };
  }

  return { success: false, mode: "not_connected" };
}

export async function clearActivity(): Promise<{ success: boolean }> {
  lastSongInfo = null;
  lastProgressUpdate = 0;
  await clearRPCActivity();
  return { success: true };
}

export function getStatus(): DiscordStatus {
  return {
    connected: discordRPCConnected && discordReady,
    mode: "listening",
    hasToken: !!discordToken,
    enabled: discordEnabled,
  };
}

export async function setEnabled(enabled: boolean): Promise<{ success: boolean; connected: boolean }> {
  discordEnabled = enabled;
  store.set("discordEnabled", enabled);

  if (enabled) {
    const connected = await connectRPC();
    return { success: connected, connected };
  } else {
    await disconnect();
    return { success: true, connected: false };
  }
}

export async function setToken(token: string): Promise<{ success: boolean }> {
  discordToken = token;
  console.log("[Discord RPC] Token received");
  return { success: true };
}

export function getToken(): { token: string; hasToken: boolean } {
  return { token: discordToken ? "***" : "", hasToken: !!discordToken };
}

export async function removeToken(): Promise<{ success: boolean }> {
  discordToken = "";
  return { success: true };
}

export async function tryAutoExtract(): Promise<{ success: boolean; found: boolean }> {
  console.log("[Discord RPC] Auto-extract disabled");
  return { success: false, found: false };
}

export async function initialize(): Promise<void> {
  if (!discordEnabled) {
    console.log("[Discord RPC] Disabled, skipping init");
    return;
  }

  await connectRPC();
}

export async function cleanup(): Promise<void> {
  await disconnect();
}
