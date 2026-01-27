import { useState, useEffect } from "react";
import type { SyntheticEvent } from "react";
import {
  IoClose,
  IoShuffle,
  IoReorderTwo,
  IoTime,
  IoList,
  IoPlay,
  IoMusicalNotes,
  IoAdd,
  IoCheckmark,
} from "react-icons/io5";
import { FaSoundcloud, FaYoutube, FaSpotify } from "react-icons/fa";
import { SiVk } from "react-icons/si";
import { useQueueStore } from "../../stores/queueStore";
import { usePlayerStore } from "../../stores/playerStore";
import { audioService } from "../../services/AudioService";
import { playlistService } from "../../services/PlaylistService";
import { offlineTracksService } from "../../services/OfflineTracksService";
import { artworkService } from "../../services/ArtworkService";
import { clsx } from "clsx";
import type { Track, Playlist } from "../../types";
import { usePlayerSettingsStore } from "../../stores/playerSettingsStore";

interface QueuePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

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
  if (p === "yandex" || p.includes("yandex") || p.startsWith("ym")) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 50 50">
        <path fill="#FFCC00" d="M 21.833984 2.2246094 C 11.968984 3.6656094 2.0332031 11.919266 2.0332031 25.072266 C 2.0332031 37.853266 12.356141 48 24.994141 48 C 39.232141 48 51.795844 34.161797 46.964844 18.216797 C 46.756844 17.531797 45.929094 17.260984 45.371094 17.708984 L 41.091797 21.142578 C 40.801797 21.374578 40.673234 21.746328 40.740234 22.111328 C 40.911234 23.049328 41 24.018 41 25 C 41 34.102 33.409937 41.421469 24.210938 40.980469 C 16.699938 40.620469 9.6656875 33.836797 9.0546875 26.341797 C 8.3656875 17.888797 14.256344 10.672812 22.152344 9.2578125 C 22.638344 9.1718125 23 8.7664375 23 8.2734375 L 23 3.2128906 C 23 2.5938906 22.445984 2.1356094 21.833984 2.2246094 z M 30.017578 2.5878906 C 29.47274 2.5848828 29 3.0147656 29 3.5878906 L 29 18.078125 C 27.822 17.396125 26.459 17 25 17 C 20.582 17 17 20.582 17 25 C 17 29.418 20.582 33 25 33 C 29.418 33 33 29.418 33 25 L 33 11.150391 C 34.612 12.083391 36.051141 13.279313 37.244141 14.695312 C 37.679141 15.212312 38.488609 15.161844 38.849609 14.589844 L 41.615234 10.214844 C 41.861234 9.8268438 41.818094 9.3104688 41.496094 8.9804688 C 40.422094 7.8784687 36.703906 4.1571875 30.253906 2.6171875 C 30.174281 2.5983125 30.095412 2.5883203 30.017578 2.5878906 z"/>
      </svg>
    );
  }
  return null;
}

// Get platform from track
function getTrackPlatform(track: Track): string | undefined {
  if (track.platform) return track.platform;
  if ((track as any).source) return (track as any).source;
  const id = track.id || "";
  if (id.startsWith("sc-") || id.includes("soundcloud")) return "soundcloud";
  if (id.startsWith("yt-") || id.includes("youtube")) return "youtube";
  if (id.startsWith("vk-")) return "vk";
  if (id.startsWith("yandex-") || id.startsWith("ym-") || id.includes("yandex")) return "yandex";
  if (id.startsWith("spotify-") || id.startsWith("sp-") || id.includes("spotify")) return "spotify";
  const streamUrl = track.streamUrl || "";
  if (streamUrl.includes("soundcloud") || streamUrl.includes("sndcdn")) return "soundcloud";
  if (streamUrl.includes("youtube") || streamUrl.includes("googlevideo")) return "youtube";
  if (streamUrl.includes("vk.com") || streamUrl.includes("vk-cdn")) return "vk";
  if (streamUrl.includes("music.yandex")) return "yandex";
  if (streamUrl.includes("spotify")) return "spotify";
  return "soundcloud";
}

export function QueuePanel({ onClose }: QueuePanelProps) {
  const { upcoming, history, shuffleQueue, removeFromQueue } = useQueueStore();
  // Use selectors to prevent re-renders from progress updates
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const playTrackFromQueue = usePlayerStore((state) => state.playTrackFromQueue);
  const { queuePosition } = usePlayerSettingsStore();
  const [showPlaylistMenu, setShowPlaylistMenu] = useState<{ track: Track; index: number } | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);

  const getArtworkUrl = (track: Track) => {
    // Return existing artwork or cached only - no automatic search
    if (artworkService.isValidArtworkUrl(track.artworkUrl)) return track.artworkUrl;
    const cached = artworkService.getCachedArtwork(track);
    if (cached) return cached;
    // Don't automatically search - too many API calls
    return undefined;
  };

  const handleArtworkError = () => (e: SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.dataset.failed === "1") return;
    img.dataset.failed = "1";
    img.style.display = "none";
    // No fallback icon - just transparent background
  };

  // Auto-fetch artworks for queue tracks - DISABLED to reduce API calls
  // useEffect(() => {
  //   if (!isOpen) return;

  //   const allTracks = [...upcoming, ...history];
  //   const tracksWithoutArtwork = allTracks.filter((t) => {
  //     const cached = artworkService.getCachedArtwork(t);
  //     return !artworkService.isValidArtworkUrl(t.artworkUrl) && !cached;
  //   });
  //   if (tracksWithoutArtwork.length === 0) return;

  //   const cancel = artworkService.fetchArtworksInBackground(
  //     tracksWithoutArtwork,
  //     (trackId, artworkUrl) => {
  //       updateTrackArtwork(trackId, artworkUrl);
  //       setTimeout(() => {
  //         window.dispatchEvent(new CustomEvent('queue-artwork-updated'));
  //       }, 100);
  //     }
  //   );

  //   return cancel;
  // }, [isOpen, upcoming, history, updateTrackArtwork]);

  // Слушатель для форс-рендера при обновлении обложки
  useEffect(() => {
    // Previously used for force re-render, now no-op
    // If you need to force update, use a different state or method
  }, []);

  const isBottom = queuePosition === "bottom";
  const isLeft = queuePosition === "left";

  const handlePlayTrack = (track: Track, index: number) => {
    removeFromQueue(index);
    playTrackFromQueue(track);
  };

  const handlePlayFromHistory = (track: Track) => {
    audioService.load(track);
  };

  const handleAddToPlaylist = (track: Track, index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const button = e.currentTarget as HTMLElement;
    const rect = button.getBoundingClientRect();
    
    const menuWidth = 320;
    const menuMaxHeight = 400;
    const padding = 16;
    
    // Определяем позицию меню в зависимости от позиции панели
    const queuePanelWidth = 384; // w-96 = 384px
    let left: number;
    let top = rect.top;
    
    if (isBottom) {
      left = rect.left - menuWidth / 2;
    } else if (isLeft) {
      left = queuePanelWidth + 16;
    } else {
      left = window.innerWidth - queuePanelWidth - menuWidth - 16;
    }
    
    // Проверяем границы экрана
    if (left < padding) {
      left = padding;
    }
    if (left + menuWidth > window.innerWidth - padding) {
      left = window.innerWidth - menuWidth - padding;
    }
    
    // Проверяем нижнюю границу
    if (top + menuMaxHeight > window.innerHeight - padding) {
      top = window.innerHeight - menuMaxHeight - padding;
    }
    
    // Проверяем верхнюю границу
    if (top < padding) {
      top = padding;
    }
    
    setMenuPosition({ top, left });
    setPlaylists(playlistService.getAllPlaylists());
    setShowPlaylistMenu({ track, index });
  };

  const handleSelectPlaylist = (playlistId: string) => {
    if (showPlaylistMenu) {
      playlistService.addTrackToPlaylist(playlistId, showPlaylistMenu.track);
      window.dispatchEvent(new CustomEvent("show-toast", {
        detail: { message: "Добавлено в плейлист", type: "success" }
      }));
    }
    setShowPlaylistMenu(null);
    setMenuPosition(null);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const currentArtworkUrl = currentTrack ? getArtworkUrl(currentTrack) : undefined;

  return (
    <div
      className={clsx(
        "glass border-white/5 z-40",
        "transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
        isBottom ? [
          // Bottom position - horizontal layout
          "w-full h-full border-t"
        ] : [
          // Left/Right position - vertical layout (relative in flex container)
          "w-96 h-full overflow-hidden flex-shrink-0",
          isLeft ? "border-r" : "border-l"
        ]
      )}
    >
      {/* Ambient glow */}
      <div className={clsx(
        "absolute bg-[#8B5CF6] rounded-full blur-[100px] opacity-20 pointer-events-none animate-pulse-slow",
        isBottom ? "top-0 left-1/2 w-60 h-20" : "top-0 right-0 w-40 h-40"
      )} />

      {isBottom ? (
        // ========== BOTTOM LAYOUT (HORIZONTAL) ==========
        <div className="flex h-full">
          {/* Header - Compact для нижней позиции */}
          <div className="flex flex-col items-center justify-center px-4 border-r border-white/5 shrink-0">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center shadow-glow mb-2">
              <IoList className="text-white text-sm" />
            </div>
            <div className="flex flex-col gap-1">
              <button
                onClick={shuffleQueue}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110"
                style={{ background: 'var(--surface-elevated)', color: 'var(--text-secondary)' }}
                title="Перемешать"
              >
                <IoShuffle className="text-sm" />
              </button>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300"
                style={{ background: 'var(--surface-elevated)', color: 'var(--text-secondary)' }}
              >
                <IoClose className="text-sm" />
              </button>
            </div>
          </div>

          {/* Now Playing - Compact */}
          {currentTrack && (
            <div className="flex items-center gap-3 px-4 border-r border-white/5 shrink-0 min-w-[200px] max-w-[250px]">
              <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 shadow-lg relative">
                {currentArtworkUrl ? (
                  <img
                    src={currentArtworkUrl}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={handleArtworkError()}
                  />
                ) : null}
                {/* Transparent background when no artwork */}
                {!currentArtworkUrl && (
                  <div className="absolute inset-0 bg-white/5" />
                )}
                <div className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full bg-black/90 flex items-center justify-center">
                  <ServiceIcon platform={getTrackPlatform(currentTrack)} size={8} />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">Сейчас</p>
                <p className="text-sm font-semibold truncate text-white">
                  {currentTrack.title}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {currentTrack.artist}
                </p>
              </div>
            </div>
          )}

          {/* Queue - Horizontal scroll */}
          <div className="flex-1 flex flex-col min-w-0 px-4 py-2">
            <h3 className="text-xs font-semibold text-gray-500 mb-2 tracking-wider shrink-0">
              ДАЛЕЕ ({upcoming.length})
            </h3>
            {upcoming.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="flex items-center gap-3 text-gray-500">
                  <IoList className="text-xl" />
                  <span className="text-sm">Очередь пуста</span>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-x-auto overflow-y-hidden scrollbar-thin">
                <div className="flex gap-3 h-full pb-2">
                  {upcoming.map((track, index) => {
                    const artworkUrl = getArtworkUrl(track);
                    return (
                      <div
                        key={`${track.id}-${index}`}
                        className="group cursor-pointer flex-shrink-0 w-28 flex flex-col items-center p-2 rounded-xl hover:bg-white/5 transition-all duration-300"
                        onClick={() => handlePlayTrack(track, index)}
                      >
                        <div className="w-16 h-16 rounded-lg overflow-hidden shadow-md relative mb-2 bg-white/5">
                          {artworkUrl ? (
                            <>
                              <img
                                src={artworkUrl}
                                alt=""
                                className="w-full h-full object-cover"
                                onError={handleArtworkError()}
                              />
                              <div className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full bg-black/70 flex items-center justify-center">
                                <ServiceIcon platform={getTrackPlatform(track)} size={8} />
                              </div>
                            </>
                          ) : null}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300">
                            <IoPlay style={{ color: "var(--interactive-accent)" }} />
                          </div>
                        </div>
                        <p className="text-xs font-medium truncate text-white w-full text-center">
                          {track.title}
                        </p>
                        <p className="text-[10px] text-gray-500 truncate w-full text-center">
                          {track.artist}
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFromQueue(index);
                          }}
                          className="mt-1 w-6 h-6 rounded-md opacity-0 group-hover:opacity-100 hover:bg-red-500/20 flex items-center justify-center transition-all duration-300"
                        >
                          <IoClose className="text-red-400 text-xs" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* History - Compact */}
          {history.length > 0 && (
            <div className="flex items-center gap-2 px-4 border-l border-white/5 shrink-0 overflow-x-auto">
              <div className="flex items-center gap-1 text-gray-500 shrink-0 mr-2">
                <IoTime className="text-sm" />
                <span className="text-xs">{history.length}</span>
              </div>
              {history.slice(0, 5).map((track, index) => {
                const artworkUrl = getArtworkUrl(track);
                return (
                  <div
                    key={`history-${track.id}-${index}`}
                    className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 opacity-50 hover:opacity-100 cursor-pointer transition-opacity duration-300 relative bg-white/5"
                    onClick={() => handlePlayFromHistory(track)}
                    title={`${track.title} - ${track.artist}`}
                  >
                    {artworkUrl ? (
                      <img
                        src={artworkUrl}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={handleArtworkError()}
                      />
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        // ========== LEFT/RIGHT LAYOUT (VERTICAL) ==========
        <>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
                <IoList className="text-white text-xl" />
              </div>
              <h2 className="font-bold text-lg font-display">Очередь</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={shuffleQueue}
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110"
                style={{ background: 'var(--surface-elevated)', color: 'var(--text-secondary)' }}
                title="Перемешать"
              >
                <IoShuffle className="text-lg" />
              </button>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300"
                style={{ background: 'var(--surface-elevated)', color: 'var(--text-secondary)' }}
              >
                <IoClose className="text-lg" />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto h-full pb-6 scrollbar-visible">
        {/* Now Playing */}
        {currentTrack && (
          <div className="p-6 border-b border-white/5">
            <h3 className="text-xs font-semibold text-gray-500 mb-4 tracking-wider">
              СЕЙЧАС ИГРАЕТ
            </h3>
            <div className="glass-card p-4 rounded-2xl animate-pulse-slow">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 shadow-lg relative bg-white/5">
                  {currentArtworkUrl ? (
                    <>
                      <img
                        src={currentArtworkUrl}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={handleArtworkError()}
                      />
                      {/* Service badge */}
                      <div className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full bg-black/90 flex items-center justify-center">
                        <ServiceIcon platform={getTrackPlatform(currentTrack)} size={8} />
                      </div>
                    </>
                  ) : null}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-semibold truncate text-white">
                    {currentTrack.title}
                  </p>
                  <p className="text-sm text-gray-400 truncate">
                    {currentTrack.artist}
                  </p>
                </div>
                <span className="text-sm text-gray-500 font-mono">
                  {formatDuration(currentTrack.duration)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Upcoming */}
        <div className="p-6">
          <h3 className="text-xs font-semibold text-gray-500 mb-4 tracking-wider">
            ДАЛЕЕ ({upcoming.length})
          </h3>
          {upcoming.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-16 h-16 rounded-2xl glass-subtle mx-auto mb-4 flex items-center justify-center animate-float">
                <IoList className="text-gray-500 text-2xl" />
              </div>
              <p className="text-gray-500">Очередь пуста</p>
              <p className="text-gray-600 text-sm mt-1">
                Добавьте треки из поиска
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {upcoming.map((track, index) => {
                const artworkUrl = getArtworkUrl(track);
                return (
                  <li
                    key={`${track.id}-${index}`}
                    className="track-row group cursor-pointer animate-slide-up"
                    style={{ animationDelay: `${index * 30}ms` }}
                    onClick={() => handlePlayTrack(track, index)}
                  >
                    <IoReorderTwo className="text-gray-600 opacity-0 group-hover:opacity-100 cursor-grab transition-opacity duration-300" />
                    <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 shadow-md relative bg-white/5">
                      {artworkUrl ? (
                        <img
                          src={artworkUrl}
                          alt=""
                          className="w-full h-full object-cover"
                          onError={handleArtworkError()}
                        />
                      ) : null}
                      {/* Service badge */}
                      <div className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full bg-black/70 flex items-center justify-center">
                        <ServiceIcon platform={getTrackPlatform(track)} size={8} />
                      </div>
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300">
                        <IoPlay style={{ color: "var(--interactive-accent)" }} />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate text-white">
                        {track.title}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {track.artist}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => handleAddToPlaylist(track, index, e)}
                        className="w-8 h-8 rounded-lg opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300"
                        style={{ background: 'var(--surface-elevated)', color: 'var(--text-secondary)' }}
                        title="Добавить в плейлист"
                      >
                        <IoAdd />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromQueue(index);
                        }}
                        className="w-8 h-8 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/20 flex items-center justify-center transition-all duration-300"
                      >
                        <IoClose className="text-red-400" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="p-6 border-t border-white/5">
            <h3 className="text-xs font-semibold text-gray-500 mb-4 tracking-wider flex items-center gap-2">
              <IoTime />
              НЕДАВНО ({history.length})
            </h3>
            <ul className="space-y-2">
              {history.slice(0, 10).map((track, index) => {
                const artworkUrl = getArtworkUrl(track);
                return (
                  <li
                    key={`history-${track.id}-${index}`}
                    className="track-row opacity-50 hover:opacity-100 cursor-pointer transition-opacity duration-300 group"
                    onClick={() => handlePlayFromHistory(track)}
                  >
                    <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 relative bg-white/5">
                      {artworkUrl ? (
                        <>
                          <img
                            src={artworkUrl}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={handleArtworkError()}
                          />
                          {/* Service badge */}
                          <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-black/70 flex items-center justify-center">
                            <ServiceIcon platform={getTrackPlatform(track)} size={7} />
                          </div>
                        </>
                      ) : null}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate text-gray-300">
                        {track.title}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {track.artist}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        
                        const button = e.currentTarget as HTMLElement;
                        const rect = button.getBoundingClientRect();
                        
                        const menuWidth = 320;
                        const menuMaxHeight = 400;
                        const padding = 16;
                        const queuePanelWidth = 384;
                        
                        let left: number;
                        let top = rect.top;
                        
                        if (isLeft) {
                          left = queuePanelWidth + 16;
                        } else {
                          left = window.innerWidth - queuePanelWidth - menuWidth - 16;
                        }
                        
                        if (left < padding) {
                          left = padding;
                        }
                        if (left + menuWidth > window.innerWidth - padding) {
                          left = window.innerWidth - menuWidth - padding;
                        }
                        if (top + menuMaxHeight > window.innerHeight - padding) {
                          top = window.innerHeight - menuMaxHeight - padding;
                        }
                        if (top < padding) {
                          top = padding;
                        }
                        
                        setMenuPosition({ top, left });
                        setPlaylists(playlistService.getAllPlaylists());
                        setShowPlaylistMenu({ track, index: -1 });
                      }}
                      className="w-7 h-7 rounded-lg opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300"
                      style={{ background: 'var(--surface-elevated)', color: 'var(--text-secondary)' }}
                      title="Добавить в плейлист"
                    >
                      <IoAdd className="text-sm" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
      </>
      )}

      {/* Выпадающее меню плейлистов */}
      {showPlaylistMenu && menuPosition && (
        <>
          {/* Backdrop для закрытия меню */}
          <div 
            className="fixed inset-0 z-[60] animate-fade-in"
            onClick={() => {
              setShowPlaylistMenu(null);
              setMenuPosition(null);
            }}
          />
          
          {/* Меню */}
          <div
            className="fixed z-[70] w-80 rounded-2xl shadow-2xl backdrop-blur-2xl animate-scale-in overflow-hidden"
            style={{
              top: `${menuPosition.top}px`,
              left: `${menuPosition.left}px`,
              background: "var(--surface)e6",
              border: "1px solid var(--accent)25",
              boxShadow: "0 8px 32px -8px var(--accent)30, 0 0 0 1px var(--accent)10",
            }}
          >
            {/* Заголовок с информацией о треке */}
            <div 
              className="p-3 border-b backdrop-blur-sm"
              style={{ 
                borderColor: "var(--text-secondary)10",
                background: "var(--accent)08"
              }}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 shadow-md">
                  {getArtworkUrl(showPlaylistMenu.track) ? (
                    <img
                      src={getArtworkUrl(showPlaylistMenu.track) || undefined}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={handleArtworkError()}
                    />
                  ) : null}
                  {/* Transparent background when no artwork */}
                  {!getArtworkUrl(showPlaylistMenu.track) && (
                    <div className="absolute inset-0 bg-white/5" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate text-xs" style={{ color: "var(--text-primary)" }}>
                    {showPlaylistMenu.track.title}
                  </p>
                  <p
                    className="text-[10px] truncate opacity-60"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {showPlaylistMenu.track.artist}
                  </p>
                </div>
              </div>
            </div>

            {/* Список плейлистов */}
            <div className="max-h-64 overflow-y-auto scrollbar-thin">
              {playlists.length === 0 ? (
                <div className="text-center py-6 px-4">
                  <IoList
                    size={28}
                    className="mx-auto mb-1.5 opacity-30"
                    style={{ color: "var(--text-secondary)" }}
                  />
                  <p className="text-xs opacity-60" style={{ color: "var(--text-secondary)" }}>
                    Нет плейлистов
                  </p>
                </div>
              ) : (
                <div className="p-1.5">
                  {/* Offline option */}
                  <button
                    onClick={() => {
                      if (showPlaylistMenu) {
                        offlineTracksService.addOfflineTrack(showPlaylistMenu.track);
                        window.dispatchEvent(new CustomEvent("show-toast", {
                          detail: { message: "Добавлено в оффлайн", type: "success" }
                        }));
                        setShowPlaylistMenu(null);
                      }
                    }}
                    className="w-full flex items-center gap-2.5 p-2 rounded-lg transition-all text-left mb-1.5"
                    style={{
                      background: "transparent",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--accent)08";
                      e.currentTarget.style.transform = "translateX(2px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.transform = "translateX(0)";
                    }}
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm"
                      style={{
                        background: "var(--surface-elevated)",
                      }}
                    >
                      <IoMusicalNotes
                        size={14}
                        style={{ color: "var(--text-subtle)" }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>
                        Оффлайн
                      </p>
                      <p className="text-[10px] truncate" style={{ color: "var(--text-subtle)" }}>
                        Локальная коллекция
                      </p>
                    </div>
                  </button>
                  
                  {playlists.map((playlist) => {
                    const isInPlaylist = playlist.tracks?.some(
                      (t) => t.id === showPlaylistMenu.track.id
                    );
                    const coverUrl = playlist.coverUrl || playlist.tracks?.[0]?.artworkUrl;
                    
                    return (
                      <button
                        key={playlist.id}
                        onClick={() => !isInPlaylist && handleSelectPlaylist(playlist.id)}
                        disabled={isInPlaylist}
                        className="w-full flex items-center gap-2.5 p-2 rounded-lg transition-all text-left"
                        style={{
                          background: isInPlaylist
                            ? "var(--accent)12"
                            : "transparent",
                          cursor: isInPlaylist ? "default" : "pointer",
                          opacity: isInPlaylist ? 0.5 : 1,
                        }}
                        onMouseEnter={(e) => {
                          if (!isInPlaylist) {
                            e.currentTarget.style.background = "var(--accent)08";
                            e.currentTarget.style.transform = "translateX(2px)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isInPlaylist) {
                            e.currentTarget.style.background = "transparent";
                            e.currentTarget.style.transform = "translateX(0)";
                          }
                        }}
                      >
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm overflow-hidden"
                          style={{
                            background: coverUrl ? "transparent" : "linear-gradient(135deg, var(--accent), var(--secondary, var(--accent)))",
                          }}
                        >
                          {coverUrl ? (
                            <img
                              src={coverUrl}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <IoMusicalNotes
                              size={14}
                              className="text-white/70"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate text-xs" style={{ color: "var(--text-primary)" }}>
                            {playlist.name}
                          </p>
                          <p
                            className="text-[10px] opacity-60"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            {playlist.tracks?.length || 0} треков
                          </p>
                        </div>
                        {isInPlaylist && (
                          <IoCheckmark
                            size={16}
                            style={{ color: "var(--accent)" }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Кнопка создания нового плейлиста */}
            <div 
              className="p-2 border-t"
              style={{ borderColor: "var(--text-secondary)10" }}
            >
              <button 
                className="w-full text-center py-2 px-3 rounded-lg transition-all text-xs font-medium"
                style={{ 
                  background: "var(--accent)15",
                  color: "var(--accent)",
                }}
                onClick={() => {
                  const name = prompt('Название нового плейлиста:');
                  if (name && showPlaylistMenu) {
                    const newPlaylist = playlistService.createPlaylist(name);
                    playlistService.addTrackToPlaylist(newPlaylist.id, showPlaylistMenu.track);
                    setShowPlaylistMenu(null);
                    setMenuPosition(null);
                  }
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--accent)25";
                  e.currentTarget.style.transform = "scale(1.01)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "var(--accent)15";
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                + Создать плейлист
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
