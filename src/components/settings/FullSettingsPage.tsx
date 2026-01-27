import { useState, useRef, useEffect } from "react";
import {
  Palette,
  Music,
  FolderOpen,
  Search,
  Keyboard,
  Volume2,
  Globe,
  Users,
  HardDrive,
  Settings,
  X,
  ChevronRight,
  Sun,
  Moon,
  Monitor,
  Square,
  Play,
  LayoutGrid,
  List,
  Download,
  RefreshCw,
  Upload,
  Trash2,
  Check,
  Star,
} from "lucide-react";
import { useUserStore } from "../../stores/userStore";
import { useNavigationStore } from "../../stores/navigationStore";
import { ProxyPage } from "./ProxyPage";
import { PresetsPanel } from "./PresetsPanel";
import { clsx } from "clsx";

type SettingsCategory =
  | "appearance"
  | "player"
  | "library"
  | "search"
  | "shortcuts"
  | "audio"
  | "services"
  | "social"
  | "storage"
  | "advanced";

const categories: {
  id: SettingsCategory;
  label: string;
  icon: typeof Palette;
  desc: string;
}[] = [
  {
    id: "appearance",
    label: "Appearance",
    icon: Palette,
    desc: "Theme, colors, effects",
  },
  {
    id: "player",
    label: "Player",
    icon: Music,
    desc: "Style, controls, visualizer",
  },
  {
    id: "library",
    label: "Library",
    icon: FolderOpen,
    desc: "View, sorting, filters",
  },
  { id: "search", label: "Search", icon: Search, desc: "Behavior, platforms" },
  {
    id: "shortcuts",
    label: "Shortcuts",
    icon: Keyboard,
    desc: "Keyboard bindings",
  },
  { id: "audio", label: "Audio", icon: Volume2, desc: "Quality, equalizer" },
  { id: "services", label: "Services", icon: Globe, desc: "API tokens, proxy" },
  { id: "social", label: "Social", icon: Users, desc: "Discord, Last.fm" },
  {
    id: "storage",
    label: "Storage",
    icon: HardDrive,
    desc: "Cache, offline, sync",
  },
  {
    id: "advanced",
    label: "Advanced",
    icon: Settings,
    desc: "Performance, updates",
  },
];

export function FullSettingsPage() {
  const [activeCategory, setActiveCategory] =
    useState<SettingsCategory>("appearance");
  const [presetsOpen, setPresetsOpen] = useState(false);
  const {
    user,
    updateSettings,
    updateAppearance,
    resetSettings,
    exportSettings,
  } = useUserStore();
  const { navigate } = useNavigationStore();

  if (!user) return null;
  const settings = user.settings;

  return (
    <div
      className="fixed inset-0 z-50 flex animate-fade-in"
      style={{ background: "rgba(11, 11, 15, 0.98)" }}
    >
      {/* Sidebar */}
      <div className="w-72 glass border-r border-white/5 flex flex-col">
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold font-['Space_Grotesk']">
              Settings
            </h1>
            <button
              onClick={() => navigate("home")}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
              style={{ background: 'var(--surface-elevated)', color: 'var(--text-secondary)' }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={clsx(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group",
                activeCategory === cat.id ? "glass-card" : "hover:bg-white/5"
              )}
            >
              <div
                className={clsx(
                  "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                  activeCategory === cat.id
                    ? "gradient-primary"
                    : "bg-white/5 group-hover:bg-white/10"
                )}
              >
                <cat.icon
                  size={20}
                  className={
                    activeCategory === cat.id ? "text-white" : "text-gray-400"
                  }
                />
              </div>
              <div className="flex-1 text-left">
                <p
                  className={clsx(
                    "font-medium text-sm",
                    activeCategory === cat.id ? "text-white" : "text-gray-300"
                  )}
                >
                  {cat.label}
                </p>
                <p className="text-xs text-gray-500">{cat.desc}</p>
              </div>
              <ChevronRight
                size={16}
                className={clsx(
                  "text-gray-500 transition-transform",
                  activeCategory === cat.id && "rotate-90"
                )}
              />
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5 space-y-2">
          <button
            onClick={() => {
              const json = exportSettings();
              navigator.clipboard.writeText(json);
            }}
            className="btn-glass w-full flex items-center justify-center gap-2 text-sm"
          >
            <Upload size={16} /> Export Settings
          </button>
          <button
            onClick={resetSettings}
            className="w-full py-2 text-sm text-red-400 hover:text-red-300 transition-colors"
          >
            Reset All Settings
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto">
          {activeCategory === "appearance" && (
            <AppearanceSettings
              settings={settings.appearance}
              onUpdate={(s) => updateAppearance(s)}
              onOpenPresets={() => setPresetsOpen(true)}
            />
          )}
          {activeCategory === "player" && (
            <PlayerSettings
              settings={settings.player}
              onUpdate={(s) => updateSettings("player", s)}
            />
          )}
          {activeCategory === "library" && (
            <LibrarySettings
              settings={settings.library}
              onUpdate={(s) => updateSettings("library", s)}
            />
          )}
          {activeCategory === "search" && (
            <SearchSettings
              settings={settings.search}
              onUpdate={(s) => updateSettings("search", s)}
            />
          )}
          {activeCategory === "shortcuts" && (
            <ShortcutsSettings
              settings={settings.shortcuts}
              onUpdate={(s) => updateSettings("shortcuts", s)}
            />
          )}
          {activeCategory === "audio" && (
            <AudioSettings
              settings={settings.audio}
              onUpdate={(s) => updateSettings("audio", s)}
            />
          )}
          {activeCategory === "services" && (
            <ServicesSettings
              settings={settings.services}
              onUpdate={(s) => updateSettings("services", s)}
            />
          )}
          {activeCategory === "social" && (
            <SocialSettings
              settings={settings.social}
              onUpdate={(s) => updateSettings("social", s)}
            />
          )}
          {activeCategory === "storage" && (
            <StorageSettings
              settings={settings.storage}
              onUpdate={(s) => updateSettings("storage", s)}
            />
          )}
          {activeCategory === "advanced" && (
            <AdvancedSettings
              settings={settings.advanced}
              onUpdate={(s) => updateSettings("advanced", s)}
            />
          )}
        </div>
      </div>

      {/* Presets Panel */}
      <PresetsPanel
        isOpen={presetsOpen}
        onClose={() => setPresetsOpen(false)}
      />
    </div>
  );
}

// Settings Section Components
function SettingsSection({
  title,
  desc,
  children,
}: {
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10 animate-fade-in">
      <h2 className="text-2xl font-bold font-['Space_Grotesk'] mb-1">
        {title}
      </h2>
      {desc && <p className="text-gray-400 mb-6">{desc}</p>}
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function SettingRow({
  label,
  desc,
  children,
}: {
  label: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="glass-card p-5 rounded-2xl flex items-center justify-between gap-4">
      <div className="flex-1">
        <p className="font-medium">{label}</p>
        {desc && <p className="text-sm text-gray-400">{desc}</p>}
      </div>
      {children}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={clsx(
        "w-14 h-8 rounded-full p-1 transition-all duration-300",
        checked ? "gradient-primary" : "bg-white/10"
      )}
    >
      <div
        className={clsx(
          "w-6 h-6 rounded-full shadow-lg transition-transform duration-300",
          checked && "translate-x-6"
        )}
        style={{ background: "var(--interactive-accent)" }}
      />
    </button>
  );
}

function Slider({
  value,
  min,
  max,
  step = 1,
  onChange,
  suffix = "",
}: {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  suffix?: string;
}) {
  return (
    <div className="flex items-center gap-4 w-64">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1"
      />
      <span className="text-sm text-gray-400 w-16 text-right">
        {value}
        {suffix}
      </span>
    </div>
  );
}

function Select({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selectedOption = options.find((o) => o.value === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative w-48">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full input-glass py-2 px-4 text-left flex items-center justify-between"
      >
        <span className="truncate">{selectedOption?.label || "Select..."}</span>
        <svg
          className={`w-4 h-4 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {isOpen && (
        <div
          className="absolute z-50 w-full mt-1 rounded-xl overflow-hidden border border-white/10 shadow-xl"
          style={{ background: "#1a1a24" }}
        >
          <div className="max-h-60 overflow-y-auto">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                  opt.value === value
                    ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-white"
                    : "text-gray-300 hover:bg-white/5"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Appearance Settings
function AppearanceSettings({
  settings,
  onUpdate,
  onOpenPresets,
}: {
  settings: any;
  onUpdate: (s: any) => void;
  onOpenPresets: () => void;
}) {
  const themes = [
    {
      id: "purple",
      name: "Purple Dream",
      colors: ["#8B5CF6", "#EC4899", "#F97316"],
    },
    {
      id: "blue",
      name: "Ocean Blue",
      colors: ["#3B82F6", "#06B6D4", "#10B981"],
    },
    { id: "green", name: "Forest", colors: ["#22C55E", "#84CC16", "#EAB308"] },
    { id: "red", name: "Crimson", colors: ["#EF4444", "#F97316", "#FBBF24"] },
    { id: "pink", name: "Sakura", colors: ["#EC4899", "#F472B6", "#FB7185"] },
  ];

  return (
    <>
      <SettingsSection title="Theme" desc="Choose your color scheme">
        {/* Presets Button */}
        <button
          onClick={onOpenPresets}
          className="btn-primary mb-6 flex items-center gap-2"
        >
          <Star size={18} />
          <span>Theme Presets</span>
        </button>

        <div className="flex gap-4 mb-6">
          {[
            { id: "dark", icon: Moon, label: "Dark" },
            { id: "light", icon: Sun, label: "Light" },
            { id: "auto", icon: Monitor, label: "Auto" },
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => onUpdate({ theme: mode.id })}
              className={clsx(
                "flex-1 glass-card p-4 rounded-xl flex flex-col items-center gap-2 transition-all",
                settings.theme === mode.id && "ring-2 ring-[#8B5CF6]"
              )}
            >
              <mode.icon
                size={24}
                className={
                  settings.theme === mode.id
                    ? "text-[#8B5CF6]"
                    : "text-gray-400"
                }
              />
              <span className="text-sm font-medium">{mode.label}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-5 gap-3">
          {themes.map((theme) => (
            <button
              key={theme.id}
              onClick={() => onUpdate({ themePreset: theme.id })}
              className={clsx(
                "glass-card p-4 rounded-xl transition-all card-hover",
                settings.themePreset === theme.id && "ring-2 ring-[#8B5CF6]"
              )}
            >
              <div className="flex gap-1 mb-3">
                {theme.colors.map((c, i) => (
                  <div
                    key={i}
                    className="w-6 h-6 rounded-lg"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <p className="text-sm font-medium">{theme.name}</p>
            </button>
          ))}
        </div>
      </SettingsSection>

      <SettingsSection title="Effects" desc="Visual effects and animations">
        <SettingRow label="Glassmorphism" desc="Enable blur and transparency">
          <Toggle
            checked={settings.glassmorphism}
            onChange={(v) => onUpdate({ glassmorphism: v })}
          />
        </SettingRow>
        {settings.glassmorphism && (
          <SettingRow label="Blur Strength" desc="Intensity of blur effect">
            <Slider
              value={settings.blurStrength}
              min={0}
              max={60}
              onChange={(v) => onUpdate({ blurStrength: v })}
              suffix="px"
            />
          </SettingRow>
        )}
        <SettingRow label="Shadows" desc="Enable shadow effects">
          <Toggle
            checked={settings.shadows}
            onChange={(v) => onUpdate({ shadows: v })}
          />
        </SettingRow>
        <SettingRow label="Animations" desc="Enable UI animations">
          <Toggle
            checked={settings.animations}
            onChange={(v) => onUpdate({ animations: v })}
          />
        </SettingRow>
        {settings.animations && (
          <SettingRow label="Animation Speed" desc="Speed multiplier">
            <Slider
              value={settings.animationSpeed}
              min={0.5}
              max={2}
              step={0.1}
              onChange={(v) => onUpdate({ animationSpeed: v })}
              suffix="x"
            />
          </SettingRow>
        )}
        <SettingRow label="Particles" desc="Background particle effects">
          <Toggle
            checked={settings.particles}
            onChange={(v) => onUpdate({ particles: v })}
          />
        </SettingRow>
        {settings.particles && (
          <SettingRow label="Particle Type">
            <Select
              value={settings.particleType}
              options={[
                { value: "snow", label: "Snow" },
                { value: "stars", label: "Stars" },
                { value: "circles", label: "Circles" },
                { value: "notes", label: "Music Notes" },
              ]}
              onChange={(v) => onUpdate({ particleType: v })}
            />
          </SettingRow>
        )}
        <SettingRow label="Ambient Lighting" desc="Glow from album artwork">
          <Toggle
            checked={settings.ambientLighting}
            onChange={(v) => onUpdate({ ambientLighting: v })}
          />
        </SettingRow>
      </SettingsSection>

      <SettingsSection title="Typography" desc="Font settings">
        <SettingRow label="Font Family">
          <Select
            value={settings.fontFamily}
            options={[
              { value: "Inter", label: "Inter" },
              { value: "Roboto", label: "Roboto" },
              { value: "Open Sans", label: "Open Sans" },
              { value: "Poppins", label: "Poppins" },
            ]}
            onChange={(v) => onUpdate({ fontFamily: v })}
          />
        </SettingRow>
        <SettingRow label="Font Size" desc="Base font size">
          <Slider
            value={settings.fontSize}
            min={80}
            max={120}
            onChange={(v) => onUpdate({ fontSize: v })}
            suffix="%"
          />
        </SettingRow>
      </SettingsSection>

      <SettingsSection title="Layout" desc="UI element styling">
        <SettingRow label="Border Radius" desc="Roundness of elements">
          <Slider
            value={settings.borderRadius}
            min={0}
            max={32}
            onChange={(v) => onUpdate({ borderRadius: v })}
            suffix="px"
          />
        </SettingRow>
      </SettingsSection>
    </>
  );
}

// Player Settings
function PlayerSettings({
  settings,
  onUpdate,
}: {
  settings: any;
  onUpdate: (s: any) => void;
}) {
  const styles = [
    { id: "mini", name: "Mini", desc: "Compact controls" },
    { id: "standard", name: "Standard", desc: "Default layout" },
    { id: "large", name: "Large", desc: "Expanded view" },
    { id: "vinyl", name: "Vinyl", desc: "Retro style" },
    { id: "compact", name: "Compact", desc: "Minimal" },
  ];

  return (
    <>
      <SettingsSection
        title="Player Style"
        desc="Choose your preferred player layout"
      >
        <div className="grid grid-cols-5 gap-3">
          {styles.map((style) => (
            <button
              key={style.id}
              onClick={() => onUpdate({ style: style.id })}
              className={clsx(
                "glass-card p-4 rounded-xl transition-all card-hover text-center",
                settings.style === style.id && "ring-2 ring-[#8B5CF6]"
              )}
            >
              <div className="w-full h-16 rounded-lg bg-white/5 mb-3 flex items-center justify-center">
                <Play size={24} className="text-gray-500" />
              </div>
              <p className="text-sm font-medium">{style.name}</p>
              <p className="text-xs text-gray-500">{style.desc}</p>
            </button>
          ))}
        </div>
      </SettingsSection>

      <SettingsSection title="Position" desc="Where to show the player">
        <SettingRow label="Position">
          <Select
            value={settings.position}
            options={[
              { value: "bottom", label: "Bottom" },
              { value: "top", label: "Top" },
              { value: "side", label: "Side" },
              { value: "floating", label: "Floating" },
            ]}
            onChange={(v) => onUpdate({ position: v })}
          />
        </SettingRow>
        <SettingRow label="Width">
          <Select
            value={settings.width}
            options={[
              { value: "narrow", label: "Narrow" },
              { value: "medium", label: "Medium" },
              { value: "wide", label: "Wide" },
            ]}
            onChange={(v) => onUpdate({ width: v })}
          />
        </SettingRow>
      </SettingsSection>

      <SettingsSection title="Elements" desc="Show or hide player elements">
        <SettingRow label="Album Artwork">
          <Toggle
            checked={settings.showArtwork}
            onChange={(v) => onUpdate({ showArtwork: v })}
          />
        </SettingRow>
        <SettingRow label="Track Title">
          <Toggle
            checked={settings.showTitle}
            onChange={(v) => onUpdate({ showTitle: v })}
          />
        </SettingRow>
        <SettingRow label="Progress Bar">
          <Toggle
            checked={settings.showProgress}
            onChange={(v) => onUpdate({ showProgress: v })}
          />
        </SettingRow>
        {settings.showProgress && (
          <SettingRow label="Progress Style">
            <Select
              value={settings.progressStyle}
              options={[
                { value: "line", label: "Line" },
                { value: "waveform", label: "Waveform" },
                { value: "wave", label: "Wave" },
              ]}
              onChange={(v) => onUpdate({ progressStyle: v })}
            />
          </SettingRow>
        )}
        <SettingRow label="Playback Controls">
          <Toggle
            checked={settings.showControls}
            onChange={(v) => onUpdate({ showControls: v })}
          />
        </SettingRow>
        <SettingRow label="Like Button">
          <Toggle
            checked={settings.showLike}
            onChange={(v) => onUpdate({ showLike: v })}
          />
        </SettingRow>
        <SettingRow label="Queue Button">
          <Toggle
            checked={settings.showQueue}
            onChange={(v) => onUpdate({ showQueue: v })}
          />
        </SettingRow>
        <SettingRow label="Volume Slider">
          <Toggle
            checked={settings.showVolume}
            onChange={(v) => onUpdate({ showVolume: v })}
          />
        </SettingRow>
        <SettingRow label="Time Display">
          <Toggle
            checked={settings.showTime}
            onChange={(v) => onUpdate({ showTime: v })}
          />
        </SettingRow>
      </SettingsSection>

      <SettingsSection title="Visualizer" desc="Audio visualization settings">
        <SettingRow label="Visualizer Type">
          <Select
            value={settings.visualizer}
            options={[
              { value: "none", label: "None" },
              { value: "bars", label: "Bars" },
              { value: "waveform", label: "Waveform" },
              { value: "circular", label: "Circular" },
              { value: "particles", label: "Particles" },
            ]}
            onChange={(v) => onUpdate({ visualizer: v })}
          />
        </SettingRow>
        {settings.visualizer !== "none" && (
          <SettingRow label="Visualizer Color">
            <Select
              value={settings.visualizerColor}
              options={[
                { value: "artwork", label: "From Artwork" },
                { value: "accent", label: "Accent Color" },
                { value: "custom", label: "Custom" },
              ]}
              onChange={(v) => onUpdate({ visualizerColor: v })}
            />
          </SettingRow>
        )}
      </SettingsSection>

      <SettingsSection title="Artwork" desc="Album art display settings">
        <SettingRow label="Artwork Size">
          <Select
            value={settings.artworkSize}
            options={[
              { value: "small", label: "Small" },
              { value: "medium", label: "Medium" },
              { value: "large", label: "Large" },
            ]}
            onChange={(v) => onUpdate({ artworkSize: v })}
          />
        </SettingRow>
        <SettingRow label="Artwork Effect">
          <Select
            value={settings.artworkEffect}
            options={[
              { value: "none", label: "None" },
              { value: "rotate", label: "Rotate" },
              { value: "pulse", label: "Pulse" },
              { value: "glow", label: "Glow" },
            ]}
            onChange={(v) => onUpdate({ artworkEffect: v })}
          />
        </SettingRow>
        <SettingRow label="Artwork Radius">
          <Slider
            value={settings.artworkRadius}
            min={0}
            max={50}
            onChange={(v) => onUpdate({ artworkRadius: v })}
            suffix="%"
          />
        </SettingRow>
        <SettingRow
          label="Ambient Background"
          desc="Blur artwork as background"
        >
          <Toggle
            checked={settings.ambientBackground}
            onChange={(v) => onUpdate({ ambientBackground: v })}
          />
        </SettingRow>
      </SettingsSection>
    </>
  );
}

// Library Settings
function LibrarySettings({
  settings,
  onUpdate,
}: {
  settings: any;
  onUpdate: (s: any) => void;
}) {
  return (
    <>
      <SettingsSection title="Display" desc="How to show your library">
        <div className="flex gap-4 mb-4">
          {[
            { id: "grid", icon: LayoutGrid, label: "Grid" },
            { id: "list", icon: List, label: "List" },
            { id: "compact", icon: Square, label: "Compact" },
          ].map((view) => (
            <button
              key={view.id}
              onClick={() => onUpdate({ view: view.id })}
              className={clsx(
                "flex-1 glass-card p-4 rounded-xl flex flex-col items-center gap-2 transition-all",
                settings.view === view.id && "ring-2 ring-[#8B5CF6]"
              )}
            >
              <view.icon
                size={24}
                className={
                  settings.view === view.id ? "text-[#8B5CF6]" : "text-gray-400"
                }
              />
              <span className="text-sm font-medium">{view.label}</span>
            </button>
          ))}
        </div>
        {settings.view === "grid" && (
          <SettingRow label="Grid Columns">
            <Slider
              value={settings.gridColumns}
              min={2}
              max={6}
              onChange={(v) => onUpdate({ gridColumns: v })}
            />
          </SettingRow>
        )}
        <SettingRow label="Preview Size">
          <Select
            value={settings.previewSize}
            options={[
              { value: "small", label: "Small" },
              { value: "medium", label: "Medium" },
              { value: "large", label: "Large" },
            ]}
            onChange={(v) => onUpdate({ previewSize: v })}
          />
        </SettingRow>
      </SettingsSection>

      <SettingsSection title="Show Elements">
        <SettingRow label="Artwork">
          <Toggle
            checked={settings.showArtwork}
            onChange={(v) => onUpdate({ showArtwork: v })}
          />
        </SettingRow>
        <SettingRow label="Title">
          <Toggle
            checked={settings.showTitle}
            onChange={(v) => onUpdate({ showTitle: v })}
          />
        </SettingRow>
        <SettingRow label="Artist">
          <Toggle
            checked={settings.showArtist}
            onChange={(v) => onUpdate({ showArtist: v })}
          />
        </SettingRow>
        <SettingRow label="Track Count">
          <Toggle
            checked={settings.showTrackCount}
            onChange={(v) => onUpdate({ showTrackCount: v })}
          />
        </SettingRow>
        <SettingRow label="Date Added">
          <Toggle
            checked={settings.showDate}
            onChange={(v) => onUpdate({ showDate: v })}
          />
        </SettingRow>
      </SettingsSection>

      <SettingsSection title="Sorting">
        <SettingRow label="Default Sort">
          <Select
            value={settings.defaultSort}
            options={[
              { value: "date", label: "Date Added" },
              { value: "name", label: "Name" },
              { value: "artist", label: "Artist" },
              { value: "tracks", label: "Track Count" },
            ]}
            onChange={(v) => onUpdate({ defaultSort: v })}
          />
        </SettingRow>
        <SettingRow label="Sort Order">
          <Select
            value={settings.sortOrder}
            options={[
              { value: "asc", label: "Ascending" },
              { value: "desc", label: "Descending" },
            ]}
            onChange={(v) => onUpdate({ sortOrder: v })}
          />
        </SettingRow>
        <SettingRow label="Group By">
          <Select
            value={settings.groupBy}
            options={[
              { value: "none", label: "None" },
              { value: "platform", label: "Platform" },
              { value: "date", label: "Date" },
            ]}
            onChange={(v) => onUpdate({ groupBy: v })}
          />
        </SettingRow>
      </SettingsSection>
    </>
  );
}

// Search Settings
function SearchSettings({
  settings,
  onUpdate,
}: {
  settings: any;
  onUpdate: (s: any) => void;
}) {
  return (
    <>
      <SettingsSection title="Behavior" desc="How search works">
        <SettingRow label="Search on Type" desc="Search as you type">
          <Toggle
            checked={settings.searchOnType}
            onChange={(v) => onUpdate({ searchOnType: v })}
          />
        </SettingRow>
        {settings.searchOnType && (
          <SettingRow label="Debounce Delay" desc="Wait before searching">
            <Slider
              value={settings.debounceMs}
              min={300}
              max={1000}
              step={100}
              onChange={(v) => onUpdate({ debounceMs: v })}
              suffix="ms"
            />
          </SettingRow>
        )}
        <SettingRow label="Show History" desc="Remember recent searches">
          <Toggle
            checked={settings.showHistory}
            onChange={(v) => onUpdate({ showHistory: v })}
          />
        </SettingRow>
      </SettingsSection>

      <SettingsSection title="Results" desc="Search result settings">
        <SettingRow label="Results Count">
          <Select
            value={String(settings.resultsCount)}
            options={[
              { value: "10", label: "10" },
              { value: "20", label: "20" },
              { value: "50", label: "50" },
              { value: "100", label: "100" },
            ]}
            onChange={(v) => onUpdate({ resultsCount: Number(v) })}
          />
        </SettingRow>
        <SettingRow label="Default Filter">
          <Select
            value={settings.defaultFilter}
            options={[
              { value: "all", label: "All" },
              { value: "tracks", label: "Tracks" },
              { value: "artists", label: "Artists" },
              { value: "playlists", label: "Playlists" },
            ]}
            onChange={(v) => onUpdate({ defaultFilter: v })}
          />
        </SettingRow>
        <SettingRow label="Default Sort">
          <Select
            value={settings.defaultSort}
            options={[
              { value: "relevance", label: "Relevance" },
              { value: "popularity", label: "Popularity" },
            ]}
            onChange={(v) => onUpdate({ defaultSort: v })}
          />
        </SettingRow>
      </SettingsSection>

      <SettingsSection title="Platforms" desc="Which services to search">
        {Object.entries(settings.enabledPlatforms).map(
          ([platform, enabled]) => (
            <SettingRow
              key={platform}
              label={platform.charAt(0).toUpperCase() + platform.slice(1)}
            >
              <Toggle
                checked={enabled as boolean}
                onChange={(v) =>
                  onUpdate({
                    enabledPlatforms: {
                      ...settings.enabledPlatforms,
                      [platform]: v,
                    },
                  })
                }
              />
            </SettingRow>
          )
        )}
      </SettingsSection>
    </>
  );
}

// Shortcuts Settings
function ShortcutsSettings({
  settings,
}: {
  settings: any;
  onUpdate: (s: any) => void;
}) {
  const shortcuts = [
    { key: "playPause", label: "Play / Pause" },
    { key: "nextTrack", label: "Next Track" },
    { key: "prevTrack", label: "Previous Track" },
    { key: "volumeUp", label: "Volume Up" },
    { key: "volumeDown", label: "Volume Down" },
    { key: "mute", label: "Mute" },
    { key: "like", label: "Like Track" },
    { key: "addToPlaylist", label: "Add to Playlist" },
    { key: "openSearch", label: "Open Search" },
    { key: "openSettings", label: "Open Settings" },
    { key: "shuffle", label: "Toggle Shuffle" },
    { key: "repeat", label: "Toggle Repeat" },
  ];

  return (
    <SettingsSection
      title="Keyboard Shortcuts"
      desc="Customize your keyboard bindings"
    >
      {shortcuts.map((shortcut) => (
        <SettingRow key={shortcut.key} label={shortcut.label}>
          <div className="input-glass py-2 px-4 w-48 text-center font-mono text-sm">
            {settings[shortcut.key]}
          </div>
        </SettingRow>
      ))}
      <button className="btn-glass w-full mt-4">Reset to Defaults</button>
    </SettingsSection>
  );
}

// Audio Settings
function AudioSettings({
  settings,
  onUpdate,
}: {
  settings: any;
  onUpdate: (s: any) => void;
}) {
  return (
    <>
      <SettingsSection title="Quality" desc="Audio quality settings">
        <SettingRow label="Streaming Quality">
          <Select
            value={settings.quality}
            options={[
              { value: "auto", label: "Auto" },
              { value: "128", label: "128 kbps" },
              { value: "256", label: "256 kbps" },
              { value: "320", label: "320 kbps" },
              { value: "flac", label: "FLAC (if available)" },
            ]}
            onChange={(v) => onUpdate({ quality: v })}
          />
        </SettingRow>
        <SettingRow label="Cache Tracks" desc="Store tracks locally">
          <Toggle
            checked={settings.cacheEnabled}
            onChange={(v) => onUpdate({ cacheEnabled: v })}
          />
        </SettingRow>
        {settings.cacheEnabled && (
          <SettingRow label="Cache Limit" desc="Maximum cached tracks">
            <Slider
              value={settings.cacheLimit}
              min={100}
              max={10000}
              step={100}
              onChange={(v) => onUpdate({ cacheLimit: v })}
            />
          </SettingRow>
        )}
      </SettingsSection>

      <SettingsSection title="Equalizer" desc="Audio equalization">
        <SettingRow label="Enable Equalizer">
          <Toggle
            checked={settings.equalizerEnabled}
            onChange={(v) => onUpdate({ equalizerEnabled: v })}
          />
        </SettingRow>
        {settings.equalizerEnabled && (
          <SettingRow label="Preset">
            <Select
              value={settings.equalizerPreset}
              options={[
                { value: "flat", label: "Flat" },
                { value: "rock", label: "Rock" },
                { value: "pop", label: "Pop" },
                { value: "jazz", label: "Jazz" },
                { value: "classical", label: "Classical" },
                { value: "bass", label: "Bass Boost" },
                { value: "custom", label: "Custom" },
              ]}
              onChange={(v) => onUpdate({ equalizerPreset: v })}
            />
          </SettingRow>
        )}
      </SettingsSection>

      <SettingsSection title="Effects" desc="Audio effects">
        <SettingRow label="Crossfade" desc="Smooth transitions between tracks">
          <Toggle
            checked={settings.crossfade}
            onChange={(v) => onUpdate({ crossfade: v })}
          />
        </SettingRow>
        {settings.crossfade && (
          <SettingRow label="Crossfade Duration">
            <Slider
              value={settings.crossfadeDuration}
              min={0}
              max={10}
              onChange={(v) => onUpdate({ crossfadeDuration: v })}
              suffix="s"
            />
          </SettingRow>
        )}
        <SettingRow label="Normalize Volume" desc="Keep volume consistent">
          <Toggle
            checked={settings.normalizeVolume}
            onChange={(v) => onUpdate({ normalizeVolume: v })}
          />
        </SettingRow>
        <SettingRow label="Default Speed">
          <Slider
            value={settings.defaultSpeed}
            min={0.25}
            max={2}
            step={0.25}
            onChange={(v) => onUpdate({ defaultSpeed: v })}
            suffix="x"
          />
        </SettingRow>
      </SettingsSection>
    </>
  );
}

// Services Settings
function ServicesSettings({
  settings,
  onUpdate,
}: {
  settings: any;
  onUpdate: (s: any) => void;
}) {
  const [tokenStatus, setTokenStatus] = useState<
    "idle" | "checking" | "valid" | "invalid"
  >("idle");

  const checkToken = async () => {
    setTokenStatus("checking");
    await new Promise((r) => setTimeout(r, 1000));
    setTokenStatus("valid");
  };

  return (
    <>
      <SettingsSection title="SoundCloud" desc="SoundCloud API configuration">
        <div className="glass-card p-5 rounded-2xl space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">API Token</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={
                  settings.soundcloud.tokens[settings.soundcloud.activeToken]
                }
                onChange={(e) => {
                  const tokens = [...settings.soundcloud.tokens];
                  tokens[settings.soundcloud.activeToken] = e.target.value;
                  onUpdate({ soundcloud: { ...settings.soundcloud, tokens } });
                }}
                className="input-glass flex-1"
              />
              <button onClick={checkToken} className="btn-glass px-4">
                {tokenStatus === "checking" ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  "Check"
                )}
              </button>
            </div>
            {tokenStatus === "valid" && (
              <p className="text-sm text-green-500 mt-2 flex items-center gap-1">
                <Check size={14} /> Token is valid
              </p>
            )}
            {tokenStatus === "invalid" && (
              <p className="text-sm text-red-500 mt-2">Token is invalid</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Active Token
            </label>
            <Select
              value={String(settings.soundcloud.activeToken)}
              options={settings.soundcloud.tokens.map(
                (_: string, i: number) => ({
                  value: String(i),
                  label: `Token ${i + 1}`,
                })
              )}
              onChange={(v) =>
                onUpdate({
                  soundcloud: {
                    ...settings.soundcloud,
                    activeToken: Number(v),
                  },
                })
              }
            />
          </div>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Other Services"
        desc="Connect additional platforms"
      >
        {["spotify", "youtube", "vk", "yandex"].map((service) => (
          <div key={service} className="space-y-3">
            <SettingRow
              label={service.charAt(0).toUpperCase() + service.slice(1)}
              desc={settings[service]?.connected ? "Connected" : "Not connected"}
            >
              <button
                className={
                  settings[service]?.connected ? "btn-glass" : "btn-primary"
                }
              >
                <span>
                  {settings[service]?.connected ? "Disconnect" : "Connect"}
                </span>
              </button>
            </SettingRow>
          </div>
        ))}
      </SettingsSection>

      <SettingsSection title="Proxy" desc="Network proxy settings">
        <ProxyPage />
      </SettingsSection>
    </>
  );
}

// Social Settings
function SocialSettings({
  settings,
  onUpdate,
}: {
  settings: any;
  onUpdate: (s: any) => void;
}) {
  return (
    <>
      <SettingsSection title="Status" desc="Your online presence">
        <SettingRow label="Status">
          <Select
            value={settings.status}
            options={[
              { value: "online", label: "🟢 Online" },
              { value: "dnd", label: "🔴 Do Not Disturb" },
              { value: "offline", label: "⚫ Offline" },
            ]}
            onChange={(v) => onUpdate({ status: v })}
          />
        </SettingRow>
        <SettingRow
          label="Show What I'm Listening"
          desc="Let friends see your activity"
        >
          <Toggle
            checked={settings.showListening}
            onChange={(v) => onUpdate({ showListening: v })}
          />
        </SettingRow>
        <SettingRow
          label="Friend Notifications"
          desc="Get notified about friend activity"
        >
          <Toggle
            checked={settings.friendNotifications}
            onChange={(v) => onUpdate({ friendNotifications: v })}
          />
        </SettingRow>
      </SettingsSection>

      <SettingsSection title="Discord" desc="Discord Rich Presence integration">
        <SettingRow label="Rich Presence" desc="Show Harmonix in Discord">
          <Toggle
            checked={settings.discord.richPresence}
            onChange={(v) =>
              onUpdate({ discord: { ...settings.discord, richPresence: v } })
            }
          />
        </SettingRow>
        {settings.discord.richPresence && (
          <>
            <SettingRow label="Show Track Name">
              <Toggle
                checked={settings.discord.showTrack}
                onChange={(v) =>
                  onUpdate({ discord: { ...settings.discord, showTrack: v } })
                }
              />
            </SettingRow>
            <SettingRow label="Show Artist">
              <Toggle
                checked={settings.discord.showArtist}
                onChange={(v) =>
                  onUpdate({ discord: { ...settings.discord, showArtist: v } })
                }
              />
            </SettingRow>
            <SettingRow label="Show Artwork">
              <Toggle
                checked={settings.discord.showArtwork}
                onChange={(v) =>
                  onUpdate({ discord: { ...settings.discord, showArtwork: v } })
                }
              />
            </SettingRow>
            <SettingRow label="Show Time">
              <Toggle
                checked={settings.discord.showTime}
                onChange={(v) =>
                  onUpdate({ discord: { ...settings.discord, showTime: v } })
                }
              />
            </SettingRow>
            <SettingRow label="Listen Together Button">
              <Toggle
                checked={settings.discord.listenTogether}
                onChange={(v) =>
                  onUpdate({
                    discord: { ...settings.discord, listenTogether: v },
                  })
                }
              />
            </SettingRow>
          </>
        )}
      </SettingsSection>

      <SettingsSection title="Last.fm" desc="Scrobbling integration">
        <SettingRow label="Scrobbling" desc="Track your listening history">
          <Toggle
            checked={settings.lastfm.scrobbling}
            onChange={(v) =>
              onUpdate({ lastfm: { ...settings.lastfm, scrobbling: v } })
            }
          />
        </SettingRow>
        {settings.lastfm.scrobbling && !settings.lastfm.connected && (
          <div className="glass-card p-5 rounded-2xl space-y-3">
            <input
              type="text"
              placeholder="API Key"
              value={settings.lastfm.apiKey}
              onChange={(e) =>
                onUpdate({
                  lastfm: { ...settings.lastfm, apiKey: e.target.value },
                })
              }
              className="input-glass w-full"
            />
            <input
              type="password"
              placeholder="API Secret"
              value={settings.lastfm.apiSecret}
              onChange={(e) =>
                onUpdate({
                  lastfm: { ...settings.lastfm, apiSecret: e.target.value },
                })
              }
              className="input-glass w-full"
            />
            <button className="btn-primary w-full">
              <span>Connect Account</span>
            </button>
          </div>
        )}
      </SettingsSection>
    </>
  );
}

// Storage Settings
function StorageSettings({
  settings,
  onUpdate,
}: {
  settings: any;
  onUpdate: (s: any) => void;
}) {
  const cacheData = { tracks: 234, artworks: 89, lyrics: 12, total: 1.2 };

  return (
    <>
      <SettingsSection title="Cache" desc="Manage cached data">
        <div className="glass-card p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-400">Total Cache Size</span>
            <span className="text-xl font-bold">{cacheData.total} GB</span>
          </div>
          <div className="space-y-3">
            {[
              { label: "Tracks", value: cacheData.tracks, max: 500 },
              { label: "Artworks", value: cacheData.artworks, max: 200 },
              { label: "Lyrics", value: cacheData.lyrics, max: 50 },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">{item.label}</span>
                  <span>
                    {item.value} / {item.max}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full gradient-primary rounded-full"
                    style={{ width: `${(item.value / item.max) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            <button className="btn-glass text-sm">Clear Tracks</button>
            <button className="btn-glass text-sm">Clear Artworks</button>
            <button className="btn-glass text-sm">Clear Lyrics</button>
            <button className="btn-glass text-sm text-red-400">
              Clear All
            </button>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection title="Offline" desc="Offline playback settings">
        <SettingRow label="Download Folder">
          <div className="flex gap-2">
            <input
              type="text"
              value={settings.offlineFolder || "Not set"}
              readOnly
              className="input-glass flex-1"
            />
            <button className="btn-glass px-4">Browse</button>
          </div>
        </SettingRow>
        <SettingRow label="Format">
          <Select
            value={settings.offlineFormat}
            options={[
              { value: "mp3", label: "MP3" },
              { value: "flac", label: "FLAC" },
              { value: "ogg", label: "OGG" },
            ]}
            onChange={(v) => onUpdate({ offlineFormat: v })}
          />
        </SettingRow>
        <SettingRow label="Quality">
          <Select
            value={settings.offlineQuality}
            options={[
              { value: "128", label: "128 kbps" },
              { value: "256", label: "256 kbps" },
              { value: "320", label: "320 kbps" },
            ]}
            onChange={(v) => onUpdate({ offlineQuality: v })}
          />
        </SettingRow>
        <SettingRow label="Save Metadata" desc="Include track info in files">
          <Toggle
            checked={settings.saveMetadata}
            onChange={(v) => onUpdate({ saveMetadata: v })}
          />
        </SettingRow>
      </SettingsSection>

      <SettingsSection title="Cloud Sync" desc="Автоматическая синхронизация">
        <div className="glass-card p-4 rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-green-500/20">
              <Check size={20} className="text-green-400" />
            </div>
            <div>
              <p className="font-medium">Облачная синхронизация</p>
              <p className="text-xs text-gray-400">
                Данные автоматически синхронизируются
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-400">
            Все пользователи сохраняются в облаке. Вы можете войти в свой
            аккаунт с любого устройства.
          </p>
        </div>
      </SettingsSection>
    </>
  );
}

// Advanced Settings
function AdvancedSettings({
  settings,
  onUpdate,
}: {
  settings: any;
  onUpdate: (s: any) => void;
}) {
  return (
    <>
      <SettingsSection title="Performance" desc="Optimize app performance">
        <SettingRow
          label="Performance Mode"
          desc="Reduce animations and effects"
        >
          <Toggle
            checked={settings.performanceMode}
            onChange={(v) => onUpdate({ performanceMode: v })}
          />
        </SettingRow>
        <SettingRow label="FPS Limit">
          <Select
            value={String(settings.fpsLimit)}
            options={[
              { value: "30", label: "30 FPS" },
              { value: "60", label: "60 FPS" },
              { value: "120", label: "120 FPS" },
              { value: "0", label: "Unlimited" },
            ]}
            onChange={(v) => onUpdate({ fpsLimit: Number(v) })}
          />
        </SettingRow>
        <SettingRow label="Lazy Loading" desc="Load content as needed">
          <Toggle
            checked={settings.lazyLoading}
            onChange={(v) => onUpdate({ lazyLoading: v })}
          />
        </SettingRow>
        <SettingRow label="Preload Tracks" desc="Buffer upcoming tracks">
          <Slider
            value={settings.preloadTracks}
            min={0}
            max={5}
            onChange={(v) => onUpdate({ preloadTracks: v })}
          />
        </SettingRow>
      </SettingsSection>

      <SettingsSection title="Notifications" desc="App notifications">
        <SettingRow label="Show Notifications">
          <Toggle
            checked={settings.notifications}
            onChange={(v) => onUpdate({ notifications: v })}
          />
        </SettingRow>
        {settings.notifications && (
          <>
            <SettingRow label="Position">
              <Select
                value={settings.notificationPosition}
                options={[
                  { value: "top-left", label: "Top Left" },
                  { value: "top-right", label: "Top Right" },
                  { value: "bottom-left", label: "Bottom Left" },
                  { value: "bottom-right", label: "Bottom Right" },
                ]}
                onChange={(v) => onUpdate({ notificationPosition: v })}
              />
            </SettingRow>
            <SettingRow label="Duration">
              <Slider
                value={settings.notificationDuration}
                min={3}
                max={10}
                onChange={(v) => onUpdate({ notificationDuration: v })}
                suffix="s"
              />
            </SettingRow>
            <SettingRow label="Sound">
              <Toggle
                checked={settings.notificationSound}
                onChange={(v) => onUpdate({ notificationSound: v })}
              />
            </SettingRow>
          </>
        )}
      </SettingsSection>

      <SettingsSection title="Language & Region" desc="Localization settings">
        <SettingRow label="Language">
          <Select
            value={settings.language}
            options={[
              { value: "ru", label: "Русский" },
              { value: "en", label: "English" },
              { value: "uk", label: "Українська" },
            ]}
            onChange={(v) => onUpdate({ language: v })}
          />
        </SettingRow>
        <SettingRow label="Date Format">
          <Select
            value={settings.dateFormat}
            options={[
              { value: "DD.MM.YYYY", label: "DD.MM.YYYY" },
              { value: "MM.DD.YYYY", label: "MM.DD.YYYY" },
              { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
            ]}
            onChange={(v) => onUpdate({ dateFormat: v })}
          />
        </SettingRow>
        <SettingRow label="Time Format">
          <Select
            value={settings.timeFormat}
            options={[
              { value: "24h", label: "24 Hour" },
              { value: "12h", label: "12 Hour" },
            ]}
            onChange={(v) => onUpdate({ timeFormat: v })}
          />
        </SettingRow>
      </SettingsSection>

      <SettingsSection title="Updates" desc="App updates">
        <SettingRow label="Check for Updates">
          <Toggle
            checked={settings.autoUpdate}
            onChange={(v) => onUpdate({ autoUpdate: v })}
          />
        </SettingRow>
        {settings.autoUpdate && (
          <SettingRow label="Auto Install">
            <Toggle
              checked={settings.autoInstall}
              onChange={(v) => onUpdate({ autoInstall: v })}
            />
          </SettingRow>
        )}
        <SettingRow label="Update Channel">
          <Select
            value={settings.updateChannel}
            options={[
              { value: "stable", label: "Stable" },
              { value: "beta", label: "Beta" },
            ]}
            onChange={(v) => onUpdate({ updateChannel: v })}
          />
        </SettingRow>
        <SettingRow label="Current Version" desc="v2.1.7">
          <button className="btn-glass flex items-center gap-2">
            <RefreshCw size={16} /> Check Now
          </button>
        </SettingRow>
      </SettingsSection>

      <SettingsSection title="Data" desc="Import and export">
        <div className="flex gap-3">
          <button className="btn-glass flex-1 flex items-center justify-center gap-2">
            <Upload size={18} /> Export Settings
          </button>
          <button className="btn-glass flex-1 flex items-center justify-center gap-2">
            <Download size={18} /> Import Settings
          </button>
        </div>
        <button className="btn-glass w-full text-red-400 hover:bg-red-500/20 flex items-center justify-center gap-2 mt-2">
          <Trash2 size={18} /> Reset All Settings
        </button>
      </SettingsSection>
    </>
  );
}
