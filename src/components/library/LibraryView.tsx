import { useState, useEffect, useMemo, useRef, useCallback, memo } from "react";
import {
  HiOutlineHeart,
  HiOutlineMusicalNote,
  HiOutlinePlay,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineArrowDownTray,
  HiOutlineQueueList,
  HiOutlineMagnifyingGlass,
  HiOutlinePause,
  HiOutlinePencil,
  HiOutlineCheck,
  HiOutlineXMark,
  HiOutlineChevronDown,
  HiOutlinePhoto,
  HiOutlineEllipsisVertical,
  HiOutlineDocumentDuplicate,
  HiOutlineArrowUpTray,
  HiOutlineSignalSlash,
} from "react-icons/hi2";
import { FaSoundcloud, FaSpotify, FaYoutube } from "react-icons/fa";
import { SiVk } from "react-icons/si";
import { IoShuffle } from "react-icons/io5";
import { playlistService } from "../../services/PlaylistService";
import { likedTracksService } from "../../services/LikedTracksService";
import { offlineTracksService } from "../../services/OfflineTracksService";
import { audioService } from "../../services/AudioService";
import { soundCloudService } from "../../services/SoundCloudService";
import { artworkService } from "../../services/ArtworkService";
import { useQueueStore } from "../../stores/queueStore";
import { usePlayerStore } from "../../stores/playerStore";
import { useUserStore } from "../../stores/userStore";
import type { Playlist, Track } from "../../types";

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

type SortOption = "recent" | "title" | "artist" | "duration";

interface SelectedItem {
  type: "liked" | "playlist" | "offline";
  id?: string;
  playlist?: Playlist;
}

// Check if URL is a valid image URL (starts with http(s) and has a domain)
const isValidImageUrl = (url: string | undefined): boolean => {
  if (!url) return false;
  if (!url.startsWith('http://') && !url.startsWith('https://')) return false;
  try {
    const parsed = new URL(url);
    return !!parsed.hostname && parsed.hostname.includes('.');
  } catch {
    return false;
  }
};

// Get dominant platform (the one with most tracks)
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

// Memoized track item component for better performance
const TrackItem = memo(({ 
  track, 
  idx, 
  isCurrent, 
  isPlaying, 
  onPlay, 
  onRemove,
  getTrackArtwork,
  getTrackPlatform,
  formatDuration
}: {
  track: Track;
  idx: number;
  isCurrent: boolean;
  isPlaying: boolean;
  onPlay: () => void;
  onRemove: () => void;
  getTrackArtwork: (t: Track) => string | undefined;
  getTrackPlatform: (t: Track) => string;
  formatDuration: (s: number) => string;
}) => {
  const artwork = useMemo(() => getTrackArtwork(track), [track, getTrackArtwork]);
  const platform = useMemo(() => getTrackPlatform(track), [track, getTrackPlatform]);
  
  return (
    <div onClick={onPlay}
      className="flex items-center gap-3 p-2 rounded-xl cursor-pointer group transition-all"
      style={{ 
        background: isCurrent ? "color-mix(in srgb, var(--interactive-accent) 15%, transparent)" : "transparent",
        willChange: 'background-color',
      }}>
      <span className="w-5 text-center text-xs" style={{ color: "var(--text-subtle)" }}>
        {isCurrent && isPlaying ? (
          <div className="flex items-center justify-center gap-0.5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-0.5 h-2 rounded-full animate-pulse" style={{ background: "var(--interactive-accent)", animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
        ) : idx + 1}
      </span>
      <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 relative group/cover" style={{ background: "transparent" }}>
        {artwork ? (
          <img 
            src={artwork} 
            alt="" 
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : null}
        <div className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full bg-black/70 flex items-center justify-center">
          <ServiceIcon platform={platform} size={8} />
        </div>
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/cover:opacity-100 flex items-center justify-center transition-opacity">
          {isCurrent && isPlaying ? <HiOutlinePause size={16} style={{ color: "var(--interactive-accent-text)" }} /> : <HiOutlinePlay size={16} style={{ color: "var(--interactive-accent-text)" }} />}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate" style={{ color: isCurrent ? "var(--interactive-accent)" : "var(--text-primary)" }}>{track.title}</p>
        <p className="text-xs truncate" style={{ color: "var(--text-subtle)" }}>{track.artist}</p>
      </div>
      <span className="text-xs tabular-nums" style={{ color: "var(--text-subtle)" }}>{formatDuration(track.duration || 0)}</span>
      <button onClick={(e) => { e.stopPropagation(); onRemove(); }}
        className="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/20 transition-all" style={{ color: "var(--text-subtle)" }}>
        <HiOutlineTrash size={12} />
      </button>
    </div>
  );
});

TrackItem.displayName = 'TrackItem';

// Memoized playlist item component for better performance
const PlaylistItem = memo(({ 
  playlist, 
  isSelected, 
  onSelect, 
  onDelete, 
  onCoverClick,
  getPlaylistCover,
  getDominantPlatform,
  editingPlaylist,
  editName,
  setEditName,
  handleRenamePlaylist,
  setEditingPlaylist
}: {
  playlist: Playlist;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onCoverClick: () => void;
  getPlaylistCover: (p: Playlist) => string | undefined;
  getDominantPlatform: (p: Playlist) => string | null;
  editingPlaylist: string | null;
  editName: string;
  setEditName: (v: string) => void;
  handleRenamePlaylist: (id: string) => void;
  setEditingPlaylist: (id: string | null) => void;
}) => {
  const coverUrl = useMemo(() => getPlaylistCover(playlist), [playlist, getPlaylistCover]);
  const dominantPlatform = useMemo(() => getDominantPlatform(playlist), [playlist, getDominantPlatform]);
  
  return (
    <div
      onClick={onSelect}
      className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer group transition-all hover:scale-[1.02]"
      style={{
        background: isSelected ? "var(--surface-elevated)" : "transparent",
        border: isSelected ? "1px solid var(--border-base)" : "1px solid transparent",
        transformOrigin: "center",
      }}
    >
      <div 
        onClick={(e) => { e.stopPropagation(); onCoverClick(); }}
        className="w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 relative group/cover cursor-pointer" 
        style={{ background: "var(--surface-elevated)" }}
      >
        {coverUrl ? (
          <img 
            src={coverUrl} 
            alt="" 
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : null}
        <div className={`w-full h-full flex items-center justify-center absolute inset-0 ${coverUrl ? 'hidden' : ''}`}>
          <HiOutlineMusicalNote size={18} style={{ color: "var(--text-subtle)" }} />
        </div>
        {dominantPlatform && (
          <div className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full bg-black/70 flex items-center justify-center">
            <ServiceIcon platform={dominantPlatform} size={8} />
          </div>
        )}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/cover:opacity-100 flex items-center justify-center transition-opacity">
          <HiOutlinePhoto size={14} className="text-white" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        {editingPlaylist === playlist.id ? (
          <div className="flex items-center gap-1">
            <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRenamePlaylist(playlist.id)}
              className="flex-1 px-2 py-1 rounded text-sm bg-transparent border focus:outline-none"
              style={{ borderColor: "var(--interactive-accent)", color: "var(--text-primary)" }}
              autoFocus onClick={(e) => e.stopPropagation()} />
            <button onClick={(e) => { e.stopPropagation(); handleRenamePlaylist(playlist.id); }} className="p-1" style={{ color: "var(--interactive-accent)" }}><HiOutlineCheck size={14} /></button>
            <button onClick={(e) => { e.stopPropagation(); setEditingPlaylist(null); }} className="p-1" style={{ color: "var(--text-subtle)" }}><HiOutlineXMark size={14} /></button>
          </div>
        ) : (
          <>
            <p className="font-medium text-sm truncate" style={{ color: "var(--text-primary)" }}>{playlist.name}</p>
            <p className="text-xs" style={{ color: "var(--text-subtle)" }}>{playlist.tracks?.length || 0} треков</p>
          </>
        )}
      </div>
      <div className="opacity-0 group-hover:opacity-100 flex gap-0.5 transition-opacity">
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400"><HiOutlineTrash size={12} /></button>
      </div>
    </div>
  );
});

PlaylistItem.displayName = 'PlaylistItem';

export function LibraryView() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [likedTracks, setLikedTracks] = useState<Track[]>([]);
  const [offlineTracks, setOfflineTracks] = useState<Track[]>([]);
  const [selected, setSelected] = useState<SelectedItem | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddOfflineModal, setShowAddOfflineModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [importUrl, setImportUrl] = useState("");
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState("");
  const [importTarget, setImportTarget] = useState<"liked" | "playlist">("liked");
  
  // Cached artworks for tracks with missing covers
  const [cachedArtworks, setCachedArtworks] = useState<Record<string, string>>({});
  // Artwork fetching disabled
  // const [isFetchingArtworks, setIsFetchingArtworks] = useState(false);
  // const [loadingArtworks, setLoadingArtworks] = useState<Set<string>>(new Set());

  // Auto-detect service from URL
  const detectedService = useMemo(() => {
    const url = importUrl.toLowerCase();
    if (url.includes("soundcloud.com")) return { name: "SoundCloud", color: "#ff5500", icon: FaSoundcloud };
    if (url.includes("spotify.com")) return { name: "Spotify", color: "#1db954", icon: FaSpotify };
    if (url.includes("youtube.com") || url.includes("youtu.be")) return { name: "YouTube", color: "#ff0000", icon: FaYoutube };
    if (url.includes("vk.com")) return { name: "VK", color: "#0077ff", icon: SiVk };
    return null;
  }, [importUrl]);

  // Detect if URL is a playlist
  const isPlaylistUrl = useMemo(() => {
    const url = importUrl.toLowerCase();
    return url.includes("/sets/") || url.includes("/playlist") || url.includes("list=");
  }, [importUrl]);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [isRenamingSelected, setIsRenamingSelected] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [coverInputPlaylist, setCoverInputPlaylist] = useState<string | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const [jsonImportError, setJsonImportError] = useState("");

  const { addToQueue, clearQueue } = useQueueStore();
  // Use selectors to prevent re-renders from progress updates
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const { incrementStat } = useUserStore();

  const loadData = () => {
    setPlaylists(playlistService.getAllPlaylists());
    setLikedTracks(likedTracksService.getLikedTracks());
    setOfflineTracks(offlineTracksService.getOfflineTracks());
  };

  useEffect(() => {
    loadData();
    const handleChange = () => loadData();
    window.addEventListener("playlists-changed", handleChange);
    window.addEventListener("liked-tracks-changed", handleChange);
    window.addEventListener("offline-tracks-changed", handleChange);
    return () => {
      window.removeEventListener("playlists-changed", handleChange);
      window.removeEventListener("liked-tracks-changed", handleChange);
      window.removeEventListener("offline-tracks-changed", handleChange);
    };
  }, []);

  useEffect(() => {
    if (!selected && likedTracks.length > 0) {
      setSelected({ type: "liked" });
    }
  }, [likedTracks, selected]);

  // Fetch artworks for tracks with missing covers when playlist is selected - DISABLED
  useEffect(() => {
    const tracks = selected?.type === "liked" ? likedTracks : selected?.playlist?.tracks || [];
    if (tracks.length === 0) return;

    // Load cached artworks only - no automatic fetching
    const cached: Record<string, string> = {};
    for (const track of tracks) {
      const cachedUrl = artworkService.getCachedArtwork(track);
      if (cachedUrl) {
        cached[track.id] = cachedUrl;
      }
    }
    if (Object.keys(cached).length > 0) {
      setCachedArtworks(prev => ({ ...prev, ...cached }));
    }

    // Automatic artwork fetching disabled to reduce API calls
    // const needsArtwork = tracks.filter(
    //   t => !isValidImageUrl(t.artworkUrl) && !cached[t.id]
    // );

    // if (needsArtwork.length === 0) return;

    // setIsFetchingArtworks(true);
    // console.log(`[LibraryView] Fetching artworks for ${needsArtwork.length} tracks...`);

    // // Track found artworks to save to playlist
    // const foundArtworks: Record<string, string> = {};

    // const cancel = artworkService.fetchArtworksInBackground(
    //   needsArtwork,
    //   (trackId, artworkUrl) => {
    //     setCachedArtworks(prev => ({ ...prev, [trackId]: artworkUrl }));
    //     foundArtworks[trackId] = artworkUrl;
    //     // Remove from loading set
    //     setLoadingArtworks(prev => {
    //       const next = new Set(prev);
    //       next.delete(trackId);
    //       return next;
    //     });
    //   },
    //   () => {
    //     setIsFetchingArtworks(false);
    //     console.log("[LibraryView] Finished fetching artworks");
        
    //     // Save found artworks to playlist (for persistence)
    //     if (selected?.type === "playlist" && selected.playlist?.id && Object.keys(foundArtworks).length > 0) {
    //       playlistService.updateTrackArtworks(selected.playlist.id, foundArtworks);
    //       loadData(); // Refresh to get updated playlists
    //     }
    //   }
    // );

    // // Mark tracks as loading
    // setLoadingArtworks(new Set(needsArtwork.map(t => t.id)));

    // return () => {
    //   cancel();
    //   setIsFetchingArtworks(false);
    // };
  }, [selected, likedTracks]);

  // Helper to get artwork for a track (original or cached)
  const getTrackArtwork = useCallback((track: Track): string | undefined => {
    if (isValidImageUrl(track.artworkUrl)) {
      return track.artworkUrl;
    }
    return cachedArtworks[track.id];
  }, [cachedArtworks]);

  // Helper to get best cover for a playlist (from tracks or cached artworks)
  const getPlaylistCover = useCallback((playlist: Playlist): string | undefined => {
    // First try playlist's own cover
    if (playlist.coverUrl && isValidImageUrl(playlist.coverUrl)) {
      return playlist.coverUrl;
    }
    // Then try tracks
    for (const track of (playlist.tracks || []).slice(0, 5)) {
      if (isValidImageUrl(track.artworkUrl)) {
        return track.artworkUrl;
      }
      if (cachedArtworks[track.id]) {
        return cachedArtworks[track.id];
      }
    }
    return undefined;
  }, [cachedArtworks]);

  const handlePlayTrack = async (track: Track, allTracks: Track[], idx: number) => {
    let url = track.streamUrl;
    
    // Check if URL is valid (not empty, has domain, not broken)
    const isValidUrl = (testUrl: string | undefined): boolean => {
      if (!testUrl) return false;
      try {
        const parsed = new URL(testUrl);
        const hasProtocol = parsed.protocol === 'http:' || parsed.protocol === 'https:';
        const hasDomain = !!parsed.hostname && parsed.hostname.includes('.');
        const notBroken = !testUrl.includes('[link_removed]') && !testUrl.includes('&#') && !testUrl.includes('&amp;');
        return Boolean(hasProtocol && hasDomain && notBroken);
      } catch {
        return false;
      }
    };
    
    // Helper to get best artwork (cached or original)
    const getBestArtwork = (t: Track): string => {
      const cached = getTrackArtwork(t);
      return cached || t.artworkUrl || "";
    };
    
    if (!isValidUrl(url)) {
      // Try to get fresh stream URL using fallback service
      try {
        const { streamFallbackService } = await import("../../services/StreamFallbackService");
        const result = await streamFallbackService.getStreamUrl(track);
        
        if (result.streamUrl) {
          url = result.streamUrl;
          // Use fallback track data for artwork if original is missing/broken
          const trackToPlay: Track = {
            ...track,
            streamUrl: url,
            artworkUrl: getBestArtwork(track) || (result.fallbackTrack?.artworkUrl || track.artworkUrl),
          };
          audioService.load(trackToPlay);
          clearQueue();
          for (let i = idx + 1; i < allTracks.length; i++) {
            addToQueue({ 
              ...allTracks[i], 
              streamUrl: allTracks[i].streamUrl || "",
              artworkUrl: getBestArtwork(allTracks[i]) || allTracks[i].artworkUrl || ""
            });
          }
          return;
        }
      } catch (error) {
        console.error("[LibraryView] Failed to get stream URL:", error);
      }
    }
    
    if (isValidUrl(url)) {
      audioService.load({ 
        ...track, 
        streamUrl: url!,
        artworkUrl: getBestArtwork(track) || track.artworkUrl || ""
      });
      clearQueue();
      for (let i = idx + 1; i < allTracks.length; i++) {
        addToQueue({ 
          ...allTracks[i], 
          streamUrl: allTracks[i].streamUrl || "",
          artworkUrl: getBestArtwork(allTracks[i]) || allTracks[i].artworkUrl || ""
        });
      }
    } else {
      console.error("[LibraryView] Invalid stream URL for track:", track.title);
    }
  };

  const handlePlayAll = () => {
    if (tracks.length > 0) handlePlayTrack(tracks[0], tracks, 0);
  };

  const handleShuffle = () => {
    if (tracks.length > 0) {
      const shuffled = [...tracks].sort(() => Math.random() - 0.5);
      handlePlayTrack(shuffled[0], shuffled, 0);
    }
  };

  const rawTracks = selected?.type === "liked" 
    ? likedTracks 
    : selected?.type === "offline" 
    ? offlineTracks 
    : selected?.playlist?.tracks || [];
  
  const tracks = useMemo(() => {
    let filtered = rawTracks;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(t => t.title?.toLowerCase().includes(q) || t.artist?.toLowerCase().includes(q));
    }
    if (sortBy !== "recent") {
      filtered = [...filtered].sort((a, b) => {
        if (sortBy === "title") return (a.title || "").localeCompare(b.title || "");
        if (sortBy === "artist") return (a.artist || "").localeCompare(b.artist || "");
        if (sortBy === "duration") return (a.duration || 0) - (b.duration || 0);
        return 0;
      });
    }
    return filtered;
  }, [rawTracks, searchQuery, sortBy]);

  const totalDuration = tracks.reduce((acc, t) => acc + (t.duration || 0), 0);
  const hours = Math.floor(totalDuration / 3600);
  const minutes = Math.floor((totalDuration % 3600) / 60);
  const formatDuration = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const handleExportPlaylist = () => {
    if (!selected || tracks.length === 0) return;
    
    const playlistData = {
      id: selected.type === "liked" ? "liked_tracks" : selected.playlist?.id || "playlist",
      name: selected.type === "liked" ? "Любимые треки" : selected.playlist?.name || "Плейлист",
      songs: tracks.map(track => ({
        id: track.id,
        title: track.title,
        artist: track.artist,
        duration: track.duration || 0,
        durationString: formatDuration(track.duration || 0),
        coverArt: track.artworkUrl || "",
        url: track.streamUrl || "",
        source: track.platform || "soundcloud",
        liked: false,
        streamable: true
      }))
    };
    
    const json = JSON.stringify(playlistData, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${playlistData.name.replace(/[^a-zA-Zа-яА-Я0-9]/g, "_")}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowOptionsMenu(false);
  };

  const [showDuplicatesModal, setShowDuplicatesModal] = useState(false);
  const [foundDuplicates, setFoundDuplicates] = useState<{ id: string; title: string; artist: string }[]>([]);

  const handleRemoveDuplicates = () => {
    if (!selected || selected.type === "liked") return;
    
    const seen = new Set<string>();
    const duplicates: { id: string; title: string; artist: string }[] = [];
    
    for (const track of tracks) {
      const key = `${track.title?.toLowerCase()}_${track.artist?.toLowerCase()}`;
      if (seen.has(key)) {
        duplicates.push({ id: track.id, title: track.title || "Без названия", artist: track.artist || "Неизвестный" });
      } else {
        seen.add(key);
      }
    }
    
    setFoundDuplicates(duplicates);
    setShowDuplicatesModal(true);
    setShowOptionsMenu(false);
  };

  const confirmRemoveDuplicates = () => {
    if (!selected?.playlist || foundDuplicates.length === 0) return;
    
    for (const dup of foundDuplicates) {
      playlistService.removeTrackFromPlaylist(selected.playlist.id, dup.id);
    }
    loadData();
    setShowDuplicatesModal(false);
    setFoundDuplicates([]);
  };

  const handleRenameSelected = () => {
    if (!selected?.playlist || !renameValue.trim()) return;
    playlistService.updatePlaylist(selected.playlist.id, { name: renameValue.trim() });
    setSelected({ ...selected, playlist: { ...selected.playlist, name: renameValue.trim() } });
    setIsRenamingSelected(false);
    setRenameValue("");
    loadData();
  };

  const startRenameSelected = () => {
    if (selected?.playlist) {
      setRenameValue(selected.playlist.name);
      setIsRenamingSelected(true);
      setShowOptionsMenu(false);
    }
  };

  const handleCreatePlaylist = () => {
    if (!newPlaylistName.trim()) return;
    const newPlaylist = playlistService.createPlaylist(newPlaylistName.trim());
    setSelected({ type: "playlist", id: newPlaylist.id, playlist: newPlaylist });
    setNewPlaylistName("");
    setShowCreateModal(false);
    setJsonImportError("");
    loadData();
  };

  const handleJsonImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        console.log("[LibraryView] Importing JSON playlist:", json.name, "with", json.songs?.length, "songs");
        
        // Validate JSON structure
        if (!json.name || !Array.isArray(json.songs)) {
          setJsonImportError("Неверный формат. Нужны поля: name, songs[]");
          return;
        }
        
        // Log first few raw URLs to debug
        if (json.songs.length > 0) {
          console.log("[LibraryView] Sample raw URLs from JSON:");
          json.songs.slice(0, 3).forEach((s: any, i: number) => {
            console.log(`  [${i}] url: "${(s.url || s.streamUrl || "").substring(0, 80)}"`);
            console.log(`  [${i}] coverArt: "${(s.coverArt || s.artworkUrl || "").substring(0, 80)}"`);
          });
        }
        
        // Helper to decode HTML entities in URLs - decode multiple times until stable
        const decodeUrl = (url: string): string => {
          if (!url) return "";
          
          let decoded = url;
          let previous = "";
          
          // Keep decoding until the string stops changing (handles multiple encoding levels)
          while (decoded !== previous) {
            previous = decoded;
            
            // Decode &amp; first (most common double encoding)
            decoded = decoded.replace(/&amp;/g, "&");
            
            // Decode hex entities
            decoded = decoded.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => 
              String.fromCharCode(parseInt(hex, 16))
            );
            
            // Decode decimal entities
            decoded = decoded.replace(/&#(\d+);/g, (_, dec) => 
              String.fromCharCode(parseInt(dec, 10))
            );
            
            // Decode named entities
            decoded = decoded
              .replace(/&lt;/g, "<")
              .replace(/&gt;/g, ">")
              .replace(/&quot;/g, '"')
              .replace(/&apos;/g, "'")
              .replace(/&nbsp;/g, " ");
          }
          
          // Remove any [link_removed] placeholders
          decoded = decoded.replace(/\[link_removed\]/g, "");
          
          return decoded.trim();
        };
        
        // Detect platform from URL or source field
        const detectPlatform = (song: any): string => {
          const source = (song.source || "").toLowerCase();
          const url = (song.url || song.streamUrl || "").toLowerCase();
          
          if (source.includes("soundcloud") || url.includes("soundcloud") || url.includes("sndcdn")) return "soundcloud";
          if (source.includes("spotify") || url.includes("spotify")) return "spotify";
          if (source.includes("youtube") || url.includes("youtube") || url.includes("youtu.be")) return "youtube";
          if (source.includes("vk") || url.includes("vk.com")) return "vk";
          if (source.includes("yandex") || url.includes("yandex")) return "yandex";
          return "soundcloud";
        };
        
        // Convert songs to tracks format with proper URL handling
        const tracks: Track[] = json.songs
          .filter((song: any) => song.title) // Only need title, URLs can be empty (fallback will handle)
          .map((song: any) => {
            const decodedUrl = decodeUrl(song.url || song.streamUrl || "");
            const decodedCover = decodeUrl(song.artwork || song.coverArt || song.artworkUrl || song.cover || song.thumbnail || song.image || "");
            
            // Validate URL - must be valid http(s) URL with a proper domain
            const isValidUrl = (url: string) => {
              if (!url) return false;
              try {
                const parsed = new URL(url);
                // Must have http(s) protocol AND a valid hostname with a dot (not empty, not just "localhost")
                const hasValidProtocol = parsed.protocol === 'http:' || parsed.protocol === 'https:';
                const hasValidHostname = parsed.hostname && parsed.hostname.length > 0 && parsed.hostname.includes('.');
                return hasValidProtocol && hasValidHostname;
              } catch {
                return false;
              }
            };
            
            return {
              id: song.id?.toString() || `imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              title: song.title || "Unknown",
              artist: song.artist || song.author || "Unknown",
              duration: song.duration || 0,
              artworkUrl: isValidUrl(decodedCover) ? decodedCover : "",
              streamUrl: isValidUrl(decodedUrl) ? decodedUrl : "", // Empty URL = will use fallback when played
              platform: detectPlatform(song),
            };
          });
        
        if (tracks.length === 0) {
          setJsonImportError("Плейлист пуст");
          return;
        }
        
        // Create playlist with imported tracks
        const newPlaylist = playlistService.createPlaylist(json.name);
        for (const track of tracks) {
          playlistService.addTrackToPlaylist(newPlaylist.id, track);
        }
        
        setSelected({ type: "playlist", id: newPlaylist.id, playlist: { ...newPlaylist, tracks } });
        setShowCreateModal(false);
        setNewPlaylistName("");
        setJsonImportError("");
        loadData();
      } catch (err) {
        setJsonImportError("Ошибка чтения JSON файла");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleDeletePlaylist = (id: string) => {
    playlistService.deletePlaylist(id);
    if (selected?.id === id) setSelected({ type: "liked" });
    loadData();
  };

  const handleLocalFilesImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    try {
      const tracks: Track[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Create blob URL for the file
        const blobUrl = URL.createObjectURL(file);
        
        // Extract metadata from filename
        const fileName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
        let title = fileName;
        let artist = "Неизвестный исполнитель";
        
        // Try to parse "Artist - Title" format
        if (fileName.includes(" - ")) {
          const parts = fileName.split(" - ");
          artist = parts[0].trim();
          title = parts.slice(1).join(" - ").trim();
        }
        
        // Get duration using audio element
        const audio = new Audio();
        audio.src = blobUrl;
        
        await new Promise((resolve) => {
          audio.onloadedmetadata = () => resolve(null);
          audio.onerror = () => resolve(null);
          setTimeout(resolve, 1000); // Timeout after 1s
        });
        
        const duration = audio.duration || 0;
        
        const track: Track = {
          id: `local-${Date.now()}-${i}`,
          title,
          artist,
          duration: Math.floor(duration),
          artworkUrl: "",
          streamUrl: blobUrl,
          platform: "local",
          metadata: {},
        };
        
        tracks.push(track);
      }
      
      // Add to current selection or create new playlist
      if (selected?.type === "liked") {
        for (const track of tracks) {
          likedTracksService.addLikedTrack(track);
        }
        incrementStat("likedTracks", tracks.length);
      } else if (selected?.playlist) {
        for (const track of tracks) {
          playlistService.addTrackToPlaylist(selected.playlist.id, track);
        }
      } else {
        // Create new playlist
        const newPlaylist = playlistService.createPlaylist("Локальные файлы");
        for (const track of tracks) {
          playlistService.addTrackToPlaylist(newPlaylist.id, track);
        }
        setSelected({ type: "playlist", id: newPlaylist.id, playlist: { ...newPlaylist, tracks } });
      }
      
      loadData();
      
      window.dispatchEvent(
        new CustomEvent("show-toast", {
          detail: { message: `Добавлено ${tracks.length} треков`, type: "success" },
        })
      );
    } catch (error) {
      console.error("[LibraryView] Failed to import local files:", error);
      window.dispatchEvent(
        new CustomEvent("show-toast", {
          detail: { message: "Ошибка импорта файлов", type: "error" },
        })
      );
    }
    
    // Reset input
    e.target.value = "";
  };

  const handleRenamePlaylist = (id: string) => {
    if (!editName.trim()) return;
    playlistService.updatePlaylist(id, { name: editName.trim() });
    setEditingPlaylist(null);
    setEditName("");
    loadData();
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !coverInputPlaylist) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      playlistService.updatePlaylistCover(coverInputPlaylist, base64);
      loadData();
      setCoverInputPlaylist(null);
    };
    reader.readAsDataURL(file);
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selected?.playlist) return;
    
    // Validate image dimensions
    const img = new Image();
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      img.onload = () => {
        // Recommend 1200x300 but accept any wide image
        if (img.width < img.height) {
          alert("Баннер должен быть горизонтальным (ширина > высота).\nРекомендуемый размер: 1200×300 px");
          return;
        }
        playlistService.updatePlaylistBanner(selected.playlist!.id, base64);
        // Update selected playlist
        setSelected({ 
          ...selected, 
          playlist: { ...selected.playlist!, bannerUrl: base64 } as any 
        });
        loadData();
      };
      img.src = base64;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleRemoveTrack = (trackId: string) => {
    if (selected?.type === "liked") {
      likedTracksService.removeLikedTrack(trackId);
    } else if (selected?.type === "offline") {
      offlineTracksService.removeOfflineTrack(trackId);
    } else if (selected?.playlist) {
      playlistService.removeTrackFromPlaylist(selected.playlist.id, trackId);
    }
    loadData();
  };

  // Offline track state
  const [offlineTrackData, setOfflineTrackData] = useState({
    title: "",
    artist: "",
    url: "",
    artworkUrl: "",
  });
  const offlineFileInputRef = useRef<HTMLInputElement>(null);

  const handleAddOfflineTrack = async () => {
    const url = offlineTrackData.url.trim();
    
    if (!url) {
      window.dispatchEvent(new CustomEvent("show-toast", {
        detail: { message: "Введите URL", type: "error" }
      }));
      return;
    }

    let streamUrl = url;
    let artworkUrl = offlineTrackData.artworkUrl.trim();
    let title = offlineTrackData.title.trim();
    let artist = offlineTrackData.artist.trim();

    // Check if it's a SoundCloud URL
    if (url.includes("soundcloud.com")) {
      try {
        window.dispatchEvent(new CustomEvent("show-toast", {
          detail: { message: "Получение данных из SoundCloud...", type: "info" }
        }));

        // Extract track slug from URL
        const urlParts = url.split("/");
        let trackSlug = "";
        
        // Find the track slug (after username)
        for (let i = 0; i < urlParts.length; i++) {
          if (urlParts[i] === "soundcloud.com" && i + 2 < urlParts.length) {
            trackSlug = urlParts[i + 2].split("?")[0];
            break;
          }
        }
        
        if (!trackSlug) {
          throw new Error("Invalid SoundCloud URL");
        }
        
        // Search for the track
        const searchQuery = trackSlug.replace(/-/g, " ");
        const results = await soundCloudService.search(searchQuery, 10);
        
        if (results.tracks.length > 0) {
          // Find best match
          let track = results.tracks[0];
          
          // Try to find exact match by comparing slugs
          for (const t of results.tracks) {
            const tSlug = t.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
            if (tSlug.includes(trackSlug.toLowerCase()) || trackSlug.toLowerCase().includes(tSlug)) {
              track = t;
              break;
            }
          }
          
          // Get stream URL
          const scStreamUrl = await soundCloudService.getStreamUrl(track.id.replace("sc-", ""));
          
          if (scStreamUrl) {
            streamUrl = scStreamUrl;
            artworkUrl = artworkUrl || track.artworkUrl || "";
            title = title || track.title;
            artist = artist || track.artist;
          } else {
            throw new Error("Failed to get stream URL");
          }
        } else {
          throw new Error("Track not found");
        }
      } catch (error) {
        console.error("[LibraryView] Failed to get SoundCloud track:", error);
        window.dispatchEvent(new CustomEvent("show-toast", {
          detail: { message: "Не удалось получить трек из SoundCloud", type: "error" }
        }));
        return;
      }
    }

    // If title is still empty, use URL as title
    if (!title) {
      title = url.split("/").pop()?.split("?")[0] || "Без названия";
    }
    
    if (!artist) {
      artist = "Неизвестный артист";
    }

    const track: Track = {
      id: `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: title,
      artist: artist,
      streamUrl: streamUrl,
      artworkUrl: artworkUrl,
      duration: 0,
      platform: "offline",
      metadata: {},
    };

    offlineTracksService.addOfflineTrack(track);
    setOfflineTrackData({ title: "", artist: "", url: "", artworkUrl: "" });
    setShowAddOfflineModal(false);
    loadData();
    
    window.dispatchEvent(new CustomEvent("show-toast", {
      detail: { message: "Трек добавлен", type: "success" }
    }));
  };

  const handleOfflineFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if it's an audio file
    if (!file.type.startsWith("audio/")) {
      window.dispatchEvent(new CustomEvent("show-toast", {
        detail: { message: "Выберите аудио файл", type: "error" }
      }));
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setOfflineTrackData(prev => ({
        ...prev,
        url: base64,
        title: prev.title || file.name.replace(/\.[^/.]+$/, ""),
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleImport = async () => {
    if (!importUrl.trim()) return;
    setImportLoading(true);
    setImportError("");
    try {
      const url = importUrl.trim();
      const urlLower = url.toLowerCase();
      let tracksToImport: Track[] = [];
      let playlistName = "";
      
      if (urlLower.includes("soundcloud.com")) {
        if (urlLower.includes("/likes")) {
          // Import likes
          const match = url.match(/soundcloud\.com\/([^\/\?]+)\/likes/);
          if (!match) throw new Error("Неверная ссылка на лайки");
          const user = await soundCloudService.resolveUser(`https://soundcloud.com/${match[1]}`);
          if (!user) throw new Error("Пользователь не найден");
          tracksToImport = await soundCloudService.getUserLikes(user.id.replace("sc-user-", ""), 200);
          if (tracksToImport.length === 0) throw new Error("Лайки не найдены или профиль приватный");
          playlistName = `${user.username} - Лайки`;
        } else if (urlLower.includes("/sets/")) {
          // Import playlist
          tracksToImport = await soundCloudService.resolvePlaylistUrl(url);
          if (tracksToImport.length === 0) throw new Error("Плейлист пуст или недоступен");
          // Extract playlist name from URL
          const nameMatch = url.match(/\/sets\/([^\/\?]+)/);
          playlistName = nameMatch ? decodeURIComponent(nameMatch[1]).replace(/-/g, " ") : "Импортированный плейлист";
        } else {
          throw new Error("Вставьте ссылку на лайки (/likes) или плейлист (/sets/)");
        }
      } else if (urlLower.includes("spotify.com")) {
        throw new Error("Импорт из Spotify скоро");
      } else if (urlLower.includes("youtube.com") || urlLower.includes("youtu.be")) {
        throw new Error("Импорт из YouTube скоро");
      } else if (urlLower.includes("vk.com")) {
        throw new Error("Импорт из VK скоро");
      } else {
        throw new Error("Неподдерживаемая ссылка");
      }

      // Import to target
      let added = 0;
      if (importTarget === "liked" && !isPlaylistUrl) {
        // Add to liked tracks
        for (const track of tracksToImport) {
          if (!likedTracksService.isLiked(track.id)) {
            likedTracksService.addLikedTrack(track);
            added++;
          }
        }
        incrementStat("likedTracks", added);
      } else {
        // Create new playlist
        const newPlaylist = playlistService.createPlaylist(playlistName);
        for (const track of tracksToImport) {
          playlistService.addTrackToPlaylist(newPlaylist.id, track);
          added++;
        }
        // Select the new playlist
        setSelected({ type: "playlist", id: newPlaylist.id, playlist: { ...newPlaylist, tracks: tracksToImport } });
      }
      
      loadData();
      setShowImportModal(false);
      setImportUrl("");
      setImportTarget("liked");
    } catch (err: any) {
      setImportError(err.message || "Ошибка импорта");
    } finally {
      setImportLoading(false);
    }
  };

  const selectedTitle = selected?.type === "liked" 
    ? "Любимые треки" 
    : selected?.type === "offline" 
    ? "Оффлайн треки" 
    : selected?.playlist?.name || "";
  
  // Get best cover for the selected playlist (from tracks or cached artworks)
  const getSelectedCover = (): string | undefined => {
    const tracks = selected?.type === "liked" ? likedTracks : selected?.playlist?.tracks || [];
    // First try original artwork
    for (const track of tracks.slice(0, 5)) {
      if (isValidImageUrl(track.artworkUrl)) {
        return track.artworkUrl;
      }
      // Then try cached
      if (cachedArtworks[track.id]) {
        return cachedArtworks[track.id];
      }
    }
    return undefined;
  };
  const selectedCover = getSelectedCover();

  return (
    <div className="h-full flex gap-4 p-4" style={{ willChange: 'contents' }}>
      {/* Left Panel */}
      <div className="w-72 flex-shrink-0 flex flex-col gap-3 p-3 rounded-2xl"
        style={{ 
          background: "var(--surface-card)", 
          border: "1px solid var(--border-base)",
          willChange: 'transform',
          transform: 'translateZ(0)'
        }}>
        {/* Liked Songs Card */}
        <button
          onClick={() => setSelected({ type: "liked" })}
          className="relative overflow-hidden rounded-xl p-4 text-left transition-all hover:-translate-y-0.5"
          style={{
            background: "linear-gradient(135deg, #f87171, #ef4444)",
            boxShadow: selected?.type === "liked" ? "0 0 20px rgba(248, 113, 113, 0.4)" : "none",
          }}
        >
          <HiOutlineHeart size={28} className="text-white mb-2" />
          <h3 className="font-bold text-white text-lg">Любимые треки</h3>
          <p className="text-white/70 text-sm mt-1">{likedTracks.length} треков</p>
        </button>

        {/* Offline Tracks - Simple Playlist Style */}
        <button
          onClick={() => setSelected({ type: "offline" })}
          className="flex items-center gap-3 p-2.5 rounded-xl transition-all hover:scale-[1.02]"
          style={{
            background: selected?.type === "offline" ? "var(--surface-elevated)" : "transparent",
            border: selected?.type === "offline" ? "1px solid var(--border-base)" : "1px solid transparent",
          }}
        >
          <div className="w-11 h-11 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ background: "var(--surface-elevated)" }}>
            <HiOutlineSignalSlash size={20} style={{ color: "var(--text-subtle)" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>Оффлайн</p>
            <p className="text-xs" style={{ color: "var(--text-subtle)" }}>{offlineTracks.length} треков</p>
          </div>
        </button>

        {/* Divider - Playlists */}
        <div className="flex items-center gap-2 px-1 pt-2">
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-subtle)" }}>Плейлисты</span>
          <div className="flex-1 h-px" style={{ background: "var(--border-base)" }} />
          <button onClick={() => setShowCreateModal(true)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors" style={{ color: "var(--text-subtle)" }}>
            <HiOutlinePlus size={14} />
          </button>
        </div>

        {/* Playlists List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar library-smooth-scroll space-y-1 p-2 rounded-xl"
          style={{ 
            background: "var(--surface-elevated)", 
            border: "1px solid var(--border-base)",
            willChange: 'scroll-position',
            transform: 'translateZ(0)'
          }}>
          {playlists.length === 0 ? (
            <div className="text-center py-8">
              <HiOutlineMusicalNote size={32} style={{ color: "var(--text-subtle)", opacity: 0.3 }} className="mx-auto" />
              <p className="text-xs mt-2" style={{ color: "var(--text-subtle)" }}>Нет плейлистов</p>
            </div>
          ) : (
            playlists.map((playlist) => (
              <PlaylistItem
                key={playlist.id}
                playlist={playlist}
                isSelected={selected?.id === playlist.id}
                onSelect={() => setSelected({ type: "playlist", id: playlist.id, playlist })}
                onDelete={() => handleDeletePlaylist(playlist.id)}
                onCoverClick={() => { setCoverInputPlaylist(playlist.id); coverInputRef.current?.click(); }}
                getPlaylistCover={getPlaylistCover}
                getDominantPlatform={getDominantPlatform}
                editingPlaylist={editingPlaylist}
                editName={editName}
                setEditName={setEditName}
                handleRenamePlaylist={handleRenamePlaylist}
                setEditingPlaylist={setEditingPlaylist}
              />
            ))
          )}
        </div>

        {/* Bottom Buttons */}
        <div className="flex gap-2">
          <button onClick={() => setShowImportModal(true)}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
            style={{ background: "var(--surface-elevated)", color: "var(--text-secondary)", border: "1px solid var(--border-base)" }}>
            <HiOutlineArrowDownTray size={16} /> Импорт
          </button>
          <button onClick={() => document.getElementById('local-files-input')?.click()}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
            style={{ background: "var(--surface-elevated)", color: "var(--text-secondary)", border: "1px solid var(--border-base)" }}>
            <HiOutlinePlus size={16} /> Локальные
          </button>
        </div>

        {/* Hidden inputs */}
        <input ref={coverInputRef} type="file" accept="image/*" onChange={handleCoverChange} className="hidden" />
        <input 
          id="local-files-input" 
          type="file" 
          accept="audio/*" 
          multiple 
          onChange={handleLocalFilesImport} 
          className="hidden" 
        />
      </div>

      {/* Right Panel - Content */}
      <div className="flex-1 flex flex-col rounded-2xl overflow-hidden"
        style={{ 
          background: "var(--surface-card)", 
          border: "1px solid var(--border-base)",
          willChange: 'transform',
          transform: 'translateZ(0)',
          transition: 'opacity 0.2s ease-out'
        }}>
        {selected ? (
          <>
            {/* Header */}
            <div className="relative p-6 pb-4">
              <div className="absolute inset-0 overflow-hidden">
                {(selected?.playlist as any)?.bannerUrl ? (
                  <>
                    <img src={(selected.playlist as any).bannerUrl} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent" />
                    <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 50%, var(--surface-card))" }} />
                  </>
                ) : (
                  <>
                    {selectedCover && <img src={selectedCover} alt="" className="w-full h-full object-cover opacity-30 blur-3xl" />}
                    <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent, var(--surface-card))" }} />
                  </>
                )}
              </div>
              <div className="relative flex items-center gap-5">
              <div className="w-28 h-28 rounded-2xl overflow-hidden shadow-2xl flex-shrink-0 transition-transform hover:-translate-y-1" style={{ background: "var(--surface-elevated)" }}>
                  {selectedCover ? (
                    <img src={selectedCover} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {selected.type === "liked" ? (
                        <HiOutlineHeart size={36} className="text-red-400" />
                      ) : selected.type === "offline" ? (
                        <HiOutlineSignalSlash size={36} style={{ color: "var(--text-subtle)" }} />
                      ) : (
                        <HiOutlineMusicalNote size={36} style={{ color: "var(--text-subtle)" }} />
                      )}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: "var(--text-subtle)" }}>
                    {selected.type === "liked" || selected.type === "offline" ? "Коллекция" : "Плейлист"}
                  </p>
                  {isRenamingSelected && selected.type === "playlist" ? (
                    <div className="flex items-center gap-2 mb-1">
                      <input 
                        type="text" 
                        value={renameValue} 
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleRenameSelected()}
                        className="text-2xl font-bold bg-transparent border-b-2 focus:outline-none px-0"
                        style={{ borderColor: "var(--interactive-accent)", color: "var(--text-primary)" }}
                        autoFocus
                      />
                      <button onClick={handleRenameSelected} className="p-1" style={{ color: "var(--interactive-accent)" }}>
                        <HiOutlineCheck size={20} />
                      </button>
                      <button onClick={() => setIsRenamingSelected(false)} className="p-1" style={{ color: "var(--text-subtle)" }}>
                        <HiOutlineXMark size={20} />
                      </button>
                    </div>
                  ) : (
                    <h1 className="text-2xl font-bold mb-1 truncate" style={{ color: "var(--text-primary)" }}>{selectedTitle}</h1>
                  )}
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                    {tracks.length} треков • {hours > 0 ? `${hours} ч ` : ""}{minutes} мин
                  </p>
                </div>
                {/* Play Buttons - Right Side */}
                <div className="flex items-center gap-2">
                  <button onClick={handlePlayAll} disabled={tracks.length === 0}
                    className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg disabled:opacity-50 transition-transform hover:scale-105 active:scale-95"
                    style={{ background: "#ffffff" }}>
                    <HiOutlinePlay size={24} className="ml-1" style={{ color: "#000000" }} />
                  </button>
                  <button onClick={handleShuffle} disabled={tracks.length === 0}
                    className="w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-50 border transition-transform hover:scale-105 active:scale-95"
                    style={{ background: "#ffffff", color: "#000000", borderColor: "#ffffff" }}>
                    <IoShuffle size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* Search & Sort & Options */}
            <div className="px-5 py-2.5 flex items-center gap-3 border-b" style={{ borderColor: "var(--border-base)" }}>
              <div className="flex-1 relative">
                <HiOutlineMagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-subtle)" }} />
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Поиск..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg text-sm focus:outline-none"
                  style={{ background: "var(--surface-elevated)", color: "var(--text-primary)", border: "1px solid var(--border-base)" }} />
              </div>
              
              {/* Sort Dropdown */}
              <div className="relative">
                <button onClick={() => { setShowSortMenu(!showSortMenu); setShowOptionsMenu(false); }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{ background: "var(--surface-elevated)", color: "var(--text-secondary)", border: "1px solid var(--border-base)" }}>
                  {sortBy === "recent" ? "Недавние" : sortBy === "title" ? "По названию" : sortBy === "artist" ? "По артисту" : "По времени"}
                  <HiOutlineChevronDown size={14} className={`transition-transform ${showSortMenu ? "rotate-180" : ""}`} />
                </button>
                {showSortMenu && (
                  <div
                    className="absolute right-0 top-full mt-1 z-20 rounded-xl overflow-hidden shadow-xl py-1 min-w-[150px]"
                    style={{ background: "var(--surface-card)", border: "1px solid var(--border-base)" }}>
                    {[
                      { value: "recent", label: "Недавние" },
                      { value: "title", label: "По названию" },
                      { value: "artist", label: "По артисту" },
                      { value: "duration", label: "По времени" },
                    ].map((opt) => (
                      <button key={opt.value} onClick={() => { setSortBy(opt.value as SortOption); setShowSortMenu(false); }}
                        className="w-full px-3 py-2 text-left text-xs font-medium transition-all hover:bg-white/5 flex items-center justify-between"
                        style={{ color: sortBy === opt.value ? "var(--interactive-accent)" : "var(--text-secondary)" }}>
                        {opt.label}
                        {sortBy === opt.value && <HiOutlineCheck size={14} />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Options Menu */}
              <div className="relative">
                <button onClick={() => { setShowOptionsMenu(!showOptionsMenu); setShowSortMenu(false); }}
                  className="p-1.5 rounded-lg transition-all hover:bg-white/10"
                  style={{ color: "var(--text-secondary)" }}>
                  <HiOutlineEllipsisVertical size={18} />
                </button>
                {showOptionsMenu && (
                  <div
                    className="absolute right-0 top-full mt-1 z-20 rounded-xl overflow-hidden shadow-xl py-1 min-w-[180px]"
                    style={{ background: "var(--surface-card)", border: "1px solid var(--border-base)" }}>
                    
                    {/* Add Offline Track */}
                    {selected?.type === "offline" && (
                      <>
                        <button onClick={() => { setShowAddOfflineModal(true); setShowOptionsMenu(false); }}
                          className="w-full px-3 py-2 text-left text-xs font-medium transition-all hover:bg-white/5 flex items-center gap-2"
                          style={{ color: "var(--interactive-accent)" }}>
                          <HiOutlinePlus size={14} />
                          Добавить трек
                        </button>
                        <div className="my-1 h-px mx-2" style={{ background: "var(--border-base)" }} />
                      </>
                    )}
                    
                    {/* Shuffle and Play */}
                    <button onClick={() => { handleShuffle(); setShowOptionsMenu(false); }}
                      disabled={tracks.length === 0}
                      className="w-full px-3 py-2 text-left text-xs font-medium transition-all hover:bg-white/5 flex items-center gap-2 disabled:opacity-50"
                      style={{ color: "var(--text-secondary)" }}>
                      <IoShuffle size={14} />
                      Перемешать и играть
                    </button>
                    
                    {/* Rename playlist */}
                    {selected?.type === "playlist" && (
                      <button onClick={startRenameSelected}
                        className="w-full px-3 py-2 text-left text-xs font-medium transition-all hover:bg-white/5 flex items-center gap-2"
                        style={{ color: "var(--text-secondary)" }}>
                        <HiOutlinePencil size={14} />
                        Переименовать
                      </button>
                    )}
                    
                    {/* Set/Remove banner */}
                    {selected?.type === "playlist" && (
                      (selected?.playlist as any)?.bannerUrl ? (
                        <button onClick={() => { 
                          playlistService.updatePlaylistBanner(selected.playlist!.id, "");
                          loadData();
                          setShowOptionsMenu(false); 
                        }}
                          className="w-full px-3 py-2 text-left text-xs font-medium transition-all hover:bg-red-500/10 flex items-center gap-2"
                          style={{ color: "#f87171" }}>
                          <HiOutlineXMark size={14} />
                          Удалить баннер
                        </button>
                      ) : (
                        <button onClick={() => { bannerInputRef.current?.click(); setShowOptionsMenu(false); }}
                          className="w-full px-3 py-2 text-left text-xs font-medium transition-all hover:bg-white/5 flex items-center gap-2"
                          style={{ color: "var(--text-secondary)" }}>
                          <HiOutlinePhoto size={14} />
                          Установить баннер
                          <span className="text-[10px] ml-auto" style={{ color: "var(--text-subtle)" }}>1200×300</span>
                        </button>
                      )
                    )}
                    
                    {/* Divider */}
                    <div className="my-1 h-px mx-2" style={{ background: "var(--border-base)" }} />
                    
                    {/* Find duplicates */}
                    {selected?.type === "playlist" && (
                      <button onClick={handleRemoveDuplicates}
                        disabled={tracks.length === 0}
                        className="w-full px-3 py-2 text-left text-xs font-medium transition-all hover:bg-white/5 flex items-center gap-2 disabled:opacity-50"
                        style={{ color: "var(--text-secondary)" }}>
                        <HiOutlineDocumentDuplicate size={14} />
                        Удалить дубликаты
                      </button>
                    )}
                    
                    {/* Export */}
                    <button onClick={handleExportPlaylist}
                      disabled={tracks.length === 0}
                      className="w-full px-3 py-2 text-left text-xs font-medium transition-all hover:bg-white/5 flex items-center gap-2 disabled:opacity-50"
                      style={{ color: "var(--text-secondary)" }}>
                      <HiOutlineArrowUpTray size={14} />
                      Экспорт в JSON
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Hidden input for banner upload */}
            <input ref={bannerInputRef} type="file" accept="image/*" onChange={handleBannerChange} className="hidden" />

            {/* Track List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar library-smooth-scroll px-3 py-2"
              style={{
                willChange: 'scroll-position',
                transform: 'translateZ(0)',
                scrollBehavior: 'smooth'
              }}>
              {tracks.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center py-12">
                  <HiOutlineMusicalNote size={40} style={{ color: "var(--text-subtle)", opacity: 0.4 }} />
                  <p className="mt-3 text-sm" style={{ color: "var(--text-subtle)" }}>{searchQuery ? "Ничего не найдено" : "Пусто"}</p>
                </div>
              ) : (
                tracks.map((track, idx) => (
                  <TrackItem
                    key={track.id}
                    track={track}
                    idx={idx}
                    isCurrent={currentTrack?.id === track.id}
                    isPlaying={isPlaying}
                    onPlay={() => handlePlayTrack(track, tracks, idx)}
                    onRemove={() => handleRemoveTrack(track.id)}
                    getTrackArtwork={getTrackArtwork}
                    getTrackPlatform={getTrackPlatform}
                    formatDuration={formatDuration}
                  />
                ))
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <HiOutlineQueueList size={48} style={{ color: "var(--text-subtle)", opacity: 0.3 }} />
            <h3 className="mt-3 font-medium" style={{ color: "var(--text-primary)" }}>Выберите коллекцию</h3>
            <p className="mt-1 text-sm" style={{ color: "var(--text-subtle)" }}>Слева</p>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)" }} onClick={() => { setShowCreateModal(false); setJsonImportError(""); }}>
          <div
            onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-2xl p-5"
            style={{ background: "var(--surface-card)", border: "1px solid var(--border-base)" }}>
              <h2 className="text-lg font-bold mb-3" style={{ color: "var(--text-primary)" }}>Новый плейлист</h2>
              
              {/* Create empty playlist */}
              <input type="text" value={newPlaylistName} onChange={(e) => setNewPlaylistName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreatePlaylist()} placeholder="Название..."
                className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none mb-3"
                style={{ background: "var(--surface-elevated)", color: "var(--text-primary)", border: "1px solid var(--border-base)" }} autoFocus />
              
              {/* Divider */}
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1 h-px" style={{ background: "var(--border-base)" }} />
                <span className="text-xs" style={{ color: "var(--text-subtle)" }}>или</span>
                <div className="flex-1 h-px" style={{ background: "var(--border-base)" }} />
              </div>
              
              {/* Import JSON */}
              <button 
                onClick={() => jsonInputRef.current?.click()}
                className="w-full py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all mb-3"
                style={{ background: "var(--surface-elevated)", color: "var(--text-secondary)", border: "1px solid var(--border-base)" }}>
                <HiOutlineArrowDownTray size={16} /> Импорт из JSON файла
              </button>
              <input ref={jsonInputRef} type="file" accept=".json" onChange={handleJsonImport} className="hidden" />
              
              {jsonImportError && <p className="text-xs text-red-400 mb-3">{jsonImportError}</p>}
              
              <div className="flex gap-2">
                <button onClick={() => { setShowCreateModal(false); setJsonImportError(""); }} className="flex-1 py-2 rounded-xl text-sm font-medium"
                  style={{ background: "var(--surface-elevated)", color: "var(--text-secondary)" }}>Отмена</button>
                <button onClick={handleCreatePlaylist} disabled={!newPlaylistName.trim()}
                  className="flex-1 py-2 rounded-xl text-sm font-medium disabled:opacity-50"
                  style={{ background: "var(--interactive-accent)", color: "var(--interactive-accent-text)" }}>Создать</button>
              </div>
            </div>
          </div>
        )}

      {/* Import Modal */}
      {showImportModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)" }} onClick={() => { setShowImportModal(false); setImportError(""); setImportUrl(""); setImportTarget("liked"); }}>
          <div
            onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl overflow-hidden"
            style={{ background: "var(--surface-card)", border: "1px solid var(--border-base)" }}>
              
              {/* Header */}
              <div className="p-5 pb-4">
                <h2 className="font-bold text-lg" style={{ color: "var(--text-primary)" }}>Импорт треков</h2>
                <p className="text-xs mt-1" style={{ color: "var(--text-subtle)" }}>Вставьте ссылку на плейлист или лайки</p>
              </div>
              
              {/* Input */}
              <div className="px-5">
                <div className="relative">
                  <input type="text" value={importUrl} onChange={(e) => setImportUrl(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleImport()}
                    placeholder="Вставьте ссылку..."
                    className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none pr-12"
                    style={{ 
                      background: "var(--surface-elevated)", 
                      color: "var(--text-primary)", 
                      border: detectedService ? `2px solid ${detectedService.color}` : "1px solid var(--border-base)",
                    }} 
                    autoFocus />
                  {detectedService && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <detectedService.icon size={20} style={{ color: detectedService.color }} />
                    </div>
                  )}
                </div>
              </div>

              {/* Import target selection - only for likes */}
              {!isPlaylistUrl && importUrl.trim() && (
                <div className="px-5 mt-3">
                  <p className="text-xs mb-2" style={{ color: "var(--text-subtle)" }}>Импортировать в:</p>
                  <div className="flex gap-2">
                    <button onClick={() => setImportTarget("liked")}
                      className="flex-1 py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-all"
                      style={{
                        background: importTarget === "liked" ? "rgba(248, 113, 113, 0.2)" : "var(--surface-elevated)",
                        color: importTarget === "liked" ? "#f87171" : "var(--text-secondary)",
                        border: importTarget === "liked" ? "1px solid #f87171" : "1px solid var(--border-base)",
                      }}>
                      <HiOutlineHeart size={14} /> Любимые
                    </button>
                    <button onClick={() => setImportTarget("playlist")}
                      className="flex-1 py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-all"
                      style={{
                        background: importTarget === "playlist" ? "color-mix(in srgb, var(--interactive-accent) 20%, transparent)" : "var(--surface-elevated)",
                        color: importTarget === "playlist" ? "var(--interactive-accent)" : "var(--text-secondary)",
                        border: importTarget === "playlist" ? "1px solid var(--interactive-accent)" : "1px solid var(--border-base)",
                      }}>
                      <HiOutlinePlus size={14} /> Новый плейлист
                    </button>
                  </div>
                </div>
              )}

              {/* Info for playlist URLs */}
              {isPlaylistUrl && importUrl.trim() && (
                <div className="px-5 mt-3">
                  <div className="p-2.5 rounded-lg flex items-center gap-2" style={{ background: "var(--surface-elevated)" }}>
                    <HiOutlineMusicalNote size={16} style={{ color: "var(--interactive-accent)" }} />
                    <span className="text-xs" style={{ color: "var(--text-secondary)" }}>Будет создан новый плейлист</span>
                  </div>
                </div>
              )}
              
              {importError && <p className="text-xs text-red-400 px-5 mt-3">{importError}</p>}
              
              {/* Buttons */}
              <div className="flex gap-2 p-5 pt-4 mt-2 border-t" style={{ borderColor: "var(--border-base)" }}>
                <button onClick={() => { setShowImportModal(false); setImportError(""); setImportUrl(""); setImportTarget("liked"); }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                  style={{ background: "var(--surface-elevated)", color: "var(--text-secondary)" }}>Отмена</button>
                <button onClick={handleImport} disabled={!importUrl.trim() || importLoading}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
                  style={{ 
                    background: detectedService?.color || "var(--interactive-accent)",
                    color: "white"
                  }}>
                  {importLoading ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Импорт...</>
                  ) : "Импортировать"}
                </button>
              </div>
            </div>
          </div>
        )}

      {/* Duplicates Modal */}
      {showDuplicatesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }} onClick={() => { setShowDuplicatesModal(false); setFoundDuplicates([]); }}>
          <div className="w-full max-w-md rounded-2xl p-6" style={{ background: "var(--surface-card)", border: "1px solid var(--border-base)" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${foundDuplicates.length > 0 ? 'bg-orange-500/20' : 'bg-green-500/20'}`}>
                {foundDuplicates.length > 0 ? (
                  <HiOutlineTrash size={24} className="text-orange-400" />
                ) : (
                  <HiOutlineCheck size={24} className="text-green-400" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                  {foundDuplicates.length > 0 ? `Найдено ${foundDuplicates.length} дубликатов` : "Дубликатов не найдено"}
                </h3>
                <p className="text-sm" style={{ color: "var(--text-subtle)" }}>
                  {foundDuplicates.length > 0 ? "Эти треки будут удалены" : "Все треки уникальны"}
                </p>
              </div>
            </div>

            {foundDuplicates.length > 0 && (
              <div className="max-h-64 overflow-y-auto custom-scrollbar mb-4 rounded-xl" style={{ background: "var(--surface-elevated)" }}>
                {foundDuplicates.map((dup, i) => (
                  <div key={dup.id + i} className="flex items-center gap-3 p-3 border-b last:border-b-0" style={{ borderColor: "var(--border-base)" }}>
                    <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center text-red-400 text-xs font-bold">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{dup.title}</p>
                      <p className="text-xs truncate" style={{ color: "var(--text-subtle)" }}>{dup.artist}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              {foundDuplicates.length > 0 ? (
                <>
                  <button onClick={() => { setShowDuplicatesModal(false); setFoundDuplicates([]); }}
                    className="flex-1 py-2.5 rounded-xl font-medium transition-all"
                    style={{ background: "var(--surface-elevated)", color: "var(--text-secondary)", border: "1px solid var(--border-base)" }}>
                    Отмена
                  </button>
                  <button onClick={confirmRemoveDuplicates}
                    className="flex-1 py-2.5 rounded-xl font-medium transition-all bg-red-500 hover:bg-red-600 text-white">
                    Удалить все
                  </button>
                </>
              ) : (
                <button onClick={() => { setShowDuplicatesModal(false); setFoundDuplicates([]); }}
                  className="w-full py-2.5 rounded-xl font-medium transition-all"
                  style={{ background: "var(--interactive-accent)", color: "white" }}>
                  Отлично
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--border-base); border-radius: 2px; }
      `}</style>

      {/* Add Offline Track Modal */}
      {showAddOfflineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }} onClick={() => setShowAddOfflineModal(false)}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden" style={{ background: "var(--surface-card)", border: "1px solid var(--border-base)" }} onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="px-5 py-4 border-b" style={{ borderColor: "var(--border-base)" }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "var(--surface-elevated)" }}>
                  <HiOutlineSignalSlash size={20} style={{ color: "var(--text-subtle)" }} />
                </div>
                <div>
                  <h3 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>Добавить оффлайн трек</h3>
                  <p className="text-xs" style={{ color: "var(--text-subtle)" }}>По URL или локальный файл</p>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="p-5 space-y-3">
              {/* URL or File */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>URL аудио *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={offlineTrackData.url}
                    onChange={(e) => setOfflineTrackData(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="https://soundcloud.com/... или прямая ссылка"
                    className="flex-1 px-3 py-2 rounded-lg text-sm focus:outline-none"
                    style={{ background: "var(--surface-elevated)", color: "var(--text-primary)", border: "1px solid var(--border-base)" }}
                  />
                  <input ref={offlineFileInputRef} type="file" accept="audio/*" onChange={handleOfflineFileUpload} className="hidden" />
                  <button
                    onClick={() => offlineFileInputRef.current?.click()}
                    className="px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5"
                    style={{ background: "var(--surface-elevated)", color: "var(--text-secondary)", border: "1px solid var(--border-base)" }}>
                    <HiOutlineArrowUpTray size={14} />
                    Файл
                  </button>
                </div>
                <p className="text-xs mt-1" style={{ color: "var(--text-subtle)" }}>SoundCloud автоматически заполнит данные</p>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Название</label>
                <input
                  type="text"
                  value={offlineTrackData.title}
                  onChange={(e) => setOfflineTrackData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Автоматически из URL (опционально)"
                  className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none"
                  style={{ background: "var(--surface-elevated)", color: "var(--text-primary)", border: "1px solid var(--border-base)" }}
                />
              </div>

              {/* Artist */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Артист</label>
                <input
                  type="text"
                  value={offlineTrackData.artist}
                  onChange={(e) => setOfflineTrackData(prev => ({ ...prev, artist: e.target.value }))}
                  placeholder="Автоматически из URL (опционально)"
                  className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none"
                  style={{ background: "var(--surface-elevated)", color: "var(--text-primary)", border: "1px solid var(--border-base)" }}
                />
              </div>

              {/* Artwork URL - Collapsed */}
              <details className="group">
                <summary className="text-xs font-medium cursor-pointer list-none flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
                  <HiOutlineChevronDown size={12} className="transition-transform group-open:rotate-180" />
                  Обложка (опционально)
                </summary>
                <input
                  type="text"
                  value={offlineTrackData.artworkUrl}
                  onChange={(e) => setOfflineTrackData(prev => ({ ...prev, artworkUrl: e.target.value }))}
                  placeholder="https://example.com/cover.jpg"
                  className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none mt-1.5"
                  style={{ background: "var(--surface-elevated)", color: "var(--text-primary)", border: "1px solid var(--border-base)" }}
                />
              </details>
            </div>

            {/* Buttons */}
            <div className="flex gap-2 p-5 pt-0">
              <button
                onClick={() => {
                  setShowAddOfflineModal(false);
                  setOfflineTrackData({ title: "", artist: "", url: "", artworkUrl: "" });
                }}
                className="flex-1 py-2 rounded-lg text-sm font-medium"
                style={{ background: "var(--surface-elevated)", color: "var(--text-secondary)" }}>
                Отмена
              </button>
              <button
                onClick={handleAddOfflineTrack}
                disabled={!offlineTrackData.url.trim()}
                className="flex-1 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-all"
                style={{ background: "var(--interactive-accent)", color: "var(--interactive-accent-text)" }}>
                Добавить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
