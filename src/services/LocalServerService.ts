// LocalServerService - управление локальным медиа-сервером
// Сервер позволяет воспроизводить музыку из локальной сети

export interface ServerStatus {
  running: boolean;
  port: number;
  localAddress: string;
  networkAddress: string;
  startTime?: number;
  requestCount: number;
}

export interface ServerLog {
  timestamp: number;
  type: 'info' | 'error' | 'request' | 'success';
  message: string;
}

// Типизация для electron API
const getElectronAPI = () => window.electronAPI as ElectronAPI | undefined;

class LocalServerService {
  private status: ServerStatus = {
    running: false,
    port: 5002,
    localAddress: '',
    networkAddress: '',
    requestCount: 0
  };
  
  private logs: ServerLog[] = [];
  private listeners: Set<(status: ServerStatus) => void> = new Set();
  private logListeners: Set<(logs: ServerLog[]) => void> = new Set();
  
  constructor() {
    // Восстанавливаем настройки из localStorage
    const savedPort = localStorage.getItem('localserver_port');
    if (savedPort) {
      this.status.port = parseInt(savedPort, 10);
    }
    
    // Проверяем статус сервера при загрузке
    this.checkServerStatus();
  }
  
  private addLog(type: ServerLog['type'], message: string) {
    const log: ServerLog = {
      timestamp: Date.now(),
      type,
      message
    };
    this.logs = [...this.logs.slice(-100), log];
    this.notifyLogListeners();
  }
  
  private notifyListeners() {
    this.listeners.forEach(cb => cb(this.status));
  }
  
  private notifyLogListeners() {
    this.logListeners.forEach(cb => cb(this.logs));
  }
  
  subscribe(callback: (status: ServerStatus) => void): () => void {
    this.listeners.add(callback);
    callback(this.status);
    return () => this.listeners.delete(callback);
  }
  
  subscribeLogs(callback: (logs: ServerLog[]) => void): () => void {
    this.logListeners.add(callback);
    callback(this.logs);
    return () => this.logListeners.delete(callback);
  }
  
  getStatus(): ServerStatus {
    return { ...this.status };
  }
  
  getLogs(): ServerLog[] {
    return [...this.logs];
  }
  
  async checkServerStatus(): Promise<void> {
    const api = getElectronAPI();
    if (api?.localServer) {
      try {
        const status = await api.localServer.getStatus();
        this.status = { ...this.status, ...status };
        this.notifyListeners();
      } catch (e) {
        console.error('Failed to check server status:', e);
      }
    }
  }
  
  async start(port?: number): Promise<boolean> {
    const targetPort = port || this.status.port;
    
    this.addLog('info', `Запуск сервера на порту ${targetPort}...`);
    
    const api = getElectronAPI();
    if (api?.localServer) {
      try {
        const result = await api.localServer.start(targetPort);
        
        if (result.success) {
          this.status = {
            running: true,
            port: targetPort,
            localAddress: result.localAddress || `http://localhost:${targetPort}`,
            networkAddress: result.networkAddress || '',
            startTime: Date.now(),
            requestCount: 0
          };
          
          localStorage.setItem('localserver_port', targetPort.toString());
          this.addLog('success', `Сервер запущен на ${this.status.localAddress}`);
          if (this.status.networkAddress) {
            this.addLog('info', `Сетевой адрес: ${this.status.networkAddress}`);
          }
          this.notifyListeners();
          return true;
        } else {
          this.addLog('error', result.error || 'Не удалось запустить сервер');
          return false;
        }
      } catch (e) {
        this.addLog('error', `Ошибка: ${e}`);
        return false;
      }
    } else {
      // Fallback для браузера (демо режим)
      this.addLog('info', 'Electron API недоступен, демо режим');
      this.status = {
        running: true,
        port: targetPort,
        localAddress: `http://localhost:${targetPort}`,
        networkAddress: `http://192.168.1.x:${targetPort}`,
        startTime: Date.now(),
        requestCount: 0
      };
      this.notifyListeners();
      return true;
    }
  }
  
  async stop(): Promise<boolean> {
    this.addLog('info', 'Остановка сервера...');
    
    const api = getElectronAPI();
    if (api?.localServer) {
      try {
        const result = await api.localServer.stop();
        
        if (result.success) {
          this.status = {
            ...this.status,
            running: false,
            localAddress: '',
            networkAddress: '',
            startTime: undefined
          };
          this.addLog('success', 'Сервер остановлен');
          this.notifyListeners();
          return true;
        } else {
          this.addLog('error', result.error || 'Не удалось остановить сервер');
          return false;
        }
      } catch (e) {
        this.addLog('error', `Ошибка: ${e}`);
        return false;
      }
    } else {
      // Fallback для браузера
      this.status = {
        ...this.status,
        running: false,
        localAddress: '',
        networkAddress: ''
      };
      this.addLog('success', 'Сервер остановлен (демо)');
      this.notifyListeners();
      return true;
    }
  }
  
  setPort(port: number) {
    if (!this.status.running) {
      this.status.port = port;
      localStorage.setItem('localserver_port', port.toString());
      this.notifyListeners();
    }
  }
  
  clearLogs() {
    this.logs = [];
    this.notifyLogListeners();
  }
  
  // Получить URL для проксирования аудио
  getProxyUrl(originalUrl: string): string {
    if (!this.status.running) return originalUrl;
    return `${this.status.localAddress}/proxy?url=${encodeURIComponent(originalUrl)}`;
  }
}

export const localServerService = new LocalServerService();
