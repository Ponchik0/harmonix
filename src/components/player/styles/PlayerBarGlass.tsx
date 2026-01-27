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
} from "react-icons/io5";
import { HiOutlinePlay, HiOutlinePause } from "react-icons/hi2";
import { PlayerBarProps } from "./types";

export const PlayerBarGlass = memo(function PlayerBarGlass({
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
  formatTime,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  playbackSpeed: _playbackSpeed,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  showSpeedMenu: _showSpeedMenu,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  showEqualizerMenu: _showEqualizerMenu,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onSpeedClick: _onSpeedClick,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onEqualizerClick: _onEqualizerClick,
}: PlayerBarProps) {
  const VolumeIcon = volume === 0 ? IoVolumeMute : volume < 0.3 ? IoVolumeLow : volume < 0.7 ? IoVolumeMedium : IoVolumeHigh;
  const getSliderHeight = () => sliderStyle === "wavy" ? "h-2" : sliderStyle === "ios" ? "h-2" : sliderStyle === "thin" ? "h-0.5" : "h-1";
  const showThumb = sliderStyle === "ios" || isDragging;
  
  // Colors for light/dark theme
  const textPrimary = isLightTheme ? "rgba(0,0,0,0.9)" : "rgba(255,255,255,0.95)";
  const textSecondary = isLightTheme ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.6)";
  const textTime = isLightTheme ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.7)";
  const iconColor = isLightTheme ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.7)";
  const iconColorActive = isLightTheme ? "rgba(0,0,0,0.8)" : "rgba(255,255,255,0.8)";
  const glassBase = isLightTheme ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.12)";
  const glassMid = isLightTheme ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.05)";
  const glassEnd = isLightTheme ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.02)";
  const borderColor = isLightTheme ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.18)";
  const shineColor = isLightTheme ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.15)";
  const progressBg = isLightTheme ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.15)";
  const hoverBg = isLightTheme ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.1)";
  const volumeBg = isLightTheme ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.2)";

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${glassBase} 0%, ${glassMid} 50%, ${glassEnd} 100%)`,
        backdropFilter: "blur(40px) saturate(180%)",
        WebkitBackdropFilter: "blur(40px) saturate(180%)",
        border: `1px solid ${borderColor}`,
      }}
    >
      {/* Progress bar at top */}
      <div className="px-4 pt-3 relative z-10">
        <div className="flex items-center gap-3">
          <span className="text-[10px] tabular-nums w-8 text-right font-medium" style={{ color: textTime }}>
            {formatTime(currentTime)}
          </span>
          <div
            ref={progressRef}
            onMouseDown={onProgressMouseDown}
            className={`flex-1 ${getSliderHeight()} cursor-pointer rounded-full relative group`}
            style={{ background: progressBg }}
          >
            {sliderStyle === "wavy" ? (
              <>
                <svg width="100%" height="10" viewBox="0 0 200 10" preserveAspectRatio="none" style={{ position: "absolute", top: "50%", transform: "translateY(-50%)", opacity: 0.3 }}>
                  <path d="M0,5 C10,2 20,8 30,5 C40,2 50,8 60,5 C70,2 80,8 90,5 C100,2 110,8 120,5 C130,2 140,8 150,5 C160,2 170,8 180,5 C190,2 200,8 200,5" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <svg width="100%" height="10" viewBox="0 0 200 10" preserveAspectRatio="none" style={{ position: "absolute", top: "50%", transform: "translateY(-50%)", left: 0, clipPath: `inset(0 ${100 - displayProgress * 100}% 0 0)`, transition: isDragging ? 'none' : 'clip-path 0.15s linear' }}>
                  <path d="M0,5 C10,2 20,8 30,5 C40,2 50,8 60,5 C70,2 80,8 90,5 C100,2 110,8 120,5 C130,2 140,8 150,5 C160,2 170,8 180,5 C190,2 200,8 200,5" fill="none" stroke={colors.accent} strokeWidth="2.5" strokeLinecap="round" />
                </svg>
                <div className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full" style={{ left: `calc(${displayProgress * 100}% - 5px)`, background: colors.accent, boxShadow: `0 0 12px ${colors.accent}, 0 0 20px ${colors.accent}50`, transition: isDragging ? 'none' : 'left 0.15s linear' }} />
              </>
            ) : (
              <div
                className="h-full rounded-full relative"
                style={{
                  width: `${displayProgress * 100}%`,
                  background: `linear-gradient(90deg, ${colors.accent}, ${colors.accent}cc)`,
                  boxShadow: `0 0 12px ${colors.accent}60`,
                  transition: isDragging ? 'none' : 'width 0.15s linear',
                }}
              />
            )}
            {showThumb && (
              <div
                className="absolute top-1/2 -translate-y-1/2 rounded-full"
                style={{
                  left: `calc(${displayProgress * 100}% - 6px)`,
                  width: "12px", height: "12px",
                  background: "var(--interactive-accent)",
                  boxShadow: `0 2px 8px rgba(0,0,0,0.3), 0 0 0 2px ${colors.accent}50`,
                  opacity: isDragging || sliderStyle === "ios" ? 1 : 0,
                  transition: isDragging ? 'left 0s, opacity 0.2s' : 'left 0.15s linear, opacity 0.2s',
                }}
              />
            )}
          </div>
          <span className="text-[10px] tabular-nums w-8 font-medium" style={{ color: textTime }}>
            {formatTime(currentTrack?.duration || 0)}
          </span>
        </div>
      </div>

      {/* Main content */}
      <div className="flex items-center h-14 px-4 pb-2 relative z-10">
        {/* Left - Track info */}
        <div className="flex items-center gap-3 cursor-pointer w-[200px]" onClick={onTrackClick}>
          {currentTrack ? (
            <>
              <div className="relative w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 shadow-lg" style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}>
                {artworkUrl && artworkUrl !== "/icon.svg" ? (
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
                {(!artworkUrl || artworkUrl === "/icon.svg") && (
                  <div className="absolute inset-0 bg-white/5" />
                )}
                {displayPlaying && (
                  <div className="absolute bottom-1 right-1 flex items-end gap-0.5 h-2.5">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="w-0.5 rounded-full" style={{ background: colors.accent, boxShadow: `0 0 4px ${colors.accent}`, animation: `soundbar 0.4s ease-in-out ${i * 0.1}s infinite alternate` }} />
                    ))}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate" style={{ color: textPrimary }}>{currentTrack.title}</p>
                <p className="text-xs truncate" style={{ color: textSecondary }}>{currentTrack.artist}</p>
              </div>
              <button type="button" onClick={(e) => { e.stopPropagation(); onLikeClick(); }}
                className="w-8 h-8 flex items-center justify-center flex-shrink-0 rounded-full transition-all hover:scale-110 active:scale-95"
                style={{ 
                  color: isLiked ? "#ef4444" : "#ffffff",
                  background: isLiked ? "rgba(239, 68, 68, 0.2)" : "transparent",
                }}>
                {isLiked ? <IoHeart size={16} /> : <IoHeartOutline size={16} />}
              </button>
            </>
          ) : (
            <p className="text-sm font-medium" style={{ color: textSecondary }}>Выбери трек</p>
          )}
        </div>

        {/* Center - Controls */}
        <div className="flex-1 flex items-center justify-center gap-1">
          <button type="button" onClick={onShuffle} 
            className="w-9 h-9 flex items-center justify-center rounded-full transition-all hover:scale-105 active:scale-95"
            style={{ 
              color: shuffle ? (isLightTheme ? "#ffffff" : "#000000") : (isLightTheme ? "#000000" : "#ffffff"),
              background: shuffle ? (isLightTheme ? "#000000" : "#ffffff") : (isLightTheme ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.2)"),
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = shuffle ? (isLightTheme ? "#1a1a1a" : "#f0f0f0") : (isLightTheme ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.3)")}
            onMouseLeave={(e) => e.currentTarget.style.background = shuffle ? (isLightTheme ? "#000000" : "#ffffff") : (isLightTheme ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.2)")}>
            <IoShuffle size={18} />
          </button>
          <button type="button" onClick={onPrev} 
            className="w-9 h-9 flex items-center justify-center transition-all hover:scale-105 active:scale-95" 
            style={{ color: isLightTheme ? "#000000" : "#ffffff" }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"}
            onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}>
            <IoPlaySkipBackSharp size={24} />
          </button>
          <button type="button" onClick={onToggle} 
            className="w-12 h-12 flex items-center justify-center rounded-full transition-all hover:scale-105 active:scale-95"
            style={{ 
              background: isLightTheme ? "#000000" : "#ffffff",
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = isLightTheme ? "#1a1a1a" : "#f0f0f0"}
            onMouseLeave={(e) => e.currentTarget.style.background = isLightTheme ? "#000000" : "#ffffff"}>
            {displayPlaying ? <HiOutlinePause size={24} style={{ color: isLightTheme ? "#ffffff" : "#000000" }} /> : <HiOutlinePlay size={24} style={{ color: isLightTheme ? "#ffffff" : "#000000", marginLeft: 2 }} />}
          </button>
          <button type="button" onClick={onNext} 
            className="w-9 h-9 flex items-center justify-center transition-all hover:scale-105 active:scale-95" 
            style={{ color: isLightTheme ? "#000000" : "#ffffff" }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"}
            onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}>
            <IoPlaySkipForwardSharp size={24} />
          </button>
          <button type="button" onClick={onRepeat} 
            className="w-9 h-9 flex items-center justify-center rounded-full relative transition-all hover:scale-105 active:scale-95"
            style={{ 
              color: repeatMode !== "off" ? (isLightTheme ? "#ffffff" : "#000000") : (isLightTheme ? "#000000" : "#ffffff"),
              background: repeatMode !== "off" ? (isLightTheme ? "#000000" : "#ffffff") : (isLightTheme ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.2)"),
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = repeatMode !== "off" ? (isLightTheme ? "#1a1a1a" : "#f0f0f0") : (isLightTheme ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.3)")}
            onMouseLeave={(e) => e.currentTarget.style.background = repeatMode !== "off" ? (isLightTheme ? "#000000" : "#ffffff") : (isLightTheme ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.2)")}>
            <IoRepeat size={18} />
            {repeatMode === "one" && <span className="absolute -top-0.5 -right-0.5 text-[8px] font-bold" style={{ color: isLightTheme ? "#ffffff" : "#000000" }}>1</span>}
          </button>
        </div>

        {/* Right - Volume & extras */}
        <div className="flex items-center gap-2 w-[200px] justify-end">
          <div className="flex items-center group">
            <button type="button" onClick={onVolToggle} 
              className="w-8 h-8 flex items-center justify-center flex-shrink-0 rounded-full transition-all" 
              style={{ color: iconColor, background: "transparent" }}
              onMouseEnter={(e) => e.currentTarget.style.background = hoverBg}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
              <VolumeIcon size={18} />
            </button>
            <div className={`overflow-hidden transition-all duration-300 ease-out ${isDraggingVolume ? 'w-20' : 'w-0 group-hover:w-20'}`}>
              <div className="w-20 h-1.5 rounded-full cursor-pointer relative ml-1" style={{ background: volumeBg }}>
                <div className="h-full rounded-full" style={{ width: `${volume * 100}%`, background: `linear-gradient(90deg, ${colors.accent}, ${colors.accent}cc)`, boxShadow: `0 0 8px ${colors.accent}40`, transition: 'width 0.1s ease-out' }} />
                <input type="range" min="0" max="1" step="0.01" value={volume} onChange={onVolChange} onInput={onVolChange} onMouseDown={onVolDragStart} onMouseUp={onVolDragEnd} onTouchStart={onVolDragStart} onTouchEnd={onVolDragEnd} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              </div>
            </div>
          </div>
          <button type="button" onClick={onExpand} 
            className="w-8 h-8 flex items-center justify-center flex-shrink-0 rounded-full transition-all" 
            style={{ color: iconColor, background: "transparent" }}
            onMouseEnter={(e) => e.currentTarget.style.background = hoverBg}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
            <IoChevronUp size={18} />
          </button>
        </div>
      </div>
      <style>{`
        @keyframes soundbar { 0% { height: 3px; } 100% { height: 10px; } }
      `}</style>
    </div>
  );
});
