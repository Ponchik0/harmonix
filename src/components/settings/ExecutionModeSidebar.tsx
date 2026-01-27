import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineCpuChip,
  HiOutlineCircleStack,
  HiOutlineXMark,
  HiOutlineGlobeAlt,
  HiOutlineComputerDesktop,
  HiOutlineBolt,
  HiOutlineShieldCheck,
} from 'react-icons/hi2';
import {
  FaSpotify,
  FaYoutube,
  FaSoundcloud,
} from 'react-icons/fa';
import { SiVk } from 'react-icons/si';
import {
  useExecutionModeStore,
  featureGroups,
  featureLabels,
  type ServiceModes,
} from '../../stores/executionModeStore';

interface ExecutionModeSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  initialService?: string;
}

// Custom Yandex Music Icon
const YandexMusicIcon = ({ size = 24, className }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 50 50" fill="none" className={className}>
    <path 
      d="M43.79 18.14l-5.07 4.06C38.9 23.11 39 24.04 39 25c0 7.72-6.28 14-14 14s-14-6.28-14-14c0-7.04 5.22-12.88 12-13.86V5.1C12.9 6.11 5 14.65 5 25c0 11.03 8.97 20 20 20s20-8.97 20-20C45 22.59 44.57 20.28 43.79 18.14z" 
      fill="currentColor"
    />
    <circle cx="25" cy="25" r="7" fill="currentColor"/>
    <path 
      d="M39.99 11.77l-3.41 5.37c-1.79-2.63-4.46-4.63-7.58-5.56V5.4C33.33 6.28 37.17 8.57 39.99 11.77z" 
      fill="currentColor"
    />
    <rect width="3" height="16" x="29" y="9" fill="currentColor"/>
  </svg>
);

const services = [
  { id: 'soundcloud', name: 'SoundCloud', icon: FaSoundcloud, color: '#FF5500' },
  { id: 'youtube', name: 'YouTube', icon: FaYoutube, color: '#FF0000' },
  { id: 'spotify', name: 'Spotify', icon: FaSpotify, color: '#1DB954' },
  { id: 'yandex', name: 'Яндекс', icon: YandexMusicIcon, color: '#FFCC00' },
  { id: 'vk', name: 'VK Music', icon: SiVk, color: '#0077FF' },
];

export function ExecutionModeSidebar({ isOpen, onClose, initialService }: ExecutionModeSidebarProps) {
  const [selectedService, setSelectedService] = useState(initialService || 'soundcloud');
  const { setServiceMode, setAllServiceModes, getMode } = useExecutionModeStore();

  const currentService = services.find(s => s.id === selectedService) || services[0];

  const serverCount = Object.keys(featureLabels).filter(
    (f) => getMode(selectedService, f as keyof ServiceModes) === 'server'
  ).length;
  const localCount = Object.keys(featureLabels).length - serverCount;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-[480px] z-50 flex"
            style={{ background: 'var(--surface-canvas)' }}
          >
            {/* Service selector */}
            <div
              className="w-16 flex flex-col items-center py-4 gap-2"
              style={{ background: 'var(--surface-card)', borderRight: '1px solid var(--border-base)' }}
            >
              {services.map((service) => {
                const Icon = service.icon;
                const isActive = selectedService === service.id;
                return (
                  <button
                    key={service.id}
                    onClick={() => setSelectedService(service.id)}
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-all relative group"
                    style={{
                      background: isActive ? `${service.color}20` : 'transparent',
                      border: isActive ? `1px solid ${service.color}40` : '1px solid transparent',
                    }}
                  >
                    <Icon
                      size={20}
                      style={{ color: isActive ? service.color : 'var(--text-subtle)' }}
                    />
                    {isActive && (
                      <motion.div
                        layoutId="service-indicator"
                        className="absolute -left-[1px] top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-r"
                        style={{ background: service.color }}
                      />
                    )}
                    {/* Tooltip */}
                    <div className="absolute left-full ml-2 px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                      style={{ background: 'var(--surface-elevated)', color: 'var(--text-primary)' }}>
                      {service.name}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Main content */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Header */}
              <div
                className="px-5 py-4 flex items-center justify-between"
                style={{ borderBottom: '1px solid var(--border-base)' }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: `${currentService.color}20` }}
                  >
                    <currentService.icon size={20} style={{ color: currentService.color }} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                      {currentService.name}
                    </h2>
                    <p className="text-xs" style={{ color: 'var(--text-subtle)' }}>
                      Режимы выполнения
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                  style={{ background: 'var(--surface-elevated)', color: 'var(--text-secondary)' }}
                >
                  <HiOutlineXMark size={20} />
                </button>
              </div>

              {/* Stats */}
              <div className="px-5 py-3 flex gap-3" style={{ background: 'var(--surface-card)' }}>
                <div className="flex-1 p-3 rounded-xl" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <HiOutlineComputerDesktop size={14} className="text-blue-400" />
                    <span className="text-xs font-medium text-blue-400">Локально</span>
                  </div>
                  <span className="text-2xl font-bold text-blue-400">{localCount}</span>
                </div>
                <div className="flex-1 p-3 rounded-xl" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <HiOutlineCircleStack size={14} className="text-amber-400" />
                    <span className="text-xs font-medium text-amber-400">Сервер</span>
                  </div>
                  <span className="text-2xl font-bold text-amber-400">{serverCount}</span>
                </div>
              </div>

              {/* Quick actions */}
              <div className="px-5 py-3 flex gap-2">
                <button
                  onClick={() => setAllServiceModes(selectedService, 'local')}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                  style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', color: '#60A5FA' }}
                >
                  <HiOutlineBolt size={16} />
                  Всё локально
                </button>
                <button
                  onClick={() => setAllServiceModes(selectedService, 'server')}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                  style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', color: '#FBBF24' }}
                >
                  <HiOutlineGlobeAlt size={16} />
                  Всё на сервер
                </button>
              </div>

              {/* Features list */}
              <div className="flex-1 overflow-y-auto px-5 py-3 space-y-4">
                {Object.entries(featureGroups).map(([groupKey, group]) => (
                  <div key={groupKey}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-subtle)' }}>
                        {group.label}
                      </span>
                      <div className="flex-1 h-px" style={{ background: 'var(--border-base)' }} />
                    </div>
                    <div className="space-y-2">
                      {group.features.map((feature) => {
                        const mode = getMode(selectedService, feature);
                        const isServer = mode === 'server';
                        return (
                          <div
                            key={feature}
                            className="p-3 rounded-xl flex items-center justify-between transition-all"
                            style={{
                              background: 'var(--surface-card)',
                              border: `1px solid ${isServer ? 'rgba(245,158,11,0.2)' : 'var(--border-base)'}`,
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center"
                                style={{ background: isServer ? 'rgba(245,158,11,0.15)' : 'rgba(59,130,246,0.15)' }}
                              >
                                {isServer ? (
                                  <HiOutlineCircleStack size={16} className="text-amber-400" />
                                ) : (
                                  <HiOutlineCpuChip size={16} className="text-blue-400" />
                                )}
                              </div>
                              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                {featureLabels[feature]}
                              </span>
                            </div>
                            <div
                              className="relative w-24 h-8 rounded-lg p-1 cursor-pointer"
                              style={{ background: 'var(--surface-canvas)' }}
                              onClick={() => setServiceMode(selectedService, feature, isServer ? 'local' : 'server')}
                            >
                              <motion.div
                                className="absolute top-1 h-6 w-[calc(50%-4px)] rounded-md"
                                animate={{ left: isServer ? '4px' : 'calc(50%)' }}
                                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                                style={{ background: isServer ? '#F59E0B' : '#3B82F6' }}
                              />
                              <div className="relative flex h-full">
                                <span className={`flex-1 flex items-center justify-center text-[10px] font-medium z-10 ${isServer ? 'text-white' : ''}`}
                                  style={{ color: isServer ? 'white' : 'var(--text-subtle)' }}>
                                  Сервер
                                </span>
                                <span className={`flex-1 flex items-center justify-center text-[10px] font-medium z-10`}
                                  style={{ color: !isServer ? 'white' : 'var(--text-subtle)' }}>
                                  Локально
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer info */}
              <div className="px-5 py-3" style={{ borderTop: '1px solid var(--border-base)' }}>
                <div className="p-3 rounded-xl flex items-start gap-3" style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
                  <HiOutlineShieldCheck size={18} className="text-purple-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-purple-400 mb-1">Про режимы</p>
                    <p className="text-[11px]" style={{ color: 'var(--text-subtle)' }}>
                      <b>Локально</b> — запросы идут напрямую с вашего ПК. Быстрее, но может блокироваться.
                      <br />
                      <b>Сервер</b> — запросы через наш прокси. Обходит блокировки, но чуть медленнее.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
