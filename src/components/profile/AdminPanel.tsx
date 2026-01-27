import { useState, useEffect } from "react";
import {
  HiOutlineShieldCheck,
  HiOutlineUsers,
  HiOutlineCheck,
  HiOutlineMagnifyingGlass,
  HiOutlineXMark,
  HiOutlineChartBar,
  HiOutlineArrowPath,
  HiOutlineCog6Tooth,
  HiOutlineExclamationTriangle,
  HiOutlineTrash,
  HiOutlinePencil,
  HiOutlineGift,
  HiOutlineTrophy,
  HiOutlinePhoto,
  HiOutlineSparkles,
  HiOutlineSquare2Stack,
  HiOutlineBell,
} from "react-icons/hi2";
import { IoMegaphone } from "react-icons/io5";
import { useUserStore } from "../../stores/userStore";
import { useThemeStore } from "../../stores/themeStore";
import { supabaseService, HarmonixUser } from "../../services/SupabaseService";
import { newsService } from "../../services/NewsService";
import { shopService } from "../../services/ShopService";
import { MoniIcon } from "../common/MoniIcon";
import type { NewsItem, ShopItem } from "../../types/shop";

type AdminTab = "stats" | "users" | "news" | "system";
type GiveType = "moni" | "banner" | "frame" | "title" | "background" | "pack";

export function AdminPanel() {
  const [activeTab, setActiveTab] = useState<AdminTab>("stats");
  const [users, setUsers] = useState<HarmonixUser[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Give modal
  const [giveModal, setGiveModal] = useState<HarmonixUser | null>(null);
  const [giveType, setGiveType] = useState<GiveType>("moni");
  const [giveAmount, setGiveAmount] = useState("100");
  const [giveItemId, setGiveItemId] = useState("");
  
  // Premium modal
  const [premiumModal, setPremiumModal] = useState<HarmonixUser | null>(null);
  const [premiumDays, setPremiumDays] = useState("30");
  const [removePremiumModal, setRemovePremiumModal] = useState<HarmonixUser | null>(null);

  // News
  const [allNews, setAllNews] = useState<NewsItem[]>([]);
  const [newsTitle, setNewsTitle] = useState("");
  const [newsContent, setNewsContent] = useState("");
  const [newsType, setNewsType] = useState<"news" | "giveaway">("news");
  const [newsRewardType, setNewsRewardType] = useState<"moni" | "item">("moni");
  const [newsRewardMoni, setNewsRewardMoni] = useState("");
  const [newsRewardItemId, setNewsRewardItemId] = useState("");
  const [newsWinnersCount, setNewsWinnersCount] = useState("1");
  const [newsDuration, setNewsDuration] = useState("24");

  // Stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCoins: 0,
    admins: 0,
    onlineUsers: 0,
    newUsersToday: 0,
    newUsersWeek: 0,
  });

  // System
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("Приложение на обслуживании");

  const { user } = useUserStore();
  const { currentTheme } = useThemeStore();
  const { colors } = currentTheme;

  useEffect(() => {
    loadData();
    loadNews();
    loadMaintenanceStatus();
  }, []);

  const loadMaintenanceStatus = async () => {
    const settings = await supabaseService.getAppSettings();
    if (settings) {
      setMaintenanceMode(settings.maintenance_mode);
      setMaintenanceMessage(settings.maintenance_message || "Приложение на обслуживании");
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [usersData, statsData] = await Promise.all([
        supabaseService.getAllUsersFull(),
        supabaseService.getStats(),
      ]);
      setUsers(usersData);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      setStats({
        ...statsData,
        newUsersToday: usersData.filter(u => new Date(u.created_at) >= today).length,
        newUsersWeek: usersData.filter(u => new Date(u.created_at) >= weekAgo).length,
      });
    } catch (err) {
      console.error('[AdminPanel] Load error:', err);
    }
    setIsLoading(false);
  };

  const loadNews = () => setAllNews(newsService.getAllNews());

  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleAdmin = async (targetUser: HarmonixUser) => {
    const success = await supabaseService.setAdmin(targetUser.id, !targetUser.is_admin);
    if (success) {
      loadData();
      window.dispatchEvent(new CustomEvent("show-toast", { detail: { message: targetUser.is_admin ? "Админ снят" : "Админ назначен", type: "success" } }));
    }
  };

  const handleGiveReward = async () => {
    if (!giveModal) return;
    if (giveType === "moni") {
      const amount = parseInt(giveAmount);
      if (isNaN(amount) || amount <= 0) return;
      const success = await supabaseService.addCoins(giveModal.id, amount);
      if (success) {
        window.dispatchEvent(new CustomEvent("show-toast", { detail: { message: `Выдано ${amount} Moni`, type: "success" } }));
      }
    } else {
      if (!giveItemId) return;
      // Добавляем предмет в инвентарь через БД
      const category = giveType === "pack" ? "packs" : giveType + "s";
      const success = await supabaseService.addToInventory(giveModal.id, giveItemId, category);
      if (success) {
        window.dispatchEvent(new CustomEvent("show-toast", { detail: { message: `Предмет выдан`, type: "success" } }));
      } else {
        window.dispatchEvent(new CustomEvent("show-toast", { detail: { message: `Ошибка или уже есть`, type: "error" } }));
      }
    }
    loadData();
    setGiveModal(null);
    setGiveAmount("100");
    setGiveItemId("");
    setGiveType("moni");
  };

  const handleGivePremium = async () => {
    if (!premiumModal) return;
    const days = parseInt(premiumDays);
    if (isNaN(days) || days <= 0) return;
    
    const success = await supabaseService.setPremium(premiumModal.id, days);
    if (success) {
      window.dispatchEvent(new CustomEvent("show-toast", { 
        detail: { message: `Premium выдан на ${days} дней`, type: "success" } 
      }));
      loadData();
    } else {
      window.dispatchEvent(new CustomEvent("show-toast", { 
        detail: { message: `Ошибка выдачи premium`, type: "error" } 
      }));
    }
    setPremiumModal(null);
    setPremiumDays("30");
  };

  const handleRemovePremium = async () => {
    if (!removePremiumModal) return;
    const success = await supabaseService.removePremium(removePremiumModal.id);
    if (success) {
      window.dispatchEvent(new CustomEvent("show-toast", { 
        detail: { message: "Premium удален", type: "success" } 
      }));
      loadData();
    }
    setRemovePremiumModal(null);
  };

  const handleDeleteUser = async (targetUser: HarmonixUser) => {
    if (targetUser.id === user?.uid) return;
    if (!confirm(`Удалить пользователя ${targetUser.username}?`)) return;
    const success = await supabaseService.deleteUser(targetUser.id);
    if (success) {
      loadData();
      window.dispatchEvent(new CustomEvent("show-toast", { detail: { message: "Пользователь удален", type: "success" } }));
    }
  };

  const toggleMaintenanceMode = async () => {
    const newValue = !maintenanceMode;
    const success = await supabaseService.setMaintenanceMode(newValue, maintenanceMessage);
    if (success) {
      setMaintenanceMode(newValue);
      window.dispatchEvent(new CustomEvent("show-toast", { 
        detail: { message: newValue ? "Режим обслуживания включен" : "Режим обслуживания выключен", type: newValue ? "warning" : "success" } 
      }));
      // Отправляем событие для обновления UI
      window.dispatchEvent(new CustomEvent("maintenance-changed", { detail: { enabled: newValue } }));
    }
  };

  const handleAddNews = () => {
    if (!newsTitle.trim() || !newsContent.trim()) return;
    const endsAt = newsType === "giveaway" ? new Date(Date.now() + parseInt(newsDuration) * 60 * 60 * 1000).toISOString() : undefined;
    const reward = newsType === "giveaway" 
      ? newsRewardType === "moni" 
        ? { type: "coins" as const, amount: parseInt(newsRewardMoni) }
        : { type: "item" as const, itemId: newsRewardItemId }
      : undefined;

    newsService.addNews({
      title: newsTitle,
      content: newsContent,
      type: newsType,
      reward,
      participants: newsType === "giveaway" ? [] : undefined,
      winnersCount: newsType === "giveaway" ? parseInt(newsWinnersCount) || 1 : undefined,
      endsAt,
    });

    setNewsTitle("");
    setNewsContent("");
    setNewsRewardMoni("");
    setNewsRewardItemId("");
    setNewsWinnersCount("1");
    setNewsDuration("24");
    loadNews();
    window.dispatchEvent(new CustomEvent("show-toast", { detail: { message: "Новость добавлена!", type: "success" } }));
  };

  const handleEndGiveaway = (giveaway: NewsItem) => {
    if (!user || giveaway.isEnded) return;
    newsService.endGiveaway(giveaway.id);
    loadNews();
    window.dispatchEvent(new CustomEvent("show-toast", { detail: { message: "Розыгрыш завершен!", type: "success" } }));
  };

  const handleDeleteNews = (id: string) => {
    newsService.deleteNews(id);
    loadNews();
  };

  const getTimeRemaining = (endsAt: string) => {
    const diff = new Date(endsAt).getTime() - Date.now();
    if (diff <= 0) return "Завершён";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 24) return `${Math.floor(hours / 24)}д ${hours % 24}ч`;
    if (hours > 0) return `${hours}ч ${mins}м`;
    return `${mins}м`;
  };

  const getItemsForType = (type: GiveType): ShopItem[] => {
    switch (type) {
      case "banner": return shopService.getBanners();
      case "frame": return shopService.getFrames();
      case "title": return shopService.getTitles();
      case "background": return shopService.getBackgrounds();
      case "pack": return shopService.getPacks();
      default: return [];
    }
  };

  const giveTypes = [
    { id: "moni" as GiveType, label: "Moni", Icon: MoniIcon },
    { id: "banner" as GiveType, label: "Баннер", Icon: HiOutlinePhoto },
    { id: "frame" as GiveType, label: "Рамка", Icon: HiOutlineSparkles },
    { id: "title" as GiveType, label: "Титул", Icon: HiOutlineTrophy },
    { id: "background" as GiveType, label: "Фон", Icon: HiOutlineSquare2Stack },
    { id: "pack" as GiveType, label: "Пак", Icon: HiOutlineGift },
  ];

  const StatCard = ({ label, value, icon: Icon, color, subValue }: any) => (
    <div className="p-4 rounded-2xl relative overflow-hidden" style={{ background: colors.surface }}>
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-20" style={{ background: color }} />
      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}20` }}>
            <Icon className="w-5 h-5" style={{ color }} />
          </div>
        </div>
        <p className="text-3xl font-bold mb-1" style={{ color }}>{value}</p>
        <p className="text-xs" style={{ color: colors.textSecondary }}>{label}</p>
        {subValue && <p className="text-[10px] mt-1" style={{ color: `${color}90` }}>{subValue}</p>}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="p-4 rounded-2xl flex items-center gap-3" style={{
        background: `linear-gradient(135deg, ${colors.accent}20, ${colors.secondary}10)`,
        border: `1px solid ${colors.accent}30`
      }}>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${colors.accent}30` }}>
          <HiOutlineShieldCheck className="w-6 h-6" style={{ color: colors.accent }} />
        </div>
        <div>
          <h2 className="text-lg font-bold" style={{ color: colors.accent }}>Админ-панель</h2>
          <p className="text-xs" style={{ color: colors.textSecondary }}>Управление Harmonix</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { id: "stats" as AdminTab, label: "Статистика", icon: HiOutlineChartBar, color: "#22C55E" },
          { id: "users" as AdminTab, label: "Пользователи", icon: HiOutlineUsers, color: "#A78BFA" },
          { id: "news" as AdminTab, label: "Новости", icon: IoMegaphone, color: "#3B82F6" },
          { id: "system" as AdminTab, label: "Система", icon: HiOutlineCog6Tooth, color: "#F97316" },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className="flex-1 min-w-[80px] flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all"
              style={{ background: isActive ? `${tab.color}15` : colors.surface, color: isActive ? tab.color : colors.textSecondary, border: isActive ? `1px solid ${tab.color}40` : "1px solid transparent" }}>
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Stats Tab */}
      {activeTab === "stats" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Всего пользователей" value={stats.totalUsers} icon={HiOutlineUsers} color="#A78BFA" subValue={`+${stats.newUsersWeek} за неделю`} />
            <StatCard label="Онлайн сейчас" value={stats.onlineUsers} icon={HiOutlineCheck} color="#22C55E" />
            <StatCard label="Всего Moni" value={stats.totalCoins.toLocaleString()} icon={MoniIcon} color="#F59E0B" />
            <StatCard label="Админов" value={stats.admins} icon={HiOutlineShieldCheck} color="#EF4444" />
          </div>
          <button onClick={loadData} disabled={isLoading}
            className="w-full py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-all hover:scale-[1.02]"
            style={{ background: `${colors.accent}15`, color: colors.accent }}>
            <HiOutlineArrowPath className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Загрузка...' : 'Обновить'}
          </button>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === "users" && (
        <div className="space-y-3">
          <div className="relative">
            <HiOutlineMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: colors.textSecondary }} />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Поиск..."
              className="w-full pl-12 pr-4 py-3 rounded-xl focus:outline-none"
              style={{ background: colors.surface, color: colors.textPrimary, border: `1px solid ${colors.textSecondary}20` }} />
          </div>
          <p className="text-xs px-1" style={{ color: colors.textSecondary }}>Найдено: {filteredUsers.length}</p>
          <div className="space-y-2 max-h-[350px] overflow-y-auto">
            {filteredUsers.map((u) => (
              <div key={u.id} className="p-3 rounded-xl flex items-center gap-3" style={{ background: colors.surface }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                  style={{ background: u.avatar ? `url(${u.avatar}) center/cover` : `linear-gradient(135deg, ${colors.accent}, ${colors.secondary})` }}>
                  {!u.avatar && u.display_name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate" style={{ color: colors.textPrimary }}>{u.display_name || u.username}</span>
                    {u.is_admin && <HiOutlineShieldCheck className="w-4 h-4 text-violet-400 flex-shrink-0" />}
                    {u.is_premium && <HiOutlineSparkles className="w-4 h-4 text-yellow-400 flex-shrink-0" title="Premium" />}
                  </div>
                  <div className="flex items-center gap-2 text-xs" style={{ color: colors.textSecondary }}>
                    <span>@{u.username}</span><span>•</span><span>ID: {u.visible_id}</span><span>•</span>
                    <span className="flex items-center gap-1"><MoniIcon className="w-3 h-3" /> {u.coins}</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setGiveModal(u)} className="p-2 rounded-lg transition-all hover:scale-110" style={{ background: `${colors.accent}15` }} title="Выдать">
                    <HiOutlineGift className="w-4 h-4" style={{ color: colors.accent }} />
                  </button>
                  <button onClick={() => u.is_premium ? setRemovePremiumModal(u) : setPremiumModal(u)} className="p-2 rounded-lg transition-all hover:scale-110" style={{ background: u.is_premium ? 'rgba(234, 179, 8, 0.15)' : 'rgba(255,255,255,0.05)' }} title={u.is_premium ? "Забрать Premium" : "Выдать Premium"}>
                    <HiOutlineSparkles className="w-4 h-4" style={{ color: u.is_premium ? '#EAB308' : colors.textSecondary }} />
                  </button>
                  <button onClick={() => handleToggleAdmin(u)} className="p-2 rounded-lg transition-all hover:scale-110" style={{ background: u.is_admin ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255,255,255,0.05)' }} title={u.is_admin ? "Снять админа" : "Сделать админом"}>
                    <HiOutlineShieldCheck className="w-4 h-4" style={{ color: u.is_admin ? '#A78BFA' : colors.textSecondary }} />
                  </button>
                  {u.id !== user?.uid && (
                    <button onClick={() => handleDeleteUser(u)} className="p-2 rounded-lg transition-all hover:scale-110" style={{ background: 'rgba(239, 68, 68, 0.1)' }} title="Удалить">
                      <HiOutlineTrash className="w-4 h-4 text-red-400" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* News Tab */}
      {activeTab === "news" && (
        <div className="space-y-4">
          {/* Add News Form */}
          <div className="p-4 rounded-2xl space-y-3" style={{ background: colors.surface }}>
            <h3 className="font-medium flex items-center gap-2" style={{ color: colors.textPrimary }}>
              <HiOutlinePencil className="w-4 h-4" /> Создать новость
            </h3>
            <div className="flex gap-2">
              {(["news", "giveaway"] as const).map((t) => {
                const Icon = t === "news" ? HiOutlineBell : HiOutlineGift;
                return (
                  <button key={t} onClick={() => setNewsType(t)}
                    className="flex-1 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2"
                    style={{ background: newsType === t ? colors.accent : `${colors.textSecondary}10`, color: newsType === t ? "var(--interactive-accent-text)" : colors.textSecondary }}>
                    <Icon className="w-4 h-4" />
                    {t === "news" ? "Новость" : "Розыгрыш"}
                  </button>
                );
              })}
            </div>
            <input type="text" value={newsTitle} onChange={(e) => setNewsTitle(e.target.value)} placeholder="Заголовок"
              className="w-full px-4 py-2.5 rounded-lg text-sm focus:outline-none"
              style={{ background: `${colors.textSecondary}10`, color: colors.textPrimary }} />
            <textarea value={newsContent} onChange={(e) => setNewsContent(e.target.value)} placeholder="Содержание..." rows={3}
              className="w-full px-4 py-2.5 rounded-lg text-sm focus:outline-none resize-none"
              style={{ background: `${colors.textSecondary}10`, color: colors.textPrimary }} />
            
            {newsType === "giveaway" && (
              <div className="space-y-2 p-3 rounded-lg" style={{ background: `${colors.accent}08` }}>
                <div className="flex gap-2">
                  <button onClick={() => setNewsRewardType("moni")} className="flex-1 py-2 rounded-lg text-xs"
                    style={{ background: newsRewardType === "moni" ? colors.accent : `${colors.textSecondary}10`, color: newsRewardType === "moni" ? "var(--interactive-accent-text)" : colors.textSecondary }}>
                    Moni
                  </button>
                  <button onClick={() => setNewsRewardType("item")} className="flex-1 py-2 rounded-lg text-xs"
                    style={{ background: newsRewardType === "item" ? colors.accent : `${colors.textSecondary}10`, color: newsRewardType === "item" ? "var(--interactive-accent-text)" : colors.textSecondary }}>
                    Предмет
                  </button>
                </div>
                {newsRewardType === "moni" ? (
                  <input type="number" value={newsRewardMoni} onChange={(e) => setNewsRewardMoni(e.target.value)} placeholder="Количество Moni"
                    className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none"
                    style={{ background: `${colors.textSecondary}10`, color: colors.textPrimary }} />
                ) : (
                  <select value={newsRewardItemId} onChange={(e) => setNewsRewardItemId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none"
                    style={{ background: `${colors.textSecondary}10`, color: colors.textPrimary }}>
                    <option value="">Выберите предмет</option>
                    {[...shopService.getBanners(), ...shopService.getFrames(), ...shopService.getTitles()].map((item) => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </select>
                )}
                <div className="flex gap-2">
                  <input type="number" value={newsWinnersCount} onChange={(e) => setNewsWinnersCount(e.target.value)} placeholder="Победителей"
                    className="flex-1 px-3 py-2 rounded-lg text-sm focus:outline-none"
                    style={{ background: `${colors.textSecondary}10`, color: colors.textPrimary }} />
                  <input type="number" value={newsDuration} onChange={(e) => setNewsDuration(e.target.value)} placeholder="Часов"
                    className="flex-1 px-3 py-2 rounded-lg text-sm focus:outline-none"
                    style={{ background: `${colors.textSecondary}10`, color: colors.textPrimary }} />
                </div>
              </div>
            )}
            <button onClick={handleAddNews} className="w-full py-2.5 rounded-lg font-medium text-sm"
              style={{ background: colors.accent, color: "var(--interactive-accent-text)" }}>
              Опубликовать
            </button>
          </div>

          {/* News List */}
          <div className="space-y-2">
            {allNews.map((news) => {
              const newsIcon = news.type === "giveaway" ? HiOutlineGift : HiOutlineBell;
              const NewsIcon = newsIcon;
              const iconColor = news.type === "giveaway" ? "#F59E0B" : "#3B82F6";
              
              return (
                <div key={news.id} className="p-3 rounded-xl" style={{ background: colors.surface }}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${iconColor}15` }}>
                          <NewsIcon className="w-4 h-4" style={{ color: iconColor }} />
                        </div>
                        <span className="font-medium text-sm truncate" style={{ color: colors.textPrimary }}>{news.title}</span>
                      </div>
                      <p className="text-xs mt-1 line-clamp-2 ml-9" style={{ color: colors.textSecondary }}>{news.content}</p>
                      {news.type === "giveaway" && (
                        <div className="flex items-center gap-3 mt-2 ml-9 text-[10px]" style={{ color: colors.textSecondary }}>
                          <span className="flex items-center gap-1">
                            <HiOutlineUsers className="w-3 h-3" />
                            {news.participants?.length || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <HiOutlineTrophy className="w-3 h-3" />
                            {news.winnersCount}
                          </span>
                          <span className="flex items-center gap-1">
                            <HiOutlineArrowPath className="w-3 h-3" />
                            {news.endsAt ? getTimeRemaining(news.endsAt) : "-"}
                          </span>
                          {news.isEnded && (
                            <span className="flex items-center gap-1 text-green-400">
                              <HiOutlineCheck className="w-3 h-3" />
                              Завершен
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1">
                      {news.type === "giveaway" && !news.isEnded && (
                        <button onClick={() => handleEndGiveaway(news)} className="p-1.5 rounded-lg" style={{ background: "rgba(34,197,94,0.1)" }} title="Завершить">
                          <HiOutlineCheck className="w-4 h-4 text-green-400" />
                        </button>
                      )}
                      <button onClick={() => handleDeleteNews(news.id)} className="p-1.5 rounded-lg" style={{ background: "rgba(239,68,68,0.1)" }} title="Удалить">
                        <HiOutlineTrash className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            {allNews.length === 0 && (
              <p className="text-center py-8 text-sm" style={{ color: colors.textSecondary }}>Нет новостей</p>
            )}
          </div>
        </div>
      )}

      {/* System Tab */}
      {activeTab === "system" && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl" style={{ background: colors.surface }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: maintenanceMode ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)' }}>
                  <HiOutlineExclamationTriangle className="w-5 h-5" style={{ color: maintenanceMode ? '#EF4444' : '#22C55E' }} />
                </div>
                <div>
                  <p className="font-medium" style={{ color: colors.textPrimary }}>Режим обслуживания</p>
                  <p className="text-xs" style={{ color: colors.textSecondary }}>Закрыть доступ для пользователей</p>
                </div>
              </div>
              <button onClick={toggleMaintenanceMode} className="w-14 h-7 rounded-full transition-all relative"
                style={{ background: maintenanceMode ? '#EF4444' : `${colors.textSecondary}30` }}>
                <div className="absolute top-1 w-5 h-5 rounded-full transition-all" style={{ left: maintenanceMode ? '32px' : '4px', background: "var(--interactive-accent)" }} />
              </button>
            </div>
            {maintenanceMode && (
              <p className="text-xs mt-3 p-2 rounded-lg flex items-center gap-2" style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>
                <HiOutlineBell className="w-4 h-4" /> Уведомление будет показано всем пользователям
              </p>
            )}
          </div>
          <div className="p-4 rounded-2xl" style={{ background: colors.surface }}>
            <h3 className="font-medium mb-3" style={{ color: colors.textPrimary }}>База данных</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span style={{ color: colors.textSecondary }}>Провайдер</span><span style={{ color: colors.textPrimary }}>Supabase</span></div>
              <div className="flex justify-between"><span style={{ color: colors.textSecondary }}>Записей</span><span style={{ color: colors.textPrimary }}>{stats.totalUsers}</span></div>
            </div>
            <p className="text-[10px] mt-3 p-2 rounded-lg" style={{ background: `${colors.accent}10`, color: colors.accent }}>
              💡 Место: Dashboard → Settings → Database size
            </p>
          </div>
        </div>
      )}

      {/* Give Modal - Improved */}
      {giveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }}>
          <div className="w-full max-w-2xl rounded-3xl overflow-hidden" style={{ background: colors.background, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
            {/* Header */}
            <div className="px-6 py-4 flex items-center justify-between" style={{ background: `linear-gradient(135deg, ${colors.accent}15, ${colors.secondary}10)`, borderBottom: `1px solid ${colors.textSecondary}15` }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${colors.accent}20` }}>
                  <HiOutlineGift className="w-5 h-5" style={{ color: colors.accent }} />
                </div>
                <div>
                  <h3 className="font-bold text-lg" style={{ color: colors.textPrimary }}>Выдать награду</h3>
                  <p className="text-xs" style={{ color: colors.textSecondary }}>
                    Пользователь: <span style={{ color: colors.accent }}>{giveModal.display_name}</span> (@{giveModal.username})
                  </p>
                </div>
              </div>
              <button onClick={() => setGiveModal(null)} className="p-2 rounded-xl hover:scale-110 transition-all" style={{ background: `${colors.textSecondary}10`, color: colors.textSecondary }}>
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Type Selection */}
              <div>
                <p className="text-sm font-medium mb-3" style={{ color: colors.textSecondary }}>Тип награды</p>
                <div className="grid grid-cols-6 gap-2">
                  {giveTypes.map(({ id, label, Icon }) => (
                    <button key={id} onClick={() => { setGiveType(id); setGiveItemId(""); }}
                      className="p-3 rounded-xl flex flex-col items-center gap-2 transition-all hover:scale-105"
                      style={{ 
                        background: giveType === id ? `linear-gradient(135deg, ${colors.accent}, ${colors.accent}dd)` : `${colors.textSecondary}08`, 
                        border: giveType === id ? `2px solid ${colors.accent}` : '2px solid transparent',
                        boxShadow: giveType === id ? `0 4px 16px ${colors.accent}30` : undefined,
                      }}>
                      <Icon className="w-5 h-5" style={{ color: giveType === id ? 'var(--interactive-accent-text)' : colors.textSecondary }} />
                      <span className="text-[10px] font-medium" style={{ color: giveType === id ? 'var(--interactive-accent-text)' : colors.textSecondary }}>{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {giveType === "moni" ? (
                <div>
                  <p className="text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>Количество Moni</p>
                  <input type="number" value={giveAmount} onChange={(e) => setGiveAmount(e.target.value)} placeholder="Введите количество"
                    className="w-full px-4 py-3 rounded-xl focus:outline-none text-lg font-bold"
                    style={{ background: colors.surface, color: colors.textPrimary, border: `2px solid ${colors.textSecondary}15` }} />
                </div>
              ) : (
                <div>
                  <p className="text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>Выберите предмет</p>
                  <div className="max-h-80 overflow-y-auto rounded-xl p-3" style={{ background: colors.surface }}>
                    {/* Баннеры и фоны - прямоугольные в 2 колонки */}
                    {(giveType === "banner" || giveType === "background") && (
                      <div className="grid grid-cols-2 gap-3">
                        {getItemsForType(giveType).map((item) => {
                          const isSelected = giveItemId === item.id;
                          const isImagePreview = item.preview?.startsWith("/") || item.preview?.startsWith("./") || item.preview?.startsWith("http");
                          const rarityColor = shopService.getRarityColor(item.rarity);
                          
                          return (
                            <button
                              key={item.id}
                              onClick={() => setGiveItemId(item.id)}
                              className="relative rounded-xl overflow-hidden transition-all hover:scale-105"
                              style={{ 
                                border: isSelected ? `3px solid ${colors.accent}` : `2px solid ${rarityColor}30`,
                                background: colors.background,
                                boxShadow: isSelected ? `0 4px 16px ${colors.accent}40` : undefined,
                              }}
                            >
                              {/* Preview - прямоугольный */}
                              <div className="h-24 relative">
                                {isImagePreview ? (
                                  <img src={item.preview} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full" style={{ background: item.preview || colors.surface }} />
                                )}
                                
                                {/* Selected checkmark */}
                                {isSelected && (
                                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: colors.accent, boxShadow: `0 0 12px ${colors.accent}60` }}>
                                    <HiOutlineCheck className="w-4 h-4 text-white" />
                                  </div>
                                )}
                                
                                {/* Rarity badge */}
                                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-bold" style={{ background: `${rarityColor}90`, color: '#fff' }}>
                                  {shopService.getRarityName(item.rarity)}
                                </div>
                                
                                {/* Animated badge */}
                                {(item as any).animated && (
                                  <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-bold flex items-center gap-1" style={{ background: 'rgba(168, 85, 247, 0.9)', color: '#fff' }}>
                                    <HiOutlineSparkles className="w-3 h-3" />
                                    GIF
                                  </div>
                                )}
                              </div>
                              
                              {/* Name */}
                              <div className="p-2" style={{ background: isSelected ? `${colors.accent}10` : colors.surface }}>
                                <p className="text-xs font-bold truncate" style={{ color: isSelected ? colors.accent : colors.textPrimary }}>
                                  {item.name}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                    
                    {/* Рамки, титулы, паки - квадратные в 3 колонки */}
                    {(giveType === "frame" || giveType === "title" || giveType === "pack") && (
                      <div className="grid grid-cols-3 gap-3">
                        {getItemsForType(giveType).map((item) => {
                          const isSelected = giveItemId === item.id;
                          const isImagePreview = item.preview?.startsWith("/") || item.preview?.startsWith("./") || item.preview?.startsWith("http");
                          const rarityColor = shopService.getRarityColor(item.rarity);
                          
                          return (
                            <button
                              key={item.id}
                              onClick={() => setGiveItemId(item.id)}
                              className="relative rounded-xl overflow-hidden transition-all hover:scale-105"
                              style={{ 
                                border: isSelected ? `3px solid ${colors.accent}` : `2px solid ${rarityColor}30`,
                                background: colors.background,
                                boxShadow: isSelected ? `0 4px 16px ${colors.accent}40` : undefined,
                              }}
                            >
                              {/* Preview - квадратный */}
                              <div className="aspect-square relative">
                                {isImagePreview ? (
                                  <img src={item.preview} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full" style={{ background: item.preview || colors.surface }} />
                                )}
                                
                                {/* Selected checkmark */}
                                {isSelected && (
                                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: colors.accent, boxShadow: `0 0 12px ${colors.accent}60` }}>
                                    <HiOutlineCheck className="w-4 h-4 text-white" />
                                  </div>
                                )}
                                
                                {/* Rarity badge */}
                                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-bold" style={{ background: `${rarityColor}90`, color: '#fff' }}>
                                  {shopService.getRarityName(item.rarity)}
                                </div>
                                
                                {/* Animated badge */}
                                {(item as any).animated && (
                                  <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-bold flex items-center gap-1" style={{ background: 'rgba(168, 85, 247, 0.9)', color: '#fff' }}>
                                    <HiOutlineSparkles className="w-3 h-3" />
                                    GIF
                                  </div>
                                )}
                              </div>
                              
                              {/* Name */}
                              <div className="p-2" style={{ background: isSelected ? `${colors.accent}10` : colors.surface }}>
                                <p className="text-xs font-bold truncate" style={{ color: isSelected ? colors.accent : colors.textPrimary }}>
                                  {item.name}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                    
                    {getItemsForType(giveType).length === 0 && (
                      <div className="text-center py-12">
                        <p className="text-sm font-medium" style={{ color: colors.textSecondary }}>Нет доступных предметов</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Action Button */}
              <button onClick={handleGiveReward} 
                disabled={giveType !== "moni" && !giveItemId}
                className="w-full py-4 rounded-xl font-bold text-base transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ background: `linear-gradient(135deg, ${colors.accent}, ${colors.secondary})`, color: 'var(--interactive-accent-text)', boxShadow: `0 8px 24px ${colors.accent}30` }}>
                <HiOutlineCheck className="w-5 h-5" />
                {giveType === "moni" ? `Выдать ${giveAmount || 0} Moni` : giveItemId ? 'Выдать предмет' : 'Выберите предмет'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Premium Modal */}
      {premiumModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }}>
          <div className="w-full max-w-md rounded-3xl overflow-hidden" style={{ background: colors.background, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
            {/* Header */}
            <div className="px-6 py-4 flex items-center justify-between" style={{ background: `linear-gradient(135deg, #EAB30815, #F5970810)`, borderBottom: `1px solid ${colors.textSecondary}15` }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(234, 179, 8, 0.2)' }}>
                  <HiOutlineSparkles className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <h3 className="font-bold text-lg" style={{ color: colors.textPrimary }}>Выдать Premium</h3>
                  <p className="text-xs" style={{ color: colors.textSecondary }}>
                    Пользователь: <span className="text-yellow-400">{premiumModal.display_name}</span> (@{premiumModal.username})
                  </p>
                </div>
              </div>
              <button onClick={() => setPremiumModal(null)} className="p-2 rounded-xl hover:scale-110 transition-all" style={{ background: `${colors.textSecondary}10`, color: colors.textSecondary }}>
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Duration Selection */}
              <div>
                <p className="text-sm font-medium mb-3" style={{ color: colors.textSecondary }}>Длительность (дней)</p>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {[7, 30, 90, 180, 365, 999].map((days) => (
                    <button
                      key={days}
                      onClick={() => setPremiumDays(days.toString())}
                      className="py-2 rounded-xl text-sm font-medium transition-all hover:scale-105"
                      style={{
                        background: premiumDays === days.toString() ? 'linear-gradient(135deg, #EAB308, #F59E0B)' : `${colors.textSecondary}08`,
                        color: premiumDays === days.toString() ? '#000' : colors.textSecondary,
                        border: premiumDays === days.toString() ? '2px solid #EAB308' : '2px solid transparent',
                      }}
                    >
                      {days === 999 ? '∞' : days}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={premiumDays}
                  onChange={(e) => setPremiumDays(e.target.value)}
                  placeholder="Или введите количество дней"
                  className="w-full px-4 py-3 rounded-xl focus:outline-none text-lg font-bold"
                  style={{ background: colors.surface, color: colors.textPrimary, border: `2px solid ${colors.textSecondary}15` }}
                />
              </div>

              {/* Info */}
              <div className="p-3 rounded-xl flex items-start gap-2" style={{ background: 'rgba(234, 179, 8, 0.1)' }}>
                <HiOutlineSparkles className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs" style={{ color: '#EAB308' }}>
                  <p className="font-medium mb-1">Premium включает:</p>
                  <ul className="space-y-0.5 list-disc list-inside">
                    <li>Эксклюзивные предметы в магазине</li>
                    <li>Специальный значок в профиле</li>
                    <li>Приоритетная поддержка</li>
                  </ul>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={handleGivePremium}
                className="w-full py-4 rounded-xl font-bold text-base transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #EAB308, #F59E0B)', color: '#000', boxShadow: '0 8px 24px rgba(234, 179, 8, 0.3)' }}
              >
                <HiOutlineCheck className="w-5 h-5" />
                Выдать Premium на {premiumDays} дней
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Premium Modal */}
      {removePremiumModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }}>
          <div className="w-full max-w-md rounded-3xl overflow-hidden" style={{ background: colors.background, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
            {/* Header */}
            <div className="px-6 py-4 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(220, 38, 38, 0.1))', borderBottom: `1px solid ${colors.textSecondary}15` }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(239, 68, 68, 0.2)' }}>
                  <HiOutlineXMark className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="font-bold text-lg" style={{ color: colors.textPrimary }}>Забрать Premium</h3>
                  <p className="text-xs" style={{ color: colors.textSecondary }}>
                    Пользователь: <span className="text-red-400">{removePremiumModal.display_name}</span> (@{removePremiumModal.username})
                  </p>
                </div>
              </div>
              <button onClick={() => setRemovePremiumModal(null)} className="p-2 rounded-xl hover:scale-110 transition-all" style={{ background: `${colors.textSecondary}10`, color: colors.textSecondary }}>
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Warning */}
              <div className="p-4 rounded-xl flex items-start gap-3" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <HiOutlineExclamationTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm" style={{ color: '#EF4444' }}>
                  <p className="font-medium mb-1">Вы уверены?</p>
                  <p className="text-xs opacity-80">
                    Premium статус будет удален у пользователя <span className="font-bold">{removePremiumModal.display_name}</span>. 
                    Это действие нельзя отменить.
                  </p>
                </div>
              </div>

              {/* Premium info */}
              {removePremiumModal.premium_expires_at && (
                <div className="p-3 rounded-xl" style={{ background: `${colors.textSecondary}08` }}>
                  <p className="text-xs" style={{ color: colors.textSecondary }}>
                    Истекает: <span style={{ color: colors.textPrimary }}>{new Date(removePremiumModal.premium_expires_at).toLocaleDateString('ru-RU')}</span>
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setRemovePremiumModal(null)}
                  className="flex-1 py-3 rounded-xl font-medium text-sm transition-all hover:scale-[1.02]"
                  style={{ background: `${colors.textSecondary}15`, color: colors.textPrimary }}
                >
                  Отмена
                </button>
                <button
                  onClick={handleRemovePremium}
                  className="flex-1 py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #EF4444, #DC2626)', color: '#fff', boxShadow: '0 4px 16px rgba(239, 68, 68, 0.3)' }}
                >
                  <HiOutlineXMark className="w-5 h-5" />
                  Забрать Premium
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
