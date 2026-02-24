/**
 * DataSyncService — syncs localStorage and IndexedDB data to/from
 * persistent file storage via Electron IPC.
 * 
 * This ensures playlists, liked tracks, settings, and configs
 * persist between localhost dev and production exe.
 * 
 * Data is stored in %APPDATA%/harmonix/:
 *   - harmonix-data.json (localStorage via electron-store)
 *   - harmonix-idb-backup.json (IndexedDB backup)
 */

import { openDB } from "idb";

const DB_NAME = "harmonix-db";
const DB_VERSION = 1;

// All localStorage keys that should be persisted
const PERSIST_KEYS = [
  "harmonix-theme",
  "harmonix-theme-config",
  "harmonix-volume",
  "harmonix-last-track",
  "harmonix-autoplay",
  "harmonix-crossfade-enabled",
  "harmonix-crossfade-duration",
  "harmonix-close-to-tray",
  "harmonix-start-minimized",
  "harmonix-always-on-top",
  "harmonix-check-updates",
  "harmonix-discord-settings",
  "harmonix-equalizer",
  "harmonix-optimization",
  "harmonix-maintenance",
  "harmonix-search-view",
  "harmonix-search-sources",
  "harmonix-search-history-tracks",
  "harmonix-recently-played",
  "harmonix-deleted-news",
  "harmonix-dismissed-update",
  "harmonix-telegram-chat-id",
  "harmonix-youtube-settings",
  "harmonix-srv-soundcloud",
  "harmonix-srv-spotify",
  "harmonix-srv-vk",
  "harmonix-srv-yandex",
  "harmonix-spotify-credentials",
  "localserver_port",
  "soundcloud_client_id",
  "eq_settings",
];

class DataSyncService {
  private saveTimeout: ReturnType<typeof setTimeout> | null = null;
  private isElectron: boolean;
  private initialized = false;
  private originalSetItem: typeof localStorage.setItem | null = null;
  private originalRemoveItem: typeof localStorage.removeItem | null = null;

  constructor() {
    this.isElectron = !!(window as any).electronAPI?.persistentStorage;
  }

  /**
   * Initialize sync: load data from disk, then start watching for changes
   */
  async init(): Promise<void> {
    if (!this.isElectron || this.initialized) return;
    this.initialized = true;

    console.log("[DataSync] Initializing persistent storage sync...");

    // Step 1: Load persisted localStorage from disk
    await this.loadLocalStorageFromDisk();

    // Step 2: Load persisted IndexedDB from disk
    await this.loadIndexedDBFromDisk();

    // Step 3: Hook into localStorage to auto-save changes
    this.hookLocalStorage();

    // Step 4: Schedule periodic IndexedDB backup
    this.scheduleIDBBackup();

    console.log("[DataSync] Sync initialized successfully");
  }

  // ========================
  // localStorage sync
  // ========================

  /**
   * Load localStorage data from disk and merge into browser localStorage
   */
  private async loadLocalStorageFromDisk(): Promise<void> {
    try {
      const api = (window as any).electronAPI.persistentStorage;
      const result = await api.loadLocalStorage();

      if (!result.success || !result.data) {
        console.log("[DataSync] No saved localStorage found on disk");
        return;
      }

      const diskData: Record<string, string> = result.data;
      let restored = 0;

      for (const key of PERSIST_KEYS) {
        if (key in diskData) {
          const currentValue = localStorage.getItem(key);
          // Only restore if the browser doesn't already have this key
          // (browser value takes precedence if both exist)
          if (currentValue === null) {
            localStorage.setItem(key, diskData[key]);
            restored++;
          }
        }
      }

      // Also restore any harmonix-* keys not in our predefined list
      for (const [key, value] of Object.entries(diskData)) {
        if (key.startsWith("harmonix-") && !PERSIST_KEYS.includes(key)) {
          if (localStorage.getItem(key) === null) {
            localStorage.setItem(key, value);
            restored++;
          }
        }
      }

      console.log(`[DataSync] Restored ${restored} localStorage keys from disk`);
    } catch (error) {
      console.error("[DataSync] Error loading localStorage from disk:", error);
    }
  }

  /**
   * Save current localStorage to disk (debounced)
   */
  private saveLocalStorageToDisk(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    this.saveTimeout = setTimeout(async () => {
      try {
        const data: Record<string, string> = {};

        // Collect all harmonix-related keys
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (!key) continue;

          // Save all harmonix-* keys and known keys
          if (key.startsWith("harmonix-") || PERSIST_KEYS.includes(key)) {
            const value = localStorage.getItem(key);
            if (value !== null) {
              data[key] = value;
            }
          }
        }

        const api = (window as any).electronAPI.persistentStorage;
        await api.saveLocalStorage(data);
      } catch (error) {
        console.error("[DataSync] Error saving localStorage to disk:", error);
      }
    }, 2000); // Debounce 2 seconds
  }

  /**
   * Hook into localStorage.setItem to auto-sync changes
   */
  private hookLocalStorage(): void {
    this.originalSetItem = localStorage.setItem.bind(localStorage);
    this.originalRemoveItem = localStorage.removeItem.bind(localStorage);

    const self = this;

    localStorage.setItem = function (key: string, value: string) {
      self.originalSetItem!.call(localStorage, key, value);
      // Auto-save if it's a relevant key
      if (key.startsWith("harmonix-") || PERSIST_KEYS.includes(key)) {
        self.saveLocalStorageToDisk();
      }
    };

    localStorage.removeItem = function (key: string) {
      self.originalRemoveItem!.call(localStorage, key);
      if (key.startsWith("harmonix-") || PERSIST_KEYS.includes(key)) {
        self.saveLocalStorageToDisk();
      }
    };
  }

  // ========================
  // IndexedDB sync
  // ========================

  /**
   * Load IndexedDB backup from disk and restore
   */
  private async loadIndexedDBFromDisk(): Promise<void> {
    try {
      const api = (window as any).electronAPI.persistentStorage;
      const result = await api.loadIndexedDB();

      if (!result.success || !result.data) {
        console.log("[DataSync] No IndexedDB backup found on disk");
        return;
      }

      const backup = JSON.parse(result.data);

      // Check if local IndexedDB is empty (fresh start)
      const db = await openDB(DB_NAME, DB_VERSION);
      const storeNames = Array.from(db.objectStoreNames);

      let isEmpty = true;
      for (const storeName of storeNames) {
        try {
          const count = await db.count(storeName);
          if (count > 0) {
            isEmpty = false;
            break;
          }
        } catch {
          // Store might not exist
        }
      }

      if (!isEmpty) {
        console.log("[DataSync] IndexedDB already has data, skipping restore");
        db.close();
        return;
      }

      // Restore data from backup
      let totalRestored = 0;
      for (const storeName of storeNames) {
        if (backup[storeName] && Array.isArray(backup[storeName])) {
          const tx = db.transaction(storeName, "readwrite");
          for (const item of backup[storeName]) {
            try {
              await tx.store.put(item);
              totalRestored++;
            } catch (e) {
              // Skip invalid items
            }
          }
          await tx.done;
        }
      }

      db.close();
      console.log(`[DataSync] Restored ${totalRestored} IndexedDB records from disk`);
    } catch (error) {
      console.error("[DataSync] Error loading IndexedDB from disk:", error);
    }
  }

  /**
   * Save IndexedDB to disk (debounced, called periodically)
   */
  async saveIndexedDBToDisk(): Promise<void> {
    try {
      const db = await openDB(DB_NAME, DB_VERSION);
      const storeNames = Array.from(db.objectStoreNames);

      const backup: Record<string, any[]> = {};
      let totalRecords = 0;

      for (const storeName of storeNames) {
        try {
          const items = await db.getAll(storeName);
          backup[storeName] = items;
          totalRecords += items.length;
        } catch {
          backup[storeName] = [];
        }
      }

      db.close();

      if (totalRecords === 0) {
        console.log("[DataSync] IndexedDB is empty, skipping backup");
        return;
      }

      const json = JSON.stringify(backup);
      const api = (window as any).electronAPI.persistentStorage;
      await api.saveIndexedDB(json);

      console.log(`[DataSync] Backed up ${totalRecords} IndexedDB records`);
    } catch (error) {
      console.error("[DataSync] Error saving IndexedDB to disk:", error);
    }
  }

  /**
   * Schedule periodic IndexedDB backups
   */
  private scheduleIDBBackup(): void {
    // Save IndexedDB every 60 seconds
    setInterval(() => {
      this.saveIndexedDBToDisk();
    }, 60000);

    // Also save on page unload
    window.addEventListener("beforeunload", () => {
      this.saveIndexedDBToDisk();
      this.saveLocalStorageToDiskSync();
    });
  }

  /**
   * Synchronous localStorage save for beforeunload
   */
  private saveLocalStorageToDiskSync(): void {
    try {
      const data: Record<string, string> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        if (key.startsWith("harmonix-") || PERSIST_KEYS.includes(key)) {
          const value = localStorage.getItem(key);
          if (value !== null) data[key] = value;
        }
      }
      // Use the async API but don't wait — best effort on unload
      (window as any).electronAPI?.persistentStorage?.saveLocalStorage(data);
    } catch {}
  }

  /**
   * Force save everything now (can be called manually)
   */
  async forceSave(): Promise<void> {
    if (!this.isElectron) return;
    console.log("[DataSync] Force saving all data...");
    this.saveLocalStorageToDisk();
    await this.saveIndexedDBToDisk();
  }

  /**
   * Get data storage path info
   */
  async getDataPath(): Promise<string | null> {
    if (!this.isElectron) return null;
    try {
      const result = await (window as any).electronAPI.persistentStorage.getDataPath();
      return result.path;
    } catch {
      return null;
    }
  }
}

export const dataSyncService = new DataSyncService();
