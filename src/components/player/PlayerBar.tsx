import { useState, useRef, useEffect, useCallback, memo } from "react";
import { HiOutlineChevronUp } from "react-icons/hi2";
import { usePlayerStore } from "../../stores/playerStore";
import { useUserStore } from "../../stores/userStore";
import { useNavigationStore } from "../../stores/navigationStore";
import { useThemeStore } from "../../stores/themeStore";
import { usePlayerSettingsStore } from "../../stores/playerSettingsStore";
import { audioService } from "../../services/AudioService";
import { likedTracksService } from "../../services/LikedTracksService";
import { shareService } from "../../services/ShareService";
import {
  PlayerBarClassic,
  PlayerBarMinimal,
  PlayerBarCompact,
  PlayerBarGlass,
} from "./styles";

export const PlayerBar = memo(function PlayerBar() {
  const [isLiked, setIsLiked] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingVolume, setIsDraggingVolume] = useState(false);
  const [dragProgress, setDragProgress] = useState(0);
  const [actuallyPlaying, setActuallyPlaying] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showEqualizerMenu, setShowEqualizerMenu] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);

  const {
    currentTrack,
    isPlaying,
    volume,
    progress,
    shuffle,
    repeatMode,
    duration,
  } = usePlayerStore();
  const { incrementStat } = useUserStore();
  const { navigate } = useNavigationStore();
  const { currentTheme, currentThemeId } = useThemeStore();
  const { miniPlayerStyle, miniPlayerHidden, setMiniPlayerHidden, sliderStyle, titleAlignment, customArtworkUrl, customArtworkEnabled } = usePlayerSettingsStore();
  const colors = currentTheme.colors;

  // Use custom artwork if enabled, otherwise use track artwork
  const artworkUrl = (customArtworkEnabled && customArtworkUrl) ? customArtworkUrl : (currentTrack?.artworkUrl || "/icon.svg");

  const currentTime = progress * (duration || 0);

  useEffect(() => {
    const audio = audioService.getAudioElement();
    if (!audio) return;
    const updatePlayState = () => setActuallyPlaying(!audio.paused);
    audio.addEventListener("play", updatePlayState);
    audio.addEventListener("pause", updatePlayState);
    audio.addEventListener("ended", updatePlayState);
    setActuallyPlaying(!audio.paused);
    return () => {
      audio.removeEventListener("play", updatePlayState);
      audio.removeEventListener("pause", updatePlayState);
      audio.removeEventListener("ended", updatePlayState);
    };
  }, [currentTrack]);

  const displayPlaying = actuallyPlaying || isPlaying;

  useEffect(() => {
    if (!currentTrack) {
      setIsLiked(false);
      return;
    }
    setIsLiked(likedTracksService.isLiked(currentTrack.id));
  }, [currentTrack]);

  const handleLikeClick = () => {
    if (!currentTrack) return;
    const newLiked = likedTracksService.toggleLike(currentTrack);
    setIsLiked(newLiked);
    if (newLiked) incrementStat("likedTracks", 1);
    window.dispatchEvent(new CustomEvent("likedTracksChanged"));
  };

  const calculateProgress = useCallback((e: MouseEvent | React.MouseEvent) => {
    if (!progressRef.current) return 0;
    const rect = progressRef.current.getBoundingClientRect();
    return Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  }, []);

  const handleProgressMouseDown = (e: React.MouseEvent) => {
    if (!currentTrack) return;
    setIsDragging(true);
    setDragProgress(calculateProgress(e));
  };

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent) => setDragProgress(calculateProgress(e));
    const onUp = (e: MouseEvent) => {
      audioService.seek(calculateProgress(e));
      setIsDragging(false);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  }, [isDragging, calculateProgress]);

  const formatTime = (s: number) => {
    if (!s || isNaN(s)) return "0:00";
    return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
  };

  const displayProgress = isDragging ? dragProgress : progress;

  const handlePrev = () => usePlayerStore.getState().previousTrack();
  const handleNext = () => usePlayerStore.getState().nextTrack();
  const handleToggle = () => audioService.toggle();
  const handleShuffle = () => usePlayerStore.getState().toggleShuffle();
  const handleRepeat = () => usePlayerStore.getState().cycleRepeatMode();
  const handleVolToggle = () => audioService.setVolume(volume === 0 ? 0.5 : 0);
  const handleVolChange = (e: React.ChangeEvent<HTMLInputElement>) => audioService.setVolume(parseFloat(e.target.value));
  const handleVolDragStart = () => setIsDraggingVolume(true);
  const handleVolDragEnd = () => setIsDraggingVolume(false);
  const handleExpand = () => navigate("player");
  const handleTrackClick = () => { if (currentTrack) navigate("player"); };
  const handleSpeedClick = () => setShowSpeedMenu(!showSpeedMenu);
  const handleEqualizerClick = () => {
    setShowEqualizerMenu(!showEqualizerMenu);
    // 'equalizer' is not a valid Route, use 'player' or another valid route
    navigate("player");
  };

  const handleShareClick = async () => {
    if (!currentTrack) return;
    await shareService.copyShareLink(currentTrack);
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    const audio = audioService.getAudioElement();
    if (audio) {
      audio.playbackRate = speed;
    }
    setShowSpeedMenu(false);
  };

  // Sync playback speed from audio element on track change
  useEffect(() => {
    const audio = audioService.getAudioElement();
    if (audio) {
      audio.playbackRate = playbackSpeed;
    }
  }, [currentTrack, playbackSpeed]);

  const speedOptions = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

  // Determine if current theme is light
  const isLightTheme = ["light", "light-stone", "light-slate"].includes(currentThemeId);

  const commonProps = {
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
    playbackSpeed,
    showSpeedMenu,
    showEqualizerMenu,
    speedOptions,
    onProgressMouseDown: handleProgressMouseDown,
    onLikeClick: handleLikeClick,
    onPrev: handlePrev,
    onNext: handleNext,
    onToggle: handleToggle,
    onShuffle: handleShuffle,
    onRepeat: handleRepeat,
    onVolToggle: handleVolToggle,
    onVolChange: handleVolChange,
    onVolDragStart: handleVolDragStart,
    onVolDragEnd: handleVolDragEnd,
    onExpand: handleExpand,
    onTrackClick: handleTrackClick,
    onSpeedClick: handleSpeedClick,
    onEqualizerClick: handleEqualizerClick,
    onSpeedChange: handleSpeedChange,
    onShareClick: handleShareClick,
    formatTime,
  };

  const renderPlayerBar = () => {
    switch (miniPlayerStyle) {
      case "minimal":
        return <PlayerBarMinimal {...commonProps} />;
      case "compact":
        return <PlayerBarCompact {...commonProps} />;
      case "glass":
        return <PlayerBarGlass {...commonProps} />;
      case "classic":
      default:
        return <PlayerBarClassic {...commonProps} />;
    }
  };

  const handleToggleHide = () => {
    setMiniPlayerHidden(!miniPlayerHidden);
  };

  return (
    <div 
      className="relative"
      style={{ background: "transparent" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Toggle button when player is visible - above player, centered */}
      {!miniPlayerHidden && (
        <div
          className="absolute z-50 left-1/2"
          onMouseEnter={() => setIsHovered(true)}
          style={{
            bottom: '100%',
            transform: 'translateX(-50%)',
            padding: '8px 24px',
            opacity: isHovered ? 1 : 0,
            pointerEvents: isHovered ? 'auto' : 'none',
            transition: 'opacity 0.3s ease',
          }}
        >
          <div
            onClick={handleToggleHide}
            className="cursor-pointer group"
            style={{ 
              width: '56px',
              height: '20px',
              borderRadius: '10px 10px 0 0',
              background: `linear-gradient(180deg, ${colors.surface}f0 0%, ${colors.surface} 100%)`,
              border: `1px solid ${colors.textSecondary}20`,
              borderBottom: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              boxShadow: `0 -4px 16px rgba(0,0,0,0.2), inset 0 1px 0 ${colors.textSecondary}10`,
              backdropFilter: 'blur(12px)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = `0 -6px 20px rgba(0,0,0,0.3), inset 0 1px 0 ${colors.textSecondary}15`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = `0 -4px 16px rgba(0,0,0,0.2), inset 0 1px 0 ${colors.textSecondary}10`;
            }}
          >
            <div className="w-1 h-1 rounded-full" style={{ background: colors.textSecondary, opacity: 0.5 }} />
            <HiOutlineChevronUp 
              size={12} 
              style={{ 
                color: colors.textSecondary,
                transform: 'rotate(180deg)',
                transition: 'transform 0.2s ease',
              }} 
            />
            <div className="w-1 h-1 rounded-full" style={{ background: colors.textSecondary, opacity: 0.5 }} />
          </div>
        </div>
      )}

      {/* Toggle button when player is hidden - centered in container at bottom */}
      {miniPlayerHidden && (
        <div
          className="absolute z-50 left-1/2 bottom-0"
          style={{
            transform: 'translateX(-50%)',
          }}
        >
          <div
            onClick={handleToggleHide}
            className="cursor-pointer"
            style={{ 
              width: '72px',
              height: '28px',
              borderRadius: '14px 14px 0 0',
              background: `linear-gradient(135deg, ${colors.accent}20 0%, ${colors.surface} 100%)`,
              border: `1px solid ${colors.accent}40`,
              borderBottom: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              boxShadow: `0 -4px 20px ${colors.accent}30, inset 0 1px 0 rgba(255,255,255,0.1)`,
              backdropFilter: 'blur(12px)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = `0 -6px 24px ${colors.accent}50, inset 0 1px 0 rgba(255,255,255,0.15)`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = `0 -4px 20px ${colors.accent}30, inset 0 1px 0 rgba(255,255,255,0.1)`;
            }}
          >
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: colors.accent, boxShadow: `0 0 6px ${colors.accent}` }} />
            <HiOutlineChevronUp 
              size={16} 
              style={{ color: colors.accent }} 
            />
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: colors.accent, boxShadow: `0 0 6px ${colors.accent}` }} />
          </div>
        </div>
      )}

      {/* Player content */}
      <div
        style={{
          transform: miniPlayerHidden ? 'translateY(100%)' : 'translateY(0)',
          opacity: miniPlayerHidden ? 0 : 1,
          maxHeight: miniPlayerHidden ? '0px' : '150px',
          transition: 'all 0.3s ease',
          overflow: 'hidden',
        }}
      >
        {renderPlayerBar()}
      </div>

      <style>{`
        @keyframes soundbar {
          0% { height: 4px; }
          100% { height: 12px; }
        }
      `}</style>
    </div>
  );
});
