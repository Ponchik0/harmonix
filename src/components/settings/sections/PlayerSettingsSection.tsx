import React from "react";
import {
  HiOutlineAdjustmentsHorizontal,
  HiOutlineCog6Tooth,
  HiOutlineArrowsPointingOut,
  HiOutlineBars3,
  HiOutlineChartBar,
  HiOutlineQueueList,
  HiOutlineForward,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineChevronUp,
  HiOutlineChevronDown,
  HiOutlineBars2,
  HiOutlineXMark,
  HiOutlineSparkles,
  HiOutlineSwatch,
} from "react-icons/hi2";
import { IoMusicalNotes } from "react-icons/io5";
import {
  usePlayerSettingsStore,
  SidebarPosition,
  SliderStyle,
  TitleAlignment,
  MiniPlayerStyle,
  VisualizerStyle,
  QueuePosition,
} from "../../../stores/playerSettingsStore";

// Section wrapper component
function Section({ title, icon: Icon, children }: { title: string; icon: typeof HiOutlineCog6Tooth; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "var(--surface-card)", border: "1px solid var(--border-base)" }}>
      <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: "1px solid var(--border-base)", background: "var(--surface-elevated)" }}>
        <Icon size={16} style={{ color: "var(--interactive-accent)" }} />
        <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{title}</span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

// Toggle component with proper styling
function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className="relative w-12 h-7 rounded-full transition-all duration-200"
      style={{ 
        background: enabled 
          ? "var(--interactive-accent)" 
          : "rgba(120, 120, 128, 0.32)",
      }}
    >
      <div 
        className="absolute top-0.5 w-6 h-6 rounded-full shadow-md transition-all duration-200"
        style={{ 
          left: enabled ? "22px" : "2px",
          background: "var(--interactive-accent)",
        }} 
      />
    </button>
  );
}

export function PlayerSettingsSection() {
  const {
    sidebarPosition,
    setSidebarPosition,
    sliderStyle,
    setSliderStyle,
    titleAlignment,
    setTitleAlignment,
    miniPlayerStyle,
    setMiniPlayerStyle,
    visualizerStyle,
    setVisualizerStyle,
    visualizerEnabled,
    setVisualizerEnabled,
    customVisualizerColor,
    setCustomVisualizerColor,
    queuePosition,
    setQueuePosition,
    showNextTrackPreview,
    setShowNextTrackPreview,
  } = usePlayerSettingsStore();

  const sidebarOptions: { id: SidebarPosition; label: string; icon: React.ReactNode }[] = [
    { id: "left", label: "Слева", icon: <HiOutlineChevronLeft size={18} /> },
    { id: "top", label: "Сверху", icon: <HiOutlineChevronUp size={18} /> },
    { id: "right", label: "Справа", icon: <HiOutlineChevronRight size={18} /> },
  ];

  const sliderStyles: { id: SliderStyle; label: string; icon: React.ReactNode }[] = [
    {
      id: "default",
      label: "Обычный",
      icon: (
        <div className="w-full h-1.5 rounded-full relative" style={{ background: "var(--surface-elevated)" }}>
          <div className="h-full w-1/2 rounded-full" style={{ background: "var(--interactive-accent)" }} />
        </div>
      ),
    },
    {
      id: "ios",
      label: "iOS",
      icon: (
        <div className="w-full h-2 rounded-full relative" style={{ background: "var(--surface-elevated)" }}>
          <div className="h-full w-1/2 rounded-full" style={{ background: "var(--interactive-accent)" }} />
          <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full shadow-md" style={{ left: "calc(50% - 6px)", background: "var(--interactive-accent)" }} />
        </div>
      ),
    },
    {
      id: "thin",
      label: "Тонкий",
      icon: (
        <div className="w-full h-0.5 rounded-full relative" style={{ background: "var(--surface-elevated)" }}>
          <div className="h-full w-1/2 rounded-full" style={{ background: "var(--interactive-accent)" }} />
        </div>
      ),
    },
    {
      id: "wavy",
      label: "Волнистый",
      icon: (
        <div className="w-full h-3 relative flex items-center" style={{ background: "transparent" }}>
          <svg width="100%" height="10" viewBox="0 0 200 10" preserveAspectRatio="none" style={{ opacity: 0.25 }}>
            <path d="M0,5 C10,2 20,8 30,5 C40,2 50,8 60,5 C70,2 80,8 90,5 C100,2 110,8 120,5 C130,2 140,8 150,5 C160,2 170,8 180,5 C190,2 200,8 200,5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color: "var(--text-subtle)" }} />
          </svg>
          <svg width="100%" height="10" viewBox="0 0 200 10" preserveAspectRatio="none" style={{ position: "absolute", left: 0, clipPath: "inset(0 50% 0 0)" }}>
            <path d="M0,5 C10,2 20,8 30,5 C40,2 50,8 60,5 C70,2 80,8 90,5 C100,2 110,8 120,5 C130,2 140,8 150,5 C160,2 170,8 180,5 C190,2 200,8 200,5" fill="none" stroke="var(--interactive-accent)" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          <div className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full" style={{ left: "calc(50% - 3px)", background: "var(--interactive-accent)", boxShadow: "0 0 6px var(--interactive-accent)" }} />
        </div>
      ),
    },
  ];

  const queuePositionOptions: { id: QueuePosition; label: string; icon: React.ReactNode }[] = [
    { id: "left", label: "Слева", icon: <HiOutlineChevronLeft size={16} /> },
    { id: "right", label: "Справа", icon: <HiOutlineChevronRight size={16} /> },
    { id: "bottom", label: "Снизу", icon: <HiOutlineChevronDown size={16} /> },
  ];

  const alignmentOptions: { id: TitleAlignment; label: string; icon: React.ReactNode }[] = [
    { id: "left", label: "Слева", icon: <HiOutlineBars2 size={16} style={{ transform: "scaleX(-1)" }} /> },
    { id: "center", label: "Центр", icon: <HiOutlineBars3 size={16} /> },
    { id: "right", label: "Справа", icon: <HiOutlineBars2 size={16} /> },
  ];

  const getMiniPlayerPreview = (id: MiniPlayerStyle) => {
    const baseStyle: React.CSSProperties = {
      width: "100%",
      height: "32px",
      borderRadius: "6px",
      display: "flex",
      alignItems: "center",
      padding: "0 8px",
      gap: "6px",
    };
    const dot: React.CSSProperties = {
      width: "16px",
      height: "16px",
      borderRadius: "4px",
      background: "var(--surface-elevated)",
      flexShrink: 0,
    };
    const bar: React.CSSProperties = {
      flex: 1,
      height: "4px",
      borderRadius: "2px",
      background: "var(--surface-elevated)",
    };
    const barFill: React.CSSProperties = {
      width: "40%",
      height: "100%",
      borderRadius: "2px",
      background: "var(--interactive-accent)",
    };

    switch (id) {
      case "minimal":
        return (
          <div style={{ ...baseStyle, background: "var(--surface-card)", borderRadius: "12px" }}>
            <div style={{ ...dot, borderRadius: "8px", width: "14px", height: "14px" }} />
            <div style={{ ...bar, width: "40px", flex: "none" }}><div style={barFill} /></div>
            <div style={{ width: "18px", height: "18px", borderRadius: "50%", background: "var(--interactive-accent)", flexShrink: 0 }} />
          </div>
        );
      case "compact":
        return (
          <div style={{ width: "100%" }}>
            <div style={{ height: "3px", background: "var(--surface-elevated)", marginBottom: "4px", borderRadius: "2px", overflow: "hidden" }}>
              <div style={{ width: "40%", height: "100%", background: "var(--interactive-accent)" }} />
            </div>
            <div style={{ ...baseStyle, height: "28px", background: "var(--surface-card)", borderRadius: "0", gap: "8px" }}>
              <div style={{ width: "20px", height: "20px", borderRadius: "50%", border: "2px solid var(--interactive-accent)", position: "relative" }}>
                <div style={{ position: "absolute", inset: "2px", borderRadius: "50%", background: "var(--surface-elevated)" }} />
              </div>
              <div style={{ flex: 1 }} />
              <div style={{ width: "18px", height: "18px", borderRadius: "50%", background: "var(--interactive-accent)", flexShrink: 0 }} />
            </div>
          </div>
        );
      case "glass":
        return (
          <div
            style={{
              ...baseStyle,
              height: "34px",
              background: "rgba(255,255,255,0.03)",
              borderRadius: "10px",
              border: "1px solid rgba(255,255,255,0.08)",
              padding: "0 10px",
            }}
          >
            <div style={{ ...dot, width: "16px", height: "16px", borderRadius: "6px", background: "rgba(255,255,255,0.1)" }} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "3px" }}>
              <div style={{ height: "3px", width: "50%", borderRadius: "2px", background: "rgba(255,255,255,0.1)" }} />
              <div style={{ ...bar, height: "2px", background: "rgba(255,255,255,0.05)" }}>
                <div style={{ ...barFill, background: "rgba(255,255,255,0.4)" }} />
              </div>
            </div>
            <div style={{ width: "18px", height: "18px", borderRadius: "50%", background: "rgba(255,255,255,0.15)", flexShrink: 0 }} />
          </div>
        );
      case "classic":
      default:
        return (
          <div style={{ ...baseStyle, background: "var(--surface-card)", borderTop: "1px solid var(--border-base)", borderRadius: "8px" }}>
            <div style={dot} />
            <div style={bar}><div style={barFill} /></div>
            <div style={{ width: "18px", height: "18px", borderRadius: "50%", background: "var(--interactive-accent)", flexShrink: 0 }} />
          </div>
        );
    }
  };

  const miniPlayerStyles: { id: MiniPlayerStyle; label: string; desc: string }[] = [
    { id: "classic", label: "Классический", desc: "Стандартный вид" },
    { id: "minimal", label: "Минимальный", desc: "Компактный" },
    { id: "compact", label: "Компактный", desc: "С круговым прогрессом" },
    { id: "glass", label: "Стеклянный", desc: "Прозрачный эффект" },
  ];

  const visualizerStyles: { id: VisualizerStyle; label: string; icon: React.ReactNode }[] = [
    { id: "bars", label: "Столбцы", icon: <HiOutlineChartBar size={18} /> },
    { id: "wave", label: "Волна", icon: <IoMusicalNotes size={18} /> },
    { id: "circle", label: "Круг", icon: <div className="w-4 h-4 rounded-full border-2" style={{ borderColor: "currentColor" }} /> },
    { id: "particles", label: "Частицы", icon: <HiOutlineSparkles size={18} /> },
    { id: "none", label: "Выкл", icon: <HiOutlineXMark size={18} /> },
  ];

  const visualizerColors = [
    { id: "var(--interactive-accent)", label: "Акцент", color: "var(--interactive-accent)" },
    { id: "#ef4444", label: "Красный", color: "#ef4444" },
    { id: "#f97316", label: "Оранжевый", color: "#f97316" },
    { id: "#eab308", label: "Жёлтый", color: "#eab308" },
    { id: "#22c55e", label: "Зелёный", color: "#22c55e" },
    { id: "#06b6d4", label: "Голубой", color: "#06b6d4" },
    { id: "#3b82f6", label: "Синий", color: "#3b82f6" },
    { id: "#8b5cf6", label: "Фиолетовый", color: "#8b5cf6" },
    { id: "#ec4899", label: "Розовый", color: "#ec4899" },
    { id: "#ffffff", label: "Белый", color: "#ffffff" },
  ];

  return (
    <div className="space-y-6">
      {/* Sidebar Position */}
      <Section title="Позиция сайдбара" icon={HiOutlineBars3}>
        <div className="grid grid-cols-3 gap-3">
          {sidebarOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setSidebarPosition(opt.id)}
              className="p-3 rounded-xl border-2 transition-all hover:scale-[1.02]"
              style={{
                background: sidebarPosition === opt.id ? "color-mix(in srgb, var(--interactive-accent) 12%, transparent)" : "var(--surface-card)",
                borderColor: sidebarPosition === opt.id ? "var(--interactive-accent)" : "var(--border-base)",
              }}
            >
              {/* Visual preview */}
              <div 
                className="w-full h-14 rounded-lg mb-2 relative overflow-hidden"
                style={{ background: "var(--surface-elevated)" }}
              >
                {/* Sidebar indicator */}
                <div 
                  className="absolute transition-all"
                  style={{
                    background: sidebarPosition === opt.id ? "var(--interactive-accent)" : "var(--text-subtle)",
                    opacity: sidebarPosition === opt.id ? 1 : 0.4,
                    ...(opt.id === "left" ? { left: 2, top: 2, bottom: 2, width: 8, borderRadius: 4 } : {}),
                    ...(opt.id === "right" ? { right: 2, top: 2, bottom: 2, width: 8, borderRadius: 4 } : {}),
                    ...(opt.id === "top" ? { left: 2, right: 2, top: 2, height: 8, borderRadius: 4 } : {}),
                  }}
                />
                {/* Content area */}
                <div 
                  className="absolute rounded"
                  style={{
                    background: "var(--surface-card)",
                    ...(opt.id === "left" ? { left: 14, top: 4, right: 4, bottom: 4 } : {}),
                    ...(opt.id === "right" ? { left: 4, top: 4, right: 14, bottom: 4 } : {}),
                    ...(opt.id === "top" ? { left: 4, top: 14, right: 4, bottom: 4 } : {}),
                  }}
                />
              </div>
              <span 
                className="text-xs font-medium flex items-center justify-center gap-1.5" 
                style={{ color: sidebarPosition === opt.id ? "var(--text-primary)" : "var(--text-secondary)" }}
              >
                {opt.icon}
                {opt.label}
              </span>
            </button>
          ))}
        </div>
      </Section>

      {/* Slider Style */}
      <Section title="Стиль прогресса трека" icon={HiOutlineAdjustmentsHorizontal}>
        <div className="grid grid-cols-4 gap-3">
          {sliderStyles.map((style) => (
            <button
              key={style.id}
              onClick={() => setSliderStyle(style.id)}
              className="p-3 rounded-xl border-2 transition-all hover:scale-[1.02] flex flex-col items-center gap-2"
              style={{
                background: sliderStyle === style.id ? "var(--surface-elevated)" : "var(--surface-card)",
                borderColor: sliderStyle === style.id ? "var(--interactive-accent)" : "var(--border-base)",
              }}
            >
              <div className="w-full px-1">{style.icon}</div>
              <span className="text-[10px] font-medium" style={{ color: sliderStyle === style.id ? "var(--text-primary)" : "var(--text-secondary)" }}>
                {style.label}
              </span>
            </button>
          ))}
        </div>
      </Section>

      {/* Title Alignment */}
      <Section title="Выравнивание заголовка" icon={HiOutlineCog6Tooth}>
        <div className="flex gap-2 p-1 rounded-lg" style={{ background: "var(--surface-elevated)" }}>
          {alignmentOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setTitleAlignment(opt.id)}
              className="flex-1 py-2.5 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2"
              style={{
                background: titleAlignment === opt.id ? "var(--surface-card)" : "transparent",
                color: titleAlignment === opt.id ? "var(--text-primary)" : "var(--text-subtle)",
              }}
            >
              <span>{opt.icon}</span>
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      </Section>

      {/* Mini Player Style */}
      <Section title="Стиль мини-плеера" icon={HiOutlineArrowsPointingOut}>
        <div className="grid grid-cols-2 gap-3">
          {miniPlayerStyles.map((style) => (
            <button
              key={style.id}
              onClick={() => setMiniPlayerStyle(style.id)}
              className="p-3 rounded-xl border-2 text-left transition-all hover:scale-[1.01]"
              style={{
                background: miniPlayerStyle === style.id ? "color-mix(in srgb, var(--interactive-accent) 15%, transparent)" : "var(--surface-card)",
                borderColor: miniPlayerStyle === style.id ? "var(--interactive-accent)" : "var(--border-base)",
              }}
            >
              <div className="mb-2">{getMiniPlayerPreview(style.id)}</div>
              <h4 className="text-sm font-medium" style={{ color: miniPlayerStyle === style.id ? "var(--text-primary)" : "var(--text-secondary)" }}>
                {style.label}
              </h4>
              <p className="text-[10px] mt-0.5" style={{ color: "var(--text-subtle)" }}>{style.desc}</p>
            </button>
          ))}
        </div>
      </Section>

      {/* Visualizer */}
      <Section title="Визуализатор" icon={HiOutlineChartBar}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: "var(--text-primary)" }}>Включить визуализатор</span>
            <Toggle enabled={visualizerEnabled} onChange={setVisualizerEnabled} />
          </div>
          {visualizerEnabled && (
            <>
              <div className="grid grid-cols-5 gap-2">
                {visualizerStyles.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setVisualizerStyle(style.id)}
                    className="p-2 rounded-lg border transition-all text-center"
                    style={{
                      background: visualizerStyle === style.id ? "var(--surface-elevated)" : "transparent",
                      borderColor: visualizerStyle === style.id ? "var(--interactive-accent)" : "var(--border-base)",
                    }}
                  >
                    <div className="text-lg mb-1">{style.icon}</div>
                    <span className="text-[9px]" style={{ color: visualizerStyle === style.id ? "var(--text-primary)" : "var(--text-subtle)" }}>
                      {style.label}
                    </span>
                  </button>
                ))}
              </div>
              
              {/* Visualizer Color */}
              <div className="pt-3 border-t" style={{ borderColor: "var(--border-base)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <HiOutlineSwatch size={14} style={{ color: "var(--text-subtle)" }} />
                  <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Цвет визуализатора</span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {visualizerColors.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setCustomVisualizerColor(c.id)}
                      className="relative aspect-square rounded-lg transition-all hover:scale-105"
                      style={{
                        background: c.color,
                        boxShadow: customVisualizerColor === c.id 
                          ? `0 0 0 2px var(--surface-card), 0 0 0 4px var(--interactive-accent)` 
                          : "none",
                      }}
                      title={c.label}
                    >
                      {customVisualizerColor === c.id && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div 
                            className="w-2 h-2 rounded-full"
                            style={{ 
                              background: c.id === "#ffffff" ? "#000" : "#fff",
                              boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                            }}
                          />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </Section>

      {/* Queue Position */}
      <Section title="Позиция очереди" icon={HiOutlineQueueList}>
        <div className="grid grid-cols-3 gap-3">
          {queuePositionOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setQueuePosition(opt.id)}
              className="p-3 rounded-xl border-2 transition-all hover:scale-[1.02]"
              style={{
                background: queuePosition === opt.id ? "color-mix(in srgb, var(--interactive-accent) 12%, transparent)" : "var(--surface-card)",
                borderColor: queuePosition === opt.id ? "var(--interactive-accent)" : "var(--border-base)",
              }}
            >
              {/* Visual preview */}
              <div 
                className="w-full h-12 rounded-lg mb-2 relative overflow-hidden"
                style={{ background: "var(--surface-elevated)" }}
              >
                {/* Queue indicator */}
                <div 
                  className="absolute transition-all"
                  style={{
                    background: queuePosition === opt.id ? "var(--interactive-accent)" : "var(--text-subtle)",
                    opacity: queuePosition === opt.id ? 1 : 0.4,
                    ...(opt.id === "left" ? { left: 2, top: 2, bottom: 2, width: 10, borderRadius: 3 } : {}),
                    ...(opt.id === "right" ? { right: 2, top: 2, bottom: 2, width: 10, borderRadius: 3 } : {}),
                    ...(opt.id === "bottom" ? { left: 2, right: 2, bottom: 2, height: 10, borderRadius: 3 } : {}),
                  }}
                />
                {/* Content area */}
                <div 
                  className="absolute rounded"
                  style={{
                    background: "var(--surface-card)",
                    ...(opt.id === "left" ? { left: 16, top: 4, right: 4, bottom: 4 } : {}),
                    ...(opt.id === "right" ? { left: 4, top: 4, right: 16, bottom: 4 } : {}),
                    ...(opt.id === "bottom" ? { left: 4, top: 4, right: 4, bottom: 16 } : {}),
                  }}
                />
              </div>
              <span 
                className="text-xs font-medium flex items-center justify-center gap-1.5" 
                style={{ color: queuePosition === opt.id ? "var(--text-primary)" : "var(--text-secondary)" }}
              >
                {opt.icon}
                {opt.label}
              </span>
            </button>
          ))}
        </div>
      </Section>

      {/* Next Track Preview */}
      <Section title="Предпросмотр" icon={HiOutlineForward}>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm" style={{ color: "var(--text-primary)" }}>Следующий трек</span>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-subtle)" }}>Показывать превью следующего трека в очереди</p>
          </div>
          <Toggle enabled={showNextTrackPreview} onChange={setShowNextTrackPreview} />
        </div>
      </Section>

    </div>
  );
}
