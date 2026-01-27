import { useEffect, useRef, useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  IoClose, IoPlay, IoPause, IoPlaySkipBack, 
  IoPlaySkipForward, IoRepeat, IoShuffle, 
  IoHeart, IoHeartOutline, IoMusicalNotes,
  IoVolumeHigh, IoVolumeMedium, IoVolumeLow, IoVolumeMute
} from "react-icons/io5";
import { usePlayerStore } from "../../stores/playerStore";
import { useNavigationStore } from "../../stores/navigationStore";
import { usePlayerSettingsStore } from "../../stores/playerSettingsStore";
import { audioService } from "../../services/AudioService";
import { likedTracksService } from "../../services/LikedTracksService";
import { lyricsService, SyncedLine, LyricsResult } from "../../services/LyricsService";
import { soundCloudService } from "../../services/SoundCloudService";

interface FullscreenPlayerProps {
  onClose: () => void;
}

type ViewMode = 'compact' | 'full';

export function FullscreenPlayer({ onClose }: FullscreenPlayerProps) {
  // Use selectors for specific state to prevent unnecessary re-renders
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const progress = usePlayerStore((state) => state.progress);
  const repeatMode = usePlayerStore((state) => state.repeatMode);
  const shuffle = usePlayerStore((state) => state.shuffle);
  const { customArtworkUrl, customArtworkEnabled } = usePlayerSettingsStore();
  const lyricsContainerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLParagraphElement>(null);
  
  // Use custom artwork if enabled, otherwise use track artwork
  const artworkUrl = (customArtworkEnabled && customArtworkUrl) ? customArtworkUrl : (currentTrack?.artworkUrl || "/icon.svg");
  const { navigate } = useNavigationStore();
  
  const [lyrics, setLyrics] = useState<SyncedLine[]>([]);
  const [plainLyrics, setPlainLyrics] = useState<string | null>(null);
  const [isLoadingLyrics, setIsLoadingLyrics] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [volume, setVolume] = useState(() => audioService.getVolume());
  const [viewMode, setViewMode] = useState<ViewMode>('compact');
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoadingArtist, setIsLoadingArtist] = useState(false);
  const rafRef = useRef<number | null>(null);

  const actualDuration = useMemo(() => {
    const raw = currentTrack?.duration || 0;
    return raw > 1000 ? raw / 1000 : raw;
  }, [currentTrack]);

  // Sync current time using requestAnimationFrame for smooth updates
  useEffect(() => {
    let lastTime = 0;
    
    const updateTime = () => {
      const time = audioService.getCurrentTime();
      // Only update state if time changed significantly (avoid unnecessary re-renders)
      if (Math.abs(time - lastTime) > 0.05) {
        lastTime = time;
        setCurrentTime(time);
      }
      rafRef.current = requestAnimationFrame(updateTime);
    };
    
    // Start the loop
    rafRef.current = requestAnimationFrame(updateTime);
    
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  // Load lyrics when track changes
  useEffect(() => {
    if (!currentTrack) return;
    
    setIsLoadingLyrics(true);
    setLyrics([]);
    setPlainLyrics(null);
    setViewMode('compact');
    
    const loadLyrics = async () => {
      console.log("[FullscreenPlayer] Loading lyrics for:", currentTrack.artist, "-", currentTrack.title);
      
      try {
        const result: LyricsResult = await lyricsService.getLyrics(
          currentTrack.artist || "Unknown",
          currentTrack.title || "Unknown"
        );
        
        console.log("[FullscreenPlayer] Lyrics result:", {
          hasSynced: result.synced?.length || 0,
          hasPlain: !!result.plain,
          source: result.source
        });
        
        if (result.synced && result.synced.length > 0) {
          console.log("[FullscreenPlayer] First synced line:", result.synced[0]);
          setLyrics(result.synced);
        } else if (result.plain) {
          setPlainLyrics(result.plain);
        }
      } catch (error) {
        console.error("[FullscreenPlayer] Failed to load lyrics:", error);
      } finally {
        setIsLoadingLyrics(false);
        // Transition to full view after a short delay
        setTimeout(() => {
          setViewMode('full');
        }, 800);
      }
    };
    
    loadLyrics();
  }, [currentTrack?.id, currentTrack?.artist, currentTrack?.title]);

  // Check if track is liked
  useEffect(() => {
    if (!currentTrack) return;
    setIsLiked(likedTracksService.isLiked(currentTrack.id));
    
    const handleLikedChange = () => {
      if (currentTrack) {
        setIsLiked(likedTracksService.isLiked(currentTrack.id));
      }
    };
    
    window.addEventListener("liked-tracks-changed", handleLikedChange);
    return () => window.removeEventListener("liked-tracks-changed", handleLikedChange);
  }, [currentTrack?.id]);

  // Find active lyric line - find the line that should be shown at current time
  const activeIndex = useMemo(() => {
    if (lyrics.length === 0) return -1;
    
    // Find the last line that started before or at current time
    let lastIndex = -1;
    for (let i = 0; i < lyrics.length; i++) {
      if (lyrics[i].time <= currentTime) {
        lastIndex = i;
      } else {
        break; // Lines are sorted, no need to continue
      }
    }
    return lastIndex;
  }, [currentTime, lyrics]);

  // Auto-scroll to active line
  useEffect(() => {
    if (activeLineRef.current && lyrics.length > 0) {
      activeLineRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [activeIndex, lyrics.length]);

  const handleToggleLike = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentTrack) return;
    likedTracksService.toggleLike(currentTrack);
    window.dispatchEvent(new CustomEvent("liked-tracks-changed"));
  }, [currentTrack]);

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    audioService.seek(Math.max(0, Math.min(1, pos)));
  }, []);

  const handleVolumeMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const newVolume = Math.max(0, Math.min(1, pos));
    audioService.setVolume(newVolume);
    setVolume(newVolume);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newPos = (moveEvent.clientX - rect.left) / rect.width;
      const vol = Math.max(0, Math.min(1, newPos));
      audioService.setVolume(vol);
      setVolume(vol);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, []);

  const handleLyricClick = useCallback((time: number) => {
    if (actualDuration > 0) {
      audioService.seek(time / actualDuration);
    }
  }, [actualDuration]);

  // Handle clicking on artist name to go to their profile
  const handleArtistClick = useCallback(async () => {
    if (!currentTrack?.artist || isLoadingArtist) return;
    
    setIsLoadingArtist(true);
    try {
      // Search for artist on SoundCloud
      const results = await soundCloudService.search(currentTrack.artist, 10);
      
      if (results.users && results.users.length > 0) {
        // Find exact match or close match
        const artistName = currentTrack.artist.toLowerCase();
        const exactMatch = results.users.find(u => 
          u.username.toLowerCase() === artistName
        );
        const closeMatch = results.users.find(u => 
          u.username.toLowerCase().includes(artistName) || 
          artistName.includes(u.username.toLowerCase())
        );
        
        const artist = exactMatch || closeMatch || results.users[0];
        
        if (artist) {
          // Get artist tracks sorted by date (newest first)
          const userId = artist.id.replace("sc-user-", "");
          const tracks = await soundCloudService.getUserTracks(userId, 50);
          
          // Sort tracks by creation date (newest first)
          const sortedTracks = [...tracks].sort((a, b) => {
            const dateA = a.metadata?.releaseDate ? new Date(a.metadata.releaseDate).getTime() : 0;
            const dateB = b.metadata?.releaseDate ? new Date(b.metadata.releaseDate).getTime() : 0;
            return dateB - dateA;
          });
          
          // Store in window for SearchView to pick up
          (window as any).__artistData = {
            artist,
            tracks: sortedTracks,
          };
          
          // Navigate to search and trigger artist view
          onClose();
          navigate("search");
          
          // Dispatch event to open artist profile
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent("open-artist-profile", { 
              detail: { artist, tracks: sortedTracks } 
            }));
          }, 100);
        }
      }
    } catch (error) {
      console.error("[FullscreenPlayer] Error searching for artist:", error);
    }
    setIsLoadingArtist(false);
  }, [currentTrack?.artist, isLoadingArtist, navigate, onClose]);

  const fmt = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const VolumeIcon = useMemo(() => {
    if (volume === 0) return IoVolumeMute;
    if (volume < 0.3) return IoVolumeLow;
    if (volume < 0.7) return IoVolumeMedium;
    return IoVolumeHigh;
  }, [volume]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === " ") {
        e.preventDefault();
        audioService.toggle();
      } else if (e.key === "ArrowRight") {
        usePlayerStore.getState().nextTrack();
      } else if (e.key === "ArrowLeft") {
        usePlayerStore.getState().previousTrack();
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!currentTrack) return null;

  const hasSyncedLyrics = lyrics.length > 0;
  const hasPlainLyrics = !hasSyncedLyrics && plainLyrics;
  const hasAnyLyrics = hasSyncedLyrics || hasPlainLyrics;
  const hasNoLyrics = !hasSyncedLyrics && !hasPlainLyrics && !isLoadingLyrics;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 1.05 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="fixed inset-0 z-[100] bg-[#050505] text-white overflow-hidden font-sans"
    >
      {/* Dynamic background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div 
          key={currentTrack.id}
          initial={{ opacity: 0, scale: 1.5 }}
          animate={{ opacity: 0.6, scale: 1.1 }}
          transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: `url(${artworkUrl})`,
            filter: "blur(120px) saturate(1.8) brightness(0.8)"
          }}
        />
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-black/70" 
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_transparent_0%,_#050505_70%)]" />
      </div>

      {/* Close button */}
      <motion.button
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 0.4, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        whileHover={{ opacity: 1, scale: 1.1 }}
        onClick={onClose}
        className="absolute top-6 right-6 p-3 rounded-full transition-all z-[110]"
        style={{ background: 'var(--surface-elevated)', color: 'var(--text-primary)' }}
        title="Закрыть (Esc)"
      >
        <IoClose size={28} />
      </motion.button>

      <AnimatePresence mode="wait">
        {/* Compact view - centered card while loading */}
        {viewMode === 'compact' && (
          <motion.div
            key="compact"
            initial={{ opacity: 0, scale: 0.8, y: 100 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -30 }}
            transition={{ 
              duration: 0.6, 
              ease: [0.34, 1.56, 0.64, 1],
              opacity: { duration: 0.4 }
            }}
            className="relative z-10 h-full w-full flex items-center justify-center"
          >
            <motion.div 
              className="w-full max-w-[720px] p-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              {/* Album artwork */}
              <motion.div 
                className="relative aspect-square w-full mb-8"
                initial={{ scale: 0.5, rotateX: 20 }}
                animate={{ scale: 1, rotateX: 0 }}
                transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
              >
                <motion.img
                  src={artworkUrl}
                  alt={currentTrack.title}
                  className="w-full h-full object-cover rounded-3xl shadow-[0_40px_120px_rgba(0,0,0,0.8)] border border-white/10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/icon.svg";
                  }}
                />
                {/* Glow effect */}
                <motion.div 
                  className="absolute -inset-8 -z-10 rounded-3xl opacity-40"
                  style={{ 
                    background: `radial-gradient(circle at center, rgba(255,255,255,0.15) 0%, transparent 70%)`,
                  }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 0.4, scale: 1 }}
                  transition={{ duration: 1, delay: 0.3 }}
                />
              </motion.div>

              {/* Track info */}
              <motion.div 
                className="text-center space-y-2 mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <h1 className="text-2xl font-bold tracking-tight line-clamp-2">
                  {currentTrack.title}
                </h1>
                <button 
                  onClick={handleArtistClick}
                  disabled={isLoadingArtist}
                  className="text-lg text-white/50 font-medium hover:text-white/80 hover:underline transition-all cursor-pointer disabled:opacity-50"
                >
                  {isLoadingArtist ? "Загрузка..." : currentTrack.artist}
                </button>
              </motion.div>

              {/* Progress bar */}
              <motion.div 
                className="space-y-2 mb-6"
                initial={{ opacity: 0, scaleX: 0.5 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ duration: 0.5, delay: 0.35 }}
              >
                <div 
                  className="h-2 w-full bg-white/10 rounded-full cursor-pointer relative overflow-hidden group"
                  onClick={handleSeek}
                >
                  <motion.div 
                    className="absolute h-full bg-gradient-to-r from-white/80 to-white rounded-full"
                    style={{ width: `${progress * 100}%` }}
                    layoutId="progress"
                  />
                  <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="flex justify-between text-xs font-medium text-white/40 tabular-nums">
                  <span>{fmt(currentTime)}</span>
                  <span>{fmt(actualDuration)}</span>
                </div>
              </motion.div>

              {/* Controls */}
              <motion.div 
                className="flex items-center justify-center gap-6 mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <motion.button 
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => usePlayerStore.getState().toggleShuffle()}
                  className="p-2 rounded-full transition-all"
                  style={{
                    color: shuffle ? "#000000" : "#ffffff",
                    background: shuffle ? "#ffffff" : "transparent"
                  }}
                >
                  <IoShuffle size={20} />
                </motion.button>

                <motion.button 
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.85 }}
                  onClick={() => usePlayerStore.getState().previousTrack()} 
                  className="p-2 text-white/70 hover:text-white"
                >
                  <IoPlaySkipBack size={24} />
                </motion.button>
                
                <motion.button 
                  whileHover={{ scale: 1.08, boxShadow: "0 0 60px rgba(255,255,255,0.5)" }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => audioService.toggle()}
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ 
                    background: "#ffffff", 
                    color: "#000000",
                    boxShadow: "0 0 50px rgba(255,255,255,0.3)"
                  }}
                >
                  {isPlaying ? <IoPause size={28} /> : <IoPlay size={28} className="ml-1" />}
                </motion.button>

                <motion.button 
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.85 }}
                  onClick={() => usePlayerStore.getState().nextTrack()} 
                  className="p-2 text-white/70 hover:text-white"
                >
                  <IoPlaySkipForward size={24} />
                </motion.button>

                <motion.button 
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => usePlayerStore.getState().cycleRepeatMode()}
                  className="p-2 rounded-full transition-all relative"
                  style={{
                    color: repeatMode !== 'off' ? "#000000" : "#ffffff",
                    background: repeatMode !== 'off' ? "#ffffff" : "transparent"
                  }}
                >
                  <IoRepeat size={20} />
                  {repeatMode === 'one' && (
                    <span className="absolute -top-1 -right-1 text-[8px] font-bold" style={{ color: "#000000" }}>1</span>
                  )}
                </motion.button>
              </motion.div>

              {/* Bottom controls */}
              <div className="flex items-center justify-center gap-6 text-white/30">
                <button 
                  onClick={handleToggleLike} 
                  className="p-2 transition-all"
                  style={{ color: isLiked ? "#ef4444" : "#ffffff" }}
                >
                  {isLiked ? <IoHeart size={20} /> : <IoHeartOutline size={20} />}
                </button>

                {/* Volume */}
                <div className="flex items-center gap-2">
                  <VolumeIcon size={18} className="text-white/40" />
                  <div 
                    className="w-32 h-2.5 rounded-full cursor-pointer relative overflow-hidden"
                    style={{ background: "var(--surface-elevated)" }}
                    onMouseDown={handleVolumeMouseDown}
                  >
                    <div 
                      className="absolute h-full rounded-full transition-none"
                      style={{ 
                        width: `${volume * 100}%`,
                        background: "var(--interactive-accent)"
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Loading lyrics indicator */}
              {isLoadingLyrics && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-center gap-3 mt-6 text-white/40"
                >
                  <div className="flex items-end gap-1 h-4">
                    {[1, 2, 3, 4].map((i) => (
                      <motion.div
                        key={i}
                        className="w-1 rounded-full bg-white/40"
                        animate={{ height: ["6px", "16px", "6px"] }}
                        transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
                      />
                    ))}
                  </div>
                  <span className="text-sm">Ищем текст...</span>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}

        {/* Full view - with lyrics */}
        {viewMode === 'full' && (
          <motion.div
            key="full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
            className="relative z-10 h-full w-full flex"
          >
            {/* Left side - Album art and controls */}
            <motion.div 
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
              className={`h-full flex flex-col items-center justify-center px-6 ${hasAnyLyrics ? 'w-full lg:w-[35%]' : 'w-full'}`}
            >
              <div className={`w-full space-y-5 ${hasAnyLyrics ? 'max-w-[540px]' : 'max-w-[600px]'}`}>
                {/* Album artwork */}
                <motion.div className="relative aspect-square w-full">
                  <motion.img
                    key={artworkUrl}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    src={artworkUrl}
                    alt={currentTrack.title}
                    className="w-full h-full object-cover rounded-3xl shadow-[0_50px_150px_rgba(0,0,0,0.8)] border border-white/10"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/icon.svg";
                    }}
                  />
                </motion.div>

                {/* Track info */}
                <div className="text-center space-y-1">
                  <motion.h1 
                    key={currentTrack.title}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-2xl lg:text-3xl font-bold tracking-tight line-clamp-2"
                  >
                    {currentTrack.title}
                  </motion.h1>
                  <div className="flex items-center justify-center gap-2">
                    <motion.button 
                      key={currentTrack.artist}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onClick={handleArtistClick}
                      disabled={isLoadingArtist}
                      className="text-lg text-white/50 font-medium hover:text-white/80 hover:underline transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isLoadingArtist ? "Загрузка..." : currentTrack.artist}
                    </motion.button>
                    {(currentTrack as any).quality && (
                      <span 
                        className="px-2 py-0.5 text-xs font-bold rounded-md uppercase"
                        style={{ background: 'var(--surface-elevated)', color: 'var(--text-secondary)' }}
                      >
                        {(currentTrack as any).quality}
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-2">
                  <div 
                    className="h-2.5 w-full rounded-full cursor-pointer relative group overflow-hidden"
                    style={{ background: "var(--surface-elevated)" }}
                    onClick={handleSeek}
                  >
                    <motion.div 
                      className="absolute h-full rounded-full"
                      style={{ 
                        width: `${progress * 100}%`,
                        background: "var(--interactive-accent)"
                      }}
                    />
                    <div 
                      className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      style={{ 
                        left: `calc(${progress * 100}% - 8px)`,
                        background: "var(--interactive-accent)"
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs font-medium text-white/40 tabular-nums">
                    <span>{fmt(currentTime)}</span>
                    <span>{fmt(actualDuration)}</span>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-6">
                  <button 
                    onClick={() => usePlayerStore.getState().toggleShuffle()}
                    className="p-2 rounded-full transition-all"
                    style={{
                      color: shuffle ? "#000000" : "#ffffff",
                      background: shuffle ? "#ffffff" : "transparent"
                    }}
                  >
                    <IoShuffle size={20} />
                  </button>
                  
                  <button 
                    onClick={() => usePlayerStore.getState().previousTrack()} 
                    className="p-2 hover:scale-110 active:scale-90 transition-all text-white/70 hover:text-white"
                  >
                    <IoPlaySkipBack size={26} />
                  </button>
                  
                  <button 
                    onClick={() => audioService.toggle()}
                    className="w-18 h-18 p-5 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
                    style={{ 
                      background: "#ffffff", 
                      color: "#000000",
                      boxShadow: "0 0 50px rgba(255,255,255,0.3)"
                    }}
                  >
                    {isPlaying ? <IoPause size={32} /> : <IoPlay size={32} className="ml-1" />}
                  </button>

                  <button 
                    onClick={() => usePlayerStore.getState().nextTrack()} 
                    className="p-2 hover:scale-110 active:scale-90 transition-all text-white/70 hover:text-white"
                  >
                    <IoPlaySkipForward size={26} />
                  </button>

                  <button 
                    onClick={() => usePlayerStore.getState().cycleRepeatMode()}
                    className="p-2 rounded-full transition-all relative"
                    style={{
                      color: repeatMode !== 'off' ? "#000000" : "#ffffff",
                      background: repeatMode !== 'off' ? "#ffffff" : "transparent"
                    }}
                  >
                    <IoRepeat size={20} />
                    {repeatMode === 'one' && (
                      <span className="absolute -top-1 -right-1 text-[9px] font-bold" style={{ color: "#000000" }}>1</span>
                    )}
                  </button>
                </div>

                {/* Bottom controls - Like & Volume */}
                <div className="flex items-center justify-center gap-6 text-white/40">
                  <button 
                    onClick={handleToggleLike} 
                    className="p-2 transition-all"
                    style={{ color: isLiked ? "#ef4444" : "#ffffff" }}
                  >
                    {isLiked ? <IoHeart size={22} /> : <IoHeartOutline size={22} />}
                  </button>

                  {/* Volume slider */}
                  <div className="flex items-center gap-3">
                    <VolumeIcon size={20} />
                    <div 
                      className="w-40 h-2.5 bg-white/10 rounded-full cursor-pointer relative group overflow-hidden"
                      onMouseDown={handleVolumeMouseDown}
                    >
                      <div 
                        className="absolute h-full bg-white/70 rounded-full transition-none"
                        style={{ width: `${volume * 100}%` }}
                      />
                      <div 
                        className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-lg"
                        style={{ 
                          left: `calc(${volume * 100}% - 8px)`,
                          background: "var(--interactive-accent)"
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right side - Lyrics */}
            {hasAnyLyrics && (
              <motion.div 
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
                className="hidden lg:flex w-[65%] h-full flex-col justify-center px-8 py-12"
              >
                <div 
                  ref={lyricsContainerRef}
                  className="overflow-visible relative"
                >
                  {/* Synced lyrics - large centered text */}
                  {hasSyncedLyrics && (
                    <div className="flex flex-col gap-6">
                      {lyrics.map((line, index) => {
                        const isActive = index === activeIndex;
                        const isPast = index < activeIndex;
                        
                        // Show 8 lines: 2 before, active, 5 after
                        const distance = index - activeIndex;
                        if (distance < -2 || distance > 5) return null;
                        
                        return (
                          <motion.p
                            key={`lyric-${index}`}
                            ref={isActive ? activeLineRef : null}
                            initial={false}
                            animate={{ 
                              opacity: isActive ? 1 : isPast ? 0.3 : 0.45,
                              scale: isActive ? 1 : 0.92,
                            }}
                            transition={{ 
                              duration: 0.4,
                              ease: [0.4, 0, 0.2, 1]
                            }}
                            className={`text-2xl sm:text-3xl lg:text-4xl xl:text-[2.75rem] 2xl:text-5xl font-extrabold leading-tight cursor-pointer
                              ${isActive ? 'text-white' : 'text-white/40'}
                              hover:text-white hover:opacity-100`}
                            onClick={() => handleLyricClick(line.time)}
                            style={{
                              textShadow: isActive ? '0 4px 30px rgba(255,255,255,0.25)' : 'none',
                              transformOrigin: 'left center',
                              lineHeight: '1.3'
                            }}
                          >
                            {line.text}
                          </motion.p>
                        );
                      })}
                    </div>
                  )}

                  {/* Plain lyrics (no sync) */}
                  {hasPlainLyrics && (
                    <div className="flex flex-col gap-4 overflow-y-auto max-h-[80vh] no-scrollbar">
                      <div className="mb-2 flex items-center gap-2 text-white/30">
                        <IoMusicalNotes size={18} />
                        <span className="text-sm">Текст без синхронизации</span>
                      </div>
                      {plainLyrics.split('\n').slice(0, 30).map((line, index) => (
                        <p 
                          key={index} 
                          className="text-3xl lg:text-4xl text-white/70 leading-relaxed font-bold"
                        >
                          {line || '\u00A0'}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* No lyrics - show centered */}
            {hasNoLyrics && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="hidden lg:flex w-[55%] h-full items-center justify-center"
              >
                <div className="text-center">
                  <IoMusicalNotes size={64} className="text-white/10 mx-auto mb-4" />
                  <p className="text-white/30 text-xl font-medium">Текст не найден</p>
                  <p className="text-white/20 text-sm mt-2">
                    Попробуйте другой трек
                  </p>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </motion.div>
  );
}
