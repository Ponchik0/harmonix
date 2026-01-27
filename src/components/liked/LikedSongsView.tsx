import { useState, useEffect } from "react";
import {
  HiOutlineMusicalNote,
  HiOutlinePlay,
  HiOutlineTrash,
  HiOutlineClock,
  HiOutlineHeart,
  HiOutlineArrowsRightLeft,
  HiOutlinePlayCircle,
  HiOutlineChevronDown,
  HiOutlineArrowLeft,
} from "react-icons/hi2";
import { audioService } from "../../services/AudioService";
import { soundCloudService } from "../../services/SoundCloudService";
import { likedTracksService } from "../../services/LikedTracksService";
import { useQueueStore } from "../../stores/queueStore";
import { useUserStore } from "../../stores/userStore";
import { useThemeStore } from "../../stores/themeStore";
import { useNavigationStore } from "../../stores/navigationStore";
import type { Track } from "../../types";

type SortOption = "recent" | "title" | "artist" | "duration";

export function LikedSongsView() {
  const [likedTracks, setLikedTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const { addToQueue, clearQueue } = useQueueStore();
  const { user } = useUserStore();
  const { currentTheme, isLight } = useThemeStore();
  const { previousRoute, goBack } = useNavigationStore();
  const colors = currentTheme.colors;
  
  // Show back button if came from home
  const showBackButton = previousRoute === "home";
  
  // Scrollbar class based on theme
  const scrollbarClass = isLight() ? 'scrollbar-light' : 'scrollbar-visible';

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
        return sorted; // Already sorted by recent (from service)
    }
  };

  const loadLikedTracks = () => {
    try {
      const tracks = likedTracksService.getLikedTracks();
      setLikedTracks(sortTracks(tracks, sortBy));
    } catch (error) {
      console.error("Error loading liked tracks:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLikedTracks();
    const handleChange = () => loadLikedTracks();
    window.addEventListener("liked-tracks-changed", handleChange);
    return () => {
      window.removeEventListener("liked-tracks-changed", handleChange);
    };
  }, [sortBy]);

  const handlePlayTrack = async (track: Track, index: number) => {
    let streamUrl = track.streamUrl;
    if (!streamUrl) {
      streamUrl = (await soundCloudService.getStreamUrl(track.id.replace("sc-", ""))) || "";
    }
    if (streamUrl) {
      audioService.load({ ...track, streamUrl });
      clearQueue();
      for (let i = index + 1; i < likedTracks.length; i++) {
        addToQueue({ ...likedTracks[i], streamUrl: likedTracks[i].streamUrl || "" });
      }
    }
  };

  const handlePlayAll = async () => {
    if (likedTracks.length === 0) return;
    await handlePlayTrack(likedTracks[0], 0);
  };

  const handleShufflePlay = async () => {
    if (likedTracks.length === 0) return;
    const shuffled = [...likedTracks].sort(() => Math.random() - 0.5);
    const first = shuffled[0];
    let streamUrl = first.streamUrl;
    if (!streamUrl) {
      streamUrl = (await soundCloudService.getStreamUrl(first.id.replace("sc-", ""))) || "";
    }
    if (streamUrl) {
      audioService.load({ ...first, streamUrl });
      clearQueue();
      for (let i = 1; i < shuffled.length; i++) {
        addToQueue({ ...shuffled[i], streamUrl: shuffled[i].streamUrl || "" });
      }
    }
  };

  const handleRemoveLiked = (e: React.MouseEvent, trackId: string) => {
    e.stopPropagation();
    likedTracksService.removeLikedTrack(trackId);
    setLikedTracks((prev) => prev.filter((t) => t.id !== trackId));
    window.dispatchEvent(new CustomEvent("liked-tracks-changed"));
  };

  const formatDuration = (s: number) => `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;

  const totalDuration = likedTracks.reduce((acc, t) => acc + t.duration, 0);
  const hours = Math.floor(totalDuration / 3600);
  const minutes = Math.floor((totalDuration % 3600) / 60);

  return (
    <div className={`h-full overflow-y-auto relative ${scrollbarClass}`}>
      {/* Back Button */}
      {showBackButton && (
        <div className="absolute top-4 left-4 z-10">
          <button
            onClick={goBack}
            className="p-2 rounded-full backdrop-blur-sm transition-all hover:scale-105"
            style={{ background: `${colors.background}80` }}
          >
            <HiOutlineArrowLeft className="w-5 h-5" style={{ color: colors.textPrimary }} />
          </button>
        </div>
      )}
      
      {/* Hero Header */}
      <div className="relative h-72 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(180deg, ${colors.error}30 0%, ${colors.accent}20 50%, ${colors.background} 100%)`,
          }}
        />

        {/* Floating Hearts */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, idx) => (
            <div
              key={idx}
              className="absolute animate-float-slow opacity-20"
              style={{
                left: `${15 + idx * 15}%`,
                top: `${20 + (idx % 3) * 20}%`,
                animationDelay: `${idx * 0.5}s`,
              }}
            >
              <HiOutlineHeart style={{ color: colors.error }} size={24 + idx * 8} />
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="flex items-end gap-8">
            {/* Album Art Grid */}
            <div className="w-48 h-48 rounded-2xl overflow-hidden shadow-2xl flex-shrink-0 relative">
              {likedTracks.length >= 4 ? (
                <div className="grid grid-cols-2 w-full h-full">
                  {likedTracks.slice(0, 4).map((track) => (
                    <div key={track.id} className="relative overflow-hidden">
                      {track.artworkUrl ? (
                        <img src={track.artworkUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center"
                          style={{ background: `linear-gradient(135deg, ${colors.error}, ${colors.accent})` }}
                        >
                          <HiOutlineMusicalNote className="text-white/50" size={20} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, ${colors.error}, ${colors.accent})` }}
                >
                  <HiOutlineHeart className="text-white" size={70} />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            </div>

            {/* Info */}
            <div className="flex-1 pb-2">
              <h1 className="text-4xl font-bold mb-4">Любимые</h1>
              <div className="flex items-center gap-4 text-sm" style={{ color: colors.textSecondary }}>
                <span className="flex items-center gap-1">
                  <HiOutlineHeart style={{ color: colors.error }} />
                  {likedTracks.length} треков
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <HiOutlineClock />
                  {hours > 0 ? `${hours}ч ${minutes}м` : `${minutes} мин`}
                </span>
                {user && (
                  <>
                    <span>•</span>
                    <span>{user.displayName}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-8 py-6 flex items-center gap-4">
        <button
          onClick={handlePlayAll}
          disabled={likedTracks.length === 0}
          className="w-14 h-14 rounded-full flex items-center justify-center hover:scale-105 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: colors.error }}
        >
          <HiOutlinePlay style={{ color: "var(--interactive-accent-text)", fontSize: "1.5rem", marginLeft: "0.25rem" }} />
        </button>
        <button
          onClick={handleShufflePlay}
          disabled={likedTracks.length === 0}
          className="w-12 h-12 rounded-full flex items-center justify-center transition-all text-white disabled:opacity-50"
          style={{ background: `${colors.accent}30` }}
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

      {/* Tracks List */}
      <div className="px-8 pb-8">
        {loading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-3 animate-pulse-slow">
                <div className="w-8 h-4 rounded" style={{ background: `${colors.surface}50` }} />
                <div className="w-12 h-12 rounded-lg" style={{ background: `${colors.surface}50` }} />
                <div className="flex-1 space-y-2">
                  <div className="h-4 rounded w-1/3" style={{ background: `${colors.surface}50` }} />
                  <div className="h-3 rounded w-1/4" style={{ background: `${colors.surface}50` }} />
                </div>
              </div>
            ))}
          </div>
        ) : likedTracks.length === 0 ? (
          <div className="text-center py-20">
            <div
              className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center"
              style={{ background: `${colors.error}10` }}
            >
              <HiOutlineHeart className="text-4xl" style={{ color: colors.error }} />
            </div>
            <h3 className="text-2xl font-bold mb-2">Здесь появятся ваши любимые треки</h3>
            <p className="max-w-md mx-auto" style={{ color: colors.textSecondary }}>
              Нажмите на сердечко, чтобы добавить трек в избранное
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {/* Header */}
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

            {/* Tracks */}
            {likedTracks.map((track, i) => (
              <div
                key={track.id}
                className="grid grid-cols-[40px_1fr_100px] gap-4 items-center px-4 py-2 rounded-lg group cursor-pointer transition-all"
                style={{ background: "transparent" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = `${colors.surface}50`)}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                onClick={() => handlePlayTrack(track, i)}
              >
                <div className="relative">
                  <span className="text-sm font-mono group-hover:hidden" style={{ color: colors.textSecondary }}>
                    {i + 1}
                  </span>
                  <HiOutlinePlayCircle className="text-xl hidden group-hover:block" style={{ color: colors.error }} />
                </div>

                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 relative">
                    {track.artworkUrl ? (
                      <img src={track.artworkUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center"
                        style={{ background: `linear-gradient(135deg, ${colors.error}, ${colors.accent})` }}
                      >
                        <HiOutlineMusicalNote className="text-white" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate transition-colors group-hover:opacity-80">{track.title}</p>
                    <p className="text-sm truncate" style={{ color: colors.textSecondary }}>
                      {track.artist}
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleRemoveLiked(e, track.id)}
                    className="opacity-0 group-hover:opacity-100 p-2 transition-all hover:opacity-70"
                    style={{ color: colors.textSecondary }}
                  >
                    <HiOutlineTrash />
                  </button>
                </div>

                <div className="text-right text-sm font-mono" style={{ color: colors.textSecondary }}>
                  {formatDuration(track.duration)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
