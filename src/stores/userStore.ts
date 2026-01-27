import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  User,
  UserSettings,
  AppearanceSettings,
  CustomTheme,
  Badge,
  Achievement,
  Preset,
} from "../types/user";
import { accountService } from "../services/AccountService";
import { supabaseService } from "../services/SupabaseService";
import { setProfilePinsUserId } from "./profilePinsStore";
import { setUsernamesUserId } from "./usernamesStore";

// Heartbeat для отслеживания онлайн статуса
let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

function startHeartbeat(userId: string) {
  // Сразу обновляем last_seen
  supabaseService.updateLastSeen(userId);
  
  // Обновляем каждые 2 минуты
  if (heartbeatInterval) clearInterval(heartbeatInterval);
  heartbeatInterval = setInterval(() => {
    supabaseService.updateLastSeen(userId);
  }, 2 * 60 * 1000);
  
  // При закрытии окна ставим offline
  window.addEventListener('beforeunload', () => {
    supabaseService.setOffline(userId);
  });
}

function stopHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}

// Shop item types
export interface ShopItem {
  id: string;
  name: string;
  category:
    | "banners"
    | "frames"
    | "titles"
    | "backgrounds"
    | "avatars"
    | "packs";
  price: number;
  preview?: string;
  color?: string;
  icon?: string;
  premium?: boolean;
  animated?: boolean;
  rarity?: string;
}

// Default theme
const defaultCustomTheme: CustomTheme = {
  bgDarkest: "#0B0B0F",
  bgDark: "#13131A",
  bgCard: "#1A1A24",
  bgElevated: "#22222E",
  textPrimary: "#F9FAFB",
  textSecondary: "#D1D5DB",
  textTertiary: "#9CA3AF",
  accentStart: "#8B5CF6",
  accentMid: "#EC4899",
  accentEnd: "#F97316",
  saturation: 100,
  contrast: 100,
  transparency: 100,
};

// Рейт-лимит для регистрации пользователей
const REGISTRATION_RATE_LIMIT_WINDOW = 5000; // 5 секунд
const MAX_REGISTRATION_REQUESTS = 1; // максимум 1 регистрация в 5 секунд

interface RegistrationRateLimitState {
  requests: number[];
  lastCleanup: number;
}

const registrationRateLimitState: RegistrationRateLimitState = {
  requests: [],
  lastCleanup: Date.now(),
};

const checkRegistrationRateLimit = (): boolean => {
  const now = Date.now();
  
  console.log('[RegistrationRateLimit] Checking rate limit, current requests:', registrationRateLimitState.requests.length);
  
  // Очищаем старые запросы (старше 5 секунд)
  const oldRequestsCount = registrationRateLimitState.requests.length;
  registrationRateLimitState.requests = registrationRateLimitState.requests.filter(
    timestamp => now - timestamp < REGISTRATION_RATE_LIMIT_WINDOW
  );
  
  if (registrationRateLimitState.requests.length !== oldRequestsCount) {
    console.log('[RegistrationRateLimit] Cleaned old requests:', oldRequestsCount, '->', registrationRateLimitState.requests.length);
  }
  
  registrationRateLimitState.lastCleanup = now;
  
  // Проверяем лимит
  if (registrationRateLimitState.requests.length >= MAX_REGISTRATION_REQUESTS) {
    console.warn(`[RegistrationRateLimit] BLOCKED: ${registrationRateLimitState.requests.length}/${MAX_REGISTRATION_REQUESTS} requests in last ${REGISTRATION_RATE_LIMIT_WINDOW}ms`);
    console.warn('[RegistrationRateLimit] Request timestamps:', registrationRateLimitState.requests.map(t => now - t));
    return false; // Превышен лимит
  }
  
  // Добавляем текущий запрос
  registrationRateLimitState.requests.push(now);
  console.log(`[RegistrationRateLimit] ALLOWED: ${registrationRateLimitState.requests.length}/${MAX_REGISTRATION_REQUESTS} requests in current window`);
  return true; // Запрос разрешен
};

const defaultSettings: UserSettings = {
  appearance: {
    theme: "dark",
    themePreset: "purple",
    customTheme: defaultCustomTheme,
    glassmorphism: true,
    blurStrength: 40,
    shadows: true,
    shadowIntensity: 100,
    animations: true,
    animationSpeed: 1,
    particles: false,
    particleType: "stars",
    ambientLighting: true,
    fontFamily: "Inter",
    fontSize: 100,
    lineHeight: 1.6,
    borderRadius: 16,
  },
  player: {
    style: "standard",
    position: "bottom",
    width: "wide",
    showArtwork: true,
    showTitle: true,
    showProgress: true,
    progressStyle: "line",
    showControls: true,
    showLike: true,
    showAddToPlaylist: true,
    showQueue: true,
    showVolume: true,
    showTime: true,
    visualizer: "bars",
    visualizerColor: "accent",
    visualizerCustomColor: "#8B5CF6",
    artworkSize: "medium",
    artworkEffect: "none",
    artworkRadius: 16,
    ambientBackground: true,
  },
  library: {
    view: "grid",
    gridColumns: 4,
    previewSize: "medium",
    showArtwork: true,
    showTitle: true,
    showArtist: true,
    showTrackCount: true,
    showDate: false,
    defaultSort: "date",
    sortOrder: "desc",
    showSystemPlaylists: true,
    groupBy: "none",
  },
  search: {
    searchOnType: true,
    debounceMs: 500,
    showHistory: true,
    resultsCount: 20,
    defaultFilter: "all",
    defaultSort: "relevance",
    enabledPlatforms: {
      soundcloud: true,
      spotify: false,
      youtube: false,
      deezer: false,
      vk: false,
      yandex: false,
    },
  },
  shortcuts: {
    playPause: "Space",
    nextTrack: "Ctrl+ArrowRight",
    prevTrack: "Ctrl+ArrowLeft",
    volumeUp: "Ctrl+ArrowUp",
    volumeDown: "Ctrl+ArrowDown",
    like: "Ctrl+L",
    addToPlaylist: "Ctrl+P",
    openSearch: "Ctrl+K",
    openSettings: "Ctrl+,",
    mute: "M",
    shuffle: "S",
    repeat: "R",
  },
  audio: {
    quality: "auto",
    cacheEnabled: true,
    cacheLimit: 1000,
    equalizerEnabled: false,
    equalizerPreset: "flat",
    equalizerBands: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    crossfade: false,
    crossfadeDuration: 3,
    normalizeVolume: false,
    defaultSpeed: 1,
  },
  services: {
    soundcloud: {
      tokens: [
        "yNSW5UvBmb1A5j7qPUtIMuB9Itx3jsOC",
        "KKzJxmw11tYpCs6T24P4uUYhqmjalG6M",
      ],
      activeToken: 0,
    },
    spotify: { token: "", connected: false },
    youtube: { token: "", connected: false },
    vk: { token: "", connected: false },
    yandex: { token: "", connected: false },
    deezer: { token: "", connected: false },
    proxy: {
      enabled: false,
      type: "builtin",
      host: "",
      port: 8080,
      username: "",
      password: "",
    },
    localServer: {
      autoStart: false,
      port: 3000,
      running: false,
    },
  },
  social: {
    status: "online",
    showListening: true,
    friendNotifications: true,
    discord: {
      richPresence: false,
      showTrack: true,
      showArtist: true,
      showArtwork: true,
      showTime: true,
      listenTogether: false,
    },
    lastfm: {
      scrobbling: false,
      apiKey: "",
      apiSecret: "",
      connected: false,
    },
  },
  storage: {
    offlineFolder: "",
    offlineFormat: "mp3",
    offlineQuality: "320",
    saveMetadata: true,
    cloudSync: false,
    syncPlaylists: true,
    syncLiked: true,
    syncSettings: true,
    lastSync: "",
  },
  advanced: {
    performanceMode: false,
    fpsLimit: 60,
    lazyLoading: true,
    preloadTracks: 2,
    notifications: true,
    notificationPosition: "bottom-right",
    notificationDuration: 5,
    notificationSound: false,
    language: "ru",
    dateFormat: "DD.MM.YYYY",
    timeFormat: "24h",
    autoUpdate: true,
    autoInstall: false,
    updateChannel: "stable",
  },
};

// Default achievements - пустой массив
const defaultAchievements: Achievement[] = [];

const defaultUser: User = {
  uid: "",
  username: "",
  displayName: "",
  email: "",
  avatar: "",
  banner: "linear-gradient(135deg, #8B5CF6 0%, #EC4899 50%, #F97316 100%)",
  bannerType: "gradient",
  avatarFrame: "gradient-purple",
  badges: [],
  createdAt: "",
  isPublic: true,
  favoriteGenres: [],
  connectedServices: [],
  stats: {
    tracksPlayed: 0,
    hoursListened: 0,
    playlists: 0,
    friends: 0,
    likedTracks: 0,
    topGenres: [],
    weeklyActivity: [0, 0, 0, 0, 0, 0, 0],
    monthlyListening: [],
  },
  achievements: defaultAchievements,
  friends: [],
  status: "online",
  settings: defaultSettings,
};

interface RegisterData {
  email: string;
  username: string;
  password: string;
  displayName: string;
  birthDate?: string;
  avatar?: string;
  favoriteGenres: string[];
  connectedServices: string[];
  isPublic: boolean;
}

interface UserState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Coins & Shop
  coins: number;
  ownedItems: string[];
  equippedItems: {
    banner: string;
    frame: string;
    title: string;
    background: string;
    profileColor: string;
  };

  // Presets
  myPresets: Preset[];

  // Auth actions
  login: (
    email: string,
    password: string,
    remember: boolean
  ) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => void;
  loginAsGuest: () => void;

  // Profile actions
  updateProfile: (data: Partial<User>) => void;
  updateAvatar: (avatar: string) => void;
  updateBanner: (
    banner: string,
    type: "image" | "gradient" | "animated"
  ) => void;
  updateMiniProfileBg: (bg: string, type: 'default' | 'gradient' | 'image') => void;

  // Settings actions
  updateSettings: <K extends keyof UserSettings>(
    category: K,
    settings: Partial<UserSettings[K]>
  ) => void;
  updateAppearance: (settings: Partial<AppearanceSettings>) => void;
  resetSettings: () => void;
  exportSettings: () => string;
  importSettings: (json: string) => boolean;

  // Stats actions
  incrementStat: (stat: keyof User["stats"], amount?: number) => void;
  refreshStatsFromDB: () => Promise<void>;

  // Coins & Shop actions
  addCoins: (amount: number) => void;
  spendCoins: (amount: number) => boolean;
  purchaseItem: (item: ShopItem) => boolean;
  equipItem: (
    category: keyof UserState["equippedItems"],
    itemId: string
  ) => void;



  // Preset actions
  createPreset: (name: string, description: string) => void;
  deletePreset: (presetId: string) => void;
  applyPreset: (preset: Preset) => void;

  // Badge actions
  addBadge: (badge: Badge) => void;
  removeBadge: (badgeId: string) => void;

  // Sync actions
  refreshFromAccount: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      coins: 1000,
      ownedItems: [
        "banner_default",
        "frame_default",
        "title_newbie",
        "title_01",
        "bg_default",
      ], // Default owned items
      equippedItems: {
        banner: "banner_default",
        frame: "frame_default",
        title: "title_newbie",
        background: "bg_default",
        profileColor: "#8B5CF6",
      },
      myPresets: [],

      login: async (emailOrUsername, password, _remember) => {
        set({ isLoading: true });

        const result = await accountService.loginAsync(
          emailOrUsername,
          password
        );

        if (!result.success || !result.user) {
          set({ isLoading: false });
          // Show error toast
          window.dispatchEvent(
            new CustomEvent("show-toast", {
              detail: {
                message: result.error || "Ошибка входа",
                type: "error",
              },
            })
          );
          return false;
        }

        const storedUser = result.user;
        const user: User = {
          ...defaultUser,
          uid: storedUser.uid,
          visibleId: storedUser.visibleId,
          email: storedUser.email,
          username: storedUser.username,
          displayName: storedUser.displayName,
          avatar: storedUser.avatar,
          banner: storedUser.banner,
          bannerType: storedUser.bannerType,
          avatarFrame: storedUser.avatarFrame,
          badges: storedUser.badges,
          createdAt: storedUser.createdAt,
          birthDate: storedUser.birthDate,
          isPublic: storedUser.isPublic,
          favoriteGenres: storedUser.favoriteGenres,
          connectedServices: storedUser.connectedServices,
          stats: storedUser.stats,
          achievements: storedUser.achievements,
          friends: storedUser.friends,
          status: storedUser.status,
          statusMessage: storedUser.statusMessage,
          profileColor: storedUser.profileColor,
          isAdmin: storedUser.isAdmin,
          readNews: storedUser.readNews,
          integrations: storedUser.integrations,
          // Premium fields
          isPremium: storedUser.isPremium,
          premiumExpiresAt: storedUser.premiumExpiresAt,
          // Mini profile background
          miniProfileBg: storedUser.miniProfileBg,
          miniProfileBgType: storedUser.miniProfileBgType,
          // Socials from DB
          socials: storedUser.socials,
        };

        set({
          user,
          isAuthenticated: true,
          isLoading: false,
          coins: storedUser.coins,
          ownedItems: [
            ...storedUser.inventory.banners,
            ...storedUser.inventory.frames,
            ...storedUser.inventory.titles,
            ...storedUser.inventory.backgrounds,
          ],
          equippedItems: {
            banner: storedUser.equipped.banner,
            frame: storedUser.equipped.frame,
            title: storedUser.equipped.title,
            background: storedUser.equipped.background,
            profileColor: storedUser.equipped.profileColor,
          },
        });
        
        // Set userId for profile pins sync
        setProfilePinsUserId(storedUser.uid);
        // Set userId for usernames sync
        setUsernamesUserId(storedUser.uid);
        
        // Start heartbeat for online status
        startHeartbeat(storedUser.uid);
        
        return true;
      },

      register: async (data) => {
        console.log('[UserStore] Attempting to register user:', data.username);
        
        // Проверяем рейт-лимит для регистрации
        if (!checkRegistrationRateLimit()) {
          console.warn('[UserStore] Registration rate limit exceeded: max 1 request per 5 seconds');
          window.dispatchEvent(
            new CustomEvent("show-toast", {
              detail: {
                message: "Слишком частые попытки регистрации. Подождите 5 секунд.",
                type: "error",
              },
            })
          );
          return false;
        }
        
        console.log('[UserStore] Registration rate limit check passed');
        
        set({ isLoading: true });

        const result = await accountService.registerAsync({
          email: data.email,
          username: data.username,
          password: data.password,
          displayName: data.displayName,
          birthDate: data.birthDate,
          avatar: data.avatar,
          favoriteGenres: data.favoriteGenres,
        });

        if (!result.success || !result.user) {
          set({ isLoading: false });
          window.dispatchEvent(
            new CustomEvent("show-toast", {
              detail: {
                message: result.error || "Ошибка регистрации",
                type: "error",
              },
            })
          );
          return false;
        }

        console.log('[UserStore] User registered successfully:', data.username);
        const storedUser = result.user;
        const user: User = {
          ...defaultUser,
          uid: storedUser.uid,
          visibleId: storedUser.visibleId,
          email: storedUser.email,
          username: storedUser.username,
          displayName: storedUser.displayName,
          avatar: storedUser.avatar,
          createdAt: storedUser.createdAt,
          birthDate: storedUser.birthDate,
          isPublic: storedUser.isPublic,
          favoriteGenres: storedUser.favoriteGenres,
          badges: storedUser.badges,
          achievements: storedUser.achievements,
          isAdmin: storedUser.isAdmin,
        };

        set({
          user,
          isAuthenticated: true,
          isLoading: false,
          coins: storedUser.coins,
          ownedItems: [
            ...storedUser.inventory.banners,
            ...storedUser.inventory.frames,
            ...storedUser.inventory.titles,
            ...storedUser.inventory.backgrounds,
          ],
        });
        return true;
      },

      logout: () => {
        const { user } = get();
        // Set offline status before logout
        if (user?.uid) {
          stopHeartbeat();
          supabaseService.setOffline(user.uid);
        }
        set({ user: null, isAuthenticated: false });
        setProfilePinsUserId(null);
        setUsernamesUserId(null);
      },

      loginAsGuest: () => {
        const guestUser: User = {
          ...defaultUser,
          uid: "guest-" + Math.random().toString(36).substring(2, 11),
          username: "guest",
          displayName: "Гость",
          email: "",
          avatar: "👤",
          banner:
            "linear-gradient(135deg, #8B5CF6 0%, #EC4899 50%, #F97316 100%)",
          bannerType: "gradient",
          createdAt: new Date().toISOString(),
          achievements: defaultAchievements,
          isGuest: true,
        };
        set({
          user: guestUser,
          isAuthenticated: true,
          coins: 100,
          ownedItems: [
            "banner_default",
            "frame_default",
            "title_newbie",
            "bg_default",
          ],
          equippedItems: {
            banner: "banner_default",
            frame: "frame_default",
            title: "title_newbie",
            background: "bg_default",
            profileColor: "#8B5CF6",
          },
        });
      },

      updateProfile: (data) => {
        const { user } = get();
        if (!user) return;
        set({ user: { ...user, ...data } });
        // Sync with AccountService
        if (user.uid) {
          accountService.updateUser(user.uid, data as any);
        }
      },

      updateAvatar: (avatar) => {
        const { user } = get();
        if (!user) return;
        set({ user: { ...user, avatar } });
        // Sync with AccountService
        if (user.uid) {
          accountService.updateUser(user.uid, { avatar });
        }
      },

      updateBanner: (banner, type) => {
        const { user } = get();
        if (!user) {
          console.warn('[UserStore] updateBanner: No user');
          return;
        }
        
        console.log('[UserStore] updateBanner:', { 
          type, 
          isPremium: user.isPremium,
          bannerPreview: banner.substring(0, 50) + '...'
        });
        
        // Check if trying to set custom image without premium
        if (type === 'image' && !user.isPremium) {
          console.warn('[UserStore] updateBanner: Premium required');
          window.dispatchEvent(
            new CustomEvent("show-toast", {
              detail: {
                message: "Кастомные баннеры доступны только с Premium подпиской!",
                type: "error",
              },
            })
          );
          return;
        }
        
        console.log('[UserStore] updateBanner: Setting banner');
        set({ user: { ...user, banner, bannerType: type } });
        // Sync with AccountService
        if (user.uid) {
          accountService.updateUser(user.uid, { banner, bannerType: type });
        }
        console.log('[UserStore] updateBanner: Success');
      },

      updateMiniProfileBg: (bg, type) => {
        const { user } = get();
        if (!user) return;
        
        // Check if trying to set custom image without premium
        if (type === 'image' && !user.isPremium) {
          window.dispatchEvent(
            new CustomEvent("show-toast", {
              detail: {
                message: "Кастомные фото доступны только с Premium подпиской!",
                type: "error",
              },
            })
          );
          return;
        }
        
        set({ user: { ...user, miniProfileBg: bg, miniProfileBgType: type } });
        // Sync with AccountService
        if (user.uid) {
          accountService.updateUser(user.uid, { miniProfileBg: bg, miniProfileBgType: type });
        }
      },

      updateSettings: (category, settings) => {
        const { user } = get();
        if (!user) return;
        set({
          user: {
            ...user,
            settings: {
              ...user.settings,
              [category]: { ...user.settings[category], ...settings },
            },
          },
        });
      },

      updateAppearance: (settings) => {
        const { user } = get();
        if (!user) return;
        set({
          user: {
            ...user,
            settings: {
              ...user.settings,
              appearance: { ...user.settings.appearance, ...settings },
            },
          },
        });
      },

      resetSettings: () => {
        const { user } = get();
        if (!user) return;
        set({ user: { ...user, settings: defaultSettings } });
      },

      exportSettings: () => {
        const { user } = get();
        if (!user) return "";
        return JSON.stringify(user.settings, null, 2);
      },

      importSettings: (json) => {
        try {
          const settings = JSON.parse(json) as UserSettings;
          const { user } = get();
          if (!user) return false;
          set({ user: { ...user, settings } });
          return true;
        } catch {
          return false;
        }
      },

      incrementStat: (stat, amount = 1) => {
        const { user, loginAsGuest } = get();

        // Auto-create guest user if not logged in
        if (!user) {
          loginAsGuest();
        }

        const currentUser = get().user;
        if (!currentUser) return;

        const currentValue = currentUser.stats[stat];
        const newValue =
          typeof currentValue === "number" ? currentValue + amount : amount;

        const newStats = {
          ...currentUser.stats,
          [stat]: newValue,
        };

        set({ user: { ...currentUser, stats: newStats } });

        // Sync with Supabase
        if (currentUser.uid && !currentUser.uid.startsWith('guest_')) {
          if (stat === 'tracksPlayed' || stat === 'playlists' || stat === 'likedTracks') {
            accountService.incrementStat(currentUser.uid, stat as any, amount);
          }
        }
      },

      refreshStatsFromDB: async () => {
        const { user } = get();
        if (!user || !user.uid || user.uid.startsWith('guest_')) return;

        try {
          const dbStats = await supabaseService.getUserStats(user.uid);
          if (dbStats) {
            const newStats: User["stats"] = {
              ...user.stats,
              tracksPlayed: dbStats.tracks_played || 0,
              hoursListened: dbStats.hours_listened || 0,
              playlists: dbStats.playlists_count || 0,
              likedTracks: dbStats.liked_count || 0,
              topGenres: (dbStats.top_genres || []).map((g: string) => ({ genre: g, percentage: 0 })),
              weeklyActivity: dbStats.weekly_activity || [0,0,0,0,0,0,0],
            };
            set({ user: { ...user, stats: newStats } });
          }
        } catch (e) {
          console.error('[UserStore] Failed to refresh stats from DB:', e);
        }
      },

      // Coins & Shop
      addCoins: (amount) => {
        const { user } = get();
        set((state) => ({ coins: state.coins + amount }));
        // Sync with AccountService
        if (user?.uid) {
          accountService.addCoins(user.uid, amount);
        }
      },

      spendCoins: (amount) => {
        const { coins, user } = get();
        if (coins < amount) return false;
        set({ coins: coins - amount });
        // Sync with AccountService
        if (user?.uid) {
          accountService.spendCoins(user.uid, amount);
        }
        return true;
      },

      purchaseItem: (item) => {
        const { coins, ownedItems, spendCoins, user } = get();
        if (ownedItems.includes(item.id)) return false;
        if (coins < item.price) return false;

        if (spendCoins(item.price)) {
          set((state) => ({ ownedItems: [...state.ownedItems, item.id] }));
          // Sync with AccountService
          if (user?.uid) {
            const category =
              item.category === "packs"
                ? "packs"
                : item.category === "banners"
                ? "banners"
                : item.category === "frames"
                ? "frames"
                : item.category === "titles"
                ? "titles"
                : "backgrounds";
            accountService.addToInventory(user.uid, category, item.id);
          }
          return true;
        }
        return false;
      },

      equipItem: (category, itemId) => {
        const { user } = get();
        set((state) => ({
          equippedItems: { ...state.equippedItems, [category]: itemId },
        }));
        // Sync with AccountService
        if (user?.uid) {
          accountService.equipItem(user.uid, category, itemId);
        }
      },


      // Presets
      createPreset: (name, description) => {
        const { user, myPresets } = get();
        if (!user) return;

        const preset: Preset = {
          id: Math.random().toString(36).substr(2, 9),
          name,
          description,
          author: user.displayName,
          authorId: user.uid,
          preview: `linear-gradient(135deg, ${user.settings.appearance.customTheme.accentStart}, ${user.settings.appearance.customTheme.accentMid})`,
          settings: user.settings.appearance,
          downloads: 0,
          likes: 0,
          createdAt: new Date().toISOString(),
        };

        set({ myPresets: [...myPresets, preset] });
      },

      deletePreset: (presetId) => {
        set((state) => ({
          myPresets: state.myPresets.filter((p) => p.id !== presetId),
        }));
      },

      applyPreset: (preset) => {
        const { user } = get();
        if (!user || !preset.settings) return;

        set({
          user: {
            ...user,
            settings: {
              ...user.settings,
              appearance: { ...user.settings.appearance, ...preset.settings },
            },
          },
        });
      },

      // Badges
      addBadge: (badge) => {
        const { user } = get();
        if (!user) return;
        if (user.badges.some((b) => b.id === badge.id)) return;

        set({ user: { ...user, badges: [...user.badges, badge] } });
      },

      removeBadge: (badgeId) => {
        const { user } = get();
        if (!user) return;

        set({
          user: {
            ...user,
            badges: user.badges.filter((b) => b.id !== badgeId),
          },
        });
      },

      // Sync from Supabase (async)
      refreshFromAccount: async () => {
        const { user } = get();
        if (!user?.uid || user.isGuest) return;

        try {
          const { supabaseService } = await import('../services/SupabaseService');
          const supabaseUser = await supabaseService.getUserById(user.uid);
          
          if (supabaseUser) {
            // Build socials object - prefer JSONB socials column, fallback to individual columns
            let socials: { telegram?: string; discord?: string; youtube?: string; tiktok?: string } = {};
            if (supabaseUser.socials && typeof supabaseUser.socials === 'object' && Object.keys(supabaseUser.socials).length > 0) {
              socials = supabaseUser.socials;
            } else {
              socials = {
                telegram: supabaseUser.social_telegram || '',
                discord: supabaseUser.social_discord || '',
                youtube: supabaseUser.social_youtube || '',
                tiktok: supabaseUser.social_tiktok || '',
              };
            }
            // Filter out empty values
            socials = Object.fromEntries(
              Object.entries(socials).filter(([_, v]) => v && v.trim() !== '')
            ) as typeof socials;
            
            set({
              coins: supabaseUser.coins,
              user: {
                ...user,
                avatar: supabaseUser.avatar || user.avatar,
                banner: supabaseUser.banner || user.banner,
                bannerType: (supabaseUser.banner_type as any) || user.bannerType,
                status: (supabaseUser.status as any) || user.status,
                statusMessage: supabaseUser.status_message || user.statusMessage,
                displayName: supabaseUser.display_name || user.displayName,
                // Premium fields
                isPremium: supabaseUser.is_premium || false,
                premiumExpiresAt: supabaseUser.premium_expires_at,
                // Mini profile background
                miniProfileBg: supabaseUser.mini_profile_bg || '',
                miniProfileBgType: (supabaseUser.mini_profile_bg_type as any) || 'default',
                // Socials from DB
                socials: Object.keys(socials).length > 0 ? socials : user.socials,
              },
            });
            console.log('[UserStore] Synced from Supabase, isPremium:', supabaseUser.is_premium);
          }
        } catch (error) {
          console.error('[UserStore] Failed to sync from Supabase:', error);
        }
      },
    }),
    {
      name: "harmonix-user",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        coins: state.coins,
        ownedItems: state.ownedItems,
        equippedItems: state.equippedItems,
        myPresets: state.myPresets,
      }),
    }
  )
);
