// Update Service - проверка и уведомление о новых версиях через electron-updater

export interface UpdateInfo {
  version: string;
  releaseDate?: string;
  changelog?: string[];
  downloadUrl?: string;
  mandatory?: boolean;
}

export interface UpdateStatus {
  status: 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error';
  data?: any;
}

class UpdateService {
  private currentVersion: string = '1.0.2';
  private cachedUpdate: UpdateInfo | null = null;
  private listeners: Set<(update: UpdateInfo | null) => void> = new Set();
  private statusListeners: Set<(status: UpdateStatus) => void> = new Set();
  private isElectron: boolean = false;
  private lastCheck: number = 0;
  private readonly CHECK_INTERVAL = 1000 * 60 * 60; // 1 hour

  constructor() {
    this.isElectron = typeof window !== 'undefined' && window.electronAPI !== undefined;
    
    // Listen to updater events from main process
    if (this.isElectron && window.electronAPI?.updater) {
      this.setupEventListeners();
    }
  }

  private setupEventListeners() {
    // These would be set up via IPC in electron/main.ts
    // For now, we'll handle them when they're called
  }

  getCurrentVersion(): Promise<string> {
    // Возвращаем версию из package.json
    return Promise.resolve('1.0.2');
  }

  // Сравнение версий (1.0.0 < 1.0.1 < 1.1.0 < 2.0.0)
  private compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const p1 = parts1[i] || 0;
      const p2 = parts2[i] || 0;
      if (p1 < p2) return -1;
      if (p1 > p2) return 1;
    }
    return 0;
  }

  async checkForUpdates(force = false): Promise<UpdateInfo | null> {
    if (!this.isElectron || !window.electronAPI?.updater) {
      console.log('[UpdateService] Not running in Electron or updater not available');
      return null;
    }

    const now = Date.now();
    const CHECK_INTERVAL = this.CHECK_INTERVAL;
    
    // Используем кэш если проверка была недавно
    if (!force && this.cachedUpdate && (now - this.lastCheck) < CHECK_INTERVAL) {
      return this.cachedUpdate;
    }

    try {
      const result = await window.electronAPI.updater.check();

      if (result.success && result.updateAvailable && result.version) {
        const updateInfo: UpdateInfo = {
          version: result.version,
          releaseDate: result.data?.releaseDate,
          changelog: result.data?.releaseNotes || [],
          mandatory: result.data?.mandatory,
        };
        this.lastCheck = now;
        this.cachedUpdate = updateInfo;
        this.notifyListeners(updateInfo);
        return updateInfo;
      }

      this.lastCheck = now;
      this.cachedUpdate = null;
      this.notifyListeners(null);
      return null;
    } catch (error) {
      console.log('[UpdateService] Error checking updates:', error);
      return null;
    }
  }

  async downloadUpdate(): Promise<boolean> {
    if (!this.isElectron || !window.electronAPI?.updater) {
      console.log('[UpdateService] Not running in Electron or updater not available');
      return false;
    }

    try {
      const result = await window.electronAPI.updater.download();
      return result.success;
    } catch (error) {
      console.error('[UpdateService] Error downloading update:', error);
      return false;
    }
  }

  async installUpdate(): Promise<boolean> {
    if (!this.isElectron || !window.electronAPI?.updater) {
      console.log('[UpdateService] Not running in Electron or updater not available');
      return false;
    }

    try {
      await window.electronAPI.updater.install();
      return true;
    } catch (error) {
      console.error('[UpdateService] Error installing update:', error);
      return false;
    }
  }

  // Подписка на обновления
  subscribe(callback: (update: UpdateInfo | null) => void): () => void {
    this.listeners.add(callback);
    // Сразу отправляем текущее состояние
    if (this.cachedUpdate) {
      callback(this.cachedUpdate);
    }
    return () => this.listeners.delete(callback);
  };

  // Подписка на статусы обновлений
  subscribeToStatus(callback: (status: UpdateStatus) => void): () => void {
    this.statusListeners.add(callback);
    return () => this.statusListeners.delete(callback);
  };

  private notifyListeners(update: UpdateInfo | null) {
    this.listeners.forEach(cb => cb(update));
  }

  private notifyStatusListeners(status: UpdateStatus) {
    this.statusListeners.forEach(cb => cb(status));
  }

  // Пометить что пользователь видел обновление
  dismissUpdate(version: string) {
    localStorage.setItem('harmonix-dismissed-update', version);
  }

  isDismissed(version: string): boolean {
    return localStorage.getItem('harmonix-dismissed-update') === version;
  }

  // Открыть страницу загрузки (для веб-версии)
  openDownloadPage(url: string) {
    window.open(url, '_blank');
  }
}

export const updateService = new UpdateService();
