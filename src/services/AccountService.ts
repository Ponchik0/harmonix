// Account Service - работа с аккаунтами через Supabase
import type { Badge, Achievement, User } from "../types/user";
import type { UserInventory, EquippedItems, UserIntegrations } from "../types/shop";
import { supabaseService, HarmonixUser } from "./SupabaseService";

// ============================================
// СПИСОК АДМИНОВ
// ============================================
const ADMIN_USERNAMES = ["roblox", "admin", "ponchik"];
// ============================================

export interface StoredUser {
  uid: string;
  visibleId: number;
  email: string;
  username: string;
  passwordHash: string;
  displayName: string;
  avatar: string;
  banner: string;
  bannerType: "image" | "gradient" | "animated";
  avatarFrame: string;
  badges: Badge[];
  createdAt: string;
  birthDate?: string;
  isPublic: boolean;
  favoriteGenres: string[];
  connectedServices: string[];
  stats: User["stats"];
  achievements: Achievement[];
  friends: string[];
  status: "online" | "dnd" | "offline";
  statusMessage?: string;
  coins: number;
  inventory: UserInventory;
  equipped: EquippedItems;
  integrations: UserIntegrations;
  profileColor: string;
  isAdmin: boolean;
  isBanned: boolean;
  banReason?: string;
  lastLogin: string;
  readNews: string[];
  // Premium
  isPremium?: boolean;
  premiumExpiresAt?: string;
  // Mini profile background
  miniProfileBg?: string;
  miniProfileBgType?: 'default' | 'gradient' | 'image';
  // Socials
  socials?: {
    telegram?: string;
    discord?: string;
    youtube?: string;
    tiktok?: string;
  };
}

const defaultAchievements: Achievement[] = [];

const defaultIntegrations: UserIntegrations = {
  telegram: { connected: false, notifications: false },
  discord: { connected: false, richPresence: false, showActivity: true },
};

// Конвертация из Supabase формата в StoredUser
async function supabaseToStoredUser(su: HarmonixUser): Promise<StoredUser> {
  const isAdmin = ADMIN_USERNAMES.includes(su.username.toLowerCase()) || su.is_admin;
  
  // Получаем статистику из БД
  const dbStats = await supabaseService.getUserStats(su.id);
  const dbEquipped = await supabaseService.getUserEquipped(su.id);
  const dbInventory = await supabaseService.getUserInventory(su.id);
  
  // Формируем inventory из БД
  const inventory: UserInventory = {
    banners: dbInventory.filter(i => i.item_category === 'banners').map(i => i.item_id),
    frames: dbInventory.filter(i => i.item_category === 'frames').map(i => i.item_id),
    titles: dbInventory.filter(i => i.item_category === 'titles').map(i => i.item_id),
    backgrounds: dbInventory.filter(i => i.item_category === 'backgrounds').map(i => i.item_id),
    packs: dbInventory.filter(i => i.item_category === 'packs').map(i => i.item_id),
  };

  // Не добавляем дефолтные товары - магазин пустой, пользователь сам покупает

  // Формируем equipped из БД
  const equipped: EquippedItems = dbEquipped ? {
    banner: dbEquipped.banner || "",
    frame: dbEquipped.frame || "",
    title: dbEquipped.title || "",
    background: dbEquipped.background || "",
    profileColor: dbEquipped.profile_color || "#8B5CF6",
  } : { banner: "", frame: "", title: "", background: "", profileColor: "#8B5CF6" };

  // Формируем stats из БД
  const stats: User["stats"] = dbStats ? {
    tracksPlayed: dbStats.tracks_played || 0,
    hoursListened: dbStats.hours_listened || 0,
    playlists: dbStats.playlists_count || 0,
    friends: 0,
    likedTracks: dbStats.liked_count || 0,
    topGenres: (dbStats.top_genres || []).map((g: string) => ({ genre: g, percentage: 0 })),
    weeklyActivity: dbStats.weekly_activity || [0,0,0,0,0,0,0],
    monthlyListening: [],
  } : {
    tracksPlayed: 0,
    hoursListened: 0,
    playlists: 0,
    friends: 0,
    likedTracks: 0,
    topGenres: [],
    weeklyActivity: [0,0,0,0,0,0,0],
    monthlyListening: [],
  };
  
  return {
    uid: su.id,
    visibleId: su.visible_id,
    email: su.email,
    username: su.username,
    passwordHash: su.password_hash,
    displayName: su.display_name || su.username,
    avatar: su.avatar || "",
    banner: su.banner || "linear-gradient(135deg, #8B5CF6 0%, #EC4899 50%, #F97316 100%)",
    bannerType: (su.banner_type as any) || "gradient",
    avatarFrame: equipped.frame,
    badges: [{ id: "newbie", name: "Новичок", icon: "🎵", color: "#8B5CF6", rarity: "common" as const }],
    createdAt: su.created_at,
    isPublic: true,
    favoriteGenres: [],
    connectedServices: [],
    stats,
    achievements: defaultAchievements,
    friends: [],
    status: (su.status as any) || "online",
    statusMessage: su.status_message || "",
    coins: su.coins,
    inventory,
    equipped,
    integrations: { ...defaultIntegrations },
    profileColor: equipped.profileColor,
    isAdmin,
    isBanned: su.is_banned || false,
    lastLogin: su.last_login || new Date().toISOString(),
    readNews: [],
    // Premium fields
    isPremium: su.is_premium || false,
    premiumExpiresAt: su.premium_expires_at,
    // Mini profile background
    miniProfileBg: su.mini_profile_bg || "",
    miniProfileBgType: (su.mini_profile_bg_type as any) || "default",
    // Socials - prefer JSONB socials column, fallback to individual columns
    socials: su.socials && Object.keys(su.socials).length > 0 
      ? su.socials 
      : {
          telegram: su.social_telegram || '',
          discord: su.social_discord || '',
          youtube: su.social_youtube || '',
          tiktok: su.social_tiktok || '',
        },
  };
}

class AccountService {
  // Регистрация
  async registerAsync(data: {
    email: string;
    username: string;
    password: string;
    displayName: string;
    birthDate?: string;
    avatar?: string;
    favoriteGenres?: string[];
  }): Promise<{ success: boolean; error?: string; user?: StoredUser }> {
    
    if (data.password.length < 6) {
      return { success: false, error: "Пароль должен быть минимум 6 символов" };
    }

    const result = await supabaseService.register({
      email: data.email,
      username: data.username,
      password: data.password,
      displayName: data.displayName,
    });

    if (!result.success || !result.user) {
      return { success: false, error: result.error };
    }

    const user = await supabaseToStoredUser(result.user);
    return { success: true, user };
  }

  // Вход
  async loginAsync(emailOrUsername: string, password: string): Promise<{ success: boolean; error?: string; user?: StoredUser }> {
    const result = await supabaseService.login(emailOrUsername, password);

    if (!result.success || !result.user) {
      return { success: false, error: result.error };
    }

    // Проверяем не истек ли премиум
    if (result.user.is_premium && result.user.premium_expires_at) {
      await supabaseService.checkPremiumExpiration(result.user.id);
      // Перезагружаем пользователя после проверки
      const updatedUser = await supabaseService.getUserById(result.user.id);
      if (updatedUser) {
        result.user = updatedUser;
      }
    }

    const user = await supabaseToStoredUser(result.user);
    return { success: true, user };
  }

  // Получить пользователя по ID
  async getUserById(uid: string): Promise<StoredUser | null> {
    const su = await supabaseService.getUserById(uid);
    if (!su) return null;
    return supabaseToStoredUser(su);
  }

  // Обновить пользователя
  async updateUser(uid: string, updates: Partial<StoredUser>): Promise<boolean> {
    const supabaseUpdates: Partial<HarmonixUser> = {};
    
    if (updates.displayName) supabaseUpdates.display_name = updates.displayName;
    if (updates.avatar !== undefined) supabaseUpdates.avatar = updates.avatar;
    if (updates.banner !== undefined) supabaseUpdates.banner = updates.banner;
    if (updates.bannerType) supabaseUpdates.banner_type = updates.bannerType;
    if (updates.status) supabaseUpdates.status = updates.status;
    if (updates.statusMessage !== undefined) supabaseUpdates.status_message = updates.statusMessage;
    if (updates.coins !== undefined) supabaseUpdates.coins = updates.coins;
    // Premium fields
    if (updates.isPremium !== undefined) supabaseUpdates.is_premium = updates.isPremium;
    if (updates.premiumExpiresAt !== undefined) supabaseUpdates.premium_expires_at = updates.premiumExpiresAt;
    // Mini profile background
    if (updates.miniProfileBg !== undefined) supabaseUpdates.mini_profile_bg = updates.miniProfileBg;
    if (updates.miniProfileBgType !== undefined) supabaseUpdates.mini_profile_bg_type = updates.miniProfileBgType;
    // Socials - save as JSONB object
    if (updates.socials !== undefined) {
      supabaseUpdates.socials = updates.socials;
    }

    // Обновляем equipped если есть
    if (updates.equipped) {
      await supabaseService.updateUserEquipped(uid, {
        banner: updates.equipped.banner,
        frame: updates.equipped.frame,
        title: updates.equipped.title,
        background: updates.equipped.background,
        profile_color: updates.equipped.profileColor,
      });
    }

    return supabaseService.updateUser(uid, supabaseUpdates);
  }

  // Добавить монеты
  async addCoins(uid: string, amount: number): Promise<boolean> {
    return supabaseService.addCoins(uid, amount);
  }

  // Потратить монеты
  async spendCoins(uid: string, amount: number): Promise<boolean> {
    return supabaseService.spendCoins(uid, amount);
  }

  // Добавить в инвентарь
  async addToInventory(uid: string, category: keyof UserInventory, itemId: string): Promise<boolean> {
    return supabaseService.addToInventory(uid, itemId, category);
  }

  // Экипировать предмет
  async equipItem(uid: string, slot: keyof EquippedItems, itemId: string): Promise<boolean> {
    const updateData: any = {};
    if (slot === 'profileColor') {
      updateData.profile_color = itemId;
    } else {
      updateData[slot] = itemId;
    }
    return supabaseService.updateUserEquipped(uid, updateData);
  }

  // Обновить статистику
  async incrementStat(uid: string, stat: 'tracksPlayed' | 'playlists' | 'likedTracks', amount: number = 1): Promise<boolean> {
    const statMap: Record<string, 'tracks_played' | 'playlists_count' | 'liked_count'> = {
      tracksPlayed: 'tracks_played',
      playlists: 'playlists_count',
      likedTracks: 'liked_count',
    };
    return supabaseService.incrementStat(uid, statMap[stat], amount);
  }

  // Добавить время прослушивания
  async addListeningTime(uid: string, seconds: number): Promise<boolean> {
    return supabaseService.addListeningTime(uid, seconds);
  }

  // Синхронные методы-заглушки для совместимости
  getUser(_uid: string): StoredUser | null {
    console.warn('[AccountService] getUser is deprecated, use getUserById');
    return null;
  }

  register(_data: any): { success: boolean; error?: string; user?: StoredUser } {
    console.warn('[AccountService] Sync register is deprecated, use registerAsync');
    return { success: false, error: 'Use registerAsync instead' };
  }

  login(_email: string, _password: string): { success: boolean; error?: string; user?: StoredUser } {
    console.warn('[AccountService] Sync login is deprecated, use loginAsync');
    return { success: false, error: 'Use loginAsync instead' };
  }

  emailExists(_email: string): boolean {
    return false;
  }

  usernameExists(_username: string): boolean {
    return false;
  }

  changePassword(_uid: string, _oldPassword: string, _newPassword: string): { success: boolean; error?: string } {
    console.log('[AccountService] changePassword - needs implementation');
    return { success: false, error: 'Смена пароля временно недоступна' };
  }

  getAllUsers(): StoredUser[] {
    return [];
  }
}

export const accountService = new AccountService();
