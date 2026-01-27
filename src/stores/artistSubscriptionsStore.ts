import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SubscribedArtist {
  id: string;
  name: string;
  avatarUrl?: string;
  platform: 'soundcloud' | 'youtube' | 'spotify' | 'vk';
  subscribedAt: number;
  lastChecked?: number;
  newTracksCount?: number;
}

export interface ArtistNewRelease {
  id: string;
  artistId: string;
  artistName: string;
  trackId: string;
  trackTitle: string;
  artworkUrl?: string;
  platform: string;
  releasedAt: number;
  seen: boolean;
}

interface ArtistSubscriptionsState {
  subscriptions: SubscribedArtist[];
  newReleases: ArtistNewRelease[];
  
  // Actions
  subscribe: (artist: Omit<SubscribedArtist, 'subscribedAt'>) => void;
  unsubscribe: (artistId: string) => void;
  isSubscribed: (artistId: string) => boolean;
  getSubscription: (artistId: string) => SubscribedArtist | undefined;
  
  // New releases
  addNewRelease: (release: Omit<ArtistNewRelease, 'seen'>) => void;
  markReleaseSeen: (releaseId: string) => void;
  markAllSeen: () => void;
  clearOldReleases: () => void;
  getUnseenCount: () => number;
}

export const useArtistSubscriptionsStore = create<ArtistSubscriptionsState>()(
  persist(
    (set, get) => ({
      subscriptions: [],
      newReleases: [],

      subscribe: (artist) => {
        const existing = get().subscriptions.find(a => a.id === artist.id);
        if (existing) return;

        set((state) => ({
          subscriptions: [
            ...state.subscriptions,
            { ...artist, subscribedAt: Date.now() }
          ]
        }));
      },

      unsubscribe: (artistId) => {
        set((state) => ({
          subscriptions: state.subscriptions.filter(a => a.id !== artistId),
          newReleases: state.newReleases.filter(r => r.artistId !== artistId)
        }));
      },

      isSubscribed: (artistId) => {
        return get().subscriptions.some(a => a.id === artistId);
      },

      getSubscription: (artistId) => {
        return get().subscriptions.find(a => a.id === artistId);
      },

      addNewRelease: (release) => {
        const existing = get().newReleases.find(r => r.id === release.id);
        if (existing) return;

        set((state) => ({
          newReleases: [{ ...release, seen: false }, ...state.newReleases].slice(0, 100)
        }));
      },

      markReleaseSeen: (releaseId) => {
        set((state) => ({
          newReleases: state.newReleases.map(r =>
            r.id === releaseId ? { ...r, seen: true } : r
          )
        }));
      },

      markAllSeen: () => {
        set((state) => ({
          newReleases: state.newReleases.map(r => ({ ...r, seen: true }))
        }));
      },

      clearOldReleases: () => {
        const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        set((state) => ({
          newReleases: state.newReleases.filter(r => r.releasedAt > weekAgo || !r.seen)
        }));
      },

      getUnseenCount: () => {
        return get().newReleases.filter(r => !r.seen).length;
      },
    }),
    { name: 'harmonix-artist-subscriptions' }
  )
);
