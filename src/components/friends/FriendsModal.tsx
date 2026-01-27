import { useState, useEffect, useCallback } from "react";
import {
  HiOutlineXMark,
  HiOutlineMagnifyingGlass,
  HiOutlineUserPlus,
  HiOutlineUsers,
  HiOutlineClock,
  HiOutlineCheck,
  HiOutlineArrowLeft,
  HiOutlineSparkles,
  HiOutlineMusicalNote,
  HiOutlineChartBar,
  HiOutlineHeart,
  HiOutlineClipboard,
  HiOutlineUserMinus,
  HiOutlineAtSymbol,
} from "react-icons/hi2";
import { FaTelegram, FaDiscord, FaYoutube, FaTiktok } from "react-icons/fa";
import { useThemeStore } from "../../stores/themeStore";
import { useUserStore } from "../../stores/userStore";
import { supabaseService, HarmonixUserPublic } from "../../services/SupabaseService";
import { shopService } from "../../services/ShopService";

type Tab = "friends" | "search" | "requests";

interface FriendsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Mini Profile Card when viewing a user
const UserProfileCard = ({
  user,
  onBack,
  onAddFriend,
  onRemoveFriend,
  isFriend,
  isPending,
  colors,
}: {
  user: HarmonixUserPublic;
  onBack: () => void;
  onAddFriend: () => void;
  onRemoveFriend: () => void;
  isFriend: boolean;
  isPending: boolean;
  colors: any;
}) => {
  const [showStats, setShowStats] = useState(false);
  const [showUsernames, setShowUsernames] = useState(false);
  
  const statusColors: Record<string, string> = {
    online: "#22C55E",
    dnd: "#EF4444",
    offline: "#6B7280",
  };

  // Get mini profile background style
  const getMiniProfileBgStyle = (): React.CSSProperties => {
    // First check for custom mini profile background (URL image)
    if (user.mini_profile_bg_type === 'image' && user.mini_profile_bg) {
      return {
        backgroundImage: `url(${user.mini_profile_bg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      };
    }
    
    // Check for equipped background from shop
    if (user.equipped_background) {
      const shopBg = shopService.getItemById(user.equipped_background);
      if (shopBg?.preview) {
        if (shopBg.preview.startsWith('/') || shopBg.preview.startsWith('http')) {
          return {
            backgroundImage: `url(${shopBg.preview})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          };
        }
        // It's a gradient
        return { background: shopBg.preview };
      }
    }
    
    // Default - use surface color
    return { background: colors.surface };
  };

  const getBannerStyle = () => {
    const banner = user.banner;
    console.log('[UserProfileCard] Banner value:', banner);
    
    // Default gradient for empty or default banner
    const defaultGradient = { background: `linear-gradient(135deg, #8B5CF6 0%, #EC4899 50%, #F97316 100%)` };
    
    if (!banner || banner === 'banner_default') {
      return defaultGradient;
    }
    
    // Direct path to file (./banners/xxx or /banners/xxx)
    if (banner.startsWith('./') || banner.startsWith('/banners/')) {
      // Convert ./banners to /banners for proper URL
      const fixedPath = banner.startsWith('./') ? banner.substring(1) : banner;
      console.log('[UserProfileCard] Using direct path:', fixedPath);
      return { backgroundImage: `url(${fixedPath})`, backgroundSize: 'cover', backgroundPosition: 'center' };
    }
    
    // Check if it's a shop banner ID (banner_xxx format without path)
    if (banner.startsWith('banner_') && !banner.includes('/')) {
      const shopBanner = shopService.getItemById(banner);
      console.log('[UserProfileCard] Shop banner found:', shopBanner);
      if (shopBanner?.preview) {
        if (shopBanner.preview.startsWith('/') || shopBanner.preview.startsWith('http')) {
          return { backgroundImage: `url(${shopBanner.preview})`, backgroundSize: 'cover', backgroundPosition: 'center' };
        }
        // It's a gradient
        return { background: shopBanner.preview };
      }
      // Shop banner not found, use default gradient
      return defaultGradient;
    }
    
    // Direct URL (http, https, data:)
    if (banner.startsWith('http') || banner.startsWith('data:')) {
      return { backgroundImage: `url(${banner})`, backgroundSize: 'cover', backgroundPosition: 'center' };
    }
    
    // Gradient or other CSS value (linear-gradient, #hex, rgb, etc)
    if (banner.includes('gradient') || banner.startsWith('#') || banner.startsWith('rgb')) {
      return { background: banner };
    }
    
    // Fallback - try as background (might be a color or gradient)
    return { background: banner };
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: `${label} скопирован!`, type: 'success' } }));
  };

  const daysSinceJoin = user.created_at 
    ? Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="animate-fadeIn">
      <button
        onClick={onBack}
        className="flex items-center gap-2 mb-4 text-sm transition-all hover:gap-3"
        style={{ color: colors.textSecondary }}
      >
        <HiOutlineArrowLeft className="w-4 h-4" />
        Назад
      </button>

      <div
        className="rounded-2xl overflow-hidden"
        style={{ 
          ...getMiniProfileBgStyle(),
          border: `1px solid ${colors.textSecondary}15`,
        }}
      >
        {/* Banner */}
        <div className="h-32 relative" style={getBannerStyle()}>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>

        {/* Avatar & Info */}
        <div 
          className="px-5 pb-5 -mt-12 relative"
          style={{ 
            background: user.mini_profile_bg_type === 'image' || user.equipped_background 
              ? 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.7) 30%, rgba(0,0,0,0.85) 100%)' 
              : undefined 
          }}
        >
          <div className="flex items-end gap-4">
            {/* Avatar - круглый */}
            <div className="relative">
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center text-4xl border-4 overflow-hidden shadow-xl"
                style={{ background: colors.surface, borderColor: colors.surface }}
              >
                {user.avatar && (user.avatar.startsWith("http") || user.avatar.startsWith("data:")) ? (
                  <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                ) : user.avatar ? (
                  <span>{user.avatar}</span>
                ) : (
                  <span className="text-2xl font-bold" style={{ color: colors.textSecondary }}>{user.display_name?.[0]?.toUpperCase() || "?"}</span>
                )}
              </div>
              {/* Status indicator - маленький */}
              <div
                className="absolute bottom-1 right-1 w-5 h-5 rounded-full border-3"
                style={{ background: statusColors[user.status || "offline"], borderColor: colors.surface, borderWidth: '3px' }}
              />
            </div>
          </div>

          <div className="mt-3">
            <div className="flex items-center gap-2">
              <h3 className="text-2xl font-bold" style={{ color: colors.textPrimary }}>{user.display_name}</h3>
              {user.is_admin && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ background: "#EF4444", color: "#fff" }}>ADMIN</span>
              )}
            </div>
            {/* Username with hover for all usernames */}
            <div className="relative inline-block">
              <button
                onMouseEnter={() => setShowUsernames(true)}
                onMouseLeave={() => setShowUsernames(false)}
                className="text-sm flex items-center gap-1 transition-colors hover:opacity-80"
                style={{ color: colors.textSecondary }}
              >
                @{user.username}
                {user.extra_usernames && user.extra_usernames.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: `${colors.accent}20`, color: colors.accent }}>
                    +{user.extra_usernames.length}
                  </span>
                )}
              </button>
              {/* Usernames dropdown */}
              {showUsernames && user.extra_usernames && user.extra_usernames.length > 0 && (
                <div
                  className="absolute left-0 top-full mt-1 py-2 px-3 rounded-xl z-10 min-w-[160px] animate-fadeIn"
                  style={{ background: colors.surface, border: `1px solid ${colors.textSecondary}20`, boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}
                  onMouseEnter={() => setShowUsernames(true)}
                  onMouseLeave={() => setShowUsernames(false)}
                >
                  <div className="flex items-center gap-2 mb-2 pb-2" style={{ borderBottom: `1px solid ${colors.textSecondary}10` }}>
                    <HiOutlineAtSymbol className="w-3.5 h-3.5" style={{ color: colors.accent }} />
                    <span className="text-[10px] font-medium" style={{ color: colors.textSecondary }}>Все юзернеймы</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 py-1">
                      <span className="text-xs" style={{ color: colors.textPrimary }}>@{user.username}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: `${colors.accent}20`, color: colors.accent }}>основной</span>
                    </div>
                    {user.extra_usernames.map((uname, i) => (
                      <div key={i} className="flex items-center gap-2 py-1">
                        <span className="text-xs" style={{ color: colors.textPrimary }}>@{uname}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <p className="text-xs mt-2 px-2 py-1 rounded inline-block" style={{ background: `${colors.textSecondary}15`, color: colors.textSecondary }}>
              ID: {user.visible_id}
            </p>
          </div>

          {user.status_message && (
            <p className="mt-4 text-sm px-4 py-3 rounded-xl italic" style={{ background: `${colors.textSecondary}08`, color: colors.textSecondary }}>
              "{user.status_message}"
            </p>
          )}

          {/* Social Links */}
          {user.socials && Object.values(user.socials).some(Boolean) && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4" style={{ borderTop: `1px solid ${colors.textSecondary}10` }}>
              {user.socials.telegram && (
                <button onClick={() => copyToClipboard(user.socials!.telegram!, 'Telegram')} className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all hover:scale-105" style={{ background: "rgba(0, 136, 204, 0.15)" }}>
                  <FaTelegram className="w-4 h-4" style={{ color: "#0088cc" }} />
                  <span className="text-xs" style={{ color: "#0088cc" }}>@{user.socials.telegram}</span>
                  <HiOutlineClipboard className="w-3 h-3" style={{ color: "rgba(255,255,255,0.4)" }} />
                </button>
              )}
              {user.socials.discord && (
                <button onClick={() => copyToClipboard(user.socials!.discord!, 'Discord')} className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all hover:scale-105" style={{ background: "rgba(88, 101, 242, 0.15)" }}>
                  <FaDiscord className="w-4 h-4" style={{ color: "#5865F2" }} />
                  <span className="text-xs" style={{ color: "#5865F2" }}>{user.socials.discord}</span>
                  <HiOutlineClipboard className="w-3 h-3" style={{ color: "rgba(255,255,255,0.4)" }} />
                </button>
              )}
              {user.socials.youtube && (
                <a href={user.socials.youtube.startsWith('http') ? user.socials.youtube : `https://youtube.com/@${user.socials.youtube}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all hover:scale-105" style={{ background: "rgba(255, 0, 0, 0.15)" }}>
                  <FaYoutube className="w-4 h-4" style={{ color: "#FF0000" }} />
                  <span className="text-xs" style={{ color: "#FF0000" }}>{user.socials.youtube}</span>
                </a>
              )}
              {user.socials.tiktok && (
                <a href={`https://tiktok.com/@${user.socials.tiktok.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all hover:scale-105" style={{ background: "rgba(255,255,255,0.08)" }}>
                  <FaTiktok className="w-4 h-4" style={{ color: "rgba(255,255,255,0.8)" }} />
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.8)" }}>@{user.socials.tiktok}</span>
                </a>
              )}
            </div>
          )}

          {/* Pinned Tracks */}
          {user.pinned_tracks && user.pinned_tracks.length > 0 && (
            <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${colors.textSecondary}10` }}>
              <div className="flex items-center gap-2 mb-3">
                <HiOutlineHeart className="w-4 h-4" style={{ color: colors.accent }} />
                <span className="text-xs font-medium" style={{ color: colors.textSecondary }}>Любимые треки</span>
              </div>
              <div className="space-y-2">
                {user.pinned_tracks.slice(0, 3).map((track: any, i: number) => (
                  <div key={track.trackId || i} className="flex items-center gap-3 p-2 rounded-xl" style={{ background: `${colors.textSecondary}08` }}>
                    <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0" style={{ background: `${colors.textSecondary}15` }}>
                      {track.artworkUrl ? <img src={track.artworkUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><HiOutlineMusicalNote className="w-5 h-5" style={{ color: colors.textSecondary }} /></div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: colors.textPrimary }}>{track.title}</p>
                      <p className="text-xs truncate" style={{ color: colors.textSecondary }}>{track.artist}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stats Toggle Button */}
          <button
            onClick={() => setShowStats(!showStats)}
            className="w-full mt-4 py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all"
            style={{ background: showStats ? `${colors.accent}15` : `${colors.textSecondary}08`, color: showStats ? colors.accent : colors.textSecondary }}
          >
            <HiOutlineChartBar className="w-4 h-4" />
            {showStats ? 'Скрыть статистику' : 'Показать статистику'}
          </button>

          {/* Statistics Panel */}
          {showStats && (
            <div className="mt-3 p-4 rounded-xl space-y-4 animate-fadeIn" style={{ background: `${colors.textSecondary}05`, border: `1px solid ${colors.textSecondary}10` }}>
              <div className="grid grid-cols-4 gap-3">
                <div className="text-center p-3 rounded-xl" style={{ background: `${colors.accent}10` }}>
                  <HiOutlineMusicalNote className="w-5 h-5 mx-auto mb-1" style={{ color: colors.accent }} />
                  <p className="text-lg font-bold" style={{ color: colors.textPrimary }}>{user.stats?.tracks_played || 0}</p>
                  <p className="text-[10px]" style={{ color: colors.textSecondary }}>треков</p>
                </div>
                <div className="text-center p-3 rounded-xl" style={{ background: `${colors.accent}10` }}>
                  <HiOutlineClock className="w-5 h-5 mx-auto mb-1" style={{ color: colors.accent }} />
                  <p className="text-lg font-bold" style={{ color: colors.textPrimary }}>{Math.round(user.stats?.hours_listened || 0)}ч</p>
                  <p className="text-[10px]" style={{ color: colors.textSecondary }}>прослушано</p>
                </div>
                <div className="text-center p-3 rounded-xl" style={{ background: `${colors.accent}10` }}>
                  <HiOutlineHeart className="w-5 h-5 mx-auto mb-1" style={{ color: colors.accent }} />
                  <p className="text-lg font-bold" style={{ color: colors.textPrimary }}>{user.stats?.liked_tracks || 0}</p>
                  <p className="text-[10px]" style={{ color: colors.textSecondary }}>лайков</p>
                </div>
                <div className="text-center p-3 rounded-xl" style={{ background: `${colors.accent}10` }}>
                  <HiOutlineSparkles className="w-5 h-5 mx-auto mb-1" style={{ color: colors.accent }} />
                  <p className="text-lg font-bold" style={{ color: colors.textPrimary }}>{daysSinceJoin}</p>
                  <p className="text-[10px]" style={{ color: colors.textSecondary }}>дней</p>
                </div>
              </div>
              <div className="space-y-2 pt-3" style={{ borderTop: `1px solid ${colors.textSecondary}10` }}>
                <div className="flex justify-between items-center py-1">
                  <span className="text-xs" style={{ color: colors.textSecondary }}>Дата регистрации</span>
                  <span className="text-xs font-medium" style={{ color: colors.textPrimary }}>{user.created_at ? new Date(user.created_at).toLocaleDateString('ru-RU') : 'Неизвестно'}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-xs" style={{ color: colors.textSecondary }}>Треков в день</span>
                  <span className="text-xs font-medium" style={{ color: colors.textPrimary }}>~{daysSinceJoin > 0 ? ((user.stats?.tracks_played || 0) / daysSinceJoin).toFixed(1) : 0}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-xs" style={{ color: colors.textSecondary }}>Минут в день</span>
                  <span className="text-xs font-medium" style={{ color: colors.textPrimary }}>~{daysSinceJoin > 0 ? (((user.stats?.hours_listened || 0) * 60) / daysSinceJoin).toFixed(0) : 0}</span>
                </div>
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="mt-4">
            {isFriend ? (
              <button
                onClick={onRemoveFriend}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all hover:scale-[1.02]"
                style={{ background: "rgba(239, 68, 68, 0.15)", color: "#EF4444" }}
              >
                <HiOutlineUserMinus className="w-5 h-5" />
                Удалить из друзей
              </button>
            ) : isPending ? (
              <div className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium" style={{ background: `${colors.textSecondary}15`, color: colors.textSecondary }}>
                <HiOutlineClock className="w-5 h-5" />
                Заявка отправлена
              </div>
            ) : (
              <button onClick={onAddFriend} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02] hover:brightness-110" style={{ background: "var(--interactive-accent)", color: "var(--interactive-accent-text)" }}>
                <HiOutlineUserPlus className="w-5 h-5" />
                Добавить в друзья
              </button>
            )}
          </div>

          {user.created_at && (
            <p className="text-center text-[10px] mt-3" style={{ color: colors.textSecondary, opacity: 0.6 }}>
              В Harmonix с {new Date(user.created_at).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
            </p>
          )}
        </div>
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
      `}</style>
    </div>
  );
};

// User List Item
const UserListItem = ({ user, onClick, colors, actionButton }: { user: HarmonixUserPublic; onClick: () => void; colors: any; actionButton?: React.ReactNode }) => {
  const statusColors: Record<string, string> = { online: "#22C55E", dnd: "#EF4444", offline: "#6B7280" };
  const hasImageAvatar = user.avatar && (user.avatar.startsWith("http") || user.avatar.startsWith("data:"));
  return (
    <div className="group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all hover:scale-[1.01]" style={{ background: `${colors.surface}60` }} onClick={onClick}>
      <div className="relative">
        <div className="w-11 h-11 rounded-full flex items-center justify-center text-lg overflow-hidden" style={{ background: `${colors.accent}20` }}>
          {hasImageAvatar ? (
            <img src={user.avatar} alt="" className="w-full h-full object-cover" />
          ) : user.avatar ? (
            <span>{user.avatar}</span>
          ) : (
            <span className="text-sm font-bold" style={{ color: colors.textSecondary }}>{user.display_name?.[0]?.toUpperCase() || "?"}</span>
          )}
        </div>
        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2" style={{ background: statusColors[user.status || "offline"], borderColor: colors.background }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate" style={{ color: colors.textPrimary }}>{user.display_name}</p>
        <p className="text-xs truncate" style={{ color: colors.textSecondary }}>@{user.username} · ID: {user.visible_id}</p>
      </div>
      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
        {actionButton}
      </div>
    </div>
  );
};

export function FriendsModal({ isOpen, onClose }: FriendsModalProps) {
  const [tab, setTab] = useState<Tab>("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<HarmonixUserPublic[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<HarmonixUserPublic | null>(null);
  const [allUsers, setAllUsers] = useState<HarmonixUserPublic[]>([]);
  const [pendingRequests, setPendingRequests] = useState<string[]>([]);
  const [friendsList, setFriendsList] = useState<string[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<{ from: HarmonixUserPublic; id: string }[]>([]);

  const { currentTheme } = useThemeStore();
  const { user } = useUserStore();
  const colors = currentTheme.colors;

  useEffect(() => {
    if (isOpen) {
      setAllUsers([]);
      setSearchResults([]);
      setSelectedUser(null);
      loadUsers();
      loadFriendsAndRequests();
    }
  }, [isOpen]);

  const loadUsers = async () => {
    const users = await supabaseService.getAllUsers();
    setAllUsers(users.filter(u => u.id !== user?.uid));
  };

  const loadFriendsAndRequests = async () => {
    if (!user?.uid) return;
    
    try {
      // Load friends
      const friends = await supabaseService.getFriends(user.uid);
      setFriendsList(friends.map(f => f.friend.id));
      
      // Load incoming friend requests
      const requests = await supabaseService.getFriendRequests(user.uid);
      setIncomingRequests(requests);
    } catch (error) {
      console.error('Error loading friends:', error);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      const success = await supabaseService.acceptFriendRequest(requestId);
      if (success) {
        window.dispatchEvent(new CustomEvent("show-toast", { detail: { message: "Заявка принята!", type: "success" } }));
        loadFriendsAndRequests(); // Reload
      }
    } catch (error) {
      console.error('Error accepting request:', error);
    }
  };

  const handleRejectRequest = async (requestId: string, userId: string) => {
    try {
      // Remove the friendship record
      await supabaseService.removeFriend(userId, user?.uid || '');
      setIncomingRequests(prev => prev.filter(r => r.id !== requestId));
      window.dispatchEvent(new CustomEvent("show-toast", { detail: { message: "Заявка отклонена", type: "info" } }));
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    const query = searchQuery.toLowerCase().trim();
    const queryNum = parseInt(searchQuery.trim(), 10);
    const results = allUsers.filter(u => {
      const matchUsername = u.username.toLowerCase().includes(query);
      const matchDisplayName = u.display_name.toLowerCase().includes(query);
      const matchId = !isNaN(queryNum) && u.visible_id === queryNum;
      return matchUsername || matchDisplayName || matchId;
    });
    setSearchResults(results);
    setIsSearching(false);
  }, [searchQuery, allUsers]);

  useEffect(() => {
    const timer = setTimeout(handleSearch, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, handleSearch]);

  const handleAddFriend = async () => {
    if (!selectedUser || !user?.uid) return;
    
    try {
      const success = await supabaseService.sendFriendRequest(user.uid, selectedUser.id);
      if (success) {
        setPendingRequests(prev => [...prev, selectedUser.id]);
        window.dispatchEvent(new CustomEvent("show-toast", { detail: { message: "Заявка отправлена!", type: "success" } }));
      } else {
        window.dispatchEvent(new CustomEvent("show-toast", { detail: { message: "Не удалось отправить заявку", type: "error" } }));
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
      window.dispatchEvent(new CustomEvent("show-toast", { detail: { message: "Ошибка при отправке заявки", type: "error" } }));
    }
  };

  const handleRemoveFriend = async () => {
    if (!selectedUser || !user?.uid) return;
    
    try {
      const success = await supabaseService.removeFriend(user.uid, selectedUser.id);
      if (success) {
        setFriendsList(prev => prev.filter(id => id !== selectedUser.id));
        window.dispatchEvent(new CustomEvent("show-toast", { detail: { message: "Удалён из друзей", type: "info" } }));
        setSelectedUser(null);
      } else {
        window.dispatchEvent(new CustomEvent("show-toast", { detail: { message: "Не удалось удалить из друзей", type: "error" } }));
      }
    } catch (error) {
      console.error('Error removing friend:', error);
      window.dispatchEvent(new CustomEvent("show-toast", { detail: { message: "Ошибка при удалении", type: "error" } }));
    }
  };

  const handleRemoveFriendById = async (friendId: string) => {
    if (!user?.uid) return;
    
    try {
      const success = await supabaseService.removeFriend(user.uid, friendId);
      if (success) {
        setFriendsList(prev => prev.filter(id => id !== friendId));
        window.dispatchEvent(new CustomEvent("show-toast", { detail: { message: "Удалён из друзей", type: "info" } }));
      }
    } catch (error) {
      console.error('Error removing friend:', error);
    }
  };

  if (!isOpen) return null;

  const tabs = [
    { id: "friends" as Tab, label: "Друзья", icon: HiOutlineUsers, count: friendsList.length },
    { id: "search" as Tab, label: "Поиск", icon: HiOutlineMagnifyingGlass },
    { id: "requests" as Tab, label: "Заявки", icon: HiOutlineClock, count: incomingRequests.length },
  ];

  const isFriend = (userId: string) => friendsList.includes(userId);
  const isPending = (userId: string) => pendingRequests.includes(userId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 backdrop-blur-sm" style={{ background: "rgba(0,0,0,0.6)" }} onClick={onClose} />
      <div className="relative w-full max-w-md max-h-[85vh] rounded-3xl overflow-hidden flex flex-col animate-modalIn" style={{ background: colors.background, border: `1px solid ${colors.textSecondary}15`, boxShadow: `0 25px 50px -12px ${colors.accent}30` }}>
        <style>{`
          @keyframes modalIn { from { opacity: 0; transform: scale(0.95) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
          .animate-modalIn { animation: modalIn 0.3s ease-out; }
        `}</style>

        {/* Header */}
        <div className="p-5 border-b" style={{ borderColor: `${colors.textSecondary}15` }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${colors.accent}, ${colors.secondary})` }}>
                <HiOutlineUsers className="w-5 h-5" style={{ color: "var(--interactive-accent-text)" }} />
              </div>
              <div>
                <h2 className="text-lg font-bold" style={{ color: colors.textPrimary }}>Друзья</h2>
                <p className="text-xs" style={{ color: colors.textSecondary }}>Найди друзей и слушай вместе</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl transition-colors hover:bg-white/10" style={{ color: colors.textSecondary }}>
              <HiOutlineXMark className="w-6 h-6" />
            </button>
          </div>

          {!selectedUser && (
            <div className="flex gap-2">
              {tabs.map((t) => {
                const Icon = t.icon;
                const isActive = tab === t.id;
                return (
                  <button key={t.id} onClick={() => setTab(t.id)} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all" style={{ background: isActive ? `${colors.accent}20` : "transparent", color: isActive ? colors.accent : colors.textSecondary }}>
                    <Icon className="w-4 h-4" />
                    {t.label}
                    {t.count !== undefined && t.count > 0 && <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold" style={{ background: colors.accent, color: "var(--interactive-accent-text)" }}>{t.count}</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 scrollbar-hide">
          {selectedUser ? (
            <UserProfileCard user={selectedUser} onBack={() => setSelectedUser(null)} onAddFriend={handleAddFriend} onRemoveFriend={handleRemoveFriend} isFriend={isFriend(selectedUser.id)} isPending={isPending(selectedUser.id)} colors={colors} />
          ) : tab === "search" ? (
            <div className="space-y-4">
              <div className="relative">
                <HiOutlineMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: colors.textSecondary }} />
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Поиск по имени, username или ID..." className="w-full pl-12 pr-4 py-3.5 rounded-xl focus:outline-none transition-all" style={{ background: `${colors.surface}80`, border: `2px solid ${searchQuery ? colors.accent : `${colors.textSecondary}20`}`, color: colors.textPrimary }} />
              </div>
              {isSearching ? (
                <div className="flex items-center justify-center py-10">
                  <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: `${colors.accent}30`, borderTopColor: colors.accent }} />
                </div>
              ) : searchQuery ? (
                searchResults.length > 0 ? (
                  <div className="space-y-2">
                    {searchResults.map((u) => <UserListItem key={u.id} user={u} onClick={() => setSelectedUser(u)} colors={colors} />)}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <HiOutlineMagnifyingGlass className="w-12 h-12 mx-auto mb-3 opacity-30" style={{ color: colors.textSecondary }} />
                    <p style={{ color: colors.textSecondary }}>Никого не найдено</p>
                  </div>
                )
              ) : (
                <div className="text-center py-10">
                  <HiOutlineSparkles className="w-12 h-12 mx-auto mb-3" style={{ color: colors.accent, opacity: 0.5 }} />
                  <p style={{ color: colors.textSecondary }}>Найди друзей</p>
                  <p className="text-xs mt-1" style={{ color: colors.textSecondary, opacity: 0.6 }}>Введи имя, username или ID</p>
                </div>
              )}
            </div>
          ) : tab === "friends" ? (
            friendsList.length > 0 ? (
              <div className="space-y-2">
                {allUsers.filter(u => friendsList.includes(u.id)).map((u) => (
                  <UserListItem 
                    key={u.id} 
                    user={u} 
                    onClick={() => setSelectedUser(u)} 
                    colors={colors}
                    actionButton={
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRemoveFriendById(u.id); }}
                        className="p-2 rounded-lg transition-all hover:scale-105 opacity-0 group-hover:opacity-100"
                        style={{ background: "rgba(239, 68, 68, 0.15)", color: "#EF4444" }}
                        title="Удалить из друзей"
                      >
                        <HiOutlineUserMinus className="w-4 h-4" />
                      </button>
                    }
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <HiOutlineUsers className="w-12 h-12 mx-auto mb-3 opacity-30" style={{ color: colors.textSecondary }} />
                <p style={{ color: colors.textSecondary }}>Пока нет друзей</p>
                <p className="text-xs mt-1" style={{ color: colors.textSecondary, opacity: 0.6 }}>Найди друзей во вкладке "Поиск"</p>
              </div>
            )
          ) : (
            incomingRequests.length > 0 ? (
              <div className="space-y-3">
                <p className="text-xs font-medium" style={{ color: colors.textSecondary }}>
                  Входящие заявки ({incomingRequests.length})
                </p>
                {incomingRequests.map((req) => (
                  <div 
                    key={req.id} 
                    className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: `${colors.surface}60` }}
                  >
                    <div className="relative">
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center text-lg overflow-hidden" 
                        style={{ background: `${colors.accent}20` }}
                      >
                        {req.from.avatar && (req.from.avatar.startsWith("http") || req.from.avatar.startsWith("data:")) ? (
                          <img src={req.from.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-sm font-bold" style={{ color: colors.textSecondary }}>
                            {req.from.display_name?.[0]?.toUpperCase() || "?"}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate" style={{ color: colors.textPrimary }}>{req.from.display_name}</p>
                      <p className="text-xs truncate" style={{ color: colors.textSecondary }}>@{req.from.username}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAcceptRequest(req.id)}
                        className="p-2 rounded-lg transition-all hover:scale-105"
                        style={{ background: colors.accent, color: "var(--interactive-accent-text)" }}
                        title="Принять"
                      >
                        <HiOutlineCheck className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleRejectRequest(req.id, req.from.id)}
                        className="p-2 rounded-lg transition-all hover:scale-105"
                        style={{ background: "rgba(239, 68, 68, 0.2)", color: "#EF4444" }}
                        title="Отклонить"
                      >
                        <HiOutlineXMark className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <HiOutlineClock className="w-12 h-12 mx-auto mb-3 opacity-30" style={{ color: colors.textSecondary }} />
                <p style={{ color: colors.textSecondary }}>Нет заявок</p>
                <p className="text-xs mt-1" style={{ color: colors.textSecondary, opacity: 0.6 }}>Когда кто-то отправит заявку, она появится здесь</p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
