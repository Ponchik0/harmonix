import { useState, useEffect } from 'react';
import { HiOutlineGlobeAlt, HiOutlineCheck } from 'react-icons/hi2';
import { proxyService, type ProxyServiceName } from '../../services/ProxyService';
import { useThemeStore } from '../../stores/themeStore';

interface ServiceConfig {
  id: ProxyServiceName;
  name: string;
  color: string;
}

const services: ServiceConfig[] = [
  { id: 'spotify', name: 'Spotify', color: '#1DB954' },
  { id: 'yandex', name: 'Яндекс Музыка', color: '#FFCC00' },
  { id: 'vk', name: 'VK Музыка', color: '#0077FF' },
  { id: 'youtube', name: 'YouTube', color: '#FF0000' },
  { id: 'soundcloud', name: 'SoundCloud', color: '#FF5500' },
];

const ServiceIcon = ({ id, size = 20 }: { id: ProxyServiceName; size?: number }) => {
  switch (id) {
    case 'spotify':
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor">
          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
        </svg>
      );
    case 'yandex':
      return (
        <svg viewBox="0 0 50 50" width={size} height={size} fill="none">
          <path 
            d="M43.79 18.14l-5.07 4.06C38.9 23.11 39 24.04 39 25c0 7.72-6.28 14-14 14s-14-6.28-14-14c0-7.04 5.22-12.88 12-13.86V5.1C12.9 6.11 5 14.65 5 25c0 11.03 8.97 20 20 20s20-8.97 20-20C45 22.59 44.57 20.28 43.79 18.14z" 
            fill="currentColor"
            opacity="0.6"
          />
          <circle cx="25" cy="25" r="7" fill="currentColor" opacity="0.8"/>
          <path 
            d="M39.99 11.77l-3.41 5.37c-1.79-2.63-4.46-4.63-7.58-5.56V5.4C33.33 6.28 37.17 8.57 39.99 11.77z" 
            fill="currentColor"
            opacity="0.8"
          />
          <rect width="3" height="16" x="29" y="9" fill="currentColor" opacity="0.8"/>
        </svg>
      );
    case 'vk':
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor">
          <path d="M12.785 16.146s.287-.032.434-.19c.135-.146.13-.42.13-.42s-.019-1.284.577-1.474c.588-.187 1.343 1.244 2.143 1.794.605.416 1.066.325 1.066.325l2.14-.03s1.118-.069.588-.949c-.043-.072-.308-.652-1.586-1.843-1.338-1.247-1.159-1.045.453-3.202.982-1.313 1.375-2.114 1.252-2.457-.117-.328-.84-.241-.84-.241l-2.408.015s-.179-.024-.311.055c-.13.078-.213.259-.213.259s-.382 1.017-.892 1.882c-1.074 1.822-1.504 1.918-1.68 1.805-.41-.264-.307-1.06-.307-1.625 0-1.766.268-2.502-.521-2.694-.262-.064-.455-.106-1.124-.113-.859-.009-1.586.003-1.998.204-.274.134-.486.432-.357.449.159.021.52.097.711.358.247.337.238 1.094.238 1.094s.142 2.078-.331 2.335c-.325.177-.77-.184-1.726-1.837-.49-.847-.86-1.783-.86-1.783s-.071-.175-.199-.268c-.154-.113-.37-.149-.37-.149l-2.29.015s-.344.01-.47.159c-.112.133-.009.408-.009.408s1.796 4.202 3.83 6.32c1.865 1.942 3.982 1.814 3.982 1.814h.96z"/>
        </svg>
      );
    case 'youtube':
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      );
    case 'soundcloud':
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor">
          <path d="M1.175 12.225c-.051 0-.094.046-.101.1l-.233 2.154.233 2.105c.007.058.05.098.101.098.05 0 .09-.04.099-.098l.255-2.105-.27-2.154c-.009-.06-.052-.1-.084-.1zm-.899.828c-.06 0-.091.037-.104.094L0 14.479l.165 1.308c.014.057.045.094.09.094s.089-.037.099-.094l.19-1.308-.19-1.334c-.01-.057-.044-.09-.078-.09zm1.83-1.229c-.061 0-.12.045-.12.104l-.21 2.563.225 2.458c0 .06.045.104.106.104.061 0 .12-.044.12-.104l.24-2.474-.24-2.547c0-.06-.045-.104-.121-.104zm.945-.089c-.075 0-.135.06-.15.135l-.193 2.64.21 2.544c.016.077.075.138.149.138.075 0 .135-.061.15-.138l.225-2.544-.225-2.64c-.015-.075-.06-.135-.166-.135zm.964-.24c-.09 0-.165.075-.165.165l-.225 2.88.225 2.535c0 .09.075.165.165.165.091 0 .165-.075.165-.165l.24-2.535-.24-2.88c0-.09-.075-.165-.165-.165zm1.02-.285c-.105 0-.195.09-.195.195l-.225 3.165.225 2.505c0 .105.09.195.195.195.104 0 .194-.09.194-.195l.24-2.505-.24-3.165c0-.105-.09-.195-.194-.195zm1.065-.285c-.12 0-.225.105-.225.225l-.21 3.45.21 2.475c0 .12.105.225.225.225.119 0 .224-.105.224-.225l.24-2.475-.24-3.45c0-.12-.105-.225-.224-.225zm1.095-.36c-.135 0-.255.12-.255.255l-.195 3.81.195 2.43c0 .135.12.255.255.255.135 0 .255-.12.255-.255l.21-2.43-.21-3.81c0-.135-.12-.255-.255-.255zm1.14-.255c-.15 0-.285.135-.285.285l-.18 4.065.18 2.37c0 .15.135.285.285.285.15 0 .285-.135.285-.285l.195-2.37-.195-4.065c0-.15-.135-.285-.285-.285zm1.155-.195c-.165 0-.3.135-.3.3l-.165 4.26.165 2.295c0 .165.135.3.3.3.165 0 .3-.135.3-.3l.18-2.295-.18-4.26c0-.165-.135-.3-.3-.3zm1.215-.135c-.18 0-.33.15-.33.33l-.15 4.395.15 2.22c0 .18.15.33.33.33.18 0 .33-.15.33-.33l.165-2.22-.165-4.395c0-.18-.15-.33-.33-.33zm1.2.045c-.195 0-.36.165-.36.36l-.135 3.99.135 2.145c0 .195.165.36.36.36.195 0 .36-.165.36-.36l.15-2.145-.15-3.99c0-.195-.165-.36-.36-.36zm1.23-.225c-.21 0-.39.18-.39.39l-.12 4.215.12 2.055c0 .21.18.39.39.39.21 0 .39-.18.39-.39l.135-2.055-.135-4.215c0-.21-.18-.39-.39-.39zm1.275.075c-.225 0-.42.195-.42.42l-.105 4.14.105 1.98c0 .225.195.42.42.42.225 0 .42-.195.42-.42l.12-1.98-.12-4.14c0-.225-.195-.42-.42-.42zm5.67 1.635c-.33 0-.645.06-.945.18-.195-2.25-2.085-4.02-4.395-4.02-.57 0-1.125.105-1.635.3-.195.075-.24.15-.24.3v8.265c0 .15.12.285.27.3h6.945c1.305 0 2.37-1.065 2.37-2.37 0-1.305-1.065-2.37-2.37-2.37z"/>
        </svg>
      );
    default:
      return null;
  }
};


export function ProxyPage() {
  const [settings, setSettings] = useState(proxyService.getSettings());
  const [artworkProxyEnabled, setArtworkProxyEnabled] = useState(
    proxyService.isServiceProxied('artwork')
  );
  const { currentTheme, currentThemeId } = useThemeStore();
  
  // Определяем светлая ли тема (включая white темы)
  const isLight = !!(
    currentThemeId?.includes("light") || 
    currentThemeId?.includes("white") ||
    currentTheme.mode === "light" || 
    (currentTheme.colors.background && (
      currentTheme.colors.background.includes("#f") || 
      currentTheme.colors.background.includes("#F") ||
      currentTheme.colors.background.includes("#fff") ||
      currentTheme.colors.background.includes("#FFF")
    ))
  );

  useEffect(() => {
    setSettings(proxyService.getSettings());
    setArtworkProxyEnabled(proxyService.isServiceProxied('artwork'));
  }, []);

  const handleServiceToggle = (serviceId: ProxyServiceName) => {
    const currentProxy = settings.serviceProxies[serviceId];
    if (currentProxy?.enabled) {
      proxyService.setServiceProxy(serviceId, null);
    } else {
      proxyService.setServiceProxy(serviceId, { enabled: true, url: '', type: 'http' });
    }
    setSettings(proxyService.getSettings());
  };

  const handleArtworkProxyToggle = () => {
    const newValue = !artworkProxyEnabled;
    if (newValue) {
      proxyService.setServiceProxy('artwork', { enabled: true, url: '', type: 'http' });
    } else {
      proxyService.setServiceProxy('artwork', null);
    }
    setArtworkProxyEnabled(newValue);
    setSettings(proxyService.getSettings());
  };

  const enabledCount = services.filter(s => settings.serviceProxies[s.id]?.enabled).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div
        className="rounded-2xl p-4 border"
        style={{
          background: 'linear-gradient(135deg, rgba(168,85,247,0.12), rgba(168,85,247,0.02))',
          borderColor: 'rgba(168,85,247,0.2)',
        }}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #A855F7, #7C3AED)',
              boxShadow: '0 4px 16px rgba(168,85,247,0.3)',
            }}
          >
            <HiOutlineGlobeAlt size={28} className="text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                Прокси
              </h2>
              <span
                className="px-2 py-0.5 rounded-md text-[11px] font-medium"
                style={{
                  background: enabledCount > 0 ? 'rgba(34,197,94,0.15)' : 'rgba(107,114,128,0.15)',
                  border: `1px solid ${enabledCount > 0 ? 'rgba(34,197,94,0.3)' : 'rgba(107,114,128,0.3)'}`,
                  color: enabledCount > 0 ? '#22C55E' : '#6B7280',
                }}
              >
                {enabledCount}/{services.length}
              </span>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-subtle)' }}>
              Проксирование запросов к сервисам
            </p>
          </div>
        </div>
      </div>

      {/* Artwork Proxy Toggle */}
      <div
        className="rounded-2xl p-4 border transition-all"
        style={{
          background: artworkProxyEnabled 
            ? 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(168,85,247,0.05))'
            : 'var(--surface-card)',
          borderColor: artworkProxyEnabled ? 'rgba(168,85,247,0.3)' : 'var(--border-base)',
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
              style={{
                background: artworkProxyEnabled 
                  ? 'linear-gradient(135deg, #A855F7, #7C3AED)'
                  : 'var(--surface-elevated)',
                color: artworkProxyEnabled ? 'white' : 'var(--text-subtle)',
                boxShadow: artworkProxyEnabled ? '0 4px 12px rgba(168,85,247,0.3)' : 'none',
              }}
            >
              <svg viewBox="0 0 24 24" width={20} height={20} fill="currentColor">
                <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
              </svg>
            </div>
            <div>
              <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                Проксирование обложек
              </div>
              <div className="text-xs" style={{ color: 'var(--text-subtle)' }}>
                Загрузка изображений через прокси
              </div>
            </div>
          </div>
          
          {/* Toggle Switch */}
          <button
            onClick={handleArtworkProxyToggle}
            className="relative w-12 h-6 rounded-full transition-all duration-300 focus:outline-none"
            style={{
              background: artworkProxyEnabled 
                ? 'linear-gradient(135deg, #A855F7, #7C3AED)'
                : 'var(--surface-elevated)',
              boxShadow: artworkProxyEnabled ? '0 2px 8px rgba(168,85,247,0.4)' : 'none',
            }}
          >
            <div
              className="absolute top-0.5 w-5 h-5 rounded-full transition-all duration-300 shadow-md"
              style={{
                left: artworkProxyEnabled ? 'calc(100% - 22px)' : '2px',
                background: isLight ? '#000000' : '#ffffff',
              }}
            />
          </button>
        </div>
      </div>

      {/* Services grid */}
      <div className="grid grid-cols-2 gap-3">
        {services.map((service) => {
          const isEnabled = settings.serviceProxies[service.id]?.enabled;
          return (
            <button
              key={service.id}
              onClick={() => handleServiceToggle(service.id)}
              className="relative p-4 rounded-xl transition-all hover:scale-[1.02]"
              style={{
                background: isEnabled 
                  ? `linear-gradient(135deg, ${service.color}20, ${service.color}08)`
                  : 'var(--surface-card)',
                border: `2px solid ${isEnabled ? service.color : 'var(--border-base)'}`,
                boxShadow: isEnabled ? `0 4px 20px ${service.color}25` : 'none',
              }}
            >
              {/* Check indicator */}
              {isEnabled && (
                <div
                  className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: service.color }}
                >
                  <HiOutlineCheck size={12} className="text-white" />
                </div>
              )}
              
              {/* Icon */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 transition-all"
                style={{
                  background: isEnabled ? service.color : 'var(--surface-elevated)',
                  color: isEnabled ? 'white' : 'var(--text-subtle)',
                  boxShadow: isEnabled ? `0 4px 12px ${service.color}40` : 'none',
                }}
              >
                <ServiceIcon id={service.id} size={24} />
              </div>
              
              {/* Name */}
              <div
                className="text-sm font-medium text-center"
                style={{ color: isEnabled ? 'var(--text-primary)' : 'var(--text-secondary)' }}
              >
                {service.name}
              </div>
              
              {/* Status */}
              <div
                className="text-[10px] text-center mt-1"
                style={{ color: isEnabled ? service.color : 'var(--text-subtle)' }}
              >
                {isEnabled ? 'Включено' : 'Выключено'}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
