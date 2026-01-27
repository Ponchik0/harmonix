import { useState, useEffect } from "react";
import {
  HiOutlineLink,
  HiOutlineCheck,
  HiOutlineXMark,
  HiOutlineArrowTopRightOnSquare,
  HiOutlineShieldCheck,
  HiOutlineGlobeAlt,
  HiOutlineClipboard,
  HiOutlineQuestionMarkCircle,
  HiOutlinePhoto,
  HiOutlineMusicalNote,
  HiOutlinePlay,
  HiOutlinePause,
  HiOutlineUser,
  HiOutlineLockClosed,
} from "react-icons/hi2";
import {
  FaSpotify,
  FaYoutube,
  FaSoundcloud,
  FaVk,
  FaYandex,
  FaDiscord,
  FaTelegram,
} from "react-icons/fa";
import { useUserStore } from "../../stores/userStore";
import { useThemeStore } from "../../stores/themeStore";
import { usePlayerStore } from "../../stores/playerStore";
import { usePlayerSettingsStore } from "../../stores/playerSettingsStore";


interface Integration {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  bgColor: string;
  connected: boolean;
  features: string[];
  tutorial?: {
    steps: string[];
    link?: string;
    linkText?: string;
  };
  comingSoon?: boolean;
}

// Discord settings storage key
const DISCORD_SETTINGS_KEY = "harmonix-discord-settings";
const TELEGRAM_SETTINGS_KEY = "harmonix-telegram-settings";

interface DiscordSettings {
  enabled: boolean;
  showArtwork: boolean;
  customArtworkUrl: string;
}

interface TelegramSettings {
  connected: boolean;
  username: string;
  chatId: string;
}

const defaultDiscordSettings: DiscordSettings = {
  enabled: false,
  showArtwork: true,
  customArtworkUrl: "",
};

const defaultTelegramSettings: TelegramSettings = {
  connected: false,
  username: "",
  chatId: "",
};

export function IntegrationsView() {
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [showTutorial, setShowTutorial] = useState<string | null>(null);
  const [tokenInput, setTokenInput] = useState("");
  const [discordSettings, setDiscordSettings] = useState<DiscordSettings>(
    () => {
      try {
        const saved = localStorage.getItem(DISCORD_SETTINGS_KEY);
        return saved
          ? { ...defaultDiscordSettings, ...JSON.parse(saved) }
          : defaultDiscordSettings;
      } catch {
        return defaultDiscordSettings;
      }
    }
  );
  const [telegramSettings, setTelegramSettings] = useState<TelegramSettings>(
    () => {
      try {
        const saved = localStorage.getItem(TELEGRAM_SETTINGS_KEY);
        return saved
          ? { ...defaultTelegramSettings, ...JSON.parse(saved) }
          : defaultTelegramSettings;
      } catch {
        return defaultTelegramSettings;
      }
    }
  );
  const [tgUsername, setTgUsername] = useState("");
  const [tgPassword, setTgPassword] = useState("");
  const [tgLoading, setTgLoading] = useState(false);
  const [tgError, setTgError] = useState("");
  const [showTelegramPanel, setShowTelegramPanel] = useState(false);

  const { user, updateProfile } = useUserStore();
  const { currentTheme } = useThemeStore();
  const { colors } = currentTheme;
  // Use selectors to prevent re-renders from progress updates
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const isPlaying = usePlayerStore((state) => state.isPlaying);

  // Save discord settings
  const saveDiscordSettings = (settings: DiscordSettings) => {
    setDiscordSettings(settings);
    localStorage.setItem(DISCORD_SETTINGS_KEY, JSON.stringify(settings));
  };

  // Save telegram settings
  const saveTelegramSettings = (settings: TelegramSettings) => {
    setTelegramSettings(settings);
    localStorage.setItem(TELEGRAM_SETTINGS_KEY, JSON.stringify(settings));
  };

  // Telegram login handler
  const handleTelegramLogin = async () => {
    if (!tgUsername.trim() || !tgPassword.trim()) {
      setTgError("Введите логин и пароль");
      return;
    }

    setTgLoading(true);
    setTgError("");

    // Симуляция входа - в реальности бот проверит данные
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Сохраняем данные для синхронизации с ботом
    saveTelegramSettings({
      connected: true,
      username: tgUsername,
      chatId: "", // Будет заполнено после привязки в боте
    });

    setTgLoading(false);
    setTgUsername("");
    setTgPassword("");
    setShowTelegramPanel(false);
  };

  // Telegram disconnect
  const handleTelegramDisconnect = () => {
    saveTelegramSettings(defaultTelegramSettings);
  };

  // Sync data to Telegram bot
  const syncToTelegram = async () => {
    if (!telegramSettings.connected) return;

    const syncData = {
      odId: user?.uid,
      odUsername: user?.username,
      displayName: user?.displayName,
      coins: useUserStore.getState().coins,
      isAdmin: user?.isAdmin,
      inventory: {
        banners: useUserStore
          .getState()
          .ownedItems.filter((i) => i.startsWith("banner_")),
        frames: useUserStore
          .getState()
          .ownedItems.filter((i) => i.startsWith("frame_")),
        titles: useUserStore
          .getState()
          .ownedItems.filter((i) => i.startsWith("title_")),
        backgrounds: useUserStore
          .getState()
          .ownedItems.filter((i) => i.startsWith("bg_")),
      },
      equipped: useUserStore.getState().equippedItems,
      stats: {
        tracksPlayed: user?.stats.tracksPlayed || 0,
        hoursListened: user?.stats.hoursListened || 0,
      },
    };

    // Кодируем в base64 для отправки боту
    const base64Data = btoa(
      unescape(encodeURIComponent(JSON.stringify(syncData)))
    );
    console.log(
      "[Telegram Sync] Data ready:",
      base64Data.substring(0, 50) + "..."
    );

    // Показываем уведомление
    window.dispatchEvent(
      new CustomEvent("show-toast", {
        detail: {
          message:
            "Данные готовы к синхронизации. Отправьте боту команду /sync",
          type: "info",
        },
      })
    );
  };

  useEffect(() => {
    // Notify Discord RPC service about settings change
    if (typeof window !== "undefined" && (window as any).electronAPI?.discord) {
      // Import and use the service directly
      import("../../services/DiscordRPCService").then(
        ({ discordRPCService }) => {
          discordRPCService.setEnabled(discordSettings.enabled);
        }
      );
    }
  }, [discordSettings.enabled]);

  const integrations: Integration[] = [
    {
      id: "soundcloud",
      name: "SoundCloud",
      description: "Основной источник музыки",
      icon: FaSoundcloud,
      color: "#FF5500",
      bgColor: "rgba(255, 85, 0, 0.15)",
      connected: true,
      features: ["Поиск треков", "Плейлисты", "Лайки"],
    },
    {
      id: "spotify",
      name: "Spotify",
      description: "Импорт плейлистов и лайков",
      icon: FaSpotify,
      color: "#1DB954",
      bgColor: "rgba(29, 185, 84, 0.15)",
      connected: (user?.integrations as any)?.spotify || false,
      features: ["Импорт плейлистов", "Синхронизация лайков", "Рекомендации"],
      tutorial: {
        steps: [
          "Перейдите на Spotify Developer Dashboard",
          "Войдите в свой аккаунт",
          "Создайте приложение (Create an App)",
          "Скопируйте Client ID и Client Secret",
        ],
        link: "https://developer.spotify.com/dashboard",
        linkText: "Получить токен",
      },
    },
    {
      id: "yandex",
      name: "Яндекс Музыка",
      description: "Музыка из Яндекса",
      icon: FaYandex,
      color: "#FFCC00",
      bgColor: "rgba(255, 204, 0, 0.15)",
      connected: (user?.integrations as any)?.yandex || false,
      features: ["Поиск треков", "Импорт плейлистов", "Моя волна"],
      tutorial: {
        steps: [
          "Откройте Яндекс Музыку в браузере",
          "Войдите в свой аккаунт",
          "Откройте DevTools (F12) → Application → Cookies",
          "Найдите и скопируйте значение Session_id",
        ],
        link: "https://music.yandex.ru",
        linkText: "Открыть Яндекс Музыку",
      },
    },
    {
      id: "vk",
      name: "VK Музыка",
      description: "Музыка из ВКонтакте",
      icon: FaVk,
      color: "#0077FF",
      bgColor: "rgba(0, 119, 255, 0.15)",
      connected: (user?.integrations as any)?.vk || false,
      features: ["Поиск треков", "Импорт аудио", "Плейлисты"],
      tutorial: {
        steps: [
          "Перейдите на vkhost.github.io",
          'Выберите "VK Admin (iOS)"',
          'Нажмите "Разрешить" для авторизации',
          "Скопируйте access_token из URL",
        ],
        link: "https://vkhost.github.io/",
        linkText: "Получить токен VK",
      },
    },
    {
      id: "youtube",
      name: "YouTube Music",
      description: "Видео и музыка",
      icon: FaYoutube,
      color: "#FF0000",
      bgColor: "rgba(255, 0, 0, 0.15)",
      connected: (user?.integrations as any)?.youtube || false,
      features: ["Поиск треков", "Видеоклипы", "Плейлисты"],
      comingSoon: true,
    },
  ];

  const handleConnect = async (id: string) => {
    if (!tokenInput.trim()) return;

    setConnectingId(id);
    await new Promise((resolve) => setTimeout(resolve, 1500));

    updateProfile({
      integrations: {
        ...(user?.integrations || {}),
        [id]: tokenInput,
      } as any,
    });
    setConnectingId(null);
    setShowTutorial(null);
    setTokenInput("");
  };

  const handleDisconnect = (id: string) => {
    if (id === "soundcloud") return;

    updateProfile({
      integrations: {
        ...(user?.integrations || {}),
        [id]: false,
      } as any,
    });
  };

  const openLink = (url: string) => {
    window.open(url, "_blank");
  };

  const connectedCount =
    integrations.filter((i) => i.connected).length +
    (discordSettings.enabled ? 1 : 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.1)" }}
          >
            <HiOutlineLink className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2
              className="text-xl font-bold"
              style={{ color: colors.textPrimary }}
            >
              Интеграции
            </h2>
            <p className="text-xs" style={{ color: colors.textSecondary }}>
              Подключите музыкальные сервисы
            </p>
          </div>
        </div>
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-xl"
          style={{
            background: "rgba(34, 197, 94, 0.15)",
            border: "1px solid rgba(34, 197, 94, 0.3)",
          }}
        >
          <HiOutlineShieldCheck className="w-4 h-4 text-green-400" />
          <span className="text-sm font-medium text-green-400">
            {connectedCount} подключено
          </span>
        </div>
      </div>

      {/* Discord Integration Card */}
      <div
        className="rounded-xl overflow-hidden transition-all"
        style={{
          background: colors.surface,
          border: `1px solid ${
            discordSettings.enabled ? "#5865F230" : "rgba(255,255,255,0.06)"
          }`,
        }}
      >
        {/* Main Row */}
        <div className="p-4">
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(88, 101, 242, 0.15)" }}
            >
              <FaDiscord className="w-6 h-6" style={{ color: "#5865F2" }} />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3
                  className="font-semibold"
                  style={{ color: colors.textPrimary }}
                >
                  Discord Rich Presence
                </h3>
                {discordSettings.enabled && (
                  <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 font-medium">
                    <HiOutlineCheck className="w-3 h-3" />
                    Активно
                  </span>
                )}
              </div>
              <p
                className="text-xs mt-0.5"
                style={{ color: colors.textSecondary }}
              >
                Показывать текущий трек в Discord статусе
              </p>

              {/* Features */}
              <div className="flex flex-wrap gap-1 mt-2">
                {["Название трека", "Артист", "Обложка", "Прогресс"].map(
                  (feature, i) => (
                    <span
                      key={i}
                      className="text-[10px] px-2 py-0.5 rounded-full"
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        color: colors.textSecondary,
                      }}
                    >
                      {feature}
                    </span>
                  )
                )}
              </div>
            </div>

            {/* Toggle */}
            <button
              onClick={() =>
                saveDiscordSettings({
                  ...discordSettings,
                  enabled: !discordSettings.enabled,
                })
              }
              className="relative w-12 h-6 rounded-full transition-all flex-shrink-0"
              style={{
                background: discordSettings.enabled
                  ? "#5865F2"
                  : "rgba(255,255,255,0.1)",
              }}
            >
              <div
                className="absolute top-1 w-4 h-4 rounded-full transition-all"
                style={{ 
                  left: discordSettings.enabled ? "28px" : "4px",
                  background: "var(--interactive-accent)"
                }}
              />
            </button>
          </div>
        </div>

        {/* Discord Settings Panel */}
        {discordSettings.enabled && (
          <div
            className="px-4 pb-4 pt-0 border-t"
            style={{ borderColor: "rgba(255,255,255,0.06)" }}
          >
            <div className="pt-4 space-y-4">
              {/* Preview */}
              <div>
                <p
                  className="text-xs uppercase tracking-wider mb-3 font-semibold"
                  style={{ color: colors.textSecondary }}
                >
                  Предпросмотр
                </p>
                <div
                  className="p-3 rounded-xl"
                  style={{ background: "#2f3136" }}
                >
                  <div className="flex items-start gap-3">
                    {/* Artwork */}
                    <div
                      className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0"
                      style={{ background: "#202225" }}
                    >
                      {discordSettings.customArtworkUrl ? (
                        <img
                          src={discordSettings.customArtworkUrl}
                          alt=""
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display =
                              "none";
                          }}
                        />
                      ) : currentTrack?.artworkUrl &&
                        discordSettings.showArtwork ? (
                        <img
                          src={currentTrack.artworkUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <HiOutlineMusicalNote className="w-8 h-8 text-gray-500" />
                        </div>
                      )}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white/60 mb-0.5">
                        ИГРАЕТ В HARMONIX
                      </p>
                      <p className="text-sm font-semibold text-white truncate">
                        {currentTrack?.title || "Название трека"}
                      </p>
                      <p className="text-xs text-white/60 truncate">
                        by {currentTrack?.artist || "Исполнитель"}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        {isPlaying ? (
                          <HiOutlinePlay className="w-3 h-3 text-green-400" />
                        ) : (
                          <HiOutlinePause className="w-3 h-3 text-yellow-400" />
                        )}
                        <span className="text-[10px] text-white/40">
                          {isPlaying ? "Сейчас играет" : "На паузе"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Show Artwork Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center"
                    style={{ background: "rgba(255,255,255,0.05)" }}
                  >
                    <HiOutlinePhoto
                      className="w-4 h-4"
                      style={{ color: colors.textSecondary }}
                    />
                  </div>
                  <div>
                    <p
                      className="text-sm font-medium"
                      style={{ color: colors.textPrimary }}
                    >
                      Показывать обложку
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: colors.textSecondary }}
                    >
                      Обложка трека в статусе
                    </p>
                  </div>
                </div>
                <button
                  onClick={() =>
                    saveDiscordSettings({
                      ...discordSettings,
                      showArtwork: !discordSettings.showArtwork,
                    })
                  }
                  className="relative w-10 h-5 rounded-full transition-all"
                  style={{
                    background: discordSettings.showArtwork
                      ? "#5865F2"
                      : "rgba(255,255,255,0.1)",
                  }}
                >
                  <div
                    className="absolute top-0.5 w-4 h-4 rounded-full transition-all"
                    style={{
                      left: discordSettings.showArtwork ? "22px" : "2px",
                      background: "var(--interactive-accent)"
                    }}
                  />
                </button>
              </div>

              {/* Custom Artwork URL */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <p
                    className="text-sm font-medium"
                    style={{ color: colors.textPrimary }}
                  >
                    Кастомная обложка
                  </p>
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded bg-white/5"
                    style={{ color: colors.textSecondary }}
                  >
                    опционально
                  </span>
                </div>
                <input
                  type="text"
                  value={discordSettings.customArtworkUrl}
                  onChange={(e) =>
                    saveDiscordSettings({
                      ...discordSettings,
                      customArtworkUrl: e.target.value,
                    })
                  }
                  placeholder="https://example.com/image.png"
                  className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: colors.textPrimary,
                  }}
                />
                <p
                  className="text-[10px] mt-1.5"
                  style={{ color: colors.textSecondary }}
                >
                  Заменит обложку трека на вашу картинку
                </p>
              </div>


            </div>
          </div>
        )}
      </div>

      {/* Telegram Integration Card */}
      <div
        className="rounded-xl overflow-hidden transition-all"
        style={{
          background: colors.surface,
          border: `1px solid ${
            telegramSettings.connected ? "#0088cc30" : "rgba(255,255,255,0.06)"
          }`,
        }}
      >
        {/* Main Row */}
        <div className="p-4">
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(0, 136, 204, 0.15)" }}
            >
              <FaTelegram className="w-6 h-6" style={{ color: "#0088cc" }} />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3
                  className="font-semibold"
                  style={{ color: colors.textPrimary }}
                >
                  Telegram Sync
                </h3>
                {telegramSettings.connected && (
                  <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 font-medium">
                    <HiOutlineCheck className="w-3 h-3" />
                    Подключено
                  </span>
                )}
              </div>
              <p
                className="text-xs mt-0.5"
                style={{ color: colors.textSecondary }}
              >
                Синхронизация аккаунта через Telegram бота
              </p>

              {/* Features */}
              <div className="flex flex-wrap gap-1 mt-2">
                {["Монеты", "Инвентарь", "Статистика", "Админка"].map(
                  (feature, i) => (
                    <span
                      key={i}
                      className="text-[10px] px-2 py-0.5 rounded-full"
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        color: colors.textSecondary,
                      }}
                    >
                      {feature}
                    </span>
                  )
                )}
              </div>
            </div>

            {/* Action */}
            {telegramSettings.connected ? (
              <button
                onClick={handleTelegramDisconnect}
                className="p-2 rounded-lg transition-all hover:bg-red-500/20"
                style={{ background: "rgba(255,255,255,0.05)" }}
              >
                <HiOutlineXMark className="w-5 h-5 text-red-400" />
              </button>
            ) : (
              <button
                onClick={() => setShowTelegramPanel(!showTelegramPanel)}
                className="p-2 rounded-lg transition-all hover:opacity-80"
                style={{ background: "rgba(0, 136, 204, 0.15)" }}
              >
                <HiOutlineArrowTopRightOnSquare
                  className="w-5 h-5"
                  style={{ color: "#0088cc" }}
                />
              </button>
            )}
          </div>
        </div>

        {/* Telegram Login Panel */}
        {showTelegramPanel && !telegramSettings.connected && (
          <div
            className="px-4 pb-4 pt-0 border-t"
            style={{ borderColor: "rgba(255,255,255,0.06)" }}
          >
            <div className="pt-4 space-y-4">
              {/* Instructions */}
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5"
                    style={{
                      background: "rgba(0, 136, 204, 0.2)",
                      color: "#0088cc",
                    }}
                  >
                    1
                  </span>
                  <p
                    className="text-sm"
                    style={{ color: colors.textSecondary }}
                  >
                    Напишите боту{" "}
                    <span
                      className="font-mono text-xs px-1 py-0.5 rounded"
                      style={{ background: "rgba(255,255,255,0.1)" }}
                    >
                      @harmonix_sync_bot
                    </span>
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5"
                    style={{
                      background: "rgba(0, 136, 204, 0.2)",
                      color: "#0088cc",
                    }}
                  >
                    2
                  </span>
                  <p
                    className="text-sm"
                    style={{ color: colors.textSecondary }}
                  >
                    Зарегистрируйтесь:{" "}
                    <span className="font-mono text-xs">
                      /register логин пароль
                    </span>
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5"
                    style={{
                      background: "rgba(0, 136, 204, 0.2)",
                      color: "#0088cc",
                    }}
                  >
                    3
                  </span>
                  <p
                    className="text-sm"
                    style={{ color: colors.textSecondary }}
                  >
                    Введите данные ниже для привязки
                  </p>
                </div>
              </div>

              {/* Open Bot Button */}
              <button
                onClick={() =>
                  window.open("https://t.me/harmonixfun_bot", "_blank")
                }
                className="w-full py-3 rounded-xl flex items-center justify-center gap-2 transition-all hover:opacity-90"
                style={{
                  background: "rgba(0, 136, 204, 0.15)",
                  border: "1px solid rgba(0, 136, 204, 0.3)",
                }}
              >
                <FaTelegram className="w-4 h-4" style={{ color: "#0088cc" }} />
                <span
                  className="text-sm font-medium"
                  style={{ color: "#0088cc" }}
                >
                  Открыть бота
                </span>
              </button>

              {/* Login Form */}
              <div className="space-y-3">
                {tgError && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {tgError}
                  </div>
                )}

                <div className="relative">
                  <HiOutlineUser
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                    style={{ color: colors.textSecondary }}
                  />
                  <input
                    type="text"
                    value={tgUsername}
                    onChange={(e) => setTgUsername(e.target.value)}
                    placeholder="Логин"
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-sm focus:outline-none"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: colors.textPrimary,
                    }}
                  />
                </div>

                <div className="relative">
                  <HiOutlineLockClosed
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                    style={{ color: colors.textSecondary }}
                  />
                  <input
                    type="password"
                    value={tgPassword}
                    onChange={(e) => setTgPassword(e.target.value)}
                    placeholder="Пароль"
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-sm focus:outline-none"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: colors.textPrimary,
                    }}
                  />
                </div>

                <button
                  onClick={handleTelegramLogin}
                  disabled={
                    tgLoading || !tgUsername.trim() || !tgPassword.trim()
                  }
                  className="w-full py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                  style={{ background: "#0088cc", color: "#fff" }}
                >
                  {tgLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                  ) : (
                    "Привязать аккаунт"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Connected Panel */}
        {telegramSettings.connected && (
          <div
            className="px-4 pb-4 pt-0 border-t"
            style={{ borderColor: "rgba(255,255,255,0.06)" }}
          >
            <div className="pt-4 space-y-3">
              <div
                className="flex items-center justify-between p-3 rounded-xl"
                style={{ background: "rgba(255,255,255,0.03)" }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(0, 136, 204, 0.2)" }}
                  >
                    <HiOutlineUser
                      className="w-4 h-4"
                      style={{ color: "#0088cc" }}
                    />
                  </div>
                  <div>
                    <p
                      className="text-sm font-medium"
                      style={{ color: colors.textPrimary }}
                    >
                      {telegramSettings.username}
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: colors.textSecondary }}
                    >
                      Аккаунт привязан
                    </p>
                  </div>
                </div>
                <HiOutlineCheck className="w-5 h-5 text-green-400" />
              </div>

              <button
                onClick={syncToTelegram}
                className="w-full py-3 rounded-xl text-sm font-medium transition-all hover:opacity-90 flex items-center justify-center gap-2"
                style={{
                  background: "rgba(0, 136, 204, 0.15)",
                  color: "#0088cc",
                }}
              >
                <HiOutlineArrowTopRightOnSquare className="w-4 h-4" />
                Синхронизировать данные
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Integrations List */}
      <div className="space-y-3">
        {integrations.map((integration) => {
          const Icon = integration.icon;
          const isConnecting = connectingId === integration.id;
          const isMain = integration.id === "soundcloud";
          const isTutorialOpen = showTutorial === integration.id;

          return (
            <div
              key={integration.id}
              className="rounded-xl overflow-hidden transition-all"
              style={{
                background: colors.surface,
                border: `1px solid ${
                  integration.connected
                    ? `${integration.color}30`
                    : "rgba(255,255,255,0.06)"
                }`,
              }}
            >
              {/* Main Row */}
              <div className="p-4">
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: integration.bgColor }}
                  >
                    <Icon
                      className="w-6 h-6"
                      style={{ color: integration.color }}
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3
                        className="font-semibold"
                        style={{ color: colors.textPrimary }}
                      >
                        {integration.name}
                      </h3>
                      {integration.connected && (
                        <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 font-medium">
                          <HiOutlineCheck className="w-3 h-3" />
                          Подключено
                        </span>
                      )}
                      {isMain && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 font-medium">
                          Основной
                        </span>
                      )}
                      {integration.comingSoon && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-500/20 text-gray-400 font-medium">
                          Скоро
                        </span>
                      )}
                    </div>
                    <p
                      className="text-xs mt-0.5"
                      style={{ color: colors.textSecondary }}
                    >
                      {integration.description}
                    </p>

                    {/* Features */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {integration.features.map((feature, i) => (
                        <span
                          key={i}
                          className="text-[10px] px-2 py-0.5 rounded-full"
                          style={{
                            background: "rgba(255,255,255,0.05)",
                            color: colors.textSecondary,
                          }}
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Action */}
                  <div className="flex-shrink-0">
                    {isMain ? (
                      <div
                        className="p-2 rounded-lg"
                        style={{ background: "rgba(255,255,255,0.05)" }}
                      >
                        <HiOutlineCheck className="w-5 h-5 text-green-400" />
                      </div>
                    ) : integration.comingSoon ? (
                      <div
                        className="p-2 rounded-lg"
                        style={{ background: "rgba(255,255,255,0.05)" }}
                      >
                        <HiOutlineQuestionMarkCircle
                          className="w-5 h-5"
                          style={{ color: colors.textSecondary }}
                        />
                      </div>
                    ) : integration.connected ? (
                      <button
                        onClick={() => handleDisconnect(integration.id)}
                        className="p-2 rounded-lg transition-all hover:bg-red-500/20"
                        style={{ background: "rgba(255,255,255,0.05)" }}
                      >
                        <HiOutlineXMark className="w-5 h-5 text-red-400" />
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          setShowTutorial(
                            isTutorialOpen ? null : integration.id
                          )
                        }
                        className="p-2 rounded-lg transition-all hover:opacity-80"
                        style={{ background: integration.bgColor }}
                      >
                        <HiOutlineArrowTopRightOnSquare
                          className="w-5 h-5"
                          style={{ color: integration.color }}
                        />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Tutorial Panel */}
              {isTutorialOpen && integration.tutorial && (
                <div
                  className="px-4 pb-4 pt-0 border-t"
                  style={{ borderColor: "rgba(255,255,255,0.06)" }}
                >
                  <div className="pt-4">
                    {/* Steps */}
                    <div className="space-y-2 mb-4">
                      {integration.tutorial.steps.map((step, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <span
                            className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5"
                            style={{
                              background: `${integration.color}20`,
                              color: integration.color,
                            }}
                          >
                            {i + 1}
                          </span>
                          <p
                            className="text-sm"
                            style={{ color: colors.textSecondary }}
                          >
                            {step}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Link Button */}
                    {integration.tutorial.link && (
                      <button
                        onClick={() => openLink(integration.tutorial!.link!)}
                        className="w-full py-3 rounded-xl flex items-center justify-center gap-2 mb-4 transition-all hover:opacity-90"
                        style={{
                          background: "rgba(255,255,255,0.05)",
                          border: "1px solid rgba(255,255,255,0.1)",
                        }}
                      >
                        <HiOutlineGlobeAlt
                          className="w-4 h-4"
                          style={{ color: colors.textSecondary }}
                        />
                        <span
                          className="text-sm font-medium"
                          style={{ color: colors.textPrimary }}
                        >
                          {integration.tutorial.linkText}
                        </span>
                        <HiOutlineArrowTopRightOnSquare
                          className="w-4 h-4"
                          style={{ color: colors.textSecondary }}
                        />
                      </button>
                    )}

                    {/* Token Input */}
                    <div className="space-y-3">
                      <div className="relative">
                        <input
                          type="text"
                          value={tokenInput}
                          onChange={(e) => setTokenInput(e.target.value)}
                          placeholder="Вставьте токен..."
                          className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
                          style={{
                            background: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            color: colors.textPrimary,
                          }}
                        />
                        <button
                          onClick={async () => {
                            const text = await navigator.clipboard.readText();
                            setTokenInput(text);
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all hover:bg-white/10"
                        >
                          <HiOutlineClipboard
                            className="w-4 h-4"
                            style={{ color: colors.textSecondary }}
                          />
                        </button>
                      </div>

                      <button
                        onClick={() => handleConnect(integration.id)}
                        disabled={!tokenInput.trim() || isConnecting}
                        className="w-full py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                        style={{ background: integration.color, color: "#fff" }}
                      >
                        {isConnecting ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                        ) : (
                          "Подключить"
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Privacy Note */}
      <div
        className="p-4 rounded-xl flex items-start gap-3"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <HiOutlineShieldCheck
          className="w-5 h-5 flex-shrink-0 mt-0.5"
          style={{ color: colors.textSecondary }}
        />
        <div>
          <p className="text-xs" style={{ color: colors.textSecondary }}>
            Токены хранятся локально на вашем устройстве и не передаются на
            сервер. Вы можете отключить интеграцию в любой момент.
          </p>
        </div>
      </div>
    </div>
  );
}
