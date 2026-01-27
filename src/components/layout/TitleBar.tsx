import { Minus, Square, X, Wifi, WifiOff } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { HiOutlineEnvelope, HiOutlineEnvelopeOpen, HiOutlineGift, HiOutlineTrash, HiOutlineCheck, HiOutlineXMark, HiOutlineArrowLeft, HiOutlineHome, HiOutlineMusicalNote, HiOutlineQueueList, HiOutlineMagnifyingGlass, HiOutlineHeart, HiOutlineUser, HiOutlineCog6Tooth, HiOutlineShieldCheck, HiOutlineUsers, HiOutlineTrophy, HiOutlineWrenchScrewdriver } from "react-icons/hi2";
import { IoMegaphone } from "react-icons/io5";
import { useUserStore } from "../../stores/userStore";
import { useNavigationStore } from "../../stores/navigationStore";
import { useThemeStore } from "../../stores/themeStore";
import { newsService } from "../../services/NewsService";
import { shopService } from "../../services/ShopService";
import { accountService, type StoredUser } from "../../services/AccountService";
import { supabaseService } from "../../services/SupabaseService";
import { MoniIcon } from "../common/MoniIcon";
import type { NewsItem } from "../../types/shop";

// Harmonix Logo Component - switches between dark/light versions
const HarmonixLogo = ({ isLight }: { isLight: boolean }) => {
  if (isLight) {
    // Light theme - dark logo on light background
    return (
      <svg viewBox="0 0 512 512" className="w-6 h-6">
        <rect width="512" height="512" rx="115" fill="#f5f5f5" />
        <rect x="96" y="220" width="28" height="72" rx="14" fill="#404040" opacity="0.7" />
        <rect x="140" y="180" width="28" height="152" rx="14" fill="#505050" opacity="0.85" />
        <rect x="184" y="140" width="28" height="232" rx="14" fill="#606060" />
        <rect x="242" y="100" width="28" height="312" rx="14" fill="#707070" />
        <rect x="300" y="140" width="28" height="232" rx="14" fill="#606060" />
        <rect x="344" y="180" width="28" height="152" rx="14" fill="#505050" opacity="0.85" />
        <rect x="388" y="220" width="28" height="72" rx="14" fill="#404040" opacity="0.7" />
      </svg>
    );
  }
  
  // Dark theme - light logo on dark background
  return (
    <svg viewBox="0 0 512 512" className="w-6 h-6">
      <rect width="512" height="512" rx="115" fill="#141414" />
      <rect x="96" y="220" width="28" height="72" rx="14" fill="#ffffff" opacity="0.3" />
      <rect x="140" y="180" width="28" height="152" rx="14" fill="#ffffff" opacity="0.4" />
      <rect x="184" y="140" width="28" height="232" rx="14" fill="#ffffff" opacity="0.5" />
      <rect x="242" y="100" width="28" height="312" rx="14" fill="#ffffff" opacity="0.6" />
      <rect x="300" y="140" width="28" height="232" rx="14" fill="#ffffff" opacity="0.5" />
      <rect x="344" y="180" width="28" height="152" rx="14" fill="#ffffff" opacity="0.4" />
      <rect x="388" y="220" width="28" height="72" rx="14" fill="#ffffff" opacity="0.3" />
    </svg>
  );
};

export function TitleBar() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isMaximized, setIsMaximized] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showMail, setShowMail] = useState(false);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [deletedNews, setDeletedNews] = useState<string[]>([]);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [allUsers, setAllUsers] = useState<StoredUser[]>([]);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  
  const { user, updateProfile } = useUserStore();
  const { currentRoute, settingsOpen } = useNavigationStore();
  const { isLight } = useThemeStore();
  const readNewsRef = useRef<string[]>([]);

  // Route labels and icons
  const routeInfo: Record<string, { label: string; icon: typeof HiOutlineHome }> = {
    home: { label: "Главная", icon: HiOutlineHome },
    player: { label: "Плеер", icon: HiOutlineMusicalNote },
    playlists: { label: "Плейлисты", icon: HiOutlineQueueList },
    search: { label: "Поиск", icon: HiOutlineMagnifyingGlass },
    liked: { label: "Любимые", icon: HiOutlineHeart },
    library: { label: "Библиотека", icon: HiOutlineMusicalNote },
    profile: { label: "Профиль", icon: HiOutlineUser },
    admin: { label: "Админ-панель", icon: HiOutlineShieldCheck },
  };

  const currentRouteInfo = settingsOpen 
    ? { label: "Настройки", icon: HiOutlineCog6Tooth }
    : routeInfo[currentRoute] || { label: "Главная", icon: HiOutlineHome };
  const RouteIcon = currentRouteInfo.icon;
  
  // Update ref when user changes
  useEffect(() => {
    readNewsRef.current = user?.readNews || [];
  }, [user?.readNews]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Load deleted news
  useEffect(() => {
    const saved = localStorage.getItem('harmonix-deleted-news');
    if (saved) setDeletedNews(JSON.parse(saved));
    setAllUsers(accountService.getAllUsers());
  }, []);

  // Load maintenance status
  useEffect(() => {
    const loadMaintenance = async () => {
      const settings = await supabaseService.getAppSettings();
      if (settings) {
        setMaintenanceMode(settings.maintenance_mode);
      }
    };
    loadMaintenance();

    // Listen for changes
    const handleMaintenanceChange = (e: CustomEvent) => {
      setMaintenanceMode(e.detail.enabled);
    };
    window.addEventListener("maintenance-changed", handleMaintenanceChange as EventListener);
    
    // Check periodically
    const interval = setInterval(loadMaintenance, 30000);
    
    return () => {
      window.removeEventListener("maintenance-changed", handleMaintenanceChange as EventListener);
      clearInterval(interval);
    };
  }, []);

  // Check unread news count - only run on mount and when deletedNews changes
  useEffect(() => {
    const checkUnread = () => {
      const allNews = newsService.getAllNews();
      const filtered = allNews.filter(n => !deletedNews.includes(n.id));
      setNews(filtered);
      const unread = filtered.filter(n => !readNewsRef.current.includes(n.id));
      setUnreadCount(unread.length);
    };
    
    checkUnread();
    // Reduced from 5s to 30s - news doesn't change that often
    const interval = setInterval(checkUnread, 30000);
    return () => clearInterval(interval);
  }, [deletedNews]);

  const handleMinimize = () => window.electronAPI?.minimize();
  const handleMaximize = () => {
    window.electronAPI?.maximize();
    setIsMaximized(!isMaximized);
  };
  const handleClose = () => window.electronAPI?.close();

  const isRead = (id: string) => readNewsRef.current.includes(id);

  const handleMarkRead = (item: NewsItem) => {
    if (!isRead(item.id) && item.type === 'news') {
      updateProfile({ readNews: [...readNewsRef.current, item.id] });
    }
    setSelectedNews(item);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newDeleted = [...deletedNews, id];
    setDeletedNews(newDeleted);
    localStorage.setItem('harmonix-deleted-news', JSON.stringify(newDeleted));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'news': return <IoMegaphone className="w-3.5 h-3.5" />;
      case 'giveaway': return <HiOutlineGift className="w-3.5 h-3.5" />;
      default: return <IoMegaphone className="w-3.5 h-3.5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'news': return '#3b82f6';
      case 'giveaway': return '#f97316';
      default: return '#6b7280';
    }
  };

  const getParticipantUsers = (participantIds: string[]) => {
    return allUsers.filter(u => participantIds.includes(u.uid));
  };

  const handleParticipateGiveaway = (item: NewsItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !item.id) return;
    newsService.addParticipant(item.id, user.uid);
    // Mark as read
    if (!isRead(item.id)) {
      updateProfile({ readNews: [...readNewsRef.current, item.id] });
    }
    // Refresh news
    const allNews = newsService.getAllNews();
    const filtered = allNews.filter(n => !deletedNews.includes(n.id));
    setNews(filtered);
    // Show participants
    const updatedNews = newsService.getNewsById(item.id);
    if (updatedNews) {
      setSelectedNews(updatedNews);
      setShowParticipantsModal(true);
    }
  };

  return (
    <div 
      className="flex items-center h-11 select-none app-drag"
      style={{ 
        background: 'var(--surface-chrome)', 
        borderBottom: '1px solid var(--border-base)' 
      }}
    >
      {/* Left - Logo and App Name */}
      <div className="flex items-center gap-2.5 px-4 app-no-drag w-[200px]">
        <HarmonixLogo isLight={isLight()} />
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Harmonix</span>
          <span className="text-[10px] font-medium" style={{ color: 'var(--text-subtle)' }}>v1.0 alpha</span>
        </div>
      </div>

      {/* Center - Current route */}
      <div className="flex-1 flex justify-center">
        <div 
          className="flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium app-no-drag"
          style={{ 
            background: 'var(--surface-elevated)', 
            border: '1px solid var(--border-base)',
            color: 'var(--text-secondary)'
          }}
        >
          <RouteIcon size={14} />
          <span>{currentRouteInfo.label}</span>
        </div>
      </div>

      {/* Right side - Status + Mail + Controls */}
      <div className="flex items-center gap-2 w-[200px] justify-end">
        {/* Maintenance indicator */}
        {maintenanceMode && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 app-no-drag">
            <HiOutlineWrenchScrewdriver size={12} />
            <span>Обслуживание</span>
          </div>
        )}

        {/* Online status */}
        <div className="flex items-center gap-2 app-no-drag">
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${
              isOnline
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "bg-red-500/10 text-red-400 border border-red-500/20"
            }`}
          >
            {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
          </div>
        </div>

        {/* Mail icon with dropdown - always visible */}
        <div className="relative app-no-drag">
          <button
            onClick={() => setShowMail(!showMail)}
            className="relative w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300"
            style={{ color: unreadCount > 0 ? 'var(--interactive-accent)' : 'var(--text-subtle)' }}
            title="Почта"
          >
            <HiOutlineEnvelope className="w-5 h-5" />
            {unreadCount > 0 && (
              <span 
                className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center"
                style={{ background: '#EF4444', color: '#fff' }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Mail Panel - Full height slide from right */}
          {showMail && createPortal(
            <>
              {/* Backdrop */}
              <div 
                className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
                onClick={() => { setShowMail(false); setSelectedNews(null); }}
                style={{ zIndex: 9998 }}
              />
              
              {/* Mail Panel */}
              <div 
                className="fixed right-0 bottom-0 w-96 flex flex-col overflow-hidden"
                style={{ 
                  top: '44px',
                  zIndex: 9999,
                  background: 'var(--surface-canvas)', 
                  borderLeft: '1px solid var(--border-base)',
                  animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
                onClick={e => e.stopPropagation()}
              >
                {/* Header */}
                <div className="px-6 py-5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-base)' }}>
                  <div className="flex items-center gap-3">
                    {selectedNews ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (showParticipantsModal) {
                            setShowParticipantsModal(false);
                          } else {
                            setSelectedNews(null);
                          }
                        }}
                        className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:bg-white/10"
                        style={{ background: 'var(--surface-elevated)' }}
                      >
                        <HiOutlineArrowLeft className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
                      </button>
                    ) : (
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'color-mix(in srgb, var(--interactive-accent) 15%, transparent)' }}>
                        <HiOutlineEnvelope className="w-5 h-5" style={{ color: 'var(--interactive-accent)' }} />
                      </div>
                    )}
                    <div>
                      <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {showParticipantsModal ? 'Участники' : selectedNews ? 'Сообщение' : 'Почта'}
                      </h2>
                      {!selectedNews && unreadCount > 0 && (
                        <span className="text-xs" style={{ color: 'var(--text-subtle)' }}>
                          {unreadCount} новых
                        </span>
                      )}
                    </div>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMail(false);
                      setSelectedNews(null);
                    }} 
                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                    style={{ color: 'var(--text-subtle)', background: 'var(--surface-elevated)' }}
                  >
                    <HiOutlineXMark className="w-5 h-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto scrollbar-hide">
                  {showParticipantsModal && selectedNews?.type === 'giveaway' ? (
                    /* Participants View */
                    <div className="p-6">
                      <button
                        onClick={() => setShowParticipantsModal(false)}
                        className="flex items-center gap-2 text-sm mb-4 transition-all hover:opacity-80"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        <HiOutlineArrowLeft className="w-4 h-4" />
                        Назад к сообщению
                      </button>

                      <div className="flex items-center gap-2 mb-4">
                        <HiOutlineTrophy className="w-5 h-5 text-orange-400" />
                        <h3 className="text-lg font-bold" style={{ color: '#F97316' }}>Участники</h3>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(249, 115, 22, 0.08)' }}>
                          <p className="text-lg font-bold" style={{ color: '#F97316' }}>{selectedNews.participants?.length || 0}</p>
                          <p className="text-[10px]" style={{ color: 'var(--text-subtle)' }}>участников</p>
                        </div>
                        <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(34, 197, 94, 0.08)' }}>
                          <p className="text-lg font-bold" style={{ color: '#22C55E' }}>{selectedNews.winnersCount || 1}</p>
                          <p className="text-[10px]" style={{ color: 'var(--text-subtle)' }}>победителей</p>
                        </div>
                        <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(139, 92, 246, 0.08)' }}>
                          <p className="text-lg font-bold text-violet-400">
                            {selectedNews.reward?.amount && selectedNews.winnersCount 
                              ? Math.floor(selectedNews.reward.amount / selectedNews.winnersCount) 
                              : selectedNews.reward?.amount || 0}
                          </p>
                          <p className="text-[10px]" style={{ color: 'var(--text-subtle)' }}>moni каждому</p>
                        </div>
                      </div>

                      {/* Participants List */}
                      <div className="space-y-2">
                        {(!selectedNews.participants || selectedNews.participants.length === 0) ? (
                          <div className="text-center py-8">
                            <HiOutlineUsers className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-subtle)' }} />
                            <p className="text-sm" style={{ color: 'var(--text-subtle)' }}>Пока нет участников</p>
                          </div>
                        ) : (
                          getParticipantUsers(selectedNews.participants).map((participant, idx) => {
                            const isWinner = selectedNews.winnerIds?.includes(participant.uid);
                            const participantTitle = participant.equipped?.title ? shopService.getItemById(participant.equipped.title) : null;
                            return (
                              <div
                                key={participant.uid}
                                className="p-3 rounded-xl flex items-center gap-3"
                                style={{ 
                                  background: isWinner ? 'rgba(34, 197, 94, 0.08)' : 'var(--surface-elevated)',
                                  border: isWinner ? '1px solid rgba(34, 197, 94, 0.2)' : '1px solid var(--border-base)',
                                }}
                              >
                                <span 
                                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" 
                                  style={{ 
                                    background: isWinner ? 'rgba(34, 197, 94, 0.2)' : 'rgba(249, 115, 22, 0.2)', 
                                    color: isWinner ? '#22C55E' : '#F97316' 
                                  }}
                                >
                                  {idx + 1}
                                </span>
                                <div 
                                  className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white"
                                  style={{ background: 'var(--interactive-accent)' }}
                                >
                                  {participant.avatar ? (
                                    <img src={participant.avatar} alt="" className="w-full h-full rounded-xl object-cover" />
                                  ) : (
                                    participant.displayName[0]?.toUpperCase() || '?'
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <p className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>{participant.displayName}</p>
                                    {participantTitle && (participantTitle as any).isImageTitle && (participantTitle as any).image && (
                                      <img src={(participantTitle as any).image} alt={participantTitle.name} className="h-4 object-contain" />
                                    )}
                                  </div>
                                  <p className="text-xs" style={{ color: 'var(--text-subtle)' }}>@{participant.username}</p>
                                </div>
                                {isWinner && (
                                  <span className="px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1" style={{ background: 'rgba(34, 197, 94, 0.2)', color: '#22C55E' }}>
                                    <HiOutlineTrophy className="w-3 h-3" />
                                    WIN
                                  </span>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  ) : selectedNews ? (
                    /* Message Detail View */
                    <div className="p-6">
                      {/* Type badge */}
                      <div 
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium mb-4"
                        style={{ background: `${getTypeColor(selectedNews.type)}15`, color: getTypeColor(selectedNews.type) }}
                      >
                        {getTypeIcon(selectedNews.type)}
                        {selectedNews.type === 'news' ? 'Новости' : selectedNews.type === 'giveaway' ? 'Розыгрыш' : 'Новость'}
                      </div>

                      {/* Title */}
                      <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                        {selectedNews.title}
                      </h3>

                      {/* Date */}
                      <p className="text-xs mb-6" style={{ color: 'var(--text-subtle)' }}>
                        {new Date(selectedNews.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>

                      {/* Content */}
                      <div 
                        className="text-sm leading-relaxed mb-6"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {selectedNews.content}
                      </div>

                      {/* Giveaway Section */}
                      {selectedNews.type === 'giveaway' && (
                        <div 
                          className="p-4 rounded-xl mb-4"
                          style={{ background: selectedNews.isEnded ? 'rgba(34, 197, 94, 0.08)' : 'rgba(249, 115, 22, 0.08)', border: `1px solid ${selectedNews.isEnded ? 'rgba(34, 197, 94, 0.15)' : 'rgba(249, 115, 22, 0.15)'}` }}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <HiOutlineTrophy className={`w-5 h-5 ${selectedNews.isEnded ? 'text-green-400' : 'text-orange-400'}`} />
                              <span className={`text-sm font-medium ${selectedNews.isEnded ? 'text-green-400' : 'text-orange-400'}`}>
                                {selectedNews.isEnded ? 'Розыгрыш завершён' : 'Розыгрыш'}
                              </span>
                            </div>
                            <span className="text-xs" style={{ color: 'var(--text-subtle)' }}>
                              {selectedNews.participants?.length || 0} участников
                            </span>
                          </div>
                          
                          {selectedNews.reward?.amount && (
                            <div className="flex items-center gap-2 mb-3 p-2 rounded-lg" style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
                              <MoniIcon className="w-4 h-4 text-violet-400" />
                              <span className="text-sm font-bold text-violet-400">
                                Приз: {selectedNews.reward.amount} Moni
                              </span>
                            </div>
                          )}

                          {/* Winners display */}
                          {selectedNews.isEnded && selectedNews.winnerIds && selectedNews.winnerIds.length > 0 && (
                            <div className="mb-3 p-3 rounded-xl" style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                              <p className="text-xs font-medium text-green-400 mb-2 flex items-center gap-1">
                                <HiOutlineTrophy className="w-3.5 h-3.5" />
                                Победители:
                              </p>
                              <div className="space-y-1.5">
                                {selectedNews.winnerIds.map(winnerId => {
                                  const winner = allUsers.find(u => u.uid === winnerId);
                                  if (!winner) return null;
                                  const prizePerWinner = selectedNews.reward?.amount && selectedNews.winnersCount 
                                    ? Math.floor(selectedNews.reward.amount / selectedNews.winnersCount) : 0;
                                  return (
                                    <div key={winnerId} className="flex items-center gap-2 p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ background: 'var(--interactive-accent)' }}>
                                        {winner.avatar ? (
                                          <img src={winner.avatar} alt="" className="w-full h-full rounded-lg object-cover" />
                                        ) : (
                                          winner.displayName[0]?.toUpperCase() || '?'
                                        )}
                                      </div>
                                      <span className="text-sm font-medium flex-1" style={{ color: 'var(--text-primary)' }}>{winner.displayName}</span>
                                      <span className="text-xs text-violet-400 flex items-center gap-1">
                                        +{prizePerWinner} <MoniIcon className="w-3 h-3" />
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {!selectedNews.isEnded && user && !selectedNews.participants?.includes(user.uid) ? (
                            <button
                              onClick={(e) => handleParticipateGiveaway(selectedNews, e)}
                              className="w-full py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-90 flex items-center justify-center gap-2"
                              style={{ background: 'rgba(249, 115, 22, 0.2)', color: '#F97316' }}
                            >
                              <HiOutlineGift className="w-4 h-4" />
                              Участвовать
                            </button>
                          ) : !selectedNews.isEnded ? (
                            <div className="space-y-2">
                              <div className="flex items-center justify-center gap-2 py-2 text-sm text-green-500">
                                <HiOutlineCheck className="w-4 h-4" />
                                Вы участвуете!
                              </div>
                              <button
                                onClick={() => setShowParticipantsModal(true)}
                                className="w-full py-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-2"
                                style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}
                              >
                                <HiOutlineUsers className="w-4 h-4" />
                                Посмотреть участников ({selectedNews.participants?.length || 0})
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setShowParticipantsModal(true)}
                              className="w-full py-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-2"
                              style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}
                            >
                              <HiOutlineUsers className="w-4 h-4" />
                              Все участники ({selectedNews.participants?.length || 0})
                            </button>
                          )}
                        </div>
                      )}

                      {/* Delete button */}
                      <button
                        onClick={(e) => { handleDelete(selectedNews.id, e); setSelectedNews(null); }}
                        className="w-full py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all hover:bg-red-500/20"
                        style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}
                      >
                        <HiOutlineTrash className="w-4 h-4" />
                        Удалить
                      </button>
                    </div>
                  ) : news.length === 0 ? (
                    /* Empty state */
                    <div className="flex flex-col items-center justify-center h-full p-8">
                      <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'var(--surface-elevated)' }}>
                        <HiOutlineEnvelopeOpen className="w-10 h-10" style={{ color: 'var(--text-subtle)' }} />
                      </div>
                      <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Нет сообщений</p>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-subtle)' }}>Новые уведомления появятся здесь</p>
                    </div>
                  ) : (
                    /* Messages List */
                    <div className="p-3 space-y-2">
                      {news.map((item, idx) => {
                        const read = isRead(item.id);
                        const hasReward = item.reward && !read;

                        return (
                          <div
                            key={item.id}
                            className="p-4 rounded-2xl cursor-pointer transition-all group"
                            style={{ 
                              background: read ? 'var(--surface-card)' : 'var(--surface-elevated)',
                              border: `1px solid ${read ? 'var(--border-base)' : 'var(--border-strong)'}`,
                              animation: `fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${idx * 50}ms both`,
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkRead(item);
                            }}
                          >
                            <div className="flex items-start gap-3">
                              {/* Icon */}
                              <div 
                                className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                                style={{ 
                                  background: `${getTypeColor(item.type)}15`,
                                  color: read ? 'var(--text-subtle)' : getTypeColor(item.type),
                                }}
                              >
                                {getTypeIcon(item.type)}
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h4 
                                    className="font-semibold text-sm truncate" 
                                    style={{ color: read ? 'var(--text-subtle)' : 'var(--text-primary)' }}
                                  >
                                    {item.title}
                                  </h4>
                                  {!read && (
                                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: 'var(--interactive-accent)' }} />
                                  )}
                                </div>
                                <p 
                                  className="text-xs mt-1 line-clamp-2" 
                                  style={{ color: read ? 'var(--text-subtle)' : 'var(--text-secondary)' }}
                                >
                                  {item.content}
                                </p>
                                
                                {/* Footer */}
                                <div className="flex items-center gap-3 mt-3">
                                  <span className="text-[10px]" style={{ color: 'var(--text-subtle)' }}>
                                    {new Date(item.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                                  </span>
                                  
                                  {hasReward && (
                                    <span className="flex items-center gap-1 text-[10px] font-medium" style={{ color: '#22c55e' }}>
                                      <MoniIcon className="w-3 h-3" />
                                      +{item.reward?.amount}
                                    </span>
                                  )}
                                  
                                  {item.reward && read && (
                                    <span className="flex items-center gap-1 text-[10px] text-green-500">
                                      <HiOutlineCheck className="w-3 h-3" />
                                      Получено
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Arrow */}
                              <div className="flex items-center justify-center w-6 h-6 opacity-0 group-hover:opacity-100 transition-all">
                                <svg className="w-4 h-4" style={{ color: 'var(--text-subtle)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
              </>,
              document.body
            )}
          </div>

        {/* Window controls */}
        <div className="flex app-no-drag">
          <button
            onClick={handleMinimize}
            className="w-11 h-11 flex items-center justify-center transition-all"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-elevated)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            <Minus size={16} />
          </button>
          <button
            onClick={handleMaximize}
            className="w-11 h-11 flex items-center justify-center transition-all"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-elevated)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            <Square size={12} />
          </button>
          <button
            onClick={handleClose}
            className="w-11 h-11 flex items-center justify-center transition-all hover:bg-red-500/80"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
