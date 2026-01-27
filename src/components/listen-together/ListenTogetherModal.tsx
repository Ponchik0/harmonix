import { useState, useEffect } from "react";
import { useUserStore } from "../../stores/userStore";
import { useThemeStore } from "../../stores/themeStore";
import {
  listenTogetherService,
  ListenRoom,
} from "../../services/ListenTogetherService";
import {
  HiXMark,
  HiOutlineUsers,
  HiOutlinePlay,
  HiOutlinePause,
  HiOutlineLink,
  HiOutlineArrowRightOnRectangle,
  HiOutlinePlusCircle,
} from "react-icons/hi2";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

type Mode = "menu" | "join" | "room";

export function ListenTogetherModal({ isOpen, onClose }: Props) {
  const { user } = useUserStore();
  const { currentTheme } = useThemeStore();
  const colors = currentTheme.colors;

  const [mode, setMode] = useState<Mode>("menu");
  const [room, setRoom] = useState<ListenRoom | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isHost, setIsHost] = useState(false);

  // Проверяем есть ли активная комната при открытии
  useEffect(() => {
    if (isOpen) {
      const checkRoom = async () => {
        if (listenTogetherService.isInRoom()) {
          const currentRoom = await listenTogetherService.getCurrentRoom();
          if (currentRoom) {
            setRoom(currentRoom);
            setIsHost(listenTogetherService.isHost());
            setMode("room");
          }
        } else {
          setMode("menu");
          setRoom(null);
        }
      };
      checkRoom();
      setJoinCode("");
      setError("");
    }
  }, [isOpen]);

  // Подписываемся на обновления комнаты
  useEffect(() => {
    if (!isOpen || !room) return;

    listenTogetherService.startPolling((updatedRoom) => {
      setRoom(updatedRoom);
    });

    return () => {
      listenTogetherService.stopPolling();
    };
  }, [isOpen, room?.id]);

  const handleCreateRoom = async () => {
    if (!user) return;
    setIsLoading(true);
    setError("");

    const newRoom = await listenTogetherService.createRoom(
      user.uid,
      user.displayName,
      user.avatar || ""
    );

    if (newRoom) {
      console.log("[ListenTogether] Room created:", newRoom.code);
      setRoom(newRoom);
      setIsHost(true);
      setMode("room");
    } else {
      setError("Не удалось создать комнату");
    }
    setIsLoading(false);
  };

  const handleJoinRoom = async () => {
    if (!user || !joinCode.trim()) return;
    setIsLoading(true);
    setError("");

    const foundRoom = await listenTogetherService.findRoomByCode(joinCode);
    if (!foundRoom) {
      setError("Комната не найдена");
      setIsLoading(false);
      return;
    }

    const joinedRoom = await listenTogetherService.joinRoom(
      foundRoom.id,
      user.uid,
      user.displayName,
      user.avatar || ""
    );

    if (joinedRoom) {
      console.log("[ListenTogether] Joined room:", joinedRoom.code);
      setRoom(joinedRoom);
      setIsHost(false);
      setMode("room");
    } else {
      setError("Не удалось присоединиться");
    }
    setIsLoading(false);
  };

  const handleLeaveRoom = async () => {
    if (!user) return;
    console.log("[ListenTogether] Leaving room");
    await listenTogetherService.leaveRoom(user.uid);
    setRoom(null);
    setIsHost(false);
    setMode("menu");
  };

  const copyCode = () => {
    if (room?.code) {
      navigator.clipboard.writeText(room.code);
      window.dispatchEvent(
        new CustomEvent("show-toast", {
          detail: { message: "Код скопирован!", type: "success" },
        })
      );
    }
  };

  if (!isOpen) return null;

  const cardBg =
    currentTheme.mode === "light"
      ? "rgba(255,255,255,0.95)"
      : "rgba(24,24,32,0.95)";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: cardBg, border: "1px solid var(--border-base)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-4 border-b"
          style={{ borderColor: "var(--border-base)" }}
        >
          <div className="flex items-center gap-2">
            <HiOutlineUsers size={24} style={{ color: colors.accent }} />
            <h2
              className="text-lg font-bold"
              style={{ color: colors.textPrimary }}
            >
              Совместное прослушивание
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <HiXMark size={20} style={{ color: colors.textSecondary }} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Menu */}
          {mode === "menu" && (
            <div className="space-y-3">
              <p
                className="text-sm text-center mb-4"
                style={{ color: colors.textSecondary }}
              >
                Слушайте музыку вместе с друзьями в реальном времени
              </p>
              <button
                onClick={handleCreateRoom}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all hover:opacity-90"
                style={{ background: colors.accent, color: "var(--interactive-accent-text)" }}
              >
                <HiOutlinePlusCircle size={20} />
                {isLoading ? "Создание..." : "Создать комнату"}
              </button>
              <button
                onClick={() => setMode("join")}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all hover:opacity-80"
                style={{
                  background: "rgba(255,255,255,0.1)",
                  color: colors.textPrimary,
                }}
              >
                <HiOutlineArrowRightOnRectangle size={20} />
                Присоединиться по коду
              </button>
            </div>
          )}

          {/* Join */}
          {mode === "join" && (
            <div className="space-y-4">
              <button
                onClick={() => setMode("menu")}
                className="text-sm hover:underline"
                style={{ color: colors.textSecondary }}
              >
                ← Назад
              </button>
              <div>
                <label
                  className="text-sm mb-2 block"
                  style={{ color: colors.textSecondary }}
                >
                  Введите код комнаты
                </label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="XXXXXX"
                  maxLength={6}
                  className="w-full px-4 py-3 rounded-xl text-center text-2xl font-mono tracking-widest focus:outline-none"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid var(--border-base)",
                    color: colors.textPrimary,
                  }}
                />
              </div>
              {error && (
                <p className="text-sm text-red-400 text-center">{error}</p>
              )}
              <button
                onClick={handleJoinRoom}
                disabled={isLoading || joinCode.length < 6}
                className="w-full py-3 rounded-xl font-medium transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: colors.accent, color: "var(--interactive-accent-text)" }}
              >
                {isLoading ? "Подключение..." : "Присоединиться"}
              </button>
            </div>
          )}

          {/* Room */}
          {mode === "room" && room && (
            <div className="space-y-4">
              {/* Room Code */}
              <div
                className="text-center p-4 rounded-xl"
                style={{ background: "rgba(255,255,255,0.05)" }}
              >
                <p
                  className="text-xs mb-1"
                  style={{ color: colors.textSecondary }}
                >
                  Код комнаты
                </p>
                <div className="flex items-center justify-center gap-2">
                  <span
                    className="text-3xl font-mono font-bold tracking-widest"
                    style={{ color: colors.accent }}
                  >
                    {room.code}
                  </span>
                  <button
                    onClick={copyCode}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <HiOutlineLink
                      size={20}
                      style={{ color: colors.textSecondary }}
                    />
                  </button>
                </div>
                <p
                  className="text-xs mt-2"
                  style={{ color: colors.textSecondary }}
                >
                  {isHost
                    ? "Вы хост - ваша музыка транслируется"
                    : "Вы слушатель - музыка синхронизируется"}
                </p>
              </div>

              {/* Host */}
              <div
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: "rgba(255,255,255,0.05)" }}
              >
                <div className="w-10 h-10 rounded-full overflow-hidden bg-purple-500/20 flex items-center justify-center">
                  {room.hostAvatar ? (
                    <img
                      src={room.hostAvatar}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>👤</span>
                  )}
                </div>
                <div className="flex-1">
                  <p
                    className="font-medium"
                    style={{ color: colors.textPrimary }}
                  >
                    {room.hostName}
                  </p>
                  <p className="text-xs" style={{ color: colors.accent }}>
                    Хост
                  </p>
                </div>
                {room.isPlaying ? (
                  <HiOutlinePause size={20} style={{ color: colors.accent }} />
                ) : (
                  <HiOutlinePlay
                    size={20}
                    style={{ color: colors.textSecondary }}
                  />
                )}
              </div>

              {/* Listeners */}
              {room.listeners.length > 0 && (
                <div>
                  <p
                    className="text-xs mb-2"
                    style={{ color: colors.textSecondary }}
                  >
                    Слушатели ({room.listeners.length})
                  </p>
                  <div className="space-y-2">
                    {room.listeners.map((listener) => (
                      <div
                        key={listener.odId}
                        className="flex items-center gap-3 p-2 rounded-lg"
                        style={{ background: "rgba(255,255,255,0.03)" }}
                      >
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-purple-500/20 flex items-center justify-center">
                          {listener.avatar ? (
                            <img
                              src={listener.avatar}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-sm">👤</span>
                          )}
                        </div>
                        <span
                          className="text-sm"
                          style={{ color: colors.textPrimary }}
                        >
                          {listener.odName}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Current Track */}
              {room.currentTrack && (
                <div
                  className="p-3 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.05)" }}
                >
                  <p
                    className="text-xs mb-2"
                    style={{ color: colors.textSecondary }}
                  >
                    Сейчас играет
                  </p>
                  <div className="flex items-center gap-3">
                    {room.currentTrack.artwork && (
                      <img
                        src={room.currentTrack.artwork}
                        alt=""
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p
                        className="font-medium truncate"
                        style={{ color: colors.textPrimary }}
                      >
                        {room.currentTrack.title}
                      </p>
                      <p
                        className="text-sm truncate"
                        style={{ color: colors.textSecondary }}
                      >
                        {room.currentTrack.artist}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Leave Button */}
              <button
                onClick={handleLeaveRoom}
                className="w-full py-3 rounded-xl font-medium transition-all hover:opacity-90"
                style={{
                  background: "rgba(239, 68, 68, 0.1)",
                  color: "#EF4444",
                }}
              >
                {isHost ? "Закрыть комнату" : "Покинуть комнату"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
