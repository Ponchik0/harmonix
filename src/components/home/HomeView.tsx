import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  HiOutlinePlay,
  HiOutlineMusicalNote,
  HiOutlineHeart,
  HiOutlineUser,
  HiOutlineAdjustmentsHorizontal,
  HiOutlineXMark,
  HiOutlineClock,
  HiOutlineQueueList,
  HiOutlineBolt,
  HiOutlineFire,
  HiOutlineChartBar,
} from "react-icons/hi2";
import { 
  IoShuffle, 
  IoPlayOutline,
  IoCarSportOutline,
  IoBriefcaseOutline,
  IoGameControllerOutline,
  IoCafeOutline,
  IoMoonOutline,
  IoFlashOutline,
  IoHappyOutline,
  IoWaterOutline,
  IoCloudyNightOutline,
} from "react-icons/io5";
import { FaSoundcloud, FaYoutube, FaSpotify } from "react-icons/fa";
import { SiVk } from "react-icons/si";

// Canvas Wave Animation Component - optimized to pause when not visible
function WaveCanvas({ accentColor }: { accentColor: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const timeRef = useRef(0);
  const isVisibleRef = useRef(true);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      ctx.clearRect(0, 0, width, height);

      const centerY = height / 2;
      const waveCount = 5;
      const time = timeRef.current;

      for (let w = 0; w < waveCount; w++) {
        const opacity = 0.15 - w * 0.025;
        const amplitude = 15 + w * 8;
        const frequency = 0.008 - w * 0.001;
        const speed = 0.5 + w * 0.15;
        const yOffset = (w - waveCount / 2) * 12;

        ctx.beginPath();
        ctx.strokeStyle = accentColor;
        ctx.globalAlpha = opacity;
        ctx.lineWidth = 2;

        for (let x = 0; x <= width; x += 2) {
          const y =
            centerY +
            yOffset +
            Math.sin(x * frequency + time * speed) * amplitude +
            Math.sin(x * frequency * 2 + time * speed * 1.5) *
              (amplitude * 0.3);

          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }

        ctx.stroke();
      }

      ctx.globalAlpha = 1;
    },
    [accentColor]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener("resize", resize);

    // Pause animation when tab is not visible
    const handleVisibility = () => {
      isVisibleRef.current = !document.hidden;
      if (isVisibleRef.current && !animationRef.current) {
        animate();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    const animate = () => {
      if (!isVisibleRef.current) {
        animationRef.current = 0;
        return;
      }
      timeRef.current += 0.016;
      const rect = canvas.getBoundingClientRect();
      draw(ctx, rect.width, rect.height);
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", handleVisibility);
      cancelAnimationFrame(animationRef.current);
    };
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.8 }}
    />
  );
}
import { soundCloudService } from "../../services/SoundCloudService";
import { youtubeService } from "../../services/YouTubeService";
import { vkMusicService } from "../../services/VKMusicService";
import { yandexMusicService } from "../../services/YandexMusicService";
import { spotifyService } from "../../services/SpotifyService";
import { audioService } from "../../services/AudioService";
import { likedTracksService } from "../../services/LikedTracksService";
import { playlistService } from "../../services/PlaylistService";
import { useQueueStore } from "../../stores/queueStore";
import { useThemeStore } from "../../stores/themeStore";
import { useNavigationStore } from "../../stores/navigationStore";
import { ArtistReleasesSection } from "./ArtistReleasesSection";
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

// Wave settings types
type WaveActivity = "none" | "driving" | "working" | "gaming" | "relaxing" | "sleeping";
type WaveCharacter = "favorite" | "stats" | "popular";
type WaveMood = "energetic" | "happy" | "calm" | "sad";
type WaveService = "soundcloud" | "youtube" | "vk" | "yandex" | "spotify";

const WAVE_SETTINGS_KEY = "harmonix-wave-settings";
const HISTORY_KEY = "harmonix-play-history";
const HIDDEN_MIXES_KEY = "harmonix-hidden-mixes";

export function HomeView() {
  const [likedTracks, setLikedTracks] = useState<Track[]>([]);
  const [history, setHistory] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [artistMixes, setArtistMixes] = useState<
    { artist: string; tracks: Track[]; artwork: string | null }[]
  >([]);
  const [hiddenMixes, setHiddenMixes] = useState<Set<string>>(new Set());
  const [trendingTracks, setTrendingTracks] = useState<Track[]>([]);
  const [loadingWave, setLoadingWave] = useState(false);
  const [showWaveSettings, setShowWaveSettings] = useState(false);
  const [showAllMixes, setShowAllMixes] = useState(false);
  const [showAllTrending, setShowAllTrending] = useState(false);
  const [selectedMix, setSelectedMix] = useState<{ artist: string; tracks: Track[]; artwork: string | null } | null>(null);
  const [waveActivity, setWaveActivity] = useState<WaveActivity>("none");
  const [waveCharacter, setWaveCharacter] = useState<WaveCharacter>("favorite");
  const [waveMood, setWaveMood] = useState<WaveMood | null>(null);
  const [waveService, setWaveService] = useState<WaveService>("soundcloud");
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { addToQueue, clearQueue } = useQueueStore();
  const { currentTheme, currentThemeId } = useThemeStore();
  const { navigate } = useNavigationStore();
  const colors = currentTheme.colors;

  // Check if theme needs outline style (dark/amoled or light/stone/slate)
  const isDarkOutline = ["dark", "dark-amoled"].includes(currentThemeId);
  const isLightOutline = ["light", "light-stone", "light-slate"].includes(
    currentThemeId
  );

  const greeting = useMemo(() => {
    const hour = currentTime.getHours();
    if (hour >= 5 && hour < 12) return "Доброе утро";
    if (hour >= 12 && hour < 17) return "Добрый день";
    if (hour >= 17 && hour < 22) return "Добрый вечер";
    return "Доброй ночи";
  }, [currentTime]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  // Services available for wave (only connected ones) - recalculate on every render
  const services: { id: WaveService; label: string; color: string }[] = (() => {
    const allServices: { id: WaveService; label: string; color: string; isConnected: () => boolean }[] = [
      { 
        id: "soundcloud", 
        label: "SoundCloud", 
        color: "#ff5500", 
        isConnected: () => {
          try {
            const saved = localStorage.getItem("harmonix-srv-soundcloud");
            // SoundCloud is connected if there's any saved data (has fallback tokens)
            return !!saved;
          } catch {
            return false;
          }
        }
      },
      { 
        id: "youtube", 
        label: "YouTube", 
        color: "#ff0000", 
        isConnected: () => true // YouTube always available (no auth required)
      },
      { 
        id: "spotify", 
        label: "Spotify", 
        color: "#1db954", 
        isConnected: () => spotifyService.isConnected() 
      },
      { 
        id: "vk", 
        label: "VK Music", 
        color: "#0077ff", 
        isConnected: () => vkMusicService.isEnabled()
      },
      { 
        id: "yandex", 
        label: "Яндекс Музыка", 
        color: "#ffcc00", 
        isConnected: () => yandexMusicService.isEnabled()
      },
    ];
    return allServices.filter(s => s.isConnected()).map(({ id, label, color }) => ({ id, label, color }));
  })();

  useEffect(() => {
    try {
      const saved = localStorage.getItem(WAVE_SETTINGS_KEY);
      if (saved) {
        const { activity, character, mood, service } = JSON.parse(saved);
        if (activity) setWaveActivity(activity);
        if (character) setWaveCharacter(character);
        if (mood) setWaveMood(mood);
        if (service) setWaveService(service);
      }
    } catch {}
    
    // Load hidden mixes
    loadHiddenMixes();
  }, []);

  // Ensure selected service is connected, fallback to first available
  useEffect(() => {
    if (services.length > 0 && !services.find(s => s.id === waveService)) {
      setWaveService(services[0].id);
    }
  }, [services, waveService]);

  // Load hidden mixes from localStorage
  const loadHiddenMixes = () => {
    try {
      const saved = localStorage.getItem(HIDDEN_MIXES_KEY);
      if (saved) {
        setHiddenMixes(new Set(JSON.parse(saved)));
      }
    } catch {}
  };

  // Save hidden mixes to localStorage
  const saveHiddenMixes = (hidden: Set<string>) => {
    try {
      localStorage.setItem(HIDDEN_MIXES_KEY, JSON.stringify([...hidden]));
    } catch {}
  };

  // Hide mix function
  const hideMix = (artist: string) => {
    const newHidden = new Set(hiddenMixes);
    newHidden.add(artist);
    setHiddenMixes(newHidden);
    saveHiddenMixes(newHidden);
    setArtistMixes(prev => prev.filter(m => m.artist !== artist));
    
    // Show toast notification
    window.dispatchEvent(
      new CustomEvent("show-toast", {
        detail: {
          message: `Микс "${artist}" скрыт`,
          type: "info",
        },
      })
    );
  };

  const saveWaveSettings = (activity: WaveActivity, character: WaveCharacter, mood: WaveMood | null, service: WaveService) => {
    localStorage.setItem(WAVE_SETTINGS_KEY, JSON.stringify({ activity, character, mood, service }));
  };

  const favoriteArtists = useMemo(() => {
    const artistMap = new Map<
      string,
      { name: string; artwork: string | null; count: number }
    >();
    likedTracks.forEach((track) => {
      const artist = track.artist || "Unknown";
      const existing = artistMap.get(artist);
      if (existing) {
        existing.count++;
        if (!existing.artwork && track.artworkUrl)
          existing.artwork = track.artworkUrl;
      } else {
        artistMap.set(artist, {
          name: artist,
          artwork: track.artworkUrl || null,
          count: 1,
        });
      }
    });
    return Array.from(artistMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [likedTracks]);

  const loadHistory = () => {
    try {
      const saved = localStorage.getItem(HISTORY_KEY);
      if (saved) setHistory(JSON.parse(saved).slice(0, 20));
    } catch {}
  };
  const saveToHistory = (track: Track) => {
    try {
      const saved = localStorage.getItem(HISTORY_KEY);
      let hist: Track[] = saved ? JSON.parse(saved) : [];
      hist = [track, ...hist.filter((t) => t.id !== track.id)].slice(0, 50);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(hist));
    } catch {}
  };
  const loadLikedTracks = () => {
    try {
      setLikedTracks(likedTracksService.getLikedTracks());
    } catch {}
  };
  const loadPlaylists = () => {
    try {
      setPlaylists(playlistService.getAllPlaylists());
    } catch {}
  };

  const loadArtistMixes = async () => {
    const artists = favoriteArtists.slice(0, 6);
    if (artists.length === 0) return;
    const mixes: { artist: string; tracks: Track[]; artwork: string | null }[] =
      [];
    for (const artist of artists) {
      // Skip if artist is hidden
      if (hiddenMixes.has(artist.name)) continue;
      
      try {
        const results = await soundCloudService.search(artist.name, 8);
        if (results.tracks.length > 0)
          mixes.push({
            artist: artist.name,
            tracks: results.tracks,
            artwork: artist.artwork,
          });
      } catch {}
    }
    setArtistMixes(mixes);
  };

  const loadTrendingTracks = async () => {
    try {
      // Сначала пробуем получить рекомендации на основе лайков
      const liked = likedTracksService.getLikedTracks();

      if (liked.length >= 3) {
        // Берём артистов из лайков для поиска похожего
        const artists = [
          ...new Set(liked.map((t: Track) => t.artist).filter(Boolean)),
        ] as string[];
        const randomArtist =
          artists[Math.floor(Math.random() * Math.min(artists.length, 5))];

        if (randomArtist) {
          const results = await soundCloudService.search(randomArtist, 15);
          // Фильтруем уже лайкнутые треки
          const likedIds = new Set(liked.map((t: Track) => t.id));
          const filtered = results.tracks.filter((t) => !likedIds.has(t.id));

          if (filtered.length >= 6) {
            setTrendingTracks(filtered.slice(0, 12));
            return;
          }
        }
      }

      // Fallback - популярные запросы (не индийские)
      const queries = [
        "electronic music",
        "hip hop beats",
        "pop hits 2024",
        "rock music",
        "lofi beats",
        "edm",
      ];
      const query = queries[Math.floor(Math.random() * queries.length)];
      const results = await soundCloudService.search(query, 12);
      setTrendingTracks(results.tracks);
    } catch {}
  };

  useEffect(() => {
    loadLikedTracks();
    loadHistory();
    loadPlaylists();
    const handleChange = () => {
      loadLikedTracks();
      loadHistory();
    };
    window.addEventListener("liked-tracks-changed", handleChange);
    window.addEventListener("playlists-changed", loadPlaylists);
    return () => {
      window.removeEventListener("liked-tracks-changed", handleChange);
      window.removeEventListener("playlists-changed", loadPlaylists);
    };
  }, []);
  useEffect(() => {
    if (favoriteArtists.length > 0) loadArtistMixes();
  }, [favoriteArtists.length, hiddenMixes]);
  useEffect(() => {
    loadTrendingTracks();
  }, []);

  const handlePlayTrack = async (
    track: Track,
    allTracks: Track[],
    index: number
  ) => {
    try {
      let streamUrl =
        track.streamUrl ||
        (await soundCloudService.getStreamUrl(track.id.replace("sc-", "")));
      if (!streamUrl) return;
      audioService.load({ ...track, streamUrl });
      saveToHistory(track);
      clearQueue();
      for (const t of allTracks.slice(index + 1, index + 20)) {
        const url =
          t.streamUrl ||
          (await soundCloudService.getStreamUrl(t.id.replace("sc-", "")));
        if (url) addToQueue({ ...t, streamUrl: url });
      }
    } catch {}
  };

  const getMoodKeywords = (mood: WaveMood | null): string[] => {
    if (!mood) return [];
    switch (mood) {
      case "energetic":
        return ["energetic workout", "power music", "hype beats", "gym motivation", "high energy edm"];
      case "happy":
        return ["happy vibes", "feel good music", "upbeat pop", "summer hits", "dance party"];
      case "calm":
        return ["chill vibes", "relaxing music", "ambient sounds", "peaceful piano", "lo-fi chill"];
      case "sad":
        return ["sad songs", "emotional ballads", "melancholy music", "heartbreak songs", "slow emotional"];
      default:
        return [];
    }
  };

  const getActivityKeywords = (activity: WaveActivity): string[] => {
    switch (activity) {
      case "driving":
        return ["driving music", "road trip playlist", "car vibes", "highway songs", "cruising music"];
      case "working":
        return ["focus music", "study beats", "concentration music", "productivity playlist", "work music instrumental"];
      case "gaming":
        return ["gaming music", "epic gaming", "electronic gaming", "bass drops", "intense gaming soundtrack"];
      case "relaxing":
        return ["relaxing music", "chill out", "lounge music", "sunday vibes", "cozy music"];
      case "sleeping":
        return ["sleep music", "ambient sleep", "peaceful night", "soft piano sleep", "calm night sounds"];
      default:
        return [];
    }
  };

  const handleMyWave = async () => {
    setLoadingWave(true);
    try {
      const liked = likedTracksService.getLikedTracks();
      let searchQueries: string[] = [];
      const moodKeywords = getMoodKeywords(waveMood);
      const activityKeywords = getActivityKeywords(waveActivity);

      // Блок-лист для фильтрации нежелательного контента
      const blockList = [
        "bollywood", "hindi", "punjabi", "tamil", "telugu", "bhojpuri",
        "desi", "indian", "naat", "qawwali", "ghazal", "bhajan",
        "devotional", "religious", "nasheed", "islamic", "christian worship",
        "sermon", "preaching", "meditation guided", "asmr",
        "ringtone", "notification", "sound effect", "sfx"
      ];

      // Функция проверки трека на блок-лист
      const isBlockedTrack = (track: Track): boolean => {
        const titleLower = (track.title || "").toLowerCase();
        const artistLower = (track.artist || "").toLowerCase();
        const combined = `${titleLower} ${artistLower}`;
        return blockList.some(blocked => combined.includes(blocked));
      };

      // Собираем артистов из лайкнутых треков
      const likedArtists = [
        ...new Set(liked.map((t: Track) => t.artist).filter(Boolean)),
      ] as string[];

      // Считаем частоту артистов для статистики
      const artistCount = new Map<string, number>();
      liked.forEach((t: Track) => {
        if (t.artist) {
          artistCount.set(t.artist, (artistCount.get(t.artist) || 0) + 1);
        }
      });
      const topArtists = [...artistCount.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([artist]) => artist);

      // Извлекаем жанры/ключевые слова из названий треков в истории
      const historyTracks = history.slice(0, 50);
      const genreKeywords = new Map<string, number>();
      const genrePatterns = [
        "electronic", "house", "techno", "trance", "dubstep", "dnb", "drum and bass",
        "hip hop", "rap", "trap", "r&b", "rnb", "soul",
        "rock", "metal", "punk", "indie", "alternative",
        "pop", "dance", "edm", "disco", "funk",
        "jazz", "blues", "classical", "acoustic",
        "lofi", "lo-fi", "chill", "ambient", "synthwave", "retrowave",
      ];
      
      [...liked, ...historyTracks].forEach((t: Track) => {
        const titleLower = (t.title || "").toLowerCase();
        genrePatterns.forEach(genre => {
          if (titleLower.includes(genre)) {
            genreKeywords.set(genre, (genreKeywords.get(genre) || 0) + 1);
          }
        });
      });
      
      const topGenres = [...genreKeywords.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([genre]) => genre);

      // По характеру
      if (waveCharacter === "favorite" && likedArtists.length > 0) {
        // Любимое - случайные артисты из избранного
        const shuffledArtists = [...likedArtists].sort(() => Math.random() - 0.5);
        searchQueries.push(...shuffledArtists.slice(0, 4));
        if (shuffledArtists[0]) {
          searchQueries.push(`${shuffledArtists[0]} remix`);
        }
      } else if (waveCharacter === "stats") {
        // Статистика - на основе топ артистов и жанров из истории
        if (topArtists.length > 0) {
          // Топ-3 самых слушаемых артиста
          searchQueries.push(...topArtists.slice(0, 3));
          // Похожие на топ артистов
          if (topArtists[0]) {
            searchQueries.push(`${topArtists[0]} type beat`);
            searchQueries.push(`artists like ${topArtists[0]}`);
          }
        }
        // Добавляем топ жанры из статистики
        if (topGenres.length > 0) {
          searchQueries.push(...topGenres.slice(0, 2).map(g => `${g} music`));
        }
        // Если мало данных - добавляем из истории
        if (searchQueries.length < 3 && historyTracks.length > 0) {
          const historyArtists = [...new Set(historyTracks.map(t => t.artist).filter(Boolean))];
          searchQueries.push(...historyArtists.slice(0, 3));
        }
      } else if (waveCharacter === "popular") {
        // Популярное - западные тренды
        const popularQueries = [
          "top 40 hits",
          "billboard hot 100",
          "spotify viral",
          "pop hits 2024",
          "trending songs",
          "radio hits",
          "chart music",
          "mainstream pop",
        ];
        searchQueries.push(...popularQueries.sort(() => Math.random() - 0.5).slice(0, 4));
      }

      // Добавляем ключевые слова настроения
      if (moodKeywords.length > 0) {
        const randomMood = moodKeywords[Math.floor(Math.random() * moodKeywords.length)];
        searchQueries.push(`${randomMood} music`);
        // Комбинируем с топ артистом для лучшего результата
        if (topArtists[0] && (waveCharacter === "favorite" || waveCharacter === "stats")) {
          searchQueries.push(`${randomMood} ${topArtists[0]}`);
        }
      }

      // Добавляем ключевые слова занятия
      if (activityKeywords.length > 0) {
        const randomActivity = activityKeywords[Math.floor(Math.random() * activityKeywords.length)];
        searchQueries.push(`${randomActivity} playlist`);
      }

      // Если ничего нет - используем качественные западные жанры
      if (searchQueries.length === 0) {
        const defaultQueries = [
          "electronic music",
          "hip hop beats",
          "pop music hits",
          "rock music",
          "r&b soul",
          "house music",
          "lofi hip hop",
          "indie music",
        ];
        searchQueries = defaultQueries.sort(() => Math.random() - 0.5).slice(0, 4);
      }

      // Убираем дубликаты запросов
      searchQueries = [...new Set(searchQueries)];

      console.log("[MyWave] Search queries:", searchQueries);
      console.log("[MyWave] Settings:", { waveCharacter, waveMood, waveActivity, waveService });
      console.log("[MyWave] Top artists:", topArtists.slice(0, 5));
      console.log("[MyWave] Top genres:", topGenres);

      const allTracks: Track[] = [];
      const seenIds = new Set<string>(liked.map((t: Track) => t.id));

      // Функция поиска в зависимости от выбранного сервиса
      const searchInService = async (query: string, limit: number): Promise<Track[]> => {
        switch (waveService) {
          case "youtube":
            if (youtubeService.isEnabled()) {
              return await youtubeService.search(query, limit);
            }
            // Fallback to SoundCloud if YouTube disabled
            const scResults = await soundCloudService.search(query, limit);
            return scResults.tracks;
          case "vk":
            if (vkMusicService.isEnabled()) {
              return await vkMusicService.search(query, limit);
            }
            // Fallback to SoundCloud if VK disabled
            const scResults2 = await soundCloudService.search(query, limit);
            return scResults2.tracks;
          case "yandex":
            if (yandexMusicService.isEnabled()) {
              return await yandexMusicService.search(query, limit);
            }
            // Fallback to SoundCloud if Yandex disabled
            const scResults3 = await soundCloudService.search(query, limit);
            return scResults3.tracks;
          case "spotify":
            if (spotifyService.isConnected()) {
              return await spotifyService.search(query, limit);
            }
            // Fallback to SoundCloud if Spotify disabled
            const scResults4 = await soundCloudService.search(query, limit);
            return scResults4.tracks;
          case "soundcloud":
          default:
            const results = await soundCloudService.search(query, limit);
            return results.tracks;
        }
      };

      // Ищем треки по каждому запросу
      for (const query of searchQueries.slice(0, 6)) {
        try {
          const tracks = await searchInService(query, 25);
          for (const track of tracks) {
            // Фильтруем: не дубликат, минимум 1 минута, не в блок-листе
            if (!seenIds.has(track.id) && track.duration > 60 && !isBlockedTrack(track)) {
              seenIds.add(track.id);
              allTracks.push(track);
            }
          }
        } catch (e) {
          console.log("[MyWave] Search error for:", query);
        }
      }

      console.log("[MyWave] Found tracks after filtering:", allTracks.length);

      if (allTracks.length > 0) {
        // Перемешиваем и берём до 30 треков
        const sorted = allTracks.sort(() => Math.random() - 0.5).slice(0, 30);
        const firstTrack = sorted[0];

        // Получаем stream URL в зависимости от сервиса
        let streamUrl: string | null = null;
        if (waveService === "soundcloud" || firstTrack.id.startsWith("sc-")) {
          streamUrl = await soundCloudService.getStreamUrl(firstTrack.id.replace("sc-", ""));
        } else if (firstTrack.streamUrl) {
          streamUrl = firstTrack.streamUrl;
        } else {
          // Для YouTube/VK пробуем получить через SoundCloud fallback
          const fallbackResults = await soundCloudService.search(`${firstTrack.artist} ${firstTrack.title}`, 1);
          if (fallbackResults.tracks.length > 0) {
            streamUrl = await soundCloudService.getStreamUrl(fallbackResults.tracks[0].id.replace("sc-", ""));
          }
        }

        if (streamUrl) {
          audioService.load({ ...firstTrack, streamUrl });
          saveToHistory(firstTrack);
          clearQueue();

          // Добавляем остальные в очередь
          for (let i = 1; i < sorted.length; i++) {
            addToQueue({ ...sorted[i], streamUrl: "" });
          }

          const serviceName = waveService === "soundcloud" ? "SoundCloud" : waveService === "youtube" ? "YouTube" : "VK Music";
          window.dispatchEvent(
            new CustomEvent("show-toast", {
              detail: {
                message: `Моя волна (${serviceName}): ${sorted.length} треков`,
                type: "success",
              },
            })
          );
        }
      } else {
        window.dispatchEvent(
          new CustomEvent("show-toast", {
            detail: { message: "Не удалось найти треки", type: "error" },
          })
        );
      }
    } catch (e) {
      console.error("[MyWave] Error:", e);
      window.dispatchEvent(
        new CustomEvent("show-toast", {
          detail: { message: "Ошибка загрузки волны", type: "error" },
        })
      );
    }
    setLoadingWave(false);
  };

  // Wave settings data
  const activities: { id: WaveActivity; label: string; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }> }[] = [
    { id: "none", label: "Любое", icon: IoShuffle },
    { id: "driving", label: "В дороге", icon: IoCarSportOutline },
    { id: "working", label: "Работаю", icon: IoBriefcaseOutline },
    { id: "gaming", label: "Играю", icon: IoGameControllerOutline },
    { id: "relaxing", label: "Отдыхаю", icon: IoCafeOutline },
    { id: "sleeping", label: "Сплю", icon: IoMoonOutline },
  ];

  const characters: { id: WaveCharacter; label: string; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; gradient: string }[] = [
    { id: "favorite", label: "Любимое", icon: HiOutlineHeart, gradient: "linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%)" },
    { id: "stats", label: "Статистика", icon: HiOutlineChartBar, gradient: "linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)" },
    { id: "popular", label: "Популярное", icon: HiOutlineFire, gradient: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)" },
  ];

  const moods: { id: WaveMood; label: string; color: string; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }> }[] = [
    { id: "energetic", label: "Бодрое", color: "#ff7b00", icon: IoFlashOutline },
    { id: "happy", label: "Весёлое", color: "#7ed321", icon: IoHappyOutline },
    { id: "calm", label: "Спокойное", color: "#4a90d9", icon: IoWaterOutline },
    { id: "sad", label: "Грустное", color: "#5856d6", icon: IoCloudyNightOutline },
  ];

  const currentMood = moods.find((m) => m.id === waveMood);
  const currentCharacter = characters.find((c) => c.id === waveCharacter);
  const currentActivity = activities.find((a) => a.id === waveActivity);

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 pb-32 space-y-8 max-w-[1600px] mx-auto">
        {/* Hero Section - My Wave */}
        <section
          className="relative rounded-3xl overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${colors.surface} 0%, ${colors.background} 100%)`,
            border: `1px solid ${colors.textSecondary}10`,
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(30px)",
            transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          {/* Canvas Wave Animation */}
          <WaveCanvas accentColor={colors.accent} />

          <div className="relative p-8 flex flex-col lg:flex-row items-center gap-8 z-10">
            {/* Left side - Wave info */}
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-3">
                <span
                  className="text-sm font-medium px-3 py-1 rounded-full"
                  style={{
                    background: `${colors.textSecondary}15`,
                    color: colors.textPrimary,
                  }}
                >
                  {greeting}
                </span>
                <span
                  className="text-xs"
                  style={{ color: colors.textSecondary }}
                >
                  {currentTime.toLocaleDateString("ru-RU", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </span>
              </div>

              <h1 className="text-4xl lg:text-5xl font-bold tracking-tight">
                Моя волна
              </h1>

              <p
                className="text-base max-w-md"
                style={{ color: colors.textSecondary }}
              >
                Персональный микс • {currentCharacter?.label || "Любимое"}
                {currentMood && ` • ${currentMood.label}`}
                {waveActivity !== "none" && currentActivity && ` • ${currentActivity.label}`}
              </p>

              {favoriteArtists.length > 0 && (
                <div className="flex items-center gap-4 pt-2">
                  <div className="flex -space-x-2">
                    {favoriteArtists.slice(0, 5).map((artist, i) => (
                      <div
                        key={artist.name}
                        className="w-8 h-8 rounded-full border-2 overflow-hidden"
                        style={{
                          borderColor: colors.background,
                          zIndex: 5 - i,
                        }}
                      >
                        {artist.artwork ? (
                          <img
                            src={artist.artwork}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div
                            className="w-full h-full flex items-center justify-center"
                            style={{ background: colors.accent }}
                          >
                            <HiOutlineUser className="text-white text-xs" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <span
                    className="text-sm"
                    style={{ color: colors.textSecondary }}
                  >
                    {favoriteArtists.length} любимых артистов
                  </span>
                </div>
              )}
            </div>

            {/* Right side - Play button */}
            <div className="flex flex-col items-center gap-4">
              <button
                onClick={handleMyWave}
                disabled={loadingWave}
                className="relative w-28 h-28 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-105 group"
                style={{
                  background: "#ffffff",
                }}
              >
                {loadingWave ? (
                  <div
                    className="w-10 h-10 border-4 rounded-full animate-spin"
                    style={{
                      borderColor: "rgba(0,0,0,0.2)",
                      borderTopColor: "#000000",
                    }}
                  />
                ) : (
                  <IoPlayOutline
                    className="text-5xl group-hover:scale-110 transition-transform"
                    style={{ color: "#000000" }}
                  />
                )}
              </button>

              <button
                onClick={() => setShowWaveSettings(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-full transition-all hover:scale-105"
                style={{
                  background: `${colors.textSecondary}10`,
                  color: colors.textSecondary,
                }}
              >
                {currentCharacter && <currentCharacter.icon className="text-lg" />}
                <span className="text-sm font-medium">{currentCharacter?.label || "Любимое"}</span>
                <HiOutlineAdjustmentsHorizontal className="text-lg" />
              </button>
            </div>
          </div>
        </section>

        {/* Quick Actions Grid */}
        <section
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(20px)",
            transition: "all 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.1s",
          }}
        >
          {[
            {
              icon: HiOutlineHeart,
              label: "Любимые",
              count: likedTracks.length,
              color: "#EF4444",
              onClick: () => navigate("liked"),
            },
            {
              icon: HiOutlineClock,
              label: "История",
              count: history.length,
              color: "#8B5CF6",
              onClick: () =>
                document
                  .getElementById("history-section")
                  ?.scrollIntoView({ behavior: "smooth" }),
            },
            {
              icon: HiOutlineQueueList,
              label: "Плейлисты",
              count: playlists.length,
              color: "#3B82F6",
              onClick: () => navigate("playlists"),
            },
            {
              icon: IoShuffle,
              label: "Перемешать",
              count: null,
              color: "#10B981",
              onClick: handleMyWave,
            },
          ].map((item) => (
            <button
              key={item.label}
              onClick={item.onClick}
              className="group p-4 rounded-2xl flex items-center gap-4 transition-all hover:scale-[1.02]"
              style={{
                background: `${item.color}08`,
                border: `1px solid ${item.color}15`,
              }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                style={{ background: `${item.color}15` }}
              >
                <item.icon className="text-2xl" style={{ color: item.color }} />
              </div>
              <div className="text-left">
                <p className="font-semibold">{item.label}</p>
                {item.count !== null && (
                  <p
                    className="text-sm"
                    style={{ color: colors.textSecondary }}
                  >
                    {item.count} треков
                  </p>
                )}
              </div>
            </button>
          ))}
        </section>

        {/* Artist Mixes */}
        {artistMixes.length > 0 && (
          <section
            style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? "translateY(0)" : "translateY(20px)",
              transition: "all 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.2s",
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Миксы для вас</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAllMixes(true)}
                  className="px-3 py-1 rounded-full text-xs font-medium transition-all hover:scale-105"
                  style={{
                    background: `${colors.accent}15`,
                    color: colors.accent,
                  }}
                >
                  Все
                </button>
              </div>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {artistMixes.slice(0, 8).map((mix, i) => (
                <MixCard
                  key={mix.artist}
                  mix={mix}
                  index={i}
                  mounted={mounted}
                  colors={colors}
                  onPlay={() => handlePlayTrack(mix.tracks[0], mix.tracks, 0)}
                  onViewMix={() => setSelectedMix(mix)}
                  onDelete={() => hideMix(mix.artist)}
                />
              ))}
            </div>
          </section>
        )}

        {/* New Releases from Subscribed Artists */}
        <section
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(20px)",
            transition: "all 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.25s",
          }}
        >
          <ArtistReleasesSection />
        </section>

        {/* Trending Section */}
        {trendingTracks.length > 0 && (
          <section
            style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? "translateY(0)" : "translateY(20px)",
              transition: "all 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.3s",
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">В тренде</h2>
              <button
                onClick={() => setShowAllTrending(true)}
                className="px-3 py-1 rounded-full text-xs font-medium transition-all hover:scale-105"
                style={{
                  background: `${colors.accent}15`,
                  color: colors.accent,
                }}
              >
                Все
              </button>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {trendingTracks.slice(0, 8).map((track, i) => (
                <TrackCard
                  key={track.id}
                  track={track}
                  index={i}
                  mounted={mounted}
                  colors={colors}
                  onPlay={() => handlePlayTrack(track, trendingTracks, i)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Recent History */}
        {history.length > 0 && (
          <section
            id="history-section"
            style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? "translateY(0)" : "translateY(20px)",
              transition: "all 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.4s",
            }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold">Недавно играло</h2>
            </div>
            <div className="space-y-2">
              {history.slice(0, 5).map((track, i) => (
                <HistoryRow
                  key={track.id + i}
                  track={track}
                  index={i}
                  mounted={mounted}
                  colors={colors}
                  onPlay={() => handlePlayTrack(track, history, i)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Playlists Grid */}
        {playlists.length > 0 && (
          <section
            style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? "translateY(0)" : "translateY(20px)",
              transition: "all 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.5s",
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Ваши плейлисты</h2>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {playlists.slice(0, 8).map((playlist, i) => (
                <PlaylistCard
                  key={playlist.id}
                  playlist={playlist}
                  index={i}
                  mounted={mounted}
                  colors={colors}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Wave Settings Modal */}
      {showWaveSettings && (
        <WaveSettingsModal
          colors={colors}
          waveActivity={waveActivity}
          waveCharacter={waveCharacter}
          waveMood={waveMood}
          waveService={waveService}
          activities={activities}
          characters={characters}
          moods={moods}
          services={services}
          onClose={() => setShowWaveSettings(false)}
          onActivityChange={(activity) => {
            setWaveActivity(activity);
            saveWaveSettings(activity, waveCharacter, waveMood, waveService);
          }}
          onCharacterChange={(character) => {
            setWaveCharacter(character);
            saveWaveSettings(waveActivity, character, waveMood, waveService);
          }}
          onMoodChange={(mood) => {
            setWaveMood(mood);
            saveWaveSettings(waveActivity, waveCharacter, mood, waveService);
          }}
          onServiceChange={(service) => {
            setWaveService(service);
            saveWaveSettings(waveActivity, waveCharacter, waveMood, service);
          }}
          onStart={() => {
            setShowWaveSettings(false);
            handleMyWave();
          }}
        />
      )}

      {/* All Mixes Modal */}
      {showAllMixes && (
        <AllItemsModal
          title="Все миксы"
          onClose={() => setShowAllMixes(false)}
          colors={colors}
        >
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {artistMixes.map((mix, i) => (
              <MixCard
                key={mix.artist}
                mix={mix}
                index={i}
                mounted={true}
                colors={colors}
                onPlay={() => {
                  setShowAllMixes(false);
                  handlePlayTrack(mix.tracks[0], mix.tracks, 0);
                }}
                onDelete={() => {
                  hideMix(mix.artist);
                }}
              />
            ))}
          </div>
        </AllItemsModal>
      )}

      {/* All Trending Modal */}
      {showAllTrending && (
        <AllItemsModal
          title="В тренде"
          onClose={() => setShowAllTrending(false)}
          colors={colors}
        >
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {trendingTracks.map((track, i) => (
              <TrackCard
                key={track.id}
                track={track}
                index={i}
                mounted={true}
                colors={colors}
                onPlay={() => {
                  setShowAllTrending(false);
                  handlePlayTrack(track, trendingTracks, i);
                }}
              />
            ))}
          </div>
        </AllItemsModal>
      )}

      {/* Mix View Modal */}
      {selectedMix && (
        <MixViewModal
          mix={selectedMix}
          colors={colors}
          onClose={() => setSelectedMix(null)}
          onPlayTrack={(track, index) => {
            handlePlayTrack(track, selectedMix.tracks, index);
          }}
          onPlayAll={() => {
            handlePlayTrack(selectedMix.tracks[0], selectedMix.tracks, 0);
            setSelectedMix(null);
          }}
        />
      )}
    </div>
  );
}

// ========== COMPONENTS ==========
interface CardColors {
  accent: string;
  secondary: string;
  textPrimary: string;
  textSecondary: string;
  background: string;
  surface: string;
}

// All Items Modal
function AllItemsModal({
  title,
  onClose,
  colors,
  children,
}: {
  title: string;
  onClose: () => void;
  colors: CardColors;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
      <div
        className="relative w-full max-w-4xl max-h-[80vh] rounded-3xl overflow-hidden flex flex-col"
        style={{
          background: `${colors.background}f5`,
          border: `1px solid ${colors.textSecondary}15`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-5 border-b"
          style={{ borderColor: `${colors.textSecondary}10` }}
        >
          <h2 className="text-xl font-bold">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-white/10"
            style={{ background: `${colors.textSecondary}10` }}
          >
            <HiOutlineXMark className="text-lg" />
          </button>
        </div>
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

function TrackCard({
  track,
  index,
  mounted,
  colors,
  onPlay,
  size = "normal",
}: {
  track: Track;
  index: number;
  mounted: boolean;
  colors: CardColors;
  onPlay: () => void;
  size?: "small" | "normal" | "large";
}) {
  const sizeClasses = {
    small: "w-full",
    normal: "w-full",
    large: "w-full",
  };
  
  const imageSize = {
    small: "aspect-square",
    normal: "aspect-square",
    large: "aspect-[4/3]",
  };

  return (
    <div
      className={`cursor-pointer group ${sizeClasses[size]}`}
      onClick={onPlay}
      style={{
        opacity: mounted ? 1 : 0,
        transform: mounted
          ? "translateY(0) scale(1)"
          : "translateY(20px) scale(0.95)",
        transition: `all 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${index * 50}ms`,
      }}
    >
      <div className={`${imageSize[size]} rounded-xl overflow-hidden relative mb-2 shadow-md group-hover:shadow-lg transition-all`}>
        {track.artworkUrl ? (
          <img
            src={track.artworkUrl}
            alt=""
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : null}
        <div
          className={`w-full h-full flex flex-col items-center justify-center ${track.artworkUrl ? 'hidden' : ''}`}
          style={{ background: `linear-gradient(135deg, ${colors.accent}40, ${colors.accent}20)` }}
        >
          <HiOutlineMusicalNote className="text-white text-2xl mb-1" />
          <span className="text-[8px] text-white/60 px-2 text-center truncate max-w-full">{track.artist}</span>
        </div>
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200">
          <div className="w-10 h-10 rounded-full flex items-center justify-center transform scale-75 group-hover:scale-100 transition-transform duration-200 shadow-lg" style={{ background: "var(--interactive-accent)", color: "var(--interactive-accent-text)" }}>
            <HiOutlinePlay className="text-lg ml-0.5" />
          </div>
        </div>
        {/* Service icon */}
        <div className="absolute bottom-1.5 right-1.5 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center">
          <ServiceIcon platform={getTrackPlatform(track)} size={10} />
        </div>
      </div>
      <h3 className="font-medium text-xs truncate" style={{ color: colors.textPrimary }}>{track.title}</h3>
      <p className="text-[10px] truncate" style={{ color: colors.textSecondary }}>
        {track.artist}
      </p>
    </div>
  );
}

function MixCard({
  mix,
  index,
  mounted,
  colors,
  onPlay,
  onViewMix,
  onDelete,
}: {
  mix: { artist: string; tracks: Track[]; artwork: string | null };
  index: number;
  mounted: boolean;
  colors: CardColors;
  onPlay: () => void;
  onViewMix?: () => void;
  onDelete?: () => void;
}) {
  // Use first track artwork or mix artwork
  const coverArt = mix.tracks[0]?.artworkUrl || mix.artwork;

  return (
    <div
      className="cursor-pointer group"
      onClick={onViewMix || onPlay}
      style={{
        opacity: mounted ? 1 : 0,
        transform: mounted
          ? "translateY(0) scale(1)"
          : "translateY(20px) scale(0.95)",
        transition: `all 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${index * 80}ms`,
      }}
    >
      <div className="aspect-square rounded-xl overflow-hidden relative mb-2 shadow-md group-hover:shadow-lg transition-all">
        {/* Single cover */}
        {coverArt ? (
          <img
            src={coverArt}
            alt=""
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: colors.accent }}
          >
            <HiOutlineMusicalNote className="text-white text-2xl" />
          </div>
        )}
        {/* Hover overlay with play button */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-200 pointer-events-none">
          <div className="w-10 h-10 rounded-full flex items-center justify-center transform scale-75 group-hover:scale-100 transition-transform duration-200 shadow-lg" style={{ background: "var(--interactive-accent)", color: "var(--interactive-accent-text)" }}>
            <HiOutlinePlay className="text-lg ml-0.5" />
          </div>
        </div>
        {/* Track count badge */}
        <div
          className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded-md text-[9px] font-medium"
          style={{ background: "rgba(0,0,0,0.7)", color: "white" }}
        >
          {mix.tracks.length}
        </div>
        {/* Delete button - on top of everything */}
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onDelete();
            }}
            className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-110 hover:bg-red-500 z-20 pointer-events-auto"
            style={{ background: "rgba(0,0,0,0.8)" }}
          >
            <HiOutlineXMark className="text-white text-sm" />
          </button>
        )}
      </div>
      <h3 className="font-medium text-xs truncate">{mix.artist}</h3>
      <p className="text-[10px]" style={{ color: colors.textSecondary }}>
        Микс
      </p>
    </div>
  );
}

function HistoryRow({
  track,
  index,
  mounted,
  colors,
  onPlay,
}: {
  track: Track;
  index: number;
  mounted: boolean;
  colors: CardColors;
  onPlay: () => void;
}) {
  return (
    <div
      className="flex items-center gap-3 p-2 rounded-lg cursor-pointer group transition-all hover:scale-[1.01]"
      onClick={onPlay}
      style={{
        background: `${colors.textSecondary}05`,
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateX(0)" : "translateX(-20px)",
        transition: `all 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${index * 60}ms`,
      }}
    >
      <div className="w-10 h-10 rounded-lg overflow-hidden relative flex-shrink-0 shadow-sm">
        {track.artworkUrl ? (
          <img
            src={track.artworkUrl}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: colors.accent }}
          >
            <HiOutlineMusicalNote className="text-white text-sm" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
          <HiOutlinePlay style={{ color: "var(--interactive-accent)", fontSize: "0.875rem" }} />
        </div>
        {/* Service icon in bottom-right corner */}
        <div className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full bg-black/70 flex items-center justify-center">
          <ServiceIcon platform={getTrackPlatform(track)} size={8} />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium truncate text-xs">{track.title}</h4>
        <p className="text-[10px] truncate" style={{ color: colors.textSecondary }}>
          {track.artist}
        </p>
      </div>
    </div>
  );
}

function PlaylistCard({
  playlist,
  index,
  mounted,
  colors,
}: {
  playlist: Playlist;
  index: number;
  mounted: boolean;
  colors: CardColors;
}) {
  const handlePlay = async () => {
    if (playlist.tracks && playlist.tracks.length > 0) {
      const track = playlist.tracks[0];
      try {
        const streamUrl =
          track.streamUrl ||
          (await soundCloudService.getStreamUrl(track.id.replace("sc-", "")));
        if (streamUrl) audioService.load({ ...track, streamUrl });
      } catch {}
    }
  };
  return (
    <div
      className="cursor-pointer group"
      onClick={handlePlay}
      style={{
        opacity: mounted ? 1 : 0,
        transform: mounted
          ? "translateY(0) scale(1)"
          : "translateY(20px) scale(0.95)",
        transition: `all 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${index * 50}ms`,
      }}
    >
      <div
        className="aspect-square rounded-2xl overflow-hidden relative mb-3 shadow-lg"
        style={{ background: `${colors.accent}20` }}
      >
        {playlist.tracks?.[0]?.artworkUrl ? (
          <img
            src={playlist.tracks[0].artworkUrl}
            alt=""
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <HiOutlineQueueList
              className="text-4xl"
              style={{ color: colors.accent }}
            />
          </div>
        )}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300">
          <div className="w-12 h-12 rounded-full flex items-center justify-center transform scale-75 group-hover:scale-100 transition-transform duration-300" style={{ background: "var(--interactive-accent)", color: "var(--interactive-accent-text)" }}>
            <HiOutlinePlay className="text-xl ml-0.5" />
          </div>
        </div>
      </div>
      <h3 className="font-semibold text-sm truncate">{playlist.name}</h3>
      <p className="text-xs" style={{ color: colors.textSecondary }}>
        {playlist.tracks?.length || 0} треков
      </p>
    </div>
  );
}

function WaveSettingsModal({
  colors,
  waveActivity,
  waveCharacter,
  waveMood,
  waveService,
  activities,
  characters,
  moods,
  services,
  onClose,
  onActivityChange,
  onCharacterChange,
  onMoodChange,
  onServiceChange,
  onStart,
}: {
  colors: CardColors;
  waveActivity: WaveActivity;
  waveCharacter: WaveCharacter;
  waveMood: WaveMood | null;
  waveService: WaveService;
  activities: { id: WaveActivity; label: string; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }> }[];
  characters: { id: WaveCharacter; label: string; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; gradient: string }[];
  moods: { id: WaveMood; label: string; color: string; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }> }[];
  services: { id: WaveService; label: string; color: string }[];
  onClose: () => void;
  onActivityChange: (activity: WaveActivity) => void;
  onCharacterChange: (character: WaveCharacter) => void;
  onMoodChange: (mood: WaveMood | null) => void;
  onServiceChange: (service: WaveService) => void;
  onStart: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="relative w-full max-w-md max-h-[90vh] rounded-3xl overflow-hidden overflow-y-auto"
        style={{
          background: colors.surface,
          border: `1px solid ${colors.textSecondary}20`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 pb-0 flex items-center justify-between">
          <h2 className="text-xl font-bold">Настройка волны</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-white/10"
            style={{ background: `${colors.textSecondary}15` }}
          >
            <HiOutlineXMark className="text-lg" />
          </button>
        </div>

        {/* Сервис (Service) */}
        <div className="p-5 pb-3">
          <p
            className="text-xs uppercase tracking-wider mb-3 font-semibold"
            style={{ color: colors.textSecondary }}
          >
            Сервис
          </p>
          <div className="flex flex-wrap gap-2">
            {services.map((service) => (
              <button
                key={service.id}
                onClick={() => onServiceChange(service.id)}
                className="px-4 py-2 rounded-full flex items-center gap-2 transition-all hover:scale-105"
                style={{
                  background: waveService === service.id
                    ? `${service.color}25`
                    : `${colors.textSecondary}10`,
                  border: `2px solid ${
                    waveService === service.id ? service.color : "transparent"
                  }`,
                }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: service.color }}
                />
                <span
                  className="text-sm font-medium"
                  style={{
                    color: waveService === service.id ? service.color : colors.textSecondary,
                  }}
                >
                  {service.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* По характеру (Character) - Main selection */}
        <div className="px-5 pb-3">
          <p
            className="text-xs uppercase tracking-wider mb-3 font-semibold"
            style={{ color: colors.textSecondary }}
          >
            По характеру
          </p>
          <div className="grid grid-cols-3 gap-3">
            {characters.map((char) => {
              const CharIcon = char.icon;
              return (
                <button
                  key={char.id}
                  onClick={() => onCharacterChange(char.id)}
                  className="relative p-4 rounded-2xl flex flex-col items-center gap-2 transition-all hover:scale-105 overflow-hidden"
                  style={{
                    background: waveCharacter === char.id
                      ? char.gradient
                      : `${colors.textSecondary}10`,
                  }}
                >
                  <CharIcon className="text-2xl" style={{ color: waveCharacter === char.id ? "white" : colors.textPrimary }} />
                  <span
                    className="text-xs font-semibold"
                    style={{
                      color: waveCharacter === char.id ? "white" : colors.textPrimary,
                    }}
                  >
                    {char.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Под настроение (Mood) */}
        <div className="px-5 pb-3">
          <p
            className="text-xs uppercase tracking-wider mb-3 font-semibold"
            style={{ color: colors.textSecondary }}
          >
            Под настроение
          </p>
          <div className="flex flex-wrap gap-2">
            {moods.map((mood) => {
              const MoodIcon = mood.icon;
              return (
                <button
                  key={mood.id}
                  onClick={() => onMoodChange(waveMood === mood.id ? null : mood.id)}
                  className="px-4 py-2 rounded-full flex items-center gap-2 transition-all hover:scale-105"
                  style={{
                    background: waveMood === mood.id
                      ? `${mood.color}25`
                      : `${colors.textSecondary}10`,
                    border: `2px solid ${
                      waveMood === mood.id ? mood.color : "transparent"
                    }`,
                  }}
                >
                  <MoodIcon className="text-base" style={{ color: waveMood === mood.id ? mood.color : colors.textSecondary }} />
                  <span
                    className="text-sm font-medium"
                    style={{
                      color: waveMood === mood.id ? mood.color : colors.textSecondary,
                    }}
                  >
                    {mood.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* По занятию (Activity) */}
        <div className="px-5 pb-5">
          <p
            className="text-xs uppercase tracking-wider mb-3 font-semibold"
            style={{ color: colors.textSecondary }}
          >
            По занятию
          </p>
          <div className="flex flex-wrap gap-2">
            {activities.map((activity) => {
              const ActivityIcon = activity.icon;
              return (
                <button
                  key={activity.id}
                  onClick={() => onActivityChange(activity.id)}
                  className="px-3 py-1.5 rounded-full text-sm flex items-center gap-1.5 transition-all hover:scale-105"
                  style={{
                    background: waveActivity === activity.id
                      ? `${colors.accent}20`
                      : `${colors.textSecondary}10`,
                    border: `1.5px solid ${
                      waveActivity === activity.id ? colors.accent : "transparent"
                    }`,
                    color: waveActivity === activity.id ? colors.accent : colors.textSecondary,
                  }}
                >
                  <ActivityIcon className="text-sm" />
                  {activity.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Start Button */}
        <div className="p-5 pt-0">
          <button
            onClick={onStart}
            className="w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
            style={{ background: colors.accent, color: 'var(--interactive-accent-text)' }}
          >
            <HiOutlineBolt className="text-xl" />
            Запустить волну
          </button>
        </div>
      </div>
    </div>
  );
}

// Mix View Modal
function MixViewModal({
  mix,
  colors,
  onClose,
  onPlayTrack,
  onPlayAll,
}: {
  mix: { artist: string; tracks: Track[]; artwork: string | null };
  colors: CardColors;
  onClose: () => void;
  onPlayTrack: (track: Track, index: number) => void;
  onPlayAll: () => void;
}) {
  const coverArt = mix.tracks[0]?.artworkUrl || mix.artwork;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
      <div
        className="relative w-full max-w-2xl max-h-[85vh] rounded-3xl overflow-hidden flex flex-col"
        style={{
          background: `${colors.background}f5`,
          border: `1px solid ${colors.textSecondary}15`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with cover */}
        <div className="relative h-48 overflow-hidden">
          {coverArt ? (
            <img src={coverArt} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full" style={{ background: colors.accent }} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-white/20"
            style={{ background: 'rgba(0,0,0,0.5)' }}
          >
            <HiOutlineXMark className="text-white text-lg" />
          </button>

          {/* Mix info */}
          <div className="absolute bottom-4 left-4 right-4">
            <h2 className="text-2xl font-bold text-white mb-1">{mix.artist}</h2>
            <p className="text-sm text-white/70">{mix.tracks.length} треков</p>
          </div>
        </div>

        {/* Play all button */}
        <div className="p-4 border-b" style={{ borderColor: `${colors.textSecondary}10` }}>
          <button
            onClick={onPlayAll}
            className="w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
            style={{ background: colors.accent, color: 'var(--interactive-accent-text)' }}
          >
            <HiOutlinePlay className="text-xl" />
            Слушать всё
          </button>
        </div>

        {/* Tracks list */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-1">
            {mix.tracks.map((track, index) => (
              <div
                key={track.id}
                onClick={() => onPlayTrack(track, index)}
                className="flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all hover:bg-white/5 group"
              >
                <div className="w-10 h-10 rounded-lg overflow-hidden relative flex-shrink-0">
                  {track.artworkUrl ? (
                    <img src={track.artworkUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ background: colors.accent }}>
                      <HiOutlineMusicalNote className="text-white text-sm" />
                    </div>
                  )}
                  {/* Service icon in bottom-right corner */}
                  <div className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full bg-black/70 flex items-center justify-center">
                    <ServiceIcon platform={getTrackPlatform(track)} size={8} />
                  </div>
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <HiOutlinePlay style={{ color: "var(--interactive-accent)", fontSize: "0.875rem" }} />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: colors.textPrimary }}>{track.title}</p>
                  <p className="text-xs truncate" style={{ color: colors.textSecondary }}>{track.artist}</p>
                </div>
                <span className="text-xs" style={{ color: colors.textSecondary }}>
                  {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
