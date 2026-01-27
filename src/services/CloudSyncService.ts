// Cloud Sync Service - теперь использует Supabase
import { supabaseService, HarmonixUser, HarmonixUserPublic } from './SupabaseService';

interface CloudUser {
  uid: string;
  visibleId: number;
  email: string;
  username: string;
  passwordHash: string;
  displayName: string;
  avatar: string;
  banner: string;
  bannerType: string;
  coins: number;
  inventory: any;
  equipped: any;
  stats: any;
  achievements: any[];
  isAdmin: boolean;
  createdAt: string;
  lastLogin: string;
  status?: string;
  statusMessage?: string;
  friends?: string[];
  friendRequests?: { incoming: string[]; outgoing: string[] };
  [key: string]: any;
}

interface CloudData {
  users: CloudUser[];
  nextVisibleId: number;
  updatedAt: string;
}

// Конвертация из Supabase формата
function supabaseToCloudUser(su: HarmonixUser | HarmonixUserPublic): CloudUser {
  return {
    uid: su.id,
    visibleId: su.visible_id,
    email: (su as HarmonixUser).email || '',
    username: su.username,
    passwordHash: (su as HarmonixUser).password_hash || '',
    displayName: su.display_name || su.username,
    avatar: su.avatar || '',
    banner: (su as HarmonixUser).banner || '',
    bannerType: (su as HarmonixUser).banner_type || 'gradient',
    coins: (su as HarmonixUser).coins || 0,
    inventory: {},
    equipped: {},
    stats: { tracksPlayed: 0, hoursListened: 0, friends: 0 },
    achievements: [],
    isAdmin: (su as HarmonixUser).is_admin || false,
    createdAt: (su as HarmonixUser).created_at || '',
    lastLogin: '',
    status: su.status || 'online',
    statusMessage: su.status_message || '',
    friends: [],
    friendRequests: { incoming: [], outgoing: [] },
  };
}

class CloudSyncService {
  private cache: CloudData | null = null;
  private lastFetch: number = 0;
  private readonly CACHE_TTL = 5000;

  isConfigured(): boolean {
    return supabaseService.isConfigured();
  }

  async fetchUsers(): Promise<CloudData | null> {
    // Проверяем кэш
    if (this.cache && Date.now() - this.lastFetch < this.CACHE_TTL) {
      return this.cache;
    }

    try {
      const users = await supabaseService.getAllUsers();
      
      const cloudUsers = users.map(u => supabaseToCloudUser(u));
      
      // Вычисляем следующий visible_id как MAX + 1 (не count!)
      const maxVisibleId = cloudUsers.reduce((max, u) => Math.max(max, u.visibleId || 0), 0);
      
      this.cache = {
        users: cloudUsers,
        nextVisibleId: maxVisibleId + 1,
        updatedAt: new Date().toISOString(),
      };
      this.lastFetch = Date.now();
      
      return this.cache;
    } catch (error) {
      console.error('[CloudSync] Error fetching users:', error);
      return null;
    }
  }

  async saveUsers(_data: CloudData): Promise<boolean> {
    // Supabase сохраняет автоматически через updateUser
    console.log('[CloudSync] saveUsers called - Supabase handles this automatically');
    return true;
  }

  async findUserByEmail(email: string): Promise<CloudUser | null> {
    const data = await this.fetchUsers();
    if (!data) return null;
    return data.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  async findUserByUsername(username: string): Promise<CloudUser | null> {
    const data = await this.fetchUsers();
    if (!data) return null;
    return data.users.find(u => u.username.toLowerCase() === username.toLowerCase()) || null;
  }

  async findUserByUid(uid: string): Promise<CloudUser | null> {
    const data = await this.fetchUsers();
    if (!data) return null;
    return data.users.find(u => u.uid === uid) || null;
  }

  async registerUser(_user: CloudUser): Promise<{ success: boolean; visibleId?: number; error?: string }> {
    // Регистрация теперь через SupabaseService
    console.log('[CloudSync] registerUser - use SupabaseService.register instead');
    return { success: true, visibleId: 1 };
  }

  async updateUser(uid: string, updates: Partial<CloudUser>): Promise<boolean> {
    const supabaseUpdates: Partial<HarmonixUser> = {};
    
    if (updates.displayName) supabaseUpdates.display_name = updates.displayName;
    if (updates.avatar) supabaseUpdates.avatar = updates.avatar;
    if (updates.banner) supabaseUpdates.banner = updates.banner;
    if (updates.bannerType) supabaseUpdates.banner_type = updates.bannerType;
    if (updates.status) supabaseUpdates.status = updates.status;
    if (updates.statusMessage) supabaseUpdates.status_message = updates.statusMessage;
    if (updates.coins !== undefined) supabaseUpdates.coins = updates.coins;

    const result = await supabaseService.updateUser(uid, supabaseUpdates);
    if (result) {
      this.clearCache();
    }
    return result;
  }

  async syncUser(localUser: any): Promise<void> {
    if (!localUser?.uid) return;
    await this.updateUser(localUser.uid, localUser);
  }

  async getNextVisibleId(): Promise<number> {
    const data = await this.fetchUsers();
    if (!data) return 1;
    return data.nextVisibleId;
  }

  clearCache(): void {
    this.cache = null;
    this.lastFetch = 0;
  }
}

export const cloudSyncService = new CloudSyncService();
