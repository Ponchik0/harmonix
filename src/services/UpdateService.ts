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
  private currentVersion: string = '1.0.0';
  private cachedUpdate: UpdateInfo | null = null;
  private listeners: Set<(update: UpdateInfo | null) => void> = new Set();
  private statusListeners: Set<(status: UpdateStatus) => void> = new Set();
  private isElectron: boolean = false;

  constructor() {
    this.isElectron = typeof window !== 'undefined' && window.electronAPI !== undefined;
    this.setupStatusListener();
  }

  private setupStatusListener() {
    if (this.isElectron && window.electronAPI?.updater) {
      window.electronAPI.updater.onUpdateStatus((status: UpdateStatus) => {
        this.notifyStatusListeners(status);

        if (status.status === 'available' && status.data?.version) {
          const updateInfo: UpdateInfo = {
            version: status.data.version,
            releaseDate: status.data.releaseDate,
            changelog: status.data.releaseNotes || [],
            mandatory: status.data.mandatory,
          };
          this.cachedUpdate = updateInfo;
          this.notifyListeners(updateInfo);
        } else if (status.status === 'not-available') {
          this.cachedUpdate = null;
          this.notifyListeners(null);
        }
      });
    }
  }

  async getCurrentVersion(): Promise<string> {
    if (this.isElectron && window.electronAPI?.updater) {
      try {
        const result = await window.electronAPI.updater.getCurrentVersion();
        this.currentVersion = result.version;
        return result.version;
      } catch (error) {
        console.error('[UpdateService] Failed to get current version:', error);
      }
    }
    return this.currentVersion;
  }

  async checkForUpdates(force = false): Promise<UpdateInfo | null> {
    if (!this.isElectron || !window.electronAPI?.updater) {
      console.log('[UpdateService] Not running in Electron or updater not available');
      return null;
    }

    try {
      const result = await window.electronAPI.updater.check();

      if (result.success && result.updateAvailable && result.version) {
        const updateInfo: UpdateInfo = {
          version: result.version,
        };
        this.cachedUpdate = updateInfo;
        return updateInfo;
      }

      this.cachedUpdate = null;
      return null;
    } catch (error) {
      console.error('[UpdateService] Error checking updates:', error);
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
  }

  // Подписка на статусы обновлений
  subscribeToStatus(callback: (status: UpdateStatus) => void): () => void {
    this.statusListeners.add(callback);
    return () => this.statusListeners.delete(callback);
  }

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
