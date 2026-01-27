// Listen Together Service - совместное прослушивание через облако
import { cloudSyncService } from "./CloudSyncService";
import { audioService } from "./AudioService";
import { usePlayerStore } from "../stores/playerStore";

export interface ListenRoom {
  id: string;
  code: string; // 6-значный код для входа
  hostId: string;
  hostName: string;
  hostAvatar: string;
  listeners: {
    odId: string;
    odName: string;
    avatar: string;
    joinedAt: string;
  }[];
  currentTrack: {
    id: string;
    title: string;
    artist: string;
    artwork: string;
    duration: number;
    streamUrl: string;
  } | null;
  isPlaying: boolean;
  currentTime: number;
  lastUpdate: string;
  createdAt: string;
}

class ListenTogetherService {
  private pollInterval: NodeJS.Timeout | null = null;
  private hostSyncInterval: NodeJS.Timeout | null = null;
  private currentRoomId: string | null = null;
  private isHostMode: boolean = false;
  private onUpdateCallback: ((room: ListenRoom) => void) | null = null;
  private lastSyncedTrackId: string | null = null;

  // Генерация 6-значного кода
  private generateCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  // Получить все комнаты
  async getRooms(): Promise<ListenRoom[]> {
    try {
      // Очищаем кэш чтобы получить свежие данные
      cloudSyncService.clearCache();
      const data = await cloudSyncService.fetchUsers();
      if (data && (data as any).rooms) {
        return (data as any).rooms;
      }
      return [];
    } catch (e) {
      console.error("[ListenTogether] Ошибка получения комнат:", e);
      return [];
    }
  }

  // Сохранить комнаты
  private async saveRooms(rooms: ListenRoom[]): Promise<boolean> {
    try {
      cloudSyncService.clearCache();
      const data = await cloudSyncService.fetchUsers();
      if (!data) return false;

      (data as any).rooms = rooms;
      (data as any).updatedAt = new Date().toISOString();

      return await cloudSyncService.saveUsers(data);
    } catch (e) {
      console.error("[ListenTogether] Ошибка сохранения:", e);
      return false;
    }
  }

  // Создать комнату
  async createRoom(
    hostId: string,
    hostName: string,
    hostAvatar: string
  ): Promise<ListenRoom | null> {
    try {
      const rooms = await this.getRooms();

      // Удаляем старые комнаты этого хоста
      const filteredRooms = rooms.filter((r) => r.hostId !== hostId);

      const room: ListenRoom = {
        id: `room_${Date.now()}`,
        code: this.generateCode(),
        hostId,
        hostName,
        hostAvatar,
        listeners: [],
        currentTrack: null,
        isPlaying: false,
        currentTime: 0,
        lastUpdate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      filteredRooms.push(room);
      await this.saveRooms(filteredRooms);

      this.currentRoomId = room.id;
      this.isHostMode = true;

      // Запускаем синхронизацию хоста
      this.startHostSync();

      return room;
    } catch (e) {
      console.error("[ListenTogether] Ошибка создания комнаты:", e);
      return null;
    }
  }

  // Найти комнату по коду
  async findRoomByCode(code: string): Promise<ListenRoom | null> {
    const rooms = await this.getRooms();
    return (
      rooms.find((r) => r.code.toUpperCase() === code.toUpperCase()) || null
    );
  }

  // Присоединиться к комнате
  async joinRoom(
    roomId: string,
    odId: string,
    odName: string,
    avatar: string
  ): Promise<ListenRoom | null> {
    try {
      const rooms = await this.getRooms();
      const roomIndex = rooms.findIndex((r) => r.id === roomId);

      if (roomIndex === -1) return null;

      // Проверяем не присоединён ли уже
      if (!rooms[roomIndex].listeners.some((l) => l.odId === odId)) {
        rooms[roomIndex].listeners.push({
          odId,
          odName,
          avatar,
          joinedAt: new Date().toISOString(),
        });
      }

      rooms[roomIndex].lastUpdate = new Date().toISOString();
      await this.saveRooms(rooms);

      this.currentRoomId = roomId;
      this.isHostMode = false;

      // Запускаем синхронизацию слушателя
      this.startListenerSync();

      return rooms[roomIndex];
    } catch (e) {
      console.error("[ListenTogether] Ошибка присоединения:", e);
      return null;
    }
  }

  // Покинуть комнату
  async leaveRoom(odId: string): Promise<void> {
    try {
      const rooms = await this.getRooms();

      for (const room of rooms) {
        // Если это хост - удаляем комнату
        if (room.hostId === odId) {
          const filtered = rooms.filter((r) => r.id !== room.id);
          await this.saveRooms(filtered);
          break;
        }

        // Если слушатель - удаляем из списка
        const listenerIndex = room.listeners.findIndex((l) => l.odId === odId);
        if (listenerIndex !== -1) {
          room.listeners.splice(listenerIndex, 1);
          room.lastUpdate = new Date().toISOString();
          await this.saveRooms(rooms);
          break;
        }
      }

      this.stopAllSync();
      this.currentRoomId = null;
      this.isHostMode = false;
      this.lastSyncedTrackId = null;
    } catch (e) {
      console.error("[ListenTogether] Ошибка выхода:", e);
    }
  }

  // Обновить состояние воспроизведения (только хост)
  async updatePlayback(
    roomId: string,
    track: ListenRoom["currentTrack"],
    isPlaying: boolean,
    currentTime: number
  ): Promise<void> {
    try {
      const rooms = await this.getRooms();
      const roomIndex = rooms.findIndex((r) => r.id === roomId);

      if (roomIndex === -1) return;

      rooms[roomIndex].currentTrack = track;
      rooms[roomIndex].isPlaying = isPlaying;
      rooms[roomIndex].currentTime = currentTime;
      rooms[roomIndex].lastUpdate = new Date().toISOString();

      await this.saveRooms(rooms);
    } catch (e) {
      console.error("[ListenTogether] Ошибка обновления:", e);
    }
  }

  // Получить текущую комнату
  async getCurrentRoom(): Promise<ListenRoom | null> {
    if (!this.currentRoomId) return null;
    const rooms = await this.getRooms();
    return rooms.find((r) => r.id === this.currentRoomId) || null;
  }

  // Запустить синхронизацию хоста (отправка данных)
  private startHostSync(): void {
    this.stopHostSync();

    console.log("[ListenTogether] Starting host sync...");

    this.hostSyncInterval = setInterval(async () => {
      if (!this.currentRoomId || !this.isHostMode) return;

      const playerState = usePlayerStore.getState();
      const { currentTrack, isPlaying, progress, duration } = playerState;

      if (currentTrack) {
        const currentTime = progress * duration;
        console.log(
          "[ListenTogether] Host sync:",
          currentTrack.title,
          "playing:",
          isPlaying,
          "time:",
          Math.round(currentTime)
        );

        await this.updatePlayback(
          this.currentRoomId,
          {
            id: currentTrack.id,
            title: currentTrack.title,
            artist: currentTrack.artist,
            artwork: currentTrack.artworkUrl || "",
            duration: currentTrack.duration,
            streamUrl: currentTrack.streamUrl || "",
          },
          isPlaying,
          currentTime
        );
      }
    }, 2000);
  }

  private stopHostSync(): void {
    if (this.hostSyncInterval) {
      clearInterval(this.hostSyncInterval);
      this.hostSyncInterval = null;
    }
  }

  // Запустить синхронизацию слушателя (получение данных)
  private startListenerSync(): void {
    this.stopListenerSync();

    console.log("[ListenTogether] Starting listener sync...");

    this.pollInterval = setInterval(async () => {
      if (!this.currentRoomId || this.isHostMode) return;

      const room = await this.getCurrentRoom();
      if (!room) {
        console.log("[ListenTogether] Room not found, stopping sync");
        this.stopAllSync();
        return;
      }

      // Уведомляем UI
      if (this.onUpdateCallback) {
        this.onUpdateCallback(room);
      }

      // Синхронизируем воспроизведение
      if (room.currentTrack) {
        const track = room.currentTrack;

        // Если трек изменился - загружаем новый
        if (this.lastSyncedTrackId !== track.id && track.streamUrl) {
          console.log("[ListenTogether] Loading new track:", track.title);
          this.lastSyncedTrackId = track.id;

          audioService.load(
            {
              id: track.id,
              title: track.title,
              artist: track.artist,
              artworkUrl: track.artwork,
              duration: track.duration,
              streamUrl: track.streamUrl,
              platform: "soundcloud",
              url: "",
              metadata: {},
            },
            room.isPlaying
          );
        } else {
          // Синхронизируем play/pause
          const isCurrentlyPlaying = audioService.isPlaying();
          if (room.isPlaying && !isCurrentlyPlaying) {
            console.log("[ListenTogether] Sync: play");
            audioService.play();
          } else if (!room.isPlaying && isCurrentlyPlaying) {
            console.log("[ListenTogether] Sync: pause");
            audioService.pause();
          }

          // Синхронизируем позицию (если разница > 5 сек)
          const currentTime = audioService.getCurrentTime();
          const timeDiff = Math.abs(currentTime - room.currentTime);
          if (timeDiff > 5 && track.duration > 0) {
            console.log(
              "[ListenTogether] Sync position:",
              room.currentTime,
              "current:",
              currentTime
            );
            audioService.seek(room.currentTime / track.duration);
          }
        }
      }
    }, 2000);
  }

  private stopListenerSync(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  private stopAllSync(): void {
    this.stopHostSync();
    this.stopListenerSync();
    this.onUpdateCallback = null;
  }

  // Начать опрос обновлений (для UI)
  startPolling(callback: (room: ListenRoom) => void): void {
    this.onUpdateCallback = callback;
  }

  // Остановить опрос
  stopPolling(): void {
    this.onUpdateCallback = null;
  }

  // Проверить активна ли комната
  isInRoom(): boolean {
    return this.currentRoomId !== null;
  }

  isHost(): boolean {
    return this.isHostMode;
  }

  getRoomId(): string | null {
    return this.currentRoomId;
  }

  // Удалить старые комнаты (старше 1 часа)
  async cleanupOldRooms(): Promise<void> {
    try {
      const rooms = await this.getRooms();
      const oneHourAgo = Date.now() - 60 * 60 * 1000;

      const activeRooms = rooms.filter((r) => {
        const lastUpdate = new Date(r.lastUpdate).getTime();
        return lastUpdate > oneHourAgo;
      });

      if (activeRooms.length !== rooms.length) {
        await this.saveRooms(activeRooms);
      }
    } catch (e) {
      console.error("[ListenTogether] Ошибка очистки:", e);
    }
  }
}

export const listenTogetherService = new ListenTogetherService();
