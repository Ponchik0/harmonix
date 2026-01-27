import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Track, QueueState } from "../types";

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

// Clean track URLs
const cleanTrackUrls = (track: Track): Track => ({
  ...track,
  streamUrl: decodeUrlEntities(track.streamUrl || ""),
  artworkUrl: decodeUrlEntities(track.artworkUrl || ""),
});

interface QueueStoreState extends QueueState {
  addToQueue: (track: Track) => void;
  playNext: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  reorderQueue: (fromIndex: number, toIndex: number) => void;
  clearQueue: () => void;
  shuffleQueue: () => void;
  moveToHistory: (track: Track) => void;
  getNextTrack: () => Track | null;
  getPreviousTrack: () => Track | null;
  updateTrackArtwork: (trackId: string, artworkUrl: string) => void;
}

export const useQueueStore = create<QueueStoreState>()(
  persist(
    (set, get) => ({
      upcoming: [],
      history: [],
      currentIndex: -1,

      addToQueue: (track: Track) => {
        set((state) => ({
          upcoming: [...state.upcoming, cleanTrackUrls(track)],
        }));
      },

      playNext: (track: Track) => {
        set((state) => ({
          upcoming: [cleanTrackUrls(track), ...state.upcoming],
        }));
      },

      removeFromQueue: (index: number) => {
        set((state) => ({
          upcoming: state.upcoming.filter((_, i) => i !== index),
        }));
      },

      reorderQueue: (fromIndex: number, toIndex: number) => {
        set((state) => {
          const newUpcoming = [...state.upcoming];
          const [removed] = newUpcoming.splice(fromIndex, 1);
          newUpcoming.splice(toIndex, 0, removed);
          return { upcoming: newUpcoming };
        });
      },

      clearQueue: () => {
        set({
          upcoming: [],
        });
      },

      shuffleQueue: () => {
        set((state) => {
          const shuffled = [...state.upcoming];
          for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
          }
          return { upcoming: shuffled };
        });
      },

      moveToHistory: (track: Track) => {
        set((state) => ({
          history: [track, ...state.history].slice(0, 50),
        }));
      },

      getNextTrack: () => {
        const { upcoming } = get();
        return upcoming.length > 0 ? upcoming[0] : null;
      },

      getPreviousTrack: () => {
        const { history } = get();
        return history.length > 0 ? history[0] : null;
      },

      updateTrackArtwork: (trackId: string, artworkUrl: string) => {
        set((state) => ({
          upcoming: state.upcoming.map(t => 
            t.id === trackId ? { ...t, artworkUrl } : t
          ),
          history: state.history.map(t => 
            t.id === trackId ? { ...t, artworkUrl } : t
          ),
        }));
      },
    }),
    {
      name: 'harmonix-queue',
      partialize: (state) => ({ upcoming: state.upcoming, history: state.history }),
    }
  )
);
