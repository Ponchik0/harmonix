export {};

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
  // New fields for "Listening to" with progress bar
  songDuration?: number;
  elapsedSeconds?: number;
  isPaused?: boolean;
  trackUrl?: string;
  artistUrl?: string;
}

interface DiscordStatus {
  connected: boolean;
}

declare global {
  interface ElectronAPI {
    minimize: () => Promise<void>;
    maximize: () => Promise<void>;
    close: () => Promise<void>;
    setOpacity: (opacity: number) => Promise<{ success: boolean }>;
    getOpacity: () => Promise<number>;
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
      setActivity: (activity: DiscordActivity) => Promise<{ success: boolean }>;
      clearActivity: () => Promise<{ success: boolean }>;
      getStatus: () => Promise<DiscordStatus>;
    };
    autostart: {
      set: (
        enabled: boolean
      ) => Promise<{ success: boolean; enabled: boolean }>;
      get: () => Promise<{ enabled: boolean }>;
    };
    tray: {
      setMinimizeToTray: (enabled: boolean) => Promise<{ success: boolean }>;
      setCloseToTray: (enabled: boolean) => Promise<{ success: boolean }>;
      setStartMinimized: (enabled: boolean) => Promise<{ success: boolean }>;
      getSettings: () => Promise<{ minimizeToTray: boolean; closeToTray: boolean; startMinimized: boolean }>;
    };
    window: {
      setAlwaysOnTop: (enabled: boolean) => Promise<{ success: boolean }>;
      getAlwaysOnTop: () => Promise<{ enabled: boolean }>;
    };
    setIcon?: (isLightTheme: boolean) => void;
    deepLink?: {
      onImport: (cb: (data: any) => void) => void;
      onTrack: (cb: (data: any) => void) => void;
      removeImportListener: () => void;
      removeTrackListener: () => void;
    };
    shortcuts?: {
      register: (shortcuts: any) => Promise<void>;
      onGlobalShortcut: (cb: (shortcut: string) => void) => void;
      removeGlobalShortcutListener: () => void;
    };
  }

  interface Window {
    electronAPI?: ElectronAPI;
  }
}
