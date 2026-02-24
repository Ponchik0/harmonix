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
import { useThemeStore } from "../../stores/themeStore";
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
  const { currentTheme } = useThemeStore();
  const colors = currentTheme.colors;
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
            className="absolute inset-0 rounded-xl"
            style={{ background: `${colors.accent}15` }}
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
          className={`sidebar-nav-btn relative z-10 flex items-center justify-center w-11 h-11 rounded-xl transition-colors`}
          style={{
            color: isActive ? colors.accent : `${colors.textPrimary}60`,
          }}
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
          background: colors.surface,
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: `1px solid ${colors.accent}10`,
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
              className={`sidebar-avatar-btn relative z-10 w-[36px] h-[36px] rounded-full flex items-center justify-center border-2 transition-colors overflow-hidden`}
              style={{
                background: `${colors.surface}50`,
                borderColor: currentRoute === "profile" ? `${colors.accent}80` : `${colors.accent}20`,
                boxShadow: currentRoute === "profile" ? `0 0 0 3px ${colors.accent}20` : "none",
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              data-active={currentRoute === "profile"}
            >
              {user?.avatar ? (
                <img src={user.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="font-semibold text-sm" style={{ color: `${colors.textPrimary}70` }}>
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
        background: colors.surface,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderRight: `1px solid ${colors.accent}10`,
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
          className={`sidebar-avatar-btn relative z-10 w-[42px] h-[42px] rounded-full flex items-center justify-center border-2 transition-colors overflow-hidden`}
          style={{
            background: `${colors.surface}50`,
            borderColor: currentRoute === "profile" ? `${colors.accent}80` : `${colors.accent}20`,
            boxShadow: currentRoute === "profile" ? `0 0 0 3px ${colors.accent}20` : "none",
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          data-active={currentRoute === "profile"}
        >
          {user?.avatar ? (
            <img src={user.avatar} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="font-semibold text-base" style={{ color: `${colors.textPrimary}70` }}>
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
