import { useState, useEffect, useRef, useCallback } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  ListMusic,
  Download,
  Heart,
  Volume2,
  Volume1,
  VolumeX,
  Maximize2,
  Sliders,
  ChevronDown,
  Radio,
  X,
  ChevronRight,
  Check,
  Music,
  Gauge
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { FaSoundcloud, FaYoutube, FaSpotify } from "react-icons/fa";
import { SiVk } from "react-icons/si";
import { usePlayerStore } from "../../stores/playerStore";
import { useQueueStore } from "../../stores/queueStore";
import { useUserStore } from "../../stores/userStore";
import { useNavigationStore } from "../../stores/navigationStore";
import { useThemeStore } from "../../stores/themeStore";
import { usePlayerSettingsStore } from "../../stores/playerSettingsStore";
import { audioService } from "../../services/AudioService";
import { likedTracksService } from "../../services/LikedTracksService";
import { playlistService } from "../../services/PlaylistService";
import { offlineTracksService } from "../../services/OfflineTracksService";
import { soundCloudService } from "../../services/SoundCloudService";
import { youtubeService } from "../../services/YouTubeService";
import { vkMusicService } from "../../services/VKMusicService";
import { yandexMusicService } from "../../services/YandexMusicService";
import { spotifyService } from "../../services/SpotifyService";
import { downloadService } from "../../services/DownloadService";
import type { Track, Playlist } from "../../types";

// Service icon component (small SVG icons)
function ServiceIcon({ platform, size = 12 }: { platform?: string; size?: number }) {
  if (!platform) return null;
  
  const p = platform.toLowerCase();
  
  if (p === "soundcloud" || p.includes("soundcloud") || p.startsWith("sc")) {
    return <FaSoundcloud size={size} style={{ color: "#ff5500" }} />;
  }
  if (p === "youtube" || p.includes("youtube") || p.startsWith("yt")) {
    return <FaYoutube size={size} style={{ color: "#ff0000" }} />;
  }
  if (p === "vk" || p.includes("vk")) {
    return <SiVk size={size} style={{ color: "#0077ff" }} />;
  }
  if (p === "spotify" || p.includes("spotify") || p.startsWith("sp")) {
    return <FaSpotify size={size} style={{ color: "#1db954" }} />;
  }
  return null;
}

// Get platform from track
function getTrackPlatform(track: Track): string {
  if (track.platform) return track.platform;
  if ((track as any).source) return (track as any).source;
  const id = track.id || "";
  if (id.startsWith("sc-") || id.includes("soundcloud")) return "soundcloud";
  if (id.startsWith("yt-") || id.includes("youtube")) return "youtube";
  if (id.startsWith("vk-")) return "vk";
  if (id.startsWith("ym-") || id.includes("yandex")) return "yandex";
  if (id.startsWith("sp-") || id.includes("spotify")) return "spotify";
  const streamUrl = track.streamUrl || "";
  if (streamUrl.includes("soundcloud") || streamUrl.includes("sndcdn")) return "soundcloud";
  if (streamUrl.includes("youtube") || streamUrl.includes("googlevideo")) return "youtube";
  if (streamUrl.includes("vk.com") || streamUrl.includes("vk-cdn")) return "vk";
  if (streamUrl.includes("music.yandex")) return "yandex";
  if (streamUrl.includes("spotify")) return "spotify";
  return "soundcloud";
}

export function NowPlayingView() {
  const { currentTrack, isPlaying, progress, volume, repeatMode, setFullscreen } =
    usePlayerStore();
  const { upcoming: queue, removeFromQueue, clearQueue } = useQueueStore();
  const { incrementStat } = useUserStore();
  const { goBack, navigate } = useNavigationStore();
  const { currentTheme, currentThemeId } = useThemeStore();
  const { customArtworkUrl, customArtworkEnabled } = usePlayerSettingsStore();
  
  // Определяем светлую тему
  const isLightTheme = currentThemeId?.startsWith('light');
  
  // Use custom artwork if enabled, otherwise use track artwork
  const artworkUrl = (customArtworkEnabled && customArtworkUrl) ? customArtworkUrl : (currentTrack?.artworkUrl || "/icon.svg");
  
  const [isLiked, setIsLiked] = useState(false);
  const [isDraggingProgress, setIsDraggingProgress] = useState(false);
  const [isDraggingVolume, setIsDraggingVolume] = useState(false);
  const [hoveredTrack, setHoveredTrack] = useState<number | null>(null);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showEqualizerMenu, setShowEqualizerMenu] = useState(false);
  const [equalizerPreset, setEqualizerPreset] = useState<string>("flat");
  const [equalizerEnabled, setEqualizerEnabled] = useState(false);
  const [equalizerBands, setEqualizerBands] = useState<number[]>([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]); // 10 полос
  // --- Equalizer settings persistence ---
  useEffect(() => {
    // Load from localStorage on mount
    const saved = localStorage.getItem('harmonix-equalizer');
    if (saved) {
      try {
        const eq = JSON.parse(saved);
        if (Array.isArray(eq.bands) && eq.bands.length === 10) setEqualizerBands(eq.bands);
        if (typeof eq.preset === 'string') setEqualizerPreset(eq.preset);
        if (typeof eq.enabled === 'boolean') setEqualizerEnabled(eq.enabled);
      } catch {}
    }
  }, []);

  useEffect(() => {
    // Save to localStorage on change
    localStorage.setItem('harmonix-equalizer', JSON.stringify({
      bands: equalizerBands,
      preset: equalizerPreset,
      enabled: equalizerEnabled
    }));
  }, [equalizerBands, equalizerPreset, equalizerEnabled]);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [loadingSimilar, setLoadingSimilar] = useState(false);
  
  const progressRef = useRef<HTMLDivElement>(null);
  const volumeRef = useRef<HTMLDivElement>(null);
  const queueContainerRef = useRef<HTMLDivElement>(null);
  const colors = currentTheme.colors;

  useEffect(() => {
    if (currentTrack) setIsLiked(likedTracksService.isLiked(currentTrack.id));
  }, [currentTrack?.id]);

  const toggleLike = () => {
    if (!currentTrack) return;
    const isNowLiked = likedTracksService.toggleLike(currentTrack);
    setIsLiked(isNowLiked);
    if (isNowLiked) incrementStat("likedTracks", 1);
    window.dispatchEvent(new CustomEvent("liked-tracks-changed"));
  };

  const handleProgressChange = useCallback((clientX: number) => {
    if (!progressRef.current) return;
    const r = progressRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
    audioService.seek(pos);
  }, []);

  const handleVolumeChange = useCallback((clientX: number) => {
    if (!volumeRef.current) return;
    const r = volumeRef.current.getBoundingClientRect();
    const newVolume = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
    usePlayerStore.getState().setVolume(newVolume);
    audioService.setVolume(newVolume);
    localStorage.setItem('harmonix-volume', String(newVolume));
  }, []);
  // --- Volume persistence ---
  useEffect(() => {
    const saved = localStorage.getItem('harmonix-volume');
    if (saved) {
      const v = parseFloat(saved);
      if (!isNaN(v)) {
        usePlayerStore.getState().setVolume(v);
        audioService.setVolume(v);
      }
    }
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingProgress) handleProgressChange(e.clientX);
      if (isDraggingVolume) handleVolumeChange(e.clientX);
    };
    const handleMouseUp = () => {
      setIsDraggingProgress(false);
      setIsDraggingVolume(false);
    };
    if (isDraggingProgress || isDraggingVolume) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDraggingProgress, isDraggingVolume, handleProgressChange, handleVolumeChange]);

  const fmt = (s: number) => {
    if (!s || isNaN(s) || !isFinite(s)) return "0:00";
    let seconds = s > 1000 ? s / 1000 : s;
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const rawDuration = currentTrack?.duration || 0;
  const actualDuration = rawDuration > 1000 ? rawDuration / 1000 : rawDuration;
  const time = progress * actualDuration;

  const VolumeIcon = volume === 0 ? VolumeX : volume < 0.3 ? Volume1 : Volume2;

  const handlePrevTrack = () => usePlayerStore.getState().previousTrack();
  const handleNextTrack = () => usePlayerStore.getState().nextTrack();
  const handleDownloadTrack = async () => {
    if (!currentTrack) return;
    await downloadService.downloadTrack(currentTrack);
  };
  const onCycleRepeat = () => usePlayerStore.getState().cycleRepeatMode();

  const playFromQueue = (track: Track, index: number) => {
    removeFromQueue(index);
    usePlayerStore.getState().playTrackFromQueue(track);
  };

  const handleClearQueue = () => {
    setShowClearConfirm(true);
  };

  const confirmClearQueue = () => {
    clearQueue();
    setShowClearConfirm(false);
  };


  const handlePlaySimilar = async () => {
    if (!currentTrack || loadingSimilar) return;
    
    console.log('[NowPlayingView] Searching for similar tracks...', currentTrack);
    setLoadingSimilar(true);
    try {
      // Ищем похожие треки по исполнителю на всех доступных сервисах
      const searchQuery = currentTrack.artist || currentTrack.title;
      const allResults: Track[] = [];
      
      console.log('[NowPlayingView] Search query:', searchQuery);
      
      // Пробуем все сервисы параллельно
      const searchPromises: Promise<Track[]>[] = [];
      
      // SoundCloud
      if (soundCloudService.isEnabled()) {
        searchPromises.push(
          soundCloudService.search(searchQuery, 10)
            .then(result => (result as any).tracks || [])
            .catch(() => [])
        );
      }
      
      // YouTube
      if (youtubeService.isEnabled()) {
        searchPromises.push(
          youtubeService.search(searchQuery, 10).catch(() => [])
        );
      }
      
      // VK Music
      if (vkMusicService.isEnabled()) {
        searchPromises.push(
          vkMusicService.search(searchQuery, 10).catch(() => [])
        );
      }
      
      // Yandex Music
      if (yandexMusicService.isEnabled()) {
        searchPromises.push(
          yandexMusicService.search(searchQuery, 10).catch(() => [])
        );
      }
      
      // Spotify
      if (spotifyService.isConnected()) {
        searchPromises.push(
          spotifyService.search(searchQuery, 10).catch(() => [])
        );
      }
      
      const results = await Promise.all(searchPromises);
      results.forEach((tracks: Track[]) => allResults.push(...tracks));
      
      let similarTracks = allResults
        .filter(t => t.id !== currentTrack.id)
        .slice(0, 30);
      
      similarTracks = similarTracks.filter(track => {
        if (track.platform === 'soundcloud' || track.id.startsWith('sc-')) {
          if (track.streamUrl && track.streamUrl !== '') return true;
          return true;
        }
        return true;
      }).slice(0, 20);
      
      if (similarTracks.length > 0) {
        const { clearQueue, addToQueue } = useQueueStore.getState();
        clearQueue();
        similarTracks.forEach(track => addToQueue(track));
        
        window.dispatchEvent(
          new CustomEvent("show-toast", {
            detail: { 
              message: `Очередь заменена на ${similarTracks.length} похожих треков`, 
              type: "success" 
            },
          })
        );
      } else {
        window.dispatchEvent(
          new CustomEvent("show-toast", {
            detail: { 
              message: "Похожие треки не найдены", 
              type: "info" 
            },
          })
        );
      }
    } catch (error) {
      console.error('[NowPlayingView] Error loading similar tracks:', error);
      window.dispatchEvent(
        new CustomEvent("show-toast", {
          detail: { 
            message: "Ошибка при поиске похожих треков", 
            type: "error" 
          },
        })
      );
    } finally {
      setLoadingSimilar(false);
    }
  };

  const handleAddToPlaylist = (track: Track, event: React.MouseEvent) => {
    const button = event.currentTarget as HTMLElement;
    const rect = button.getBoundingClientRect();
    
    const menuWidth = 320;
    const menuMaxHeight = 400;
    const padding = 16;
    
    let left = rect.left - (menuWidth / 2) + (rect.width / 2);
    let top = rect.bottom + 8;
    
    if (left + menuWidth > window.innerWidth - padding) {
      left = window.innerWidth - menuWidth - padding;
    }
    
    if (left < padding) {
      left = padding;
    }
    
    if (top + menuMaxHeight > window.innerHeight - padding) {
      top = rect.top - menuMaxHeight - 8;
    }
    
    setMenuPosition({ top, left });
    setSelectedTrack(track);
    setShowPlaylistModal(true);
    setPlaylists(playlistService.getAllPlaylists());
  };

  const handleClosePlaylistModal = () => {
    setShowPlaylistModal(false);
    setSelectedTrack(null);
    setPlaylists([]);
    setMenuPosition(null);
  };

  const handleToggleTrackInPlaylist = (playlistId: string) => {
    if (!selectedTrack) return;
    
    const playlist = playlistService.getPlaylist(playlistId);
    if (!playlist) return;
    
    const isInPlaylist = playlist.tracks?.some((t) => t.id === selectedTrack.id);
    
    if (isInPlaylist) {
      playlistService.removeTrackFromPlaylist(playlistId, selectedTrack.id);
    } else {
      playlistService.addTrackToPlaylist(playlistId, selectedTrack);
    }
    
    setPlaylists(playlistService.getAllPlaylists());
  };

  const EQ_PRESETS: { [key: string]: number[] } = {
    flat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    bass: [8, 6, 4, 2, 0, 0, 0, 0, 0, 0],
    'bass-boost': [10, 8, 6, 4, 2, 0, 0, 0, 0, 0],
    treble: [0, 0, 0, 0, 0, 2, 4, 6, 8, 10],
    'treble-boost': [0, 0, 0, 0, 0, 4, 6, 8, 10, 12],
    vocal: [0, 2, 4, 4, 2, 0, -2, -2, 0, 0],
    rock: [6, 4, 2, 0, -2, -2, 0, 2, 4, 6],
    pop: [2, 4, 4, 2, 0, -2, -2, 0, 2, 4],
    jazz: [4, 2, 0, 2, 4, 4, 2, 0, 2, 4],
    classical: [4, 2, 0, 0, 0, 0, -2, -2, 0, 2],
    electronic: [6, 4, 2, 0, -2, 2, 4, 6, 8, 6],
    'deep-bass': [12, 10, 8, 6, 4, 2, 0, 0, 0, 0],
  };

  const resolvePresetId = (bands: number[]) => {
    const entries = Object.entries(EQ_PRESETS);
    for (const [id, presetBands] of entries) {
      if (presetBands.every((value, i) => value === bands[i])) {
        return id;
      }
    }
    return "custom";
  };

  const applyEqualizerPreset = (presetId: string) => {
    const presetBands = EQ_PRESETS[presetId];
    if (!presetBands) return;
    audioService.applyEqPreset(presetBands);
    const shouldEnable = presetId !== "flat";
    audioService.setEqEnabled(shouldEnable);
    setEqualizerPreset(presetId);
    setEqualizerBands(presetBands);
    setEqualizerEnabled(shouldEnable);
  };

  const handleEqualizerBandChange = (index: number, value: number) => {
    audioService.setEqBand(index, value);
    audioService.setEqEnabled(true);
    const bands = audioService.getEqBands();
    setEqualizerBands(bands);
    setEqualizerPreset("custom");
    setEqualizerEnabled(true);
  };

  useEffect(() => {
    if (!showEqualizerMenu) return;
    const bands = audioService.getEqBands();
    setEqualizerBands(bands);
    const enabled = audioService.isEqEnabled();
    setEqualizerEnabled(enabled);
    setEqualizerPreset(resolvePresetId(bands));
  }, [showEqualizerMenu]);

  if (!currentTrack) {
    return (
      <div className="h-full flex items-center justify-center" style={{ background: colors.background }}>
        <div className="text-center">
          <Music size={64} style={{ color: colors.textSecondary, margin: "0 auto 16px" }} />
          <p style={{ color: colors.textSecondary, fontSize: "18px" }}>Выберите трек для воспроизведения</p>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="h-full flex flex-col" style={{ 
      background: colors.background,
      fontFamily: "system-ui, -apple-system, sans-serif"
    }}>
      {/* Минимальный header - только кнопка свернуть */}
      <div className="px-6 py-3 flex items-center">
        <motion.button 
          onClick={goBack}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          style={{ color: colors.textSecondary }}
          title="Свернуть плеер"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <ChevronDown size={20} />
        </motion.button>
      </div>

      {/* Основное содержимое */}
      <div className="flex flex-1 overflow-hidden" style={{ gap: "24px", padding: "0 24px 24px 24px" }}>
        {/* Левая панель - Обложка и кнопки управления */}
        <div className="flex flex-col p-4 rounded-xl overflow-y-auto" style={{ 
          width: "450px", 
          flexShrink: 0,
          background: colors.accent + "15"
        }}>
          {/* Обложка альбома с обводкой - контейнер для оверлея */}
          <div className="relative mb-4 rounded-lg overflow-hidden group" style={{ border: `2px solid ${colors.accent}40` }}>
            <img
              src={artworkUrl}
              alt={currentTrack.title}
              className="w-full aspect-square object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/icon.svg";
              }}
              style={{ 
                boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                filter: (showEqualizerMenu || showSpeedMenu) ? 'blur(8px) brightness(0.3)' : 'none',
                transition: 'filter 0.3s ease'
              }}
            />
            
            {/* Оверлей эквалайзера поверх обложки */}
            <AnimatePresence>
              {showEqualizerMenu && (
                <motion.div 
                  initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                  animate={{ opacity: 1, backdropFilter: "blur(24px)" }}
                  exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
                  className="absolute inset-0 flex flex-col p-5"
                  style={{ 
                    background: isLightTheme 
                      ? 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(240,240,240,0.98) 100%)'
                      : 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(20,20,20,0.95) 100%)',
                  }}
                >
                  {/* Заголовок с тумблером */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold" style={{ color: isLightTheme ? '#000' : '#fff' }}>Эквалайзер</h3>
                      <p className="text-[10px] mt-0.5" style={{ color: isLightTheme ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)' }}>
                        {equalizerEnabled ? 'Активен' : 'Выключен'}
                      </p>
                    </div>
                    
                    {/* Тумблер вкл/выкл */}
                    <button
                      onClick={() => {
                        const nextEnabled = !equalizerEnabled;
                        setEqualizerEnabled(nextEnabled);
                        audioService.setEqEnabled(nextEnabled);
                        if (nextEnabled && equalizerPreset === "flat") {
                          audioService.applyEqPreset(EQ_PRESETS.flat);
                          setEqualizerBands(EQ_PRESETS.flat);
                        }
                      }}
                      className="w-12 h-7 rounded-full transition-all relative"
                      style={{ 
                        background: equalizerEnabled ? (isLightTheme ? '#000000' : '#ffffff') : (isLightTheme ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.15)'),
                        boxShadow: equalizerEnabled ? (isLightTheme ? '0 0 20px rgba(0,0,0,0.3)' : '0 0 20px rgba(255,255,255,0.3)') : 'none'
                      }}
                    >
                      <div 
                        className="absolute top-1 w-5 h-5 rounded-full transition-all"
                        style={{ 
                          left: equalizerEnabled ? 'calc(100% - 24px)' : '4px',
                          background: equalizerEnabled ? (isLightTheme ? '#ffffff' : '#000000') : (isLightTheme ? '#000000' : '#ffffff'),
                          boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                        }}
                      />
                    </button>
                  </div>

                  {/* Пресеты */}
                  <div className="mb-3">
                    <div className="flex gap-1.5 flex-wrap">
                      {[
                        { id: 'flat', name: 'Обычный' },
                        { id: 'bass', name: 'Басы' },
                        { id: 'bass-boost', name: 'Усиленные басы' },
                        { id: 'deep-bass', name: 'Глубокие басы' },
                        { id: 'treble', name: 'Высокие' },
                        { id: 'treble-boost', name: 'Усиленные высокие' },
                        { id: 'vocal', name: 'Вокал' },
                        { id: 'rock', name: 'Рок' },
                        { id: 'pop', name: 'Поп' },
                      ].map((preset) => {
                        const isActive = equalizerPreset === preset.id;
                        return (
                          <button
                            key={preset.id}
                            onClick={() => applyEqualizerPreset(preset.id)}
                            className="px-3 py-1.5 rounded-xl transition-all text-[10px] font-bold hover:scale-105 flex-shrink-0"
                            style={{
                              background: isActive ? (isLightTheme ? '#000000' : '#ffffff') : (isLightTheme ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'),
                              color: isActive ? (isLightTheme ? '#ffffff' : '#000000') : (isLightTheme ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)'),
                              border: `1.5px solid ${isActive ? (isLightTheme ? '#000000' : '#ffffff') : (isLightTheme ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)')}`,
                              boxShadow: isActive ? (isLightTheme ? '0 4px 12px rgba(0,0,0,0.2)' : '0 4px 12px rgba(255,255,255,0.2)') : 'none',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {preset.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Эквалайзер полосы */}
                  <div className="flex-1 flex flex-col justify-end">
                    <div className="w-full flex items-end justify-between gap-2">
                      {['32', '64', '125', '250', '500', '1k', '2k', '4k', '8k', '16k'].map((freq, index) => {
                        const value = equalizerBands[index];
                        const percentage = ((value + 12) / 24) * 100;
                        const isPositive = value > 0;
                        const isNegative = value < 0;
                        
                        return (
                          <div 
                            key={freq} 
                            className="flex flex-col items-center gap-1.5 flex-1"
                            onMouseDown={(e) => {
                              if (!equalizerEnabled) return;
                              e.preventDefault();
                              const bar = e.currentTarget.querySelector('.eq-bar') as HTMLElement;
                              if (!bar) return;
                              
                              const handleMove = (moveEvent: MouseEvent | TouchEvent) => {
                                const rect = bar.getBoundingClientRect();
                                const clientY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY;
                                const y = Math.max(0, Math.min(rect.height, rect.bottom - clientY));
                                const newValue = Math.round((y / rect.height) * 24 - 12);
                                handleEqualizerBandChange(index, newValue);
                              };
                              
                              const handleEnd = () => {
                                document.removeEventListener('mousemove', handleMove);
                                document.removeEventListener('mouseup', handleEnd);
                                document.removeEventListener('touchmove', handleMove);
                                document.removeEventListener('touchend', handleEnd);
                              };
                              
                              handleMove(e.nativeEvent);
                              document.addEventListener('mousemove', handleMove);
                              document.addEventListener('mouseup', handleEnd);
                            }}
                            onTouchStart={(e) => {
                              if (!equalizerEnabled) return;
                              const bar = e.currentTarget.querySelector('.eq-bar') as HTMLElement;
                              if (!bar) return;
                              
                              const handleMove = (moveEvent: TouchEvent) => {
                                const rect = bar.getBoundingClientRect();
                                const clientY = moveEvent.touches[0].clientY;
                                const y = Math.max(0, Math.min(rect.height, rect.bottom - clientY));
                                const newValue = Math.round((y / rect.height) * 24 - 12);
                                handleEqualizerBandChange(index, newValue);
                              };
                              
                              const handleEnd = () => {
                                document.removeEventListener('touchmove', handleMove);
                                document.removeEventListener('touchend', handleEnd);
                              };
                              
                              handleMove(e.nativeEvent);
                              document.addEventListener('touchmove', handleMove);
                              document.addEventListener('touchend', handleEnd);
                            }}
                          >
                            {/* Значение сверху */}
                            <div 
                              className="text-[9px] font-bold px-1.5 py-0.5 rounded min-w-[24px] text-center"
                              style={{ 
                                background: value !== 0 ? (isLightTheme ? '#000000' : '#ffffff') : (isLightTheme ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'),
                                color: value !== 0 ? (isLightTheme ? '#ffffff' : '#000000') : (isLightTheme ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.4)'),
                                opacity: equalizerEnabled ? 1 : 0.3,
                                transition: 'all 0.3s ease',
                              }}
                            >
                              {value > 0 ? '+' : ''}{value}
                            </div>
                            
                            {/* Визуальная полоса */}
                            <div 
                              className="eq-bar w-full rounded-full relative overflow-hidden"
                              style={{ 
                                height: '150px',
                                background: isLightTheme ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)',
                                border: `1px solid ${isLightTheme ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}`,
                                transition: 'all 0.3s ease',
                                cursor: equalizerEnabled ? 'pointer' : 'not-allowed',
                              }}
                            >
                              {/* Центральная линия (0 dB) */}
                              <div 
                                className="absolute left-0 right-0 h-[1px]"
                                style={{ 
                                  top: '50%',
                                  background: isLightTheme ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)',
                                }}
                              />
                              
                              {/* Заполнение */}
                              <div 
                                className="absolute left-0 right-0 rounded-full pointer-events-none"
                                style={{ 
                                  bottom: percentage < 50 ? `${percentage}%` : '50%',
                                  top: percentage >= 50 ? `${100 - percentage}%` : '50%',
                                  background: equalizerEnabled 
                                    ? isPositive 
                                      ? isLightTheme 
                                        ? 'linear-gradient(to top, rgba(0,0,0,0.9), #000000)'
                                        : 'linear-gradient(to top, rgba(255,255,255,0.9), #ffffff)'
                                      : isNegative
                                      ? isLightTheme
                                        ? 'linear-gradient(to bottom, rgba(0,0,0,0.9), #000000)'
                                        : 'linear-gradient(to bottom, rgba(255,255,255,0.9), #ffffff)'
                                      : isLightTheme
                                      ? 'rgba(0,0,0,0.3)'
                                      : 'rgba(255,255,255,0.3)'
                                    : isLightTheme
                                    ? 'rgba(0,0,0,0.15)'
                                    : 'rgba(255,255,255,0.15)',
                                  opacity: equalizerEnabled ? 1 : 0.3,
                                  boxShadow: equalizerEnabled && value !== 0 
                                    ? isLightTheme 
                                      ? '0 0 10px rgba(0,0,0,0.3)' 
                                      : '0 0 10px rgba(255,255,255,0.3)' 
                                    : 'none',
                                  transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                                }}
                              />
                            </div>
                            
                            {/* Частота снизу */}
                            <span 
                              className="text-[9px] font-bold"
                              style={{ 
                                color: value !== 0 
                                  ? (isLightTheme ? '#000000' : '#ffffff') 
                                  : (isLightTheme ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.4)'),
                                opacity: equalizerEnabled ? 1 : 0.3,
                                transition: 'all 0.3s ease',
                              }}
                            >
                              {freq}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Оверлей скорости поверх обложки */}
            <AnimatePresence>
              {showSpeedMenu && (
                <motion.div 
                  initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                  animate={{ opacity: 1, backdropFilter: "blur(20px)" }}
                  exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
                  className="absolute inset-0 flex flex-col p-5"
                  style={{ 
                    background: isLightTheme 
                      ? 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(240,240,240,0.98) 100%)'
                      : 'rgba(0,0,0,0.85)',
                  }}
                >
                  {/* Заголовок */}
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-base font-bold" style={{ color: isLightTheme ? '#000' : '#fff' }}>Скорость</h3>
                      <p className="text-[11px] opacity-70" style={{ color: isLightTheme ? '#000' : '#fff' }}>Настройте темп трека</p>
                    </div>
                    <div 
                      className="px-4 py-2 rounded-xl font-bold text-2xl tabular-nums"
                      style={{ 
                        background: isLightTheme ? '#000000' : '#ffffff', 
                        color: isLightTheme ? '#ffffff' : '#000000' 
                      }}
                    >
                      {playbackSpeed.toFixed(2)}×
                    </div>
                  </div>

                  {/* Слайдер */}
                  <div className="mb-6">
                    <input
                      type="range"
                      min="0.25"
                      max="2"
                      step="0.05"
                      value={playbackSpeed}
                      onChange={(e) => {
                        const speed = parseFloat(e.target.value);
                        setPlaybackSpeed(speed);
                        const audio = audioService.getAudioElement();
                        if (audio) audio.playbackRate = speed;
                      }}
                      className="w-full h-3 rounded-full appearance-none cursor-pointer"
                      style={{
                        background: isLightTheme
                          ? `linear-gradient(to right, #000000 0%, #000000 ${((playbackSpeed - 0.25) / 1.75) * 100}%, rgba(0,0,0,0.2) ${((playbackSpeed - 0.25) / 1.75) * 100}%, rgba(0,0,0,0.2) 100%)`
                          : `linear-gradient(to right, #ffffff 0%, #ffffff ${((playbackSpeed - 0.25) / 1.75) * 100}%, rgba(255,255,255,0.2) ${((playbackSpeed - 0.25) / 1.75) * 100}%, rgba(255,255,255,0.2) 100%)`,
                      }}
                    />
                    <div className="flex justify-between mt-2">
                      <span className="text-[10px]" style={{ color: isLightTheme ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)' }}>0.25× Медленно</span>
                      <span className="text-[10px]" style={{ color: isLightTheme ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)' }}>2× Быстро</span>
                    </div>
                  </div>

                  {/* Пресеты */}
                  <div className="flex-1">
                    <p className="text-[10px] font-semibold mb-3 uppercase tracking-wider" style={{ color: isLightTheme ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)' }}>Быстрый выбор</p>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { speed: 0.5, label: '0.5×' },
                        { speed: 0.75, label: '0.75×' },
                        { speed: 1, label: '1×' },
                        { speed: 1.25, label: '1.25×' },
                        { speed: 1.5, label: '1.5×' },
                        { speed: 1.75, label: '1.75×' },
                        { speed: 2, label: '2×' },
                      ].map(({ speed, label }) => {
                        const isActive = playbackSpeed === speed;
                        return (
                          <button
                            key={speed}
                            onClick={() => {
                              setPlaybackSpeed(speed);
                              const audio = audioService.getAudioElement();
                              if (audio) audio.playbackRate = speed;
                            }}
                            className="py-3 rounded-xl transition-all text-sm font-bold"
                            style={{
                              background: isActive 
                                ? (isLightTheme ? '#000000' : '#ffffff') 
                                : (isLightTheme ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'),
                              color: isActive 
                                ? (isLightTheme ? '#ffffff' : '#000000') 
                                : (isLightTheme ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.7)'),
                              border: `1px solid ${isActive 
                                ? (isLightTheme ? '#000000' : '#ffffff') 
                                : (isLightTheme ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)')}`,
                            }}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Кнопка полноэкранного режима */}
            {!showEqualizerMenu && !showSpeedMenu && (
              <motion.button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Fullscreen button clicked!');
                  setFullscreen(true);
                }}
                className="absolute top-3 right-3 p-2 rounded-lg z-10"
                style={{ 
                  background: "rgba(0,0,0,0.7)", 
                  backdropFilter: "blur(10px)",
                  color: colors.accent,
                }}
                whileHover={{ scale: 1.1, opacity: 1 }}
                initial={{ opacity: 0.8 }}
                title="Полноэкранный режим"
              >
                <Maximize2 size={20} />
              </motion.button>
            )}
          </div>

          {/* Информация о текущем треке */}
          <div className="mb-6 text-center">
            <h2 className="text-lg font-bold mb-1 truncate" style={{ color: colors.textPrimary }}>
              {currentTrack.title}
            </h2>
            <p 
              className="text-sm truncate mb-3 cursor-pointer hover:underline transition-all"
              style={{ color: colors.textSecondary }}
              onClick={() => {
                if (currentTrack.artist) {
                  navigate("search");
                  setTimeout(() => {
                    window.dispatchEvent(new CustomEvent("search-artist", { detail: { artist: currentTrack.artist } }));
                  }, 100);
                }
              }}
              title="Нажмите, чтобы найти треки этого исполнителя"
            >
              {currentTrack.artist}
            </p>
            
            {/* Прогресс бар */}
            <div className="mb-1">
              <div className="flex justify-between text-xs mb-1" style={{ color: colors.textSecondary }}>
                <span>{fmt(time)}</span>
                <span>{fmt(actualDuration)}</span>
              </div>
              <div
                ref={progressRef}
                onMouseDown={(e) => { setIsDraggingProgress(true); handleProgressChange(e.clientX); }}
                className="h-1 rounded-full cursor-pointer relative"
                style={{ 
                  background: colors.textSecondary + "30"
                }}
              >
                <div 
                  className="h-full rounded-full"
                  style={{ width: `${progress * 100}%`, background: colors.accent }}
                />
              </div>
            </div>
          </div>

          {/* Горизонтальная панель управления */}
          <div 
            className="grid grid-cols-[1fr_auto_1fr] items-center px-4 py-3 rounded-xl mb-4"
            style={{ 
              background: colors.surface + "80",
              border: `1px solid ${colors.accent}40`
            }}
          >
            {/* Левая группа кнопок */}
            <div className="flex items-center gap-2">
              <motion.button 
                onClick={onCycleRepeat}
                className="p-2 rounded-lg transition-colors relative"
                style={{ 
                  color: repeatMode !== 'off' ? (isLightTheme ? "#ffffff" : "#000000") : (isLightTheme ? "#000000" : "#ffffff"),
                  background: repeatMode !== 'off' ? (isLightTheme ? "#000000" : "#ffffff") : "transparent"
                }}
                title="Повтор"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Repeat size={20} />
                {repeatMode === 'one' && (
                  <span className="absolute -top-0.5 -right-0.5 text-[8px] font-bold">1</span>
                )}
              </motion.button>
              <motion.button 
                onClick={(e) => handleAddToPlaylist(currentTrack, e)}
                className="p-2 rounded-lg hover:bg-white/5 transition-all"
                style={{ color: colors.textSecondary }}
                title="Добавить в плейлист"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <ListMusic size={20} />
              </motion.button>
            </div>

            {/* Центральная группа - управление воспроизведением */}
            <div className="relative flex items-center justify-center">
              <div className="flex items-center gap-4 justify-center">
                <motion.button 
                  onClick={handlePrevTrack}
                  className="p-2"
                  style={{ color: isLightTheme ? "#000000" : "#ffffff" }}
                  title="Предыдущий трек"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <SkipBack size={26} fill={isLightTheme ? "#000000" : "#ffffff"} />
                </motion.button>
                <motion.button
                  onClick={() => audioService.toggle()}
                  className="w-14 h-14 rounded-full flex items-center justify-center mx-1"
                  style={{ 
                    background: isLightTheme ? "#000000" : "#ffffff",
                    color: isLightTheme ? "#ffffff" : "#000000",
                  }}
                  title={isPlaying ? "Пауза" : "Плей"}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isPlaying ? (
                    <Pause size={28} fill={isLightTheme ? "#ffffff" : "#000000"} />
                  ) : (
                    <Play size={28} fill={isLightTheme ? "#ffffff" : "#000000"} style={{ marginLeft: "4px" }} />
                  )}
                </motion.button>
                <motion.button 
                  onClick={handleNextTrack}
                  className="p-2"
                  style={{ color: isLightTheme ? "#000000" : "#ffffff" }}
                  title="Следующий трек"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <SkipForward size={26} fill={isLightTheme ? "#000000" : "#ffffff"} />
                </motion.button>
              </div>
            </div>

            {/* Правая группа кнопок */}
            <div className="flex items-center justify-end gap-2">
              <motion.button 
                onClick={handleDownloadTrack}
                className="p-2 rounded-lg hover:bg-white/5 transition-all"
                style={{ color: colors.textSecondary }}
                title="Скачать трек"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Download size={20} />
              </motion.button>
              <motion.button 
                onClick={toggleLike}
                className="p-2 rounded-lg transition-all"
                style={{ 
                  color: isLiked ? "#ef4444" : colors.textSecondary,
                  background: isLiked ? "rgba(239,68,68,0.1)" : "transparent"
                }}
                title={isLiked ? "Убрать из избранного" : "Добавить в избранное"}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Heart size={20} fill={isLiked ? "#ef4444" : "none"} />
              </motion.button>
            </div>
          </div>

          {/* Громкость и дополнительные кнопки */}
          <div className="flex items-center justify-between mb-4">
            {/* Микшер громкости слева */}
            <div className="flex items-center gap-3 flex-1">
              <button 
                onClick={() => {
                  const v = volume === 0 ? 0.7 : 0;
                  usePlayerStore.getState().setVolume(v);
                  audioService.setVolume(v);
                }}
                className="p-1.5"
              >
                <VolumeIcon size={18} style={{ color: colors.textSecondary }} />
              </button>
              <div
                ref={volumeRef}
                onMouseDown={(e) => { setIsDraggingVolume(true); handleVolumeChange(e.clientX); }}
                className="h-1 rounded-full cursor-pointer flex-1"
                style={{ 
                  background: colors.textSecondary + "30",
                  maxWidth: "280px"
                }}
              >
                <div 
                  className="h-full rounded-full"
                  style={{ width: `${volume * 100}%`, background: colors.textSecondary }}
                />
              </div>
              <span className="text-xs font-medium tabular-nums min-w-[32px] text-right" style={{ color: colors.textSecondary }}>
                {Math.round(volume * 100)}%
              </span>
            </div>
            
            {/* Дополнительные кнопки справа */}
            <div className="flex items-center gap-2">
              <motion.button 
                onClick={() => {
                  setShowSpeedMenu(!showSpeedMenu);
                  setShowEqualizerMenu(false);
                }}
                className="p-2 rounded-full transition-all text-xs font-bold min-w-[32px] flex items-center justify-center h-8"
                style={{ 
                  color: (playbackSpeed !== 1 || showSpeedMenu) ? (isLightTheme ? "#ffffff" : "#000000") : (isLightTheme ? "#000000" : "#ffffff"),
                  background: (playbackSpeed !== 1 || showSpeedMenu) ? (isLightTheme ? "#000000" : "#ffffff") : "transparent"
                }}
                title="Скорость воспроизведения"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Gauge size={16} className="mr-1" />
                {playbackSpeed}x
              </motion.button>
              <motion.button 
                onClick={() => {
                  setShowEqualizerMenu(!showEqualizerMenu);
                  setShowSpeedMenu(false);
                }}
                className="p-2 rounded-full transition-all"
                style={{ 
                  color: (equalizerEnabled || showEqualizerMenu) ? (isLightTheme ? "#ffffff" : "#000000") : (isLightTheme ? "#000000" : "#ffffff"),
                  background: (equalizerEnabled || showEqualizerMenu) ? (isLightTheme ? "#000000" : "#ffffff") : "transparent"
                }}
                title="Эквалайзер"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Sliders size={16} />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Правая панель - Очередь треков */}
        <div className="flex-1 flex flex-col" style={{ 
          background: colors.accent + "15",
          borderRadius: "12px",
          overflow: "hidden"
        }}>
          {/* Заголовок очереди */}
          <div className="px-5 py-4 border-b" style={{ borderColor: colors.textSecondary + "20" }}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold" style={{ color: colors.textPrimary }}>Далее в очереди</h3>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handlePlaySimilar}
                  disabled={loadingSimilar || !currentTrack}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md transition-colors disabled:opacity-50"
                  style={{ 
                    background: colors.accent + "15",
                    color: colors.accent 
                  }}
                  onMouseEnter={(e) => {
                    if (!loadingSimilar) e.currentTarget.style.background = colors.accent + "25";
                  }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = colors.accent + "15";
                    }}
                    title="Найти и добавить похожие треки в очередь"
                  >
                    <Radio size={14} className={loadingSimilar ? "animate-spin" : ""} />
                    {loadingSimilar ? "Ищем..." : "Похожие"}
                  </button>
                  {queue.length > 0 && (
                    <button 
                      onClick={handleClearQueue}
                      className="text-xs px-3 py-1.5 rounded-md transition-colors"
                      style={{ 
                        background: colors.textSecondary + "15",
                        color: colors.textSecondary 
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = colors.textSecondary + "25";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = colors.textSecondary + "15";
                      }}
                    >
                      Очистить
                    </button>
                  )}
                </div>
            </div>
          </div>

          {/* Список очереди */}
          <div className="flex-1 overflow-y-auto" ref={queueContainerRef}>
            {queue.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-16 px-5 text-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" 
                     style={{ background: colors.accent + "20" }}>
                  <Music size={24} style={{ color: colors.textSecondary }} />
                </div>
                <p style={{ color: colors.textSecondary, fontSize: "14px", marginBottom: "8px" }}>
                  Очередь треков пуста
                </p>
                <p style={{ color: colors.textSecondary, fontSize: "12px" }}>
                  Добавьте треки из плейлистов или альбомов
                </p>
              </div>
            ) : (
              <div style={{ padding: "8px 0" }}>
                {queue.map((track, index) => (
                  <div
                    key={`${track.id}-${index}`}
                    className="flex items-center gap-3 px-5 py-3 cursor-pointer transition-all"
                    style={{ 
                      background: hoveredTrack === index ? colors.accent + "20" : "transparent",
                      borderBottom: `1px solid ${colors.textSecondary}20`
                    }}
                    onMouseEnter={() => setHoveredTrack(index)}
                    onMouseLeave={() => setHoveredTrack(null)}
                    onClick={() => playFromQueue(track, index)}
                  >
                    {/* Номер трека */}
                    <div className="w-6 flex-shrink-0">
                      <span className="text-sm tabular-nums font-medium" style={{ 
                        color: hoveredTrack === index ? colors.textPrimary : colors.textSecondary 
                      }}>
                        {index + 1}
                      </span>
                    </div>
                    
                    {/* Обложка трека */}
                    <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0 relative">
                      <img 
                        src={track.artworkUrl || "/icon.svg"} 
                        alt="" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/icon.svg";
                        }}
                      />
                      {/* Service icon */}
                      <div className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full bg-black/70 flex items-center justify-center">
                        <ServiceIcon platform={getTrackPlatform(track)} size={8} />
                      </div>
                    </div>
                    
                    {/* Информация о треке */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate mb-1" style={{ 
                        color: hoveredTrack === index ? colors.textPrimary : colors.textPrimary 
                      }}>
                        {track.title}
                      </p>
                      <p className="text-xs truncate" style={{ 
                        color: hoveredTrack === index ? colors.textSecondary : colors.textSecondary 
                      }}>
                        {track.artist}
                      </p>
                    </div>
                    
                    {/* Длительность и действия */}
                    <div className="flex items-center gap-3">
                      {hoveredTrack === index ? (
                        <>
                          <button 
                            className="p-1.5 rounded-md hover:bg-white/10 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              likedTracksService.toggleLike(track);
                              incrementStat("likedTracks", 1);
                              window.dispatchEvent(new CustomEvent("liked-tracks-changed"));
                            }}
                            style={{ color: colors.accent }}
                            title="Добавить в избранное"
                          >
                            <Heart size={16} fill={likedTracksService.isLiked(track.id) ? colors.accent : "none"} />
                          </button>
                          <button 
                            className="p-1.5 rounded-md hover:bg-white/10 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddToPlaylist(track, e);
                            }}
                            style={{ color: colors.textSecondary }}
                            title="Добавить в плейлист"
                          >
                            <ListMusic size={16} />
                          </button>
                          <button 
                            className="p-1.5 rounded-md hover:bg-white/10 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFromQueue(index);
                            }}
                            style={{ color: colors.textSecondary }}
                            title="Удалить из очереди"
                          >
                            <X size={16} />
                          </button>
                        </>
                      ) : (
                        <span className="text-xs tabular-nums" style={{ 
                          color: colors.textSecondary,
                          minWidth: "40px",
                          textAlign: "right"
                        }}>
                          {fmt(track.duration)}
                        </span>
                      )}
                      
                      {hoveredTrack === index && (
                        <ChevronRight size={14} style={{ color: colors.textSecondary }} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Выпадающее меню добавления в плейлист */}
      {showPlaylistModal && selectedTrack && menuPosition && (
        <>
          {/* Backdrop для закрытия меню */}
          <div 
            className="fixed inset-0 z-40 animate-fade-in"
            onClick={handleClosePlaylistModal}
          />
          
          {/* Меню */}
          <div
            className="fixed z-50 w-80 rounded-2xl shadow-2xl backdrop-blur-2xl animate-scale-in overflow-hidden"
            style={{
              top: `${menuPosition.top}px`,
              left: `${menuPosition.left}px`,
              background: `${colors.surface}e6`,
              border: `1px solid ${colors.accent}25`,
              boxShadow: `0 8px 32px -8px ${colors.accent}30, 0 0 0 1px ${colors.accent}10`,
            }}
          >
            {/* Заголовок с информацией о треке */}
            <div 
              className="p-3 border-b backdrop-blur-sm"
              style={{ 
                borderColor: `${colors.textSecondary}10`,
                background: `${colors.accent}08`
              }}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 shadow-md">
                  {selectedTrack.artworkUrl ? (
                    <img
                      src={selectedTrack.artworkUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{ background: `${colors.accent}20` }}
                    >
                      <Music
                        size={16}
                        style={{ color: colors.accent }}
                      />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate text-xs" style={{ color: colors.textPrimary }}>
                    {selectedTrack.title}
                  </p>
                  <p
                    className="text-[10px] truncate opacity-60"
                    style={{ color: colors.textSecondary }}
                  >
                    {selectedTrack.artist}
                  </p>
                </div>
              </div>
            </div>

            {/* Список плейлистов */}
            <div className="max-h-64 overflow-y-auto scrollbar-thin">
              {playlists.length === 0 ? (
                <div className="text-center py-6 px-4">
                  <ListMusic
                    size={28}
                    className="mx-auto mb-1.5 opacity-30"
                    style={{ color: colors.textSecondary }}
                  />
                  <p className="text-xs opacity-60" style={{ color: colors.textSecondary }}>
                    Нет плейлистов
                  </p>
                </div>
              ) : (
                <div className="p-1.5">
                  {/* Offline option */}
                  <button
                    onClick={() => {
                      if (selectedTrack) {
                        offlineTracksService.addOfflineTrack(selectedTrack);
                        window.dispatchEvent(new CustomEvent("show-toast", {
                          detail: { message: "Добавлено в оффлайн", type: "success" }
                        }));
                        setShowPlaylistModal(false);
                      }
                    }}
                    className="w-full flex items-center gap-2.5 p-2 rounded-lg transition-all mb-1.5"
                    style={{
                      background: 'transparent',
                      border: '1px solid transparent',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = `${colors.accent}08`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm"
                      style={{
                        background: colors.surface,
                      }}
                    >
                      <Music
                        size={14}
                        style={{ color: colors.textSecondary }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-xs" style={{ color: colors.textPrimary }}>
                        Оффлайн
                      </p>
                      <p
                        className="text-[10px] opacity-60"
                        style={{ color: colors.textSecondary }}
                      >
                        Локальная коллекция
                      </p>
                    </div>
                  </button>
                  
                  {playlists.map((playlist) => {
                    const isInPlaylist = playlist.tracks?.some(
                      (t) => t.id === selectedTrack?.id
                    );
                    const coverUrl = playlist.coverUrl || playlist.tracks?.[0]?.artworkUrl;
                    
                    return (
                      <button
                        key={playlist.id}
                        onClick={() => handleToggleTrackInPlaylist(playlist.id)}
                        className="w-full flex items-center gap-2.5 p-2 rounded-lg transition-all"
                        style={{
                          background: isInPlaylist ? `${colors.accent}15` : 'transparent',
                          border: isInPlaylist ? `1px solid ${colors.accent}30` : '1px solid transparent',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = isInPlaylist ? `${colors.accent}20` : `${colors.accent}08`;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = isInPlaylist ? `${colors.accent}15` : 'transparent';
                        }}
                      >
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm overflow-hidden"
                          style={{
                            background: coverUrl ? 'transparent' : `linear-gradient(135deg, ${colors.accent}, ${colors.secondary || colors.accent})`,
                          }}
                        >
                          {coverUrl ? (
                            <img
                              src={coverUrl}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Music
                              size={14}
                              className="text-white/70"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate text-xs" style={{ color: colors.textPrimary }}>
                            {playlist.name}
                          </p>
                          <p
                            className="text-[10px] opacity-60"
                            style={{ color: colors.textSecondary }}
                          >
                            {playlist.tracks?.length || 0} треков
                          </p>
                        </div>
                        {isInPlaylist && (
                          <div 
                            className="w-5 h-5 rounded-full flex items-center justify-center"
                            style={{ background: colors.accent }}
                          >
                            <Check size={12} style={{ color: "var(--interactive-accent-text)" }} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </>
      )}
    </div>

    {/* Модальное окно подтверждения очистки очереди */}
    {showClearConfirm && (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in"
        onClick={() => setShowClearConfirm(false)}
      >
        <div
          className="rounded-2xl p-6 w-96 max-w-[90vw] shadow-2xl animate-scale-in"
          style={{
            background: colors.surface,
            border: `1px solid ${colors.accent}30`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-lg font-bold mb-2" style={{ color: colors.textPrimary }}>
            Очистить очередь?
          </h3>
          <p className="text-sm mb-6" style={{ color: colors.textSecondary }}>
            Все треки будут удалены из очереди. Это действие нельзя отменить.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowClearConfirm(false)}
              className="flex-1 py-2.5 px-4 rounded-lg transition-all"
              style={{
                background: colors.textSecondary + "20",
                color: colors.textPrimary,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = colors.textSecondary + "30";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = colors.textSecondary + "20";
              }}
            >
              Отмена
            </button>
            <button
              onClick={confirmClearQueue}
              className="flex-1 py-2.5 px-4 rounded-lg transition-all font-medium"
              style={{
                background: colors.accent,
                color: "white",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.02)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              Очистить
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Полноэкранный режим - управляется через MainLayout */}
    
    {/* CSS анимации */}
    <style>{`
      @keyframes fade-in {
        from { opacity: 0; transform: scale(0.98); }
        to { opacity: 1; transform: scale(1); }
      }
      .animate-fade-in {
        animation: fade-in 0.2s ease-out forwards;
      }
    `}</style>
    </>
  );
}