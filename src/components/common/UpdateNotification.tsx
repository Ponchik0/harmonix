import { useState, useEffect } from 'react';
import { HiOutlineArrowDownTray, HiOutlineXMark, HiOutlineSparkles, HiArrowPath } from 'react-icons/hi2';
import { updateService, UpdateInfo, UpdateStatus } from '../../services/UpdateService';
import { useThemeStore } from '../../stores/themeStore';

export function UpdateNotification() {
  const [update, setUpdate] = useState<UpdateInfo | null>(null);
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const { currentTheme } = useThemeStore();
  const colors = currentTheme.colors;

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

    // Периодическая проверка каждые 30 минут
    const interval = setInterval(() => {
      updateService.checkForUpdates();
    }, 30 * 60 * 1000);

    return () => {
      unsubscribe();
      unsubscribeStatus();
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

  if (!visible || !update) return null;

  const isDownloaded = updateStatus?.status === 'downloaded';
  const isChecking = updateStatus?.status === 'checking';

  return (
    <div
      className="fixed bottom-24 right-4 z-50 max-w-sm animate-in slide-in-from-right duration-300"
      style={{
        animation: 'slideInRight 0.3s ease-out',
      }}
    >
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px ${colors.accent}40; }
          50% { box-shadow: 0 0 30px ${colors.accent}60; }
        }
      `}</style>

      <div
        className="rounded-2xl overflow-hidden backdrop-blur-xl"
        style={{
          background: `linear-gradient(135deg, ${colors.accent}20, ${colors.secondary}20)`,
          border: `1px solid ${colors.accent}40`,
          animation: 'pulse-glow 2s ease-in-out infinite',
        }}
      >
        {/* Header */}
        <div
          className="px-4 py-3 flex items-center gap-3"
          style={{ borderBottom: `1px solid ${colors.accent}30` }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${colors.accent}, ${colors.secondary})` }}
          >
            {isChecking ? (
              <HiArrowPath size={20} className="text-white animate-spin" />
            ) : (
              <HiOutlineSparkles size={20} className="text-white" />
            )}
          </div>
          <div className="flex-1">
            <p className="font-semibold" style={{ color: colors.textPrimary }}>
              {isChecking ? 'Проверка обновлений...' : 'Доступно обновление!'}
            </p>
            <p className="text-sm" style={{ color: colors.textSecondary }}>
              Версия {update.version}
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-lg transition-colors hover:bg-white/10"
            style={{ color: colors.textSecondary }}
          >
            <HiOutlineXMark size={18} />
          </button>
        </div>

        {/* Changelog (expandable) */}
        {update.changelog && update.changelog.length > 0 && (
          <div className="px-4 py-2">
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-sm hover:underline"
              style={{ color: colors.accent }}
            >
              {expanded ? 'Скрыть изменения' : 'Показать изменения'}
            </button>

            {expanded && (
              <ul className="mt-2 space-y-1">
                {update.changelog.map((item, i) => (
                  <li
                    key={i}
                    className="text-sm flex items-start gap-2"
                    style={{ color: colors.textSecondary }}
                  >
                    <span style={{ color: colors.accent }}>•</span>
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Download Progress */}
        {isDownloading && (
          <div className="px-4 py-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm" style={{ color: colors.textSecondary }}>
                Загрузка обновления...
              </span>
              <span className="text-sm font-medium" style={{ color: colors.accent }}>
                {downloadProgress}%
              </span>
            </div>
            <div
              className="h-2 rounded-full overflow-hidden"
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
        <div className="px-4 py-3 flex gap-2">
          {!isDownloaded && !isDownloading && (
            <>
              <button
                onClick={handleDismiss}
                className="flex-1 py-2 rounded-xl text-sm font-medium transition-colors"
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  color: colors.textSecondary,
                }}
              >
                Позже
              </button>
              <button
                onClick={handleDownload}
                className="flex-1 py-2 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
                style={{
                  background: `linear-gradient(135deg, ${colors.accent}, ${colors.secondary})`,
                }}
              >
                <HiOutlineArrowDownTray size={16} />
                Скачать
              </button>
            </>
          )}

          {isDownloading && (
            <button
              disabled
              className="w-full py-2 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2 opacity-70"
              style={{
                background: `linear-gradient(135deg, ${colors.accent}, ${colors.secondary})`,
              }}
            >
              <HiArrowPath size={16} className="animate-spin" />
              Загрузка...
            </button>
          )}

          {isDownloaded && (
            <button
              onClick={handleInstall}
              className="w-full py-2 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
              style={{
                background: `linear-gradient(135deg, ${colors.accent}, ${colors.secondary})`,
              }}
            >
              <HiOutlineArrowDownTray size={16} />
              Установить и перезапустить
            </button>
          )}
        </div>

        {/* Mandatory warning */}
        {update.mandatory && (
          <div
            className="px-4 py-2 text-xs text-center"
            style={{
              background: 'rgba(239, 68, 68, 0.2)',
              color: '#EF4444',
            }}
          >
            ⚠️ Обязательное обновление
          </div>
        )}
      </div>
    </div>
  );
}
