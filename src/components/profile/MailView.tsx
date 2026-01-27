import { useState, useEffect } from 'react';
import { useUserStore } from '../../stores/userStore';
import { MoniIcon } from '../common/MoniIcon';

// Данные обновлений - хранятся прямо в коде
const UPDATES_DATA = [
  {
    id: "alpha_016",
    title: "🎵 Alpha 16 - Тексты песен",
    date: "2026-01-13",
    type: "feature",
    changes: [
      "Красивая кнопка синхронизации текста",
      "Кнопка обновления текста в плеере",
      "Улучшен UI когда текст не найден",
      "Исправлен скип в мини-плеере"
    ]
  },
  {
    id: "alpha_015",
    title: "🎯 Alpha 15 - Любимые финал",
    date: "2026-01-13",
    type: "fix",
    changes: [
      "Любимые треки правее титула",
      "Компактный вид треков",
      "Исправлена почта - данные теперь встроены"
    ]
  },
  {
    id: "alpha_014",
    title: "📬 Alpha 14 - Почта переписана",
    date: "2026-01-13",
    type: "fix",
    changes: [
      "Полностью переписана MailView",
      "Данные загружаются напрямую из updates.json",
      "Changes теперь корректно отображаются",
      "Любимые под баннером в сетке 2x2"
    ]
  },
  {
    id: "alpha_013",
    title: "📬 Alpha 13 - Почта исправлена",
    date: "2026-01-13",
    type: "fix",
    changes: [
      "Полностью переписан NewsService",
      "Новости теперь всегда загружаются из updates.json",
      "Changes корректно отображаются в модалке",
      "Любимые треки справа от аватара"
    ]
  },
  {
    id: "alpha_012",
    title: "🎨 Alpha 12 - Любимые справа",
    date: "2026-01-13",
    type: "fix",
    changes: [
      "Любимые треки теперь справа от аватара",
      "Исправлено перекрытие аватара треками",
      "Треки растянуты на всю доступную ширину"
    ]
  },
  {
    id: "alpha_011",
    title: "🔧 Alpha 11 - Любимые 2x2",
    date: "2026-01-13",
    type: "fix",
    changes: [
      "Любимые треки теперь в сетке 2x2 под баннером",
      "Добавлена отладка для системы почты",
      "Исправлена загрузка changes из updates.json"
    ]
  },
  {
    id: "alpha_010",
    title: "🎨 Alpha 10 - UI Финальные фиксы",
    date: "2026-01-13",
    type: "fix",
    changes: [
      "Любимые треки теперь под баннером по центру",
      "Иконки сервисов заменены на текстовые надписи",
      "Исправлен цвет текста в новинках от артистов"
    ]
  },
  {
    id: "alpha_005",
    title: "🔔 Alpha 5 - Подписки на артистов",
    date: "2026-01-13",
    type: "feature",
    changes: [
      "Добавлена возможность подписываться на артистов",
      "Кнопка подписки на странице артиста в поиске",
      "Боковое меню режимов выполнения"
    ]
  },
  {
    id: "alpha_004",
    title: "🎨 Alpha 4 - Избранное в профиле",
    date: "2026-01-13",
    type: "feature",
    changes: [
      "Возможность прикреплять треки в профиль",
      "Избранное отображается справа от аватарки",
      "Модальное окно для выбора треков из лайков"
    ]
  },
  {
    id: "alpha_003",
    title: "🔧 Alpha 3 - Discord RPC Fix",
    date: "2026-01-13",
    type: "fix",
    changes: [
      "Исправлен Discord RPC - теперь стабильно работает",
      "Отключен Gateway режим (проблема с WebSocket)",
      "Стандартный RPC показывает Играет в Harmonix"
    ]
  },
  {
    id: "alpha_001",
    title: "🚀 Alpha 1 - Первый релиз",
    date: "2026-01-11",
    type: "release",
    changes: [
      "Переработана база данных (9 таблиц)",
      "Новая страница авторизации с капчей",
      "Discord Rich Presence с прогресс-баром",
      "Статистика синхронизируется с БД"
    ]
  },
  {
    id: "roadmap_v1",
    title: "📋 Roadmap",
    date: "2026-01-13",
    type: "roadmap",
    items: [
      { text: "Подписка на артистов", status: "done" },
      { text: "Прикрепление треков в профиль", status: "done" },
      { text: "Боковое меню режимов выполнения", status: "done" },
      { text: "Новинки от подписок на главной", status: "done" },
      { text: "Любимые треки растянуты в профиле", status: "done" },
      { text: "Просмотр профилей других юзеров", status: "soon" },
      { text: "Мини-профиль при наведении", status: "soon" },
      { text: "Загрузка аватарок с ПК", status: "soon" },
      { text: "Harmonix Premium подписка", status: "planned" }
    ]
  }
];

interface UpdateItem {
  id: string;
  title: string;
  date?: string;
  type: string;
  content?: string;
  items?: { text: string; status: string }[];
  changes?: string[];
  reward?: { type: string; amount?: number };
}

export function MailView() {
  const [news] = useState<UpdateItem[]>(UPDATES_DATA);
  const [selectedNews, setSelectedNews] = useState<UpdateItem | null>(null);
  const [deletedNews, setDeletedNews] = useState<string[]>([]);
  
  const { user, addCoins, updateProfile } = useUserStore();
  const readNews = user?.readNews || [];

  useEffect(() => {
    const saved = localStorage.getItem('harmonix-deleted-news');
    if (saved) setDeletedNews(JSON.parse(saved));
  }, []);

  const filteredNews = news.filter(n => !deletedNews.includes(n.id));
  const isRead = (id: string) => readNews.includes(id);

  const handleRead = (item: UpdateItem) => {
    setSelectedNews(item);
    if (!isRead(item.id) && !(item as any).reward) {
      updateProfile({ readNews: [...readNews, item.id] });
    }
  };

  const handleClaimReward = (item: UpdateItem) => {
    if (isRead(item.id)) return;
    // Монеты за письма отключены - выдаются только админом
    // if (item.reward?.type === 'coins' && item.reward.amount) {
    //   addCoins(item.reward.amount);
    // }
    updateProfile({ readNews: [...readNews, item.id] });
    window.dispatchEvent(new CustomEvent('show-toast', {
      detail: { message: 'Письмо прочитано', type: 'info' }
    }));
  };

  const handleDelete = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const newDeleted = [...deletedNews, id];
    setDeletedNews(newDeleted);
    localStorage.setItem('harmonix-deleted-news', JSON.stringify(newDeleted));
    if (selectedNews?.id === id) setSelectedNews(null);
  };

  const getTypeInfo = (type: string) => {
    switch (type) {
      case 'update': return { emoji: '🚀', text: 'Обновление', color: '#3b82f6' };
      case 'feature': return { emoji: '✨', text: 'Функция', color: '#10b981' };
      case 'fix': return { emoji: '🔧', text: 'Исправление', color: '#f59e0b' };
      case 'release': return { emoji: '🎉', text: 'Релиз', color: '#8b5cf6' };
      case 'roadmap': return { emoji: '📋', text: 'Roadmap', color: '#6366f1' };
      case 'event': return { emoji: '🎊', text: 'Событие', color: '#ec4899' };
      case 'promo': return { emoji: '🎁', text: 'Акция', color: '#f97316' };
      default: return { emoji: '📢', text: 'Новость', color: '#8b5cf6' };
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'done': return { icon: '✓', color: '#22c55e', bg: 'rgba(34,197,94,0.15)' };
      case 'progress': return { icon: '◐', color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' };
      case 'pending': return { icon: '?', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' };
      case 'soon': return { icon: '★', color: '#a855f7', bg: 'rgba(168,85,247,0.15)' };
      case 'planned': return { icon: '○', color: '#6b7280', bg: 'rgba(107,114,128,0.15)' };
      default: return { icon: '•', color: '#6b7280', bg: 'rgba(107,114,128,0.15)' };
    }
  };

  const unreadCount = filteredNews.filter(n => !isRead(n.id)).length;

  return (
    <div className="space-y-4">
      {unreadCount > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
          style={{ background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
          <span className="text-lg">📬</span>
          <span className="text-sm font-medium text-violet-400">
            {unreadCount} {unreadCount === 1 ? 'новое' : 'новых'}
          </span>
        </div>
      )}

      {filteredNews.length === 0 ? (
        <div className="text-center py-16 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)' }}>
          <div className="text-5xl mb-4">📭</div>
          <p className="text-base font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>Почта пуста</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNews.map(item => {
            const read = isRead(item.id);
            const hasReward = item.reward && !read;
            const typeInfo = getTypeInfo(item.type);
            const hasChanges = item.changes && item.changes.length > 0;
            const hasItems = item.items && item.items.length > 0;

            return (
              <div key={item.id}
                className="relative rounded-2xl cursor-pointer transition-all duration-200 group overflow-hidden hover:scale-[1.01]"
                style={{ 
                  background: read ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${read ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)'}`,
                  opacity: read ? 0.7 : 1,
                }}
                onClick={() => handleRead(item)}>
                
                {!read && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ background: typeInfo.color }} />
                )}
                
                <div className="p-4 pl-5">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
                      style={{ background: `${typeInfo.color}15`, border: `1px solid ${typeInfo.color}30` }}>
                      {typeInfo.emoji}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-sm" style={{ color: read ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.95)' }}>
                          {item.title}
                        </h3>
                        {!read && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase"
                            style={{ background: typeInfo.color, color: '#fff' }}>new</span>
                        )}
                      </div>
                      
                      {hasChanges && (
                        <p className="text-xs mb-2 line-clamp-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
                          {item.changes!.slice(0, 2).join(' • ')}
                          {item.changes!.length > 2 && ` (+${item.changes!.length - 2})`}
                        </p>
                      )}

                      {hasItems && !hasChanges && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {item.items!.slice(0, 3).map((pi, idx) => {
                            const status = getStatusInfo(pi.status);
                            return (
                              <span key={idx} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px]"
                                style={{ background: status.bg, color: status.color }}>
                                <span className="font-bold">{status.icon}</span>
                                <span className="truncate max-w-[80px]">{pi.text}</span>
                              </span>
                            );
                          })}
                        </div>
                      )}

                      <div className="flex items-center gap-3">
                        <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                          {item.date ? new Date(item.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) : ''}
                        </span>
                        {hasReward && (
                          <span className="text-[11px] font-medium flex items-center gap-1 text-violet-400">
                            +{item.reward?.amount} <MoniIcon className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                    </div>

                    <button onClick={(e) => handleDelete(item.id, e)}
                      className="p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/20">
                      <span className="text-sm">🗑️</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selectedNews && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={() => setSelectedNews(null)}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
          
          <div className="relative w-full max-w-lg rounded-3xl overflow-hidden"
            style={{ background: '#0a0a0f', border: '1px solid rgba(255,255,255,0.1)' }}
            onClick={e => e.stopPropagation()}>
            
            <div className="p-5 pb-4" style={{ background: `${getTypeInfo(selectedNews.type).color}10` }}>
              <button onClick={() => setSelectedNews(null)} 
                className="absolute top-4 right-4 w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white/10 transition-all"
                style={{ color: 'rgba(255,255,255,0.5)' }}>✕</button>

              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                  style={{ background: `${getTypeInfo(selectedNews.type).color}20` }}>
                  {getTypeInfo(selectedNews.type).emoji}
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: getTypeInfo(selectedNews.type).color }}>
                    {getTypeInfo(selectedNews.type).text}
                  </span>
                  <h3 className="font-bold text-lg text-white">{selectedNews.title}</h3>
                </div>
              </div>
              
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {selectedNews.date ? new Date(selectedNews.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
              </p>
            </div>

            <div className="p-5 pt-4 max-h-[50vh] overflow-y-auto">
              {/* Changes */}
              {selectedNews.changes && selectedNews.changes.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    Что нового
                  </p>
                  {selectedNews.changes.map((change, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 rounded-xl"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e' }}>
                        ✓
                      </div>
                      <span className="text-sm flex-1" style={{ color: 'rgba(255,255,255,0.85)' }}>{change}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Roadmap items */}
              {selectedNews.items && selectedNews.items.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    План развития
                  </p>
                  {selectedNews.items.map((item, idx) => {
                    const status = getStatusInfo(item.status);
                    return (
                      <div key={idx} className="flex items-center gap-3 p-3 rounded-xl"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
                          style={{ background: status.bg, color: status.color }}>
                          {status.icon}
                        </div>
                        <span className="text-sm flex-1" style={{ color: 'rgba(255,255,255,0.85)' }}>{item.text}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Content */}
              {selectedNews.content && !selectedNews.changes?.length && !selectedNews.items?.length && (
                <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <p className="text-sm whitespace-pre-line" style={{ color: 'rgba(255,255,255,0.75)' }}>{selectedNews.content}</p>
                </div>
              )}

              {/* Empty */}
              {!selectedNews.changes?.length && !selectedNews.items?.length && !selectedNews.content && (
                <div className="text-center py-8">
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Нет подробной информации</p>
                </div>
              )}
            </div>

            {/* Reward */}
            {selectedNews.reward && (
              <div className="px-5 pb-4">
                <div className="rounded-xl p-4" style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(168, 85, 247, 0.05))', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ background: 'rgba(139, 92, 246, 0.2)' }}>🎁</div>
                      <div>
                        <p className="text-xs text-violet-400">Награда</p>
                        <p className="text-lg font-bold text-violet-300 flex items-center gap-1">+{selectedNews.reward.amount} <MoniIcon className="w-4 h-4" /></p>
                      </div>
                    </div>
                    {!isRead(selectedNews.id) ? (
                      <button onClick={() => { handleClaimReward(selectedNews); setSelectedNews(null); }}
                        className="px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:scale-105"
                        style={{ background: 'linear-gradient(135deg, #8B5CF6, #A78BFA)' }}>Забрать</button>
                    ) : (
                      <span className="px-3 py-1.5 rounded-xl text-xs text-green-400" style={{ background: 'rgba(34, 197, 94, 0.1)' }}>✓ Получено</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="p-5 pt-0 flex gap-3">
              <button onClick={() => handleDelete(selectedNews.id)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all hover:scale-[1.02]"
                style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.2)' }}>Удалить</button>
              <button onClick={() => setSelectedNews(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all hover:scale-[1.02]"
                style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.1)' }}>Закрыть</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
