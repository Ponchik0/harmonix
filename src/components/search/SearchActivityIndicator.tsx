import { SearchSource } from "./SearchSourceSelector";
import { useThemeStore } from "../../stores/themeStore";

interface SearchActivityIndicatorProps {
  isSearching: boolean;
  activeSources: SearchSource[];
  query: string;
}

export function SearchActivityIndicator({ isSearching, activeSources, query }: SearchActivityIndicatorProps) {
  const { currentTheme } = useThemeStore();
  const colors = currentTheme.colors;

  if (!isSearching) return null;

  const sourceColors: Record<SearchSource, string> = {
    soundcloud: '#FF5500',
    youtube: '#FF0000',
    spotify: '#1DB954',
    yandex: '#FFCC00',
    vk: '#0077FF',
    local: '#6B7280'
  };

  return (
    <div 
      className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-slide-down"
      style={{
        background: `${colors.surface}f0`,
        backdropFilter: 'blur(20px)',
        border: `1px solid ${colors.accent}30`,
        borderRadius: '12px',
        padding: '12px 20px',
        boxShadow: `0 8px 32px rgba(0,0,0,0.3)`
      }}
    >
      <div className="flex items-center gap-3">
        {/* Animated search icon */}
        <div className="relative">
          <div 
            className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: colors.accent }}
          />
          <div 
            className="absolute inset-0 w-5 h-5 border-2 border-transparent border-t-current rounded-full animate-spin"
            style={{ 
              color: colors.secondary,
              animationDirection: 'reverse',
              animationDuration: '1.5s'
            }}
          />
        </div>

        {/* Search text */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>
            Поиск "{query}"
          </span>
        </div>

        {/* Source indicators */}
        <div className="flex items-center gap-1">
          {activeSources.map((sourceId, index) => (
            <div
              key={sourceId}
              className="w-2 h-2 rounded-full animate-pulse-subtle"
              style={{ 
                backgroundColor: sourceColors[sourceId],
                animationDelay: `${index * 300}ms`
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}