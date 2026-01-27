import { memo } from "react";
import {
  Home,
  Music,
  Library,
  Search,
  Settings,
  ShieldCheck,
  User,
} from "lucide-react";
import { motion } from "framer-motion";
import { useNavigationStore } from "../../stores/navigationStore";
import { useUserStore } from "../../stores/userStore";
import "./Sidebar.css";

type NavId =
  | "home"
  | "player"
  | "library"
  | "search"
  | "profile"
  | "settings"
  | "admin";

interface NavItem {
  id: NavId;
  icon: typeof Home;
  label: string;
}

const navItems: NavItem[] = [
  { id: "home", icon: Home, label: "Главная" },
  { id: "player", icon: Music, label: "Плеер" },
  { id: "library", icon: Library, label: "Библиотека" },
  { id: "search", icon: Search, label: "Поиск" },
];

interface SidebarProps {
  horizontal?: boolean;
}

export function Sidebar({ horizontal = false }: SidebarProps) {
  const { currentRoute, navigate, settingsOpen, openSettings } =
    useNavigationStore();
  const { user } = useUserStore();
  const isAdmin = user?.isAdmin || false;

  const NavButton = ({
    item,
    onClick,
    highlight,
  }: {
    item: NavItem;
    onClick?: () => void;
    highlight?: boolean;
  }) => {
    const Icon = item.icon;
    // Library should be active when on "liked" or "playlists" routes too
    const isActive =
      item.id === "settings"
        ? settingsOpen
        : item.id === "library"
        ? currentRoute === "library" ||
          currentRoute === "liked" ||
          currentRoute === "playlists"
        : currentRoute === item.id;

    return (
      <div className="relative flex items-center justify-center">
        {isActive && (
          <motion.div
            layoutId="active-nav-indicator"
            className="absolute inset-0 bg-white/10 rounded-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        )}
        <motion.button
          type="button"
          onClick={onClick || (() => navigate(item.id as any))}
          title={item.label}
          className={`sidebar-nav-btn relative z-10 flex items-center justify-center w-11 h-11 rounded-xl transition-colors ${
            isActive ? "text-white" : "text-white/60 hover:text-white"
          } ${highlight ? "text-amber-400 hover:text-amber-300" : ""}`}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="sidebar-nav-icon">
            <Icon size={24} strokeWidth={2} />
          </span>
        </motion.button>
      </div>
    );
  };

  if (horizontal) {
    return (
      <nav
        className="sidebar-container-horizontal"
        style={{
          background: "rgba(0,0,0,0.2)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <div className="sidebar-horizontal-content">
          {/* Left - Home */}
          <div className="sidebar-horizontal-left">
            <NavButton item={navItems[0]} />
          </div>

          {/* Center - Main nav items */}
          <div className="sidebar-horizontal-nav">
            {navItems.slice(1).map((item) => (
              <NavButton key={item.id} item={item} />
            ))}
          </div>

          {/* Right - Profile + Admin + Settings */}
          <div className="sidebar-horizontal-right">
            {/* Profile Avatar Button */}
            <motion.button
              type="button"
              onClick={() => navigate("profile")}
              title="Профиль"
              className={`sidebar-avatar-btn relative z-10 w-[36px] h-[36px] rounded-full flex items-center justify-center border-2 bg-white/5 transition-colors overflow-hidden ${
                currentRoute === "profile"
                  ? "border-white/50 shadow-[0_0_0_3px_rgba(255,255,255,0.1)]"
                  : "border-white/10 hover:border-white/30"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              data-active={currentRoute === "profile"}
            >
              {user?.avatar ? (
                <img src={user.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="sidebar-avatar-placeholder text-white/70 font-semibold text-sm">
                  {user?.displayName?.[0]?.toUpperCase() || "?"}
                </span>
              )}
            </motion.button>

            {isAdmin && (
              <NavButton
                item={{
                  id: "admin",
                  icon: ShieldCheck,
                  label: "Админ-панель",
                }}
                highlight
              />
            )}
            <NavButton
              item={{
                id: "settings",
                icon: Settings,
                label: "Настройки",
              }}
              onClick={openSettings}
            />
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav
      className="sidebar-container"
      style={{
        background: "rgba(0,0,0,0.2)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderRight: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      {/* Logo / Home */}
      <div className="sidebar-section sidebar-top">
        <NavButton item={navItems[0]} />
      </div>

      {/* Main Navigation */}
      <div className="sidebar-section sidebar-center">
        {navItems.slice(1).map((item) => (
          <NavButton key={item.id} item={item} />
        ))}
      </div>

      {/* Bottom - Admin + Profile + Settings */}
      <div className="sidebar-section sidebar-bottom">
        {/* Admin Panel Button - above profile */}
        {isAdmin && (
          <NavButton
            item={{
              id: "admin",
              icon: ShieldCheck,
              label: "Админ-панель",
            }}
            highlight
          />
        )}

        {/* Profile Avatar Button */}
        <motion.button
          type="button"
          onClick={() => navigate("profile")}
          title="Профиль"
          className={`sidebar-avatar-btn relative z-10 w-[42px] h-[42px] rounded-full flex items-center justify-center border-2 bg-white/5 transition-colors overflow-hidden ${
            currentRoute === "profile"
              ? "border-white/50 shadow-[0_0_0_3px_rgba(255,255,255,0.1)]"
              : "border-white/10 hover:border-white/30"
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          data-active={currentRoute === "profile"}
        >
          {user?.avatar ? (
            <img src={user.avatar} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="sidebar-avatar-placeholder text-white/70 font-semibold text-base">
              {user?.displayName?.[0]?.toUpperCase() || "?"}
            </span>
          )}
        </motion.button>

        <NavButton
          item={{
            id: "settings",
            icon: Settings,
            label: "Настройки",
          }}
          onClick={openSettings}
        />
      </div>
    </nav>
  );
}

// Export memoized version to prevent re-renders from parent
export const MemoizedSidebar = memo(Sidebar);
