import { useState, useEffect } from "react";
import { 
  HiOutlineCheck,
  HiOutlineCog6Tooth
} from "react-icons/hi2";
import { useThemeStore } from "../../stores/themeStore";
import { useUserStore } from "../../stores/userStore";
import { youtubeService } from "../../services/YouTubeService";

export type SearchSource = 'soundcloud' | 'youtube' | 'spotify' | 'yandex' | 'vk' | 'local';

interface SearchSourceOption {
  id: SearchSource;
  name: string;
  icon: React.ReactNode;
  color: string;
  enabled: boolean;
  requiresIntegration?: string;
  alwaysAvailable?: boolean;
}

interface SearchSourceSelectorProps {
  selectedSources: SearchSource[];
  onSourcesChange: (sources: SearchSource[]) => void;
  className?: string;
}

// SoundCloud Icon
const SoundCloudIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className}>
    <path d="M1.175 12.225c-.051 0-.094.046-.101.1l-.233 2.154.233 2.105c.007.058.05.098.101.098.05 0 .09-.04.099-.098l.255-2.105-.27-2.154c-.009-.06-.052-.1-.084-.1zm-.899.828c-.06 0-.091.037-.104.094L0 14.479l.165 1.308c.014.057.045.094.09.094s.089-.037.099-.094l.19-1.308-.19-1.334c-.01-.057-.044-.09-.078-.09zm1.83-1.229c-.061 0-.12.045-.12.104l-.21 2.563.225 2.458c0 .06.045.104.106.104.061 0 .12-.044.12-.104l.24-2.474-.24-2.547c0-.06-.045-.104-.121-.104zm.945-.089c-.075 0-.135.06-.15.135l-.193 2.64.21 2.544c.016.077.075.138.149.138.075 0 .135-.061.15-.138l.225-2.544-.225-2.64c-.015-.075-.06-.135-.166-.135zm.964-.24c-.09 0-.165.075-.165.165l-.225 2.88.225 2.535c0 .09.075.165.165.165.091 0 .165-.075.165-.165l.24-2.535-.24-2.88c0-.09-.075-.165-.165-.165zm1.02-.285c-.105 0-.195.09-.195.195l-.225 3.165.225 2.505c0 .105.09.195.195.195.104 0 .194-.09.194-.195l.24-2.505-.24-3.165c0-.105-.09-.195-.194-.195zm1.065-.285c-.12 0-.225.105-.225.225l-.21 3.45.21 2.475c0 .12.105.225.225.225.119 0 .224-.105.224-.225l.24-2.475-.24-3.45c0-.12-.105-.225-.224-.225zm1.095-.36c-.135 0-.255.12-.255.255l-.195 3.81.195 2.43c0 .135.12.255.255.255.135 0 .255-.12.255-.255l.21-2.43-.21-3.81c0-.135-.12-.255-.255-.255zm1.14-.255c-.15 0-.285.135-.285.285l-.18 4.065.18 2.37c0 .15.135.285.285.285.15 0 .285-.135.285-.285l.195-2.37-.195-4.065c0-.15-.135-.285-.285-.285zm1.155-.195c-.165 0-.3.135-.3.3l-.165 4.26.165 2.295c0 .165.135.3.3.3.165 0 .3-.135.3-.3l.18-2.295-.18-4.26c0-.165-.135-.3-.3-.3zm1.215-.135c-.18 0-.33.15-.33.33l-.15 4.395.15 2.22c0 .18.15.33.33.33.18 0 .33-.15.33-.33l.165-2.22-.165-4.395c0-.18-.15-.33-.33-.33zm1.2.045c-.195 0-.36.165-.36.36l-.135 3.99.135 2.145c0 .195.165.36.36.36.195 0 .36-.165.36-.36l.15-2.145-.15-3.99c0-.195-.165-.36-.36-.36zm5.67 1.635c-.33 0-.645.06-.945.18-.195-2.25-2.085-4.02-4.395-4.02-.57 0-1.125.105-1.635.3-.195.075-.24.15-.24.3v8.265c0 .15.12.285.27.3h6.945c1.305 0 2.37-1.065 2.37-2.37 0-1.305-1.065-2.37-2.37-2.37z" fill="#FF5500"/>
  </svg>
);

// YouTube Icon
const YouTubeIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className}>
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z" fill="#FF0000"/>
    <path d="M9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill="white"/>
  </svg>
);

// Spotify Icon
const SpotifyIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className}>
    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" fill="#1DB954"/>
  </svg>
);

// VK Icon
const VKIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className}>
    <path d="M12.785 16.241s.288-.032.436-.194c.136-.148.132-.427.132-.427s-.02-1.304.587-1.496c.596-.19 1.364 1.259 2.177 1.815.616.422 1.084.33 1.084.33l2.178-.03s1.14-.071.599-.964c-.044-.073-.314-.661-1.618-1.869-1.366-1.265-1.183-1.06.462-3.246.999-1.33 1.398-2.142 1.273-2.489-.12-.331-.857-.244-.857-.244l-2.454.015s-.182-.025-.317.056c-.131.079-.216.262-.216.262s-.387 1.028-.903 1.903c-1.088 1.848-1.524 1.946-1.702 1.832-.414-.265-.31-1.066-.31-1.634 0-1.777.269-2.518-.524-2.71-.263-.064-.457-.106-1.13-.113-.864-.009-1.596.003-2.01.205-.276.135-.489.434-.359.451.16.021.523.098.715.359.249.337.24 1.093.24 1.093s.143 2.093-.334 2.352c-.327.18-.776-.186-1.739-1.854-.493-.855-.866-1.8-.866-1.8s-.072-.176-.2-.27c-.155-.115-.372-.151-.372-.151l-2.335.015s-.35.01-.479.163c-.114.135-.009.414-.009.414s1.82 4.258 3.88 6.404c1.889 1.967 4.032 1.838 4.032 1.838h.972z" fill="#0077FF"/>
  </svg>
);

// Yandex Icon
const YandexIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className}>
    <circle cx="12" cy="12" r="12" fill="#FFCC00"/>
    <path d="M13.5 7h-2.1c-1.7 0-3.1 1.4-3.1 3.2 0 1.3.7 2.3 2.1 3.1l-2.5 4.2h2.2l2.2-3.9v3.9h1.9V7h-.7z" fill="#1a1a1a"/>
  </svg>
);

export function SearchSourceSelector({ selectedSources, onSourcesChange, className = "" }: SearchSourceSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { currentTheme, currentThemeId } = useThemeStore();
  const { user } = useUserStore();
  const colors = currentTheme.colors;

  // Check integrations - check multiple sources
  // Spotify can be stored in localStorage (ServicePages) or user.integrations (IntegrationsView)
  const checkSpotifyConnected = () => {
    // Check localStorage first (ServicePages saves here)
    try {
      const spotifyData = localStorage.getItem('harmonix-spotify-credentials');
      if (spotifyData) {
        const { clientId, clientSecret } = JSON.parse(spotifyData);
        if (clientId && clientSecret) return true;
      }
      // Also check alternative key from ServicePages
      const spotifyDataAlt = localStorage.getItem('harmonix-srv-spotify');
      if (spotifyDataAlt) {
        const { clientId, clientSecret } = JSON.parse(spotifyDataAlt);
        if (clientId && clientSecret) return true;
      }
    } catch {}
    // Also check user integrations
    const userSpotify = (user?.integrations as any)?.spotify;
    return !!(userSpotify && userSpotify !== false);
  };

  const checkVKConnected = () => {
    // Check localStorage first (ServicePages saves here)
    try {
      const vkData = localStorage.getItem('harmonix-srv-vk');
      if (vkData) {
        const { token, accessToken } = JSON.parse(vkData);
        if (token || accessToken) return true;
      }
    } catch {}
    // Also check user integrations
    const userVK = (user?.integrations as any)?.vk;
    return !!(userVK && userVK !== false);
  };

  const checkYandexConnected = () => {
    // Check localStorage first
    try {
      const yandexData = localStorage.getItem('harmonix-srv-yandex');
      if (yandexData) {
        const { token, accessToken } = JSON.parse(yandexData);
        if (token || accessToken) return true;
      }
    } catch {}
    // Also check user integrations
    const userYandex = (user?.integrations as any)?.yandex;
    return !!(userYandex && userYandex !== false);
  };
  
  const isSpotifyConnected = checkSpotifyConnected();
  const isVKConnected = checkVKConnected();
  const isYandexConnected = checkYandexConnected();
  const yandexTokenPresent = (() => {
    try {
      const yandexData = localStorage.getItem('harmonix-srv-yandex');
      if (yandexData) {
        const { token, accessToken } = JSON.parse(yandexData);
        return !!(token || accessToken);
      }
    } catch {}
    return false;
  })();

  // Always show Yandex if token is present
  useEffect(() => {
    if (yandexTokenPresent && !selectedSources.includes('yandex')) {
      // If no other sources are selected, or only one, auto-select Yandex
      if (selectedSources.length === 0 || (selectedSources.length === 1 && selectedSources[0] !== 'yandex')) {
        onSourcesChange([...selectedSources, 'yandex']);
      }
    }
  }, [yandexTokenPresent]);

  // Enable YouTube when selected
  useEffect(() => {
    if (selectedSources.includes('youtube')) {
      youtubeService.setEnabled(true);
    }
  }, [selectedSources]);

  const sources: SearchSourceOption[] = [
    {
      id: 'soundcloud',
      name: 'SoundCloud',
      icon: <SoundCloudIcon />, 
      color: '#FF5500',
      enabled: true,
      alwaysAvailable: true
    },
    {
      id: 'youtube',
      name: 'YouTube',
      icon: <YouTubeIcon />, 
      color: '#FF0000',
      enabled: true,
      alwaysAvailable: true
    },
    {
      id: 'spotify',
      name: 'Spotify',
      icon: <SpotifyIcon />, 
      color: '#1DB954',
      enabled: isSpotifyConnected,
      requiresIntegration: 'spotify'
    },
    {
      id: 'yandex',
      name: 'Яндекс Музыка',
      icon: <YandexIcon />, 
      color: '#FFCC00',
      enabled: isYandexConnected || yandexTokenPresent,
      requiresIntegration: 'yandex'
    },
    {
      id: 'vk',
      name: 'VK Музыка',
      icon: <VKIcon />, 
      color: '#0077FF',
      enabled: isVKConnected,
      requiresIntegration: 'vk'
    },
  ];

  const toggleSource = (sourceId: SearchSource) => {
    const source = sources.find(s => s.id === sourceId);
    if (!source?.enabled) return;

    // Enable YouTube service when selecting it
    if (sourceId === 'youtube') {
      youtubeService.setEnabled(true);
    }

    if (selectedSources.includes(sourceId)) {
      if (selectedSources.length > 1) {
        onSourcesChange(selectedSources.filter(s => s !== sourceId));
      }
    } else {
      onSourcesChange([...selectedSources, sourceId]);
    }
  };

  // Get button style based on theme
  const getButtonStyle = () => {
    const isDarkOutline = ['dark', 'dark-amoled'].includes(currentThemeId);
    const isLightOutline = ['light', 'light-stone', 'light-slate'].includes(currentThemeId);
    
    if (isDarkOutline) {
      return { background: 'white', color: 'black' };
    }
    if (isLightOutline) {
      return { background: '#18181b', color: 'white' };
    }
    return { background: colors.accent, color: 'white' };
  };

  const buttonStyle = getButtonStyle();

  return (
    <div className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-3 rounded-xl transition-all hover:scale-[1.02]"
        style={{
          background: `${colors.surface}80`,
          border: `1px solid ${colors.accent}20`,
        }}
      >
        {/* Selected source icons */}
        <div className="flex items-center gap-1">
          {selectedSources.map((sourceId) => {
            const source = sources.find(s => s.id === sourceId);
            if (!source) return null;
            return (
              <div
                key={sourceId}
                className="w-6 h-6 rounded-md flex items-center justify-center"
                style={{ background: `${source.color}20` }}
              >
                {source.icon}
              </div>
            );
          })}
        </div>
        
        <HiOutlineCog6Tooth 
          size={16} 
          className={`transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`}
          style={{ color: colors.textSecondary }}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          
          <div 
            className="absolute right-0 top-full mt-2 w-64 rounded-xl border shadow-2xl z-50 animate-scale-in overflow-hidden"
            style={{
              background: `${colors.surface}f5`,
              backdropFilter: 'blur(20px)',
              border: `1px solid ${colors.accent}30`,
            }}
          >
            {/* Header */}
            <div className="px-3 py-2.5 border-b" style={{ borderColor: `${colors.accent}20` }}>
              <span className="text-xs font-semibold" style={{ color: colors.textSecondary }}>
                Источники поиска
              </span>
            </div>

            {/* Sources List */}
            <div className="p-2 max-h-[300px] overflow-y-auto">
              {sources.map((source) => {
                const isSelected = selectedSources.includes(source.id);
                const isDisabled = !source.enabled;
                
                return (
                  <button
                    key={source.id}
                    onClick={() => !isDisabled && toggleSource(source.id)}
                    disabled={isDisabled}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-all ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.01]'}`}
                    style={{
                      background: isSelected ? `${source.color}15` : 'transparent',
                    }}
                  >
                    {/* Icon */}
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        background: isSelected ? `${source.color}25` : `${colors.surface}50`,
                      }}
                    >
                      {source.icon}
                    </div>

                    {/* Name */}
                    <div className="flex-1 text-left min-w-0">
                      <span 
                        className="text-sm font-medium block truncate"
                        style={{ color: colors.textPrimary }}
                      >
                        {source.name}
                      </span>
                      {isDisabled && source.requiresIntegration && (
                        <span className="text-[10px]" style={{ color: colors.textSecondary }}>
                          Подключите в интеграциях
                        </span>
                      )}
                      {source.alwaysAvailable && (
                        <span className="text-[10px]" style={{ color: colors.textSecondary }}>
                          Всегда доступен
                        </span>
                      )}
                    </div>

                    {/* Checkbox */}
                    <div 
                      className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0"
                      style={{
                        borderColor: isSelected ? source.color : colors.textSecondary,
                        background: isSelected ? source.color : 'transparent',
                        opacity: isDisabled ? 0.5 : 1,
                      }}
                    >
                      {isSelected && <HiOutlineCheck size={12} className="text-white" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="px-3 py-2.5 border-t" style={{ borderColor: `${colors.accent}20` }}>
              <button
                onClick={() => setIsOpen(false)}
                className="w-full py-2 rounded-lg text-xs font-medium transition-all hover:scale-[1.02] hover:opacity-90"
                style={{ 
                  background: buttonStyle.background,
                  color: buttonStyle.color,
                }}
              >
                Готово
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
