import { useState } from 'react';
import {
  HiOutlineMusicalNote,
  HiOutlinePlay,
  HiOutlineSparkles,
} from 'react-icons/hi2';
import { useProfilePinsStore } from '../../stores/profilePinsStore';
import { audioService } from '../../services/AudioService';
import { useThemeStore } from '../../stores/themeStore';

interface PinnedContentProps {
  onEditClick?: () => void;
}

export function PinnedContent(_props: PinnedContentProps) {
  const { pinnedTracks } = useProfilePinsStore();
  const { currentTheme } = useThemeStore();
  const { colors } = currentTheme;
  const [playingId, setPlayingId] = useState<string | null>(null);

  const handlePlayTrack = async (track: typeof pinnedTracks[0]) => {
    setPlayingId(track.trackId);
    try {
      const { streamFallbackService } = await import('../../services/StreamFallbackService');
      
      const trackData = {
        id: track.trackId,
        title: track.title,
        artist: track.artist,
        artworkUrl: track.artworkUrl,
        duration: 0,
        streamUrl: "",
        platform: 'soundcloud' as const,
        metadata: {},
      };
      
      const result = await streamFallbackService.getStreamUrl(trackData);
      if (result.streamUrl) {
        const trackToPlay = result.fallbackTrack || trackData;
        audioService.load({ ...trackToPlay, streamUrl: result.streamUrl });
      } else {
        window.dispatchEvent(
          new CustomEvent("show-toast", {
            detail: { message: "Не удалось загрузить трек", type: "error" },
          })
        );
      }
    } catch (e) {
      console.error('Failed to play track:', e);
      window.dispatchEvent(
        new CustomEvent("show-toast", {
          detail: { message: "Ошибка при загрузке трека", type: "error" },
        })
      );
    }
    setPlayingId(null);
  };

  if (pinnedTracks.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 px-6">
      <div 
        className="p-4 rounded-2xl"
        style={{ 
          background: "rgba(255,255,255,0.08)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.15)",
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <HiOutlineSparkles size={18} style={{ color: colors.accent }} />
          <span className="text-base font-bold" style={{ color: "#fff" }}>
            Избранное
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {pinnedTracks.slice(0, 4).map((track) => (
            <div
              key={track.trackId}
              onClick={() => handlePlayTrack(track)}
              className="group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all hover:scale-[1.02] hover:bg-white/10"
              style={{ 
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 relative">
                {track.artworkUrl ? (
                  <img src={track.artworkUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ background: colors.accent }}>
                    <HiOutlineMusicalNote className="text-white text-lg" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  {playingId === track.trackId ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <HiOutlinePlay style={{ color: "var(--interactive-accent-text)", fontSize: "1.125rem" }} />
                  )}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: "#fff" }}>
                  {track.title}
                </p>
                <p className="text-xs truncate mt-0.5" style={{ color: "rgba(255,255,255,0.6)" }}>
                  {track.artist}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
