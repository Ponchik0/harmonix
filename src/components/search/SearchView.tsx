import { useState, useEffect, useCallback } from "react";
import {
  HiOutlineMagnifyingGlass,
  HiOutlinePlay,
  HiOutlinePlus,
  HiOutlineUser,
  HiOutlineQueueList,
  HiOutlineMusicalNote,
  HiOutlineXMark,
  HiOutlineHeart,
  HiOutlineCheck,
  HiOutlineArrowLeft,
  HiOutlineCheckBadge,
  HiOutlineArrowDownTray,
  HiOutlineBell,
  HiOutlineBellSlash,
  HiOutlineSquares2X2,
  HiOutlineBars3,
  HiOutlineSignalSlash,
} from "react-icons/hi2";
import { SiSoundcloud, SiYoutube, SiSpotify } from "react-icons/si";
import { soundCloudService } from "../../services/SoundCloudService";
import { youtubeService } from "../../services/YouTubeService";
import { spotifyService } from "../../services/SpotifyService";
import { yandexMusicService } from "../../services/YandexMusicService";
import { vkMusicService } from "../../services/VKMusicService";
import { audioService } from "../../services/AudioService";
import { downloadService } from "../../services/DownloadService";
import { useQueueStore } from "../../stores/queueStore";
import { playlistService } from "../../services/PlaylistService";
import { likedTracksService } from "../../services/LikedTracksService";
import { offlineTracksService } from "../../services/OfflineTracksService";
import { useUserStore } from "../../stores/userStore";
import { useThemeStore } from "../../stores/themeStore";
import { useArtistSubscriptionsStore } from "../../stores/artistSubscriptionsStore";
import {
  type SearchSource,
} from "./SearchSourceSelector";
import { FaSoundcloud, FaYoutube, FaSpotify } from "react-icons/fa";
import { SiVk } from "react-icons/si";
import type {
  Track,
  SoundCloudPlaylist,
  SoundCloudUser,
  Playlist,
} from "../../types";

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
function getTrackPlatform(track: Track): string {
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

type TabType = "tracks" | "playlists" | "users";

const SEARCH_HISTORY_KEY = "harmonix-search-history";
const MAX_HISTORY = 8;

// Helper to get accent-aware button styles based on theme ID
const getAccentButtonStyle = (themeId: string, accent: string) => {
  const isDarkOutline = ["dark", "dark-amoled"].includes(themeId);
  const isLightOutline = ["light", "light-stone", "light-slate"].includes(
    themeId
  );

  if (isDarkOutline) {
    // White circle, black icon
    return {
      background: "white",
      border: "none",
      color: "black",
      isOutline: true,
    };
  }
  if (isLightOutline) {
    // Black circle, white icon
    return {
      background: "#18181b",
      border: "none",
      color: "white",
      isOutline: true,
    };
  }
  // Colored circle, white icon
  return {
    background: accent,
    border: "none",
    color: "white",
    isOutline: false,
  };
};

export function SearchView() {
  const [query, setQuery] = useState("");
  const [pendingSearch, setPendingSearch] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("tracks");
  const [tracks, setTracks] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<SoundCloudPlaylist[]>([]);
  const [users, setUsers] = useState<SoundCloudUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [searchHistoryTracks, setSearchHistoryTracks] = useState<Track[]>([]);
  // Stable shuffled recommendations - only shuffle once when data changes
  const [shuffledRecommendations, setShuffledRecommendations] = useState<Track[]>([]);
  const [viewMode, setViewMode] = useState<"list" | "grid">(() => {
    return (localStorage.getItem("harmonix-search-view") as "list" | "grid") || "list";
  });
  const [showAddToPlaylist, setShowAddToPlaylist] = useState<Track | null>(
    null
  );
  const [userPlaylists, setUserPlaylists] = useState<Playlist[]>([]);
  const [selectedArtist, setSelectedArtist] = useState<SoundCloudUser | null>(
    null
  );
  const [artistTracks, setArtistTracks] = useState<Track[]>([]);
  const [loadingArtist, setLoadingArtist] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] =
    useState<SoundCloudPlaylist | null>(null);
  const [playlistTracks, setPlaylistTracks] = useState<Track[]>([]);
  const [loadingPlaylist, setLoadingPlaylist] = useState(false);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [selectedSources, setSelectedSources] = useState<SearchSource[]>(() => {
    try {
      const saved = localStorage.getItem("harmonix-search-sources");
      return saved ? JSON.parse(saved) : ["soundcloud", "youtube"];
    } catch {
      return ["soundcloud", "youtube"];
    }
  });
  const { currentTheme, currentThemeId } = useThemeStore();
  const colors = currentTheme.colors;
  const accentStyle = getAccentButtonStyle(currentThemeId, colors.accent);


  const handleSourcesChange = (sources: SearchSource[]) => {
    setSelectedSources(sources);
    localStorage.setItem("harmonix-search-sources", JSON.stringify(sources));
  };

  const { addToQueue } = useQueueStore();

  const handleOpenArtist = async (user: SoundCloudUser) => {
    setLoadingArtist(true);
    setSelectedArtist(user);
    try {
      const userId = user.id.replace("sc-user-", "");
      const tracks = await soundCloudService.getUserTracks(userId, 50, user.username);
      // Sort tracks by creation date (newest first)
      const sortedTracks = [...tracks].sort((a, b) => {
        const dateA = a.metadata?.releaseDate ? new Date(a.metadata.releaseDate).getTime() : 0;
        const dateB = b.metadata?.releaseDate ? new Date(b.metadata.releaseDate).getTime() : 0;
        return dateB - dateA;
      });
      setArtistTracks(sortedTracks);
    } catch (e) {
      console.error("Error loading artist tracks:", e);
      setArtistTracks([]);
    }
    setLoadingArtist(false);
  };

  const handleCloseArtist = () => {
    setSelectedArtist(null);
    setArtistTracks([]);
  };

  const handleOpenPlaylist = async (playlist: SoundCloudPlaylist) => {
    setLoadingPlaylist(true);
    setSelectedPlaylist(playlist);
    try {
      const playlistId = playlist.id.replace("sc-playlist-", "");
      console.log("[SearchView] Loading playlist:", playlistId);
      const result = await soundCloudService.getFullPlaylist(playlistId);
      if (result) {
        console.log("[SearchView] Loaded tracks:", result.tracks.length);
        setPlaylistTracks(result.tracks);
      } else {
        console.error("[SearchView] Failed to load playlist");
        setPlaylistTracks([]);
      }
    } catch (e) {
      console.error("Error loading playlist tracks:", e);
      setPlaylistTracks([]);
    }
    setLoadingPlaylist(false);
  };

  const handleClosePlaylist = () => {
    setSelectedPlaylist(null);
    setPlaylistTracks([]);
  };

  const handlePlayPlaylistTrack = async (track: Track, index: number) => {
    // Use fallback service for better reliability
    const { streamFallbackService } = await import("../../services/StreamFallbackService");
    const result = await streamFallbackService.getStreamUrl(track);
    
    if (result.streamUrl) {
      const trackToPlay = result.fallbackTrack || track;
      const { clearQueue, addToQueue } = useQueueStore.getState();
      clearQueue();
      playlistTracks
        .slice(index + 1)
        .forEach((t) => addToQueue({ ...t, streamUrl: "" }));
      audioService.load({ ...trackToPlay, streamUrl: result.streamUrl });
    } else {
      window.dispatchEvent(
        new CustomEvent("show-toast", {
          detail: { message: "Не удалось загрузить трек", type: "error" },
        })
      );
    }
  };

  const handleSavePlaylistToLibrary = () => {
    if (!selectedPlaylist) return;
    const newPlaylist = playlistService.createPlaylist(
      selectedPlaylist.title,
      `Импортировано из SoundCloud`
    );
    playlistTracks.forEach((track) => {
      playlistService.addTrackToPlaylist(newPlaylist.id, track);
    });
    window.dispatchEvent(new CustomEvent("playlists-changed"));
    handleClosePlaylist();
  };

  const handlePlayArtistTrack = async (track: Track, index: number) => {
    // Use fallback service for better reliability
    const { streamFallbackService } = await import("../../services/StreamFallbackService");
    const result = await streamFallbackService.getStreamUrl(track);
    
    if (result.streamUrl) {
      const trackToPlay = result.fallbackTrack || track;
      const { clearQueue, addToQueue } = useQueueStore.getState();
      clearQueue();
      artistTracks
        .slice(index + 1)
        .forEach((t) => addToQueue({ ...t, streamUrl: "" }));
      audioService.load({ ...trackToPlay, streamUrl: result.streamUrl });
    } else {
      window.dispatchEvent(
        new CustomEvent("show-toast", {
          detail: { message: "Не удалось загрузить трек", type: "error" },
        })
      );
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem(SEARCH_HISTORY_KEY);
    if (saved) {
      try {
        setSearchHistory(JSON.parse(saved));
      } catch {}
    }
    
    // Load search history tracks
    const savedHistoryTracks = localStorage.getItem("harmonix-search-history-tracks");
    if (savedHistoryTracks) {
      try {
        setSearchHistoryTracks(JSON.parse(savedHistoryTracks).slice(0, 20));
      } catch {}
    }
    
    // Load recently played
    const savedRecent = localStorage.getItem("harmonix-recently-played");
    if (savedRecent) {
      try {
      } catch {}
    }
    
    setUserPlaylists(playlistService.getAllPlaylists());

    // Load liked tracks
    const loadLiked = () => {
      const liked = likedTracksService.getLikedTracks();
      setLikedIds(new Set(liked.map((t) => t.id)));
    };
    loadLiked();
    

    // Listen for artist search from player
    const handleSearchArtist = (e: CustomEvent) => {
      const artist = e.detail?.artist;
      if (artist) {
        setQuery(artist);
        setPendingSearch(artist);
      }
    };

    // Handle opening artist profile from other components (e.g., FullscreenPlayer)
    const handleOpenArtistProfile = (e: CustomEvent) => {
      const { artist, tracks } = e.detail || {};
      if (artist && tracks) {
        setSelectedArtist(artist);
        setArtistTracks(tracks);
        setLoadingArtist(false);
      }
    };

    // Check if artist data was stored before navigation (e.g., from PlayerBar)
    const pendingData = (window as any).__artistData;
    if (pendingData?.artist && pendingData?.tracks) {
      setSelectedArtist(pendingData.artist);
      setArtistTracks(pendingData.tracks);
      setLoadingArtist(false);
      delete (window as any).__artistData;
    }

    // Listen for changes
    window.addEventListener("liked-tracks-changed", loadLiked);
    window.addEventListener("search-artist", handleSearchArtist as EventListener);
    window.addEventListener("open-artist-profile", handleOpenArtistProfile as EventListener);
    return () => {
      window.removeEventListener("liked-tracks-changed", loadLiked);
      window.removeEventListener("search-artist", handleSearchArtist as EventListener);
      window.removeEventListener("open-artist-profile", handleOpenArtistProfile as EventListener);
    };
  }, []);

  // Shuffle recommendations only when searchHistoryTracks changes
  useEffect(() => {
    if (searchHistoryTracks.length > 0) {
      const shuffled = [...searchHistoryTracks].sort(() => Math.random() - 0.5).slice(0, 12);
      setShuffledRecommendations(shuffled);
    } else {
      setShuffledRecommendations([]);
    }
  }, [searchHistoryTracks]);

  useEffect(() => {
    if (showAddToPlaylist) setUserPlaylists(playlistService.getAllPlaylists());
  }, [showAddToPlaylist]);

  const { incrementStat } = useUserStore();

  const handleLikeTrack = (track: Track) => {
    const isNowLiked = likedTracksService.toggleLike(track);
    setLikedIds((prev) => {
      const newSet = new Set(prev);
      if (isNowLiked) newSet.add(track.id);
      else newSet.delete(track.id);
      return newSet;
    });
    if (isNowLiked) incrementStat("likedTracks", 1);
    window.dispatchEvent(new CustomEvent("liked-tracks-changed"));
  };

  const saveToHistory = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    const newHistory = [
      trimmed,
      ...searchHistory.filter((h) => h.toLowerCase() !== trimmed.toLowerCase()),
    ].slice(0, MAX_HISTORY);
    setSearchHistory(newHistory);
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
  };

  const removeFromHistory = (term: string) => {
    const newHistory = searchHistory.filter((h) => h !== term);
    setSearchHistory(newHistory);
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
  };

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem(SEARCH_HISTORY_KEY);
  };

  const handleSearch = useCallback(
    async (searchQuery?: string) => {
      const q = searchQuery || query;
      if (!q.trim()) return;
      
      // Очищаем старые результаты ПЕРЕД началом поиска
      setTracks([]);
      setPlaylists([]);
      setUsers([]);
      
      setLoading(true);
      setSearched(true);
      saveToHistory(q);
      try {
        let allTracks: Track[] = [];
        let allPlaylists: SoundCloudPlaylist[] = [];
        let allUsers: SoundCloudUser[] = [];

        // Search SoundCloud if selected
        if (selectedSources.includes("soundcloud")) {
          const scResults = await soundCloudService.search(q);
          allTracks = [...allTracks, ...scResults.tracks];
          allPlaylists = scResults.playlists;
          allUsers = scResults.users;
        }

        // Search YouTube if selected and enabled
        if (selectedSources.includes("youtube") && youtubeService.isEnabled()) {
          const ytTracks = await youtubeService.search(q, 15);
          allTracks = [...allTracks, ...ytTracks];
        }

        // Search Spotify if selected and connected
        if (
          selectedSources.includes("spotify") &&
          spotifyService.isConnected()
        ) {
          console.log("[Search] Searching Spotify...");
          const spotifyTracks = await spotifyService.search(q, 15);
          allTracks = [...allTracks, ...spotifyTracks];
        }

        // Search Yandex Music if selected and enabled
        if (
          selectedSources.includes("yandex") &&
          yandexMusicService.isEnabled()
        ) {
          console.log("[Search] Searching Yandex Music...");
          const yandexTracks = await yandexMusicService.search(q, 15);
          allTracks = [...allTracks, ...yandexTracks];
        }

        // Search VK Music if selected and enabled
        if (
          selectedSources.includes("vk") &&
          vkMusicService.isEnabled()
        ) {
          console.log("[Search] Searching VK Music...");
          const vkTracks = await vkMusicService.search(q, 15);
          allTracks = [...allTracks, ...vkTracks];
        }

        // Sort tracks - mix sources
        if (selectedSources.length > 1) {
          allTracks = allTracks.sort(() => Math.random() - 0.5);
        }

        // Save first tracks to search history tracks
        if (allTracks.length > 0) {
          setSearchHistoryTracks(prev => {
            const newTracks = allTracks.slice(0, 3);
            const existingIds = new Set(newTracks.map(t => t.id));
            const filtered = prev.filter(t => !existingIds.has(t.id));
            const updated = [...newTracks, ...filtered].slice(0, 20);
            localStorage.setItem("harmonix-search-history-tracks", JSON.stringify(updated));
            return updated;
          });
        }

        setTracks(allTracks);
        setPlaylists(allPlaylists);
        setUsers(allUsers);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setLoading(false);
      }
    },
    [query, selectedSources]
  );

  useEffect(() => {
    // Очищаем результаты при изменении запроса
    if (query.trim().length === 0) {
      setTracks([]);
      setPlaylists([]);
      setUsers([]);
      setSearched(false);
      return;
    }
    
    // Debounce 400ms для стабильности
    const timer = setTimeout(() => {
      if (query.trim().length >= 2) {
        // НЕ очищаем результаты сразу - показываем старые пока грузятся новые
        handleSearch();
      }
    }, 400); // Увеличена задержка
    
    return () => clearTimeout(timer);
  }, [query, handleSearch]);

  // Handle pending search from external event (e.g., clicking artist in player)
  useEffect(() => {
    if (pendingSearch) {
      handleSearch(pendingSearch);
      setPendingSearch(null);
    }
  }, [pendingSearch, handleSearch]);

  const handlePlayTrack = async (track: Track, index: number) => {
    let streamUrl: string | null = null;
    let trackToPlay = track;

    // Показываем что загружаем
    if (track.platform === "youtube") {
      window.dispatchEvent(
        new CustomEvent("show-toast", {
          detail: { message: "Загрузка YouTube трека...", type: "info" },
        })
      );
    }

    // Get stream URL based on platform
    if (track.platform === "youtube") {
      const videoId = track.id.replace("yt-", "");
      streamUrl = await youtubeService.getStreamUrl(videoId);

      // Fallback на SoundCloud если YouTube не работает
      if (!streamUrl) {
        console.log("[Search] YouTube failed, trying SoundCloud fallback...");
        window.dispatchEvent(
          new CustomEvent("show-toast", {
            detail: { message: "Ищем на SoundCloud...", type: "info" },
          })
        );

        const searchQuery = `${track.artist} ${track.title}`.substring(0, 60);
        const scResults = await soundCloudService.search(searchQuery, 5);

        if (scResults.tracks.length > 0) {
          const scTrack = scResults.tracks[0];
          streamUrl = await soundCloudService.getStreamUrl(
            scTrack.id.replace("sc-", "")
          );
          if (streamUrl) {
            trackToPlay = { ...scTrack, streamUrl };
            console.log(
              "[Search] Playing from SoundCloud instead:",
              scTrack.title
            );
          }
        }
      }
    } else if (track.platform === "spotify") {
      // Spotify tracks need to be played via SoundCloud/YouTube
      const playableTrack = await spotifyService.getPlayableTrack(track);
      if (playableTrack) {
        trackToPlay = playableTrack;
        streamUrl = playableTrack.streamUrl;
      }
    } else if (track.platform === "soundcloud") {
      // Use fallback service for SoundCloud tracks for better reliability
      const { streamFallbackService } = await import("../../services/StreamFallbackService");
      const result = await streamFallbackService.getStreamUrl(track);
      if (result.streamUrl) {
        streamUrl = result.streamUrl;
        if (result.fallbackTrack) {
          trackToPlay = result.fallbackTrack;
        }
      }
    } else if (track.platform === "yandex") {
      // Yandex Music tracks
      streamUrl = await yandexMusicService.getStreamUrl(track.id);
      if (streamUrl) {
        trackToPlay = { ...track, streamUrl };
      }
    } else if (track.platform === "vk") {
      // VK Music tracks - stream URL is already in track
      streamUrl = track.streamUrl;
    } else {
      // For other platforms, try to get stream URL directly
      streamUrl = track.streamUrl || null;
    }

    if (streamUrl) {
      const { clearQueue, addToQueue } = useQueueStore.getState();
      clearQueue();
      tracks
        .slice(index + 1)
        .forEach((t) => addToQueue({ ...t, streamUrl: "" }));
      audioService.load({ ...trackToPlay, streamUrl });
    } else {
      window.dispatchEvent(
        new CustomEvent("show-toast", {
          detail: { message: "Не удалось загрузить трек", type: "error" },
        })
      );
    }
  };

  const handleAddToQueue = async (track: Track) => {
    let streamUrl: string | null = null;
    let trackToAdd = track;

    if (track.platform === "youtube") {
      const videoId = track.id.replace("yt-", "");
      streamUrl = await youtubeService.getStreamUrl(videoId);

      // Fallback на SoundCloud
      if (!streamUrl) {
        const searchQuery = `${track.artist} ${track.title}`.substring(0, 60);
        const scResults = await soundCloudService.search(searchQuery, 3);
        if (scResults.tracks.length > 0) {
          const scTrack = scResults.tracks[0];
          const { streamFallbackService } = await import("../../services/StreamFallbackService");
          const result = await streamFallbackService.getStreamUrl(scTrack);
          if (result.streamUrl) {
            streamUrl = result.streamUrl;
            trackToAdd = result.fallbackTrack || scTrack;
          }
        }
      }
    } else if (track.platform === "soundcloud") {
      // Use fallback service for SoundCloud tracks
      const { streamFallbackService } = await import("../../services/StreamFallbackService");
      const result = await streamFallbackService.getStreamUrl(track);
      if (result.streamUrl) {
        streamUrl = result.streamUrl;
        trackToAdd = result.fallbackTrack || track;
      }
    } else if (track.platform === "spotify") {
      const playableTrack = await spotifyService.getPlayableTrack(track);
      if (playableTrack) {
        trackToAdd = playableTrack;
        streamUrl = playableTrack.streamUrl;
      }
    } else if (track.platform === "yandex") {
      streamUrl = await yandexMusicService.getStreamUrl(track.id);
      if (streamUrl) {
        trackToAdd = { ...track, streamUrl };
      }
    } else if (track.platform === "vk") {
      streamUrl = track.streamUrl;
    } else {
      // For other platforms
      streamUrl = track.streamUrl || null;
    }

    if (streamUrl) addToQueue({ ...trackToAdd, streamUrl });
  };

  const handleDownloadTrack = async (track: Track) => {
    let streamUrl: string | null = null;
    let trackToDownload = track;

    window.dispatchEvent(
      new CustomEvent("show-toast", {
        detail: { message: `Подготовка: ${track.title}`, type: "info" },
      })
    );

    // Get stream URL based on platform
    if (track.platform === "youtube") {
      const videoId = track.id.replace("yt-", "");
      streamUrl = await youtubeService.getStreamUrl(videoId);

      if (!streamUrl) {
        const searchQuery = `${track.artist} ${track.title}`.substring(0, 60);
        const scResults = await soundCloudService.search(searchQuery, 3);
        if (scResults.tracks.length > 0) {
          const scTrack = scResults.tracks[0];
          streamUrl = await soundCloudService.getStreamUrl(
            scTrack.id.replace("sc-", "")
          );
          if (streamUrl) trackToDownload = { ...scTrack, streamUrl };
        }
      }
    } else if (track.platform === "spotify") {
      const playableTrack = await spotifyService.getPlayableTrack(track);
      if (playableTrack) {
        trackToDownload = playableTrack;
        streamUrl = playableTrack.streamUrl;
      }
    } else {
      streamUrl = await soundCloudService.getStreamUrl(
        track.id.replace("sc-", "")
      );
    }

    if (streamUrl) {
      await downloadService.downloadTrack({ ...trackToDownload, streamUrl });
    } else {
      window.dispatchEvent(
        new CustomEvent("show-toast", {
          detail: {
            message: "Не удалось получить ссылку для скачивания",
            type: "error",
          },
        })
      );
    }
  };

  const handleAddToPlaylist = (playlistId: string) => {
    if (!showAddToPlaylist) return;
    playlistService.addTrackToPlaylist(playlistId, showAddToPlaylist);
    setShowAddToPlaylist(null);
  };

  const formatDuration = (seconds: number) =>
    `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60)
      .toString()
      .padStart(2, "0")}`;

  const tabs: {
    id: TabType;
    label: string;
    count: number;
    icon: typeof HiOutlineMusicalNote;
  }[] = [
    {
      id: "tracks",
      label: "Треки",
      count: tracks.length,
      icon: HiOutlineMusicalNote,
    },
    {
      id: "playlists",
      label: "Плейлисты",
      count: playlists.length,
      icon: HiOutlineQueueList,
    },
    { id: "users", label: "Артисты", count: users.length, icon: HiOutlineUser },
  ];

  return (
    <div className="flex flex-col h-full animate-fade-in relative">
      {/* Search Activity Indicator - REMOVED */}

      {/* Giant Search Bar */}
      <div className="p-6 pb-0">
        <div className="rounded-2xl p-4" style={{ background: "var(--surface-card)", border: "1px solid var(--border-base)" }}>
          {/* Search Input */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 relative">
              <HiOutlineMagnifyingGlass 
                size={20} 
                className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: colors.textSecondary }}
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && query.trim()) {
                    handleSearch();
                  }
                }}
                placeholder="Поиск треков, артистов, плейлистов..."
                className="w-full pl-12 pr-4 py-3 rounded-xl text-base outline-none transition-all"
                style={{
                  background: "var(--surface-elevated)",
                  color: colors.textPrimary,
                  border: `2px solid ${query ? colors.accent : "transparent"}`,
                }}
              />
            </div>
          </div>

          {/* Tabs and Controls */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Category Tabs */}
            <div className="flex gap-2 p-1 rounded-xl" style={{ background: "var(--surface-elevated)" }}>
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                    style={{
                      background: isActive ? "var(--interactive-accent)" : "transparent",
                      color: isActive ? "var(--interactive-accent-text)" : colors.textSecondary,
                    }}
                  >
                    <tab.icon size={16} />
                    {tab.label}
                    {searched && tab.count > 0 && (
                      <span 
                        className="px-1.5 py-0.5 rounded text-xs" 
                        style={{ 
                          background: isActive ? "rgba(0,0,0,0.2)" : "var(--surface-card)",
                          color: isActive ? "var(--interactive-accent-text)" : colors.textSecondary
                        }}
                      >
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="h-6 w-px mx-1" style={{ background: "var(--border-base)" }} />

            {/* Service Toggles */}
            <div className="flex gap-2">
              {[
                { id: "soundcloud" as SearchSource, icon: SiSoundcloud, color: "#FF5500", label: "SoundCloud" },
                { id: "youtube" as SearchSource, icon: SiYoutube, color: "#FF0000", label: "YouTube", enabled: youtubeService.isEnabled() },
                { id: "spotify" as SearchSource, icon: SiSpotify, color: "#1DB954", label: "Spotify", enabled: spotifyService.isConnected() },
                { id: "vk" as SearchSource, icon: SiVk, color: "#0077FF", label: "VK Music", enabled: vkMusicService.isEnabled() },
                { id: "yandex" as SearchSource, icon: null, color: "#FFCC00", label: "Яндекс Музыка", enabled: yandexMusicService.isEnabled(), isYandex: true },
              ].filter(s => s.enabled !== false).map((service) => {
                const isSelected = selectedSources.includes(service.id);
                const IconComponent = service.icon;
                return (
                  <button
                    key={service.id}
                    onClick={() => {
                      if (isSelected && selectedSources.length === 1) return;
                      handleSourcesChange(
                        isSelected
                          ? selectedSources.filter(s => s !== service.id)
                          : [...selectedSources, service.id]
                      );
                    }}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all"
                    style={{
                      background: isSelected ? `${service.color}20` : "var(--surface-elevated)",
                      border: `1px solid ${isSelected ? service.color : "var(--border-base)"}`,
                      color: isSelected ? service.color : colors.textSecondary,
                      opacity: !isSelected ? 0.6 : 1,
                    }}
                    title={service.label}
                  >
                    {(service as any).isYandex ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width={16} height={16} viewBox="0 0 50 50">
                        <path fill="#FFCC00" d="M 21.833984 2.2246094 C 11.968984 3.6656094 2.0332031 11.919266 2.0332031 25.072266 C 2.0332031 37.853266 12.356141 48 24.994141 48 C 39.232141 48 51.795844 34.161797 46.964844 18.216797 C 46.756844 17.531797 45.929094 17.260984 45.371094 17.708984 L 41.091797 21.142578 C 40.801797 21.374578 40.673234 21.746328 40.740234 22.111328 C 40.911234 23.049328 41 24.018 41 25 C 41 34.102 33.409937 41.421469 24.210938 40.980469 C 16.699938 40.620469 9.6656875 33.836797 9.0546875 26.341797 C 8.3656875 17.888797 14.256344 10.672812 22.152344 9.2578125 C 22.638344 9.1718125 23 8.7664375 23 8.2734375 L 23 3.2128906 C 23 2.5938906 22.445984 2.1356094 21.833984 2.2246094 z M 30.017578 2.5878906 C 29.47274 2.5848828 29 3.0147656 29 3.5878906 L 29 18.078125 C 27.822 17.396125 26.459 17 25 17 C 20.582 17 17 20.582 17 25 C 17 29.418 20.582 33 25 33 C 29.418 33 33 29.418 33 25 L 33 11.150391 C 34.612 12.083391 36.051141 13.279313 37.244141 14.695312 C 37.679141 15.212312 38.488609 15.161844 38.849609 14.589844 L 41.615234 10.214844 C 41.861234 9.8268438 41.818094 9.3104688 41.496094 8.9804688 C 40.422094 7.8784687 36.703906 4.1571875 30.253906 2.6171875 C 30.174281 2.5983125 30.095412 2.5883203 30.017578 2.5878906 z"/>
                      </svg>
                    ) : IconComponent ? (
                      <IconComponent size={16} />
                    ) : null}
                    <span className="hidden sm:inline">{service.label}</span>
                  </button>
                );
              })}
            </div>

            {/* View Mode Toggle */}
            {searched && activeTab === "tracks" && (
              <>
                <div className="h-6 w-px mx-1" style={{ background: "var(--border-base)" }} />
                <div className="flex gap-1 p-1 rounded-lg" style={{ background: "var(--surface-elevated)" }}>
                  <button
                    onClick={() => { setViewMode("list"); localStorage.setItem("harmonix-search-view", "list"); }}
                    className="p-2 rounded-md transition-all"
                    style={{ background: viewMode === "list" ? "var(--interactive-accent)" : "transparent", color: viewMode === "list" ? "white" : colors.textSecondary }}
                  >
                    <HiOutlineBars3 size={18} />
                  </button>
                  <button
                    onClick={() => { setViewMode("grid"); localStorage.setItem("harmonix-search-view", "grid"); }}
                    className="p-2 rounded-md transition-all"
                    style={{ background: viewMode === "grid" ? "var(--interactive-accent)" : "transparent", color: viewMode === "grid" ? "white" : colors.textSecondary }}
                  >
                    <HiOutlineSquares2X2 size={18} />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {!searched ? (
          <div className="space-y-6">
            {/* Search History - Horizontal Scroll with Tracks */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold" style={{ color: colors.textSecondary }}>
                  История поиска
                </h2>
                {(searchHistoryTracks.length > 0 || searchHistory.length > 0) && (
                  <button 
                    onClick={() => {
                      clearHistory();
                      setSearchHistoryTracks([]);
                      localStorage.removeItem("harmonix-search-history-tracks");
                    }} 
                    className="text-xs transition-colors hover:opacity-70" 
                    style={{ color: colors.textSecondary }}
                  >
                    Очистить
                  </button>
                )}
              </div>
              {(searchHistoryTracks.length > 0 || searchHistory.length > 0) ? (
                <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
                  {/* Show tracks from history */}
                  {searchHistoryTracks.map((track, i) => (
                    <div
                      key={`track-${track.id}-${i}`}
                      className="flex-shrink-0 w-[120px] cursor-pointer group"
                      onClick={() => handlePlayTrack(track, 0)}
                    >
                      <div 
                        className="aspect-square rounded-xl mb-2 overflow-hidden relative transition-all group-hover:scale-105 shadow-md"
                        style={{ background: "var(--surface-elevated)" }}
                      >
                        {track.artworkUrl ? (
                          <img src={track.artworkUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <HiOutlineMusicalNote size={28} style={{ color: colors.textSecondary }} />
                          </div>
                        )}
                        {/* Service icon */}
                        <div className="absolute bottom-1.5 right-1.5 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center">
                          <ServiceIcon platform={getTrackPlatform(track)} size={10} />
                        </div>
                        {/* Play overlay */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <HiOutlinePlay size={24} style={{ color: "var(--interactive-accent)" }} />
                        </div>
                      </div>
                      <p className="text-xs font-medium truncate" style={{ color: colors.textPrimary }}>{track.title}</p>
                      <p className="text-xs truncate" style={{ color: colors.textSecondary }}>{track.artist}</p>
                    </div>
                  ))}
                  {/* Show text queries */}
                  {searchHistory.map((term, i) => (
                    <div
                      key={`term-${term}-${i}`}
                      className="flex-shrink-0 w-[120px] cursor-pointer group"
                      onClick={() => { setQuery(term); handleSearch(term); }}
                    >
                      <div 
                        className="aspect-square rounded-xl mb-2 flex items-center justify-center relative overflow-hidden transition-all group-hover:scale-105 shadow-md"
                        style={{ background: "var(--surface-elevated)" }}
                      >
                        <HiOutlineMagnifyingGlass size={28} style={{ color: colors.textSecondary }} className="opacity-50" />
                        <button
                          onClick={(e) => { e.stopPropagation(); removeFromHistory(term); }}
                          className="absolute top-1 right-1 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ background: "rgba(0,0,0,0.6)", color: "white" }}
                        >
                          <HiOutlineXMark size={12} />
                        </button>
                      </div>
                      <p className="text-xs font-medium truncate" style={{ color: colors.textPrimary }}>{term}</p>
                      <p className="text-xs truncate" style={{ color: colors.textSecondary }}>Запрос</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 rounded-xl" style={{ background: "var(--surface-card)" }}>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>История пуста</p>
                </div>
              )}
            </div>

            {/* Recommendations - Based on search history tracks */}
            {shuffledRecommendations.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold mb-3" style={{ color: colors.textSecondary }}>
                  Рекомендации
                </h2>
                <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
                  {/* Use stable shuffled recommendations */}
                  {shuffledRecommendations.map((track, i) => (
                    <div
                      key={`rec-${track.id}-${i}`}
                      className="flex-shrink-0 w-[120px] cursor-pointer group"
                      onClick={() => handlePlayTrack(track, 0)}
                    >
                      <div 
                        className="aspect-square rounded-xl mb-2 overflow-hidden relative transition-all group-hover:scale-105 shadow-md"
                        style={{ background: "var(--surface-elevated)" }}
                      >
                        {track.artworkUrl ? (
                          <img src={track.artworkUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <HiOutlineMusicalNote size={28} style={{ color: colors.textSecondary }} />
                          </div>
                        )}
                        {/* Service icon */}
                        <div className="absolute bottom-1.5 right-1.5 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center">
                          <ServiceIcon platform={getTrackPlatform(track)} size={10} />
                        </div>
                        {/* Play overlay */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <HiOutlinePlay size={24} style={{ color: "var(--interactive-accent)" }} />
                        </div>
                      </div>
                      <p className="text-xs font-medium truncate" style={{ color: colors.textPrimary }}>{track.title}</p>
                      <p className="text-xs truncate" style={{ color: colors.textSecondary }}>{track.artist}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Loading */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: "var(--border-base)", borderTopColor: colors.accent }} />
              </div>
            )}

            {/* Results */}
            {!loading && activeTab === "tracks" && (
              viewMode === "grid" ? (
                /* Grid View */
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {tracks.map((track, index) => (
                    <div
                      key={track.id}
                      className="rounded-xl p-3 transition-all cursor-pointer group hover:scale-[1.02]"
                      style={{ background: "var(--surface-card)", border: "1px solid var(--border-base)" }}
                      onClick={() => handlePlayTrack(track, index)}
                    >
                      <div className="aspect-square rounded-lg overflow-hidden mb-3 relative" style={{ background: "var(--surface-elevated)" }}>
                        {track.artworkUrl ? (
                          <img src={track.artworkUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <HiOutlineMusicalNote size={32} style={{ color: colors.textSecondary }} />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg" style={{ background: "var(--interactive-accent)", color: "var(--interactive-accent-text)" }}>
                            <HiOutlinePlay size={24} className="ml-1" />
                          </div>
                        </div>
                        {/* Service icon - larger for big covers */}
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/70 flex items-center justify-center">
                          <ServiceIcon platform={getTrackPlatform(track)} size={12} />
                        </div>
                      </div>
                      <p className="text-sm font-medium truncate mb-0.5" style={{ color: colors.textPrimary }}>{track.title}</p>
                      <p className="text-xs truncate" style={{ color: colors.textSecondary }}>{track.artist}</p>
                      {/* Actions */}
                      <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleLikeTrack(track); }}
                          className="p-1.5 rounded-lg transition-colors"
                          style={{ background: "var(--surface-elevated)", color: likedIds.has(track.id) ? "#f87171" : colors.textSecondary }}
                        >
                          {likedIds.has(track.id) ? <HiOutlineHeart size={14} className="fill-current" /> : <HiOutlineHeart size={14} />}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleAddToQueue(track); }}
                          className="p-1.5 rounded-lg transition-colors"
                          style={{ background: "var(--surface-elevated)", color: colors.textSecondary }}
                        >
                          <HiOutlineQueueList size={14} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setShowAddToPlaylist(track); }}
                          className="p-1.5 rounded-lg transition-colors"
                          style={{ background: "var(--surface-elevated)", color: colors.textSecondary }}
                        >
                          <HiOutlinePlus size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* List View */
                <div className="rounded-2xl overflow-hidden" style={{ background: "var(--surface-card)", border: "1px solid var(--border-base)" }}>
                  {tracks.length === 0 ? (
                    <div className="text-center py-12">
                      <HiOutlineMusicalNote size={40} style={{ color: colors.textSecondary }} className="mx-auto mb-3 opacity-50" />
                      <p className="font-medium mb-1" style={{ color: colors.textPrimary }}>Ничего не найдено</p>
                      <p className="text-sm" style={{ color: colors.textSecondary }}>Попробуйте другой запрос</p>
                    </div>
                  ) : (
                    tracks.map((track, index) => (
                      <div
                        key={track.id}
                        className="flex items-center gap-4 p-3 transition-all cursor-pointer group border-b last:border-b-0"
                        style={{ borderColor: "var(--border-base)" }}
                        onClick={() => handlePlayTrack(track, index)}
                      >
                        <span className="w-6 text-center text-sm font-medium" style={{ color: colors.textSecondary }}>
                          {index + 1}
                        </span>
                        <div className="w-12 h-12 rounded-lg overflow-hidden relative flex-shrink-0" style={{ background: "var(--surface-elevated)" }}>
                          {track.artworkUrl ? (
                            <img src={track.artworkUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <HiOutlineMusicalNote size={20} style={{ color: colors.textSecondary }} />
                            </div>
                          )}
                          {/* Service icon */}
                          <div className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full bg-black/70 flex items-center justify-center">
                            <ServiceIcon platform={getTrackPlatform(track)} size={8} />
                          </div>
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <HiOutlinePlay size={18} style={{ color: "var(--interactive-accent)" }} />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate" style={{ color: colors.textPrimary }}>{track.title}</p>
                          <p className="text-sm truncate" style={{ color: colors.textSecondary }}>{track.artist}</p>
                        </div>
                        <span className="text-sm" style={{ color: colors.textSecondary }}>{formatDuration(track.duration || 0)}</span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleLikeTrack(track); }}
                            className="p-2 rounded-lg transition-colors hover:bg-white/10"
                            style={{ color: likedIds.has(track.id) ? "#f87171" : colors.textSecondary }}
                          >
                            {likedIds.has(track.id) ? <HiOutlineHeart size={16} className="fill-current" /> : <HiOutlineHeart size={16} />}
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleAddToQueue(track); }}
                            className="p-2 rounded-lg transition-colors hover:bg-white/10"
                            style={{ color: colors.textSecondary }}
                          >
                            <HiOutlineQueueList size={16} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setShowAddToPlaylist(track); }}
                            className="p-2 rounded-lg transition-colors hover:bg-white/10"
                            style={{ color: colors.textSecondary }}
                          >
                            <HiOutlinePlus size={16} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDownloadTrack(track); }}
                            className="p-2 rounded-lg transition-colors hover:bg-white/10"
                            style={{ color: colors.textSecondary }}
                          >
                            <HiOutlineArrowDownTray size={16} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )
            )}

            {/* Playlists */}
            {!loading && activeTab === "playlists" && (
              <div className="space-y-4 rounded-2xl p-4" style={{ background: "var(--surface-card)", border: "1px solid var(--border-base)" }}>
                {playlists.length === 0 ? (
                  <div className="text-center py-12">
                    <HiOutlineQueueList size={48} className="mx-auto mb-4 opacity-50" style={{ color: colors.textSecondary }} />
                    <p style={{ color: colors.textSecondary }}>Плейлисты не найдены</p>
                  </div>
                ) : (
                  playlists.map((playlist) => (
                    <div
                      key={playlist.id}
                      onClick={() => handleOpenPlaylist(playlist)}
                      className="flex items-center gap-4 p-3 rounded-xl transition-all cursor-pointer group hover:scale-[1.01]"
                      style={{ background: "var(--surface-elevated)" }}
                    >
                      <div className="w-16 h-16 rounded-xl overflow-hidden relative flex-shrink-0" style={{ background: "var(--surface-card)" }}>
                        {playlist.artworkUrl ? (
                          <img src={playlist.artworkUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <HiOutlineQueueList size={24} style={{ color: colors.textSecondary }} />
                          </div>
                        )}
                        {/* Service icon */}
                        <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center">
                          <ServiceIcon platform="soundcloud" size={10} />
                        </div>
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <HiOutlinePlay size={20} style={{ color: "var(--interactive-accent)" }} />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate" style={{ color: colors.textPrimary }}>{playlist.title}</p>
                        <p className="text-sm" style={{ color: colors.textSecondary }}>
                          {playlist.trackCount} треков {playlist.creator && `• ${playlist.creator.username}`}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Users */}
            {!loading && activeTab === "users" && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {users.length === 0 ? (
                  <div className="col-span-full text-center py-12 rounded-2xl" style={{ background: "var(--surface-card)", border: "1px solid var(--border-base)" }}>
                    <HiOutlineUser size={48} className="mx-auto mb-4 opacity-50" style={{ color: colors.textSecondary }} />
                    <p style={{ color: colors.textSecondary }}>Артисты не найдены</p>
                  </div>
                ) : (
                  [...users].sort((a, b) => (b.verified ? 1 : 0) - (a.verified ? 1 : 0)).map((user) => (
                    <div
                      key={user.id}
                      onClick={() => handleOpenArtist(user)}
                      className="rounded-2xl p-4 text-center transition-all cursor-pointer hover:scale-[1.02] group"
                      style={{ background: "var(--surface-card)", border: "1px solid var(--border-base)" }}
                    >
                      <div className="w-20 h-20 rounded-full mx-auto mb-3 overflow-hidden relative" style={{ background: "var(--surface-elevated)" }}>
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <HiOutlineUser size={32} style={{ color: colors.textSecondary }} />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-full">
                          <HiOutlinePlay size={24} style={{ color: "var(--interactive-accent)" }} />
                        </div>
                      </div>
                      <div className="flex items-center justify-center gap-1.5 mb-1">
                        <p className="font-medium truncate" style={{ color: colors.textPrimary }}>{user.username}</p>
                        {user.verified && <HiOutlineCheckBadge size={16} style={{ color: colors.accent }} />}
                      </div>
                      <p className="text-xs" style={{ color: colors.textSecondary }}>{user.followersCount?.toLocaleString() || 0} подписчиков</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Artist Page Modal */}
      {selectedArtist && (
        <div
          className="fixed inset-0 z-50 flex flex-col"
          style={{ background: colors.background }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-4 p-4 border-b"
            style={{ borderColor: `${colors.textSecondary}15` }}
          >
            <button
              onClick={handleCloseArtist}
              className="p-2 rounded-xl transition-all hover:scale-105"
              style={{ background: `${colors.surface}80` }}
            >
              <HiOutlineArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full overflow-hidden"
                style={{ background: `${colors.accent}20` }}
              >
                {selectedArtist.avatarUrl ? (
                  <img
                    src={selectedArtist.avatarUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <HiOutlineUser size={20} style={{ color: colors.accent }} />
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold">
                    {selectedArtist.username}
                  </span>
                  {selectedArtist.verified && (
                    <HiOutlineCheckBadge
                      size={18}
                      style={{ color: "#3B82F6" }}
                    />
                  )}
                </div>
                <p className="text-xs" style={{ color: colors.textSecondary }}>
                  {selectedArtist.followersCount
                    ? `${(selectedArtist.followersCount / 1000).toFixed(
                        1
                      )}K подписчиков`
                    : "Артист"}
                </p>
              </div>
            </div>
          </div>

          {/* Artist Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Artist Hero */}
            <div className="flex items-center gap-6 mb-8">
              <div
                className="w-32 h-32 rounded-full overflow-hidden flex-shrink-0 shadow-xl"
                style={{ background: `${colors.accent}20` }}
              >
                {selectedArtist.avatarUrl ? (
                  <img
                    src={selectedArtist.avatarUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <HiOutlineUser size={48} style={{ color: colors.accent }} />
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold">
                    {selectedArtist.username}
                  </h1>
                  {selectedArtist.verified && (
                    <HiOutlineCheckBadge
                      size={28}
                      style={{ color: "#3B82F6" }}
                    />
                  )}
                  <SubscribeButton artist={selectedArtist} />
                </div>
                <div
                  className="flex items-center gap-4 text-sm"
                  style={{ color: colors.textSecondary }}
                >
                  {selectedArtist.followersCount && (
                    <span>
                      {(selectedArtist.followersCount / 1000).toFixed(1)}K
                      подписчиков
                    </span>
                  )}
                  {selectedArtist.trackCount && (
                    <span>{selectedArtist.trackCount} треков</span>
                  )}
                </div>
                <button
                  onClick={() =>
                    artistTracks.length > 0 &&
                    handlePlayArtistTrack(artistTracks[0], 0)
                  }
                  disabled={artistTracks.length === 0 || loadingArtist}
                  className="mt-4 px-6 py-2.5 rounded-full font-medium flex items-center gap-2 transition-all hover:scale-105 disabled:opacity-50"
                  style={{
                    background: accentStyle.background,
                    color: accentStyle.color,
                  }}
                >
                  <HiOutlinePlay size={20} className="ml-0.5" />
                  Слушать
                </button>
              </div>
            </div>

            {/* Tracks */}
            <div>
              <h2 className="text-xl font-bold mb-4">Треки</h2>
              {loadingArtist ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-4 p-3 animate-pulse"
                    >
                      <div
                        className="w-12 h-12 rounded-lg"
                        style={{ background: `${colors.surface}50` }}
                      />
                      <div className="flex-1">
                        <div
                          className="h-4 rounded w-1/3 mb-2"
                          style={{ background: `${colors.surface}50` }}
                        />
                        <div
                          className="h-3 rounded w-1/4"
                          style={{ background: `${colors.surface}50` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : artistTracks.length === 0 ? (
                <div className="text-center py-12">
                  <HiOutlineMusicalNote
                    size={48}
                    className="mx-auto mb-4 opacity-50"
                    style={{ color: colors.textSecondary }}
                  />
                  <p style={{ color: colors.textSecondary }}>Нет треков</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {artistTracks.map((track, index) => (
                    <div
                      key={track.id}
                      onClick={() => handlePlayArtistTrack(track, index)}
                      className="flex items-center gap-4 p-3 rounded-xl group cursor-pointer transition-all"
                      style={{ background: "transparent" }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = `${colors.surface}50`)
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                    >
                      <div
                        className="w-12 h-12 rounded-lg overflow-hidden relative flex-shrink-0"
                        style={{ background: `${colors.surface}80` }}
                      >
                        {track.artworkUrl ? (
                          <img
                            src={track.artworkUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div
                            className="w-full h-full flex items-center justify-center"
                            style={{ background: `${colors.accent}20` }}
                          >
                            <HiOutlineMusicalNote
                              size={20}
                              style={{ color: colors.accent }}
                            />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <HiOutlinePlay size={18} style={{ color: "var(--interactive-accent)" }} />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="font-medium truncate"
                          style={{ color: colors.textPrimary }}
                        >
                          {track.title}
                        </p>
                        <p
                          className="text-sm truncate"
                          style={{ color: colors.textSecondary }}
                        >
                          {track.artist}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLikeTrack(track);
                          }}
                          className="p-2 rounded-lg transition-colors"
                          style={{
                            color: likedIds.has(track.id)
                              ? colors.error
                              : colors.textSecondary,
                            background: likedIds.has(track.id)
                              ? `${colors.error}20`
                              : "transparent",
                          }}
                        >
                          <HiOutlineHeart size={18} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToQueue(track);
                          }}
                          className="p-2 rounded-lg transition-colors hover:opacity-70"
                          style={{ color: colors.textSecondary }}
                        >
                          <HiOutlineQueueList size={18} />
                        </button>
                      </div>
                      <div
                        className="text-sm"
                        style={{ color: colors.textSecondary }}
                      >
                        {formatDuration(track.duration)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add to Playlist Modal */}
      {showAddToPlaylist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
          <div
            className="rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-scale-in"
            style={{
              background: colors.surface,
              border: `1px solid ${colors.accent}20`,
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Добавить в плейлист</h3>
              <button
                onClick={() => setShowAddToPlaylist(null)}
                style={{ color: colors.textSecondary }}
              >
                <HiOutlineXMark size={20} />
              </button>
            </div>

            <div
              className="flex items-center gap-3 p-3 rounded-xl mb-4"
              style={{ background: `${colors.accent}10` }}
            >
              <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                {showAddToPlaylist.artworkUrl ? (
                  <img
                    src={showAddToPlaylist.artworkUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{ background: `${colors.accent}20` }}
                  >
                    <HiOutlineMusicalNote
                      size={20}
                      style={{ color: colors.accent }}
                    />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="font-medium truncate text-sm">
                  {showAddToPlaylist.title}
                </p>
                <p
                  className="text-xs truncate"
                  style={{ color: colors.textSecondary }}
                >
                  {showAddToPlaylist.artist}
                </p>
              </div>
            </div>

            {userPlaylists.length === 0 ? (
              <div className="text-center py-8">
                <HiOutlineQueueList
                  size={40}
                  className="mx-auto mb-3"
                  style={{ color: colors.textSecondary }}
                />
                <p className="text-sm" style={{ color: colors.textSecondary }}>
                  Нет плейлистов
                </p>
                <p
                  className="text-xs mt-1"
                  style={{ color: colors.textSecondary }}
                >
                  Сначала создайте плейлист
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {/* Offline option */}
                <button
                  onClick={() => {
                    if (showAddToPlaylist) {
                      offlineTracksService.addOfflineTrack(showAddToPlaylist);
                      window.dispatchEvent(new CustomEvent("show-toast", {
                        detail: { message: "Добавлено в оффлайн", type: "success" }
                      }));
                      setShowAddToPlaylist(null);
                    }
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left hover:scale-[1.02]"
                  style={{
                    background: `${colors.accent}10`,
                    cursor: "pointer",
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{
                      background: colors.surface,
                    }}
                  >
                    <HiOutlineSignalSlash
                      size={16}
                      style={{ color: colors.textSecondary }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">Оффлайн</p>
                    <p className="text-xs" style={{ color: colors.textSecondary }}>
                      Локальная коллекция
                    </p>
                  </div>
                </button>
                
                {userPlaylists.map((playlist) => {
                  const isInPlaylist = playlist.tracks?.some(
                    (t) => t.id === showAddToPlaylist?.id
                  );
                  return (
                    <button
                      key={playlist.id}
                      onClick={() =>
                        !isInPlaylist && handleAddToPlaylist(playlist.id)
                      }
                      disabled={isInPlaylist}
                      className="w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left"
                      style={{
                        background: isInPlaylist
                          ? `${colors.accent}20`
                          : `${colors.accent}10`,
                        cursor: isInPlaylist ? "default" : "pointer",
                      }}
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{
                          background: `linear-gradient(135deg, ${colors.accent}, ${colors.secondary})`,
                        }}
                      >
                        <HiOutlineMusicalNote
                          size={16}
                          className="text-white/70"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate text-sm">
                          {playlist.name}
                        </p>
                        <p
                          className="text-xs"
                          style={{ color: colors.textSecondary }}
                        >
                          {playlist.tracks?.length || 0} треков
                        </p>
                      </div>
                      {isInPlaylist && (
                        <HiOutlineCheck
                          size={18}
                          style={{ color: colors.accent }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Playlist View Modal */}
      {selectedPlaylist && (
        <div
          className="fixed inset-0 z-50 flex flex-col"
          style={{ background: colors.background }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-4 p-4 border-b"
            style={{ borderColor: `${colors.textSecondary}15` }}
          >
            <button
              onClick={handleClosePlaylist}
              className="p-2 rounded-xl transition-all hover:scale-105"
              style={{ background: `${colors.surface}80` }}
            >
              <HiOutlineArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-3 flex-1">
              <div
                className="w-10 h-10 rounded-lg overflow-hidden"
                style={{ background: `${colors.accent}20` }}
              >
                {selectedPlaylist.artworkUrl ? (
                  <img
                    src={selectedPlaylist.artworkUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <HiOutlineQueueList
                      size={20}
                      style={{ color: colors.accent }}
                    />
                  </div>
                )}
              </div>
              <div>
                <span className="font-semibold">{selectedPlaylist.title}</span>
                <p className="text-xs" style={{ color: colors.textSecondary }}>
                  {selectedPlaylist.trackCount} треков
                </p>
              </div>
            </div>
            <button
              onClick={handleSavePlaylistToLibrary}
              className="px-4 py-2 rounded-xl font-medium text-sm flex items-center gap-2 transition-all hover:scale-105"
              style={{ background: "var(--interactive-accent)", color: "var(--interactive-accent-text)" }}
            >
              <HiOutlinePlus size={16} />
              Сохранить
            </button>
          </div>

          {/* Playlist Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Playlist Hero */}
            <div className="flex items-center gap-6 mb-8">
              <div
                className="w-32 h-32 rounded-xl overflow-hidden flex-shrink-0 shadow-xl"
                style={{ background: `${colors.accent}20` }}
              >
                {selectedPlaylist.artworkUrl ? (
                  <img
                    src={selectedPlaylist.artworkUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <HiOutlineQueueList
                      size={48}
                      style={{ color: colors.accent }}
                    />
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  {selectedPlaylist.title}
                </h1>
                <div
                  className="flex items-center gap-4 text-sm"
                  style={{ color: colors.textSecondary }}
                >
                  {selectedPlaylist.creator && (
                    <span className="flex items-center gap-1.5">
                      <HiOutlineUser size={14} />
                      {selectedPlaylist.creator.username}
                    </span>
                  )}
                  <span>{selectedPlaylist.trackCount} треков</span>
                </div>
                <button
                  onClick={() =>
                    playlistTracks.length > 0 &&
                    handlePlayPlaylistTrack(playlistTracks[0], 0)
                  }
                  disabled={playlistTracks.length === 0 || loadingPlaylist}
                  className="mt-4 px-6 py-2.5 rounded-full font-medium flex items-center gap-2 transition-all hover:scale-105 disabled:opacity-50"
                  style={{
                    background: accentStyle.background,
                    color: accentStyle.color,
                  }}
                >
                  <HiOutlinePlay size={20} className="ml-0.5" />
                  Слушать
                </button>
              </div>
            </div>

            {/* Tracks */}
            <div>
              <h2 className="text-xl font-bold mb-4">Треки</h2>
              {loadingPlaylist ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-4 p-3 animate-pulse"
                    >
                      <div
                        className="w-12 h-12 rounded-lg"
                        style={{ background: `${colors.surface}50` }}
                      />
                      <div className="flex-1">
                        <div
                          className="h-4 rounded w-1/3 mb-2"
                          style={{ background: `${colors.surface}50` }}
                        />
                        <div
                          className="h-3 rounded w-1/4"
                          style={{ background: `${colors.surface}50` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : playlistTracks.length === 0 ? (
                <div className="text-center py-12">
                  <HiOutlineMusicalNote
                    size={48}
                    className="mx-auto mb-4 opacity-50"
                    style={{ color: colors.textSecondary }}
                  />
                  <p style={{ color: colors.textSecondary }}>Нет треков</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {playlistTracks.map((track, index) => (
                    <div
                      key={track.id}
                      onClick={() => handlePlayPlaylistTrack(track, index)}
                      className="flex items-center gap-4 p-3 rounded-xl group cursor-pointer transition-all"
                      style={{ background: "transparent" }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = `${colors.surface}50`)
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                    >
                      <div
                        className="w-12 h-12 rounded-lg overflow-hidden relative flex-shrink-0"
                        style={{ background: `${colors.surface}80` }}
                      >
                        {track.artworkUrl ? (
                          <img
                            src={track.artworkUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div
                            className="w-full h-full flex items-center justify-center"
                            style={{ background: `${colors.accent}20` }}
                          >
                            <HiOutlineMusicalNote
                              size={20}
                              style={{ color: colors.accent }}
                            />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <HiOutlinePlay size={18} style={{ color: "var(--interactive-accent)" }} />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="font-medium truncate"
                          style={{ color: colors.textPrimary }}
                        >
                          {track.title}
                        </p>
                        <p
                          className="text-sm truncate"
                          style={{ color: colors.textSecondary }}
                        >
                          {track.artist}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLikeTrack(track);
                          }}
                          className="p-2 rounded-lg transition-colors"
                          style={{
                            color: likedIds.has(track.id)
                              ? colors.error
                              : colors.textSecondary,
                            background: likedIds.has(track.id)
                              ? `${colors.error}20`
                              : "transparent",
                          }}
                        >
                          <HiOutlineHeart size={18} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowAddToPlaylist(track);
                          }}
                          className="p-2 rounded-lg transition-colors hover:opacity-70"
                          style={{ color: colors.textSecondary }}
                        >
                          <HiOutlinePlus size={18} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToQueue(track);
                          }}
                          className="p-2 rounded-lg transition-colors hover:opacity-70"
                          style={{ color: colors.textSecondary }}
                        >
                          <HiOutlineQueueList size={18} />
                        </button>
                      </div>
                      <div
                        className="text-sm"
                        style={{ color: colors.textSecondary }}
                      >
                        {formatDuration(track.duration)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Subscribe Button Component
function SubscribeButton({ artist }: { artist: SoundCloudUser }) {
  const { subscribe, unsubscribe, isSubscribed } = useArtistSubscriptionsStore();
  const { currentTheme } = useThemeStore();
  const { colors } = currentTheme;
  
  const subscribed = isSubscribed(artist.id);

  const handleToggle = () => {
    if (subscribed) {
      unsubscribe(artist.id);
      window.dispatchEvent(
        new CustomEvent("show-toast", {
          detail: { message: `Отписались от ${artist.username}`, type: "info" },
        })
      );
    } else {
      subscribe({
        id: artist.id,
        name: artist.username,
        avatarUrl: artist.avatarUrl,
        platform: 'soundcloud',
      });
      window.dispatchEvent(
        new CustomEvent("show-toast", {
          detail: { message: `Подписались на ${artist.username}`, type: "success" },
        })
      );
    }
  };

  return (
    <button
      onClick={handleToggle}
      className="px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5 transition-all hover:scale-105"
      style={{
        background: subscribed ? 'rgba(239,68,68,0.15)' : `${colors.accent}20`,
        border: `1px solid ${subscribed ? 'rgba(239,68,68,0.3)' : `${colors.accent}40`}`,
        color: subscribed ? '#EF4444' : colors.accent,
      }}
    >
      {subscribed ? (
        <>
          <HiOutlineBellSlash size={16} />
          Отписаться
        </>
      ) : (
        <>
          <HiOutlineBell size={16} />
          Подписаться
        </>
      )}
    </button>
  );
}
