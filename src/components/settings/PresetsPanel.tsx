import { useState } from "react";
import {
  X,
  Plus,
  Download,
  Upload,
  Heart,
  Share2,
  Search,
  TrendingUp,
  Clock,
  Star,
} from "lucide-react";
import { clsx } from "clsx";

interface PresetsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = "my" | "workshop";

const myPresets = [
  {
    id: "1",
    name: "Dark Purple",
    description: "My main theme",
    preview: "linear-gradient(135deg, #8B5CF6, #EC4899)",
    createdAt: "2025-01-05",
  },
  {
    id: "2",
    name: "Ocean Vibes",
    description: "Calm blue theme",
    preview: "linear-gradient(135deg, #3B82F6, #06B6D4)",
    createdAt: "2025-01-03",
  },
];

const workshopPresets = [
  {
    id: "w1",
    name: "Neon Dreams",
    author: "synthwave_fan",
    downloads: 12453,
    likes: 892,
    preview: "linear-gradient(135deg, #ff006e, #8338ec, #3a86ff)",
  },
  {
    id: "w2",
    name: "Minimal Dark",
    author: "clean_ui",
    downloads: 8921,
    likes: 654,
    preview: "linear-gradient(135deg, #1a1a1a, #2d2d2d)",
  },
  {
    id: "w3",
    name: "Sunset Glow",
    author: "color_master",
    downloads: 7234,
    likes: 521,
    preview: "linear-gradient(135deg, #f72585, #b5179e, #7209b7)",
  },
  {
    id: "w4",
    name: "Forest Night",
    author: "nature_lover",
    downloads: 5678,
    likes: 423,
    preview: "linear-gradient(135deg, #2d6a4f, #40916c, #52b788)",
  },
  {
    id: "w5",
    name: "Cyberpunk",
    author: "future_ui",
    downloads: 15234,
    likes: 1203,
    preview: "linear-gradient(135deg, #00f5d4, #00bbf9, #9b5de5, #f15bb5)",
  },
  {
    id: "w6",
    name: "Warm Coffee",
    author: "cozy_dev",
    downloads: 4521,
    likes: 312,
    preview: "linear-gradient(135deg, #6f4e37, #a67c52, #c4a77d)",
  },
];

export function PresetsPanel({ isOpen, onClose }: PresetsPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>("my");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"popular" | "new" | "top">("popular");

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in"
      style={{ background: "rgba(0, 0, 0, 0.8)", backdropFilter: "blur(20px)" }}
      onClick={onClose}
    >
      <div
        className="glass-card w-[900px] max-w-[90vw] max-h-[85vh] overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center">
              <Star size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold font-['Space_Grotesk']">
                Theme Presets
              </h2>
              <p className="text-gray-400 text-sm">
                Save and share your themes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
            style={{ background: 'var(--surface-elevated)', color: 'var(--text-secondary)' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("my")}
              className={clsx(
                "pill transition-all",
                activeTab === "my" && "pill-active"
              )}
            >
              My Presets
            </button>
            <button
              onClick={() => setActiveTab("workshop")}
              className={clsx(
                "pill transition-all",
                activeTab === "workshop" && "pill-active"
              )}
            >
              Workshop
            </button>
          </div>

          {activeTab === "my" && (
            <button className="btn-primary flex items-center gap-2">
              <Plus size={18} />
              <span>Create Preset</span>
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[500px]">
          {activeTab === "my" ? (
            <div className="space-y-4">
              {myPresets.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 rounded-2xl glass-subtle mx-auto mb-6 flex items-center justify-center">
                    <Star size={40} className="text-gray-500" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">No presets yet</h3>
                  <p className="text-gray-400 mb-6">
                    Create your first theme preset
                  </p>
                  <button className="btn-primary">
                    <span>Create Preset</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {myPresets.map((preset) => (
                    <div
                      key={preset.id}
                      className="glass-card p-4 rounded-2xl card-hover"
                    >
                      <div
                        className="h-24 rounded-xl mb-4"
                        style={{ background: preset.preview }}
                      />
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold">{preset.name}</h3>
                          <p className="text-sm text-gray-400">
                            {preset.description}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Created {preset.createdAt}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                            style={{ background: 'var(--surface-elevated)', color: 'var(--text-secondary)' }}
                          >
                            <Share2 size={14} />
                          </button>
                          <button 
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-red-400 transition-all"
                            style={{ background: 'var(--surface-elevated)' }}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                      <button className="btn-glass w-full mt-4 text-sm">
                        Apply
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Import/Export */}
              <div className="flex gap-3 pt-4 border-t border-white/5">
                <button className="btn-glass flex-1 flex items-center justify-center gap-2">
                  <Upload size={18} />
                  Import Preset
                </button>
                <button className="btn-glass flex-1 flex items-center justify-center gap-2">
                  <Download size={18} />
                  Export All
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Search & Sort */}
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search presets..."
                    className="input-glass w-full pl-12"
                  />
                </div>
                <div className="flex gap-2">
                  {[
                    { id: "popular", label: "Popular", icon: TrendingUp },
                    { id: "new", label: "New", icon: Clock },
                    { id: "top", label: "Top", icon: Star },
                  ].map((sort) => (
                    <button
                      key={sort.id}
                      onClick={() => setSortBy(sort.id as any)}
                      className={clsx(
                        "pill flex items-center gap-2",
                        sortBy === sort.id && "pill-active"
                      )}
                    >
                      <sort.icon size={14} />
                      {sort.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Workshop Grid */}
              <div className="grid grid-cols-3 gap-4">
                {workshopPresets.map((preset) => (
                  <div
                    key={preset.id}
                    className="glass-card p-4 rounded-2xl card-hover group"
                  >
                    <div
                      className="h-24 rounded-xl mb-4 relative overflow-hidden"
                      style={{ background: preset.preview }}
                    >
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-all">
                        <button 
                          className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
                          style={{ background: 'var(--surface-elevated)', color: 'var(--text-primary)' }}
                        >
                          <Download size={18} />
                        </button>
                        <button 
                          className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
                          style={{ background: 'var(--surface-elevated)', color: 'var(--text-primary)' }}
                        >
                          <Heart size={18} />
                        </button>
                      </div>
                    </div>
                    <h3 className="font-bold truncate">{preset.name}</h3>
                    <p className="text-sm text-gray-400">by {preset.author}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Download size={12} />
                        {preset.downloads.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart size={12} />
                        {preset.likes.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
