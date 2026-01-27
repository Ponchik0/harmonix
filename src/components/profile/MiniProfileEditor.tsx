import { useState } from 'react';
import { HiOutlinePhoto, HiOutlineSparkles, HiOutlineCheck, HiOutlineXMark } from 'react-icons/hi2';
import { useUserStore } from '../../stores/userStore';
import { useThemeStore } from '../../stores/themeStore';
import { shopService } from '../../services/ShopService';

export function MiniProfileEditor() {
  const [customImageUrl, setCustomImageUrl] = useState('');
  const { user, ownedItems, equippedItems, equipItem, updateMiniProfileBg } = useUserStore();
  const { currentTheme } = useThemeStore();
  const colors = currentTheme.colors;

  if (!user) return null;

  const backgrounds = shopService.getItemsByCategory('backgrounds').filter(item => ownedItems.includes(item.id));
  const currentBgId = equippedItems.background || '';
  
  // Проверяем есть ли кастомный фон (URL)
  const hasCustomBg = user.miniProfileBg && user.miniProfileBgType === 'image';
  const hasAnyBg = currentBgId || hasCustomBg;

  const handleSelectBg = (item: any) => {
    // Toggle: if already equipped, unequip
    if (equippedItems.background === item.id) {
      equipItem('background', '');
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { message: 'Фон снят!', type: 'success' }
      }));
      return;
    }
    // Сбрасываем кастомный фон при выборе из магазина
    if (hasCustomBg) {
      updateMiniProfileBg('', 'default');
    }
    equipItem('background', item.id);
    window.dispatchEvent(new CustomEvent('show-toast', {
      detail: { message: 'Фон применён!', type: 'success' }
    }));
  };

  const handleCustomImage = () => {
    if (!customImageUrl.trim()) return;
    // Сбрасываем фон из магазина при установке кастомного
    if (currentBgId) {
      equipItem('background', '');
    }
    updateMiniProfileBg(customImageUrl, 'image');
    setCustomImageUrl('');
    window.dispatchEvent(new CustomEvent('show-toast', {
      detail: { message: 'Кастомный фон применён!', type: 'success' }
    }));
  };

  const handleResetBg = () => {
    equipItem('background', '');
    updateMiniProfileBg('', 'default');
    window.dispatchEvent(new CustomEvent('show-toast', {
      detail: { message: 'Фон сброшен!', type: 'success' }
    }));
  };

  return (
    <div className="space-y-4">
      {/* Current Custom Background Preview */}
      {hasCustomBg && (
        <div className="space-y-2">
          <label className="text-sm font-medium" style={{ color: colors.textPrimary }}>
            Текущий кастомный фон
          </label>
          <div className="relative h-24 rounded-xl overflow-hidden" style={{ border: `2px solid #22c55e` }}>
            <img src={user.miniProfileBg} alt="Custom background" className="w-full h-full object-cover" />
            <button
              onClick={handleResetBg}
              className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-all hover:scale-110"
              style={{ background: 'rgba(239, 68, 68, 0.9)' }}
              title="Удалить фон"
            >
              <HiOutlineXMark className="w-4 h-4 text-white" />
            </button>
            <div className="absolute bottom-2 left-2 px-2 py-1 rounded-lg text-[10px] font-medium" style={{ background: 'rgba(0,0,0,0.6)', color: '#fff' }}>
              Кастомный URL
            </div>
          </div>
        </div>
      )}

      {/* Premium Banner */}
      {!user.isPremium && (
        <div 
          className="p-4 rounded-xl flex items-center gap-3"
          style={{ 
            background: `linear-gradient(135deg, ${colors.accent}15, ${colors.accent}05)`,
            border: `1px solid ${colors.accent}30`
          }}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: colors.accent }}>
            <HiOutlineSparkles className="w-5 h-5" style={{ color: 'var(--interactive-accent-text)' }} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
              Кастомные фото — только для Premium
            </p>
            <p className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>
              Получи доступ к загрузке своих изображений
            </p>
          </div>
        </div>
      )}

      {/* Custom Image Input */}
      {user.isPremium && (
        <div className="space-y-2">
          <label className="text-sm font-medium" style={{ color: colors.textPrimary }}>
            Кастомное изображение
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={customImageUrl}
              onChange={(e) => setCustomImageUrl(e.target.value)}
              placeholder="URL изображения..."
              className="flex-1 px-3 py-2 rounded-lg text-sm"
              style={{
                background: colors.surface,
                color: colors.textPrimary,
                border: `1px solid ${colors.textSecondary}20`
              }}
            />
            <button
              onClick={handleCustomImage}
              disabled={!customImageUrl.trim()}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
              style={{ background: colors.accent, color: 'var(--interactive-accent-text)' }}
            >
              Применить
            </button>
          </div>
        </div>
      )}

      {/* Owned Backgrounds */}
      <div className="space-y-2">
        <label className="text-sm font-medium" style={{ color: colors.textPrimary }}>
          Купленные фоны ({backgrounds.length})
        </label>
        
        {backgrounds.length === 0 ? (
          <div 
            className="text-center py-8 rounded-xl"
            style={{ background: `${colors.textSecondary}05`, border: `1px dashed ${colors.textSecondary}20` }}
          >
            <HiOutlinePhoto className="w-8 h-8 mx-auto mb-2" style={{ color: colors.textSecondary }} />
            <p className="text-sm" style={{ color: colors.textSecondary }}>
              Купи фоны в магазине
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {backgrounds.map(bg => {
              const isActive = currentBgId === bg.id && !hasCustomBg;
              const isImage = bg.preview.startsWith('/') || bg.preview.startsWith('./') || bg.preview.startsWith('http');
              
              return (
                <button
                  key={bg.id}
                  onClick={() => handleSelectBg(bg)}
                  className="relative h-20 rounded-xl overflow-hidden transition-all hover:scale-105"
                  style={{
                    background: isImage ? undefined : bg.preview,
                    border: `2px solid ${isActive ? '#22c55e' : 'transparent'}`
                  }}
                >
                  {isImage && (
                    <img src={bg.preview} alt={bg.name} className="w-full h-full object-cover" />
                  )}
                  {isActive && (
                    <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                      <HiOutlineCheck className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Reset to Default */}
      {hasAnyBg && (
        <button
          onClick={handleResetBg}
          className="w-full py-2 rounded-lg text-sm font-medium transition-all hover:opacity-80"
          style={{ background: `${colors.textSecondary}10`, color: colors.textSecondary }}
        >
          Сбросить на стандартный
        </button>
      )}
    </div>
  );
}
