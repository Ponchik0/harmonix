import { useState } from 'react';
import {
  HiOutlineAtSymbol,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineCheck,
  HiOutlineXMark,
  HiOutlineStar,
} from 'react-icons/hi2';
import { useUsernamesStore } from '../../stores/usernamesStore';
import { useUserStore } from '../../stores/userStore';
import { useThemeStore } from '../../stores/themeStore';
import { MoniIcon } from '../common/MoniIcon';

export function UsernamesManager() {
  const [isAdding, setIsAdding] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [error, setError] = useState('');
  const [isRateLimited, setIsRateLimited] = useState(false);

  const { user } = useUserStore();
  const { 
    extraUsernames, 
    activeUsername, 
    maxSlots,
    addUsername, 
    removeUsername, 
    setActiveUsername,
    getNextSlotPrice,
    canAddMore,
    hasUsername,
    incrementMaxSlots,
  } = useUsernamesStore();
  const { currentTheme } = useThemeStore();
  const colors = currentTheme.colors;

  const handleAddUsername = () => {
    console.log('[UsernamesManager] handleAddUsername called with:', newUsername);
    setError('');
    
    if (isRateLimited) {
      console.log('[UsernamesManager] Already rate limited, ignoring request');
      return;
    }
    
    if (!newUsername.trim()) {
      setError('Введите юзернейм');
      return;
    }

    if (newUsername.length < 3) {
      setError('Минимум 3 символа');
      return;
    }

    if (newUsername.length > 20) {
      setError('Максимум 20 символов');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(newUsername)) {
      setError('Только буквы, цифры и _');
      return;
    }

    if (hasUsername(newUsername) || newUsername.toLowerCase() === user?.username?.toLowerCase()) {
      setError('Этот юзернейм уже занят');
      return;
    }

    if (!canAddMore()) {
      setError('Нет свободных слотов');
      return;
    }

    console.log('[UsernamesManager] All checks passed, calling addUsername');
    const success = addUsername(newUsername);
    console.log('[UsernamesManager] addUsername result:', success);
    
    if (success) {
      setNewUsername('');
      setIsAdding(false);
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { message: 'Юзернейм добавлен!', type: 'success' }
      }));
    } else {
      // Если addUsername вернул false, но все проверки прошли - это рейт-лимит
      setError('Слишком быстро! Максимум 2 запроса в секунду');
      setIsRateLimited(true);
      
      // Убираем блокировку через 1 секунду
      setTimeout(() => {
        setIsRateLimited(false);
        setError('');
      }, 1000);
      
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { message: 'Превышен лимит запросов (2/сек)', type: 'error' }
      }));
    }
  };

  const handleBuySlot = () => {
    const price = getNextSlotPrice();
    const { coins, addCoins } = useUserStore.getState();
    
    if (coins < price) {
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { message: 'Недостаточно монет', type: 'error' }
      }));
      return;
    }

    addCoins(-price);
    incrementMaxSlots();
    window.dispatchEvent(new CustomEvent('show-toast', {
      detail: { message: '+1 слот для юзернейма!', type: 'success' }
    }));
  };

  const handleSetActive = (id: string | null) => {
    setActiveUsername(id);
    const name = id ? extraUsernames.find(u => u.id === id)?.username : user?.username;
    window.dispatchEvent(new CustomEvent('show-toast', {
      detail: { message: `Активный юзернейм: @${name}`, type: 'success' }
    }));
  };

  const usedSlots = extraUsernames.length + 1; // +1 for main username
  const availableSlots = maxSlots - usedSlots;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HiOutlineAtSymbol className="w-5 h-5" style={{ color: colors.accent }} />
          <span className="font-semibold" style={{ color: colors.textPrimary }}>Юзернеймы</span>
        </div>
        <span className="text-xs px-2 py-1 rounded-full" style={{ background: `${colors.accent}20`, color: colors.accent }}>
          {usedSlots}/{maxSlots} слотов
        </span>
      </div>

      {/* Main username */}
      <div
        className="p-3 rounded-xl flex items-center gap-3 cursor-pointer transition-all"
        style={{ 
          background: !activeUsername ? `${colors.accent}15` : `${colors.textSecondary}08`,
          border: `1px solid ${!activeUsername ? colors.accent : `${colors.textSecondary}15`}`,
        }}
        onClick={() => handleSetActive(null)}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: `${colors.accent}20` }}
        >
          <HiOutlineStar className="w-5 h-5" style={{ color: colors.accent }} />
        </div>
        <div className="flex-1">
          <p className="font-medium" style={{ color: colors.textPrimary }}>@{user?.username}</p>
          <p className="text-xs" style={{ color: colors.textSecondary }}>Основной</p>
        </div>
        {!activeUsername && (
          <HiOutlineCheck className="w-5 h-5" style={{ color: colors.accent }} />
        )}
      </div>

      {/* Extra usernames */}
      {extraUsernames.map((u) => (
        <div
          key={u.id}
          className="p-3 rounded-xl flex items-center gap-3 cursor-pointer transition-all group"
          style={{ 
            background: activeUsername === u.id ? `${colors.accent}15` : `${colors.textSecondary}08`,
            border: `1px solid ${activeUsername === u.id ? colors.accent : `${colors.textSecondary}15`}`,
          }}
          onClick={() => handleSetActive(u.id)}
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: `${colors.textSecondary}15` }}
          >
            <HiOutlineAtSymbol className="w-5 h-5" style={{ color: colors.textSecondary }} />
          </div>
          <div className="flex-1">
            <p className="font-medium" style={{ color: colors.textPrimary }}>@{u.username}</p>
            <p className="text-xs" style={{ color: colors.textSecondary }}>
              Добавлен {new Date(u.createdAt).toLocaleDateString('ru-RU')}
            </p>
          </div>
          {activeUsername === u.id && (
            <HiOutlineCheck className="w-5 h-5" style={{ color: colors.accent }} />
          )}
          <button
            onClick={(e) => { e.stopPropagation(); removeUsername(u.id); }}
            className="p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/20"
          >
            <HiOutlineTrash className="w-4 h-4 text-red-400" />
          </button>
        </div>
      ))}

      {/* Add new username */}
      {isAdding ? (
        <div className="p-3 rounded-xl space-y-3" style={{ background: `${colors.textSecondary}08`, border: `1px solid ${colors.textSecondary}15` }}>
          <div className="flex items-center gap-2">
            <span className="text-lg" style={{ color: colors.textSecondary }}>@</span>
            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              placeholder="новый_юзернейм"
              maxLength={20}
              className="flex-1 bg-transparent focus:outline-none"
              style={{ color: colors.textPrimary }}
              autoFocus
            />
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleAddUsername}
              disabled={isRateLimited}
              className="flex-1 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                background: isRateLimited ? `${colors.textSecondary}30` : colors.accent, 
                color: isRateLimited ? colors.textSecondary : 'var(--interactive-accent-text)' 
              }}
            >
              {isRateLimited ? 'Подождите...' : 'Добавить'}
            </button>
            <button
              onClick={() => { setIsAdding(false); setNewUsername(''); setError(''); }}
              className="px-4 py-2 rounded-lg text-sm"
              style={{ background: `${colors.textSecondary}15`, color: colors.textSecondary }}
            >
              <HiOutlineXMark className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : availableSlots > 0 ? (
        <button
          onClick={() => setIsAdding(true)}
          className="w-full p-3 rounded-xl flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
          style={{ background: `${colors.textSecondary}08`, border: `1px dashed ${colors.textSecondary}30`, color: colors.textSecondary }}
        >
          <HiOutlinePlus className="w-4 h-4" />
          Добавить юзернейм
        </button>
      ) : null}

      {/* Buy more slots */}
      <button
        onClick={handleBuySlot}
        className="w-full p-4 rounded-xl flex items-center gap-3 transition-all hover:scale-[1.01]"
        style={{ 
          background: `linear-gradient(135deg, ${colors.accent}15, ${colors.secondary}15)`,
          border: `1px solid ${colors.accent}30`,
        }}
      >
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ background: `${colors.accent}20` }}
        >
          <HiOutlinePlus className="w-6 h-6" style={{ color: colors.accent }} />
        </div>
        <div className="flex-1 text-left">
          <p className="font-semibold" style={{ color: colors.textPrimary }}>Купить +1 слот</p>
          <p className="text-xs" style={{ color: colors.textSecondary }}>
            Для дополнительного юзернейма
          </p>
        </div>
        <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg" style={{ background: `${colors.accent}20` }}>
          <MoniIcon className="w-4 h-4" />
          <span className="font-bold" style={{ color: colors.accent }}>{getNextSlotPrice()}</span>
        </div>
      </button>
    </div>
  );
}
