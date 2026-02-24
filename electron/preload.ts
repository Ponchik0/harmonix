import { contextBridge, ipcRenderer, shell } from "electron";

// Типы для локального сервера
interface ServerStartResult {
  success: boolean;
  localAddress?: string;
  networkAddress?: string;
  error?: string;
}

interface ServerStopResult {
  success: boolean;
  error?: string;
}

interface ServerStatus {
  running: boolean;
  port: number;
  localAddress: string;
  networkAddress: string;
}

// Типы для Discord RPC
interface DiscordActivity {
  details?: string;
  state?: string;
  largeImageKey?: string;
  largeImageText?: string;
  smallImageKey?: string;
  smallImageText?: string;
  startTimestamp?: number;
  endTimestamp?: number;
  buttons?: Array<{ label: string; url: string }>;
}

interface DiscordStatus {
  connected: boolean;
  mode?: "gateway" | "rpc";
  hasToken?: boolean;
  enabled?: boolean;
}

// Типы для глобальных шорткатов
interface ShortcutData {
  id: string;
  key: string;
  modifiers: { ctrl?: boolean; shift?: boolean; alt?: boolean };
  action: string;
}

// Типы для автообновления
interface UpdateCheckResult {
  success: boolean;
  updateAvailable?: boolean;
  version?: string;
  error?: string;
}

interface UpdateDownloadResult {
  success: boolean;
  error?: string;
}

interface UpdateStatus {
  status: "checking" | "available" | "not-available" | "downloading" | "downloaded" | "error";
  data?: any;
}

contextBridge.exposeInMainWorld("electronAPI", {
  // Window controls
  minimize: () => ipcRenderer.invoke("window:minimize"),
  maximize: () => ipcRenderer.invoke("window:maximize"),
  close: () => ipcRenderer.invoke("window:close"),
  setOpacity: (opacity: number) =>
    ipcRenderer.invoke("window:setOpacity", opacity),
  getOpacity: () => ipcRenderer.invoke("window:getOpacity"),
  setIcon: (isLight: boolean) =>
    ipcRenderer.invoke("window:setIcon", isLight),

  // Shell operations
  shell: {
    openExternal: (url: string) => shell.openExternal(url),
    openURL: (url: string) => ipcRenderer.invoke("shell:openURL", url),
  },

  // Local server controls
  localServer: {
    start: (port: number): Promise<ServerStartResult> =>
      ipcRenderer.invoke("localServer:start", port),
    stop: (): Promise<ServerStopResult> =>
      ipcRenderer.invoke("localServer:stop"),
    getStatus: (): Promise<ServerStatus> =>
      ipcRenderer.invoke("localServer:getStatus"),
  },

  // Discord RPC controls
  discord: {
    connect: (): Promise<DiscordStatus> =>
      ipcRenderer.invoke("discord:connect"),
    setActivity: (activity: DiscordActivity): Promise<{ success: boolean }> =>
      ipcRenderer.invoke("discord:setActivity", activity),
    clearActivity: (): Promise<{ success: boolean }> =>
      ipcRenderer.invoke("discord:clearActivity"),
    getStatus: (): Promise<DiscordStatus> =>
      ipcRenderer.invoke("discord:getStatus"),
    // Token management для Gateway mode
    setToken: (token: string): Promise<{ success: boolean }> =>
      ipcRenderer.invoke("discord:setToken", token),
    getToken: (): Promise<{ token: string; hasToken: boolean }> =>
      ipcRenderer.invoke("discord:getToken"),
    removeToken: (): Promise<{ success: boolean }> =>
      ipcRenderer.invoke("discord:removeToken"),
    autoExtract: (): Promise<{ success: boolean; found: boolean }> =>
      ipcRenderer.invoke("discord:autoExtract"),
    setEnabled: (enabled: boolean): Promise<{ success: boolean; connected: boolean }> =>
      ipcRenderer.invoke("discord:setEnabled", enabled),
  },

  // Autostart controls
  autostart: {
    set: (enabled: boolean): Promise<{ success: boolean; enabled: boolean }> =>
      ipcRenderer.invoke("autostart:set", enabled),
    get: (): Promise<{ enabled: boolean }> =>
      ipcRenderer.invoke("autostart:get"),
  },

  // Tray controls
  tray: {
    setMinimizeToTray: (enabled: boolean): Promise<{ success: boolean }> =>
      ipcRenderer.invoke("tray:setMinimizeToTray", enabled),
    setCloseToTray: (enabled: boolean): Promise<{ success: boolean }> =>
      ipcRenderer.invoke("tray:setCloseToTray", enabled),
    setStartMinimized: (enabled: boolean): Promise<{ success: boolean }> =>
      ipcRenderer.invoke("tray:setStartMinimized", enabled),
    getSettings: (): Promise<{ minimizeToTray: boolean; closeToTray: boolean; startMinimized: boolean }> =>
      ipcRenderer.invoke("tray:getSettings"),
  },

  // Window controls
  window: {
    setAlwaysOnTop: (enabled: boolean): Promise<{ success: boolean }> =>
      ipcRenderer.invoke("window:setAlwaysOnTop", enabled),
    getAlwaysOnTop: (): Promise<{ enabled: boolean }> =>
      ipcRenderer.invoke("window:getAlwaysOnTop"),
  },

  // Global shortcuts
  shortcuts: {
    register: (shortcuts: ShortcutData[]): Promise<{ success: boolean; registered: number }> =>
      ipcRenderer.invoke("shortcuts:register", shortcuts),
    unregisterAll: (): Promise<{ success: boolean }> =>
      ipcRenderer.invoke("shortcuts:unregisterAll"),
    onGlobalShortcut: (callback: (action: string) => void) => {
      ipcRenderer.on("global-shortcut", (_event, action) => callback(action));
    },
    removeGlobalShortcutListener: () => {
      ipcRenderer.removeAllListeners("global-shortcut");
    },
  },

  // Deep link handling
  deepLink: {
    onImport: (callback: (code: string) => void) => {
      ipcRenderer.on("deep-link-import", (_event, code) => callback(code));
    },
    removeImportListener: () => {
      ipcRenderer.removeAllListeners("deep-link-import");
    },
    onTrack: (callback: (trackData: string) => void) => {
      ipcRenderer.on("deep-link-track", (_event, trackData) => callback(trackData));
    },
    removeTrackListener: () => {
      ipcRenderer.removeAllListeners("deep-link-track");
    },
  },

  // Persistent storage (shared between dev & production)
  persistentStorage: {
    saveLocalStorage: (data: Record<string, string>): Promise<{ success: boolean; error?: string }> =>
      ipcRenderer.invoke("persistentStorage:saveLocalStorage", data),
    loadLocalStorage: (): Promise<{ success: boolean; data: Record<string, string>; error?: string }> =>
      ipcRenderer.invoke("persistentStorage:loadLocalStorage"),
    saveIndexedDB: (data: string): Promise<{ success: boolean; error?: string }> =>
      ipcRenderer.invoke("persistentStorage:saveIndexedDB", data),
    loadIndexedDB: (): Promise<{ success: boolean; data: string | null; error?: string }> =>
      ipcRenderer.invoke("persistentStorage:loadIndexedDB"),
    getDataPath: (): Promise<{ path: string }> =>
      ipcRenderer.invoke("persistentStorage:getDataPath"),
  },
});

// Глобальные типы
declare global {
  interface Window {
    electronAPI: {
      minimize: () => Promise<void>;
      maximize: () => Promise<void>;
      close: () => Promise<void>;
      setOpacity: (opacity: number) => Promise<{ success: boolean }>;
      getOpacity: () => Promise<number>;
      setIcon: (isLight: boolean) => Promise<{ success: boolean }>;
      shell: {
        openExternal: (url: string) => Promise<void>;
        openURL: (url: string) => Promise<{ success: boolean; error?: string }>;
      };
      localServer: {
        start: (port: number) => Promise<ServerStartResult>;
        stop: () => Promise<ServerStopResult>;
        getStatus: () => Promise<ServerStatus>;
      };
      discord: {
        connect: () => Promise<DiscordStatus>;
        setActivity: (
          activity: DiscordActivity
        ) => Promise<{ success: boolean }>;
        clearActivity: () => Promise<{ success: boolean }>;
        getStatus: () => Promise<DiscordStatus>;
        setToken: (token: string) => Promise<{ success: boolean }>;
        getToken: () => Promise<{ token: string; hasToken: boolean }>;
        removeToken: () => Promise<{ success: boolean }>;
        autoExtract: () => Promise<{ success: boolean; found: boolean }>;
        setEnabled: (enabled: boolean) => Promise<{ success: boolean; connected: boolean }>;
      };
      autostart: {
        set: (
          enabled: boolean
        ) => Promise<{ success: boolean; enabled: boolean }>;
        get: () => Promise<{ enabled: boolean }>;
      };
      shortcuts: {
        register: (shortcuts: ShortcutData[]) => Promise<{ success: boolean; registered: number }>;
        unregisterAll: () => Promise<{ success: boolean }>;
        onGlobalShortcut: (callback: (action: string) => void) => void;
        removeGlobalShortcutListener: () => void;
      };
      deepLink: {
        onImport: (callback: (code: string) => void) => void;
        removeImportListener: () => void;
        onTrack: (callback: (trackData: string) => void) => void;
        removeTrackListener: () => void;
      };
      persistentStorage: {
        saveLocalStorage: (data: Record<string, string>) => Promise<{ success: boolean; error?: string }>;
        loadLocalStorage: () => Promise<{ success: boolean; data: Record<string, string>; error?: string }>;
        saveIndexedDB: (data: string) => Promise<{ success: boolean; error?: string }>;
        loadIndexedDB: () => Promise<{ success: boolean; data: string | null; error?: string }>;
        getDataPath: () => Promise<{ path: string }>;
      };
      updater: {
        check: () => Promise<UpdateCheckResult>;
        download: () => Promise<UpdateDownloadResult>;
        install: () => Promise<{ success: boolean }>;
        getCurrentVersion: () => Promise<{ version: string }>;
        onUpdateStatus: (callback: (status: UpdateStatus) => void) => void;
        removeUpdateStatusListener: () => void;
      };
    };
  }
}
