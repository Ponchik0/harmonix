import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ExecutionMode = 'local' | 'server';

export interface ServiceModes {
  tokenVerify: ExecutionMode;
  search: ExecutionMode;
  trackDetails: ExecutionMode;
  artistInfo: ExecutionMode;
  albumInfo: ExecutionMode;
  playlists: ExecutionMode;
  importPlaylists: ExecutionMode;
  importAlbums: ExecutionMode;
  liked: ExecutionMode;
  history: ExecutionMode;
  recommendations: ExecutionMode;
  myWave: ExecutionMode;
  mixes: ExecutionMode;
  radio: ExecutionMode;
  charts: ExecutionMode;
  newReleases: ExecutionMode;
  lyrics: ExecutionMode;
  stream: ExecutionMode;
}

const defaultModes: ServiceModes = {
  tokenVerify: 'local',
  search: 'local',
  trackDetails: 'local',
  artistInfo: 'local',
  albumInfo: 'local',
  playlists: 'local',
  importPlaylists: 'local',
  importAlbums: 'local',
  liked: 'local',
  history: 'local',
  recommendations: 'local',
  myWave: 'local',
  mixes: 'local',
  radio: 'local',
  charts: 'local',
  newReleases: 'local',
  lyrics: 'local',
  stream: 'local',
};

export const allFeatures: (keyof ServiceModes)[] = [
  'tokenVerify', 'search', 'trackDetails', 'artistInfo', 'albumInfo',
  'playlists', 'importPlaylists', 'importAlbums', 'liked', 'history',
  'recommendations', 'myWave', 'mixes', 'radio', 'charts', 'newReleases',
  'lyrics', 'stream',
];

// Feature groups for UI
export const featureGroups = {
  auth: { label: 'Авторизация', features: ['tokenVerify'] as (keyof ServiceModes)[] },
  search: { label: 'Поиск', features: ['search', 'trackDetails', 'artistInfo', 'albumInfo'] as (keyof ServiceModes)[] },
  library: { label: 'Библиотека', features: ['playlists', 'importPlaylists', 'importAlbums', 'liked', 'history'] as (keyof ServiceModes)[] },
  personalization: { label: 'Персонализация', features: ['recommendations', 'myWave', 'mixes'] as (keyof ServiceModes)[] },
  content: { label: 'Контент', features: ['radio', 'charts', 'newReleases', 'lyrics'] as (keyof ServiceModes)[] },
  playback: { label: 'Воспроизведение', features: ['stream'] as (keyof ServiceModes)[] },
};

// Feature labels for UI
export const featureLabels: Record<keyof ServiceModes, string> = {
  tokenVerify: 'Проверка токена',
  search: 'Поиск',
  trackDetails: 'Детали трека',
  artistInfo: 'Инфо об артисте',
  albumInfo: 'Инфо об альбоме',
  playlists: 'Плейлисты',
  importPlaylists: 'Импорт плейлистов',
  importAlbums: 'Импорт альбомов',
  liked: 'Избранное',
  history: 'История',
  recommendations: 'Рекомендации',
  myWave: 'Моя волна',
  mixes: 'Миксы',
  radio: 'Радио',
  charts: 'Чарты',
  newReleases: 'Новинки',
  lyrics: 'Тексты',
  stream: 'Стриминг',
};

interface ExecutionModeState {
  spotify: ServiceModes;
  yandex: ServiceModes;
  vk: ServiceModes;
  soundcloud: ServiceModes;
  youtube: ServiceModes;
  setServiceMode: (service: string, feature: keyof ServiceModes, mode: ExecutionMode) => void;
  setAllServiceModes: (service: string, mode: ExecutionMode) => void;
  getMode: (service: string, feature: keyof ServiceModes) => ExecutionMode;
}

type ServiceKey = 'spotify' | 'yandex' | 'vk' | 'soundcloud' | 'youtube';

export const useExecutionModeStore = create<ExecutionModeState>()(
  persist(
    (set, get) => ({
      spotify: { ...defaultModes },
      yandex: { ...defaultModes },
      vk: { ...defaultModes },
      soundcloud: { ...defaultModes },
      youtube: { ...defaultModes },

      setServiceMode: (service, feature, mode) => {
        set((state) => ({
          ...state,
          [service]: { ...(state[service as ServiceKey] || defaultModes), [feature]: mode },
        }));
      },

      setAllServiceModes: (service, mode) => {
        const newModes: ServiceModes = {} as ServiceModes;
        allFeatures.forEach(f => { newModes[f] = mode; });
        set((state) => ({ ...state, [service]: newModes }));
      },

      getMode: (service, feature) => {
        const state = get();
        const serviceModes = state[service as ServiceKey];
        return serviceModes?.[feature] ?? 'local';
      },
    }),
    { name: 'harmonix-execution-modes' }
  )
);
