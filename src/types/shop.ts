// Shop item categories
export type ShopCategory = 'banners' | 'frames' | 'titles' | 'backgrounds' | 'avatars' | 'packs';

// Base shop item
export interface ShopItem {
  id: string;
  name: string;
  description: string;
  category: ShopCategory;
  price: number;
  preview: string; // URL or gradient/color
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  animated?: boolean;
  limited?: boolean;
  expiresAt?: string;
}

// Banner item
export interface BannerItem extends ShopItem {
  category: 'banners';
  type: 'image' | 'gradient' | 'animated';
}

// Frame item (avatar frame)
export interface FrameItem extends ShopItem {
  category: 'frames';
  borderColor: string;
  borderWidth: number;
  glowColor?: string;
}

// Title item
export interface TitleItem extends ShopItem {
  category: 'titles';
  color: string;
  icon?: string;
  bgGradient?: string;
  textShadow?: string;
}

// Background item (profile background)
export interface BackgroundItem extends ShopItem {
  category: 'backgrounds';
  type: 'solid' | 'gradient' | 'image' | 'animated';
}

// Pack item (bundle)
export interface PackItem extends ShopItem {
  category: 'packs';
  items: string[]; // IDs of included items
  discount: number; // percentage discount
  originalPrice: number;
}

// User inventory
export interface UserInventory {
  banners: string[];
  frames: string[];
  titles: string[];
  backgrounds: string[];
  packs: string[];
}

// Equipped items
export interface EquippedItems {
  banner: string;
  frame: string;
  title: string;
  background: string;
  profileColor: string;
}

// Integration types
export interface TelegramIntegration {
  connected: boolean;
  username?: string;
  chatId?: string;
  notifications: boolean;
}

export interface DiscordIntegration {
  connected: boolean;
  username?: string;
  discriminator?: string;
  userId?: string;
  richPresence: boolean;
  showActivity: boolean;
}

export interface UserIntegrations {
  telegram?: {
    connected: boolean;
    username?: string;
    notifications: boolean;
  };
  discord?: {
    connected: boolean;
    username?: string;
    richPresence: boolean;
    showActivity: boolean;
  };
  spotify?: boolean;
  youtube?: boolean;
  soundcloud?: boolean;
  lastfm?: boolean;
  vk?: boolean;
  twitch?: boolean;
}

// News/Mail item
export interface NewsItem {
  id: string;
  title: string;
  content?: string;
  items?: { text: string; status: 'done' | 'pending' | 'progress' | 'soon' | 'planned' }[];
  changes?: string[]; // List of changes for update type
  type: 'news' | 'giveaway' | 'update' | 'event' | 'promo' | 'feature' | 'fix' | 'release' | 'roadmap';
  date: string;
  read: boolean;
  image?: string;
  link?: string;
  reward?: {
    type: 'coins' | 'item';
    amount?: number;
    itemId?: string;
  };
  // Giveaway specific
  participants?: string[]; // User IDs who claimed
  winnersCount?: number; // How many winners
  winnerIds?: string[]; // Winner user IDs (array for multiple winners)
  endsAt?: string; // ISO date when giveaway ends
  isEnded?: boolean; // Whether giveaway has ended
}

// Admin action types
export type AdminAction = 
  | { type: 'give_coins'; userId: string; amount: number }
  | { type: 'give_item'; userId: string; itemId: string }
  | { type: 'give_title'; userId: string; titleId: string }
  | { type: 'set_admin'; userId: string; isAdmin: boolean }
  | { type: 'ban_user'; userId: string; reason: string }
  | { type: 'unban_user'; userId: string };

// Admin log entry
export interface AdminLogEntry {
  id: string;
  action: AdminAction;
  adminId: string;
  timestamp: string;
}
