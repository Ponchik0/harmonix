import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabaseService } from '../services/SupabaseService';

export interface PinnedTrack {
  id: string;
  trackId: string;
  title: string;
  artist: string;
  artworkUrl?: string;
  platform: string;
  pinnedAt: number;
  order: number;
}

export interface PinnedArtist {
  id: string;
  artistId: string;
  name: string;
  avatarUrl?: string;
  platform: string;
  pinnedAt: number;
  order: number;
}

interface ProfilePinsState {
  pinnedTracks: PinnedTrack[];
  pinnedArtists: PinnedArtist[];
  maxPinnedTracks: number;
  maxPinnedArtists: number;

  // Track actions
  pinTrack: (track: Omit<PinnedTrack, 'id' | 'pinnedAt' | 'order'>) => boolean;
  unpinTrack: (trackId: string) => void;
  isTrackPinned: (trackId: string) => boolean;
  reorderTracks: (trackIds: string[]) => void;

  // Artist actions
  pinArtist: (artist: Omit<PinnedArtist, 'id' | 'pinnedAt' | 'order'>) => boolean;
  unpinArtist: (artistId: string) => void;
  isArtistPinned: (artistId: string) => boolean;
  reorderArtists: (artistIds: string[]) => void;

  // Settings
  setMaxPinnedTracks: (max: number) => void;
  setMaxPinnedArtists: (max: number) => void;
}

// Глобальная переменная для userId (устанавливается при логине)
let currentUserId: string | null = null;

export const setProfilePinsUserId = (userId: string | null) => {
  currentUserId = userId;
};

// Синхронизация с БД
const syncPinnedTracksToCloud = async (tracks: PinnedTrack[]) => {
  if (!currentUserId) return;
  try {
    const tracksForDb = tracks.map(t => ({
      trackId: t.trackId,
      title: t.title,
      artist: t.artist,
      artworkUrl: t.artworkUrl,
    }));
    await supabaseService.updateUser(currentUserId, { pinned_tracks: tracksForDb } as any);
    console.log('[ProfilePins] Synced to cloud:', tracksForDb.length, 'tracks');
  } catch (e) {
    console.error('[ProfilePins] Sync error:', e);
  }
};

export const useProfilePinsStore = create<ProfilePinsState>()(
  persist(
    (set, get) => ({
      pinnedTracks: [],
      pinnedArtists: [],
      maxPinnedTracks: 4,
      maxPinnedArtists: 5,

      pinTrack: (track) => {
        const { pinnedTracks, maxPinnedTracks } = get();
        
        if (pinnedTracks.length >= maxPinnedTracks) {
          return false;
        }

        if (pinnedTracks.some(t => t.trackId === track.trackId)) {
          return false;
        }

        const newTrack: PinnedTrack = {
          ...track,
          id: `pin_${Date.now()}`,
          pinnedAt: Date.now(),
          order: pinnedTracks.length,
        };

        const newTracks = [...pinnedTracks, newTrack];
        set({ pinnedTracks: newTracks });
        
        // Sync to cloud
        syncPinnedTracksToCloud(newTracks);

        return true;
      },

      unpinTrack: (trackId) => {
        const newTracks = get().pinnedTracks
          .filter(t => t.trackId !== trackId)
          .map((t, i) => ({ ...t, order: i }));
        set({ pinnedTracks: newTracks });
        
        // Sync to cloud
        syncPinnedTracksToCloud(newTracks);
      },

      isTrackPinned: (trackId) => {
        return get().pinnedTracks.some(t => t.trackId === trackId);
      },

      reorderTracks: (trackIds) => {
        const newTracks = trackIds
          .map((id, i) => {
            const track = get().pinnedTracks.find(t => t.trackId === id);
            return track ? { ...track, order: i } : null;
          })
          .filter(Boolean) as PinnedTrack[];
        set({ pinnedTracks: newTracks });
        
        // Sync to cloud
        syncPinnedTracksToCloud(newTracks);
      },

      pinArtist: (artist) => {
        const { pinnedArtists, maxPinnedArtists } = get();
        
        if (pinnedArtists.length >= maxPinnedArtists) {
          return false;
        }

        if (pinnedArtists.some(a => a.artistId === artist.artistId)) {
          return false;
        }

        const newArtist: PinnedArtist = {
          ...artist,
          id: `pin_${Date.now()}`,
          pinnedAt: Date.now(),
          order: pinnedArtists.length,
        };

        set((state) => ({
          pinnedArtists: [...state.pinnedArtists, newArtist]
        }));

        return true;
      },

      unpinArtist: (artistId) => {
        set((state) => ({
          pinnedArtists: state.pinnedArtists
            .filter(a => a.artistId !== artistId)
            .map((a, i) => ({ ...a, order: i }))
        }));
      },

      isArtistPinned: (artistId) => {
        return get().pinnedArtists.some(a => a.artistId === artistId);
      },

      reorderArtists: (artistIds) => {
        set((state) => ({
          pinnedArtists: artistIds
            .map((id, i) => {
              const artist = state.pinnedArtists.find(a => a.artistId === id);
              return artist ? { ...artist, order: i } : null;
            })
            .filter(Boolean) as PinnedArtist[]
        }));
      },

      setMaxPinnedTracks: (max) => set({ maxPinnedTracks: max }),
      setMaxPinnedArtists: (max) => set({ maxPinnedArtists: max }),
    }),
    { name: 'harmonix-profile-pins' }
  )
);
