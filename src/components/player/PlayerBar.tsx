import { useState, useRef, useEffect, useCallback, memo } from "react";
import { HiOutlineChevronUp, HiOutlineChevronDown } from "react-icons/hi2";
import { usePlayerStore } from "../../stores/playerStore";
import { useUserStore } from "../../stores/userStore";
import { useNavigationStore } from "../../stores/navigationStore";
import { useThemeStore } from "../../stores/themeStore";
import { usePlayerSettingsStore } from "../../stores/playerSettingsStore";
import { audioService } from "../../services/AudioService";
import { likedTracksService } from "../../services/LikedTracksService";
import { shareService } from "../../services/ShareService";
import { soundCloudService } from "../../services/SoundCloudService";
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
  const [isLoadingArtist, setIsLoadingArtist] = useState(false);
  const [isArtistVerified, setIsArtistVerified] = useState(false);
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
  const artworkUrl = (customArtworkEnabled && customArtworkUrl) ? customArtworkUrl : (currentTrack?.artworkUrl || "");

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

  // Check if current artist is verified on SoundCloud
  useEffect(() => {
    if (!currentTrack?.artist) {
      setIsArtistVerified(false);
      return;
    }
    let cancelled = false;
    const checkVerified = async () => {
      try {
        const results = await soundCloudService.search(currentTrack.artist, 5);
        if (cancelled) return;
        if (results.users && results.users.length > 0) {
          const artistName = currentTrack.artist.toLowerCase();
          const match = results.users.find(u => u.username.toLowerCase() === artistName) 
                     || results.users.find(u => u.username.toLowerCase().includes(artistName) || artistName.includes(u.username.toLowerCase()))
                     || results.users[0];
          setIsArtistVerified(match?.verified || false);
        } else {
          setIsArtistVerified(false);
        }
      } catch {
        if (!cancelled) setIsArtistVerified(false);
      }
    };
    checkVerified();
    return () => { cancelled = true; };
  }, [currentTrack?.artist]);

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
  const handleArtistClick = useCallback(async () => {
    if (!currentTrack?.artist || isLoadingArtist) return;
    
    setIsLoadingArtist(true);
    try {
      const results = await soundCloudService.search(currentTrack.artist, 10);
      
      if (results.users && results.users.length > 0) {
        const artistName = currentTrack.artist.toLowerCase();
        const exactMatch = results.users.find(u => u.username.toLowerCase() === artistName);
        const closeMatch = results.users.find(u => 
          u.username.toLowerCase().includes(artistName) || 
          artistName.includes(u.username.toLowerCase())
        );
        const artist = exactMatch || closeMatch || results.users[0];
        
        if (artist) {
          const userId = artist.id.replace("sc-user-", "");
          const tracks = await soundCloudService.getUserTracks(userId, 50, artist.username);
          const sortedTracks = [...tracks].sort((a, b) => {
            const dateA = a.metadata?.releaseDate ? new Date(a.metadata.releaseDate).getTime() : 0;
            const dateB = b.metadata?.releaseDate ? new Date(b.metadata.releaseDate).getTime() : 0;
            return dateB - dateA;
          });
          
          (window as any).__artistData = { artist, tracks: sortedTracks };
          navigate("search");
          const dispatchArtistEvent = () => {
            window.dispatchEvent(new CustomEvent("open-artist-profile", { 
              detail: { artist, tracks: sortedTracks } 
            }));
          };
          setTimeout(dispatchArtistEvent, 300);
          setTimeout(dispatchArtistEvent, 600);
        }
      }
    } catch (error) {
      console.error("[PlayerBar] Error searching for artist:", error);
    }
    setIsLoadingArtist(false);
  }, [currentTrack?.artist, isLoadingArtist, navigate]);
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
    onArtistClick: handleArtistClick,
    isArtistVerified,
    isLoadingArtist,
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

  const toggleButtonStyle: React.CSSProperties = {
    width: '36px',
    height: '14px',
    borderRadius: '6px 6px 0 0',
    backgroundColor: colors.surface,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
  };

  return (
    <div 
      className="relative"
      style={{ background: "transparent" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Hide tab — appears on hover above visible player */}
      {!miniPlayerHidden && (
        <div
          className="absolute z-50 left-1/2"
          style={{
            bottom: '100%',
            transform: 'translateX(-50%)',
            opacity: isHovered ? 1 : 0,
            pointerEvents: isHovered ? 'auto' : 'none',
            transition: 'opacity 0.25s ease',
          }}
        >
          <button onClick={handleToggleHide} className="cursor-pointer" style={toggleButtonStyle}>
            <HiOutlineChevronDown size={10} style={{ color: colors.textSecondary }} />
          </button>
        </div>
      )}

      {/* Show tab — visible when player is hidden */}
      {miniPlayerHidden && (
        <div
          className="absolute z-50 left-1/2 bottom-0"
          style={{ transform: 'translateX(-50%)' }}
        >
          <button onClick={handleToggleHide} className="cursor-pointer" style={toggleButtonStyle}>
            <HiOutlineChevronUp size={10} style={{ color: colors.textSecondary }} />
          </button>
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
