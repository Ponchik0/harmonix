/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SOUNDCLOUD_CLIENT_ID: string;
  readonly VITE_SOUNDCLOUD_CLIENT_SECRET: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Electron API types
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

interface UpdateStatus {
  status: 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error';
  data?: any;
}

interface ElectronAPI {
  minimize: () => Promise<void>;
  maximize: () => Promise<void>;
  close: () => Promise<void>;
  setOpacity?: (opacity: number) => Promise<{ success: boolean }>;
  getOpacity?: () => Promise<number>;
  localServer?: {
    start: (port: number) => Promise<ServerStartResult>;
    stop: () => Promise<ServerStopResult>;
    getStatus: () => Promise<ServerStatus>;
  };
  discord?: {
    connect: () => Promise<{ connected: boolean }>;
    setActivity: (activity: any) => Promise<{ success: boolean }>;
    clearActivity: () => Promise<{ success: boolean }>;
    getStatus: () => Promise<{ connected: boolean }>;
  };
}

interface Window {
  electronAPI?: ElectronAPI;
}
