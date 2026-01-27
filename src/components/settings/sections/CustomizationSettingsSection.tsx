import React, { useRef, useState } from "react";
import {
  HiOutlinePhoto,
  HiOutlineSparkles,
  HiOutlineCursorArrowRays,
  HiOutlineLink,
  HiOutlineArrowUpTray,
  HiOutlineTrash,
  HiOutlineSquare2Stack,
  HiOutlinePlus,
  HiOutlineCheck,
  HiOutlineFolder,
  HiOutlineChartBar,
  HiOutlineSquares2X2,
  HiOutlineListBullet,
} from "react-icons/hi2";
import { motion, AnimatePresence } from "framer-motion";
import { usePlayerSettingsStore, LibraryItem } from "../../../stores/playerSettingsStore";
import { Toggle } from '../../common/Toggle';

type CategoryType = "theme" | "background" | "visualizer" | "particles" | "cursor" | "artwork";
type LibraryViewMode = "grid" | "masonry";

const categories: { id: CategoryType; name: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { id: "theme", name: "Тема", icon: HiOutlineSparkles },
  { id: "background", name: "Фон", icon: HiOutlineSquare2Stack },
  { id: "artwork", name: "Обложка", icon: HiOutlinePhoto },
  { id: "visualizer", name: "Визуализатор", icon: HiOutlineChartBar },
  { id: "particles", name: "Частицы", icon: HiOutlineSparkles },
  { id: "cursor", name: "Курсор", icon: HiOutlineCursorArrowRays },
];

function SettingRow({ label, enabled, onChange }: { label: string; enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{label}</span>
      <Toggle enabled={enabled} onChange={onChange} size="sm" />
    </div>
  );
}

function Slider({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <div className="py-1.5">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{label}</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "var(--surface-elevated)", color: "var(--text-primary)" }}>{Math.round(value)}</span>
      </div>
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1 rounded-full appearance-none cursor-pointer"
        style={{ background: `linear-gradient(to right, var(--interactive-accent) ${((value - min) / (max - min)) * 100}%, var(--surface-elevated) ${((value - min) / (max - min)) * 100}%)` }} />
    </div>
  );
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: { value: string; label: string }[]; onChange: (v: string) => void }) {
  return (
    <div className="py-1.5">
      <span className="text-xs block mb-1.5" style={{ color: "var(--text-secondary)" }}>{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button key={opt.value} onClick={() => onChange(opt.value)}
            className="py-1 px-2.5 rounded-lg text-[10px] font-medium transition-all"
            style={{
              background: value === opt.value ? "var(--interactive-accent)" : "var(--surface-elevated)",
              color: value === opt.value ? "var(--interactive-accent-text)" : "var(--text-secondary)",
            }}>
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function CustomizationSettingsSection() {
  const {
    customBackgroundUrl, setCustomBackgroundUrl, customBackgroundFile, setCustomBackgroundFile,
    backgroundImageEnabled, setBackgroundImageEnabled, backgroundImageOpacity, setBackgroundImageOpacity,
    backgroundImageBlur, setBackgroundImageBlur, customCursorEnabled, setCustomCursorEnabled,
    customCursorUrl, setCustomCursorUrl, particlesEnabled, setParticlesEnabled,
    particleCount, setParticleCount, particleSpeed, setParticleSpeed, particleSize, setParticleSize,
    particleShape, setParticleShape, particleOpacity, setParticleOpacity,
    visualizerStyle, setVisualizerStyle,
    artworkShape, setArtworkShape, artworkRotate, setArtworkRotate,
    artworkPulse, setArtworkPulse, artworkGlow, setArtworkGlow, artworkShadow, setArtworkShadow,
    autoThemeFromArtwork, setAutoThemeFromArtwork, parallaxEnabled, setParallaxEnabled,
    customArtworkUrl, setCustomArtworkUrl, customArtworkEnabled, setCustomArtworkEnabled,
    libraryItems, addLibraryItem, removeLibraryItem,
  } = usePlayerSettingsStore();

  const [activeCategory, setActiveCategory] = useState<CategoryType>("theme");
  const [urlInput, setUrlInput] = useState("");
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [viewMode, setViewMode] = useState<LibraryViewMode>("grid");
  const [contextMenu, setContextMenu] = useState<{ item: LibraryItem; x: number; y: number } | null>(null);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [customThemeColor, setCustomThemeColor] = useState("#8B5CF6");
  const [isCustomThemeActive, setIsCustomThemeActive] = useState(false);
  const [originalAccentColor, setOriginalAccentColor] = useState<string | null>(null);
  const [showFullLibrary, setShowFullLibrary] = useState(false);

  const currentBackground = customBackgroundFile || customBackgroundUrl;

  const handleAddFromUrl = () => {
    if (!urlInput.trim()) return;
    const isGif = urlInput.toLowerCase().includes(".gif");
    addLibraryItem({ url: urlInput.trim(), name: urlInput.split("/").pop() || "Изображение", type: isGif ? "gif" : "image" });
    setUrlInput("");
    setShowAddPanel(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      addLibraryItem({ url: base64, name: file.name, type: file.type === "image/gif" ? "gif" : "image" });
    };
    reader.readAsDataURL(file);
    setShowAddPanel(false);
  };

  const handleContextMenu = (e: React.MouseEvent, item: LibraryItem) => {
    e.preventDefault();
    setContextMenu({ item, x: e.clientX, y: e.clientY });
  };

  const applyAs = (target: "background" | "cursor" | "artwork") => {
    const item = contextMenu?.item || libraryItems.find(i => i.id === selectedItem);
    if (!item) {
      window.dispatchEvent(new CustomEvent("show-toast", {
        detail: { message: "Ошибка: элемент не найден", type: "error" }
      }));
      return;
    }
    
    if (target === "background") {
      // Проверяем - если уже применен этот фон, отменяем
      if (backgroundImageEnabled && (customBackgroundFile === item.url || customBackgroundUrl === item.url)) {
        setBackgroundImageEnabled(false);
        setCustomBackgroundFile(null);
        setCustomBackgroundUrl(null);
        window.dispatchEvent(new CustomEvent("show-toast", {
          detail: { message: "Фон отменен", type: "success" }
        }));
        setContextMenu(null);
        setSelectedItem(null);
        return;
      }
      
      // Сначала отключаем фон
      setBackgroundImageEnabled(false);
      
      // Очищаем оба значения
      setCustomBackgroundFile(null);
      setCustomBackgroundUrl(null);
      
      // Ждем немного чтобы состояние очистилось
      setTimeout(() => {
        // Устанавливаем новое значение
        if (item.url.startsWith("data:")) {
          setCustomBackgroundFile(item.url);
        } else {
          setCustomBackgroundUrl(item.url);
        }
        
        // Включаем фон
        setTimeout(() => {
          setBackgroundImageEnabled(true);
          
          // Показываем уведомление
          window.dispatchEvent(new CustomEvent("show-toast", {
            detail: { message: "Фон применен", type: "success" }
          }));
        }, 50);
      }, 50);
    } else if (target === "cursor") {
      // Проверяем - если уже применен этот курсор, отменяем
      if (customCursorEnabled && customCursorUrl === item.url) {
        setCustomCursorUrl(null);
        setCustomCursorEnabled(false);
        window.dispatchEvent(new CustomEvent("show-toast", {
          detail: { message: "Курсор отменен", type: "success" }
        }));
        setContextMenu(null);
        setSelectedItem(null);
        return;
      }
      
      setCustomCursorUrl(item.url);
      setCustomCursorEnabled(true);
      window.dispatchEvent(new CustomEvent("show-toast", {
        detail: { message: "Курсор применен", type: "success" }
      }));
    } else if (target === "artwork") {
      // Проверяем - если уже применена эта обложка, отменяем
      if (customArtworkEnabled && customArtworkUrl === item.url) {
        setCustomArtworkUrl(null);
        setCustomArtworkEnabled(false);
        window.dispatchEvent(new CustomEvent("show-toast", {
          detail: { message: "Обложка отменена", type: "success" }
        }));
        setContextMenu(null);
        setSelectedItem(null);
        return;
      }
      
      setCustomArtworkUrl(item.url);
      setCustomArtworkEnabled(true);
      window.dispatchEvent(new CustomEvent("show-toast", {
        detail: { message: "Обложка применена", type: "success" }
      }));
    }
    setContextMenu(null);
    setSelectedItem(null);
  };

  const getGridCols = () => {
    return viewMode === "grid" ? "grid-cols-5" : "columns-4";
  };

  const renderSettings = () => {
    switch (activeCategory) {
      case "theme":
        return (
          <>
            <SettingRow label="Тема под обложку" enabled={autoThemeFromArtwork} onChange={setAutoThemeFromArtwork} />
            {autoThemeFromArtwork && (
              <div className="flex items-center gap-2 py-2">
                <div className="flex -space-x-1">
                  {["#8B5CF6", "#EC4899", "#3B82F6", "#22C55E"].map((c) => (
                    <div key={c} className="w-4 h-4 rounded-full border" style={{ background: c, borderColor: "var(--surface-card)" }} />
                  ))}
                </div>
                <span className="text-[10px]" style={{ color: "var(--text-subtle)" }}>Цвет из обложки</span>
              </div>
            )}
            
            {/* Custom Theme Color Picker */}
            <div className="mt-3 pt-3 border-t" style={{ borderColor: "var(--border-base)" }}>
              <span className="text-xs block mb-2" style={{ color: "var(--text-secondary)" }}>Кастомная тема</span>
              <div className="flex items-center gap-2">
                {/* RGB Color Picker */}
                <div className="relative">
                  <input 
                    type="color" 
                    value={customThemeColor} 
                    onChange={(e) => setCustomThemeColor(e.target.value)}
                    className="w-12 h-12 rounded-lg cursor-pointer border-2"
                    style={{ borderColor: "var(--border-base)" }}
                  />
                  <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full animate-pulse"
                    style={{ background: customThemeColor, boxShadow: `0 0 8px ${customThemeColor}` }} />
                </div>
                
                <div className="flex-1">
                  {/* HEX Input */}
                  <input 
                    type="text" 
                    value={customThemeColor} 
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value.match(/^#[0-9A-Fa-f]{0,6}$/)) {
                        setCustomThemeColor(value);
                      }
                    }}
                    className="w-full px-3 py-2 rounded-lg text-xs font-mono focus:outline-none uppercase"
                    style={{ background: "var(--surface-elevated)", border: "1px solid var(--border-base)", color: "var(--text-primary)" }}
                    placeholder="#8B5CF6"
                    maxLength={7}
                  />
                  
                  {/* Action Buttons */}
                  <div className="flex gap-1.5 mt-1.5">
                    <button 
                      onClick={() => {
                        if (!isCustomThemeActive) {
                          // Save original color before applying custom
                          const currentColor = getComputedStyle(document.documentElement).getPropertyValue('--interactive-accent').trim();
                          setOriginalAccentColor(currentColor);
                        }
                        // Apply custom theme color
                        document.documentElement.style.setProperty('--interactive-accent', customThemeColor);
                        setIsCustomThemeActive(true);
                      }}
                      className="flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={{ background: customThemeColor, color: "white" }}>
                      Применить
                    </button>
                    
                    <button 
                      onClick={() => {
                        // Restore original color
                        if (originalAccentColor) {
                          document.documentElement.style.setProperty('--interactive-accent', originalAccentColor);
                        } else {
                          document.documentElement.style.removeProperty('--interactive-accent');
                        }
                        setIsCustomThemeActive(false);
                      }}
                      disabled={!isCustomThemeActive}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-30"
                      style={{ background: "rgba(239, 68, 68, 0.1)", color: "#ef4444" }}>
                      Сбросить
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Status Indicator */}
              {isCustomThemeActive && (
                <div className="mt-2 px-2 py-1.5 rounded-lg flex items-center gap-2"
                  style={{ background: "var(--surface-elevated)" }}>
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: customThemeColor }} />
                  <span className="text-[10px]" style={{ color: "var(--text-subtle)" }}>Кастомная тема активна</span>
                </div>
              )}
              
              {/* Preset Colors */}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {["#8B5CF6", "#EC4899", "#3B82F6", "#22C55E", "#F59E0B", "#EF4444", "#A855F7", "#06B6D4"].map((color, index) => (
                  <button
                    key={`preset-${index}-${color}`}
                    onClick={() => setCustomThemeColor(color)}
                    className="w-8 h-8 rounded-lg border-2 transition-all hover:scale-110"
                    style={{ 
                      background: color, 
                      borderColor: customThemeColor === color ? "white" : "transparent",
                      boxShadow: customThemeColor === color ? "0 0 0 2px var(--surface-card)" : "none"
                    }}
                  />
                ))}
              </div>
            </div>
          </>
        );
      case "background":
        return (
          <>
            <SettingRow label="Включить фон" enabled={backgroundImageEnabled} onChange={setBackgroundImageEnabled} />
            {backgroundImageEnabled && currentBackground && (
              <>
                <Slider label="Прозрачность" value={backgroundImageOpacity} min={0} max={100} onChange={setBackgroundImageOpacity} />
                <Slider label="Размытие" value={backgroundImageBlur} min={0} max={50} onChange={setBackgroundImageBlur} />
                <button onClick={() => { 
                  setCustomBackgroundFile(null); 
                  setCustomBackgroundUrl(null);
                  setBackgroundImageEnabled(false);
                  window.dispatchEvent(new CustomEvent("show-toast", {
                    detail: { message: "Фон удален", type: "success" }
                  }));
                }}
                  className="w-full py-1.5 rounded-lg text-[10px] font-medium flex items-center justify-center gap-1 mt-1"
                  style={{ background: "rgba(239, 68, 68, 0.1)", color: "#ef4444" }}>
                  <HiOutlineTrash size={12} /> Удалить
                </button>
              </>
            )}
            {!currentBackground && (
              <div className="my-2 p-3 rounded-lg text-center" style={{ background: "var(--surface-elevated)" }}>
                <HiOutlinePhoto size={24} className="mx-auto mb-2" style={{ color: "var(--text-subtle)", opacity: 0.5 }} />
                <p className="text-xs" style={{ color: "var(--text-subtle)" }}>
                  Выберите изображение из каталога
                </p>
              </div>
            )}
          </>
        );
      case "artwork":
        return (
          <>
            <Select label="Форма" value={artworkShape} options={[{ value: "square", label: "Квадрат" }, { value: "rounded", label: "Скруглённый" }, { value: "circle", label: "Круг" }]} onChange={(v) => setArtworkShape(v as any)} />
            <SettingRow label="Вращение" enabled={artworkRotate} onChange={setArtworkRotate} />
            <SettingRow label="Пульсация" enabled={artworkPulse} onChange={setArtworkPulse} />
            <SettingRow label="Свечение" enabled={artworkGlow} onChange={setArtworkGlow} />
            <SettingRow label="Тень" enabled={artworkShadow} onChange={setArtworkShadow} />
            
            {/* Reset custom artwork */}
            {customArtworkEnabled && customArtworkUrl && (
              <button 
                onClick={() => { 
                  setCustomArtworkUrl(null); 
                  setCustomArtworkEnabled(false);
                  window.dispatchEvent(new CustomEvent("show-toast", {
                    detail: { message: "Обложка сброшена", type: "success" }
                  }));
                }}
                className="w-full py-1.5 rounded-lg text-[10px] font-medium flex items-center justify-center gap-1 mt-2"
                style={{ background: "rgba(239, 68, 68, 0.1)", color: "#ef4444" }}>
                <HiOutlineTrash size={12} /> Сбросить обложку
              </button>
            )}
          </>
        );
      case "visualizer":
        return (
          <>
            <Select label="Стиль визуализатора" value={visualizerStyle} options={[{ value: "bars", label: "Полосы" }, { value: "wave", label: "Волна" }, { value: "circle", label: "Круг" }, { value: "particles", label: "Частицы" }]} onChange={(v) => setVisualizerStyle(v as any)} />
          </>
        );
      case "particles":
        return (
          <>
            <SettingRow label="Включить частицы" enabled={particlesEnabled} onChange={setParticlesEnabled} />
            {particlesEnabled && (
              <>
                <SettingRow label="Параллакс эффект" enabled={parallaxEnabled} onChange={setParallaxEnabled} />
                <Slider label="Количество" value={particleCount} min={10} max={200} onChange={setParticleCount} />
                <Slider label="Скорость" value={particleSpeed * 20} min={2} max={100} onChange={(v) => setParticleSpeed(v / 20)} />
                <Slider label="Размер" value={particleSize} min={1} max={10} onChange={setParticleSize} />
                <Slider label="Прозрачность %" value={particleOpacity} min={0} max={100} onChange={setParticleOpacity} />
                <Select label="Форма частиц" value={particleShape} options={[{ value: "circle", label: "Круг" }, { value: "square", label: "Квадрат" }, { value: "star", label: "Звезда" }, { value: "note", label: "Нота" }]} onChange={(v) => setParticleShape(v as any)} />
              </>
            )}
          </>
        );
      case "cursor":
        return (
          <>
            <SettingRow label="Кастомный курсор" enabled={customCursorEnabled} onChange={setCustomCursorEnabled} />
            {customCursorEnabled && customCursorUrl && (
              <>
                <div className="flex items-center gap-2 py-2 px-2 rounded-lg" style={{ background: "var(--surface-elevated)" }}>
                  <img src={customCursorUrl} alt="" className="w-6 h-6 object-contain" />
                  <span className="text-[10px]" style={{ color: "var(--text-subtle)" }}>Текущий курсор</span>
                </div>
                <button onClick={() => { setCustomCursorUrl(null); setCustomCursorEnabled(false); }}
                  className="w-full py-1.5 rounded-lg text-[10px] font-medium flex items-center justify-center gap-1 mt-1"
                  style={{ background: "rgba(239, 68, 68, 0.1)", color: "#ef4444" }}>
                  <HiOutlineTrash size={12} /> Удалить
                </button>
              </>
            )}
          </>
        );
      default: return null;
    }
  };

  return (
    <div className="space-y-3" onClick={() => { setContextMenu(null); }}>
      {/* Library Section */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "var(--surface-card)", border: "1px solid var(--border-base)" }}>
        {/* Header */}
        <div className="px-3 py-2.5 flex items-center justify-between border-b" style={{ borderColor: "var(--border-base)" }}>
          <div className="flex items-center gap-2">
            <HiOutlineFolder size={16} style={{ color: "var(--interactive-accent)" }} />
            <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>Каталог</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "var(--surface-elevated)", color: "var(--text-subtle)" }}>{libraryItems.length}</span>
          </div>
          <div className="flex items-center gap-1.5">
            {/* View Mode Toggle - Only 2 modes */}
            {(["grid", "masonry"] as LibraryViewMode[]).map((mode) => (
              <button key={mode} onClick={() => setViewMode(mode)}
                className="w-9 h-9 rounded-lg flex items-center justify-center transition-all"
                style={{ background: viewMode === mode ? "var(--interactive-accent)" : "transparent", color: viewMode === mode ? "var(--interactive-accent-text)" : "var(--text-subtle)" }}>
                {mode === "grid" ? <HiOutlineSquares2X2 size={18} /> : <HiOutlineListBullet size={18} />}
              </button>
            ))}
            <div className="w-px h-5 mx-1" style={{ background: "var(--border-base)" }} />
            {/* Fullscreen Button */}
            <button onClick={() => setShowFullLibrary(true)}
              className="w-9 h-9 rounded-lg flex items-center justify-center transition-all"
              style={{ background: "var(--surface-elevated)", color: "var(--text-secondary)" }}>
              <HiOutlinePhoto size={18} />
            </button>
            <button onClick={() => setShowAddPanel(!showAddPanel)}
              className="w-9 h-9 rounded-lg flex items-center justify-center transition-all"
              style={{ background: showAddPanel ? "var(--interactive-accent)" : "var(--surface-elevated)", color: showAddPanel ? "var(--interactive-accent-text)" : "var(--text-secondary)" }}>
              <HiOutlinePlus size={18} />
            </button>
          </div>
        </div>

        {/* Add Panel */}
        <AnimatePresence>
          {showAddPanel && (
            <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
              <div className="p-2.5 border-b flex gap-2" style={{ borderColor: "var(--border-base)", background: "var(--surface-elevated)" }}>
                <input type="text" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} placeholder="URL изображения..."
                  className="flex-1 px-2.5 py-1.5 rounded-lg text-[11px] focus:outline-none"
                  style={{ background: "var(--surface-card)", border: "1px solid var(--border-base)", color: "var(--text-primary)" }}
                  onKeyDown={(e) => e.key === "Enter" && handleAddFromUrl()} />
                <button onClick={handleAddFromUrl} disabled={!urlInput.trim()}
                  className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all disabled:opacity-40"
                  style={{ background: "var(--interactive-accent)", color: "var(--interactive-accent-text)" }}>
                  <HiOutlineLink size={14} />
                </button>
                <input ref={fileInputRef} type="file" accept="image/*,.gif" onChange={handleFileUpload} className="hidden" />
                <button onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium flex items-center gap-1"
                  style={{ background: "var(--surface-card)", color: "var(--text-secondary)", border: "1px solid var(--border-base)" }}>
                  <HiOutlineArrowUpTray size={12} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Grid - Increased Height */}
        <div className="h-96 overflow-y-auto p-2.5 custom-scrollbar">
          {libraryItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center">
              <HiOutlineFolder size={40} style={{ color: "var(--text-subtle)", opacity: 0.3 }} />
              <p className="text-sm mt-3" style={{ color: "var(--text-subtle)" }}>Пусто</p>
              <p className="text-xs" style={{ color: "var(--text-subtle)", opacity: 0.6 }}>Нажмите для применения</p>
            </div>
          ) : (
            <div className={viewMode === "grid" ? `grid ${getGridCols()} gap-1.5` : `${getGridCols()} gap-1.5`}>
              {libraryItems.map((item) => (
                <div key={item.id} className="relative">
                  <div
                    onContextMenu={(e) => handleContextMenu(e, item)}
                    onClick={() => setSelectedItem(selectedItem === item.id ? null : item.id)}
                    className={`relative ${viewMode === "grid" ? "aspect-square" : "break-inside-avoid mb-1.5"} rounded-lg overflow-hidden cursor-pointer group transition-opacity duration-200 hover:opacity-80`}
                    style={{ 
                      boxShadow: selectedItem === item.id 
                        ? `0 0 0 2px var(--interactive-accent)` 
                        : "none"
                    }}>
                    <img src={item.url} alt="" className={`w-full ${viewMode === "grid" ? "h-full object-cover" : "h-auto"}`} />
                    
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <button onClick={(e) => { e.stopPropagation(); removeLibraryItem(item.id); }}
                        className="p-1 rounded-lg bg-red-500/90 text-white hover:bg-red-500">
                        <HiOutlineTrash size={12} />
                      </button>
                    </div>
                    {item.type === "gif" && (
                      <div className="absolute top-0.5 right-0.5 px-1 py-0.5 rounded text-[7px] font-bold"
                        style={{ background: "var(--interactive-accent)", color: "var(--interactive-accent-text)" }}>GIF</div>
                    )}
                    {selectedItem === item.id && (
                      <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full flex items-center justify-center"
                        style={{ background: "var(--interactive-accent)" }}>
                        <HiOutlineCheck size={10} style={{ color: "var(--interactive-accent-text)" }} />
                      </div>
                    )}
                  </div>
                  
                  {/* Apply Panel Below Image */}
                  <AnimatePresence>
                    {selectedItem === item.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden mt-1">
                        <div className="rounded-lg p-1.5 flex gap-1" style={{ background: "var(--surface-elevated)" }}>
                          <button
                            onClick={(e) => { e.stopPropagation(); applyAs("background"); }}
                            className="flex-1 py-1 px-1.5 rounded text-[9px] font-medium transition-all hover:scale-105"
                            style={{ 
                              background: currentBackground === item.url ? "var(--interactive-accent)" : "var(--surface-card)", 
                              color: currentBackground === item.url ? "var(--interactive-accent-text)" : "var(--text-primary)" 
                            }}>
                            {currentBackground === item.url ? "✓ Фон" : "Фон"}
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); applyAs("artwork"); }}
                            className="flex-1 py-1 px-1.5 rounded text-[9px] font-medium transition-all hover:scale-105"
                            style={{ 
                              background: customArtworkUrl === item.url ? "var(--interactive-accent)" : "var(--surface-card)", 
                              color: customArtworkUrl === item.url ? "var(--interactive-accent-text)" : "var(--text-primary)" 
                            }}>
                            {customArtworkUrl === item.url ? "✓ Обложка" : "Обложка"}
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); applyAs("cursor"); }}
                            className="flex-1 py-1 px-1.5 rounded text-[9px] font-medium transition-all hover:scale-105"
                            style={{ 
                              background: customCursorUrl === item.url ? "var(--interactive-accent)" : "var(--surface-card)", 
                              color: customCursorUrl === item.url ? "var(--interactive-accent-text)" : "var(--text-primary)" 
                            }}>
                            {customCursorUrl === item.url ? "✓ Курсор" : "Курсор"}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Settings Section - Fixed Height */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "var(--surface-card)", border: "1px solid var(--border-base)" }}>
        {/* Category Tabs */}
        <div className="flex gap-1.5 p-2.5 border-b overflow-x-auto hide-scrollbar" style={{ borderColor: "var(--border-base)" }}>
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all"
                style={{
                  background: isActive ? "var(--interactive-accent)" : "transparent",
                  color: isActive ? "var(--interactive-accent-text)" : "var(--text-secondary)",
                }}>
                <Icon size={16} />
                {cat.name}
              </button>
            );
          })}
        </div>

        {/* Settings Content - Adjusted Height */}
        <div className="h-72 overflow-y-auto p-3.5 custom-scrollbar">
          {renderSettings()}
        </div>
      </div>

      {/* Context Menu (Right Click) - Keep for delete option */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
            className="fixed z-50 rounded-xl overflow-hidden shadow-2xl py-1"
            style={{ left: contextMenu.x, top: contextMenu.y, background: "var(--surface-card)", border: "1px solid var(--border-base)" }}
            onClick={(e) => e.stopPropagation()}>
            <button onClick={() => applyAs("background")}
              className="w-full px-3 py-2 text-left text-[11px] font-medium flex items-center gap-2 hover:bg-white/5"
              style={{ color: "var(--text-primary)" }}>
              <HiOutlineSquare2Stack size={12} /> Как фон
            </button>
            <button onClick={() => applyAs("artwork")}
              className="w-full px-3 py-2 text-left text-[11px] font-medium flex items-center gap-2 hover:bg-white/5"
              style={{ color: "var(--text-primary)" }}>
              <HiOutlinePhoto size={12} /> Как обложка
            </button>
            <button onClick={() => applyAs("cursor")}
              className="w-full px-3 py-2 text-left text-[11px] font-medium flex items-center gap-2 hover:bg-white/5"
              style={{ color: "var(--text-primary)" }}>
              <HiOutlineCursorArrowRays size={12} /> Как курсор
            </button>
            <div className="my-1 border-t" style={{ borderColor: "var(--border-base)" }} />
            <button onClick={() => { removeLibraryItem(contextMenu.item.id); setContextMenu(null); }}
              className="w-full px-3 py-2 text-left text-[11px] font-medium flex items-center gap-2 hover:bg-red-500/10 text-red-400">
              <HiOutlineTrash size={12} /> Удалить
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen Library Modal */}
      <AnimatePresence>
        {showFullLibrary && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6"
            style={{ background: "rgba(0, 0, 0, 0.8)" }}
            onClick={() => setShowFullLibrary(false)}>
            <motion.div 
              initial={{ scale: 0.9 }} 
              animate={{ scale: 1 }} 
              exit={{ scale: 0.9 }}
              className="w-full max-w-6xl h-[80vh] rounded-2xl overflow-hidden flex flex-col"
              style={{ background: "var(--surface-card)", border: "1px solid var(--border-base)" }}
              onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="px-4 py-3 flex items-center justify-between border-b" style={{ borderColor: "var(--border-base)" }}>
                <div className="flex items-center gap-3">
                  <HiOutlineFolder size={20} style={{ color: "var(--interactive-accent)" }} />
                  <span className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>Каталог</span>
                  <span className="text-xs px-2 py-1 rounded-full" style={{ background: "var(--surface-elevated)", color: "var(--text-subtle)" }}>{libraryItems.length} элементов</span>
                </div>
                <div className="flex items-center gap-2">
                  {(["grid", "masonry"] as LibraryViewMode[]).map((mode) => (
                    <button key={mode} onClick={() => setViewMode(mode)}
                      className="w-10 h-10 rounded-lg flex items-center justify-center transition-all"
                      style={{ background: viewMode === mode ? "var(--interactive-accent)" : "transparent", color: viewMode === mode ? "var(--interactive-accent-text)" : "var(--text-subtle)" }}>
                      {mode === "grid" ? <HiOutlineSquares2X2 size={20} /> : <HiOutlineListBullet size={20} />}
                    </button>
                  ))}
                  <div className="w-px h-6 mx-1" style={{ background: "var(--border-base)" }} />
                  <button onClick={() => setShowFullLibrary(false)}
                    className="w-10 h-10 rounded-lg flex items-center justify-center transition-all hover:bg-red-500/10"
                    style={{ color: "#ef4444" }}>
                    <HiOutlineTrash size={20} />
                  </button>
                </div>
              </div>
              
              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {libraryItems.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center">
                    <HiOutlineFolder size={60} style={{ color: "var(--text-subtle)", opacity: 0.3 }} />
                    <p className="text-lg mt-4" style={{ color: "var(--text-subtle)" }}>Каталог пуст</p>
                    <p className="text-sm" style={{ color: "var(--text-subtle)", opacity: 0.6 }}>Добавьте изображения для начала</p>
                  </div>
                ) : (
                  <div className={viewMode === "grid" ? "grid grid-cols-6 gap-2" : "columns-5 gap-2"}>
                    {libraryItems.map((item) => (
                      <div key={item.id} className="relative">
                        <div
                          onContextMenu={(e) => handleContextMenu(e, item)}
                          onClick={() => setSelectedItem(selectedItem === item.id ? null : item.id)}
                          className={`relative ${viewMode === "grid" ? "aspect-square" : "break-inside-avoid mb-2"} rounded-lg overflow-hidden cursor-pointer group transition-opacity duration-200 hover:opacity-80`}
                          style={{ 
                            boxShadow: selectedItem === item.id 
                              ? `0 0 0 3px var(--interactive-accent)` 
                              : "none"
                          }}>
                          <img src={item.url} alt="" className={`w-full ${viewMode === "grid" ? "h-full object-cover" : "h-auto"}`} />
                          
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <button onClick={(e) => { e.stopPropagation(); removeLibraryItem(item.id); setShowFullLibrary(false); }}
                              className="p-2 rounded-lg bg-red-500/90 text-white hover:bg-red-500 shadow-lg">
                              <HiOutlineTrash size={16} />
                            </button>
                          </div>
                          {item.type === "gif" && (
                            <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded text-[8px] font-bold"
                              style={{ background: "var(--interactive-accent)", color: "var(--interactive-accent-text)" }}>GIF</div>
                          )}
                          {selectedItem === item.id && (
                            <div className="absolute top-1 left-1 w-5 h-5 rounded-full flex items-center justify-center"
                              style={{ background: "var(--interactive-accent)" }}>
                              <HiOutlineCheck size={12} style={{ color: "var(--interactive-accent-text)" }} />
                            </div>
                          )}
                        </div>
                        
                        {/* Apply Panel Below Image in Fullscreen */}
                        <AnimatePresence>
                          {selectedItem === item.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden mt-1">
                              <div className="rounded-lg p-1.5 flex gap-1" style={{ background: "var(--surface-elevated)" }}>
                                <button
                                  onClick={(e) => { e.stopPropagation(); applyAs("background"); }}
                                  className="flex-1 py-1.5 px-2 rounded text-[10px] font-medium transition-all hover:scale-105"
                                  style={{ 
                                    background: currentBackground === item.url ? "var(--interactive-accent)" : "var(--surface-card)", 
                                    color: currentBackground === item.url ? "var(--interactive-accent-text)" : "var(--text-primary)" 
                                  }}>
                                  {currentBackground === item.url ? "✓ Фон" : "Фон"}
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); applyAs("artwork"); }}
                                  className="flex-1 py-1.5 px-2 rounded text-[10px] font-medium transition-all hover:scale-105"
                                  style={{ 
                                    background: customArtworkUrl === item.url ? "var(--interactive-accent)" : "var(--surface-card)", 
                                    color: customArtworkUrl === item.url ? "var(--interactive-accent-text)" : "var(--text-primary)" 
                                  }}>
                                  {customArtworkUrl === item.url ? "✓ Обложка" : "Обложка"}
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); applyAs("cursor"); }}
                                  className="flex-1 py-1.5 px-2 rounded text-[10px] font-medium transition-all hover:scale-105"
                                  style={{ 
                                    background: customCursorUrl === item.url ? "var(--interactive-accent)" : "var(--surface-card)", 
                                    color: customCursorUrl === item.url ? "var(--interactive-accent-text)" : "var(--text-primary)" 
                                  }}>
                                  {customCursorUrl === item.url ? "✓ Курсор" : "Курсор"}
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--border-base); border-radius: 3px; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}

export { CustomizationSettingsSection };
