import React from "react";
import { MemoizedSidebar } from "./Sidebar";
import { SettingsModal, MemoizedContentArea } from "./ContentArea";
import { PlayerBar } from "../player/PlayerBar";
import { TitleBar } from "./TitleBar";
import { FullscreenPlayer } from "../player/FullscreenPlayer";
import { QueuePanel } from "../queue/QueuePanel";
import { useThemeStore } from "../../stores/themeStore";
import { useNavigationStore } from "../../stores/navigationStore";
import { usePlayerSettingsStore } from "../../stores/playerSettingsStore";
import { usePlayerStore } from "../../stores/playerStore";
import { AnimatePresence } from "framer-motion";
import { memo } from "react";

// Memoized QueuePanel to prevent re-renders
const MemoizedQueuePanel = memo(QueuePanel);

export function MainLayout() {
  const { currentTheme } = useThemeStore();
  const { colors } = currentTheme;
  const { currentRoute } = useNavigationStore();
  const { 
    sidebarPosition, 
    miniPlayerStyle, 
    isModalOpen, 
    queuePosition, 
    showQueue, 
    setShowQueue,
    backgroundImageEnabled,
    customBackgroundUrl,
    customBackgroundFile,
    backgroundImageOpacity,
    backgroundImageBlur
  } = usePlayerSettingsStore();
  // Use selector to only subscribe to isFullscreen and setFullscreen
  const isFullscreen = usePlayerStore((state) => state.isFullscreen);
  const setFullscreen = usePlayerStore((state) => state.setFullscreen);

  // Hide PlayerBar when on player view or when modal is open
  const showPlayerBar = currentRoute !== "player" && !isModalOpen;

  // Sidebar position layout
  const isTopSidebar = sidebarPosition === 'top';
  const isRightSidebar = sidebarPosition === 'right';
  
  // All player styles are floating/overlay - Compact is attached to bottom edge
  const isFloatingPlayer = miniPlayerStyle === "glass" || miniPlayerStyle === "minimal";
  const isOverlayPlayer = miniPlayerStyle === "classic" || miniPlayerStyle === "compact";
  
  // Queue position
  const isQueueLeft = queuePosition === 'left';
  const isQueueRight = queuePosition === 'right';
  const isQueueBottom = queuePosition === 'bottom';

  const backgroundUrl = customBackgroundFile || customBackgroundUrl;

  return (
    <div 
      className="flex flex-col h-screen overflow-hidden transition-colors duration-300 relative app-container"
      style={{ 
        backgroundColor: backgroundImageEnabled ? 'transparent' : colors.background,
        color: colors.textPrimary,
        position: "relative",
        zIndex: 10
      }}
    >

      {/* Fullscreen Player - overlay mode with animation */}
      <AnimatePresence>
        {isFullscreen && (
          <FullscreenPlayer onClose={() => setFullscreen(false)} />
        )}
      </AnimatePresence>

      {/* TitleBar - full width at top */}
      <div className="relative z-10">
        <TitleBar />
      </div>

      {/* Top Sidebar */}
      {isTopSidebar && (
        <div className="relative z-10">
          <MemoizedSidebar horizontal />
        </div>
      )}

      {/* Main content area with Sidebar and Queue */}
      <div className={`flex flex-1 overflow-hidden relative z-10 ${isRightSidebar ? 'flex-row-reverse' : ''}`}>
        {/* Sidebar - left or right */}
        {!isTopSidebar && <MemoizedSidebar />}

        {/* Content with optional side queue */}
        <div className={`flex flex-1 overflow-hidden ${isQueueBottom ? 'flex-col' : ''}`}>
          {/* Left Queue Panel */}
          {isQueueLeft && !isQueueBottom && (
            <div className={`transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden ${showQueue ? 'w-96' : 'w-0'}`}>
              <MemoizedQueuePanel isOpen={showQueue} onClose={() => setShowQueue(false)} />
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden min-w-0 relative">
            <div className="relative z-10 flex-1 flex flex-col overflow-hidden">
              <MemoizedContentArea />
            </div>
          </div>

          {/* Right Queue Panel */}
          {isQueueRight && !isQueueBottom && (
            <div className={`transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden ${showQueue ? 'w-96' : 'w-0'}`}>
              <MemoizedQueuePanel isOpen={showQueue} onClose={() => setShowQueue(false)} />
            </div>
          )}

          {/* Bottom Queue Panel */}
          {isQueueBottom && (
            <div 
              className={`border-t flex-shrink-0 overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${showQueue ? 'h-48' : 'h-0'}`}
              style={{ borderColor: showQueue ? "var(--border-base)" : "transparent", background: "var(--surface-card)" }}
            >
              <MemoizedQueuePanel isOpen={showQueue} onClose={() => setShowQueue(false)} />
            </div>
          )}
        </div>
      </div>
      
      {/* Floating player - positioned at bottom center with gap */}
      {showPlayerBar && isFloatingPlayer && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-[calc(100%-80px)] max-w-5xl">
          <PlayerBar />
        </div>
      )}
      
      {/* Overlay player - attached to bottom edge, respects sidebar */}
      {showPlayerBar && isOverlayPlayer && (
        <div 
          className="absolute z-20"
          style={{ 
            bottom: '0',
            left: !isTopSidebar && !isRightSidebar ? '72px' : '0',
            right: !isTopSidebar && isRightSidebar ? '72px' : '0',
          }}
        >
          <PlayerBar />
        </div>
      )}
      
      {/* Settings Modal - above everything including PlayerBar */}
      <SettingsModal />
    </div>
  );
}
