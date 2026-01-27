import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  HiOutlineCheck,
  HiOutlineSparkles,
  HiOutlineXMark,
  HiOutlinePhoto,
  HiOutlineShoppingCart,
  HiOutlineTag,
  HiOutlineUserCircle,
  HiOutlineCube,
  HiOutlinePaintBrush,
} from "react-icons/hi2";
import { useUserStore } from "../../stores/userStore";
import { useThemeStore } from "../../stores/themeStore";
import { usePlayerSettingsStore } from "../../stores/playerSettingsStore";
import { shopService } from "../../services/ShopService";
import { MoniIcon, MoniDisplay } from "../common/MoniIcon";
import type { ShopItem, BannerItem, TitleItem } from "../../types/shop";

type ShopCategory = "titles" | "banners" | "frames" | "backgrounds";

export function ShopView() {
  const [category, setCategory] = useState<ShopCategory>("titles");
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const { coins, ownedItems, purchaseItem, user } = useUserStore();
  const { currentTheme } = useThemeStore();
  const { colors } = currentTheme;
  const { setIsModalOpen } = usePlayerSettingsStore();

  useEffect(() => {
    setIsModalOpen(true);
    return () => setIsModalOpen(false);
  }, [setIsModalOpen]);

  const categories = [
    { id: "titles" as const, label: "Титулы", icon: HiOutlineTag },
    { id: "banners" as const, label: "Баннеры", icon: HiOutlinePhoto },
    { id: "frames" as const, label: "Рамки", icon: HiOutlineUserCircle },
    { id: "backgrounds" as const, label: "Фоны", icon: HiOutlinePaintBrush },
  ];

  const getItems = (): ShopItem[] => {
    return shopService.getItemsByCategory(category).filter((item) => item.price > 0);
  };

  const items = getItems();
  const isOwned = (id: string) => ownedItems.includes(id);

  const handlePurchase = (item: ShopItem) => {
    if (isOwned(item.id) || coins < item.price) return;
    purchaseItem(item);
    setSelectedItem(null);
    window.dispatchEvent(new CustomEvent('show-toast', {
      detail: { message: `${item.name} куплен!`, type: 'success' }
    }));
  };

  // Render title card
  const renderTitleCard = (item: ShopItem) => {
    const title = item as TitleItem;
    const owned = isOwned(item.id);
    const canAfford = coins >= item.price;
    const isImageTitle = (title as any).isImageTitle && (title as any).image;
    const isHovered = hoveredItem === item.id;

    return (
      <div 
        key={item.id} 
        className="relative group"
        onMouseEnter={() => setHoveredItem(item.id)}
        onMouseLeave={() => setHoveredItem(null)}
        onClick={() => setSelectedItem(item)}
      >
        <div 
          className="rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer"
          style={{ 
            background: isHovered ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
            transform: isHovered ? 'translateY(-4px) scale(1.02)' : 'none',
            boxShadow: isHovered ? `0 15px 30px rgba(0,0,0,0.3), 0 0 25px ${title.color}20` : 'none',
          }}
        >
          {/* Title preview area */}
          <div className="flex flex-col items-center py-8 px-4">
            {/* Title badge with glow */}
            <div className="relative">
              {isHovered && (
                <div 
                  className="absolute inset-0 blur-2xl opacity-60"
                  style={{ background: title.color }}
                />
              )}
              {isImageTitle ? (
                <img 
                  src={(title as any).image} 
                  alt={title.name}
                  className="h-10 object-contain relative z-10 transition-transform duration-300"
                  style={{ transform: isHovered ? 'scale(1.1)' : 'scale(1)' }}
                />
              ) : (
                <div 
                  className="px-5 py-2 rounded-lg text-sm font-bold relative z-10 transition-transform duration-300"
                  style={{ 
                    background: title.color || '#fff',
                    color: '#fff',
                    textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                    transform: isHovered ? 'scale(1.1)' : 'scale(1)',
                  }}
                >
                  {title.name}
                </div>
              )}
            </div>
            
            {/* Username */}
            <span 
              className="mt-4 text-base font-medium"
              style={{ color: colors.textPrimary }}
            >
              {user?.displayName || "Ponchik"}
            </span>
          </div>

          {/* Bottom bar */}
          <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            {/* Rarity badge */}
            <span 
              className="text-[11px] px-3 py-1.5 rounded-full font-medium"
              style={{ 
                background: `${shopService.getRarityColor(item.rarity)}15`,
                color: shopService.getRarityColor(item.rarity),
              }}
            >
              {shopService.getRarityName(item.rarity)}
            </span>

            {/* Price button */}
            {owned ? (
              <div className="flex items-center gap-2 text-xs text-green-400 font-medium px-3 py-2 rounded-lg bg-green-500/10">
                <HiOutlineCheck className="w-4 h-4" />
                Куплено
              </div>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); handlePurchase(item); }}
                disabled={!canAfford}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all hover:bg-white/15 disabled:opacity-40"
                style={{ 
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#fff',
                }}
              >
                <HiOutlineShoppingCart className="w-4 h-4" />
                {item.price}
                <MoniIcon className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render banner/background card
  const renderImageCard = (item: ShopItem) => {
    const banner = item as BannerItem;
    const owned = isOwned(item.id);
    const canAfford = coins >= item.price;
    const isHovered = hoveredItem === item.id;
    
    // Check if preview is an image path or a CSS gradient
    const isImagePath = item.preview?.startsWith('/') || item.preview?.startsWith('./') || item.preview?.startsWith('http');

    return (
      <div 
        key={item.id}
        className="relative group"
        onMouseEnter={() => setHoveredItem(item.id)}
        onMouseLeave={() => setHoveredItem(null)}
        onClick={() => setSelectedItem(item)}
      >
        <div 
          className="rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer"
          style={{ 
            background: 'rgba(255,255,255,0.03)',
            transform: isHovered ? 'translateY(-4px) scale(1.02)' : 'none',
            boxShadow: isHovered ? '0 15px 30px rgba(0,0,0,0.3)' : 'none',
          }}
        >
          {/* Image preview */}
          <div 
            className="h-32 relative overflow-hidden rounded-t-2xl"
            style={isImagePath ? { 
              backgroundImage: `url(${item.preview})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundColor: '#1a1a1a',
            } : {
              background: item.preview || '#1a1a1a',
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            {banner.animated && (
              <div 
                className="absolute top-2 right-2 px-2 py-1 rounded-lg text-[9px] font-bold flex items-center gap-1"
                style={{ background: 'rgba(168,85,247,0.9)', color: '#fff' }}
              >
                <HiOutlineSparkles className="w-3 h-3" />
                GIF
              </div>
            )}
            {owned && (
              <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
                <HiOutlineCheck className="w-3 h-3 text-white" />
              </div>
            )}
            {/* Name overlay */}
            <div className="absolute bottom-2 left-3 right-3">
              <p className="text-base font-semibold text-white truncate">{item.name}</p>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="flex items-center justify-between px-4 py-3">
            {/* Rarity */}
            <span 
              className="text-[11px] px-3 py-1.5 rounded-full font-medium"
              style={{ 
                background: `${shopService.getRarityColor(item.rarity)}15`,
                color: shopService.getRarityColor(item.rarity),
              }}
            >
              {shopService.getRarityName(item.rarity)}
            </span>
            
            {owned ? (
              <div className="flex items-center gap-1 text-[11px] text-green-400 font-medium">
                <HiOutlineCheck className="w-3.5 h-3.5" />
                Куплено
              </div>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); handlePurchase(item); }}
                disabled={!canAfford}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all hover:bg-white/10 disabled:opacity-40"
                style={{ 
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#fff',
                }}
              >
                <HiOutlineShoppingCart className="w-3.5 h-3.5" />
                {item.price}
                <MoniIcon className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div 
      className="rounded-3xl overflow-hidden flex"
      style={{ 
        background: 'rgba(8,8,8,0.98)',
        border: '1px solid rgba(255,255,255,0.1)',
        width: '920px',
        maxWidth: '92vw',
        height: '620px',
        maxHeight: '80vh',
        boxShadow: '0 40px 80px rgba(0,0,0,0.6), 0 0 100px rgba(0,0,0,0.3)',
      }}
    >
      {/* Left Sidebar */}
      <div 
        className="w-48 flex-shrink-0 p-5 flex flex-col"
        style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}
      >
        {/* Balance */}
        <div 
          className="mb-5 px-4 py-4 rounded-xl"
          style={{ 
            background: `linear-gradient(135deg, ${colors.accent}15, rgba(255,255,255,0.03))`,
            border: `1px solid ${colors.accent}20`,
          }}
        >
          <MoniDisplay amount={coins} size="md" />
        </div>

        {/* Categories */}
        <div className="space-y-1.5">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const count = shopService.getItemsByCategory(cat.id).filter(i => i.price > 0).length;
            const isActive = category === cat.id;
            
            return (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: isActive ? 'rgba(255,255,255,0.1)' : "transparent",
                  color: isActive ? '#fff' : 'rgba(255,255,255,0.5)',
                }}
              >
                <Icon className="w-5 h-5" />
                <span className="flex-1 text-left">{cat.label}</span>
                {count > 0 && (
                  <span 
                    className="text-xs px-2 py-0.5 rounded-full font-bold"
                    style={{ 
                      background: isActive ? colors.accent : 'rgba(255,255,255,0.1)',
                      color: isActive ? '#000' : 'rgba(255,255,255,0.6)',
                    }}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-5 scrollbar-hide">
        <div 
            key={category}
            className="grid grid-cols-3 gap-4"
          >
            {items.map((item, index) => (
              category === 'titles' 
                ? renderTitleCard(item)
                : renderImageCard(item)
            ))}
          </div>

        {items.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: 'rgba(255,255,255,0.05)' }}
            >
              <HiOutlineCube className="w-8 h-8" style={{ color: 'rgba(255,255,255,0.3)' }} />
            </div>
            <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Скоро появятся товары
            </p>
            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Загляни позже
            </p>
          </div>
        )}
      </div>

      {/* Item Detail Modal */}
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedItem(null)}
          >
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            <div
              className="relative w-full max-w-md rounded-2xl overflow-hidden"
              style={{ 
                background: 'rgba(0, 0, 0, 0.8)', 
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedItem(null)}
                className="absolute top-3 right-3 z-10 p-1.5 rounded-lg transition-all hover:bg-white/10"
              >
                <HiOutlineXMark className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.5)' }} />
              </button>

              {category === 'titles' ? (
                <div className="h-32 flex flex-col items-center justify-center">
                  {(selectedItem as any).isImageTitle && (selectedItem as any).image ? (
                    <img 
                      src={(selectedItem as any).image}
                      alt={selectedItem.name}
                      className="h-12 object-contain"
                    />
                  ) : (
                    <div 
                      className="px-6 py-2.5 rounded-lg text-lg font-bold"
                      style={{ 
                        background: (selectedItem as TitleItem).color,
                        color: '#fff',
                      }}
                    >
                      {selectedItem.name}
                    </div>
                  )}
                  <span className="mt-3 text-base" style={{ color: '#fff' }}>
                    {user?.displayName || "Ponchik"}
                  </span>
                </div>
              ) : (
                (() => {
                  const isImagePath = selectedItem.preview?.startsWith('/') || selectedItem.preview?.startsWith('./') || selectedItem.preview?.startsWith('http');
                  return (
                    <div 
                      className="h-48 relative overflow-hidden"
                      style={isImagePath ? { 
                        backgroundImage: `url(${selectedItem.preview})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundColor: '#1a1a1a',
                      } : {
                        background: selectedItem.preview || '#1a1a1a',
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      {(selectedItem as BannerItem).animated && (
                        <div 
                          className="absolute top-3 right-3 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5"
                          style={{ background: 'rgba(168,85,247,0.9)', color: '#fff' }}
                        >
                          <HiOutlineSparkles className="w-4 h-4" />
                          Анимированный
                        </div>
                      )}
                    </div>
                  );
                })()
              )}

              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold" style={{ color: '#fff' }}>
                    {selectedItem.name}
                  </h3>
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full"
                    style={{
                      background: `${shopService.getRarityColor(selectedItem.rarity)}20`,
                      color: shopService.getRarityColor(selectedItem.rarity),
                    }}
                  >
                    {shopService.getRarityName(selectedItem.rarity)}
                  </span>
                </div>

                {isOwned(selectedItem.id) ? (
                  <button
                    className="w-full py-2.5 rounded-lg text-xs font-medium bg-green-500/15 text-green-400 flex items-center justify-center gap-2"
                    disabled
                  >
                    <HiOutlineCheck className="w-4 h-4" />
                    Куплено
                  </button>
                ) : (
                  <button
                    onClick={() => handlePurchase(selectedItem)}
                    disabled={coins < selectedItem.price}
                    className="w-full py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-40"
                    style={{
                      background: colors.accent,
                      color: '#000',
                    }}
                  >
                    <HiOutlineShoppingCart className="w-4 h-4" />
                    Купить за {selectedItem.price} Ð
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
    </div>
  );
}
