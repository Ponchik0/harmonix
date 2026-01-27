import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineBell,
  HiOutlinePlay,
  HiOutlineCheck,
  HiOutlineChevronRight,
  HiOutlineSparkles,
  HiOutlineUserPlus,
  HiOutlineArrowPath,
} from 'react-icons/hi2';
import { FaSoundcloud, FaYoutube, FaSpotify } from 'react-icons/fa';
import { SiVk } from 'react-icons/si';
import { useArtistSubscriptionsStore } from '../../stores/artistSubscriptionsStore';
import { audioService } from '../../services/AudioService';
import { soundCloudService } from '../../services/SoundCloudService';
import { useThemeStore } from '../../stores/themeStore';

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

export function ArtistReleasesSection() {
  const { subscriptions, newReleases, markReleaseSeen, markAllSeen, getUnseenCount, addNewRelease } = useArtistSubscriptionsStore();
  const { currentTheme } = useThemeStore();
  const { colors } = currentTheme;

  const unseenCount = getUnseenCount();
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(false);

  const displayedReleases = showAll ? newReleases : newReleases.slice(0, 6);

  // Fetch new releases from subscribed artists
  const fetchNewReleases = async () => {
    if (subscriptions.length === 0 || loading) return;
    
    setLoading(true);
    try {
      for (const artist of subscriptions.slice(0, 5)) { // Limit to 5 artists
        const artistId = artist.id.replace('sc-user-', '');
        const tracks = await soundCloudService.getUserTracks(artistId, 5);
        
        for (const track of tracks) {
          // Add recent tracks (use current time as release date)
          addNewRelease({
            id: `release-${track.id}`,
            artistId: artist.id,
            artistName: artist.name,
            trackId: track.id,
            trackTitle: track.title,
            artworkUrl: track.artworkUrl,
            platform: 'soundcloud',
            releasedAt: Date.now(),
          });
        }
      }
    } catch (e) {
      console.error('Failed to fetch releases:', e);
    }
    setLoading(false);
  };

  // Auto-fetch on mount if we have subscriptions but no releases
  useEffect(() => {
    if (subscriptions.length > 0 && newReleases.length === 0) {
      fetchNewReleases();
    }
  }, [subscriptions.length]);

  const handlePlayRelease = async (release: typeof newReleases[0]) => {
    markReleaseSeen(release.id);
    try {
      const streamUrl = await soundCloudService.getStreamUrl(release.trackId.replace('sc-', ''));
      if (streamUrl) {
        audioService.load({
          id: release.trackId,
          title: release.trackTitle,
          artist: release.artistName,
          artworkUrl: release.artworkUrl,
          duration: 0,
          streamUrl,
          platform: release.platform as any,
          metadata: {},
        });
      }
    } catch (e) {
      console.error('Failed to play release:', e);
    }
  };

  if (subscriptions.length === 0) {
    return (
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: `${colors.accent}20` }}>
            <HiOutlineBell size={20} style={{ color: colors.accent }} />
          </div>
          <div>
            <h2 className="text-lg font-bold" style={{ color: colors.textPrimary }}>
              Новинки от артистов
            </h2>
            <p className="text-xs" style={{ color: colors.textSecondary }}>
              Подпишитесь на артистов чтобы видеть их новые треки
            </p>
          </div>
        </div>

        <div
          className="rounded-2xl p-6 text-center"
          style={{ background: colors.surface, border: `1px solid ${colors.textSecondary}20` }}
        >
          <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${colors.accent}30, ${colors.accent}10)` }}>
            <HiOutlineUserPlus size={28} style={{ color: colors.accent }} />
          </div>
          <h3 className="font-semibold mb-2" style={{ color: colors.textPrimary }}>
            Нет подписок
          </h3>
          <p className="text-sm mb-4 max-w-xs mx-auto" style={{ color: colors.textSecondary }}>
            Подпишитесь на любимых артистов и мы покажем их новые релизы здесь
          </p>
          <div className="flex items-center justify-center gap-2 text-xs" style={{ color: colors.textSecondary }}>
            <HiOutlineSparkles size={14} />
            <span>Нажмите на артиста → Подписаться</span>
          </div>
        </div>
      </div>
    );
  }

  if (newReleases.length === 0) {
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: `${colors.accent}20` }}>
              <HiOutlineBell size={20} style={{ color: colors.accent }} />
            </div>
            <div>
              <h2 className="text-lg font-bold" style={{ color: colors.textPrimary }}>
                Новинки от артистов
              </h2>
              <p className="text-xs" style={{ color: colors.textSecondary }}>
                {subscriptions.length} подписок
              </p>
            </div>
          </div>
          <button
            onClick={fetchNewReleases}
            disabled={loading}
            className="p-2 rounded-lg transition-all hover:scale-105 disabled:opacity-50"
            style={{ background: `${colors.accent}20` }}
          >
            <HiOutlineArrowPath size={18} className={loading ? 'animate-spin' : ''} style={{ color: colors.accent }} />
          </button>
        </div>

        <div
          className="rounded-2xl p-6 text-center"
          style={{ background: colors.surface, border: `1px solid ${colors.textSecondary}20` }}
        >
          {loading ? (
            <>
              <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                style={{ background: `${colors.accent}15` }}>
                <HiOutlineArrowPath size={28} className="animate-spin" style={{ color: colors.accent }} />
              </div>
              <h3 className="font-semibold mb-2" style={{ color: colors.textPrimary }}>
                Загрузка...
              </h3>
              <p className="text-sm" style={{ color: colors.textSecondary }}>
                Ищем новые треки от ваших артистов
              </p>
            </>
          ) : (
            <>
              <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                style={{ background: 'rgba(34,197,94,0.15)' }}>
                <HiOutlineCheck size={28} className="text-green-400" />
              </div>
              <h3 className="font-semibold mb-2" style={{ color: colors.textPrimary }}>
                Всё прослушано!
              </h3>
              <p className="text-sm" style={{ color: colors.textSecondary }}>
                Новых релизов от ваших артистов пока нет
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: `${colors.accent}20` }}>
              <HiOutlineBell size={20} style={{ color: colors.accent }} />
            </div>
            {unseenCount > 0 && (
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                <span className="text-[10px] font-bold text-white">{unseenCount > 9 ? '9+' : unseenCount}</span>
              </div>
            )}
          </div>
          <div>
            <h2 className="text-lg font-bold" style={{ color: colors.textPrimary }}>
              Новинки от артистов
            </h2>
            <p className="text-xs" style={{ color: colors.textSecondary }}>
              <span style={{ color: colors.accent, fontWeight: 500 }}>{newReleases.length}</span> новых треков
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchNewReleases}
            disabled={loading}
            className="p-2 rounded-lg transition-all hover:scale-105 disabled:opacity-50"
            style={{ background: `${colors.textSecondary}15` }}
          >
            <HiOutlineArrowPath size={16} className={loading ? 'animate-spin' : ''} style={{ color: colors.textSecondary }} />
          </button>
          {unseenCount > 0 && (
            <button
              onClick={markAllSeen}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105"
              style={{ background: 'rgba(255,255,255,0.1)', color: colors.textSecondary }}
            >
              Отметить всё
            </button>
          )}
          {newReleases.length > 6 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{ background: `${colors.accent}20`, color: colors.accent }}
            >
              {showAll ? 'Свернуть' : 'Все'}
              <HiOutlineChevronRight size={14} className={showAll ? 'rotate-90' : ''} />
            </button>
          )}
        </div>
      </div>

      {/* Releases grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
        <AnimatePresence>
          {displayedReleases.map((release, index) => (
            <motion.div
              key={release.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.05 }}
              className="group relative"
            >
              <div
                className="rounded-xl overflow-hidden transition-all cursor-pointer hover:scale-[1.02]"
                style={{
                  background: colors.surface,
                  border: `1px solid ${!release.seen ? colors.accent : colors.textSecondary}20`,
                  boxShadow: !release.seen ? `0 0 15px ${colors.accent}15` : 'none',
                }}
                onClick={() => handlePlayRelease(release)}
              >
                {/* Artwork */}
                <div className="aspect-square relative">
                  {release.artworkUrl ? (
                    <img src={release.artworkUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.1)' }}>
                      <HiOutlineSparkles size={20} style={{ color: colors.textSecondary }} />
                    </div>
                  )}
                  
                  {/* Play overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "var(--interactive-accent)", color: "var(--interactive-accent-text)" }}>
                      <HiOutlinePlay size={16} className="ml-0.5" />
                    </div>
                  </div>

                  {/* New badge */}
                  {!release.seen && (
                    <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[8px] font-bold"
                      style={{ background: colors.accent, color: 'var(--interactive-accent-text)' }}>
                      NEW
                    </div>
                  )}

                  {/* Service icon */}
                  <div className="absolute bottom-1.5 right-1.5 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center">
                    <ServiceIcon platform={release.platform} size={10} />
                  </div>
                </div>

                {/* Info */}
                <div className="p-2">
                  <p className="text-xs font-medium truncate" style={{ color: colors.textPrimary }}>
                    {release.trackTitle}
                  </p>
                  <p className="text-[10px] truncate" style={{ color: colors.textSecondary }}>
                    {release.artistName}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
