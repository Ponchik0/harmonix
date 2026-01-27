import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabaseService } from '../services/SupabaseService';

export interface ExtraUsername {
  id: string;
  username: string;
  createdAt: string;
  isActive: boolean;
}

// Рейт-лимит для создания юзернеймов
const RATE_LIMIT_WINDOW = 1000; // 1 секунда
const MAX_REQUESTS_PER_WINDOW = 2; // максимум 2 запроса в секунду

interface RateLimitState {
  requests: number[];
  lastCleanup: number;
}

const rateLimitState: RateLimitState = {
  requests: [],
  lastCleanup: Date.now(),
};

const checkRateLimit = (): boolean => {
  const now = Date.now();
  
  console.log('[RateLimit] Checking rate limit, current requests:', rateLimitState.requests.length);
  
  // Очищаем старые запросы (старше 1 секунды)
  const oldRequestsCount = rateLimitState.requests.length;
  rateLimitState.requests = rateLimitState.requests.filter(
    timestamp => now - timestamp < RATE_LIMIT_WINDOW
  );
  
  if (rateLimitState.requests.length !== oldRequestsCount) {
    console.log('[RateLimit] Cleaned old requests:', oldRequestsCount, '->', rateLimitState.requests.length);
  }
  
  rateLimitState.lastCleanup = now;
  
  // Проверяем лимит
  if (rateLimitState.requests.length >= MAX_REQUESTS_PER_WINDOW) {
    console.warn(`[RateLimit] BLOCKED: ${rateLimitState.requests.length}/${MAX_REQUESTS_PER_WINDOW} requests in last ${RATE_LIMIT_WINDOW}ms`);
    console.warn('[RateLimit] Request timestamps:', rateLimitState.requests.map(t => now - t));
    return false; // Превышен лимит
  }
  
  // Добавляем текущий запрос
  rateLimitState.requests.push(now);
  console.log(`[RateLimit] ALLOWED: ${rateLimitState.requests.length}/${MAX_REQUESTS_PER_WINDOW} requests in current window`);
  return true; // Запрос разрешен
};

// Текущий userId для привязки данных
let currentUserId: string | null = null;

// Синхронизация с БД
const syncToCloud = async (usernames: ExtraUsername[]) => {
  if (!currentUserId) return;
  try {
    const usernamesForDb = usernames.map(u => u.username);
    await supabaseService.updateUser(currentUserId, { 
      extra_usernames: usernamesForDb,
    } as any);
    console.log('[Usernames] Synced to cloud:', usernamesForDb.length, 'usernames');
  } catch (e) {
    console.error('[Usernames] Sync error:', e);
  }
};

interface UsernamesState {
  extraUsernames: ExtraUsername[];
  activeUsername: string | null;
  maxSlots: number;
  currentUserId: string | null;
  
  setUsernames: (usernames: ExtraUsername[]) => void;
  addUsername: (username: string) => boolean;
  removeUsername: (id: string) => void;
  setActiveUsername: (id: string | null) => void;
  incrementMaxSlots: () => void;
  getNextSlotPrice: () => number;
  canAddMore: () => boolean;
  hasUsername: (username: string) => boolean;
  
  // User management
  setUserId: (userId: string | null) => void;
  loadUserData: () => void;
  clearData: () => void;
}

export const useUsernamesStore = create<UsernamesState>()(
  persist(
    (set, get) => ({
      extraUsernames: [],
      activeUsername: null,
      maxSlots: 1,
      currentUserId: null,

      setUsernames: (usernames) => {
        set({ extraUsernames: usernames });
        syncToCloud(usernames);
      },

      addUsername: (username) => {
        console.log('[Usernames] Attempting to add username:', username);
        
        // Проверяем рейт-лимит
        if (!checkRateLimit()) {
          console.warn('[Usernames] Rate limit exceeded: max 2 requests per second');
          return false;
        }
        
        console.log('[Usernames] Rate limit check passed');
        
        const { extraUsernames, maxSlots, hasUsername } = get();
        
        if (hasUsername(username)) {
          console.log('[Usernames] Username already exists');
          return false;
        }
        
        if (extraUsernames.length >= maxSlots - 1) {
          console.log('[Usernames] No available slots');
          return false;
        }

        const newUsername: ExtraUsername = {
          id: `usr_${Date.now()}`,
          username: username.toLowerCase(),
          createdAt: new Date().toISOString(),
          isActive: false,
        };

        const newUsernames = [...extraUsernames, newUsername];
        set({ extraUsernames: newUsernames });
        syncToCloud(newUsernames);
        console.log('[Usernames] Username added successfully:', username);
        return true;
      },

      removeUsername: (id) => {
        const { extraUsernames, activeUsername } = get();
        const newUsernames = extraUsernames.filter(u => u.id !== id);
        set({
          extraUsernames: newUsernames,
          activeUsername: activeUsername === id ? null : activeUsername,
        });
        syncToCloud(newUsernames);
      },

      setActiveUsername: (id) => {
        const { extraUsernames } = get();
        set({
          extraUsernames: extraUsernames.map(u => ({
            ...u,
            isActive: u.id === id,
          })),
          activeUsername: id,
        });
      },

      incrementMaxSlots: () => {
        const newMaxSlots = get().maxSlots + 1;
        set({ maxSlots: newMaxSlots });
        // Сохраняем в localStorage с привязкой к userId
        if (currentUserId) {
          localStorage.setItem(`harmonix-usernames-slots-${currentUserId}`, String(newMaxSlots));
        }
      },

      getNextSlotPrice: () => {
        const { maxSlots } = get();
        return 200 * Math.pow(2, maxSlots - 1);
      },

      canAddMore: () => {
        const { extraUsernames, maxSlots } = get();
        return extraUsernames.length < maxSlots - 1;
      },

      hasUsername: (username) => {
        const { extraUsernames } = get();
        return extraUsernames.some(u => u.username.toLowerCase() === username.toLowerCase());
      },
      
      setUserId: (userId) => {
        currentUserId = userId;
        set({ currentUserId: userId });
        
        if (userId) {
          // Загружаем данные для этого пользователя
          get().loadUserData();
        } else {
          // Очищаем данные при выходе
          get().clearData();
        }
      },
      
      loadUserData: () => {
        if (!currentUserId) return;
        
        // Загружаем maxSlots из localStorage
        const savedSlots = localStorage.getItem(`harmonix-usernames-slots-${currentUserId}`);
        if (savedSlots) {
          set({ maxSlots: parseInt(savedSlots, 10) || 1 });
        } else {
          set({ maxSlots: 1 });
        }
        
        // Загружаем юзернеймы из localStorage (привязанные к userId)
        const savedData = localStorage.getItem(`harmonix-usernames-data-${currentUserId}`);
        if (savedData) {
          try {
            const data = JSON.parse(savedData);
            set({ 
              extraUsernames: data.extraUsernames || [],
              activeUsername: data.activeUsername || null,
            });
          } catch (e) {
            console.error('[Usernames] Failed to load data:', e);
            set({ extraUsernames: [], activeUsername: null });
          }
        } else {
          set({ extraUsernames: [], activeUsername: null });
        }
      },
      
      clearData: () => {
        set({ 
          extraUsernames: [], 
          activeUsername: null, 
          maxSlots: 1,
          currentUserId: null,
        });
      },
    }),
    {
      name: 'harmonix-usernames',
      // Кастомное сохранение с привязкой к userId
      storage: {
        getItem: () => null, // Не используем стандартное хранилище
        setItem: (_, value) => {
          // Сохраняем данные с привязкой к userId
          if (currentUserId && value) {
            try {
              // value is StorageValue type, need to handle it properly
              const valueStr = typeof value === 'string' ? value : JSON.stringify(value);
              const data = JSON.parse(valueStr);
              localStorage.setItem(`harmonix-usernames-data-${currentUserId}`, JSON.stringify({
                extraUsernames: data.state?.extraUsernames || [],
                activeUsername: data.state?.activeUsername || null,
              }));
            } catch (e) {
              console.error('[Usernames] Failed to save:', e);
            }
          }
        },
        removeItem: () => {},
      },
    }
  )
);

// Экспортируем функцию для установки userId (вызывается из App.tsx)
export const setUsernamesUserId = (userId: string | null) => {
  useUsernamesStore.getState().setUserId(userId);
};
