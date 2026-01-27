import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  HiOutlineAtSymbol,
  HiOutlineStar,
  HiOutlineCheck,
  HiOutlineMagnifyingGlass,
  HiOutlinePlus,
  HiOutlineXMark,
} from 'react-icons/hi2';
import { useUsernamesStore } from '../../stores/usernamesStore';
import { useUserStore } from '../../stores/userStore';
import { useThemeStore } from '../../stores/themeStore';
import { MoniIcon } from '../common/MoniIcon';

interface UsernamePopoverProps {
  children: React.ReactNode;
}

export function UsernamePopover({ children }: UsernamePopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false); // Для анимации
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingUsername, setIsAddingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [addError, setAddError] = useState('');
  const [isRateLimited, setIsRateLimited] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [position, setPosition] = useState({ left: 0, top: 0, openUp: false });

  const { user, coins, addCoins } = useUserStore();
  const { extraUsernames, activeUsername, setActiveUsername, addUsername, maxSlots, getNextSlotPrice, canAddMore, hasUsername, incrementMaxSlots } = useUsernamesStore();
  const { currentTheme } = useThemeStore();
  const colors = currentTheme.colors;

  // Update position when opening
  const updatePosition = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const popoverHeight = 380;
      const popoverWidth = 280;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      
      const openUp = spaceBelow < popoverHeight && spaceAbove > spaceBelow;
      
      let left = rect.left;
      let top = openUp ? rect.top - popoverHeight - 8 : rect.bottom + 8;
      
      // Не выходить за правый край
      if (left + popoverWidth > window.innerWidth - 16) {
        left = window.innerWidth - popoverWidth - 16;
      }
      // Не выходить за левый край
      if (left < 16) {
        left = 16;
      }
      // Не выходить за верхний край
      if (top < 16) {
        top = 16;
      }
      // Не выходить за нижний край
      if (top + popoverHeight > window.innerHeight - 16) {
        top = window.innerHeight - popoverHeight - 16;
      }
      
      setPosition({ left, top, openUp });
    }
  };

  // Открытие с анимацией
  const openPopover = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setIsOpen(true);
    requestAnimationFrame(() => setIsVisible(true));
  };

  // Закрытие с анимацией
  const closePopover = () => {
    setIsVisible(false);
    closeTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
      setSearchQuery('');
    }, 200); // Время анимации
  };

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isOpen]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
          closePopover();
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    openPopover();
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      closePopover();
    }, 300);
  };

  const handlePopoverEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  const handleSetActive = (id: string | null) => {
    setActiveUsername(id);
    const name = id ? extraUsernames.find(u => u.id === id)?.username : user?.username;
    window.dispatchEvent(new CustomEvent('show-toast', {
      detail: { message: `Активный: @${name}`, type: 'success' }
    }));
  };

  const handleAddUsername = () => {
    setAddError('');
    
    if (isRateLimited) return;
    
    if (!newUsername.trim()) {
      setAddError('Введите юзернейм');
      return;
    }

    if (newUsername.length < 3) {
      setAddError('Минимум 3 символа');
      return;
    }

    if (newUsername.length > 20) {
      setAddError('Максимум 20 символов');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(newUsername)) {
      setAddError('Только буквы, цифры и _');
      return;
    }

    if (hasUsername(newUsername) || newUsername.toLowerCase() === user?.username?.toLowerCase()) {
      setAddError('Этот юзернейм уже занят');
      return;
    }

    if (!canAddMore()) {
      setAddError('Нет свободных слотов');
      return;
    }

    const success = addUsername(newUsername);
    
    if (success) {
      setNewUsername('');
      setIsAddingUsername(false);
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { message: 'Юзернейм добавлен!', type: 'success' }
      }));
    } else {
      setAddError('Подождите 1 секунду...');
      setIsRateLimited(true);
      setTimeout(() => {
        setIsRateLimited(false);
        setAddError('');
      }, 1000);
    }
  };

  const handleBuySlot = () => {
    const price = getNextSlotPrice();
    
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

  const usedSlots = extraUsernames.length + 1;
  const availableSlots = maxSlots - usedSlots;

  const allUsernames = [
    { id: null, username: user?.username || '', isMain: true },
    ...extraUsernames.map(u => ({ id: u.id, username: u.username, isMain: false })),
  ];

  // Filter usernames by search
  const filteredUsernames = allUsernames.filter(u => 
    u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const popoverContent = isOpen ? (
    <div 
      ref={popoverRef}
      className="fixed z-[9999] w-[280px] rounded-2xl overflow-hidden shadow-2xl transition-all duration-200"
      style={{ 
        background: "rgba(15, 15, 20, 0.95)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        border: `1px solid rgba(255,255,255,0.12)`,
        boxShadow: `0 25px 50px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05) inset`,
        left: position.left,
        top: position.top,
        opacity: isVisible ? 1 : 0,
        transform: isVisible 
          ? 'translateY(0) scale(1)' 
          : position.openUp 
            ? 'translateY(10px) scale(0.95)' 
            : 'translateY(-10px) scale(0.95)',
      }}
      onMouseEnter={handlePopoverEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Header with glow */}
      <div 
        className="p-4 relative overflow-hidden"
        style={{ 
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          background: "linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 100%)",
        }}
      >
        {/* Accent glow */}
        <div 
          className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-20"
          style={{ background: colors.accent }}
        />
        
        <div className="flex items-center gap-3 relative">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ 
              background: `linear-gradient(135deg, ${colors.accent}30, ${colors.accent}10)`,
              border: `1px solid ${colors.accent}30`,
            }}
          >
            <HiOutlineAtSymbol className="w-5 h-5" style={{ color: colors.accent }} />
          </div>
          <div>
            <h3 className="text-sm font-bold" style={{ color: "#fff" }}>Мои юзернеймы</h3>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
              {allUsernames.length} {allUsernames.length === 1 ? 'аккаунт' : 'аккаунтов'}
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-2">
        <div 
          className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all"
          style={{ 
            background: "rgba(255,255,255,0.05)",
            border: searchQuery ? `1px solid ${colors.accent}50` : "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <HiOutlineMagnifyingGlass 
            className="w-4 h-4 flex-shrink-0" 
            style={{ color: searchQuery ? colors.accent : "rgba(255,255,255,0.4)" }} 
          />
          <input
            type="text"
            placeholder="Поиск..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/30"
            style={{ color: "#fff" }}
          />
        </div>
      </div>

      {/* Usernames list */}
      <div className="px-2 pb-3 max-h-[280px] overflow-y-auto scrollbar-hide">
        {filteredUsernames.length === 0 ? (
          <div className="text-center py-6">
            <HiOutlineAtSymbol className="w-8 h-8 mx-auto mb-2" style={{ color: "rgba(255,255,255,0.2)" }} />
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Не найдено</p>
          </div>
        ) : (
          filteredUsernames.map((u, index) => {
            const isActive = (u.id === null && !activeUsername) || u.id === activeUsername;
            return (
              <button
                key={u.id || 'main'}
                onClick={() => handleSetActive(u.id)}
                className="w-full flex items-center gap-3 p-3 rounded-xl transition-all hover:scale-[1.02] group"
                style={{ 
                  background: isActive ? `${colors.accent}15` : 'transparent',
                  border: isActive ? `1px solid ${colors.accent}30` : '1px solid transparent',
                  animation: `itemSlideIn 0.2s ease-out ${index * 0.05}s both`,
                }}
              >
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-transform group-hover:scale-110"
                  style={{ 
                    background: u.isMain 
                      ? `linear-gradient(135deg, ${colors.accent}40, ${colors.accent}20)` 
                      : "rgba(255,255,255,0.08)",
                    border: u.isMain ? `1px solid ${colors.accent}40` : "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  {u.isMain ? (
                    <HiOutlineStar className="w-5 h-5" style={{ color: colors.accent }} />
                  ) : (
                    <HiOutlineAtSymbol className="w-5 h-5" style={{ color: "rgba(255,255,255,0.6)" }} />
                  )}
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold" style={{ color: "#fff" }}>@{u.username}</p>
                  <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>
                    {u.isMain ? "Основной аккаунт" : "Дополнительный"}
                  </p>
                </div>
                {isActive && (
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ background: colors.accent }}
                  >
                    <HiOutlineCheck className="w-4 h-4" style={{ color: "var(--interactive-accent-text)" }} />
                  </div>
                )}
              </button>
            );
          })
        )}
      </div>

      {/* Add Username Section */}
      <div 
        className="px-3 py-3 space-y-2"
        style={{ 
          borderTop: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(0,0,0,0.15)",
        }}
      >
        {isAddingUsername ? (
          <div className="space-y-2">
            <div 
              className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ 
                background: "rgba(255,255,255,0.05)",
                border: addError ? "1px solid rgba(239,68,68,0.5)" : "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <span className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>@</span>
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="новый_юзернейм"
                maxLength={20}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/30"
                style={{ color: "#fff" }}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleAddUsername()}
              />
            </div>
            {addError && (
              <p className="text-[10px] text-red-400 px-1">{addError}</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={handleAddUsername}
                disabled={isRateLimited}
                className="flex-1 py-2 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
                style={{ 
                  background: isRateLimited ? "rgba(255,255,255,0.1)" : colors.accent, 
                  color: isRateLimited ? "rgba(255,255,255,0.5)" : "var(--interactive-accent-text)" 
                }}
              >
                {isRateLimited ? 'Подождите...' : 'Добавить'}
              </button>
              <button
                onClick={() => { setIsAddingUsername(false); setNewUsername(''); setAddError(''); }}
                className="px-3 py-2 rounded-lg text-xs"
                style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}
              >
                <HiOutlineXMark className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : availableSlots > 0 ? (
          <button
            onClick={() => setIsAddingUsername(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium transition-all hover:scale-[1.02]"
            style={{ 
              background: `${colors.accent}15`,
              border: `1px dashed ${colors.accent}40`,
              color: colors.accent,
            }}
          >
            <HiOutlinePlus className="w-4 h-4" />
            Добавить юзернейм
          </button>
        ) : (
          <button
            onClick={handleBuySlot}
            className="w-full flex items-center justify-between py-2.5 px-3 rounded-xl text-xs transition-all hover:scale-[1.02]"
            style={{ 
              background: `linear-gradient(135deg, ${colors.accent}15, ${colors.accent}08)`,
              border: `1px solid ${colors.accent}30`,
            }}
          >
            <div className="flex items-center gap-2">
              <HiOutlinePlus className="w-4 h-4" style={{ color: colors.accent }} />
              <span style={{ color: "#fff" }}>Купить +1 слот</span>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ background: `${colors.accent}20` }}>
              <MoniIcon className="w-3 h-3" />
              <span className="font-bold" style={{ color: colors.accent }}>{getNextSlotPrice()}</span>
            </div>
          </button>
        )}
        
        {/* Slots info */}
        <p className="text-[10px] text-center" style={{ color: "rgba(255,255,255,0.3)" }}>
          {usedSlots}/{maxSlots} слотов использовано
        </p>
      </div>

      <style>{`
        @keyframes itemSlideIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  ) : null;

  return (
    <div 
      ref={containerRef}
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {createPortal(popoverContent, document.body)}
    </div>
  );
}
