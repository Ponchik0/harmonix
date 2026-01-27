import { create } from "zustand";
import type { Track, PlayerState } from "../types";
import { useUserStore } from "./userStore";
import { useQueueStore } from "./queueStore";
import { audioService } from "../services/AudioService";
import { soundCloudService } from "../services/SoundCloudService";
import { trendingService } from "../services/TrendingService";

// Find and queue similar tracks when queue is empty
async function findAndQueueSimilarTracks(
  currentTrack: Track | null,
  queueStore: ReturnType<typeof useQueueStore.getState>
): Promise<boolean> {
  try {
    // Get history of played tracks
    const history = queueStore.history;
    const upcoming = queueStore.upcoming;
    const playedIds = new Set([
      ...history.map((t) => t.id),
      ...upcoming.map((t) => t.id),
    ]);
    if (currentTrack) playedIds.add(currentTrack.id);

    // Build search queries based on current track (prioritize current track)
    const searchQueries: string[] = [];

    if (currentTrack) {
      // Primary: search by artist name
      if (currentTrack.artist) {
        searchQueries.push(currentTrack.artist);
      }

      // Secondary: search by title + artist combo
      if (currentTrack.title && currentTrack.artist) {
        // Extract genre/style keywords from title
        const titleLower = currentTrack.title.toLowerCase();
        const genreKeywords = [
          "remix",
          "mix",
          "edit",
          "bootleg",
          "vip",
          "flip",
        ];
        const hasRemix = genreKeywords.some((k) => titleLower.includes(k));
        if (hasRemix) {
          searchQueries.push(`${currentTrack.artist} remix`);
        }
      }

      // Tertiary: search by clean title keywords
      const titleWords = currentTrack.title
        .toLowerCase()
        .replace(/[\(\)\[\]\-\_]/g, " ")
        .split(/\s+/)
        .filter(
          (w) =>
            w.length > 3 &&
            ![
              "feat",
              "remix",
              "official",
              "audio",
              "video",
              "music",
              "original",
              "extended",
              "radio",
              "edit",
            ].includes(w)
        );
      if (titleWords.length > 0) {
        searchQueries.push(titleWords.slice(0, 2).join(" "));
      }
    }

    // Add artists from recent history (last 3 tracks)
    const recentArtists = [
      ...new Set(
        history
          .slice(0, 3)
          .map((t) => t.artist)
          .filter(Boolean)
      ),
    ];
    searchQueries.push(...recentArtists);

    // Fallback queries if nothing else
    if (searchQueries.length === 0) {
      searchQueries.push("popular music", "trending hits");
    }

    // Remove duplicates
    const uniqueQueries = [...new Set(searchQueries)];
    console.log("[Autoplay] Search queries:", uniqueQueries);

    // Search for tracks (parallel for speed)
    const foundTracks: Track[] = [];

    // Do first 2 searches in parallel for speed
    const searchPromises = uniqueQueries.slice(0, 2).map(async (query) => {
      try {
        const results = await soundCloudService.search(query, 20);
        return results.tracks;
      } catch (e) {
        console.log("[Autoplay] Search error for:", query);
        return [];
      }
    });

    const searchResults = await Promise.all(searchPromises);

    for (const tracks of searchResults) {
      for (const track of tracks) {
        // Skip already played, too short, or duplicates
        if (
          !playedIds.has(track.id) &&
          !foundTracks.some((t) => t.id === track.id) &&
          track.duration > 60
        ) {
          foundTracks.push(track);
          playedIds.add(track.id);
        }
      }
    }

    // If not enough tracks, do more searches
    if (foundTracks.length < 10 && uniqueQueries.length > 2) {
      for (const query of uniqueQueries.slice(2, 4)) {
        try {
          const results = await soundCloudService.search(query, 15);
          for (const track of results.tracks) {
            if (
              !playedIds.has(track.id) &&
              !foundTracks.some((t) => t.id === track.id) &&
              track.duration > 60
            ) {
              foundTracks.push(track);
              playedIds.add(track.id);
            }
          }
        } catch (e) {
          console.log("[Autoplay] Search error for:", query);
        }
      }
    }

    console.log("[Autoplay] Found tracks:", foundTracks.length);

    if (foundTracks.length === 0) {
      return false;
    }

    // Shuffle and add to queue
    const shuffled = foundTracks.sort(() => Math.random() - 0.5);
    const toAdd = shuffled.slice(0, 15);

    for (const track of toAdd) {
      queueStore.addToQueue(track);
    }

    console.log("[Autoplay] Added", toAdd.length, "tracks to queue");

    // Show notification
    window.dispatchEvent(
      new CustomEvent("show-toast", {
        detail: {
          message: `Автоплей: +${toAdd.length} похожих треков`,
          type: "success",
        },
      })
    );

    return true;
  } catch (e) {
    console.error("[Autoplay] Error:", e);
    return false;
  }
}

interface PlayerStoreState extends PlayerState {
  isFullscreen: boolean;
  setFullscreen: (value: boolean) => void;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  seek: (position: number) => void;
  setVolume: (volume: number) => void;
  setTrack: (track: Track) => void;
  setProgress: (progress: number) => void;
  updateCurrentTrackArtwork: (artworkUrl: string) => void;
  nextTrack: () => void;
  previousTrack: () => void;
  toggleShuffle: () => void;
  cycleRepeatMode: () => void;
  trackPlayed: () => void;
  playTrackFromQueue: (track: Track) => void;
  restoreLastTrack: () => Promise<void>;
}

// Load saved volume
const loadSavedVolume = (): number => {
  try {
    const saved = localStorage.getItem("harmonix-volume");
    if (saved) {
      const vol = parseFloat(saved);
      if (!isNaN(vol) && vol >= 0 && vol <= 1) return vol;
    }
  } catch {}
  return 0.7;
};

// Save last track for autoplay
const saveLastTrack = (track: Track | null) => {
  if (track) {
    localStorage.setItem("harmonix-last-track", JSON.stringify(track));
  }
};

// Load last track
const loadLastTrack = (): Track | null => {
  try {
    const saved = localStorage.getItem("harmonix-last-track");
    if (saved) return JSON.parse(saved);
  } catch {}
  return null;
};

// Discord RPC helper - теперь с поддержкой "Listening to" и прогресс-бара
const updateDiscordActivity = (
  track: Track | null,
  isPlaying: boolean,
  currentProgress: number = 0
) => {
  // Check if Discord is enabled in settings
  try {
    const discordSettings = localStorage.getItem("harmonix-discord-settings");
    // По умолчанию Discord RPC включен
    const settings = discordSettings
      ? JSON.parse(discordSettings)
      : { enabled: true };
    if (!settings.enabled) return;

    // Check if electronAPI is available
    if (typeof window !== "undefined" && (window as any).electronAPI?.discord) {
      if (track) {
        // Вычисляем elapsed seconds для прогресс-бара
        const elapsedSeconds = Math.floor(currentProgress * track.duration);

        const activity: any = {
          // details - название трека (первая строка)
          details: track.title.slice(0, 128),
          // state - артист (вторая строка)
          state: track.artist.slice(0, 128),
          // Обложка трека (большая картинка)
          largeImageKey: track.artworkUrl || "app",
          largeImageText: track.title,
          // Маленькая иконка play/pause
          smallImageKey: isPlaying ? "play" : "pause",
          smallImageText: isPlaying ? "Слушает" : "На паузе",
          // Новые поля для прогресс-бара (Listening to)
          songDuration: track.duration,
          elapsedSeconds: elapsedSeconds,
          isPaused: !isPlaying,
          // URL трека (если есть)
          trackUrl: track.url || undefined,
          // Кнопка скачать
          buttons: [
            {
              label: "Скачать Harmonix",
              url: "https://harmonix-site.vercel.app/",
            },
          ],
        };

        (window as any).electronAPI.discord.setActivity(activity);
      } else {
        (window as any).electronAPI.discord.clearActivity();
      }
    }
  } catch (e) {
    console.log("[Discord] Error updating activity:", e);
  }
};

export const usePlayerStore = create<PlayerStoreState>((set, get) => ({
  currentTrack: null,
  isPlaying: false,
  volume: loadSavedVolume(),
  progress: 0,
  duration: 0,
  shuffle: false,
  repeatMode: "off",
  isFullscreen: false,

  setFullscreen: (value: boolean) => set({ isFullscreen: value }),

  play: () => {
    set({ isPlaying: true });
    const { currentTrack, progress } = get();
    updateDiscordActivity(currentTrack, true, progress);
  },
  pause: () => {
    set({ isPlaying: false });
    const { currentTrack, progress } = get();
    updateDiscordActivity(currentTrack, false, progress);
  },
  toggle: () => {
    const newIsPlaying = !get().isPlaying;
    set({ isPlaying: newIsPlaying });
    const { currentTrack, progress } = get();
    updateDiscordActivity(currentTrack, newIsPlaying, progress);
  },

  seek: (position: number) => {
    const clampedPosition = Math.max(0, Math.min(1, position));
    set({ progress: clampedPosition });
  },

  setVolume: (volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    set({ volume: clampedVolume });
  },

  setTrack: (track: Track) => {
    set({
      currentTrack: track,
      duration: track.duration,
      progress: 0,
      isPlaying: true,
    });
    // Save last track for autoplay
    saveLastTrack(track);
    // Track played - update stats
    get().trackPlayed();
    // Update Discord activity (progress = 0 for new track)
    updateDiscordActivity(track, true, 0);

    // Pre-load similar tracks in background if queue is empty
    const queueStore = useQueueStore.getState();
    if (queueStore.upcoming.length === 0) {
      console.log("[PlayerStore] Queue empty, pre-loading similar tracks...");
      findAndQueueSimilarTracks(track, queueStore).then((found) => {
        if (found) {
          console.log("[PlayerStore] Similar tracks pre-loaded!");
        }
      });
    }
  },

  setProgress: (progress: number) => {
    set({ progress: Math.max(0, Math.min(1, progress)) });
  },

  updateCurrentTrackArtwork: (artworkUrl: string) => {
    const { currentTrack } = get();
    if (currentTrack && artworkUrl) {
      set({
        currentTrack: { ...currentTrack, artworkUrl },
      });
      // Update saved last track too
      saveLastTrack({ ...currentTrack, artworkUrl });
      console.log("[PlayerStore] Updated artwork for:", currentTrack.title);
    }
  },

  nextTrack: async () => {
    console.log("[PlayerStore] nextTrack called");
    const { currentTrack, repeatMode, shuffle } = get();
    const queueStore = useQueueStore.getState();

    console.log("[PlayerStore] Queue length:", queueStore.upcoming.length);
    console.log("[PlayerStore] History length:", queueStore.history.length);

    // Move current track to history if exists
    if (currentTrack) {
      queueStore.moveToHistory(currentTrack);
    }

    // Shuffle queue if shuffle is enabled
    if (shuffle && queueStore.upcoming.length > 1) {
      queueStore.shuffleQueue();
    }

    // Try to find a playable track (max 5 attempts)
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      // Get next track from queue
      let nextTrack = queueStore.getNextTrack();
      console.log(
        "[PlayerStore] Next track:",
        nextTrack?.title,
        "attempt:",
        attempts + 1
      );

      if (!nextTrack) {
        // No more tracks in queue
        if (repeatMode === "all" && queueStore.history.length > 0) {
          console.log("[PlayerStore] Repeat all - replaying from history");
          const historyTracks = [...queueStore.history].reverse();
          historyTracks.forEach((track) => queueStore.addToQueue(track));
          attempts++;
          continue;
        }

        // Autoplay - find similar tracks
        console.log("[PlayerStore] Queue empty - searching for similar tracks");
        const foundSimilar = await findAndQueueSimilarTracks(
          currentTrack,
          queueStore
        );

        if (foundSimilar) {
          attempts++;
          continue; // Try again with new tracks in queue
        }

        console.log("[PlayerStore] No more tracks and no similar found");
        set({ isPlaying: false });
        return;
      }

      // Remove from queue
      queueStore.removeFromQueue(0);

      // If track doesn't have streamUrl, fetch it with fallback
      if (!nextTrack.streamUrl) {
        console.log("[PlayerStore] Fetching stream URL for:", nextTrack.title);
        try {
          // Используем fallback сервис для получения stream URL
          const { streamFallbackService } = await import("../services/StreamFallbackService");
          const result = await streamFallbackService.getStreamUrl(nextTrack);

          if (result.streamUrl) {
            nextTrack = { ...nextTrack, streamUrl: result.streamUrl };
            if (result.source !== "original") {
              console.log(`[PlayerStore] Using ${result.source} fallback for: ${nextTrack.title}`);
            }
          } else {
            console.error(
              "[PlayerStore] Failed to get stream URL (all fallbacks failed), trying next"
            );
            attempts++;
            continue; // Try next track immediately
          }
        } catch (e) {
          console.error("[PlayerStore] Error fetching stream URL:", e);
          attempts++;
          continue; // Try next track immediately
        }
      }

      // Play the track
      console.log("[PlayerStore] Loading next track...");
      audioService.load(nextTrack);
      return; // Success!
    }

    console.log("[PlayerStore] Max attempts reached, stopping");
    set({ isPlaying: false });
  },

  previousTrack: async () => {
    console.log("[PlayerStore] previousTrack called");
    const { currentTrack, progress } = get();
    const queueStore = useQueueStore.getState();

    // If more than 3 seconds into the track, restart it
    if (progress > 0.05 && currentTrack) {
      console.log("[PlayerStore] Restarting current track");
      audioService.seek(0);
      return;
    }

    // Get previous track from history
    let previousTrack = queueStore.getPreviousTrack();
    console.log("[PlayerStore] Previous track:", previousTrack?.title);

    if (previousTrack) {
      // Add current track back to front of queue
      if (currentTrack) {
        queueStore.playNext(currentTrack);
      }

      // Remove from history (first item)
      useQueueStore.setState((state) => ({
        history: state.history.slice(1),
      }));

      // If track doesn't have streamUrl, fetch it with fallback
      if (!previousTrack.streamUrl) {
        console.log(
          "[PlayerStore] Fetching stream URL for:",
          previousTrack.title
        );
        try {
          const { streamFallbackService } = await import("../services/StreamFallbackService");
          const result = await streamFallbackService.getStreamUrl(previousTrack);

          if (result.streamUrl) {
            previousTrack = { ...previousTrack, streamUrl: result.streamUrl };
          } else {
            console.error("[PlayerStore] Failed to get stream URL");
            return;
          }
        } catch (e) {
          console.error("[PlayerStore] Error fetching stream URL:", e);
          return;
        }
      }

      // Play the previous track
      audioService.load(previousTrack);
    } else if (currentTrack) {
      // No history - just restart current track
      console.log("[PlayerStore] No history, restarting");
      audioService.seek(0);
    }
  },

  playTrackFromQueue: async (track: Track) => {
    const { currentTrack } = get();
    const queueStore = useQueueStore.getState();

    // Move current track to history
    if (currentTrack) {
      queueStore.moveToHistory(currentTrack);
    }

    // If track doesn't have streamUrl, fetch it with fallback
    let trackToPlay = track;
    if (!track.streamUrl) {
      console.log("[PlayerStore] Fetching stream URL for:", track.title);
      try {
        const { streamFallbackService } = await import("../services/StreamFallbackService");
        const result = await streamFallbackService.getStreamUrl(track);

        if (result.streamUrl) {
          trackToPlay = { ...track, streamUrl: result.streamUrl };
        } else {
          console.error("[PlayerStore] Failed to get stream URL");
          return;
        }
      } catch (e) {
        console.error("[PlayerStore] Error fetching stream URL:", e);
        return;
      }
    }

    // Play the selected track
    audioService.load(trackToPlay);
  },

  toggleShuffle: () => {
    const newShuffle = !get().shuffle;
    set({ shuffle: newShuffle });

    // Shuffle queue immediately if enabled
    if (newShuffle) {
      useQueueStore.getState().shuffleQueue();
    }
  },

  cycleRepeatMode: () =>
    set((state) => {
      const modes: Array<"off" | "one" | "all"> = ["off", "one", "all"];
      const currentIndex = modes.indexOf(state.repeatMode);
      const nextIndex = (currentIndex + 1) % modes.length;
      return { repeatMode: modes[nextIndex] };
    }),

  trackPlayed: () => {
    // Update user stats when a track is played
    const userStore = useUserStore.getState();
    const { currentTrack } = get();

    // Always update stats (even for guests)
    userStore.incrementStat("tracksPlayed", 1);

    // Record play for global trending
    if (currentTrack) {
      trendingService.recordPlay(currentTrack);
    }

    // Add listening time (track duration in hours)
    if (currentTrack?.duration) {
      const hoursListened = currentTrack.duration / 3600; // Convert seconds to hours
      userStore.incrementStat("hoursListened", hoursListened);
    }

    // Update weekly activity (current day)
    const user = userStore.user;
    if (user) {
      const dayOfWeek = new Date().getDay();
      const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Mon=0, Sun=6
      const newWeeklyActivity = [...user.stats.weeklyActivity];
      newWeeklyActivity[adjustedDay] += 1;
      userStore.updateProfile({
        stats: { ...user.stats, weeklyActivity: newWeeklyActivity },
      });
    }

    // Монеты за треки отключены - выдаются только админом
    // if (userStore.isAuthenticated) {
    //   userStore.addCoins(1);
    // }
  },

  restoreLastTrack: async () => {
    const lastTrack = loadLastTrack();
    if (!lastTrack) return;

    // Check if autoplay is enabled
    const autoPlayEnabled =
      localStorage.getItem("harmonix-autoplay") !== "false";

    console.log(
      "[PlayerStore] Restoring last track:",
      lastTrack.title,
      "autoPlay:",
      autoPlayEnabled
    );

    // If track doesn't have streamUrl, fetch it with fallback
    let trackToPlay = lastTrack;
    if (!lastTrack.streamUrl) {
      try {
        const { streamFallbackService } = await import("../services/StreamFallbackService");
        const result = await streamFallbackService.getStreamUrl(lastTrack);

        if (result.streamUrl) {
          trackToPlay = { ...lastTrack, streamUrl: result.streamUrl };
        } else {
          console.log("[PlayerStore] Could not get stream URL for last track");
          // Still set the track info but don't play
          set({
            currentTrack: lastTrack,
            duration: lastTrack.duration,
            progress: 0,
            isPlaying: false,
          });
          return;
        }
      } catch (e) {
        console.error("[PlayerStore] Error restoring last track:", e);
        return;
      }
    }

    // If autoplay enabled - load and play, otherwise just set track info
    if (autoPlayEnabled && trackToPlay.streamUrl) {
      // Import audioService dynamically to avoid circular dependency
      const { audioService } = await import("../services/AudioService");
      audioService.load(trackToPlay, true);
    } else {
      // Just set track info without playing
      set({
        currentTrack: trackToPlay,
        duration: trackToPlay.duration,
        progress: 0,
        isPlaying: false,
      });
    }
  },
}));
