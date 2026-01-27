// Supabase Service - облачная синхронизация через Supabase
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ============================================
// SUPABASE НАСТРОЙКИ
// ============================================
const SUPABASE_URL = 'https://tgynknhfivavdapobhfk.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_prwmgRXctafvILbt99zSbg_IkMtavGP';
// ============================================

// Типы для таблиц
export interface HarmonixUser {
  id: string;
  visible_id: number;
  email: string;
  username: string;
  password_hash: string;
  display_name: string;
  avatar: string;
  banner: string;
  banner_type: string;
  status: string;
  status_message: string;
  coins: number;
  is_admin: boolean;
  is_banned: boolean;
  ban_reason?: string;
  // Premium
  is_premium: boolean;
  premium_expires_at?: string;
  // Mini profile background
  mini_profile_bg: string;
  mini_profile_bg_type: string;
  // Socials (individual columns - legacy)
  social_telegram?: string;
  social_discord?: string;
  social_youtube?: string;
  social_tiktok?: string;
  // Socials (JSONB object - new)
  socials?: {
    telegram?: string;
    discord?: string;
    youtube?: string;
    tiktok?: string;
  };
  // Pinned tracks (JSONB array)
  pinned_tracks?: Array<{
    trackId: string;
    title: string;
    artist: string;
    artworkUrl?: string;
  }>;
  // Extra usernames (JSONB array of strings)
  extra_usernames?: string[];
  created_at: string;
  last_login: string;
  last_seen?: string; // Для отслеживания онлайн статуса
}

export interface UserStats {
  user_id: string;
  tracks_played: number;
  hours_listened: number;
  playlists_count: number;
  liked_count: number;
  top_genres: string[];
  weekly_activity: number[];
  updated_at: string;
}

export interface UserEquipped {
  user_id: string;
  banner: string;
  frame: string;
  title: string;
  background: string;
  profile_color: string;
  updated_at: string;
}

export interface UserInventoryItem {
  id: string;
  user_id: string;
  item_id: string;
  item_category: string;
  purchased_at: string;
}

export interface LikedTrack {
  id: string;
  user_id: string;
  track_id: string;
  title: string;
  artist: string;
  duration: number;
  artwork_url: string;
  platform: string;
  original_url: string;
  liked_at: string;
}

export interface Playlist {
  id: string;
  user_id: string;
  name: string;
  description: string;
  icon: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlaylistTrack {
  id: string;
  playlist_id: string;
  track_id: string;
  title: string;
  artist: string;
  duration: number;
  artwork_url: string;
  platform: string;
  original_url: string;
  position: number;
  added_at: string;
}

export interface ListenHistoryItem {
  id: string;
  user_id: string;
  track_id: string;
  title: string;
  artist: string;
  duration: number;
  artwork_url: string;
  platform: string;
  listened_seconds: number;
  played_at: string;
}

export interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
  accepted_at?: string;
}

export interface HarmonixUserPublic {
  id: string;
  visible_id: number;
  username: string;
  display_name: string;
  avatar: string;
  banner?: string;
  status: string;
  status_message: string;
  is_admin?: boolean;
  created_at?: string;
  stats?: {
    tracks_played: number;
    hours_listened: number;
    liked_tracks: number;
  };
  socials?: {
    telegram?: string;
    discord?: string;
    youtube?: string;
    tiktok?: string;
  };
  pinned_tracks?: Array<{
    trackId: string;
    title: string;
    artist: string;
    artworkUrl?: string;
  }>;
  extra_usernames?: string[];
  // Mini profile background
  mini_profile_bg?: string;
  mini_profile_bg_type?: 'default' | 'gradient' | 'image';
  // Equipped background from shop
  equipped_background?: string;
}

class SupabaseService {
  private client: SupabaseClient;

  constructor() {
    this.client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }

  private async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'harmonix_salt_2024');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  isConfigured(): boolean {
    return SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0;
  }

  async testConnection(): Promise<boolean> {
    try {
      const { error } = await this.client.from('users').select('id').limit(1);
      if (error) {
        console.error('[Supabase] Connection failed:', error);
        return false;
      }
      console.log('[Supabase] Connected!');
      return true;
    } catch (err) {
      console.error('[Supabase] Connection error:', err);
      return false;
    }
  }

  // ============================================
  // USERS
  // ============================================

  async register(data: {
    email: string;
    username: string;
    password: string;
    displayName: string;
  }): Promise<{ success: boolean; user?: HarmonixUser; error?: string }> {
    try {
      const { data: existingEmail } = await this.client
        .from('users')
        .select('id')
        .eq('email', data.email.toLowerCase())
        .single();

      if (existingEmail) {
        return { success: false, error: 'Email уже используется' };
      }

      const { data: existingUsername } = await this.client
        .from('users')
        .select('id')
        .eq('username', data.username.toLowerCase())
        .single();

      if (existingUsername) {
        return { success: false, error: 'Username уже занят' };
      }

      const passwordHash = await this.hashPassword(data.password);

      // Получаем максимальный visible_id из всех пользователей (включая забаненных)
      const { data: maxIdResult } = await this.client
        .from('users')
        .select('visible_id')
        .order('visible_id', { ascending: false })
        .limit(1)
        .single();
      
      const nextVisibleId = (maxIdResult?.visible_id || 0) + 1;
      console.log('[Supabase] Next visible_id:', nextVisibleId);

      const { data: newUser, error } = await this.client
        .from('users')
        .insert({
          email: data.email.toLowerCase(),
          username: data.username.toLowerCase(),
          password_hash: passwordHash,
          display_name: data.displayName,
          visible_id: nextVisibleId,
          avatar: '',
          banner: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 50%, #F97316 100%)',
          banner_type: 'gradient',
          status: 'online',
          status_message: '',
          coins: 0, // Стартовые монеты - 0 (выдаются только админом)
          is_admin: false,
        })
        .select()
        .single();

      if (error) {
        console.error('[Supabase] Register error:', error);
        return { success: false, error: error.message };
      }

      // Триггер в БД автоматически создаст user_stats, user_equipped и inventory
      return { success: true, user: newUser };
    } catch (err) {
      console.error('[Supabase] Register exception:', err);
      return { success: false, error: 'Ошибка регистрации' };
    }
  }

  async login(emailOrUsername: string, password: string): Promise<{ success: boolean; user?: HarmonixUser; error?: string }> {
    try {
      const passwordHash = await this.hashPassword(password);
      const input = emailOrUsername.toLowerCase();

      const { data: users } = await this.client
        .from('users')
        .select('*')
        .or(`email.eq.${input},username.eq.${input}`);

      if (!users || users.length === 0) {
        return { success: false, error: 'Пользователь не найден' };
      }

      const user = users[0];
      
      if (user.password_hash !== passwordHash) {
        return { success: false, error: 'Неверный пароль' };
      }

      // Обновляем last_login
      await this.client.from('users').update({ last_login: new Date().toISOString(), status: 'online' }).eq('id', user.id);

      return { success: true, user };
    } catch (err) {
      console.error('[Supabase] Login error:', err);
      return { success: false, error: 'Ошибка входа' };
    }
  }

  async getUserById(id: string): Promise<HarmonixUser | null> {
    const { data } = await this.client.from('users').select('*').eq('id', id).single();
    return data;
  }

  async updateUser(id: string, updates: Partial<HarmonixUser>): Promise<boolean> {
    const { error } = await this.client.from('users').update(updates).eq('id', id);
    if (error) console.error('[Supabase] Update user error:', error);
    return !error;
  }

  async addCoins(id: string, amount: number): Promise<boolean> {
    const user = await this.getUserById(id);
    if (!user) return false;
    return this.updateUser(id, { coins: user.coins + amount });
  }

  async spendCoins(id: string, amount: number): Promise<boolean> {
    const user = await this.getUserById(id);
    if (!user || user.coins < amount) return false;
    return this.updateUser(id, { coins: user.coins - amount });
  }

  async searchUsers(query: string): Promise<HarmonixUserPublic[]> {
    const { data } = await this.client
      .from('users')
      .select('id, visible_id, username, display_name, avatar, status, status_message')
      .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
      .limit(10);
    return data || [];
  }

  async getAllUsers(): Promise<HarmonixUserPublic[]> {
    try {
      const { data, error } = await this.client
        .from('users')
        .select('*')
        .order('visible_id', { ascending: true });
      
      if (error) {
        console.error('[Supabase] getAllUsers error:', error);
        return [];
      }
      
      if (!data || data.length === 0) {
        console.log('[Supabase] getAllUsers: no users found');
        return [];
      }
      
      console.log('[Supabase] getAllUsers: found', data.length, 'users');
      
      // Fetch stats and equipped for each user
      const usersWithData = await Promise.all(data.map(async (user) => {
        const [stats, equipped] = await Promise.all([
          this.getUserStats(user.id),
          this.getUserEquipped(user.id),
        ]);
        
        // Determine banner to use:
        // user.banner contains the actual banner value (path like ./banners/xxx or gradient)
        // equipped.banner contains shop item ID (banner_xxx)
        // Priority: user.banner (it's the applied banner)
        let bannerToUse = user.banner || '';
        
        // If user.banner is empty or default gradient, check equipped
        if (!bannerToUse || bannerToUse === 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 50%, #F97316 100%)') {
          if (equipped?.banner && equipped.banner !== 'banner_default') {
            bannerToUse = equipped.banner;
          }
        }
        
        console.log(`[Supabase] User ${user.username}: user.banner="${user.banner?.substring(0, 60) || ''}", equipped.banner="${equipped?.banner || ''}", final="${bannerToUse?.substring(0, 60) || ''}"`);
        
        // Build socials object - prefer JSONB socials column, fallback to individual columns
        let socials: { telegram?: string; discord?: string; youtube?: string; tiktok?: string } = {};
        
        if (user.socials && typeof user.socials === 'object' && Object.keys(user.socials).length > 0) {
          // Use JSONB socials column
          socials = user.socials;
        } else {
          // Fallback to individual columns
          socials = {
            telegram: user.social_telegram || '',
            discord: user.social_discord || '',
            youtube: user.social_youtube || '',
            tiktok: user.social_tiktok || '',
          };
        }
        
        // Filter out empty values
        socials = Object.fromEntries(
          Object.entries(socials).filter(([_, v]) => v && v.trim() !== '')
        ) as typeof socials;
        
        // Parse pinned_tracks - handle both string and object formats
        let pinnedTracks: Array<{ trackId: string; title: string; artist: string; artworkUrl?: string }> = [];
        if (user.pinned_tracks) {
          if (typeof user.pinned_tracks === 'string') {
            try {
              pinnedTracks = JSON.parse(user.pinned_tracks);
            } catch (e) {
              console.error('[Supabase] Failed to parse pinned_tracks:', e);
            }
          } else if (Array.isArray(user.pinned_tracks)) {
            pinnedTracks = user.pinned_tracks;
          }
        }
        
        // Parse extra_usernames
        let extraUsernames: string[] = [];
        if (user.extra_usernames) {
          if (typeof user.extra_usernames === 'string') {
            try {
              extraUsernames = JSON.parse(user.extra_usernames);
            } catch (e) {
              console.error('[Supabase] Failed to parse extra_usernames:', e);
            }
          } else if (Array.isArray(user.extra_usernames)) {
            extraUsernames = user.extra_usernames;
          }
        }
        
        return {
          id: user.id,
          visible_id: user.visible_id,
          username: user.username,
          display_name: user.display_name,
          avatar: user.avatar || '',
          banner: bannerToUse,
          status: user.status || 'offline',
          status_message: user.status_message || '',
          is_admin: user.is_admin || false,
          created_at: user.created_at,
          socials: Object.keys(socials).length > 0 ? socials : undefined,
          pinned_tracks: pinnedTracks.length > 0 ? pinnedTracks : undefined,
          extra_usernames: extraUsernames.length > 0 ? extraUsernames : undefined,
          // Mini profile background
          mini_profile_bg: user.mini_profile_bg || '',
          mini_profile_bg_type: (user.mini_profile_bg_type as any) || 'default',
          equipped_background: equipped?.background || '',
          stats: stats ? {
            tracks_played: stats.tracks_played || 0,
            hours_listened: stats.hours_listened || 0,
            liked_tracks: stats.liked_count || 0,
          } : { tracks_played: 0, hours_listened: 0, liked_tracks: 0 },
        };
      }));
      
      return usersWithData;
    } catch (err) {
      console.error('[Supabase] getAllUsers exception:', err);
      return [];
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    const { error } = await this.client.from('users').delete().eq('id', id);
    return !error;
  }

  // ============================================
  // USER STATS
  // ============================================

  async getUserStats(userId: string): Promise<UserStats | null> {
    const { data } = await this.client.from('user_stats').select('*').eq('user_id', userId).single();
    return data;
  }

  async updateUserStats(userId: string, updates: Partial<UserStats>): Promise<boolean> {
    const { error } = await this.client.from('user_stats').update(updates).eq('user_id', userId);
    if (error) console.error('[Supabase] Update stats error:', error);
    return !error;
  }

  async incrementStat(userId: string, stat: 'tracks_played' | 'playlists_count' | 'liked_count', amount: number = 1): Promise<boolean> {
    const stats = await this.getUserStats(userId);
    if (!stats) return false;
    return this.updateUserStats(userId, { [stat]: (stats[stat] || 0) + amount });
  }

  async addListeningTime(userId: string, seconds: number): Promise<boolean> {
    const stats = await this.getUserStats(userId);
    if (!stats) return false;
    const hours = (stats.hours_listened || 0) + (seconds / 3600);
    return this.updateUserStats(userId, { hours_listened: Math.round(hours * 100) / 100 });
  }

  // ============================================
  // USER EQUIPPED
  // ============================================

  async getUserEquipped(userId: string): Promise<UserEquipped | null> {
    const { data } = await this.client.from('user_equipped').select('*').eq('user_id', userId).single();
    return data;
  }

  async updateUserEquipped(userId: string, updates: Partial<UserEquipped>): Promise<boolean> {
    const { error } = await this.client.from('user_equipped').update(updates).eq('user_id', userId);
    if (error) console.error('[Supabase] Update equipped error:', error);
    return !error;
  }

  // ============================================
  // USER INVENTORY
  // ============================================

  async getUserInventory(userId: string): Promise<UserInventoryItem[]> {
    const { data } = await this.client.from('user_inventory').select('*').eq('user_id', userId);
    return data || [];
  }

  async addToInventory(userId: string, itemId: string, category: string): Promise<boolean> {
    const { error } = await this.client.from('user_inventory').insert({
      user_id: userId,
      item_id: itemId,
      item_category: category,
    });
    if (error && !error.message.includes('duplicate')) {
      console.error('[Supabase] Add inventory error:', error);
      return false;
    }
    return true;
  }

  async hasItem(userId: string, itemId: string): Promise<boolean> {
    const { data } = await this.client
      .from('user_inventory')
      .select('id')
      .eq('user_id', userId)
      .eq('item_id', itemId)
      .single();
    return !!data;
  }

  // ============================================
  // LIKED TRACKS
  // ============================================

  async getLikedTracks(userId: string): Promise<LikedTrack[]> {
    const { data } = await this.client
      .from('liked_tracks')
      .select('*')
      .eq('user_id', userId)
      .order('liked_at', { ascending: false });
    return data || [];
  }

  async likeTrack(userId: string, track: Omit<LikedTrack, 'id' | 'user_id' | 'liked_at'>): Promise<boolean> {
    const { error } = await this.client.from('liked_tracks').insert({
      user_id: userId,
      ...track,
    });
    if (error && !error.message.includes('duplicate')) {
      console.error('[Supabase] Like track error:', error);
      return false;
    }
    // Обновляем счётчик
    await this.incrementStat(userId, 'liked_count', 1);
    return true;
  }

  async unlikeTrack(userId: string, trackId: string): Promise<boolean> {
    const { error } = await this.client
      .from('liked_tracks')
      .delete()
      .eq('user_id', userId)
      .eq('track_id', trackId);
    if (error) {
      console.error('[Supabase] Unlike track error:', error);
      return false;
    }
    await this.incrementStat(userId, 'liked_count', -1);
    return true;
  }

  async isTrackLiked(userId: string, trackId: string): Promise<boolean> {
    const { data } = await this.client
      .from('liked_tracks')
      .select('id')
      .eq('user_id', userId)
      .eq('track_id', trackId)
      .single();
    return !!data;
  }

  // ============================================
  // PLAYLISTS
  // ============================================

  async getPlaylists(userId: string): Promise<Playlist[]> {
    const { data } = await this.client
      .from('playlists')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return data || [];
  }

  async createPlaylist(userId: string, name: string, icon?: string, description?: string): Promise<Playlist | null> {
    const { data, error } = await this.client
      .from('playlists')
      .insert({
        user_id: userId,
        name,
        icon: icon || '🎵',
        description: description || '',
        is_public: false,
      })
      .select()
      .single();
    
    if (error) {
      console.error('[Supabase] Create playlist error:', error);
      return null;
    }
    await this.incrementStat(userId, 'playlists_count', 1);
    return data;
  }

  async updatePlaylist(playlistId: string, updates: Partial<Playlist>): Promise<boolean> {
    const { error } = await this.client.from('playlists').update(updates).eq('id', playlistId);
    return !error;
  }

  async deletePlaylist(userId: string, playlistId: string): Promise<boolean> {
    const { error } = await this.client.from('playlists').delete().eq('id', playlistId);
    if (error) return false;
    await this.incrementStat(userId, 'playlists_count', -1);
    return true;
  }

  // ============================================
  // PLAYLIST TRACKS
  // ============================================

  async getPlaylistTracks(playlistId: string): Promise<PlaylistTrack[]> {
    const { data } = await this.client
      .from('playlist_tracks')
      .select('*')
      .eq('playlist_id', playlistId)
      .order('position', { ascending: true });
    return data || [];
  }

  async addTrackToPlaylist(playlistId: string, track: Omit<PlaylistTrack, 'id' | 'playlist_id' | 'position' | 'added_at'>): Promise<boolean> {
    // Получаем максимальную позицию
    const { data: existing } = await this.client
      .from('playlist_tracks')
      .select('position')
      .eq('playlist_id', playlistId)
      .order('position', { ascending: false })
      .limit(1);
    
    const nextPosition = existing && existing.length > 0 ? existing[0].position + 1 : 0;

    const { error } = await this.client.from('playlist_tracks').insert({
      playlist_id: playlistId,
      position: nextPosition,
      ...track,
    });
    
    if (error && !error.message.includes('duplicate')) {
      console.error('[Supabase] Add track to playlist error:', error);
      return false;
    }
    return true;
  }

  async removeTrackFromPlaylist(playlistId: string, trackId: string): Promise<boolean> {
    const { error } = await this.client
      .from('playlist_tracks')
      .delete()
      .eq('playlist_id', playlistId)
      .eq('track_id', trackId);
    return !error;
  }

  // ============================================
  // LISTEN HISTORY
  // ============================================

  async getListenHistory(userId: string, limit: number = 50): Promise<ListenHistoryItem[]> {
    const { data } = await this.client
      .from('listen_history')
      .select('*')
      .eq('user_id', userId)
      .order('played_at', { ascending: false })
      .limit(limit);
    return data || [];
  }

  async addToHistory(userId: string, track: Omit<ListenHistoryItem, 'id' | 'user_id' | 'played_at'>): Promise<boolean> {
    const { error } = await this.client.from('listen_history').insert({
      user_id: userId,
      ...track,
    });
    if (error) {
      console.error('[Supabase] Add history error:', error);
      return false;
    }
    // Обновляем статистику
    await this.incrementStat(userId, 'tracks_played', 1);
    if (track.listened_seconds > 0) {
      await this.addListeningTime(userId, track.listened_seconds);
    }
    return true;
  }

  // ============================================
  // FRIENDSHIPS
  // ============================================

  async getFriends(userId: string): Promise<{ friend: HarmonixUserPublic; status: string }[]> {
    const { data } = await this.client
      .from('friendships')
      .select(`
        status,
        friend:users!friendships_friend_id_fkey(id, visible_id, username, display_name, avatar, status, status_message)
      `)
      .eq('user_id', userId)
      .eq('status', 'accepted');
    
    return (data || []).map((f: any) => ({ friend: f.friend, status: f.status }));
  }

  async getFriendRequests(userId: string): Promise<{ from: HarmonixUserPublic; id: string }[]> {
    const { data } = await this.client
      .from('friendships')
      .select(`
        id,
        from:users!friendships_user_id_fkey(id, visible_id, username, display_name, avatar, status, status_message)
      `)
      .eq('friend_id', userId)
      .eq('status', 'pending');
    
    return (data || []).map((f: any) => ({ from: f.from, id: f.id }));
  }

  async sendFriendRequest(userId: string, friendId: string): Promise<boolean> {
    if (userId === friendId) return false;
    
    const { error } = await this.client.from('friendships').insert({
      user_id: userId,
      friend_id: friendId,
      status: 'pending',
    });
    
    if (error) {
      console.error('[Supabase] Send friend request error:', error);
      return false;
    }
    return true;
  }

  async acceptFriendRequest(requestId: string): Promise<boolean> {
    const { data: request } = await this.client
      .from('friendships')
      .select('user_id, friend_id')
      .eq('id', requestId)
      .single();
    
    if (!request) return false;

    // Обновляем статус
    const { error: updateError } = await this.client
      .from('friendships')
      .update({ status: 'accepted', accepted_at: new Date().toISOString() })
      .eq('id', requestId);
    
    if (updateError) return false;

    // Создаём обратную связь
    await this.client.from('friendships').insert({
      user_id: request.friend_id,
      friend_id: request.user_id,
      status: 'accepted',
      accepted_at: new Date().toISOString(),
    });

    return true;
  }

  async removeFriend(userId: string, friendId: string): Promise<boolean> {
    // Удаляем обе записи
    await this.client.from('friendships').delete().eq('user_id', userId).eq('friend_id', friendId);
    await this.client.from('friendships').delete().eq('user_id', friendId).eq('friend_id', userId);
    return true;
  }

  // ============================================
  // GLOBAL STATS
  // ============================================

  async getGlobalStats(): Promise<{
    totalUsers: number;
    totalCoins: number;
    admins: number;
    onlineUsers: number;
    totalTracks: number;
    totalPlaylists: number;
  }> {
    const { data: users } = await this.client.from('users').select('coins, is_admin, status, last_seen');
    const { count: tracksCount } = await this.client.from('liked_tracks').select('*', { count: 'exact', head: true });
    const { count: playlistsCount } = await this.client.from('playlists').select('*', { count: 'exact', head: true });
    
    if (!users) return { totalUsers: 0, totalCoins: 0, admins: 0, onlineUsers: 0, totalTracks: 0, totalPlaylists: 0 };

    // Считаем онлайн тех, кто был активен в последние 5 минут
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const onlineCount = users.filter(u => {
      // Если есть last_seen и он свежий - онлайн
      if (u.last_seen && u.last_seen > fiveMinutesAgo) return true;
      return false;
    }).length;

    return {
      totalUsers: users.length,
      totalCoins: users.reduce((sum, u) => sum + (u.coins || 0), 0),
      admins: users.filter(u => u.is_admin).length,
      onlineUsers: onlineCount,
      totalTracks: tracksCount || 0,
      totalPlaylists: playlistsCount || 0,
    };
  }

  // Обновить last_seen (heartbeat)
  async updateLastSeen(userId: string): Promise<boolean> {
    const { error } = await this.client
      .from('users')
      .update({ last_seen: new Date().toISOString(), status: 'online' })
      .eq('id', userId);
    return !error;
  }

  // Установить статус offline при выходе
  async setOffline(userId: string): Promise<boolean> {
    const { error } = await this.client
      .from('users')
      .update({ status: 'offline' })
      .eq('id', userId);
    return !error;
  }

  // ============================================
  // APP SETTINGS (Maintenance mode, etc.)
  // ============================================

  async getAppSettings(): Promise<{ maintenance_mode: boolean; maintenance_message: string } | null> {
    try {
      const { data } = await this.client
        .from('app_settings')
        .select('*')
        .eq('id', 'global')
        .single();
      return data;
    } catch {
      return null;
    }
  }

  async setMaintenanceMode(enabled: boolean, message?: string): Promise<boolean> {
    try {
      const { error } = await this.client
        .from('app_settings')
        .upsert({
          id: 'global',
          maintenance_mode: enabled,
          maintenance_message: message || 'Приложение на обслуживании',
          updated_at: new Date().toISOString(),
        });
      return !error;
    } catch {
      return false;
    }
  }

  // ============================================
  // ADMIN FUNCTIONS
  // ============================================

  async getAllUsersFull(): Promise<HarmonixUser[]> {
    const { data } = await this.client
      .from('users')
      .select('*')
      .order('visible_id', { ascending: true });
    return data || [];
  }

  async setAdmin(userId: string, isAdmin: boolean): Promise<boolean> {
    return this.updateUser(userId, { is_admin: isAdmin });
  }

  async setCoins(userId: string, coins: number): Promise<boolean> {
    return this.updateUser(userId, { coins });
  }

  async getStats(): Promise<{ totalUsers: number; totalCoins: number; admins: number; onlineUsers: number }> {
    const stats = await this.getGlobalStats();
    return {
      totalUsers: stats.totalUsers,
      totalCoins: stats.totalCoins,
      admins: stats.admins,
      onlineUsers: stats.onlineUsers,
    };
  }

  // ============================================
  // PREMIUM MANAGEMENT
  // ============================================

  async setPremium(userId: string, durationDays: number): Promise<boolean> {
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + durationDays);
      
      const { error } = await this.client
        .from('users')
        .update({
          is_premium: true,
          premium_expires_at: expiresAt.toISOString(),
        })
        .eq('id', userId);
      
      if (error) {
        console.error('[Supabase] Set premium error:', error);
        return false;
      }
      
      console.log(`[Supabase] Premium set for user ${userId} until ${expiresAt.toISOString()}`);
      return true;
    } catch (err) {
      console.error('[Supabase] Set premium exception:', err);
      return false;
    }
  }

  async removePremium(userId: string): Promise<boolean> {
    try {
      const { error } = await this.client
        .from('users')
        .update({
          is_premium: false,
          premium_expires_at: null,
        })
        .eq('id', userId);
      
      if (error) {
        console.error('[Supabase] Remove premium error:', error);
        return false;
      }
      
      console.log(`[Supabase] Premium removed for user ${userId}`);
      return true;
    } catch (err) {
      console.error('[Supabase] Remove premium exception:', err);
      return false;
    }
  }

  async checkPremiumExpiration(userId: string): Promise<boolean> {
    try {
      const user = await this.getUserById(userId);
      if (!user || !user.is_premium || !user.premium_expires_at) {
        return false;
      }
      
      const now = new Date();
      const expiresAt = new Date(user.premium_expires_at);
      
      if (now >= expiresAt) {
        // Premium expired, remove it
        await this.removePremium(userId);
        return true; // Expired
      }
      
      return false; // Still active
    } catch (err) {
      console.error('[Supabase] Check premium expiration exception:', err);
      return false;
    }
  }
}


export const supabaseService = new SupabaseService();
