import { memo } from "react";
import {
  IoPlaySkipBackSharp,
  IoPlaySkipForwardSharp,
  IoVolumeHigh,
  IoVolumeMute,
  IoVolumeMedium,
  IoVolumeLow,
  IoHeart,
  IoHeartOutline,
  IoChevronUp,
} from "react-icons/io5";
import { HiOutlinePlay, HiOutlinePause, HiOutlineCheckBadge } from "react-icons/hi2";
import { PlayerBarProps } from "./types";

export const PlayerBarMinimal = memo(function PlayerBarMinimal({
  currentTrack,
  artworkUrl,
  displayPlaying,
  isLiked,
  isDragging,
  isDraggingVolume,
  displayProgress,
  volume,
  currentTime,
  colors,
  isLightTheme,
  progressRef,
  sliderStyle,
  titleAlignment,
  onProgressMouseDown,
  onLikeClick,
  onPrev,
  onNext,
  onToggle,
  onVolToggle,
  onVolChange,
  onVolDragStart,
  onVolDragEnd,
  onExpand,
  onTrackClick,
  onArtistClick,
  isArtistVerified,
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
  const showThumb = sliderStyle === "ios" || isDragging;
  const getTitleAlign = () => titleAlignment === "center" ? "text-center" : titleAlignment === "right" ? "text-right" : "text-left";
  const getSliderHeight = () => sliderStyle === "wavy" ? "h-2" : sliderStyle === "ios" ? "h-2" : sliderStyle === "thin" ? "h-0.5" : "h-1.5";
  
  // Theme-aware colors
  const iconColor = isLightTheme ? "rgba(0,0,0,0.7)" : colors.textSecondary;
  const hoverBg = isLightTheme ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.05)";

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: colors.surface,
      }}
    >
      <div className="flex items-center h-16 px-4">
        {/* Track artwork & info - left side */}
        <div className="flex items-center gap-3 w-[220px] min-w-0 cursor-pointer" onClick={onTrackClick}>
          {currentTrack ? (
            <>
              <div className="relative w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 shadow-lg">
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
                    <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: colors.accent }} />
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
              {/* Like button next to track info */}
              <button type="button" onClick={(e) => { e.stopPropagation(); onLikeClick(); }}
                className="w-8 h-8 flex items-center justify-center rounded-full transition-all hover:scale-110 flex-shrink-0"
                style={{ color: isLiked ? "#ef4444" : "#ffffff", background: isLiked ? "rgba(239,68,68,0.1)" : "transparent" }}>
                {isLiked ? <IoHeart size={16} /> : <IoHeartOutline size={16} />}
              </button>
            </>
          ) : (
            <p className="text-sm" style={{ color: colors.textSecondary }}>Нет трека</p>
          )}
        </div>

        {/* Center - controls only */}
        <div className="flex-1 flex items-center justify-center">
          <button type="button" onClick={onPrev} className="w-9 h-9 flex items-center justify-center transition-all hover:scale-105" 
            style={{ color: isLightTheme ? "#000000" : "#ffffff" }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"}
            onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}>
            <IoPlaySkipBackSharp size={24} />
          </button>
          <button type="button" onClick={onToggle} className="w-12 h-12 mx-2 flex items-center justify-center rounded-full transition-all hover:scale-105"
            style={{ background: isLightTheme ? "#000000" : "#ffffff" }}
            onMouseEnter={(e) => e.currentTarget.style.background = isLightTheme ? "#1a1a1a" : "#f0f0f0"}
            onMouseLeave={(e) => e.currentTarget.style.background = isLightTheme ? "#000000" : "#ffffff"}>
            {displayPlaying ? <HiOutlinePause size={24} style={{ color: isLightTheme ? "#ffffff" : "#000000" }} /> : <HiOutlinePlay size={24} style={{ color: isLightTheme ? "#ffffff" : "#000000", marginLeft: 2 }} />}
          </button>
          <button type="button" onClick={onNext} className="w-9 h-9 flex items-center justify-center transition-all hover:scale-105" 
            style={{ color: isLightTheme ? "#000000" : "#ffffff" }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"}
            onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}>
            <IoPlaySkipForwardSharp size={24} />
          </button>
        </div>

        {/* Right side - progress, volume & expand */}
        <div className="flex items-center gap-2 w-[220px] justify-end">
          {/* Progress */}
          <div className="flex items-center gap-2">
            <span className="text-xs tabular-nums" style={{ color: colors.textSecondary }}>{formatTime(currentTime)}</span>
            <div ref={progressRef} onMouseDown={onProgressMouseDown}
              className={`w-24 ${getSliderHeight()} cursor-pointer rounded-full relative group`}
              style={{ background: sliderStyle === "wavy" ? "transparent" : `${colors.textSecondary}20` }}>
              {sliderStyle === "wavy" ? (
                <>
                  <svg width="100%" height="10" viewBox="0 0 200 10" preserveAspectRatio="none" style={{ position: "absolute", top: "50%", transform: "translateY(-50%)", opacity: 0.25 }}>
                    <path d="M0,5 C10,2 20,8 30,5 C40,2 50,8 60,5 C70,2 80,8 90,5 C100,2 110,8 120,5 C130,2 140,8 150,5 C160,2 170,8 180,5 C190,2 200,8 200,5" fill="none" stroke={colors.textSecondary} strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  <svg width="100%" height="10" viewBox="0 0 200 10" preserveAspectRatio="none" style={{ position: "absolute", top: "50%", transform: "translateY(-50%)", left: 0, clipPath: `inset(0 ${100 - displayProgress * 100}% 0 0)`, transition: isDragging ? 'none' : 'clip-path 0.15s linear' }}>
                    <path d="M0,5 C10,2 20,8 30,5 C40,2 50,8 60,5 C70,2 80,8 90,5 C100,2 110,8 120,5 C130,2 140,8 150,5 C160,2 170,8 180,5 C190,2 200,8 200,5" fill="none" stroke={colors.accent} strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                  <div className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full" style={{ left: `calc(${displayProgress * 100}% - 3px)`, background: colors.accent, boxShadow: `0 0 6px ${colors.accent}`, transition: isDragging ? 'none' : 'left 0.15s linear' }} />
                </>
              ) : (
                <div className="h-full rounded-full"
                  style={{ width: `${displayProgress * 100}%`, background: colors.accent, transition: isDragging ? 'none' : 'width 0.15s linear' }} />
              )}
              {showThumb && (
                <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full"
                  style={{ left: `calc(${displayProgress * 100}% - 6px)`, background: sliderStyle === "ios" ? "var(--interactive-accent)" : colors.accent,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.3)", opacity: isDragging || sliderStyle === "ios" ? 1 : 0, transition: isDragging ? 'left 0s, opacity 0.2s' : 'left 0.15s linear, opacity 0.2s' }} />
              )}
            </div>
          </div>

          {/* Volume */}
          <div className="flex items-center group">
            <button type="button" onClick={onVolToggle} className="w-8 h-8 flex items-center justify-center rounded-full flex-shrink-0" 
              style={{ color: iconColor, background: "transparent" }}
              onMouseEnter={(e) => e.currentTarget.style.background = hoverBg}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
              <VolumeIcon size={16} />
            </button>
            <div className={`overflow-hidden transition-all duration-300 ease-out flex items-center ${isDraggingVolume ? 'w-20' : 'w-0 group-hover:w-20'}`}>
              <div className="w-16 h-1 rounded-full cursor-pointer relative mx-2" style={{ background: `${colors.textSecondary}30` }}>
                <div className="h-full rounded-full" style={{ width: `${volume * 100}%`, background: colors.accent, transition: 'width 0.1s ease-out' }} />
                <input type="range" min="0" max="1" step="0.01" value={volume} onChange={onVolChange} onInput={onVolChange} onMouseDown={onVolDragStart} onMouseUp={onVolDragEnd} onTouchStart={onVolDragStart} onTouchEnd={onVolDragEnd} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              </div>
            </div>
          </div>

          <button type="button" onClick={onExpand} className="w-8 h-8 flex items-center justify-center rounded-full flex-shrink-0" 
            style={{ color: iconColor, background: "transparent" }}
            onMouseEnter={(e) => e.currentTarget.style.background = hoverBg}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
            <IoChevronUp size={16} />
          </button>
        </div>
      </div>

    </div>
  );
});
