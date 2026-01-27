import { useState } from "react";
import { X, Camera, Upload, Palette, Sparkles } from "lucide-react";
import { useUserStore } from "../../stores/userStore";
import { clsx } from "clsx";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const gradients = [
  "linear-gradient(135deg, #8B5CF6 0%, #EC4899 50%, #F97316 100%)",
  "linear-gradient(135deg, #3B82F6 0%, #06B6D4 50%, #10B981 100%)",
  "linear-gradient(135deg, #EF4444 0%, #F97316 50%, #FBBF24 100%)",
  "linear-gradient(135deg, #EC4899 0%, #8B5CF6 50%, #3B82F6 100%)",
  "linear-gradient(135deg, #10B981 0%, #3B82F6 50%, #8B5CF6 100%)",
  "linear-gradient(135deg, #F97316 0%, #EF4444 50%, #EC4899 100%)",
];

const avatarEmojis = [
  "🎵",
  "🎸",
  "🎹",
  "🎤",
  "🎧",
  "🎷",
  "🎺",
  "🥁",
  "🎻",
  "🪕",
  "🎼",
  "🎶",
  "🌟",
  "⚡",
  "🔥",
  "💜",
  "💙",
  "💚",
  "🖤",
  "🤍",
  "👑",
  "🦋",
  "🌙",
  "☀️",
];

const avatarFrames = [
  { id: "none", name: "None", style: {} },
  {
    id: "gradient-purple",
    name: "Purple",
    style: { background: "linear-gradient(135deg, #8B5CF6, #EC4899)" },
  },
  {
    id: "gradient-blue",
    name: "Blue",
    style: { background: "linear-gradient(135deg, #3B82F6, #06B6D4)" },
  },
  {
    id: "gradient-green",
    name: "Green",
    style: { background: "linear-gradient(135deg, #10B981, #22C55E)" },
  },
  {
    id: "gradient-orange",
    name: "Orange",
    style: { background: "linear-gradient(135deg, #F97316, #FBBF24)" },
  },
  {
    id: "gradient-rainbow",
    name: "Rainbow",
    style: {
      background:
        "linear-gradient(135deg, #EF4444, #F97316, #FBBF24, #22C55E, #3B82F6, #8B5CF6)",
    },
  },
];

type Tab = "general" | "avatar" | "banner" | "frame";

export function EditProfileModal({ isOpen, onClose }: EditProfileModalProps) {
  const { user, updateProfile, updateAvatar, updateBanner } = useUserStore();
  const [activeTab, setActiveTab] = useState<Tab>("general");
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar || "");
  const [selectedBanner, setSelectedBanner] = useState(user?.banner || "");
  const [selectedFrame, setSelectedFrame] = useState(
    user?.avatarFrame || "gradient-purple"
  );

  if (!isOpen || !user) return null;

  const handleSave = () => {
    updateProfile({
      displayName,
      avatarFrame: selectedFrame,
    });
    if (selectedAvatar !== user.avatar) {
      updateAvatar(selectedAvatar);
    }
    if (selectedBanner !== user.banner) {
      updateBanner(
        selectedBanner,
        selectedBanner.startsWith("linear") ? "gradient" : "image"
      );
    }
    onClose();
  };

  const tabs: { id: Tab; label: string; icon: typeof Camera }[] = [
    { id: "general", label: "General", icon: Sparkles },
    { id: "avatar", label: "Avatar", icon: Camera },
    { id: "banner", label: "Banner", icon: Palette },
    { id: "frame", label: "Frame", icon: Sparkles },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in"
      style={{ background: "rgba(0, 0, 0, 0.8)", backdropFilter: "blur(20px)" }}
      onClick={onClose}
    >
      <div
        className="glass-card w-[600px] max-w-[90vw] max-h-[80vh] overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <h2 className="text-2xl font-bold font-['Space_Grotesk']">
            Edit Profile
          </h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-4 border-b border-white/5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                "pill flex items-center gap-2 transition-all",
                activeTab === tab.id && "pill-active"
              )}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[400px]">
          {activeTab === "general" && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="input-glass w-full"
                  placeholder="Your display name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Username
                </label>
                <div className="input-glass w-full flex items-center gap-2 opacity-60">
                  <span className="text-gray-400">@</span>
                  <span>{user.username}</span>
                  <span className="text-xs text-gray-500 ml-auto">
                    Can change in 30 days
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="input-glass w-full opacity-60"
                />
              </div>
            </div>
          )}

          {activeTab === "avatar" && (
            <div className="space-y-6 animate-fade-in">
              {/* Current Avatar Preview */}
              <div className="flex justify-center">
                <div
                  className="w-24 h-24 rounded-2xl flex items-center justify-center text-4xl"
                  style={{
                    padding: "4px",
                    background:
                      avatarFrames.find((f) => f.id === selectedFrame)?.style
                        .background || "transparent",
                  }}
                >
                  <div className="w-full h-full rounded-[14px] bg-[#13131A] flex items-center justify-center">
                    {selectedAvatar || "👤"}
                  </div>
                </div>
              </div>

              {/* Emoji Grid */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Choose Avatar
                </label>
                <div className="grid grid-cols-8 gap-2">
                  {avatarEmojis.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => setSelectedAvatar(emoji)}
                      className={clsx(
                        "w-full aspect-square rounded-xl text-2xl flex items-center justify-center transition-all duration-300",
                        selectedAvatar === emoji
                          ? "gradient-primary shadow-lg scale-110"
                          : "bg-white/5 hover:bg-white/10 hover:scale-105"
                      )}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Upload Custom */}
              <button className="btn-glass w-full flex items-center justify-center gap-2">
                <Upload size={18} />
                Upload Custom Avatar
              </button>
            </div>
          )}

          {activeTab === "banner" && (
            <div className="space-y-6 animate-fade-in">
              {/* Preview */}
              <div
                className="h-32 rounded-2xl"
                style={{ background: selectedBanner }}
              />

              {/* Gradient Options */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Gradient Banners
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {gradients.map((gradient, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedBanner(gradient)}
                      className={clsx(
                        "h-20 rounded-xl transition-all duration-300",
                        selectedBanner === gradient &&
                          "ring-2 ring-white scale-105"
                      )}
                      style={{ background: gradient }}
                    />
                  ))}
                </div>
              </div>

              {/* Upload Custom */}
              <button className="btn-glass w-full flex items-center justify-center gap-2">
                <Upload size={18} />
                Upload Custom Banner
              </button>
            </div>
          )}

          {activeTab === "frame" && (
            <div className="space-y-6 animate-fade-in">
              {/* Preview */}
              <div className="flex justify-center">
                <div
                  className="w-24 h-24 rounded-2xl flex items-center justify-center"
                  style={{
                    padding: "4px",
                    background:
                      avatarFrames.find((f) => f.id === selectedFrame)?.style
                        .background || "transparent",
                  }}
                >
                  <div className="w-full h-full rounded-[14px] bg-[#13131A] flex items-center justify-center text-4xl">
                    {selectedAvatar || "👤"}
                  </div>
                </div>
              </div>

              {/* Frame Options */}
              <div className="grid grid-cols-3 gap-3">
                {avatarFrames.map((frame) => (
                  <button
                    key={frame.id}
                    onClick={() => setSelectedFrame(frame.id)}
                    className={clsx(
                      "glass-card p-4 rounded-xl transition-all duration-300 text-center",
                      selectedFrame === frame.id && "ring-2 ring-[#8B5CF6]"
                    )}
                  >
                    <div
                      className="w-12 h-12 rounded-xl mx-auto mb-2"
                      style={{
                        padding: "2px",
                        background:
                          frame.style.background || "rgba(255,255,255,0.1)",
                      }}
                    >
                      <div className="w-full h-full rounded-[10px] bg-[#13131A]" />
                    </div>
                    <span className="text-sm">{frame.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-white/5">
          <button onClick={onClose} className="btn-glass">
            Cancel
          </button>
          <button onClick={handleSave} className="btn-primary">
            <span>Save Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
}
