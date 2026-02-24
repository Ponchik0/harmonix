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
  IoShuffle,
  IoRepeat,
} from "react-icons/io5";
import { HiOutlinePlay, HiOutlinePause, HiOutlineCheckBadge } from "react-icons/hi2";
import { PlayerBarProps } from "./types";

export const PlayerBarCompact = memo(function PlayerBarCompact({
  currentTrack,
  artworkUrl,
  displayPlaying,
  isLiked,
  isDraggingVolume,
  displayProgress,
  volume,
  shuffle,
  repeatMode,
  currentTime,
  colors,
  isLightTheme,
  progressRef,
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
  
  // Theme-aware colors
  const iconColor = isLightTheme ? "rgba(0,0,0,0.7)" : colors.textSecondary;
  const hoverBg = isLightTheme ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.05)";

  return (
    <div 
      className="relative overflow-hidden"
      style={{ 
        background: colors.surface,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      {/* Progress bar - floating pill style */}
      <div className="absolute top-0 left-0 right-0 h-1 cursor-pointer group"
        ref={progressRef}
        onMouseDown={onProgressMouseDown}
      >
        <div className="absolute inset-0" style={{ background: `${colors.textSecondary}15` }} />
        <div
          className="h-full relative"
          style={{
            width: `${displayProgress * 100}%`,
            background: `linear-gradient(90deg, ${colors.accent}80, ${colors.accent})`,
            transition: 'width 0.15s linear',
          }}
        >
          {/* Glow effect on progress */}
          <div
            className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            style={{
              background: colors.accent,
              boxShadow: `0 0 8px ${colors.accent}, 0 0 16px ${colors.accent}80`,
              transform: "translate(50%, -50%)",
            }}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="flex items-center h-16 px-3 pt-1">
        {/* Left - Compact artwork with overlay info */}
        <div className="flex items-center gap-3 w-[240px] min-w-0 cursor-pointer group" onClick={onTrackClick}>
          {currentTrack ? (
            <>
              <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 shadow-xl transition-transform group-hover:scale-105"
                style={{ 
                  boxShadow: `0 4px 16px ${colors.accent}30, 0 2px 8px rgba(0,0,0,0.3)`,
                }}
              >
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
                  <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)" }}>
                    <div className="flex items-end gap-[3px] h-4">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="w-[3px] rounded-full"
                          style={{
                            background: colors.accent,
                            boxShadow: `0 0 4px ${colors.accent}`,
                            animation: `soundbar 0.4s ease-in-out ${i * 0.08}s infinite alternate`,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate leading-tight" style={{ color: colors.textPrimary }}>
                  {currentTrack.title}
                </p>
                <div className="flex items-center gap-1 min-w-0">
                  <p className="text-xs truncate leading-tight mt-0.5 cursor-pointer hover:underline transition-all" style={{ color: colors.textSecondary }} onClick={(e) => { e.stopPropagation(); onArtistClick(); }}>
                    {currentTrack.artist}
                  </p>
                  {isArtistVerified && <HiOutlineCheckBadge size={14} className="flex-shrink-0" style={{ color: '#3B82F6' }} />}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] tabular-nums px-1.5 py-0.5 rounded-md"
                    style={{ background: `${colors.accent}20`, color: colors.accent }}>
                    {formatTime(currentTime)}
                  </span>
                </div>
              </div>
              <button 
                type="button" 
                onClick={(e) => { e.stopPropagation(); onLikeClick(); }}
                className="w-9 h-9 flex items-center justify-center flex-shrink-0 rounded-full transition-all hover:scale-110 active:scale-95"
                style={{ 
                  color: isLiked ? "#ef4444" : "#ffffff",
                  background: isLiked ? "rgba(239, 68, 68, 0.15)" : "transparent",
                }}
              >
                {isLiked ? <IoHeart size={18} /> : <IoHeartOutline size={18} />}
              </button>
            </>
          ) : (
            <p className="text-sm font-medium" style={{ color: colors.textSecondary }}>Выбери трек</p>
          )}
        </div>

        {/* Center - Pill-shaped controls */}
        <div className="flex-1 flex items-center justify-center px-4">
          <div 
            className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-full"
            style={{ 
              background: `${colors.textSecondary}08`,
              border: `1px solid ${colors.textSecondary}10`,
            }}
          >
            <button 
              type="button" 
              onClick={onShuffle} 
              className="w-8 h-8 flex items-center justify-center rounded-full transition-all hover:scale-105 active:scale-95" 
              style={{ 
                color: shuffle ? "#000000" : "#ffffff",
                background: shuffle ? "#ffffff" : "rgba(255,255,255,0.2)",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = shuffle ? "#f0f0f0" : "rgba(255,255,255,0.3)"}
              onMouseLeave={(e) => e.currentTarget.style.background = shuffle ? "#ffffff" : "rgba(255,255,255,0.2)"}
            >
              <IoShuffle size={14} />
            </button>
            <button 
              type="button" 
              onClick={onPrev} 
              className="w-9 h-9 flex items-center justify-center transition-all hover:scale-105 active:scale-95" 
              style={{ color: isLightTheme ? "#000000" : "#ffffff" }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"}
              onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
            >
              <IoPlaySkipBackSharp size={22} />
            </button>
            <button 
              type="button" 
              onClick={onToggle} 
              className="w-11 h-11 flex items-center justify-center rounded-full transition-all hover:scale-105 active:scale-95 mx-1"
              style={{ 
                background: isLightTheme ? "#000000" : "#ffffff",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = isLightTheme ? "#1a1a1a" : "#f0f0f0"}
              onMouseLeave={(e) => e.currentTarget.style.background = isLightTheme ? "#000000" : "#ffffff"}
            >
              {displayPlaying ? (
                <HiOutlinePause size={22} style={{ color: isLightTheme ? "#ffffff" : "#000000" }} />
              ) : (
                <HiOutlinePlay size={22} style={{ color: isLightTheme ? "#ffffff" : "#000000", marginLeft: 2 }} />
              )}
            </button>
            <button 
              type="button" 
              onClick={onNext} 
              className="w-9 h-9 flex items-center justify-center transition-all hover:scale-105 active:scale-95" 
              style={{ color: isLightTheme ? "#000000" : "#ffffff" }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"}
              onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
            >
              <IoPlaySkipForwardSharp size={22} />
            </button>
            <button 
              type="button" 
              onClick={onRepeat} 
              className="w-8 h-8 flex items-center justify-center rounded-full transition-all hover:scale-105 active:scale-95 relative" 
              style={{ 
                color: repeatMode !== "off" ? "#000000" : "#ffffff",
                background: repeatMode !== "off" ? "#ffffff" : "rgba(255,255,255,0.2)",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = repeatMode !== "off" ? "#f0f0f0" : "rgba(255,255,255,0.3)"}
              onMouseLeave={(e) => e.currentTarget.style.background = repeatMode !== "off" ? "#ffffff" : "rgba(255,255,255,0.2)"}
            >
              <IoRepeat size={14} />
              {repeatMode === "one" && (
                <span className="absolute -top-0.5 -right-0.5 text-[8px] font-bold w-3 h-3 rounded-full flex items-center justify-center" 
                  style={{ background: "#000000", color: "#ffffff" }}>1</span>
              )}
            </button>
          </div>
        </div>

        {/* Right - Volume & Expand */}
        <div className="flex items-center gap-1 w-[240px] justify-end">
          <div className="flex items-center group">
            <button 
              type="button" 
              onClick={onVolToggle} 
              className="w-8 h-8 flex items-center justify-center rounded-full transition-colors flex-shrink-0" 
              style={{ color: iconColor, background: "transparent" }}
              onMouseEnter={(e) => e.currentTarget.style.background = hoverBg}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              <VolumeIcon size={16} />
            </button>
            <div className={`overflow-hidden transition-all duration-300 ease-out ${isDraggingVolume ? 'w-16' : 'w-0 group-hover:w-16'}`}>
              <div className="w-16 h-1.5 rounded-full cursor-pointer relative ml-1" style={{ background: `${colors.textSecondary}20` }}>
                <div className="h-full rounded-full" style={{ 
                  width: `${volume * 100}%`, 
                  background: `linear-gradient(90deg, ${colors.accent}80, ${colors.accent})`,
                  boxShadow: `0 0 6px ${colors.accent}40`,
                  transition: 'width 0.1s ease-out',
                }} />
                <input type="range" min="0" max="1" step="0.01" value={volume} onChange={onVolChange} onInput={onVolChange} onMouseDown={onVolDragStart} onMouseUp={onVolDragEnd} onTouchStart={onVolDragStart} onTouchEnd={onVolDragEnd} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              </div>
            </div>
          </div>
          
          <button 
            type="button" 
            onClick={onExpand} 
            className="w-8 h-8 flex items-center justify-center rounded-full transition-all hover:scale-105" 
            style={{ color: iconColor, background: "transparent" }}
            onMouseEnter={(e) => e.currentTarget.style.background = hoverBg}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
          >
            <IoChevronUp size={16} />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes soundbar { 0% { height: 4px; } 100% { height: 14px; } }
      `}</style>
    </div>
  );
});
