import { useState, useEffect, useRef } from "react";
import {
  HiOutlineQueueList,
  HiOutlinePlay,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineMusicalNote,
  HiOutlinePencil,
  HiOutlineClock,
  HiOutlinePlayCircle,
  HiOutlineChevronRight,
  HiOutlinePhoto,
  HiOutlineChevronDown,
  HiOutlineArrowsRightLeft,
} from "react-icons/hi2";
import { FaSpotify, FaYoutube, FaSoundcloud } from "react-icons/fa";
import { SiVk } from "react-icons/si";
import { playlistService } from "../../services/PlaylistService";
import { audioService } from "../../services/AudioService";
import { soundCloudService } from "../../services/SoundCloudService";
import { youtubeService } from "../../services/YouTubeService";
import { useQueueStore } from "../../stores/queueStore";
import { usePlayerStore } from "../../stores/playerStore";
import { useThemeStore } from "../../stores/themeStore";
import type { Playlist, Track } from "../../types";

type SortOption = "recent" | "title" | "artist" | "duration";

export function PlaylistsView() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newPlaylistDesc, setNewPlaylistDesc] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToQueue, clearQueue } = useQueueStore();
  // Use selectors to prevent re-renders from progress updates
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const { currentTheme, currentThemeId, isLight } = useThemeStore();
  const colors = currentTheme.colors;
  
  // Scrollbar class based on theme
  const scrollbarClass = isLight() ? 'scrollbar-light' : 'scrollbar-visible';
  
  // Check theme for button styling
  const isDarkOutline = ['dark', 'dark-amoled'].includes(currentThemeId);
  const isLightOutline = ['light', 'light-stone', 'light-slate'].includes(currentThemeId);
  const isAmoled = currentThemeId === 'dark-amoled';

  // Check if URL is a valid image URL (starts with http(s) and has a domain)
  const isValidImageUrl = (url: string | undefined): boolean => {
    if (!url) return false;
    if (!url.startsWith('http://') && !url.startsWith('https://')) return false;
    try {
      const parsed = new URL(url);
      return Boolean(parsed.hostname && parsed.hostname.includes('.'));
    } catch {
      return false;
    }
  };

  const sortTracks = (tracks: Track[], sort: SortOption): Track[] => {
    const sorted = [...tracks];
    switch (sort) {
      case "title":
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      case "artist":
        return sorted.sort((a, b) => (a.artist || "").localeCompare(b.artist || ""));
      case "duration":
        return sorted.sort((a, b) => b.duration - a.duration);
      case "recent":
      default:
        return sorted;
    }
  };

  const getSortedTracks = (): Track[] => {
    if (!selectedPlaylist?.tracks) return [];
    return sortTracks(selectedPlaylist.tracks, sortBy);
  };

  const loadPlaylists = () => {
    const pls = playlistService.getAllPlaylists();
    setPlaylists(pls);
    if (selectedPlaylist) {
      const updated = pls.find((p) => p.id === selectedPlaylist.id);
      if (updated) setSelectedPlaylist(updated);
    }
    setLoading(false);
  };

  // Определяем цвет кнопки импорта по последнему импортированному плейлисту
  const getImportButtonColor = () => {
    const importedPlaylists = playlists.filter(p => p.source && p.source !== "local");
    if (importedPlaylists.length === 0) return `${colors.accent}80`;
    
    const lastImported = importedPlaylists[importedPlaylists.length - 1];
    const sourceColors: { [key: string]: string } = {
      soundcloud: "#ff5500",
      youtube: "#ff0000",
      spotify: "#1db954",
      vk: "#0077ff",
    };
    
    return sourceColors[lastImported.source || ""] || `${colors.accent}80`;
  };

  // Получаем доминирующий сервис (с наибольшим количеством треков)
  const getDominantPlatform = (playlist: Playlist): string | null => {
    if (!playlist.tracks || playlist.tracks.length === 0) return null;
    
    const platformCounts: { [key: string]: number } = {};
    playlist.tracks.forEach(track => {
      if (track.platform && track.platform !== "local") {
        platformCounts[track.platform] = (platformCounts[track.platform] || 0) + 1;
      }
    });
    
    let dominantPlatform: string | null = null;
    let maxCount = 0;
    
    for (const [platform, count] of Object.entries(platformCounts)) {
      if (count > maxCount) {
        maxCount = count;
        dominantPlatform = platform;
      }
    }
    
    return dominantPlatform;
  };

  const platformConfig: { [key: string]: { icon: typeof FaSoundcloud; color: string } } = {
    soundcloud: { icon: FaSoundcloud, color: "#ff5500" },
    youtube: { icon: FaYoutube, color: "#ff0000" },
    spotify: { icon: FaSpotify, color: "#1db954" },
    vk: { icon: SiVk, color: "#0077ff" },
  };

  useEffect(() => {
    loadPlaylists();
    const handleChange = () => loadPlaylists();
    window.addEventListener("playlists-changed", handleChange);
    return () => window.removeEventListener("playlists-changed", handleChange);
  }, []);

  const handleCreatePlaylist = () => {
    if (!newPlaylistName.trim()) return;
    const newPlaylist = playlistService.createPlaylist(newPlaylistName.trim(), newPlaylistDesc.trim() || undefined);
    setPlaylists((prev) => [...prev, newPlaylist]);
    setSelectedPlaylist(newPlaylist);
    setNewPlaylistName("");
    setNewPlaylistDesc("");
    setShowCreateModal(false);
  };

  const handleDeletePlaylist = (e: React.MouseEvent, playlistId: string) => {
    e.stopPropagation();
    playlistService.deletePlaylist(playlistId);
    setPlaylists((prev) => prev.filter((p) => p.id !== playlistId));
    if (selectedPlaylist?.id === playlistId) setSelectedPlaylist(null);
  };

  const handleImportPlaylist = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const playlist = await playlistService.importFromFile(file);
      if (playlist) {
        loadPlaylists();
        setSelectedPlaylist(playlist);
        
        window.dispatchEvent(
          new CustomEvent("show-toast", {
            detail: { 
              message: `Плейлист "${playlist.name}" успешно импортирован (${playlist.tracks?.length || 0} треков)`, 
              type: "success" 
            },
          })
        );
      } else {
        window.dispatchEvent(
          new CustomEvent("show-toast", {
            detail: { message: "Ошибка импорта: неверный формат файла", type: "error" },
          })
        );
      }
    } catch (error) {
      console.error("Import error:", error);
      window.dispatchEvent(
        new CustomEvent("show-toast", {
          detail: { message: "Ошибка при импорте плейлиста", type: "error" },
        })
      );
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handlePlayTrack = async (track: Track, index: number) => {
    if (!selectedPlaylist) return;
    
    let streamUrl = track.streamUrl;
    let trackToPlay = track;
    
    // Check if URL is valid (not empty, not broken, not expired/encoded)
    const isValidUrl = streamUrl && 
      streamUrl.startsWith('http') && 
      !streamUrl.includes('[link_removed]') &&
      !streamUrl.includes('&#') &&
      !streamUrl.includes('&amp;');
    
    if (!isValidUrl) {
      // Use fallback service for better reliability
      const { streamFallbackService } = await import("../../services/StreamFallbackService");
      const result = await streamFallbackService.getStreamUrl(track);
      
      if (result.streamUrl) {
        streamUrl = result.streamUrl;
        trackToPlay = result.fallbackTrack || track;
      }
    }
    
    if (streamUrl && streamUrl.startsWith('http')) {
      audioService.load({ ...trackToPlay, streamUrl });
      clearQueue();
      const tracks = getSortedTracks();
      for (let i = index + 1; i < tracks.length; i++) {
        addToQueue({ ...tracks[i], streamUrl: tracks[i].streamUrl || "" });
      }
    } else {
      window.dispatchEvent(
        new CustomEvent("show-toast", {
          detail: { message: "Не удалось загрузить трек", type: "error" },
        })
      );
    }
  };

  const handlePlayAll = async () => {
    const tracks = getSortedTracks();
    if (!tracks.length) return;
    await handlePlayTrack(tracks[0], 0);
  };

  const handleShufflePlay = async () => {
    const tracks = getSortedTracks();
    if (!tracks.length) return;
    const shuffled = [...tracks].sort(() => Math.random() - 0.5);
    const first = shuffled[0];
    let streamUrl = first.streamUrl;
    if (!streamUrl) {
      if (first.platform === 'youtube') {
        const videoId = first.id.replace('yt-', '');
        streamUrl = await youtubeService.getStreamUrl(videoId) || "";
      } else {
        streamUrl = (await soundCloudService.getStreamUrl(first.id.replace("sc-", ""))) || "";
      }
    }
    if (streamUrl) {
      audioService.load({ ...first, streamUrl });
      clearQueue();
      for (let i = 1; i < shuffled.length; i++) {
        addToQueue({ ...shuffled[i], streamUrl: shuffled[i].streamUrl || "" });
      }
    }
  };

  const handleRemoveTrack = (e: React.MouseEvent, trackId: string) => {
    e.stopPropagation();
    if (!selectedPlaylist) return;
    playlistService.removeTrackFromPlaylist(selectedPlaylist.id, trackId);
    loadPlaylists();
  };

  const handleChangeCover = () => {
    fileInputRef.current?.click();
  };

  const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedPlaylist) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        playlistService.updatePlaylistCover(selectedPlaylist.id, dataUrl);
        loadPlaylists();
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const formatDuration = (s: number) => `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;

  const getPlaylistGradient = (index: number) => {
    const gradients = [
      [colors.accent, colors.secondary],
      [colors.secondary, colors.error],
      [colors.success, colors.accent],
      [colors.error, colors.accent],
      [colors.accent, colors.success],
      [colors.secondary, colors.success],
    ];
    const [from, to] = gradients[index % gradients.length];
    return `linear-gradient(135deg, ${from}, ${to})`;
  };

  const totalDuration = selectedPlaylist?.tracks?.reduce((acc, t) => acc + (t.duration || 0), 0) || 0;
  const hours = Math.floor(totalDuration / 3600);
  const minutes = Math.floor((totalDuration % 3600) / 60);

  return (
    <div className="h-full flex overflow-hidden">
      {/* Left Sidebar */}
      <div className="w-72 border-r flex flex-col h-full overflow-hidden" style={{ borderColor: `${colors.accent}10`, background: `${colors.surface}30` }}>
        <div className="p-4 border-b" style={{ borderColor: `${colors.accent}10` }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Плейлисты</h2>
            <div className="flex gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:opacity-80"
                style={{ background: getImportButtonColor() }}
                title="Импортировать плейлист из JSON"
              >
                <HiOutlineArrowsRightLeft size={18} className="text-white" />
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:opacity-80"
                style={{ background: colors.accent }}
                title="Создать новый плейлист"
              >
                <HiOutlinePlus size={18} className="text-white" />
              </button>
            </div>
          </div>
          
          {/* Скрытый input для импорта */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportPlaylist}
            style={{ display: "none" }}
          />

          {/* Список плейлистов */}
          <p className="text-xs" style={{ color: colors.textSecondary }}>
            {playlists.length} плейлистов
          </p>
        </div>

        <div className={`flex-1 overflow-y-auto p-2 pr-1 space-y-1 ${scrollbarClass}`}>
          {loading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="p-3 animate-pulse-slow">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg" style={{ background: `${colors.surface}50` }} />
                  <div className="flex-1">
                    <div className="h-4 rounded w-3/4 mb-2" style={{ background: `${colors.surface}50` }} />
                    <div className="h-3 rounded w-1/2" style={{ background: `${colors.surface}50` }} />
                  </div>
                </div>
              </div>
            ))
          ) : playlists.length === 0 ? (
            <div className="text-center py-8 px-4">
              <HiOutlinePencil className="text-4xl mx-auto mb-3" style={{ color: colors.textSecondary }} />
              <p className="text-sm" style={{ color: colors.textSecondary }}>
                Нет плейлистов
              </p>
              <button onClick={() => setShowCreateModal(true)} className="mt-3 text-sm hover:underline" style={{ color: colors.accent }}>
                Создать
              </button>
            </div>
          ) : (
            playlists.map((playlist, index) => (
              <div
                key={playlist.id}
                onClick={() => setSelectedPlaylist(playlist)}
                className="p-3 rounded-xl cursor-pointer transition-all group"
                style={{
                  background: selectedPlaylist?.id === playlist.id ? `${colors.accent}20` : "transparent",
                  border: selectedPlaylist?.id === playlist.id ? `1px solid ${colors.accent}30` : "1px solid transparent",
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden relative" style={{ background: getPlaylistGradient(index) }}>
                    {(() => {
                      const coverUrl = playlist.coverUrl || playlist.tracks?.[0]?.artworkUrl;
                      return isValidImageUrl(coverUrl) ? (
                        <img 
                          src={coverUrl} 
                          alt="" 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : null;
                    })()}
                    <HiOutlineMusicalNote className="text-white/70 absolute" style={{ display: isValidImageUrl(playlist.coverUrl || playlist.tracks?.[0]?.artworkUrl) ? 'none' : 'block' }} />
                    {/* Service badge - dominant platform */}
                    {(() => {
                      const dominantPlatform = getDominantPlatform(playlist);
                      if (!dominantPlatform) return null;
                      const config = platformConfig[dominantPlatform];
                      if (!config) return null;
                      const Icon = config.icon;
                      return (
                        <div
                          className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded flex items-center justify-center shadow-md"
                          style={{ background: config.color }}
                        >
                          <Icon className="text-white" size={9} />
                        </div>
                      );
                    })()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-sm">{playlist.name}</p>
                    <p className="text-xs" style={{ color: colors.textSecondary }}>
                      {playlist.tracks?.length || 0} треков
                    </p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleDeletePlaylist(e, playlist.id)}
                      className="p-1.5 rounded-lg transition-colors"
                      style={{ color: colors.textSecondary }}
                    >
                      <HiOutlineTrash size={14} />
                    </button>
                    <HiOutlineChevronRight size={14} style={{ color: colors.textSecondary }} />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Content */}
      <div className={`flex-1 overflow-y-auto h-full ${scrollbarClass}`}>
        {selectedPlaylist ? (
          <>
            {/* Header */}
            <div className="relative h-56 overflow-hidden">
              <div className="absolute inset-0 opacity-30" style={{ background: getPlaylistGradient(playlists.indexOf(selectedPlaylist)) }} />
              <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${colors.background}, transparent)` }} />

              <div className="absolute bottom-0 left-0 right-0 p-8">
                <div className="flex items-end gap-6">
                  <div
                    className="w-36 h-36 rounded-2xl flex items-center justify-center shadow-2xl flex-shrink-0 relative group cursor-pointer overflow-hidden"
                    style={{ background: getPlaylistGradient(playlists.indexOf(selectedPlaylist)) }}
                    onClick={handleChangeCover}
                  >
                    {(() => {
                      const coverUrl = selectedPlaylist.coverUrl || selectedPlaylist.tracks?.[0]?.artworkUrl;
                      return isValidImageUrl(coverUrl) ? (
                        <img 
                          src={coverUrl} 
                          alt="" 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : null;
                    })()}
                    <HiOutlineMusicalNote className="text-white/50 text-4xl absolute" style={{ display: isValidImageUrl(selectedPlaylist.coverUrl || selectedPlaylist.tracks?.[0]?.artworkUrl) ? 'none' : 'block' }} />
                    {/* Service badge - dominant platform */}
                    {(() => {
                      const dominantPlatform = getDominantPlatform(selectedPlaylist);
                      if (!dominantPlatform) return null;
                      const config = platformConfig[dominantPlatform];
                      if (!config) return null;
                      const Icon = config.icon;
                      return (
                        <div
                          className="absolute bottom-2 right-2 w-7 h-7 rounded-md flex items-center justify-center shadow-lg z-10"
                          style={{ background: config.color }}
                        >
                          <Icon className="text-white" size={14} />
                        </div>
                      );
                    })()}
                    {/* Hover overlay for changing cover */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity">
                      <HiOutlinePhoto className="text-white text-2xl mb-1" />
                      <span className="text-white text-xs">Изменить</span>
                    </div>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleCoverFileChange}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium mb-2 uppercase tracking-wider" style={{ color: colors.accent }}>
                      Плейлист
                    </p>
                    <h1 className="text-3xl font-bold mb-3">{selectedPlaylist.name}</h1>
                    {selectedPlaylist.description && (
                      <p className="text-sm mb-3" style={{ color: colors.textSecondary }}>
                        {selectedPlaylist.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm" style={{ color: colors.textSecondary }}>
                      <span>{selectedPlaylist.tracks?.length || 0} треков</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <HiOutlineClock />
                        {hours > 0 ? `${hours}ч ${minutes}м` : `${minutes} мин`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="px-8 py-4 flex items-center gap-4">
              <button
                onClick={handlePlayAll}
                disabled={!selectedPlaylist.tracks?.length}
                className="w-14 h-14 rounded-full flex items-center justify-center hover:scale-105 transition-all shadow-lg disabled:opacity-50"
                style={{ 
                  background: isAmoled ? 'white' : colors.accent,
                }}
              >
                <HiOutlinePlay className="text-2xl ml-1" style={{ color: isAmoled ? 'black' : 'white' }} />
              </button>
              <button
                onClick={handleShufflePlay}
                disabled={!selectedPlaylist.tracks?.length}
                className="w-12 h-12 rounded-full flex items-center justify-center transition-all disabled:opacity-50"
                style={{ background: `${colors.accent}30`, color: colors.textPrimary }}
              >
                <HiOutlineArrowsRightLeft className="text-xl" />
              </button>
              
              {/* Sort dropdown */}
              <div className="relative ml-auto">
                <button
                  onClick={() => setSortMenuOpen(!sortMenuOpen)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:scale-105"
                  style={{ background: `${colors.textSecondary}15`, color: colors.textSecondary }}
                >
                  <span className="text-sm">
                    {sortBy === "recent" && "Недавние"}
                    {sortBy === "title" && "По названию"}
                    {sortBy === "artist" && "По артисту"}
                    {sortBy === "duration" && "По длительности"}
                  </span>
                  <HiOutlineChevronDown className={`transition-transform ${sortMenuOpen ? "rotate-180" : ""}`} />
                </button>
                
                {sortMenuOpen && (
                  <div
                    className="absolute right-0 top-full mt-2 py-2 rounded-xl shadow-xl z-50 min-w-[160px]"
                    style={{ background: colors.surface, border: `1px solid ${colors.textSecondary}20` }}
                  >
                    {[
                      { id: "recent" as SortOption, label: "Недавние" },
                      { id: "title" as SortOption, label: "По названию" },
                      { id: "artist" as SortOption, label: "По артисту" },
                      { id: "duration" as SortOption, label: "По длительности" },
                    ].map((option) => (
                      <button
                        key={option.id}
                        onClick={() => {
                          setSortBy(option.id);
                          setSortMenuOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm transition-colors hover:bg-white/5"
                        style={{ color: sortBy === option.id ? colors.accent : colors.textPrimary }}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Tracks */}
            <div className="px-8 pb-8">
              {!selectedPlaylist.tracks?.length ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: `${colors.surface}50` }}>
                    <HiOutlineMusicalNote className="text-3xl" style={{ color: colors.textSecondary }} />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Нет треков</h3>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>
                    Добавьте треки из поиска
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <div
                    className="grid grid-cols-[40px_1fr_100px] gap-4 px-4 py-2 text-xs uppercase tracking-wider border-b"
                    style={{ color: colors.textSecondary, borderColor: `${colors.accent}10` }}
                  >
                    <span>#</span>
                    <span>Название</span>
                    <span className="text-right">
                      <HiOutlineClock className="inline" />
                    </span>
                  </div>

                  {getSortedTracks().map((track, i) => {
                    const isCurrentTrack = currentTrack?.id === track.id;
                    return (
                      <div
                        key={track.id}
                        className="grid grid-cols-[40px_1fr_100px] gap-4 items-center px-4 py-2 rounded-lg group cursor-pointer transition-all"
                        style={{ background: isCurrentTrack ? `${colors.accent}10` : "transparent" }}
                        onMouseEnter={(e) => !isCurrentTrack && (e.currentTarget.style.background = `${colors.surface}50`)}
                        onMouseLeave={(e) => !isCurrentTrack && (e.currentTarget.style.background = "transparent")}
                        onClick={() => handlePlayTrack(track, i)}
                      >
                        <div className="relative">
                          {isCurrentTrack && isPlaying ? (
                            <div className="flex items-center justify-center gap-0.5">
                              {[...Array(3)].map((_, j) => (
                                <div
                                  key={j}
                                  className="w-1 rounded-full animate-equalizer"
                                  style={{ background: colors.accent, animationDelay: `${j * 100}ms` }}
                                />
                              ))}
                            </div>
                          ) : (
                            <>
                              <span className="text-sm font-mono group-hover:hidden" style={{ color: colors.textSecondary }}>
                                {i + 1}
                              </span>
                              <HiOutlinePlayCircle className="text-xl hidden group-hover:block" style={{ color: colors.accent }} />
                            </>
                          )}
                        </div>

                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 relative" style={{ background: `linear-gradient(135deg, ${colors.accent}, ${colors.secondary})` }}>
                            {isValidImageUrl(track.artworkUrl) ? (
                              <img 
                                src={track.artworkUrl} 
                                alt="" 
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            ) : null}
                            <div
                              className="w-full h-full flex items-center justify-center absolute inset-0"
                              style={{ display: isValidImageUrl(track.artworkUrl) ? 'none' : 'flex' }}
                            >
                              <HiOutlineMusicalNote className="text-white/70 text-sm" />
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p
                              className="font-medium truncate text-sm transition-colors"
                              style={{ color: isCurrentTrack ? colors.accent : colors.textPrimary }}
                            >
                              {track.title}
                            </p>
                            <p className="text-xs truncate" style={{ color: colors.textSecondary }}>
                              {track.artist}
                            </p>
                          </div>
                          <button
                            onClick={(e) => handleRemoveTrack(e, track.id)}
                            className="opacity-0 group-hover:opacity-100 p-2 transition-all"
                            style={{ color: colors.textSecondary }}
                          >
                            <HiOutlineTrash size={14} />
                          </button>
                        </div>

                        <div className="text-right text-sm font-mono" style={{ color: colors.textSecondary }}>
                          {formatDuration(track.duration)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div
                className="w-24 h-24 rounded-3xl mx-auto mb-6 flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${colors.accent}20, ${colors.secondary}20)` }}
              >
                <HiOutlineQueueList className="text-4xl" style={{ color: colors.accent }} />
              </div>
              <h3 className="text-2xl font-bold mb-2">Выберите плейлист</h3>
              <p className="mb-6" style={{ color: colors.textSecondary }}>
                Выберите плейлист слева для просмотра треков
              </p>
              {playlists.length === 0 && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-6 py-3 rounded-xl font-medium text-white transition-colors hover:opacity-90"
                  style={{ background: colors.accent }}
                >
                  Создать первый плейлист
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
          <div
            className="rounded-3xl p-8 w-full max-w-md shadow-2xl animate-scale-in"
            style={{ background: colors.surface, border: `1px solid ${colors.accent}20` }}
          >
            <div className="flex items-center gap-4 mb-6">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${colors.accent}, ${colors.secondary})` }}
              >
                <HiOutlineQueueList className="text-white text-2xl" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Новый плейлист</h2>
                <p className="text-sm" style={{ color: colors.textSecondary }}>
                  Создайте новый плейлист
                </p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                  Название
                </label>
                <input
                  type="text"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="Мой плейлист"
                  className="w-full px-4 py-3 rounded-xl transition-colors focus:outline-none"
                  style={{
                    background: colors.background,
                    border: `1px solid ${colors.accent}20`,
                    color: colors.textPrimary,
                  }}
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleCreatePlaylist()}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                  Описание (необязательно)
                </label>
                <input
                  type="text"
                  value={newPlaylistDesc}
                  onChange={(e) => setNewPlaylistDesc(e.target.value)}
                  placeholder="Добавьте описание..."
                  className="w-full px-4 py-3 rounded-xl transition-colors focus:outline-none"
                  style={{
                    background: colors.background,
                    border: `1px solid ${colors.accent}20`,
                    color: colors.textPrimary,
                  }}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-3 rounded-xl font-medium transition-colors"
                style={{ background: `${colors.accent}10`, color: colors.textPrimary }}
              >
                Отмена
              </button>
              <button
                onClick={handleCreatePlaylist}
                disabled={!newPlaylistName.trim()}
                className="flex-1 px-4 py-3 rounded-xl font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed transition-opacity hover:opacity-90"
                style={{ background: `linear-gradient(135deg, ${colors.accent}, ${colors.secondary})` }}
              >
                Создать
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
