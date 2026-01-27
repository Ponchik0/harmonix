import { SearchSource } from "./SearchSourceSelector";

interface TrackSourceBadgeProps {
  source: SearchSource;
  size?: string | number;
  className?: string;
}

export function TrackSourceBadge({ source, size = 'sm', className = "" }: TrackSourceBadgeProps) {
  const sourceConfig = {
    soundcloud: {
      name: 'SC',
      color: '#FF5500',
      icon: (
        <svg viewBox="0 0 24 24" className="w-3 h-3">
          <path d="M11.56 8.87V17h8.76c1.85 0 3.35-1.51 3.35-3.38 0-1.87-1.5-3.38-3.35-3.38-.19 0-.38.02-.57.05-.3-2.29-2.24-4.07-4.6-4.07-1.63 0-3.07.85-3.89 2.13-.06-.01-.12-.01-.18-.01-1.95 0-3.52 1.58-3.52 3.53v.01z" fill="currentColor"/>
        </svg>
      )
    },
    youtube: {
      name: 'YT',
      color: '#FF0000',
      icon: (
        <svg viewBox="0 0 24 24" className="w-3 h-3">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z" fill="currentColor"/>
          <path d="M9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill="white"/>
        </svg>
      )
    },
    spotify: {
      name: 'SP',
      color: '#1DB954',
      icon: (
        <svg viewBox="0 0 24 24" className="w-3 h-3">
          <circle cx="12" cy="12" r="12" fill="currentColor"/>
          <path d="M17.2 10.5c-2.8-1.7-7.4-1.8-10-1-.4.1-.8-.1-.9-.5-.1-.4.1-.8.5-.9 3-1 8-.8 11.2 1.1.4.2.5.7.3 1.1-.2.3-.7.4-1.1.2z" fill="white"/>
        </svg>
      )
    },
    yandex: {
      name: 'YM',
      color: '#FFCC00',
      icon: (
        <svg viewBox="0 0 24 24" className="w-3 h-3">
          <circle cx="12" cy="12" r="12" fill="currentColor"/>
          <path d="M13.5 7h-2.1c-1.7 0-3.1 1.4-3.1 3.2 0 1.3.7 2.3 2.1 3.1l-2.5 4.2h2.2l2.2-3.9v3.9h1.9V7h-.7z" fill="white"/>
        </svg>
      )
    },
    vk: {
      name: 'VK',
      color: '#0077FF',
      icon: (
        <svg viewBox="0 0 24 24" className="w-3 h-3">
          <rect width="24" height="24" rx="6" fill="currentColor"/>
          <path d="M12.77 16.87h.79s.24-.03.36-.16c.11-.12.11-.35.11-.35s-.02-1.06.48-1.22c.49-.15 1.12 1.01 1.79 1.46.51.34.89.26.89.26l1.79-.02s.94-.06.49-.79c-.04-.06-.26-.55-1.32-1.55z" fill="white"/>
        </svg>
      )
    },
    local: {
      name: 'LC',
      color: '#6B7280',
      icon: (
        <svg viewBox="0 0 24 24" className="w-3 h-3" fill="currentColor">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      )
    }
  };

  const config = sourceConfig[source];
  if (!config) return null;

  const badgeSize = typeof size === 'number' ? `${size}px` : size === 'sm' ? '18px' : '22px';

  return (
    <div 
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full font-bold uppercase tracking-wider ${className}`}
      style={{
        fontSize: badgeSize,
        background: `${config.color}20`,
        color: config.color,
        border: `1px solid ${config.color}30`
      }}
    >
      {config.icon}
      <span>{config.name}</span>
    </div>
  );
}