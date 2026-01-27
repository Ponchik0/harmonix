/**
 * Offline Tracks Service
 * Управление локальными/оффлайн треками
 */

import type { Track } from '../types';

const STORAGE_KEY = 'harmonix-offline-tracks';

class OfflineTracksService {
  private tracks: Track[] = [];

  constructor() {
    this.loadTracks();
  }

  private loadTracks(): void {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        this.tracks = JSON.parse(saved);
      }
    } catch (error) {
      console.error('[OfflineTracksService] Error loading tracks:', error);
      this.tracks = [];
    }
  }

  private saveTracks(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.tracks));
      window.dispatchEvent(new CustomEvent('offline-tracks-changed'));
    } catch (error) {
      console.error('[OfflineTracksService] Error saving tracks:', error);
    }
  }

  getOfflineTracks(): Track[] {
    return [...this.tracks];
  }

  addOfflineTrack(track: Track): void {
    // Check if track already exists
    const exists = this.tracks.some(t => t.id === track.id);
    if (exists) {
      console.warn('[OfflineTracksService] Track already exists:', track.id);
      return;
    }

    // Add platform marker for offline tracks
    const offlineTrack: Track = {
      ...track,
      platform: track.platform || 'offline',
      id: track.id || `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    this.tracks.unshift(offlineTrack);
    this.saveTracks();
    console.log('[OfflineTracksService] Added offline track:', offlineTrack.title);
  }

  removeOfflineTrack(trackId: string): void {
    const index = this.tracks.findIndex(t => t.id === trackId);
    if (index === -1) {
      console.warn('[OfflineTracksService] Track not found:', trackId);
      return;
    }

    this.tracks.splice(index, 1);
    this.saveTracks();
    console.log('[OfflineTracksService] Removed offline track:', trackId);
  }

  clearOfflineTracks(): void {
    this.tracks = [];
    this.saveTracks();
    console.log('[OfflineTracksService] Cleared all offline tracks');
  }

  isOfflineTrack(trackId: string): boolean {
    return this.tracks.some(t => t.id === trackId);
  }

  getOfflineTrackCount(): number {
    return this.tracks.length;
  }

  // Import tracks from JSON file
  importFromJson(tracks: Track[]): number {
    let imported = 0;
    for (const track of tracks) {
      if (!this.tracks.some(t => t.id === track.id)) {
        this.addOfflineTrack(track);
        imported++;
      }
    }
    return imported;
  }

  // Export tracks to JSON format
  exportToJson(): string {
    const data = {
      name: 'Оффлайн треки',
      exportDate: new Date().toISOString(),
      tracks: this.tracks,
    };
    return JSON.stringify(data, null, 2);
  }
}

export const offlineTracksService = new OfflineTracksService();
