import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineCpuChip,
  HiOutlineCircleStack,
  HiOutlineXMark,
  HiOutlineComputerDesktop,
  HiOutlineCheckCircle,
} from 'react-icons/hi2';
import {
  FaSpotify,
  FaYoutube,
  FaSoundcloud,
  FaYandex,
} from 'react-icons/fa';
import { SiVk } from 'react-icons/si';
import {
  useExecutionModeStore,
  featureGroups,
  featureLabels,
  type ServiceModes,
} from '../../stores/executionModeStore';

interface ExecutionModePanelProps {
  service: 'spotify' | 'yandex' | 'vk' | 'soundcloud' | 'youtube';
  accentColor: string;
}

const services = [
  { id: 'soundcloud' as const, name: 'SoundCloud', icon: FaSoundcloud, color: '#FF5500' },
  { id: 'youtube' as const, name: 'YouTube', icon: FaYoutube, color: '#FF0000' },
  { id: 'spotify' as const, name: 'Spotify', icon: FaSpotify, color: '#1DB954' },
  { id: 'yandex' as const, name: 'Яндекс', icon: FaYandex, color: '#FFCC00' },
  { id: 'vk' as const, name: 'VK Music', icon: SiVk, color: '#0077FF' },
];

export function ExecutionModePanel({ service, accentColor }: ExecutionModePanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(service);
  const { setServiceMode, setAllServiceModes, getMode } = useExecutionModeStore();

  const currentService = services.find(s => s.id === selectedService) || services[0];

  const serverCount = Object.keys(featureLabels).filter(
    (f) => getMode(selectedService, f as keyof ServiceModes) === 'server'
  ).length;
  const localCount = Object.keys(featureLabels).length - serverCount;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full rounded-xl overflow-hidden transition-all hover:scale-[1.01]"
        style={{
          background: 'var(--surface-card)',
          border: '1px solid var(--border-base)',
        }}
      >
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: `${accentColor}20` }}
            >
              <HiOutlineCpuChip size={18} style={{ color: accentColor }} />
            </div>
            <div className="text-left">
              <span className="text-sm font-medium block" style={{ color: 'var(--text-primary)' }}>
                Режимы выполнения
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(59,130,246,0.15)', color: '#60A5FA' }}>
                  {localCount} локально
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(245,158,11,0.15)', color: '#FBBF24' }}>
                  {serverCount} сервер
                </span>
              </div>
            </div>
          </div>
          <HiOutlineCpuChip size={20} style={{ color: accentColor }} />
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div
                className="w-full max-w-4xl max-h-[85vh] rounded-2xl overflow-hidden flex"
                style={{
                  background: 'var(--surface-canvas)',
                  border: '1px solid var(--border-base)',
                  boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                }}
              >
                {/* Left side - Features */}
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
                          Режимы выполнения
                        </h2>
                        <p className="text-xs" style={{ color: 'var(--text-subtle)' }}>
                          {currentService.name}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                      style={{ background: 'var(--surface-elevated)', color: 'var(--text-secondary)' }}
                    >
                      <HiOutlineXMark size={20} />
                    </button>
                  </div>

                  {/* Stats */}
                  <div className="px-5 py-3 flex gap-3" style={{ background: 'var(--surface-card)' }}>
                    <button
                      onClick={() => setAllServiceModes(selectedService, 'local')}
                      className="flex-1 p-3 rounded-xl transition-all hover:scale-[1.02]"
                      style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <HiOutlineComputerDesktop size={14} className="text-blue-400" />
                        <span className="text-xs font-medium text-blue-400">Локально</span>
                      </div>
                      <span className="text-2xl font-bold text-blue-400">{localCount}</span>
                    </button>
                    <button
                      onClick={() => setAllServiceModes(selectedService, 'server')}
                      className="flex-1 p-3 rounded-xl transition-all hover:scale-[1.02]"
                      style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <HiOutlineCircleStack size={14} className="text-amber-400" />
                        <span className="text-xs font-medium text-amber-400">Основной</span>
                      </div>
                      <span className="text-2xl font-bold text-amber-400">{serverCount}</span>
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
                                className="p-3 rounded-xl flex items-center justify-between transition-all cursor-pointer hover:scale-[1.01]"
                                style={{
                                  background: 'var(--surface-card)',
                                  border: `1px solid ${isServer ? 'rgba(245,158,11,0.3)' : 'var(--border-base)'}`,
                                }}
                                onClick={() => setServiceMode(selectedService, feature, isServer ? 'local' : 'server')}
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
                                  className="w-6 h-6 rounded-md flex items-center justify-center"
                                  style={{ 
                                    background: isServer ? currentService.color : 'transparent',
                                    border: isServer ? 'none' : '2px solid var(--border-base)',
                                  }}
                                >
                                  {isServer && <HiOutlineCheckCircle size={16} className="text-white" />}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right side - Services */}
                <div
                  className="w-16 flex flex-col items-center py-4 gap-2"
                  style={{ background: 'var(--surface-card)', borderLeft: '1px solid var(--border-base)' }}
                >
                  {services.map((svc) => {
                    const Icon = svc.icon;
                    const isActive = selectedService === svc.id;
                    return (
                      <button
                        key={svc.id}
                        onClick={() => setSelectedService(svc.id)}
                        className="w-10 h-10 rounded-xl flex items-center justify-center transition-all relative group"
                        style={{
                          background: isActive ? `${svc.color}20` : 'transparent',
                          border: isActive ? `1px solid ${svc.color}40` : '1px solid transparent',
                        }}
                      >
                        <Icon
                          size={20}
                          style={{ color: isActive ? svc.color : 'var(--text-subtle)' }}
                        />
                        {isActive && (
                          <motion.div
                            layoutId="service-indicator-panel"
                            className="absolute -right-[1px] top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-l"
                            style={{ background: svc.color }}
                          />
                        )}
                        {/* Tooltip */}
                        <div className="absolute right-full mr-2 px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                          style={{ background: 'var(--surface-elevated)', color: 'var(--text-primary)' }}>
                          {svc.name}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
