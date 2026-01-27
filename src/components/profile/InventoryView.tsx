import { useState } from 'react';
import {
  HiOutlineCheck,
  HiOutlineSparkles,
  HiOutlineMusicalNote,
  HiOutlineHeart,
  HiOutlineMagnifyingGlass,
  HiOutlineMoon,
  HiOutlineAdjustmentsHorizontal,
  HiOutlineMicrophone,
  HiOutlineSquares2X2,
  HiOutlineStar,
  HiOutlineTrophy,
  HiOutlineFire,
  HiOutlineBolt,
  HiOutlinePhoto,
  HiOutlineUserCircle,
  HiOutlineTag,
  HiOutlinePaintBrush,
  HiOutlineXMark,
} from 'react-icons/hi2';
import { IoHeadset, IoInfinite } from 'react-icons/io5';
import { useUserStore } from '../../stores/userStore';
import { useThemeStore } from '../../stores/themeStore';
import { shopService } from '../../services/ShopService';
import type { ShopItem, TitleItem, FrameItem, BannerItem } from '../../types/shop';

// Icon map for titles
const titleIcons: Record<string, React.ReactNode> = {
  'HiOutlineMusicalNote': <HiOutlineMusicalNote className="w-3 h-3" />,
  'HiOutlineHeadphones': <IoHeadset className="w-3 h-3" />,
  'HiOutlineHeart': <HiOutlineHeart className="w-3 h-3" />,
  'HiOutlineMagnifyingGlass': <HiOutlineMagnifyingGlass className="w-3 h-3" />,
  'HiOutlineMoon': <HiOutlineMoon className="w-3 h-3" />,
  'HiOutlineAdjustmentsHorizontal': <HiOutlineAdjustmentsHorizontal className="w-3 h-3" />,
  'HiOutlineMicrophone': <HiOutlineMicrophone className="w-3 h-3" />,
  'HiOutlineSquares2X2': <HiOutlineSquares2X2 className="w-3 h-3" />,
  'HiOutlineStar': <HiOutlineStar className="w-3 h-3" />,
  'HiOutlineCrown': <HiOutlineStar className="w-3 h-3" />,
  'HiOutlineSparkles': <HiOutlineSparkles className="w-3 h-3" />,
  'HiOutlineTrophy': <HiOutlineTrophy className="w-3 h-3" />,
  'HiOutlineFire': <HiOutlineFire className="w-3 h-3" />,
  'HiOutlineBolt': <HiOutlineBolt className="w-3 h-3" />,
  'HiOutlineInfinity': <IoInfinite className="w-3 h-3" />,
};

type InventoryCategory = 'banners' | 'frames' | 'titles' | 'backgrounds';

const categoryIcons = {
  banners: HiOutlinePhoto,
  frames: HiOutlineUserCircle,
  titles: HiOutlineTag,
  backgrounds: HiOutlinePaintBrush,
};

interface InventoryViewProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InventoryView({ isOpen, onClose }: InventoryViewProps) {
  const [category, setCategory] = useState<InventoryCategory>('banners');
  
  const { ownedItems, equippedItems, equipItem, updateBanner, user } = useUserStore();
  const { currentTheme } = useThemeStore();
  const colors = currentTheme.colors;

  if (!isOpen) return null;

  const categories = [
    { id: 'banners' as const, label: 'Баннеры', slot: 'banner' },
    { id: 'frames' as const, label: 'Рамки', slot: 'frame' },
    { id: 'titles' as const, label: 'Титулы', slot: 'title' },
    { id: 'backgrounds' as const, label: 'Фоны', slot: 'background' },
  ];

  const currentCategory = categories.find(c => c.id === category)!;
  const allCategoryItems = shopService.getItemsByCategory(category);
  const items = allCategoryItems.filter(item => ownedItems.includes(item.id));
  const equippedId = (equippedItems as any)[currentCategory.slot];

  const getItemCount = (cat: InventoryCategory) => {
    return shopService.getItemsByCategory(cat).filter(item => ownedItems.includes(item.id)).length;
  };

  const getTotalItems = () => {
    return categories.reduce((acc, cat) => acc + getItemCount(cat.id), 0);
  };

  const handleItemClick = (item: ShopItem) => {
    const isCurrentlyEquipped = equippedId === item.id;
    
    if (isCurrentlyEquipped) {
      // Снимаем предмет
      if (category === 'banners') {
        updateBanner('transparent', 'gradient');
        equipItem('banner', '');
      } else {
        equipItem(currentCategory.slot as any, '');
      }
      
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { message: 'Снято!', type: 'info' }
      }));
    } else {
      // Одеваем предмет
      if (category === 'banners') {
        const bannerItem = item as any;
        const bannerType = bannerItem.type === 'image' ? 'image' : bannerItem.type === 'animated' ? 'animated' : 'gradient';
        updateBanner(item.preview, bannerType);
        equipItem('banner', item.id);
      } else {
        equipItem(currentCategory.slot as any, item.id);
      }
      
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { message: `${item.name} применён!`, type: 'success' }
      }));
    }
  };

  // Render item preview - BANNERS/BACKGROUNDS RECTANGULAR, FRAMES/TITLES SQUARE
  const renderItemPreview = (item: ShopItem, size: 'small' | 'large' = 'small') => {
    const isLarge = size === 'large';
    
    if (category === 'banners') {
      const banner = item as BannerItem;
      const isImage = item.preview?.startsWith('/') || item.preview?.startsWith('./') || item.preview?.startsWith('http');
      
      const style: React.CSSProperties = {
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      };
      
      if (isImage) {
        style.backgroundImage = `url(${item.preview})`;
      } else {
        style.background = item.preview;
      }
      
      return (
        <div 
          className={`w-full ${isLarge ? 'h-48' : 'h-24'} rounded-xl overflow-hidden relative`}
          style={style}
        >
          {banner.animated && (
            <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1" 
              style={{ background: 'rgba(168,85,247,0.9)', color: '#fff' }}>
              <HiOutlineSparkles className="w-3 h-3" />
              GIF
            </div>
          )}
        </div>
      );
    }
    
    if (category === 'backgrounds') {
      const isImage = item.preview?.startsWith('/') || item.preview?.startsWith('./') || item.preview?.startsWith('http');
      
      const style: React.CSSProperties = {
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      };
      
      if (isImage) {
        style.backgroundImage = `url(${item.preview})`;
      } else {
        style.background = item.preview;
      }
      
      return (
        <div 
          className={`w-full ${isLarge ? 'h-48' : 'h-24'} rounded-xl overflow-hidden`}
          style={style}
        />
      );
    }
    
    if (category === 'frames') {
      const frame = item as FrameItem;
      return (
        <div 
          className={`w-full ${isLarge ? 'h-48' : 'aspect-square'} flex items-center justify-center rounded-xl`}
          style={{ background: `linear-gradient(135deg, ${frame.borderColor}15, ${colors.surface})` }}
        >
          <div 
            className={`${isLarge ? 'w-24 h-24' : 'w-16 h-16'} rounded-full overflow-hidden`}
            style={{ 
              border: `3px solid ${frame.borderColor}`,
              background: colors.surface,
              boxShadow: frame.glowColor ? `0 0 20px ${frame.glowColor}60` : undefined,
            }}
          >
            {user?.avatar && (
              <img src={user.avatar} alt="" className="w-full h-full object-cover" />
            )}
          </div>
        </div>
      );
    }
    
    if (category === 'titles') {
      const title = item as TitleItem;
      const isImageTitle = (title as any).isImageTitle && (title as any).image;
      
      if (isLarge) {
        return (
          <div 
            className="h-64 flex flex-col items-center justify-center rounded-xl relative overflow-hidden"
            style={{ 
              background: `linear-gradient(135deg, ${title.color}20 0%, ${colors.surface} 50%, ${title.color}15 100%)`,
            }}
          >
            <div 
              className="absolute inset-0"
              style={{ 
                background: `radial-gradient(circle at 30% 50%, ${title.color}30 0%, transparent 50%), 
                             radial-gradient(circle at 70% 50%, ${title.color}20 0%, transparent 50%)`,
              }}
            />
            
            {isImageTitle ? (
              <img 
                src={(title as any).image} 
                alt={title.name} 
                className="h-16 object-contain relative z-10"
                style={{ filter: `drop-shadow(0 0 20px ${title.color}60)` }}
              />
            ) : (
              <div 
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-lg font-bold relative z-10"
                style={{ 
                  background: `${title.color}40`, 
                  color: title.color,
                  boxShadow: `0 0 40px ${title.color}50`,
                }}
              >
                {titleIcons[title.icon || 'HiOutlineSparkles'] && (
                  <span className="scale-125">{titleIcons[title.icon || 'HiOutlineSparkles']}</span>
                )}
                {title.name}
              </div>
            )}
            
            <div className="mt-4 flex items-center gap-2 relative z-10">
              <div 
                className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0"
                style={{ background: colors.surface, border: `2px solid ${colors.textSecondary}20` }}
              >
                {user?.avatar ? (
                  <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs font-bold" style={{ color: colors.textSecondary }}>
                    {user?.displayName?.[0]?.toUpperCase() || "?"}
                  </div>
                )}
              </div>
              <span className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                {user?.displayName || "User"}
              </span>
            </div>
          </div>
        );
      }
      
      // Compact display for grid - RECTANGULAR like banners with centered title
      return (
        <div 
          className="w-full h-24 flex items-center justify-center rounded-xl relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${title.color}20, ${colors.surface})` }}
        >
          {/* Background glow effect */}
          <div 
            className="absolute inset-0 opacity-30"
            style={{ 
              background: `radial-gradient(circle at 50% 50%, ${title.color}30 0%, transparent 70%)`,
            }}
          />
          
          {isImageTitle ? (
            <img 
              src={(title as any).image} 
              alt={title.name} 
              className="max-h-12 object-contain relative z-10" 
              style={{ filter: `drop-shadow(0 0 10px ${title.color}40)` }}
            />
          ) : (
            <div 
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-base font-bold relative z-10"
              style={{ 
                background: `${title.color}35`, 
                color: title.color,
                boxShadow: `0 0 20px ${title.color}30`,
              }}
            >
              {titleIcons[title.icon || 'HiOutlineSparkles'] && (
                <span className="scale-110">{titleIcons[title.icon || 'HiOutlineSparkles']}</span>
              )}
              <span>{title.name}</span>
            </div>
          )}
        </div>
      );
    }
    
    return null;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md" />
      
      <div
        className="relative w-full max-w-6xl rounded-3xl overflow-hidden flex flex-col"
        style={{ 
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(20px)',
          border: `1px solid ${colors.textSecondary}15`,
          boxShadow: `0 20px 60px rgba(0,0,0,0.5)`,
          height: '85vh',
          maxHeight: '800px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div 
          className="px-6 py-4 flex items-center justify-between relative overflow-hidden"
          style={{ borderBottom: `1px solid ${colors.textSecondary}15` }}
        >
          <div 
            className="absolute inset-0 opacity-20"
            style={{ 
              background: `radial-gradient(circle at 20% 50%, ${colors.accent}20 0%, transparent 50%), 
                           radial-gradient(circle at 80% 50%, ${colors.accent}15 0%, transparent 50%)`,
            }}
          />
          
          <div className="flex items-center gap-3 relative z-10">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: `${colors.accent}20`, boxShadow: `0 0 20px ${colors.accent}30` }}
            >
              <HiOutlineSparkles className="w-6 h-6" style={{ color: colors.accent }} />
            </div>
            <div>
              <h2 className="text-xl font-bold" style={{ color: colors.textPrimary }}>
                Мой инвентарь
              </h2>
              <p className="text-sm" style={{ color: colors.textSecondary }}>
                {getTotalItems()} {getTotalItems() === 1 ? 'предмет' : getTotalItems() < 5 ? 'предмета' : 'предметов'}
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-110 relative z-10"
            style={{ background: `${colors.textSecondary}10`, color: colors.textSecondary }}
          >
            <HiOutlineXMark className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col p-6 space-y-4 min-h-0">
          {/* Categories */}
          <div className="flex gap-2 pb-1 scrollbar-hide flex-shrink-0">
            {categories.map(cat => {
              const count = getItemCount(cat.id);
              const Icon = categoryIcons[cat.id];
              const isActive = category === cat.id;
              
              return (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap"
                  style={{
                    background: isActive 
                      ? `linear-gradient(135deg, ${colors.accent}, ${colors.accent}dd)` 
                      : `${colors.textSecondary}08`,
                    color: isActive ? 'var(--interactive-accent-text)' : colors.textSecondary,
                    boxShadow: isActive ? `0 4px 16px ${colors.accent}40` : undefined,
                  }}
                >
                  <Icon className="w-4 h-4" />
                  <span>{cat.label}</span>
                  <span 
                    className="text-xs px-2 py-0.5 rounded-full font-bold min-w-[24px] text-center"
                    style={{ 
                      background: isActive ? 'rgba(0,0,0,0.2)' : `${colors.textSecondary}15`,
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Items Grid - Fixed height container */}
          <div className="flex-1 overflow-y-auto scrollbar-hide min-h-0">
            {items.length === 0 ? (
              <div 
                className="text-center py-16 rounded-2xl"
                style={{ background: `${colors.textSecondary}03`, border: `1px dashed ${colors.textSecondary}15` }}
              >
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: `${colors.textSecondary}08` }}
                >
                  {(() => {
                    const Icon = categoryIcons[category];
                    return <Icon className="w-8 h-8" style={{ color: colors.textSecondary }} />;
                  })()}
                </div>
                <p className="font-bold text-base" style={{ color: colors.textPrimary }}>Пусто</p>
                <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                  Загляни в магазин за новыми предметами
                </p>
              </div>
            ) : (
              <div className={`grid gap-4 ${
                category === 'frames' ? 'grid-cols-4' : 'grid-cols-2'
              }`}>
                {items.map((item) => {
                  const isEquipped = equippedId === item.id;
                  const rarityColor = shopService.getRarityColor(item.rarity);

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick(item)}
                      className="relative rounded-2xl overflow-hidden text-left group"
                      style={{ 
                        background: `linear-gradient(135deg, ${colors.surface}, ${colors.surface}dd)`,
                        border: `2px solid ${isEquipped ? '#22c55e' : `${rarityColor}30`}`,
                        boxShadow: isEquipped 
                          ? '0 8px 24px rgba(34, 197, 94, 0.3)' 
                          : `0 4px 12px ${rarityColor}15`,
                      }}
                    >
                      <div className="relative">
                        {renderItemPreview(item, 'small')}
                        
                        {isEquipped && (
                          <div 
                            className="absolute top-2 left-2 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shadow-lg"
                            style={{ boxShadow: '0 0 16px rgba(34, 197, 94, 0.6)' }}
                          >
                            <HiOutlineCheck className="w-4 h-4 text-white" />
                          </div>
                        )}
                        
                        <div 
                          className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[9px] font-bold backdrop-blur-sm"
                          style={{ 
                            background: `${rarityColor}90`,
                            color: '#fff',
                            boxShadow: `0 0 12px ${rarityColor}60`,
                          }}
                        >
                          {shopService.getRarityName(item.rarity)}
                        </div>
                        

                      </div>
                      
                      <div className="p-3">
                        <p 
                          className="font-bold text-sm truncate" 
                          style={{ color: isEquipped ? '#22c55e' : colors.textPrimary }}
                        >
                          {item.name}
                        </p>
                        {item.description && (
                          <p className="text-[10px] mt-0.5 truncate" style={{ color: colors.textSecondary }}>
                            {item.description}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
