import { useState, useEffect } from "react";
import { useUserStore } from "../../stores/userStore";
import { useThemeStore } from "../../stores/themeStore";
import { cloudSyncService } from "../../services/CloudSyncService";

import {
  HiOutlineUserPlus,
  HiOutlineUsers,
  HiOutlineMagnifyingGlass,
  HiOutlineCheck,
  HiOutlineXMark,
  HiOutlineClock,
  HiOutlineUserMinus,
  HiXMark,
  HiOutlineClipboard,
  HiOutlineMusicalNote,
  HiOutlineSparkles,
} from "react-icons/hi2";
import { FaTelegram, FaTiktok, FaDiscord, FaYoutube } from "react-icons/fa";

interface CloudUser {
  uid: string;
  visibleId: number;
  username: string;
  displayName: string;
  avatar: string;
  banner?: string;
  bannerType?: string;
  avatarFrame?: string;
  status?: string;
  statusMessage?: string;
  stats?: {
    tracksPlayed: number;
    hoursListened: number;
    friends: number;
  };
  friends?: string[];
  friendRequests?: {
    incoming: string[];
    outgoing: string[];
  };
  equipped?: {
    banner: string;
    frame: string;
    title: string;
    background: string;
    profileColor: string;
  };
  socials?: {
    telegram?: string;
    discord?: string;
    youtube?: string;
    tiktok?: string;
  };
  favoriteTracks?: Array<{
    id: string;
    title: string;
    artist: string;
    artworkUrl?: string;
  }>;
  createdAt?: string;
  isAdmin?: boolean;
}

type Tab = "friends" | "requests" | "search";

export function FriendsView() {
  const { user, updateProfile } = useUserStore();
  const { currentTheme } = useThemeStore();
  const colors = currentTheme.colors;

  const [activeTab, setActiveTab] = useState<Tab>("friends");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<CloudUser[]>([]);
  const [friends, setFriends] = useState<CloudUser[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<CloudUser[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<CloudUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<CloudUser | null>(null);

  // Загрузка друзей и заявок
  useEffect(() => {
    loadFriendsData();
  }, [user?.uid]);

  const loadFriendsData = async () => {
    if (!user?.uid || user.isGuest) return;
    setIsLoading(true);

    try {
      // Load from Supabase instead of CloudSync
      const { supabaseService } = await import('../../services/SupabaseService');
      const allUsers = await supabaseService.getAllUsers();
      
      if (!allUsers || allUsers.length === 0) {
        // Fallback to CloudSync if Supabase fails
        const data = await cloudSyncService.fetchUsers();
        if (!data) return;

        const currentUser = data.users.find((u) => u.uid === user.uid);
        if (!currentUser) return;

        const friendsList = data.users.filter((u) =>
          (currentUser.friends || []).includes(u.uid)
        );
        setFriends(friendsList);

        const incoming = data.users.filter((u) =>
          (currentUser.friendRequests?.incoming || []).includes(u.uid)
        );
        setIncomingRequests(incoming);

        const outgoing = data.users.filter((u) =>
          (currentUser.friendRequests?.outgoing || []).includes(u.uid)
        );
        setOutgoingRequests(outgoing);
        return;
      }

      // Map Supabase users to CloudUser format
      const mappedUsers = allUsers.map(u => ({
        uid: u.id,
        visibleId: u.visible_id,
        username: u.username,
        displayName: u.display_name,
        avatar: u.avatar || '',
        banner: u.banner,
        bannerType: 'image',
        status: u.status,
        statusMessage: u.status_message,
        stats: u.stats,
        socials: u.socials,
        favoriteTracks: u.pinned_tracks?.map(t => ({
          id: t.trackId,
          title: t.title,
          artist: t.artist,
          artworkUrl: t.artworkUrl,
        })),
        createdAt: u.created_at,
        isAdmin: u.is_admin,
      }));

      // For now, use CloudSync for friends relationships
      // TODO: Implement friends in Supabase
      const data = await cloudSyncService.fetchUsers();
      if (!data) {
        setFriends(mappedUsers as any);
        return;
      }

      const currentUser = data.users.find((u) => u.uid === user.uid);
      if (!currentUser) {
        setFriends(mappedUsers as any);
        return;
      }

      const friendsList = mappedUsers.filter((u) =>
        (currentUser.friends || []).includes(u.uid)
      );
      setFriends(friendsList as any);

      const incoming = mappedUsers.filter((u) =>
        (currentUser.friendRequests?.incoming || []).includes(u.uid)
      );
      setIncomingRequests(incoming as any);

      const outgoing = mappedUsers.filter((u) =>
        (currentUser.friendRequests?.outgoing || []).includes(u.uid)
      );
      setOutgoingRequests(outgoing as any);
    } catch (error) {
      console.error("Ошибка загрузки друзей:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || !user?.uid) return;
    setIsSearching(true);

    try {
      // Load from Supabase
      const { supabaseService } = await import('../../services/SupabaseService');
      const allUsers = await supabaseService.getAllUsers();
      
      if (!allUsers || allUsers.length === 0) {
        // Fallback to CloudSync
        const data = await cloudSyncService.fetchUsers();
        if (!data) return;

        const query = searchQuery.toLowerCase().trim();
        const results = data.users.filter((u) => {
          if (u.uid === user.uid) return false;
          const matchUsername = u.username.toLowerCase().includes(query);
          const matchId = u.visibleId?.toString() === query;
          const matchDisplay = u.displayName.toLowerCase().includes(query);
          return matchUsername || matchId || matchDisplay;
        });

        setSearchResults(results.slice(0, 10));
        return;
      }

      // Map and filter Supabase users
      const query = searchQuery.toLowerCase().trim();
      const mappedUsers = allUsers
        .filter(u => {
          if (u.id === user.uid) return false;
          const matchUsername = u.username.toLowerCase().includes(query);
          const matchId = u.visible_id?.toString() === query;
          const matchDisplay = u.display_name.toLowerCase().includes(query);
          return matchUsername || matchId || matchDisplay;
        })
        .map(u => ({
          uid: u.id,
          visibleId: u.visible_id,
          username: u.username,
          displayName: u.display_name,
          avatar: u.avatar || '',
          banner: u.banner,
          bannerType: 'image',
          status: u.status,
          statusMessage: u.status_message,
          stats: u.stats,
          socials: u.socials,
          favoriteTracks: u.pinned_tracks?.map(t => ({
            id: t.trackId,
            title: t.title,
            artist: t.artist,
            artworkUrl: t.artworkUrl,
          })),
          createdAt: u.created_at,
          isAdmin: u.is_admin,
        }));

      setSearchResults(mappedUsers.slice(0, 10) as any);
    } catch (error) {
      console.error("Ошибка поиска:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const sendFriendRequest = async (targetUid: string) => {
    if (!user?.uid) return;

    try {
      const data = await cloudSyncService.fetchUsers();
      if (!data) return;

      const currentUserIndex = data.users.findIndex((u) => u.uid === user.uid);
      const targetUserIndex = data.users.findIndex((u) => u.uid === targetUid);

      if (currentUserIndex === -1 || targetUserIndex === -1) return;

      if (!data.users[currentUserIndex].friendRequests) {
        data.users[currentUserIndex].friendRequests = {
          incoming: [],
          outgoing: [],
        };
      }
      if (!data.users[targetUserIndex].friendRequests) {
        data.users[targetUserIndex].friendRequests = {
          incoming: [],
          outgoing: [],
        };
      }

      if (
        !data.users[currentUserIndex].friendRequests!.outgoing.includes(
          targetUid
        )
      ) {
        data.users[currentUserIndex].friendRequests!.outgoing.push(targetUid);
      }
      if (
        !data.users[targetUserIndex].friendRequests!.incoming.includes(user.uid)
      ) {
        data.users[targetUserIndex].friendRequests!.incoming.push(user.uid);
      }

      data.updatedAt = new Date().toISOString();
      await cloudSyncService.saveUsers(data);
      loadFriendsData();

      window.dispatchEvent(
        new CustomEvent("show-toast", {
          detail: { message: "Заявка отправлена!", type: "success" },
        })
      );
    } catch (error) {
      console.error("Ошибка отправки заявки:", error);
    }
  };

  const acceptFriendRequest = async (fromUid: string) => {
    if (!user?.uid) return;

    try {
      const data = await cloudSyncService.fetchUsers();
      if (!data) return;

      const currentUserIndex = data.users.findIndex((u) => u.uid === user.uid);
      const fromUserIndex = data.users.findIndex((u) => u.uid === fromUid);

      if (currentUserIndex === -1 || fromUserIndex === -1) return;

      if (!data.users[currentUserIndex].friends)
        data.users[currentUserIndex].friends = [];
      if (!data.users[fromUserIndex].friends)
        data.users[fromUserIndex].friends = [];

      if (!data.users[currentUserIndex].friends.includes(fromUid)) {
        data.users[currentUserIndex].friends.push(fromUid);
      }
      if (!data.users[fromUserIndex].friends.includes(user.uid)) {
        data.users[fromUserIndex].friends.push(user.uid);
      }

      if (data.users[currentUserIndex].friendRequests) {
        data.users[currentUserIndex].friendRequests.incoming = data.users[
          currentUserIndex
        ].friendRequests.incoming.filter((id: string) => id !== fromUid);
      }
      if (data.users[fromUserIndex].friendRequests) {
        data.users[fromUserIndex].friendRequests.outgoing = data.users[
          fromUserIndex
        ].friendRequests.outgoing.filter((id: string) => id !== user.uid);
      }

      data.updatedAt = new Date().toISOString();
      await cloudSyncService.saveUsers(data);

      updateProfile({ friends: [...(user.friends || []), fromUid] });
      loadFriendsData();

      window.dispatchEvent(
        new CustomEvent("show-toast", {
          detail: { message: "Друг добавлен!", type: "success" },
        })
      );
    } catch (error) {
      console.error("Ошибка принятия заявки:", error);
    }
  };

  const rejectFriendRequest = async (fromUid: string) => {
    if (!user?.uid) return;

    try {
      const data = await cloudSyncService.fetchUsers();
      if (!data) return;

      const currentUserIndex = data.users.findIndex((u) => u.uid === user.uid);
      const fromUserIndex = data.users.findIndex((u) => u.uid === fromUid);

      if (currentUserIndex === -1) return;

      if (data.users[currentUserIndex].friendRequests) {
        data.users[currentUserIndex].friendRequests.incoming = data.users[
          currentUserIndex
        ].friendRequests.incoming.filter((id: string) => id !== fromUid);
      }
      if (fromUserIndex !== -1 && data.users[fromUserIndex].friendRequests) {
        data.users[fromUserIndex].friendRequests.outgoing = data.users[
          fromUserIndex
        ].friendRequests.outgoing.filter((id: string) => id !== user.uid);
      }

      data.updatedAt = new Date().toISOString();
      await cloudSyncService.saveUsers(data);
      loadFriendsData();
    } catch (error) {
      console.error("Ошибка отклонения заявки:", error);
    }
  };

  const removeFriend = async (friendUid: string) => {
    if (!user?.uid) return;

    try {
      const data = await cloudSyncService.fetchUsers();
      if (!data) return;

      const currentUserIndex = data.users.findIndex((u) => u.uid === user.uid);
      const friendUserIndex = data.users.findIndex((u) => u.uid === friendUid);

      if (currentUserIndex === -1) return;

      data.users[currentUserIndex].friends = (
        data.users[currentUserIndex].friends || []
      ).filter((id: string) => id !== friendUid);

      if (friendUserIndex !== -1) {
        data.users[friendUserIndex].friends = (
          data.users[friendUserIndex].friends || []
        ).filter((id: string) => id !== user.uid);
      }

      data.updatedAt = new Date().toISOString();
      await cloudSyncService.saveUsers(data);

      updateProfile({
        friends: (user.friends || []).filter((id: string) => id !== friendUid),
      });
      loadFriendsData();
      setSelectedUser(null);

      window.dispatchEvent(
        new CustomEvent("show-toast", {
          detail: { message: "Друг удалён", type: "info" },
        })
      );
    } catch (error) {
      console.error("Ошибка удаления друга:", error);
    }
  };

  const getFriendStatus = (
    targetUid: string
  ): "friend" | "pending" | "incoming" | "none" => {
    if (friends.some((f) => f.uid === targetUid)) return "friend";
    if (outgoingRequests.some((r) => r.uid === targetUid)) return "pending";
    if (incomingRequests.some((r) => r.uid === targetUid)) return "incoming";
    return "none";
  };

  if (user?.isGuest) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <HiOutlineUsers
            size={48}
            style={{ color: colors.textSecondary }}
            className="mx-auto mb-4 opacity-50"
          />
          <p style={{ color: colors.textSecondary }}>
            Войдите в аккаунт чтобы добавлять друзей
          </p>
        </div>
      </div>
    );
  }

  const cardBg =
    currentTheme.mode === "light"
      ? "rgba(0,0,0,0.03)"
      : "rgba(255,255,255,0.03)";
  const borderColor =
    currentTheme.mode === "light"
      ? "rgba(0,0,0,0.08)"
      : "rgba(255,255,255,0.08)";

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1
            className="text-2xl font-bold"
            style={{ color: colors.textPrimary }}
          >
            Друзья
          </h1>
          <div
            className="flex items-center gap-2 text-sm"
            style={{ color: colors.textSecondary }}
          >
            <HiOutlineUsers size={18} />
            <span>{friends.length}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            {
              id: "friends" as Tab,
              label: "Друзья",
              icon: HiOutlineUsers,
              count: friends.length,
            },
            {
              id: "requests" as Tab,
              label: "Заявки",
              icon: HiOutlineClock,
              count: incomingRequests.length,
            },
            {
              id: "search" as Tab,
              label: "Поиск",
              icon: HiOutlineMagnifyingGlass,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all"
              style={{
                background: activeTab === tab.id ? colors.accent : cardBg,
                color: activeTab === tab.id ? "var(--interactive-accent-text)" : colors.textSecondary,
                fontWeight: activeTab === tab.id ? 600 : 400,
              }}
            >
              <tab.icon size={18} />
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className="px-1.5 py-0.5 rounded-full text-xs"
                  style={{
                    background:
                      activeTab === tab.id ? "rgba(0,0,0,0.2)" : `${colors.accent}20`,
                    color: activeTab === tab.id ? "var(--interactive-accent-text)" : colors.textPrimary,
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search Tab */}
        {activeTab === "search" && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Поиск по username или ID..."
                className="flex-1 px-4 py-3 rounded-xl focus:outline-none"
                style={{
                  background: cardBg,
                  border: `1px solid ${borderColor}`,
                  color: colors.textPrimary,
                }}
              />
              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="px-6 py-3 rounded-xl font-medium transition-all hover:opacity-90"
                style={{ background: colors.accent, color: "var(--interactive-accent-text)" }}
              >
                {isSearching ? "..." : "Найти"}
              </button>
            </div>

            <div className="space-y-2">
              {searchResults.map((u) => (
                <UserCard
                  key={u.uid}
                  user={u}
                  status={getFriendStatus(u.uid)}
                  onAdd={() => sendFriendRequest(u.uid)}
                  onAccept={() => acceptFriendRequest(u.uid)}
                  onClick={() => setSelectedUser(u)}
                  colors={colors}
                  cardBg={cardBg}
                  borderColor={borderColor}
                />
              ))}
              {searchResults.length === 0 && searchQuery && !isSearching && (
                <p
                  className="text-center py-8"
                  style={{ color: colors.textSecondary }}
                >
                  Никого не найдено
                </p>
              )}
            </div>
          </div>
        )}

        {/* Friends Tab */}
        {activeTab === "friends" && (
          <div className="space-y-2">
            {isLoading ? (
              <p
                className="text-center py-8"
                style={{ color: colors.textSecondary }}
              >
                Загрузка...
              </p>
            ) : friends.length === 0 ? (
              <p
                className="text-center py-8"
                style={{ color: colors.textSecondary }}
              >
                У вас пока нет друзей
              </p>
            ) : (
              friends.map((friend) => (
                <UserCard
                  key={friend.uid}
                  user={friend}
                  status="friend"
                  onRemove={() => removeFriend(friend.uid)}
                  onClick={() => setSelectedUser(friend)}
                  colors={colors}
                  cardBg={cardBg}
                  borderColor={borderColor}
                />
              ))
            )}
          </div>
        )}

        {/* Requests Tab */}
        {activeTab === "requests" && (
          <div className="space-y-4">
            {incomingRequests.length > 0 && (
              <div>
                <h3
                  className="text-sm font-medium mb-2"
                  style={{ color: colors.textSecondary }}
                >
                  Входящие заявки
                </h3>
                <div className="space-y-2">
                  {incomingRequests.map((req) => (
                    <UserCard
                      key={req.uid}
                      user={req}
                      status="incoming"
                      onAccept={() => acceptFriendRequest(req.uid)}
                      onReject={() => rejectFriendRequest(req.uid)}
                      onClick={() => setSelectedUser(req)}
                      colors={colors}
                      cardBg={cardBg}
                      borderColor={borderColor}
                    />
                  ))}
                </div>
              </div>
            )}

            {outgoingRequests.length > 0 && (
              <div>
                <h3
                  className="text-sm font-medium mb-2"
                  style={{ color: colors.textSecondary }}
                >
                  Исходящие заявки
                </h3>
                <div className="space-y-2">
                  {outgoingRequests.map((req) => (
                    <UserCard
                      key={req.uid}
                      user={req}
                      status="pending"
                      onClick={() => setSelectedUser(req)}
                      colors={colors}
                      cardBg={cardBg}
                      borderColor={borderColor}
                    />
                  ))}
                </div>
              </div>
            )}

            {incomingRequests.length === 0 && outgoingRequests.length === 0 && (
              <p
                className="text-center py-8"
                style={{ color: colors.textSecondary }}
              >
                Нет заявок
              </p>
            )}
          </div>
        )}
      </div>

      {/* Mini Profile Modal */}
      {selectedUser && (
        <MiniProfile
          user={selectedUser}
          status={getFriendStatus(selectedUser.uid)}
          onClose={() => setSelectedUser(null)}
          onAdd={() => sendFriendRequest(selectedUser.uid)}
          onAccept={() => acceptFriendRequest(selectedUser.uid)}
          onRemove={() => removeFriend(selectedUser.uid)}
          colors={colors}
        />
      )}
    </div>
  );
}

function MiniProfile({
  user,
  status,
  onClose,
  onAdd,
  onAccept,
  onRemove,
  colors,
}: {
  user: CloudUser;
  status: "friend" | "pending" | "incoming" | "none";
  onClose: () => void;
  onAdd: () => void;
  onAccept: () => void;
  onRemove: () => void;
  colors: any;
}) {
  const defaultBanner =
    "linear-gradient(135deg, #8B5CF6 0%, #EC4899 50%, #F97316 100%)";
  
  // Get mini profile background
  const miniProfileBg = (user as any).miniProfileBg || '';
  const miniProfileBgType = (user as any).miniProfileBgType || 'default';
  const isPremium = (user as any).isPremium || false;
  
  const getMiniProfileStyle = () => {
    if (miniProfileBgType === 'image' && miniProfileBg) {
      return {
        backgroundImage: `url(${miniProfileBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      };
    } else if (miniProfileBgType === 'gradient' && miniProfileBg) {
      return { background: miniProfileBg };
    }
    return { background: 'var(--surface-card)' };
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-sm rounded-2xl overflow-hidden"
        style={{
          ...getMiniProfileStyle(),
          border: "1px solid var(--border-base)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Overlay for readability if custom bg */}
        {(miniProfileBgType === 'image' || miniProfileBgType === 'gradient') && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
        )}
        
        {/* Banner */}
        <div
          className="h-24 relative"
          style={{
            background: user.banner || defaultBanner,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <button
            onClick={onClose}
            className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center bg-black/30 hover:bg-black/50 transition-colors"
          >
            <HiXMark size={18} color="#fff" />
          </button>
        </div>

        {/* Avatar */}
        <div className="px-4 -mt-10 relative z-10">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-3xl overflow-hidden border-4"
            style={{
              background: "var(--surface-elevated)",
              borderColor: "var(--surface-card)",
            }}
          >
            {user.avatar ? (
              user.avatar.startsWith("http") ? (
                <img
                  src={user.avatar}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                user.avatar
              )
            ) : (
              "👤"
            )}
          </div>
        </div>

        {/* Info */}
        <div className="px-4 pt-2 pb-4 relative z-10">
          <div className="flex items-center gap-2">
            <h3
              className="text-xl font-bold"
              style={{ color: colors.textPrimary }}
            >
              {user.displayName}
            </h3>
            {/* Premium Badge */}
            {isPremium && (
              <div 
                className="flex items-center gap-1 px-2 py-0.5 rounded-lg"
                style={{ 
                  background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                  boxShadow: '0 0 10px rgba(255, 215, 0, 0.3)'
                }}
              >
                <HiOutlineSparkles className="w-3.5 h-3.5" style={{ color: 'var(--interactive-accent-text)' }} />
                <span className="text-[10px] font-bold" style={{ color: 'var(--interactive-accent-text)' }}>PREMIUM</span>
              </div>
            )}
          </div>
          <p className="text-sm" style={{ color: colors.textSecondary }}>
            @{user.username}
          </p>

          <div
            className="inline-block mt-2 px-2 py-1 rounded-md text-xs"
            style={{
              background: "var(--surface-elevated)",
              color: colors.textSecondary,
            }}
          >
            ID: {user.visibleId}
          </div>

          {user.statusMessage && (
            <p className="mt-3 text-sm" style={{ color: colors.textSecondary }}>
              "{user.statusMessage}"
            </p>
          )}

          {/* Stats */}
          <div
            className="flex gap-4 mt-4 pt-4"
            style={{ borderTop: "1px solid var(--border-base)" }}
          >
            <div className="text-center">
              <p
                className="text-lg font-bold"
                style={{ color: colors.textPrimary }}
              >
                {user.stats?.tracksPlayed || 0}
              </p>
              <p className="text-xs" style={{ color: colors.textSecondary }}>
                Треков
              </p>
            </div>
            <div className="text-center">
              <p
                className="text-lg font-bold"
                style={{ color: colors.textPrimary }}
              >
                {Math.round(user.stats?.hoursListened || 0)}ч
              </p>
              <p className="text-xs" style={{ color: colors.textSecondary }}>
                Прослушано
              </p>
            </div>
            <div className="text-center">
              <p
                className="text-lg font-bold"
                style={{ color: colors.textPrimary }}
              >
                {user.friends?.length || 0}
              </p>
              <p className="text-xs" style={{ color: colors.textSecondary }}>
                Друзей
              </p>
            </div>
          </div>

          {/* Social Links */}
          {user.socials && Object.values(user.socials).some(Boolean) && (
            <div className="flex items-center gap-2 mt-4 pt-4" style={{ borderTop: "1px solid var(--border-base)" }}>
              {user.socials.telegram && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(user.socials!.telegram!);
                    window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Telegram скопирован!', type: 'success' } }));
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/10 transition-all"
                  style={{ background: "rgba(0, 136, 204, 0.1)" }}
                >
                  <FaTelegram className="w-4 h-4" style={{ color: "#0088cc" }} />
                  <span className="text-xs" style={{ color: "#0088cc" }}>@{user.socials.telegram}</span>
                  <HiOutlineClipboard className="w-3 h-3" style={{ color: "rgba(255,255,255,0.4)" }} />
                </button>
              )}
              {user.socials.discord && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(user.socials!.discord!);
                    window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Discord скопирован!', type: 'success' } }));
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/10 transition-all"
                  style={{ background: "rgba(88, 101, 242, 0.1)" }}
                >
                  <FaDiscord className="w-4 h-4" style={{ color: "#5865F2" }} />
                  <span className="text-xs" style={{ color: "#5865F2" }}>{user.socials.discord}</span>
                  <HiOutlineClipboard className="w-3 h-3" style={{ color: "rgba(255,255,255,0.4)" }} />
                </button>
              )}
              {user.socials.youtube && (
                <a
                  href={user.socials.youtube.startsWith('http') ? user.socials.youtube : `https://youtube.com/@${user.socials.youtube}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg hover:bg-white/10 transition-all"
                  style={{ background: "rgba(255, 0, 0, 0.1)" }}
                >
                  <FaYoutube className="w-4 h-4" style={{ color: "#FF0000" }} />
                </a>
              )}
              {user.socials.tiktok && (
                <a
                  href={`https://tiktok.com/@${user.socials.tiktok.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg hover:bg-white/10 transition-all"
                  style={{ background: "rgba(255,255,255,0.05)" }}
                >
                  <FaTiktok className="w-4 h-4" style={{ color: "rgba(255,255,255,0.7)" }} />
                </a>
              )}
            </div>
          )}

          {/* Favorite Tracks */}
          {user.favoriteTracks && user.favoriteTracks.length > 0 && (
            <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--border-base)" }}>
              <div className="flex items-center gap-2 mb-2">
                <HiOutlineMusicalNote className="w-4 h-4" style={{ color: colors.textSecondary }} />
                <span className="text-xs font-medium" style={{ color: colors.textSecondary }}>Любимые треки</span>
              </div>
              <div className="space-y-2">
                {user.favoriteTracks.slice(0, 3).map((track, i) => (
                  <div key={track.id || i} className="flex items-center gap-2 p-2 rounded-lg" style={{ background: "rgba(255,255,255,0.03)" }}>
                    <div className="w-8 h-8 rounded overflow-hidden flex-shrink-0" style={{ background: "rgba(255,255,255,0.1)" }}>
                      {track.artworkUrl ? (
                        <img src={track.artworkUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <HiOutlineMusicalNote className="w-4 h-4" style={{ color: colors.textSecondary }} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate" style={{ color: colors.textPrimary }}>{track.title}</p>
                      <p className="text-[10px] truncate" style={{ color: colors.textSecondary }}>{track.artist}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-4">
            {status === "none" && (
              <button
                onClick={onAdd}
                className="w-full py-2.5 rounded-xl font-medium transition-all hover:scale-[1.02]"
                style={{ background: "#8B5CF6", color: "#fff" }}
              >
                Добавить в друзья
              </button>
            )}
            {status === "pending" && (
              <button
                disabled
                className="w-full py-2.5 rounded-xl font-medium"
                style={{
                  background: `${colors.textSecondary}15`,
                  color: colors.textSecondary,
                }}
              >
                Заявка отправлена
              </button>
            )}
            {status === "incoming" && (
              <button
                onClick={onAccept}
                className="w-full py-2.5 rounded-xl font-medium transition-all hover:scale-[1.02]"
                style={{ background: "#22C55E", color: "#fff" }}
              >
                Принять заявку
              </button>
            )}
            {status === "friend" && (
              <button
                onClick={onRemove}
                className="w-full py-2.5 rounded-xl font-medium transition-all hover:bg-red-500/20"
                style={{
                  background: "rgba(239, 68, 68, 0.1)",
                  color: "#EF4444",
                }}
              >
                Удалить из друзей
              </button>
            )}
          </div>

          {user.createdAt && (
            <p
              className="text-center text-xs mt-3"
              style={{ color: colors.textSecondary, opacity: 0.6 }}
            >
              В Harmonix с{" "}
              {new Date(user.createdAt).toLocaleDateString("ru-RU", {
                month: "long",
                year: "numeric",
              })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Карточка пользователя
function UserCard({
  user,
  status,
  onAdd,
  onAccept,
  onReject,
  onRemove,
  onClick,
  colors,
  cardBg,
  borderColor,
}: {
  user: CloudUser;
  status: "friend" | "pending" | "incoming" | "none";
  onAdd?: () => void;
  onAccept?: () => void;
  onReject?: () => void;
  onRemove?: () => void;
  onClick?: () => void;
  colors: any;
  cardBg: string;
  borderColor: string;
}) {
  return (
    <div
      className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:opacity-80 transition-all"
      style={{ background: cardBg, border: `1px solid ${borderColor}` }}
      onClick={onClick}
    >
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center text-xl overflow-hidden"
        style={{ background: "rgba(139, 92, 246, 0.2)" }}
      >
        {user.avatar ? (
          user.avatar.startsWith("http") ? (
            <img
              src={user.avatar}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            user.avatar
          )
        ) : (
          "👤"
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p
          className="font-medium truncate"
          style={{ color: colors.textPrimary }}
        >
          {user.displayName}
        </p>
        <p className="text-sm truncate" style={{ color: colors.textSecondary }}>
          @{user.username} · ID: {user.visibleId}
        </p>
      </div>

      <div
        className="flex items-center gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        {status === "none" && onAdd && (
          <button
            onClick={onAdd}
            className="p-2 rounded-lg transition-all hover:opacity-80"
            style={{ background: colors.accent, color: "var(--interactive-accent-text)" }}
            title="Добавить в друзья"
          >
            <HiOutlineUserPlus size={20} />
          </button>
        )}

        {status === "pending" && (
          <span
            className="text-sm px-3 py-1 rounded-lg"
            style={{
              background: `${colors.textSecondary}15`,
              color: colors.textSecondary,
            }}
          >
            Ожидание
          </span>
        )}

        {status === "incoming" && (
          <>
            <button
              onClick={onAccept}
              className="p-2 rounded-lg transition-all hover:opacity-80"
              style={{ background: "#22C55E", color: "#fff" }}
              title="Принять"
            >
              <HiOutlineCheck size={20} />
            </button>
            <button
              onClick={onReject}
              className="p-2 rounded-lg transition-all hover:opacity-80"
              style={{ background: "#EF4444", color: "#fff" }}
              title="Отклонить"
            >
              <HiOutlineXMark size={20} />
            </button>
          </>
        )}

        {status === "friend" && onRemove && (
          <button
            onClick={onRemove}
            className="p-2 rounded-lg transition-all hover:opacity-80"
            style={{ background: "rgba(239, 68, 68, 0.1)", color: "#EF4444" }}
            title="Удалить из друзей"
          >
            <HiOutlineUserMinus size={20} />
          </button>
        )}
      </div>
    </div>
  );
}
