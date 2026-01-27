import { useState, useEffect } from "react";
import { HiOutlineShoppingBag,
  HiOutlineArchiveBox,
  HiOutlineCheck,
  HiOutlineXMark,
  HiOutlineMusicalNote,
  HiOutlineClock,
  HiOutlineHeart,
  HiOutlinePencilSquare,
  HiOutlineMagnifyingGlass,
  HiOutlineMoon,
  HiOutlineAdjustmentsHorizontal,
  HiOutlineMicrophone,
  HiOutlineSquares2X2,
  HiOutlineStar,
  HiOutlineFire,
  HiOutlineBolt,
  HiOutlineSparkles,
  HiOutlineChartBar,
  HiOutlineUsers,
  HiOutlinePlay,
  HiOutlineShieldCheck,
} from "react-icons/hi2";
import {
  IoRocket,
  IoGift,
  IoHeadset,
  IoInfinite,
  IoLogoDiscord,
  IoLogoYoutube,
} from "react-icons/io5";
import { FaTelegram, FaTiktok } from "react-icons/fa";
import { useUserStore } from "../../stores/userStore";
import { useThemeStore } from "../../stores/themeStore";
import { usePlayerSettingsStore } from "../../stores/playerSettingsStore";
import { newsService } from "../../services/NewsService";
import { shopService } from "../../services/ShopService";
import { likedTracksService } from "../../services/LikedTracksService";
import { ShopView } from "./ShopView";
import { InventoryView } from "./InventoryView";
import { ProfileSettings } from "./ProfileSettings";
import { MoniIcon, MoniDisplay } from "../common/MoniIcon";
import { cloudSyncService } from "../../services/CloudSyncService";
import { FriendsModal } from "../friends/FriendsModal";
import { useProfilePinsStore } from "../../stores/profilePinsStore";
import { UsernamePopover } from "./UsernamePopover";
import type { ShopItem, TitleItem, FrameItem } from "../../types/shop";
import type { Track } from "../../types";

// Icon map for titles
const titleIcons: Record<string, React.ReactNode> = {
  HiOutlineMusicalNote: <HiOutlineMusicalNote className="w-3 h-3" />,
  HiOutlineHeadphones: <IoHeadset className="w-3 h-3" />,
  HiOutlineHeart: <HiOutlineHeart className="w-3 h-3" />,
  HiOutlineMagnifyingGlass: <HiOutlineMagnifyingGlass className="w-3 h-3" />,
  HiOutlineMoon: <HiOutlineMoon className="w-3 h-3" />,
  HiOutlineAdjustmentsHorizontal: (
    <HiOutlineAdjustmentsHorizontal className="w-3 h-3" />
  ),
  HiOutlineMicrophone: <HiOutlineMicrophone className="w-3 h-3" />,
  HiOutlineSquares2X2: <HiOutlineSquares2X2 className="w-3 h-3" />,
  HiOutlineStar: <HiOutlineStar className="w-3 h-3" />,
  HiOutlineCrown: <HiOutlineStar className="w-3 h-3" />,
  HiOutlineSparkles: <HiOutlineSparkles className="w-3 h-3" />,
  HiOutlineTrophy: <HiOutlineStar className="w-3 h-3" />,
  HiOutlineFire: <HiOutlineFire className="w-3 h-3" />,
  HiOutlineBolt: <HiOutlineBolt className="w-3 h-3" />,
  HiOutlineInfinity: <IoInfinite className="w-3 h-3" />,
};

type ProfileTab = "inventory";
type ModalType = "settings" | "style" | "status" | "stats" | "friends" | "pins" | "shop" | null;

interface CloudUser {
  uid: string;
  visibleId: number;
  username: string;
  displayName: string;
  avatar: string;
  status?: string;
  statusMessage?: string;
  stats?: { tracksPlayed: number; hoursListened: number; friends: number };
  friends?: string[];
  friendRequests?: { incoming: string[]; outgoing: string[] };
}

// Status options
const statusOptions = [
  { id: "online" as const, label: "В сети", color: "#22c55e" },
  { id: "dnd" as const, label: "Не беспокоить", color: "#ef4444" },
  { id: "offline" as const, label: "Невидимка", color: "#6b7280" },
];

export function ProfileView() {
  const [activeTab, setActiveTab] = useState<ProfileTab | null>(null);
  const [modal, setModal] = useState<ModalType>(null);
  const [editingStatus, setEditingStatus] = useState(false);
  const [statusInput, setStatusInput] = useState("");
  const [latestNews, setLatestNews] = useState<any>(null);
  const [styleTab, setStyleTab] = useState<
    "banner" | "frame" | "title" | "background"
  >("banner");
  const [topArtists, setTopArtists] = useState<
    { name: string; count: number; artwork: string | null }[]
  >([]);
  const [friends, setFriends] = useState<CloudUser[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<CloudUser[]>([]);
  const [statsCategory, setStatsCategory] = useState<"overview" | "artists" | "time" | "activity">("overview");

  const {
    user,
    coins,
    ownedItems,
    updateProfile,
    addCoins,
    refreshFromAccount,
    equippedItems,
    equipItem,
    updateBanner,
  } = useUserStore();
  const { currentTheme } = useThemeStore();
  const colors = currentTheme.colors;
  const { setIsModalOpen } = usePlayerSettingsStore();

  // Hide mini-player when modal is open
  useEffect(() => {
    setIsModalOpen(modal !== null);
    return () => setIsModalOpen(false);
  }, [modal, setIsModalOpen]);

  useEffect(() => {
    refreshFromAccount();
    // Refresh stats from DB
    useUserStore.getState().refreshStatsFromDB();
    // Calculate top artists from liked tracks
    const liked = likedTracksService.getLikedTracks();
    const artistMap = new Map<
      string,
      { count: number; artwork: string | null }
    >();
    liked.forEach((track: Track) => {
      const artist = track.artist || "Unknown";
      const existing = artistMap.get(artist);
      if (existing) {
        existing.count++;
        if (!existing.artwork && track.artworkUrl)
          existing.artwork = track.artworkUrl;
      } else {
        artistMap.set(artist, { count: 1, artwork: track.artworkUrl || null });
      }
    });
    const sorted = Array.from(artistMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    setTopArtists(sorted);
    loadFriendsData();
  }, []);

  const loadFriendsData = async () => {
    if (!user?.uid || user.isGuest) return;
    try {
      const data = await cloudSyncService.fetchUsers();
      if (!data) return;
      const currentUser = data.users.find((u: CloudUser) => u.uid === user.uid);
      if (!currentUser) return;
      const friendsList = data.users.filter((u: CloudUser) => (currentUser.friends || []).includes(u.uid));
      setFriends(friendsList);
      const incoming = data.users.filter((u: CloudUser) => (currentUser.friendRequests?.incoming || []).includes(u.uid));
      setIncomingRequests(incoming);
    } catch (error) {
      console.error("Error loading friends:", error);
    }
  };

  useEffect(() => {
    const news = newsService.getAllNews();
    if (news.length > 0) {
      const unread = news.find((n) => !user?.readNews?.includes(n.id));
      setLatestNews(unread || news[0]);
    }
  }, [user?.readNews]);

  if (!user) return null;

  const equippedBanner = shopService.getItemById(equippedItems.banner);
  const equippedFrame = shopService.getItemById(equippedItems.frame);
  const equippedTitle = shopService.getItemById(equippedItems.title);
  const equippedBackground = shopService.getItemById(equippedItems.background);

  // Get owned items by category
  const getOwnedByCategory = (category: string): ShopItem[] => {
    return shopService
      .getItemsByCategory(category)
      .filter((item) => ownedItems.includes(item.id));
  };

  const handleEquipItem = (
    slot: "banner" | "frame" | "title" | "background",
    item: ShopItem
  ) => {
    // Toggle: if already equipped, unequip it
    if (equippedItems[slot] === item.id) {
      if (slot === "banner") {
        // Reset to transparent background
        updateBanner('transparent', 'gradient');
      }
      equipItem(slot, '');
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { message: 'Стиль снят!', type: 'success' }
      }));
      return;
    }

    // Equip new item
    if (slot === "banner") {
      const bannerItem = item as any;
      const bannerType =
        bannerItem.type === "image"
          ? "image"
          : bannerItem.type === "animated"
          ? "animated"
          : "gradient";
      updateBanner(item.preview, bannerType);
    }
    equipItem(slot, item.id);
  };

  const getBannerStyle = () => {
    // First check for custom user banner (from settings)
    if (user.banner && user.bannerType === 'image') {
      const displayMode = user.bannerDisplayMode || 'cover';
      
      if (
        user.banner.startsWith("data:") ||
        user.banner.startsWith("/") ||
        user.banner.startsWith("./") ||
        user.banner.startsWith("http")
      ) {
        // Map display modes to CSS properties
        const modeStyles: Record<string, React.CSSProperties> = {
          cover: {
            backgroundImage: `url(${user.banner})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          },
          fill: {
            backgroundImage: `url(${user.banner})`,
            backgroundSize: "100% 100%",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          },
        };
        
        return modeStyles[displayMode] || modeStyles.cover;
      }
      return { background: user.banner };
    }
    
    // Then check for equipped shop banner
    if (equippedBanner?.preview) {
      if (
        equippedBanner.preview.startsWith("/") ||
        equippedBanner.preview.startsWith("./") ||
        equippedBanner.preview.startsWith("http")
      ) {
        return {
          backgroundImage: `url(${equippedBanner.preview})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        };
      }
      return { background: equippedBanner.preview };
    }
    
    // Default: transparent background
    return { background: "transparent" };
  };

  const getBackgroundStyle = (): React.CSSProperties => {
    // First check for custom mini profile background (Premium feature)
    if (user.miniProfileBg && user.miniProfileBgType === 'image') {
      return {
        backgroundImage: `url(${user.miniProfileBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      };
    }
    
    // If background is explicitly empty or default, use default canvas
    if (!equippedItems.background || equippedItems.background === '' || equippedItems.background === 'bg_default') {
      return { background: "var(--surface-canvas)" };
    }
    if (equippedBackground?.preview) {
      const isImage = equippedBackground.preview.startsWith('/') || 
                      equippedBackground.preview.startsWith('./') || 
                      equippedBackground.preview.startsWith('http');
      if (isImage) {
        return {
          backgroundImage: `url(${equippedBackground.preview})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        };
      }
      return { background: equippedBackground.preview };
    }
    return { background: "var(--surface-canvas)" };
  };

  const getFrameStyle = () => {
    // If frame is explicitly empty, use default style
    if (!equippedItems.frame || equippedItems.frame === '') {
      return { borderColor: "rgba(255,255,255,0.1)" };
    }
    if (equippedFrame) {
      const frame = equippedFrame as any;
      return {
        borderColor: frame.borderColor || "rgba(255,255,255,0.2)",
        boxShadow: frame.glowColor
          ? `0 0 25px ${frame.glowColor}50`
          : undefined,
      };
    }
    return { borderColor: "rgba(255,255,255,0.1)" };
  };

  const handleStatusSave = () => {
    updateProfile({ statusMessage: statusInput });
    setEditingStatus(false);
  };

  const handleClaimReward = () => {
    if (latestNews?.reward && !user.readNews?.includes(latestNews.id)) {
      // Монеты за новости отключены - выдаются только админом
      // addCoins(latestNews.reward.amount);
      updateProfile({ readNews: [...(user.readNews || []), latestNews.id] });
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { message: 'Новость прочитана', type: 'info' }
      }));
    }
  };

  const [showInventory, setShowInventory] = useState(false);

  return (
    <div
      className="h-full overflow-y-auto scrollbar-hide pb-32 relative"
      style={getBackgroundStyle()}
    >
      {/* Banner Card - with rounded corners and margin */}
      <div className="px-4 pt-2 relative z-10">
        <div
          className="relative h-60 rounded-2xl"
          style={getBannerStyle()}
        >
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent pointer-events-none rounded-2xl" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none rounded-2xl" />
        </div>
        
        {/* Edit Profile button - outside banner for better clickability */}
        <button
          onClick={() => setModal("settings")}
          className="absolute bottom-3 right-7 z-40 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:bg-white/30 hover:scale-105 cursor-pointer"
          style={{
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(8px)",
            color: "rgba(255,255,255,0.9)",
          }}
        >
          <HiOutlinePencilSquare className="w-3.5 h-3.5" />
          Изменить
        </button>
      </div>

      {/* Profile Content */}
      <div className="relative px-6 pb-6 mt-1 z-10">
        {/* User Info Container with blur */}
        <div 
          className="p-3 rounded-2xl"
          style={{ 
            background: "rgba(255,255,255,0.08)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.15)",
          }}
        >
          {/* Main row: Avatar+Name on left, Pinned on right */}
          <div className="flex items-start gap-4">
            {/* Left side: Avatar + Name/Username */}
            <div className="flex-shrink-0">
              {/* Avatar */}
              <div className="relative w-24 h-24">
                <div
                  className="w-24 h-24 rounded-full overflow-hidden border-4"
                  style={{
                    ...getFrameStyle(),
                    borderStyle: "solid",
                    background: "#0a0a0a",
                  }}
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center text-3xl font-bold"
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        color: "rgba(255,255,255,0.4)",
                      }}
                    >
                      {user.displayName[0]?.toUpperCase() || "?"}
                    </div>
                  )}
                </div>
                {equippedFrame?.animated && (
                  <div
                    className="absolute inset-0 rounded-full animate-pulse-slow pointer-events-none"
                    style={{
                      boxShadow: `0 0 20px ${
                        (equippedFrame as any).glowColor || "#fff"
                      }40`,
                    }}
                  />
                )}

                {/* Status indicator - clickable, attached to avatar corner */}
                <button
                  onClick={() => setModal("status")}
                  className="absolute bottom-1 right-1 w-5 h-5 rounded-full border-[3px] transition-all hover:scale-110"
                  style={{
                    background:
                      statusOptions.find((s) => s.id === user.status)?.color ||
                      "#22c55e",
                    borderColor: "#0a0a0a",
                  }}
                  title={statusOptions.find((s) => s.id === user.status)?.label}
                />
              </div>
              
              {/* Name & Username under avatar */}
              <div className="mt-2 max-w-[200px]">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* Premium Badge - left of name */}
                  {user.isPremium && (
                    <svg 
                      viewBox="0 0 24 24" 
                      className="w-5 h-5"
                      fill="#FFD700"
                      style={{ 
                        filter: 'drop-shadow(0 0 4px rgba(255, 215, 0, 0.5))'
                      }}
                    >
                      <title>Premium</title>
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                    </svg>
                  )}
                  <h2
                    className="text-2xl font-bold"
                    style={{ 
                      color: "#fff",
                      textShadow: "0 1px 3px rgba(0,0,0,0.5)"
                    }}
                  >
                    {user.displayName}
                  </h2>
                  {/* Image title after name */}
                  {equippedTitle &&
                    (equippedTitle as any).isImageTitle &&
                    (equippedTitle as any).image && (
                      <img
                        src={(equippedTitle as any).image}
                        alt={equippedTitle.name}
                        className="h-6 object-contain"
                      />
                    )}
                  {/* Icon-based title after name */}
                  {equippedTitle && !(equippedTitle as any).isImageTitle && (
                    <span
                      className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold"
                      style={{
                        background: `${(equippedTitle as TitleItem).color}20`,
                        color: (equippedTitle as TitleItem).color,
                      }}
                    >
                      {
                        titleIcons[
                          (equippedTitle as TitleItem).icon || "HiOutlineMusicalNote"
                        ]
                      }
                      {equippedTitle.name}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  <UsernamePopover>
                    <p
                      className="text-sm font-medium cursor-pointer hover:underline"
                      style={{ 
                        color: "rgba(255,255,255,0.7)",
                        textShadow: "0 1px 2px rgba(0,0,0,0.4)"
                      }}
                    >
                      @{user.username}
                    </p>
                  </UsernamePopover>
                  {user.visibleId && (
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded"
                      style={{
                        background: "rgba(0,0,0,0.3)",
                        color: "#fff",
                        border: "1px solid rgba(255,255,255,0.2)",
                      }}
                    >
                      ID: {user.visibleId}
                    </span>
                  )}
                </div>
                
                {/* Status under username */}
                <div className="mt-1.5 h-7 relative">
                  {editingStatus ? (
                    <div className="absolute left-0 top-0 flex items-center gap-1 z-10">
                      <input
                        type="text"
                        value={statusInput}
                        onChange={(e) => setStatusInput(e.target.value)}
                        placeholder="Статус..."
                        maxLength={50}
                        className="px-2 py-1 rounded text-xs focus:outline-none"
                        style={{
                          background: "rgba(0,0,0,0.5)",
                          color: "#fff",
                          border: "1px solid rgba(255,255,255,0.3)",
                          width: "120px",
                        }}
                        autoFocus
                      />
                      <button
                        onClick={handleStatusSave}
                        className="p-1 rounded hover:bg-white/10 text-green-400"
                        title="Сохранить"
                      >
                        <HiOutlineCheck className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => setEditingStatus(false)}
                        className="p-1 rounded hover:bg-white/10 text-red-400"
                        title="Отмена"
                      >
                        <HiOutlineXMark className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setStatusInput(user.statusMessage || "");
                          setEditingStatus(true);
                        }}
                        className="flex items-center gap-1 text-xs px-2 py-1 rounded transition-all hover:bg-white/10"
                        style={{
                          background: user.statusMessage ? "rgba(0,0,0,0.2)" : "transparent",
                          color: user.statusMessage ? "#fff" : "rgba(255,255,255,0.5)",
                          textShadow: "0 1px 2px rgba(0,0,0,0.4)",
                        }}
                      >
                        <span className="truncate max-w-[100px]">{user.statusMessage || "Статус..."}</span>
                        <HiOutlinePencilSquare className="w-3 h-3 flex-shrink-0" />
                      </button>
                      {user.statusMessage && (
                        <button
                          onClick={() => updateProfile({ statusMessage: "" })}
                          className="p-1 rounded hover:bg-white/10 transition-all"
                          style={{ color: "rgba(255,255,255,0.4)" }}
                          title="Сбросить"
                        >
                          <HiOutlineXMark className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Right side: Pinned tracks with blur */}
            <PinnedContentInline onEditClick={() => setModal("pins")} />
          </div>
          
          {/* Friends & Stats row inside blur container */}
          <div className="flex items-center gap-3 mt-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
            {/* Friends button */}
            <button
              onClick={() => setModal("friends")}
              className="flex-1 flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all hover:bg-white/10"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div className="relative">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "var(--interactive-accent)" }}>
                  <HiOutlineUsers className="w-5 h-5" style={{ color: "var(--interactive-accent-text)" }} />
                </div>
                {incomingRequests.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center" style={{ background: "#EF4444", color: "#fff" }}>
                    {incomingRequests.length}
                  </span>
                )}
              </div>
              <div className="flex-1 text-left min-w-0">
                <span className="text-sm font-bold" style={{ color: "#fff" }}>Друзья</span>
                <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.6)" }}>
                  {friends.length > 0 ? `${friends.length} друзей` : "Найти"}
                </p>
              </div>
            </button>
            
            {/* Stats button */}
            <button
              onClick={() => setModal("stats")}
              className="flex-1 flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all hover:bg-white/10"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "var(--interactive-accent)" }}>
                <HiOutlineChartBar className="w-5 h-5" style={{ color: "var(--interactive-accent-text)" }} />
              </div>
              <div className="flex-1 text-left min-w-0">
                <span className="text-sm font-bold" style={{ color: "#fff" }}>Статистика</span>
                <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.6)" }}>
                  {user.stats.tracksPlayed} треков
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Quick Actions - Shop/Inventory */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          {/* Shop Button - opens modal */}
          <button
            onClick={() => setModal("shop")}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl transition-all hover:scale-[1.02]"
            style={{
              background: "rgba(255,255,255,0.08)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.15)",
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "var(--interactive-accent)" }}
            >
              <HiOutlineShoppingBag className="w-5 h-5" style={{ color: 'var(--interactive-accent-text)' }} />
            </div>
            <span className="font-bold text-sm" style={{ color: "#fff" }}>
              Магазин
            </span>
            <MoniDisplay amount={coins} size="sm" />
          </button>

          {/* Inventory Button - opens modal */}
          <button
            onClick={() => setShowInventory(true)}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl transition-all hover:scale-[1.02]"
            style={{
              background: "rgba(255,255,255,0.08)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.15)",
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "var(--interactive-accent)" }}
            >
              <HiOutlineArchiveBox className="w-5 h-5" style={{ color: 'var(--interactive-accent-text)' }} />
            </div>
            <span className="font-bold text-sm" style={{ color: "#fff" }}>
              Инвентарь
            </span>
          </button>
        </div>

        {/* Socials Row */}
        {user.socials && Object.values(user.socials).some(Boolean) && (
          <div
            className="flex items-center flex-wrap gap-2 mt-4 pt-4"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
          >
              {user.socials.telegram && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(user.socials!.telegram!);
                    window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Telegram скопирован!', type: 'success' } }));
                  }}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-white/10 transition-all"
                  style={{ background: "rgba(0, 136, 204, 0.1)" }}
                >
                  <FaTelegram className="w-3.5 h-3.5" style={{ color: "#0088cc" }} />
                  <span className="text-xs" style={{ color: "#0088cc" }}>@{user.socials.telegram}</span>
                </button>
              )}
              {user.socials.discord && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(user.socials!.discord!);
                    window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Discord скопирован!', type: 'success' } }));
                  }}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-white/10 transition-all"
                  style={{ background: "rgba(88, 101, 242, 0.1)" }}
                >
                  <IoLogoDiscord className="w-3.5 h-3.5" style={{ color: "#5865F2" }} />
                  <span className="text-xs" style={{ color: "#5865F2" }}>{user.socials.discord}</span>
                </button>
              )}
              {user.socials.youtube && (
                <a
                  href={user.socials.youtube.startsWith('http') ? user.socials.youtube : `https://youtube.com/@${user.socials.youtube}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-white/10 transition-all"
                  style={{ background: "rgba(255, 0, 0, 0.1)" }}
                >
                  <IoLogoYoutube className="w-3.5 h-3.5" style={{ color: "#FF0000" }} />
                  <span className="text-xs" style={{ color: "#FF0000" }}>{user.socials.youtube}</span>
                </a>
              )}
              {user.socials.tiktok && (
                <a
                  href={`https://tiktok.com/@${user.socials.tiktok.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-white/10 transition-all"
                  style={{ background: "rgba(255,255,255,0.05)" }}
                >
                  <FaTiktok className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.7)" }} />
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>@{user.socials.tiktok}</span>
                </a>
              )}
          </div>
        )}
      </div>

      {/* News Card */}
      {latestNews &&
        !user.readNews?.includes(latestNews.id) &&
        latestNews.reward && (
          <div
            className="mx-6 mt-4 p-4 rounded-xl relative z-10"
            style={{
              background: "rgba(34, 197, 94, 0.08)",
              border: "1px solid rgba(34, 197, 94, 0.15)",
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(34, 197, 94, 0.15)" }}
              >
                {latestNews.type === "update" ? (
                  <IoRocket className="w-5 h-5 text-green-400" />
                ) : (
                  <IoGift className="w-5 h-5 text-green-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4
                  className="font-medium text-sm"
                  style={{ color: "rgba(255,255,255,0.9)" }}
                >
                  {latestNews.title}
                </h4>
                <p
                  className="text-xs truncate"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  {latestNews.content}
                </p>
              </div>
              <button
                onClick={handleClaimReward}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-90"
                style={{
                  background: "rgba(34, 197, 94, 0.2)",
                  color: "#22c55e",
                }}
              >
                <MoniIcon className="w-4 h-4" />+{latestNews.reward.amount}
              </button>
            </div>
          </div>
        )}

      {/* OLD Style Button - COMMENTED OUT (moved to blur container)
      <div className="px-6 relative z-10">
        <button
          onClick={() => setModal("style")}
          className="w-full mt-4 p-4 rounded-2xl transition-all hover:scale-[1.01] flex items-center gap-3"
          style={{
            background: "rgba(255,255,255,0.08)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.15)",
          }}
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: "var(--interactive-accent)" }}
          >
            <HiOutlinePaintBrush
              className="w-6 h-6"
              style={{ color: "var(--interactive-accent-text)" }}
            />
          </div>
          <div className="flex-1 text-left">
            <span
              className="font-bold text-base"
              style={{ color: "#fff" }}
            >
              Стиль
            </span>
            <p
              className="text-sm mt-0.5"
              style={{ color: "rgba(255,255,255,0.6)" }}
            >
              {[equippedBanner?.name, equippedFrame?.name, equippedTitle?.name]
                .filter(Boolean)
                .join(" • ") || "Настрой свой профиль"}
            </p>
          </div>
          <div className="flex -space-x-1">
            {equippedBanner && (
              <div
                className="w-6 h-4 rounded border border-black/50 overflow-hidden"
                style={{
                  background:
                    equippedBanner.preview.startsWith("/") ||
                    equippedBanner.preview.startsWith("./")
                      ? undefined
                      : equippedBanner.preview,
                }}
              >
                {(equippedBanner.preview.startsWith("/") ||
                  equippedBanner.preview.startsWith("./")) && (
                  <img
                    src={equippedBanner.preview}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            )}
            {equippedFrame && (
              <div
                className="w-5 h-5 rounded-full border border-black/50"
                style={{
                  border: `2px solid ${
                    (equippedFrame as FrameItem).borderColor
                  }`,
                  background: "#0a0a0a",
                }}
              />
            )}
          </div>
        </button>

        <button
          onClick={() => setModal("stats")}
          className="w-full mt-3 p-4 rounded-2xl transition-all hover:scale-[1.01] flex items-center gap-3"
          style={{
            background: "rgba(255,255,255,0.08)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.15)",
          }}
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: "var(--interactive-accent)" }}
          >
            <HiOutlineChartBar className="w-6 h-6" style={{ color: 'var(--interactive-accent-text)' }} />
          </div>
          <div className="flex-1 text-left">
            <span className="font-bold text-base" style={{ color: "#fff" }}>
              Статистика
            </span>
            <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.6)" }}>
              {user.stats.tracksPlayed.toLocaleString()} треков • {user.stats.hoursListened.toFixed(0)}ч прослушано
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-lg font-bold" style={{ color: colors.accent }}>{user.stats.likedTracks}</p>
              <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.5)" }}>лайков</p>
            </div>
          </div>
        </button>
      </div>
      END OLD Style/Stats buttons */}

      {/* Settings Modal */}
      {modal === "settings" && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          onClick={() => setModal(null)}
        >
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-md max-h-[80vh] rounded-2xl overflow-hidden"
            style={{
              background: "#0a0a0a",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-center justify-between p-4 border-b"
              style={{ borderColor: "rgba(255,255,255,0.06)" }}
            >
              <h3
                className="text-lg font-semibold"
                style={{ color: "rgba(255,255,255,0.9)" }}
              >
                Настройки
              </h3>
              <button
                onClick={() => setModal(null)}
                className="p-2 rounded-lg hover:bg-white/5"
              >
                <HiOutlineXMark
                  className="w-5 h-5"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(80vh-60px)] p-4">
              <ProfileSettings />
              
              {/* Любимые треки в профиле */}
              <div className="mt-4 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <HiOutlineHeart className="w-4 h-4" style={{ color: colors.accent }} />
                    <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>Любимые треки в профиле</span>
                  </div>
                  <button
                    onClick={() => setModal("pins")}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105"
                    style={{ background: `${colors.accent}20`, color: colors.accent }}
                  >
                    Изменить
                  </button>
                </div>
                <p className="text-xs mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Выберите треки которые будут отображаться в вашем профиле
                </p>
                <PinnedTracksPreview />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Style Modal */}
      {modal === "style" && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          onClick={() => setModal(null)}
        >
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-md rounded-2xl overflow-hidden"
            style={{
              background: "#0a0a0a",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-center justify-between p-4 border-b"
              style={{ borderColor: "rgba(255,255,255,0.06)" }}
            >
              <h3
                className="text-lg font-semibold"
                style={{ color: "rgba(255,255,255,0.9)" }}
              >
                Стиль
              </h3>
              <button
                onClick={() => setModal(null)}
                className="p-2 rounded-lg hover:bg-white/5"
              >
                <HiOutlineXMark
                  className="w-5 h-5"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                />
              </button>
            </div>

            {/* Style Tabs */}
            <div
              className="flex border-b"
              style={{ borderColor: "rgba(255,255,255,0.06)" }}
            >
              {[
                { id: "banner" as const, label: "Баннер" },
                { id: "frame" as const, label: "Рамка" },
                { id: "title" as const, label: "Титул" },
                { id: "background" as const, label: "Фон" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStyleTab(tab.id)}
                  className="flex-1 py-3 text-xs font-medium transition-all"
                  style={{
                    color:
                      styleTab === tab.id
                        ? "rgba(255,255,255,0.9)"
                        : "rgba(255,255,255,0.4)",
                    borderBottom:
                      styleTab === tab.id
                        ? "2px solid rgba(255,255,255,0.5)"
                        : "2px solid transparent",
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Style Items */}
            <div className="p-4 max-h-80 overflow-y-auto scrollbar-hide">
              {getOwnedByCategory(styleTab + "s").length === 0 ? (
                <div className="text-center py-8">
                  <p
                    className="text-sm"
                    style={{ color: "rgba(255,255,255,0.4)" }}
                  >
                    Пусто
                  </p>
                  <p
                    className="text-xs mt-1"
                    style={{ color: "rgba(255,255,255,0.25)" }}
                  >
                    Загляни в магазин
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {getOwnedByCategory(styleTab + "s").map((item) => {
                    const isEquipped = equippedItems[styleTab] === item.id;
                    const isImageBanner =
                      styleTab === "banner" &&
                      (item.preview.startsWith("/") ||
                        item.preview.startsWith("./"));

                    return (
                      <button
                        key={item.id}
                        onClick={() => handleEquipItem(styleTab, item)}
                        className={`relative p-2 rounded-xl transition-all hover:bg-white/5 ${
                          isEquipped ? "ring-1 ring-green-500/50" : ""
                        }`}
                        style={{
                          background: "rgba(255,255,255,0.02)",
                          border: "1px solid rgba(255,255,255,0.06)",
                        }}
                      >
                        {/* Preview */}
                        {styleTab === "banner" ? (
                          <div
                            className="h-12 rounded-lg mb-2 overflow-hidden"
                            style={{
                              background: isImageBanner
                                ? undefined
                                : item.preview,
                            }}
                          >
                            {isImageBanner && (
                              <img
                                src={item.preview}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                        ) : styleTab === "background" ? (
                          <div
                            className="h-12 rounded-lg mb-2"
                            style={{ background: item.preview }}
                          />
                        ) : styleTab === "frame" ? (
                          <div className="h-12 flex items-center justify-center mb-2">
                            <div
                              className="w-10 h-10 rounded-full"
                              style={{
                                border: `3px solid ${
                                  (item as FrameItem).borderColor
                                }`,
                                background: "rgba(255,255,255,0.03)",
                              }}
                            />
                          </div>
                        ) : (
                          <div className="h-12 flex items-center justify-center mb-2">
                            {(item as any).isImageTitle &&
                            (item as any).image ? (
                              <img
                                src={(item as any).image}
                                alt={item.name}
                                className="h-8 object-contain"
                              />
                            ) : (
                              <div
                                className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold"
                                style={{
                                  background: `${(item as TitleItem).color}20`,
                                  color: (item as TitleItem).color,
                                }}
                              >
                                {
                                  titleIcons[
                                    (item as TitleItem).icon ||
                                      "HiOutlineMusicalNote"
                                  ]
                                }
                              </div>
                            )}
                          </div>
                        )}

                        <p
                          className="text-[10px] font-medium truncate"
                          style={{
                            color: isEquipped
                              ? "#22c55e"
                              : "rgba(255,255,255,0.7)",
                          }}
                        >
                          {item.name}
                        </p>

                        {isEquipped && (
                          <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                            <HiOutlineCheck className="w-2.5 h-2.5 text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Status Modal */}
      {modal === "status" && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          onClick={() => setModal(null)}
        >
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-xs rounded-2xl overflow-hidden"
            style={{
              background: "#0a0a0a",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-center justify-between p-4 border-b"
              style={{ borderColor: "rgba(255,255,255,0.06)" }}
            >
              <h3
                className="text-base font-semibold"
                style={{ color: "rgba(255,255,255,0.9)" }}
              >
                Статус
              </h3>
              <button
                onClick={() => setModal(null)}
                className="p-1.5 rounded-lg hover:bg-white/5"
              >
                <HiOutlineXMark
                  className="w-4 h-4"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                />
              </button>
            </div>
            <div className="p-3 space-y-1">
              {statusOptions.map((status) => (
                <button
                  key={status.id}
                  onClick={() => {
                    updateProfile({ status: status.id });
                    setModal(null);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-white/5"
                  style={{
                    background:
                      user.status === status.id
                        ? "rgba(255,255,255,0.05)"
                        : "transparent",
                    border:
                      user.status === status.id
                        ? "1px solid rgba(255,255,255,0.1)"
                        : "1px solid transparent",
                  }}
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ background: status.color }}
                  />
                  <span
                    className="text-sm"
                    style={{
                      color:
                        user.status === status.id
                          ? "rgba(255,255,255,0.9)"
                          : "rgba(255,255,255,0.6)",
                    }}
                  >
                    {status.label}
                  </span>
                  {user.status === status.id && (
                    <HiOutlineCheck className="w-4 h-4 ml-auto text-green-400" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Stats Modal with Categories */}
      {modal === "stats" && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          onClick={() => setModal(null)}
        >
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-lg max-h-[85vh] rounded-2xl overflow-hidden"
            style={{ background: colors.surface, border: `1px solid ${colors.textSecondary}15` }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4" style={{ borderBottom: `1px solid ${colors.textSecondary}10` }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--interactive-accent)" }}>
                  <HiOutlineChartBar className="w-5 h-5" style={{ color: colors.surface }} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>Статистика</h3>
                  <p className="text-xs" style={{ color: colors.textSecondary }}>{user.stats.tracksPlayed.toLocaleString()} треков прослушано</p>
                </div>
              </div>
              <button onClick={() => setModal(null)} className="p-2 rounded-lg hover:opacity-70">
                <HiOutlineXMark className="w-5 h-5" style={{ color: colors.textSecondary }} />
              </button>
            </div>

            {/* Category Tabs */}
            <div className="flex p-2 gap-1" style={{ background: `${colors.textSecondary}05` }}>
              {[
                { id: "overview" as const, label: "Обзор", icon: HiOutlineSquares2X2 },
                { id: "artists" as const, label: "Артисты", icon: HiOutlineMicrophone },
                { id: "time" as const, label: "Время", icon: HiOutlineClock },
                { id: "activity" as const, label: "Активность", icon: HiOutlineFire },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setStatsCategory(t.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition-all"
                  style={{ 
                    background: statsCategory === t.id ? colors.accent : "transparent", 
                    color: statsCategory === t.id ? colors.surface : colors.textSecondary 
                  }}
                >
                  <t.icon className="w-4 h-4" />
                  <span className="text-xs font-medium">{t.label}</span>
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="p-4 max-h-[calc(85vh-180px)] overflow-y-auto scrollbar-hide">
              {/* Overview Category */}
              {statsCategory === "overview" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-xl" style={{ background: `color-mix(in srgb, ${colors.accent} 10%, transparent)`, border: `1px solid color-mix(in srgb, ${colors.accent} 20%, transparent)` }}>
                      <div className="flex items-center gap-2 mb-2">
                        <HiOutlinePlay className="w-5 h-5" style={{ color: colors.accent }} />
                        <span className="text-xs font-medium" style={{ color: colors.textSecondary }}>Треков</span>
                      </div>
                      <p className="text-3xl font-bold" style={{ color: colors.textPrimary }}>{user.stats.tracksPlayed.toLocaleString()}</p>
                    </div>
                    <div className="p-4 rounded-xl" style={{ background: `color-mix(in srgb, ${colors.accent} 10%, transparent)`, border: `1px solid color-mix(in srgb, ${colors.accent} 20%, transparent)` }}>
                      <div className="flex items-center gap-2 mb-2">
                        <HiOutlineClock className="w-5 h-5" style={{ color: colors.accent }} />
                        <span className="text-xs font-medium" style={{ color: colors.textSecondary }}>Часов</span>
                      </div>
                      <p className="text-3xl font-bold" style={{ color: colors.textPrimary }}>{user.stats.hoursListened.toFixed(1)}</p>
                    </div>
                    <div className="p-4 rounded-xl" style={{ background: `color-mix(in srgb, ${colors.accent} 10%, transparent)`, border: `1px solid color-mix(in srgb, ${colors.accent} 20%, transparent)` }}>
                      <div className="flex items-center gap-2 mb-2">
                        <HiOutlineHeart className="w-5 h-5" style={{ color: colors.accent }} />
                        <span className="text-xs font-medium" style={{ color: colors.textSecondary }}>Лайков</span>
                      </div>
                      <p className="text-3xl font-bold" style={{ color: colors.textPrimary }}>{user.stats.likedTracks.toLocaleString()}</p>
                    </div>
                    <div className="p-4 rounded-xl" style={{ background: `color-mix(in srgb, ${colors.accent} 10%, transparent)`, border: `1px solid color-mix(in srgb, ${colors.accent} 20%, transparent)` }}>
                      <div className="flex items-center gap-2 mb-2">
                        <HiOutlineUsers className="w-5 h-5" style={{ color: colors.accent }} />
                        <span className="text-xs font-medium" style={{ color: colors.textSecondary }}>Друзей</span>
                      </div>
                      <p className="text-3xl font-bold" style={{ color: colors.textPrimary }}>{friends.length}</p>
                    </div>
                  </div>
                  {/* Quick Summary */}
                  <div className="p-4 rounded-xl" style={{ background: `${colors.textSecondary}05`, border: `1px solid ${colors.textSecondary}10` }}>
                    <div className="flex items-center gap-2 mb-3">
                      <HiOutlineSparkles className="w-4 h-4" style={{ color: colors.accent }} />
                      <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>Краткая сводка</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <p className="text-lg font-bold" style={{ color: colors.accent }}>{topArtists.length}</p>
                        <p className="text-[10px]" style={{ color: colors.textSecondary }}>артистов</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold" style={{ color: colors.accent }}>{Math.floor(user.stats.hoursListened * 60)}</p>
                        <p className="text-[10px]" style={{ color: colors.textSecondary }}>минут</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold" style={{ color: colors.accent }}>{user.stats.likedTracks}</p>
                        <p className="text-[10px]" style={{ color: colors.textSecondary }}>лайков</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Artists Category */}
              {statsCategory === "artists" && (
                <div className="space-y-3">
                  {topArtists.length > 0 ? (
                    <>
                      <p className="text-xs" style={{ color: colors.textSecondary }}>Топ {topArtists.length} артистов по лайкам</p>
                      {topArtists.map((artist, i) => (
                        <div key={artist.name} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: `${colors.textSecondary}08`, border: `1px solid ${colors.textSecondary}10` }}>
                          <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm" style={{ background: i === 0 ? "#fbbf24" : i === 1 ? "#94a3b8" : i === 2 ? "#cd7f32" : `${colors.textSecondary}20`, color: i < 3 ? "#000" : colors.textSecondary }}>
                            {i + 1}
                          </div>
                          <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0" style={{ background: `${colors.textSecondary}10` }}>
                            {artist.artwork ? <img src={artist.artwork} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><HiOutlineMusicalNote className="w-5 h-5" style={{ color: colors.textSecondary }} /></div>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate" style={{ color: colors.textPrimary }}>{artist.name}</p>
                            <p className="text-xs" style={{ color: colors.textSecondary }}>{artist.count} треков</p>
                          </div>
                          <div className="flex-shrink-0 w-20">
                            <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: `${colors.textSecondary}15` }}>
                              <div className="h-full rounded-full" style={{ width: `${(artist.count / topArtists[0].count) * 100}%`, background: colors.accent }} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <HiOutlineMicrophone className="w-16 h-16 mx-auto mb-4" style={{ color: `${colors.textSecondary}30` }} />
                      <p className="text-sm" style={{ color: colors.textSecondary }}>Лайкни треки чтобы увидеть любимых артистов</p>
                    </div>
                  )}
                </div>
              )}

              {/* Time Category */}
              {statsCategory === "time" && (
                <div className="space-y-4">
                  {/* Time Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-xl text-center" style={{ background: `${colors.textSecondary}08`, border: `1px solid ${colors.textSecondary}10` }}>
                      <HiOutlineClock className="w-6 h-6 mx-auto mb-2" style={{ color: colors.accent }} />
                      <p className="text-2xl font-bold" style={{ color: colors.textPrimary }}>{user.stats.hoursListened.toFixed(1)}</p>
                      <p className="text-[10px]" style={{ color: colors.textSecondary }}>часов всего</p>
                    </div>
                    <div className="p-4 rounded-xl text-center" style={{ background: `${colors.textSecondary}08`, border: `1px solid ${colors.textSecondary}10` }}>
                      <HiOutlineMusicalNote className="w-6 h-6 mx-auto mb-2" style={{ color: colors.accent }} />
                      <p className="text-2xl font-bold" style={{ color: colors.textPrimary }}>{user.stats.tracksPlayed > 0 ? ((user.stats.hoursListened * 60) / user.stats.tracksPlayed).toFixed(1) : 0}</p>
                      <p className="text-[10px]" style={{ color: colors.textSecondary }}>мин/трек</p>
                    </div>
                  </div>
                  {/* Time Breakdown */}
                  <div className="p-4 rounded-xl" style={{ background: `${colors.textSecondary}05`, border: `1px solid ${colors.textSecondary}10` }}>
                    <div className="flex items-center gap-2 mb-4">
                      <HiOutlineChartBar className="w-4 h-4" style={{ color: colors.accent }} />
                      <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>Разбивка времени</span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs" style={{ color: colors.textSecondary }}>Минут прослушано</span>
                        <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>{Math.floor(user.stats.hoursListened * 60).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs" style={{ color: colors.textSecondary }}>Дней прослушивания</span>
                        <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>{(user.stats.hoursListened / 24).toFixed(1)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs" style={{ color: colors.textSecondary }}>Недель прослушивания</span>
                        <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>{(user.stats.hoursListened / 168).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  {/* Fun Fact */}
                  <div className="p-3 rounded-xl flex items-center gap-3" style={{ background: `color-mix(in srgb, ${colors.accent} 8%, transparent)`, border: `1px solid color-mix(in srgb, ${colors.accent} 15%, transparent)` }}>
                    <HiOutlineBolt className="w-5 h-5 flex-shrink-0" style={{ color: colors.accent }} />
                    <p className="text-xs" style={{ color: colors.textSecondary }}>
                      Это как {Math.floor(user.stats.hoursListened / 2)} фильма или {Math.floor(user.stats.hoursListened / 8)} рабочих дней!
                    </p>
                  </div>
                </div>
              )}

              {/* Activity Category */}
              {statsCategory === "activity" && (
                <div className="space-y-4">
                  {/* Activity Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-xl text-center" style={{ background: `${colors.textSecondary}08`, border: `1px solid ${colors.textSecondary}10` }}>
                      <HiOutlineClock className="w-6 h-6 mx-auto mb-2" style={{ color: colors.accent }} />
                      <p className="text-2xl font-bold" style={{ color: colors.textPrimary }}>{Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))}</p>
                      <p className="text-[10px]" style={{ color: colors.textSecondary }}>дней с нами</p>
                    </div>
                    <div className="p-4 rounded-xl text-center" style={{ background: `${colors.textSecondary}08`, border: `1px solid ${colors.textSecondary}10` }}>
                      <HiOutlineHeart className="w-6 h-6 mx-auto mb-2" style={{ color: colors.accent }} />
                      <p className="text-2xl font-bold" style={{ color: colors.textPrimary }}>{user.stats.likedTracks}</p>
                      <p className="text-[10px]" style={{ color: colors.textSecondary }}>лайков</p>
                    </div>
                  </div>
                  {/* Activity Details */}
                  <div className="p-4 rounded-xl" style={{ background: `${colors.textSecondary}05`, border: `1px solid ${colors.textSecondary}10` }}>
                    <div className="flex items-center gap-2 mb-4">
                      <HiOutlineFire className="w-4 h-4" style={{ color: colors.accent }} />
                      <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>Детали активности</span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs" style={{ color: colors.textSecondary }}>Дата регистрации</span>
                        <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>{new Date(user.createdAt).toLocaleDateString("ru-RU")}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs" style={{ color: colors.textSecondary }}>Треков в день (в среднем)</span>
                        <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                          {Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)) > 0 
                            ? (user.stats.tracksPlayed / Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))).toFixed(1) 
                            : user.stats.tracksPlayed}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs" style={{ color: colors.textSecondary }}>Минут в день (в среднем)</span>
                        <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                          {Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)) > 0 
                            ? ((user.stats.hoursListened * 60) / Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))).toFixed(1) 
                            : (user.stats.hoursListened * 60).toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Friends Modal - New Component */}
      <FriendsModal 
        isOpen={modal === "friends"} 
        onClose={() => setModal(null)} 
      />

      {/* Shop Modal */}
      {modal === "shop" && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setModal(null)}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div 
            className="relative z-10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setModal(null)}
              className="absolute -top-3 -right-3 z-20 w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110"
              style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)' }}
            >
              <HiOutlineXMark className="w-4 h-4 text-white" />
            </button>
            <ShopView />
          </div>
        </div>
      )}

      {/* Pins Modal */}
      {modal === "pins" && <PinsModal colors={colors} onClose={() => setModal(null)} />}

      {/* Inventory Modal */}
      <InventoryView isOpen={showInventory} onClose={() => setShowInventory(false)} />
    </div>
  );
}

// Pins Modal Component
function PinsModal({ colors, onClose }: { colors: any; onClose: () => void }) {
  const { pinnedTracks, pinTrack, unpinTrack, maxPinnedTracks } = useProfilePinsStore();
  const [likedTracks, setLikedTracks] = useState<Track[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setLikedTracks(likedTracksService.getLikedTracks());
  }, []);

  const filteredTracks = likedTracks.filter(
    (track) =>
      track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePinTrack = (track: Track) => {
    const success = pinTrack({
      trackId: track.id,
      title: track.title,
      artist: track.artist,
      artworkUrl: track.artworkUrl,
      platform: 'soundcloud',
    });
    if (!success) {
      window.dispatchEvent(
        new CustomEvent("show-toast", {
          detail: { message: `Максимум ${maxPinnedTracks} треков`, type: "error" },
        })
      );
    }
  };

  const isPinned = (trackId: string) => pinnedTracks.some((t) => t.trackId === trackId);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md max-h-[80vh] rounded-2xl overflow-hidden flex flex-col"
        style={{
          background: colors.surface,
          border: `1px solid ${colors.textSecondary}15`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-4 border-b"
          style={{ borderColor: `${colors.textSecondary}10` }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: `${colors.accent}20` }}
            >
              <HiOutlineSparkles className="w-5 h-5" style={{ color: colors.accent }} />
            </div>
            <div>
              <h3 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>
                Избранное в профиле
              </h3>
              <p className="text-xs" style={{ color: colors.textSecondary }}>
                {pinnedTracks.length}/{maxPinnedTracks} треков
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/5"
          >
            <HiOutlineXMark className="w-5 h-5" style={{ color: colors.textSecondary }} />
          </button>
        </div>

        {/* Pinned tracks */}
        {pinnedTracks.length > 0 && (
          <div className="p-4 border-b" style={{ borderColor: `${colors.textSecondary}10` }}>
            <p className="text-xs font-medium mb-2" style={{ color: colors.textSecondary }}>
              Прикреплённые треки
            </p>
            <div className="space-y-2">
              {pinnedTracks.map((track) => (
                <div
                  key={track.trackId}
                  className="flex items-center gap-3 p-2 rounded-xl"
                  style={{ background: `${colors.accent}10` }}
                >
                  <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                    {track.artworkUrl ? (
                      <img src={track.artworkUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center"
                        style={{ background: "var(--interactive-accent)" }}
                      >
                        <HiOutlineMusicalNote className="text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: colors.textPrimary }}>
                      {track.title}
                    </p>
                    <p className="text-xs truncate" style={{ color: colors.textSecondary }}>
                      {track.artist}
                    </p>
                  </div>
                  <button
                    onClick={() => unpinTrack(track.trackId)}
                    className="p-2 rounded-lg hover:bg-red-500/20 transition-colors"
                  >
                    <HiOutlineXMark className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search */}
        <div className="p-4 border-b" style={{ borderColor: `${colors.textSecondary}10` }}>
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: `${colors.textSecondary}10` }}
          >
            <HiOutlineMagnifyingGlass className="w-4 h-4" style={{ color: colors.textSecondary }} />
            <input
              type="text"
              placeholder="Поиск в избранном..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: colors.textPrimary }}
            />
          </div>
        </div>

        {/* Liked tracks list */}
        <div className="flex-1 overflow-y-auto p-4">
          <p className="text-xs font-medium mb-3" style={{ color: colors.textSecondary }}>
            Выберите из избранного ({likedTracks.length})
          </p>
          {filteredTracks.length === 0 ? (
            <div className="text-center py-8">
              <HiOutlineHeart className="w-12 h-12 mx-auto mb-3" style={{ color: colors.textSecondary }} />
              <p className="text-sm" style={{ color: colors.textSecondary }}>
                {likedTracks.length === 0 ? "Нет избранных треков" : "Ничего не найдено"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTracks.slice(0, 50).map((track) => {
                const pinned = isPinned(track.id);
                return (
                  <div
                    key={track.id}
                    className="flex items-center gap-3 p-2 rounded-xl transition-all hover:bg-white/5"
                    style={{ background: pinned ? `${colors.accent}10` : "transparent" }}
                  >
                    <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                      {track.artworkUrl ? (
                        <img src={track.artworkUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center"
                          style={{ background: "var(--interactive-accent)" }}
                        >
                          <HiOutlineMusicalNote className="text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: colors.textPrimary }}>
                        {track.title}
                      </p>
                      <p className="text-xs truncate" style={{ color: colors.textSecondary }}>
                        {track.artist}
                      </p>
                    </div>
                    <button
                      onClick={() => (pinned ? unpinTrack(track.id) : handlePinTrack(track))}
                      className="p-2 rounded-lg transition-all"
                      style={{
                        background: pinned ? colors.accent : `${colors.textSecondary}15`,
                        color: pinned ? "var(--interactive-accent-text)" : colors.textSecondary,
                      }}
                    >
                      {pinned ? (
                        <HiOutlineCheck className="w-4 h-4" />
                      ) : (
                        <HiOutlineSparkles className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Inline Pinned Content - растянуто на всю ширину как на фото
interface PinnedContentInlineProps {
  onEditClick: () => void;
}

function PinnedContentInline({ onEditClick }: PinnedContentInlineProps) {
  const { pinnedTracks } = useProfilePinsStore();
  const { currentTheme } = useThemeStore();
  const { colors } = currentTheme;
  const [playingId, setPlayingId] = useState<string | null>(null);

  const handlePlayTrack = async (track: typeof pinnedTracks[0], e: React.MouseEvent) => {
    e.stopPropagation();
    setPlayingId(track.trackId);
    try {
      const { streamFallbackService } = await import('../../services/StreamFallbackService');
      const { audioService } = await import('../../services/AudioService');
      
      const trackData = {
        id: track.trackId,
        title: track.title,
        artist: track.artist,
        artworkUrl: track.artworkUrl,
        duration: 0,
        streamUrl: "",
        platform: 'soundcloud' as const,
        metadata: {},
      };
      
      const result = await streamFallbackService.getStreamUrl(trackData);
      if (result.streamUrl) {
        const trackToPlay = result.fallbackTrack || trackData;
        audioService.load({ ...trackToPlay, streamUrl: result.streamUrl });
      } else {
        window.dispatchEvent(
          new CustomEvent("show-toast", {
            detail: { message: "Не удалось загрузить трек", type: "error" },
          })
        );
      }
    } catch (err) {
      console.error('Failed to play track:', err);
      window.dispatchEvent(
        new CustomEvent("show-toast", {
          detail: { message: "Ошибка при загрузке трека", type: "error" },
        })
      );
    }
    setPlayingId(null);
  };

  if (pinnedTracks.length === 0) {
    return (
      <div 
        className="flex-1 min-w-0 p-3 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-white/10 transition-all"
        style={{
          background: "rgba(0,0,0,0.2)",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
        onClick={onEditClick}
      >
        <HiOutlineHeart className="w-6 h-6 mb-1" style={{ color: "rgba(255,255,255,0.3)" }} />
        <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Добавить любимые</span>
      </div>
    );
  }

  return (
    <div 
      className="flex-1 min-w-0 p-3 rounded-xl"
      style={{
        background: "rgba(0,0,0,0.25)",
        backdropFilter: "blur(8px)",
        border: "1px solid rgba(255,255,255,0.1)",
      }}
    >
      {/* Label - centered */}
      <div className="flex items-center justify-center gap-1.5 mb-2">
        <HiOutlineSparkles className="w-4 h-4" style={{ color: colors.accent }} />
        <span className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>Любимые</span>
      </div>
      
      {/* Tracks 2x2 grid - bigger */}
      <div className="grid grid-cols-2 gap-2">
        {pinnedTracks.slice(0, 4).map((track) => (
          <div
            key={track.trackId}
            onClick={(e) => handlePlayTrack(track, e)}
            className="group flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer transition-all hover:bg-white/15"
            style={{ 
              background: 'rgba(255,255,255,0.05)',
            }}
          >
            <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
              {track.artworkUrl ? (
                <img src={track.artworkUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ background: "var(--interactive-accent)" }}>
                  <HiOutlineMusicalNote className="text-white text-sm" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                {playingId === track.trackId ? (
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <HiOutlinePlay style={{ color: "var(--interactive-accent-text)", fontSize: "0.875rem" }} />
                )}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate" style={{ color: "#fff" }}>
                {track.title}
              </p>
              <p className="text-[10px] truncate" style={{ color: "rgba(255,255,255,0.6)" }}>
                {track.artist}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Preview of pinned tracks for settings modal
function PinnedTracksPreview() {
  const { pinnedTracks } = useProfilePinsStore();

  if (pinnedTracks.length === 0) {
    return (
      <div className="text-center py-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
        <HiOutlineHeart className="w-8 h-8 mx-auto mb-2" style={{ color: 'rgba(255,255,255,0.2)' }} />
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Нет любимых треков</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {pinnedTracks.slice(0, 4).map((track) => (
        <div
          key={track.trackId}
          className="flex items-center gap-2 p-2 rounded-lg"
          style={{ background: 'rgba(255,255,255,0.03)' }}
        >
          <div className="w-8 h-8 rounded-md overflow-hidden flex-shrink-0">
            {track.artworkUrl ? (
              <img src={track.artworkUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{ background: "var(--interactive-accent)" }}>
                <HiOutlineMusicalNote className="text-white text-xs" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-medium truncate" style={{ color: 'rgba(255,255,255,0.8)' }}>
              {track.title}
            </p>
            <p className="text-[9px] truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {track.artist}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
