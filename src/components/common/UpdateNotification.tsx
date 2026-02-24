import { useState, useEffect } from 'react';
import { HiOutlineArrowDownTray, HiOutlineXMark, HiArrowPath } from 'react-icons/hi2';
import { updateService, UpdateInfo, UpdateStatus } from '../../services/UpdateService';
import { useThemeStore } from '../../stores/themeStore';

export function UpdateNotification() {
  const [update, setUpdate] = useState<UpdateInfo | null>(null);
  const [visible, setVisible] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const { currentTheme, currentThemeId } = useThemeStore();
  const colors = currentTheme.colors;
  const isLight = !!(currentThemeId?.includes("light") || currentTheme.mode === "light");

  useEffect(() => {
    // Проверяем обновления при загрузке
    updateService.checkForUpdates();

    // Подписываемся на обновления
    const unsubscribe = updateService.subscribe((newUpdate) => {
      if (newUpdate && !updateService.isDismissed(newUpdate.version)) {
        setUpdate(newUpdate);
        setVisible(true);
      } else {
        setVisible(false);
      }
    });

    // Подписываемся на статусы обновлений
    const unsubscribeStatus = updateService.subscribeToStatus((status) => {
      setUpdateStatus(status);

      if (status.status === 'downloading' && status.data) {
        const progress = Math.round((status.data.percent || 0) * 100);
        setDownloadProgress(progress);
      } else if (status.status === 'downloaded') {
        setIsDownloading(false);
      } else if (status.status === 'error') {
        setIsDownloading(false);
      }
    });

    // Listen for test update event from admin panel
    const handleTestUpdate = (e: any) => {
      const fakeUpdate = e.detail;
      setUpdate(fakeUpdate);
      setVisible(true);
    };
    window.addEventListener('test-update', handleTestUpdate);

    // Периодическая проверка каждые 30 минут
    const interval = setInterval(() => {
      updateService.checkForUpdates();
    }, 30 * 60 * 1000);

    return () => {
      unsubscribe();
      unsubscribeStatus();
      window.removeEventListener('test-update', handleTestUpdate);
      clearInterval(interval);
    };
  }, []);

  const handleDismiss = () => {
    if (update) {
      updateService.dismissUpdate(update.version);
    }
    setVisible(false);
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    const success = await updateService.downloadUpdate();
    if (!success) {
      setIsDownloading(false);
    }
  };

  const handleInstall = async () => {
    await updateService.installUpdate();
  };

  const handleCheckAgain = async () => {
    await updateService.checkForUpdates(true);
  };

  // Показываем уведомление в dev режиме для тестирования
  const isDevMode = import.meta.env.DEV;

  if (!visible || !update) return null;

  const isDownloaded = updateStatus?.status === 'downloaded';
  const isChecking = updateStatus?.status === 'checking';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        animation: 'fadeIn 0.3s ease-out',
      }}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 40px ${colors.accent}40; }
          50% { box-shadow: 0 0 60px ${colors.accent}60; }
        }
      `}</style>

      <div
        className="w-full max-w-md rounded-3xl overflow-hidden"
        style={{
          background: colors.background,
          border: `2px solid ${colors.accent}60`,
          animation: 'slideUp 0.4s ease-out, pulse-glow 2s ease-in-out infinite',
          boxShadow: `0 20px 60px rgba(0, 0, 0, 0.5)`,
        }}
      >
        {/* Header */}
        <div
          className="px-6 py-5 flex items-center gap-4"
          style={{ 
            background: isLight ? `linear-gradient(135deg, ${colors.accent}, ${colors.secondary})` : `linear-gradient(135deg, ${colors.accent}20, ${colors.secondary}15)`,
            borderBottom: `1px solid ${colors.accent}30` 
          }}
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: isLight ? `linear-gradient(135deg, ${colors.accent}, ${colors.secondary})` : '#ffffff' }}
          >
            {isChecking ? (
              <HiArrowPath size={28} className={isLight ? 'text-white animate-spin' : 'text-black animate-spin'} />
            ) : (
              <HiOutlineArrowDownTray size={28} className={isLight ? 'text-white' : 'text-black'} />
            )}
          </div>
          <div className="flex-1">
            <p className="font-bold text-xl" style={{ color: isLight ? '#ffffff' : colors.textPrimary }}>
              {isChecking ? 'Проверка обновлений...' : 'Доступно обновление!'}
            </p>
            <p className="text-base font-medium" style={{ color: isLight ? 'rgba(255, 255, 255, 0.9)' : colors.accent }}>
              Версия {update.version}
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="p-2 rounded-xl transition-all hover:scale-110"
            style={{ background: isLight ? 'rgba(255, 255, 255, 0.2)' : `${colors.textSecondary}15`, color: isLight ? '#ffffff' : colors.textPrimary }}
          >
            <HiOutlineXMark size={22} />
          </button>
        </div>

        {/* Changelog - Always visible */}
        {update.changelog && update.changelog.length > 0 && (
          <div className="px-6 py-4" style={{ background: colors.surface }}>
            <p className="text-sm font-bold mb-3" style={{ color: colors.textPrimary }}>
              Что нового:
            </p>
            <ul className="space-y-2">
              {update.changelog.map((item, i) => (
                <li
                  key={i}
                  className="text-sm flex items-start gap-3"
                  style={{ color: colors.textSecondary }}
                >
                  <span 
                    className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" 
                    style={{ background: colors.accent }}
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Download Progress */}
        {isDownloading && (
          <div className="px-6 py-4" style={{ background: colors.background }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                Загрузка обновления...
              </span>
              <span className="text-sm font-bold" style={{ color: colors.accent }}>
                {downloadProgress}%
              </span>
            </div>
            <div
              className="h-3 rounded-full overflow-hidden"
              style={{ background: `${colors.accent}20` }}
            >
              <div
                className="h-full transition-all duration-300"
                style={{
                  width: `${downloadProgress}%`,
                  background: `linear-gradient(90deg, ${colors.accent}, ${colors.secondary})`,
                }}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="px-6 py-5 flex gap-3" style={{ background: colors.background }}>
          {!isDownloaded && !isDownloading && (
            <>
              <button
                onClick={handleDismiss}
                className="flex-1 py-3.5 rounded-xl text-sm font-bold transition-all hover:scale-[1.02]"
                style={{
                  background: isLight ? `${colors.textSecondary}15` : `${colors.textSecondary}20`,
                  color: colors.textPrimary,
                }}
              >
                Позже
              </button>
              <button
                onClick={handleDownload}
                className="flex-1 py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                style={{
                  background: isLight ? `linear-gradient(135deg, ${colors.accent}, ${colors.secondary})` : '#ffffff',
                  color: isLight ? '#ffffff' : '#000000',
                  boxShadow: `0 4px 16px ${colors.accent}40`,
                }}
              >
                <HiOutlineArrowDownTray size={18} />
                Скачать
              </button>
            </>
          )}

          {isDownloading && (
            <button
              disabled
              className="w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 opacity-70"
              style={{
                background: isLight ? `linear-gradient(135deg, ${colors.accent}, ${colors.secondary})` : '#ffffff',
                color: isLight ? '#ffffff' : '#000000',
              }}
            >
              <HiArrowPath size={18} className="animate-spin" />
              Загрузка...
            </button>
          )}

          {isDownloaded && (
            <button
              onClick={handleInstall}
              className="w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
              style={{
                background: isLight ? `linear-gradient(135deg, ${colors.accent}, ${colors.secondary})` : '#ffffff',
                color: isLight ? '#ffffff' : '#000000',
                boxShadow: `0 4px 16px ${colors.accent}40`,
              }}
            >
              <HiOutlineArrowDownTray size={18} />
              Установить и перезапустить
            </button>
          )}
        </div>

        {/* Mandatory warning */}
        {update.mandatory && (
          <div
            className="px-6 py-3 text-sm text-center font-bold flex items-center justify-center gap-2"
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#EF4444',
              borderTop: '1px solid rgba(239, 68, 68, 0.3)',
            }}
          >
            <HiOutlineXMark size={18} />
            Обязательное обновление
          </div>
        )}

        {/* Dev mode indicator */}
        {isDevMode && (
          <div
            className="px-6 py-3 text-xs text-center font-medium"
            style={{
              background: `${colors.accent}15`,
              color: colors.accent,
              borderTop: `1px solid ${colors.accent}30`,
            }}
          >
            🧪 Dev Mode - Тестирование уведомления
          </div>
        )}
      </div>
    </div>
  );
}
