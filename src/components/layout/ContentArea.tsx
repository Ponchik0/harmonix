import { useState, useEffect, memo } from "react";
import { useNavigationStore } from "../../stores/navigationStore";
import { HomeView } from "../home/HomeView";
import { SearchView } from "../search/SearchView";
import { SettingsView } from "../settings/SettingsView";
import { LikedSongsView } from "../liked/LikedSongsView";
import { PlaylistsView } from "../playlists/PlaylistsView";
import { LibraryView } from "../library/LibraryView";
import { ProfileView } from "../profile/ProfileView";
import { AdminPanel } from "../profile/AdminPanel";
import { usePlayerSettingsStore } from "../../stores/playerSettingsStore";
import { NowPlayingView } from "../player/NowPlayingView";
import { FullSettingsPage } from "../settings/FullSettingsPage";
import { AuroraBackground } from "../background/AuroraBackground";

// Settings Modal Component
export function SettingsModal() {
  const { settingsOpen, closeSettings } = useNavigationStore();
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (settingsOpen) {
      setIsVisible(true);
      // Плавная анимация появления
      requestAnimationFrame(() =>
        requestAnimationFrame(() => setIsAnimating(true))
      );
    } else {
      setIsAnimating(false);
      // Плавная анимация исчезновения
      const timer = setTimeout(() => setIsVisible(false), 500);
      return () => clearTimeout(timer);
    }
  }, [settingsOpen]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop with blur - clickable to close */}
      <div
        className="absolute inset-0 transition-all duration-500 cursor-pointer"
        onClick={closeSettings}
        style={{
          backgroundColor: isAnimating ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0)",
          backdropFilter: isAnimating ? "blur(20px)" : "blur(0px)",
        }}
      />

      {/* Modal - centered with smooth animation */}
      <div
        className="relative rounded-3xl overflow-hidden glass-fluid liquid-border"
        style={{
          width: "calc(100% - 200px)",
          height: "calc(100% - 100px)",
          maxWidth: "1200px",
          background: "rgba(10, 10, 10, 0.85)",
          backdropFilter: "blur(40px) saturate(180%)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          boxShadow: isAnimating ? "0 25px 80px rgba(0,0,0,0.5), 0 0 30px var(--glow-color, rgba(255,255,255,0.05))" : "none",
          transform: isAnimating
            ? "scale(1) translateY(0)"
            : "scale(0.95) translateY(20px)",
          opacity: isAnimating ? 1 : 0,
          transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Settings Content */}
        <div className="h-full">
          <SettingsView />
        </div>
      </div>
    </div>
  );
}

// Admin Page Wrapper - full page admin panel
function AdminPageWrapper() {
  return (
    <div
      className="h-full overflow-y-auto p-6"
      style={{ background: "var(--surface-canvas)" }}
    >
      <AdminPanel />
    </div>
  );
}

export function ContentArea({ playerPadding = 0 }: { playerPadding?: number }) {
  const { currentRoute } = useNavigationStore();
  const { backgroundImageEnabled } = usePlayerSettingsStore();
  const [displayedRoute, setDisplayedRoute] = useState(currentRoute);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionsEnabled, setTransitionsEnabled] = useState(true);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');

  // Route order for determining slide direction
  const routeOrder = ['home', 'player', 'library', 'search', 'profile', 'admin'];

  // Check optimization settings
  useEffect(() => {
    const checkSettings = () => {
      try {
        const saved = localStorage.getItem("harmonix-optimization");
        if (saved) {
          const settings = JSON.parse(saved);
          setTransitionsEnabled(
            !settings.disablePageTransitions && !settings.disableAnimations
          );
        }
      } catch {}
    };
    checkSettings();
    window.addEventListener("optimization-changed", checkSettings);
    return () =>
      window.removeEventListener("optimization-changed", checkSettings);
  }, []);

  // Handle route transitions
  useEffect(() => {
    if (currentRoute !== displayedRoute) {
      if (transitionsEnabled) {
        // Determine slide direction based on route order
        const currentIndex = routeOrder.indexOf(currentRoute);
        const previousIndex = routeOrder.indexOf(displayedRoute);
        setSlideDirection(currentIndex > previousIndex ? 'left' : 'right');
        
        setIsTransitioning(true);
        const timer = setTimeout(() => {
          setDisplayedRoute(currentRoute);
          setIsTransitioning(false);
        }, 200);
        return () => clearTimeout(timer);
      } else {
        setDisplayedRoute(currentRoute);
      }
    }
  }, [currentRoute, displayedRoute, transitionsEnabled]);

  if (displayedRoute === "full-settings") return <FullSettingsPage />;

  const renderContent = () => {
    switch (displayedRoute) {
      case "home":
        return <HomeView />;
      case "search":
        return <SearchView />;
      case "player":
        return <NowPlayingView />;
      case "profile":
        return <ProfileView />;
      case "admin":
        return <AdminPageWrapper />;
      case "liked":
        return <LikedSongsView />;
      case "playlists":
        return <PlaylistsView />;
      case "library":
        return <LibraryView />;
      default:
        return <HomeView />;
    }
  };

  const getTransformStyle = () => {
    if (!transitionsEnabled) return 'translateX(0) scale(1)';
    if (isTransitioning) {
      return 'scale(0.98)';
    }
    return 'translateX(0) scale(1)';
  };

  return (
    <main
      className="flex-1 overflow-hidden relative app-no-drag transition-[padding] duration-300 ease-fluid"
      style={{ 
        background: backgroundImageEnabled ? "transparent" : "var(--surface-canvas)",
        paddingBottom: `${playerPadding}px`,
      }}
    >
      {/* Aurora Background */}
      <AuroraBackground />

      <div
        className="h-full relative z-10"
        style={{
          opacity: isTransitioning ? 0 : 1,
          transform: getTransformStyle(),
          filter: isTransitioning ? 'blur(6px)' : 'blur(0px)',
          transition: transitionsEnabled
            ? "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
            : "none",
        }}
      >
        {renderContent()}
      </div>
    </main>
  );
}

// Export memoized version to prevent re-renders from parent
export const MemoizedContentArea = memo(ContentArea);
