import { memo } from "react";
import {
  IoPlaySkipBackSharp,
  IoPlaySkipForwardSharp,
  IoVolumeHigh,
  IoVolumeMute,
  IoVolumeMedium,
  IoVolumeLow,
  IoShuffle,
  IoRepeat,
  IoHeart,
  IoHeartOutline,
  IoChevronUp,
  IoOptions,
} from "react-icons/io5";
import { HiOutlinePlay, HiOutlinePause, HiOutlineCheckBadge } from "react-icons/hi2";
import { PlayerBarProps } from "./types";

export const PlayerBarClassic = memo(function PlayerBarClassic({
  currentTrack,
  artworkUrl,
  displayPlaying,
  isLiked,
  isDragging,
  isDraggingVolume,
  displayProgress,
  volume,
  shuffle,
  repeatMode,
  currentTime,
  colors,
  isLightTheme,
  progressRef,
  sliderStyle,
  titleAlignment,
  showEqualizerMenu,
  onProgressMouseDown,
  onLikeClick,
  onPrev,
  onNext,
  onToggle,
  onShuffle,
  onRepeat,
  onVolToggle,
  onVolChange,
  onVolDragStart,
  onVolDragEnd,
  onExpand,
  onTrackClick,
  onArtistClick,
  isArtistVerified,
  onEqualizerClick,
  formatTime,
}: PlayerBarProps) {
  const VolumeIcon = volume === 0 ? IoVolumeMute : volume < 0.3 ? IoVolumeLow : volume < 0.7 ? IoVolumeMedium : IoVolumeHigh;
  const getSliderHeight = () => sliderStyle === "ios" ? "h-2" : sliderStyle === "wavy" ? "h-2" : sliderStyle === "thin" ? "h-0.5" : "h-1";
  const showThumb = sliderStyle === "ios" || isDragging;
  const getTitleAlign = () => titleAlignment === "center" ? "text-center" : titleAlignment === "right" ? "text-right" : "text-left";
  
  // Theme-aware colors
  const iconColor = isLightTheme ? "rgba(0,0,0,0.7)" : colors.textSecondary;
  const hoverBg = isLightTheme ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.05)";

  return (
    <div 
      style={{ 
        background: colors.surface,
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
      }}
    >
      {/* Progress bar */}
      <div className="px-4 pt-3">
        <div className="flex items-center gap-3">
          <span className="text-[11px] tabular-nums w-10 text-right" style={{ color: colors.textSecondary }}>{formatTime(currentTime)}</span>
          <div ref={progressRef} onMouseDown={onProgressMouseDown}
            className={`flex-1 ${getSliderHeight()} cursor-pointer rounded-full relative group`}
            style={{ background: sliderStyle === "wavy" ? "transparent" : `${colors.textSecondary}20` }}>
            {sliderStyle === "wavy" ? (
              <>
                {/* Background wave */}
                <svg 
                  width="100%" 
                  height="10" 
                  viewBox="0 0 200 10" 
                  preserveAspectRatio="none"
                  style={{ position: "absolute", top: "50%", transform: "translateY(-50%)", opacity: 0.25 }}
                >
                  <path 
                    d="M0,5 C10,2 20,8 30,5 C40,2 50,8 60,5 C70,2 80,8 90,5 C100,2 110,8 120,5 C130,2 140,8 150,5 C160,2 170,8 180,5 C190,2 200,8 200,5" 
                    fill="none" 
                    stroke={colors.textSecondary} 
                    strokeWidth="2" 
                    strokeLinecap="round"
                  />
                </svg>
                {/* Progress wave */}
                <svg 
                  width="100%"
                  height="10" 
                  viewBox="0 0 200 10"
                  preserveAspectRatio="none"
                  style={{ 
                    position: "absolute", 
                    top: "50%", 
                    transform: "translateY(-50%)", 
                    left: 0,
                    clipPath: `inset(0 ${100 - displayProgress * 100}% 0 0)`,
                    transition: isDragging ? 'none' : 'clip-path 0.15s linear',
                  }}
                >
                  <path 
                    d="M0,5 C10,2 20,8 30,5 C40,2 50,8 60,5 C70,2 80,8 90,5 C100,2 110,8 120,5 C130,2 140,8 150,5 C160,2 170,8 180,5 C190,2 200,8 200,5"
                    fill="none" 
                    stroke={colors.accent} 
                    strokeWidth="2.5" 
                    strokeLinecap="round"
                  />
                </svg>
                {/* Glow effect at progress point */}
                <div 
                  className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
                  style={{ 
                    left: `calc(${displayProgress * 100}% - 4px)`,
                    background: colors.accent,
                    boxShadow: `0 0 8px ${colors.accent}, 0 0 12px ${colors.accent}50`,
                    transition: isDragging ? 'none' : 'left 0.15s linear',
                  }}
                />
              </>
            ) : (
              <div className="h-full rounded-full"
                style={{ width: `${displayProgress * 100}%`, background: colors.accent, transition: isDragging ? 'none' : 'width 0.15s linear' }} />
            )}
            {showThumb && (
              <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full shadow-md"
                style={{ left: `calc(${displayProgress * 100}% - 6px)`, background: sliderStyle === "ios" ? "var(--interactive-accent)" : colors.accent,
                  boxShadow: "0 1px 4px rgba(0,0,0,0.3)", opacity: isDragging || sliderStyle === "ios" ? 1 : 0, transition: isDragging ? 'left 0s, opacity 0.2s' : 'left 0.15s linear, opacity 0.2s' }} />
            )}
          </div>
          <span className="text-[11px] tabular-nums w-10" style={{ color: colors.textSecondary }}>{formatTime(currentTrack?.duration || 0)}</span>
        </div>
      </div>

      {/* Main content */}
      <div className="flex items-center h-[70px] px-4">
        {/* Left - Track info */}
        <div className="flex items-center gap-3 w-[260px] cursor-pointer" onClick={onTrackClick}>
          {currentTrack ? (
            <>
              <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                {artworkUrl ? (
                  <img 
                    src={artworkUrl} 
                    alt="" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : null}
                {/* Transparent background when no artwork */}
                {!artworkUrl && (
                  <div className="absolute inset-0 bg-white/5" />
                )}
                {displayPlaying && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <div className="flex items-end gap-0.5 h-3">
                      {[1, 2, 3].map((i) => <div key={i} className="w-0.5 rounded-full" style={{ background: colors.accent, animation: `soundbar 0.4s ease-in-out ${i * 0.1}s infinite alternate` }} />)}
                    </div>
                  </div>
                )}
              </div>
              <div className={`flex-1 min-w-0 ${getTitleAlign()}`}>
                <p className="text-sm font-medium truncate" style={{ color: colors.textPrimary }}>{currentTrack.title}</p>
                <div className="flex items-center gap-1 min-w-0">
                  <p className="text-xs truncate cursor-pointer hover:underline transition-all" style={{ color: colors.textSecondary }} onClick={(e) => { e.stopPropagation(); onArtistClick(); }}>{currentTrack.artist}</p>
                  {isArtistVerified && <HiOutlineCheckBadge size={14} className="flex-shrink-0" style={{ color: '#3B82F6' }} />}
                </div>
              </div>
              <button type="button" onClick={(e) => { e.stopPropagation(); onLikeClick(); }}
                className="w-8 h-8 flex items-center justify-center rounded-full transition-all hover:scale-110"
                style={{ color: isLiked ? "#ef4444" : "#ffffff" }}>
                {isLiked ? <IoHeart size={18} /> : <IoHeartOutline size={18} />}
              </button>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${colors.textSecondary}10` }}><span style={{ color: colors.textSecondary }}>♪</span></div>
              <p className="text-sm" style={{ color: colors.textSecondary }}>Выбери трек</p>
            </div>
          )}
        </div>

        {/* Center - Controls */}
        <div className="flex-1 flex items-center justify-center gap-2">
          <button type="button" onClick={onShuffle} className="w-9 h-9 flex items-center justify-center rounded-full transition-all hover:scale-105"
            style={{ color: shuffle ? (isLightTheme ? "#ffffff" : "#000000") : (isLightTheme ? "#000000" : "#ffffff"), background: shuffle ? (isLightTheme ? "#000000" : "#ffffff") : (isLightTheme ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.2)") }}
            onMouseEnter={(e) => e.currentTarget.style.background = shuffle ? (isLightTheme ? "#1a1a1a" : "#f0f0f0") : (isLightTheme ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.3)")}
            onMouseLeave={(e) => e.currentTarget.style.background = shuffle ? (isLightTheme ? "#000000" : "#ffffff") : (isLightTheme ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.2)")}><IoShuffle size={18} /></button>
          <button type="button" onClick={onPrev} className="w-10 h-10 flex items-center justify-center transition-all hover:scale-105" 
            style={{ color: isLightTheme ? "#000000" : "#ffffff" }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"}
            onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}><IoPlaySkipBackSharp size={24} /></button>
          <button type="button" onClick={onToggle} className="w-12 h-12 flex items-center justify-center rounded-full transition-all hover:scale-105" 
            style={{ background: isLightTheme ? "#000000" : "#ffffff" }}
            onMouseEnter={(e) => e.currentTarget.style.background = isLightTheme ? "#1a1a1a" : "#f0f0f0"}
            onMouseLeave={(e) => e.currentTarget.style.background = isLightTheme ? "#000000" : "#ffffff"}>
            {displayPlaying ? <HiOutlinePause size={24} style={{ color: isLightTheme ? "#ffffff" : "#000000" }} /> : <HiOutlinePlay size={24} style={{ color: isLightTheme ? "#ffffff" : "#000000", marginLeft: 2 }} />}
          </button>
          <button type="button" onClick={onNext} className="w-10 h-10 flex items-center justify-center transition-all hover:scale-105" 
            style={{ color: isLightTheme ? "#000000" : "#ffffff" }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"}
            onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}><IoPlaySkipForwardSharp size={24} /></button>
          <button type="button" onClick={onRepeat} className="w-9 h-9 flex items-center justify-center rounded-full relative transition-all hover:scale-105"
            style={{ color: repeatMode !== "off" ? (isLightTheme ? "#ffffff" : "#000000") : (isLightTheme ? "#000000" : "#ffffff"), background: repeatMode !== "off" ? (isLightTheme ? "#000000" : "#ffffff") : (isLightTheme ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.2)") }}
            onMouseEnter={(e) => e.currentTarget.style.background = repeatMode !== "off" ? (isLightTheme ? "#1a1a1a" : "#f0f0f0") : (isLightTheme ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.3)")}
            onMouseLeave={(e) => e.currentTarget.style.background = repeatMode !== "off" ? (isLightTheme ? "#000000" : "#ffffff") : (isLightTheme ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.2)")}>
            <IoRepeat size={18} />{repeatMode === "one" && <span className="absolute -top-0.5 -right-0.5 text-[8px] font-bold" style={{ color: isLightTheme ? "#ffffff" : "#000000" }}>1</span>}
          </button>
        </div>

        {/* Right - Volume, Equalizer & extras */}
        <div className="flex items-center justify-end gap-1 w-[260px]">
          {/* Equalizer button */}
          <button 
            type="button" 
            onClick={onEqualizerClick}
            className="w-9 h-9 flex items-center justify-center rounded-full flex-shrink-0"
            style={{ color: showEqualizerMenu ? "#000000" : "#ffffff", background: showEqualizerMenu ? "#ffffff" : "transparent" }}
            onMouseEnter={(e) => e.currentTarget.style.background = showEqualizerMenu ? "#f0f0f0" : hoverBg}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            title="Эквалайзер"
          >
            <IoOptions size={18} />
          </button>
          
          <div className="flex items-center group">
            <button type="button" onClick={onVolToggle} className="w-9 h-9 flex items-center justify-center rounded-full flex-shrink-0" 
              style={{ color: iconColor, background: "transparent" }}
              onMouseEnter={(e) => e.currentTarget.style.background = hoverBg}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}><VolumeIcon size={18} /></button>
            <div className={`overflow-hidden transition-all duration-300 ease-out ${isDraggingVolume ? 'w-20' : 'w-0 group-hover:w-20'}`}>
              <div className="w-20 h-1 rounded-full cursor-pointer relative ml-1" style={{ background: `${colors.textSecondary}30` }}>
                <div className="h-full rounded-full" style={{ width: `${volume * 100}%`, background: colors.accent, transition: 'width 0.1s ease-out' }} />
                <input type="range" min="0" max="1" step="0.01" value={volume} onChange={onVolChange} onInput={onVolChange} onMouseDown={onVolDragStart} onMouseUp={onVolDragEnd} onTouchStart={onVolDragStart} onTouchEnd={onVolDragEnd} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              </div>
            </div>
          </div>
          <button type="button" onClick={onExpand} className="w-9 h-9 flex items-center justify-center rounded-full flex-shrink-0" 
            style={{ color: iconColor, background: "transparent" }}
            onMouseEnter={(e) => e.currentTarget.style.background = hoverBg}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}><IoChevronUp size={18} /></button>
        </div>
      </div>

      <style>{`
        @keyframes soundbar { 0% { height: 4px; } 100% { height: 12px; } }
      `}</style>
    </div>
  );
});
