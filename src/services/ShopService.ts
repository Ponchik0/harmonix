// Shop Service - manages shop items and purchases
import type {
  ShopItem,
  BannerItem,
  FrameItem,
  TitleItem,
  BackgroundItem,
  PackItem,
} from "../types/shop";
import shopData from "../data/shop.json";

// Helper to get correct asset path for both dev and production
function getAssetPath(path: string): string {
  if (
    !path ||
    path.startsWith("http") ||
    path.startsWith("linear-gradient") ||
    path.startsWith("#")
  ) {
    return path;
  }
  // In production Electron, assets are served from the app directory
  // The base URL is handled by Vite, so relative paths should work
  // But we need to ensure the path starts correctly
  if (path.startsWith("/")) {
    // For Electron production, use relative path from index.html
    return `.${path}`;
  }
  return path;
}

// Process items to fix asset paths
function processItems<T extends { preview?: string; image?: string }>(
  items: T[]
): T[] {
  return items.map((item) => ({
    ...item,
    preview: item.preview ? getAssetPath(item.preview) : item.preview,
    image: (item as any).image
      ? getAssetPath((item as any).image)
      : (item as any).image,
  }));
}

// Type assertions for JSON data with path processing
const banners = processItems(shopData.banners as BannerItem[]);
const frames = processItems(shopData.frames as FrameItem[]);
const titles = processItems(shopData.titles as TitleItem[]);
const backgrounds = processItems(shopData.backgrounds as BackgroundItem[]);
const packs = processItems(shopData.packs as PackItem[]);
const usernames = (shopData as any).usernames || [];

class ShopService {
  getAllItems(): ShopItem[] {
    return [...banners, ...frames, ...titles, ...backgrounds, ...packs];
  }

  getBanners(): BannerItem[] {
    return banners;
  }
  getFrames(): FrameItem[] {
    return frames;
  }
  getTitles(): TitleItem[] {
    return titles;
  }
  getBackgrounds(): BackgroundItem[] {
    return backgrounds;
  }
  getPacks(): PackItem[] {
    return packs;
  }

  getItemById(id: string): ShopItem | undefined {
    return this.getAllItems().find((item) => item.id === id);
  }

  getItemsByCategory(category: string): ShopItem[] {
    switch (category) {
      case "banners":
        return banners;
      case "frames":
        return frames;
      case "titles":
        return titles;
      case "backgrounds":
        return backgrounds;
      case "packs":
        return packs;
      case "usernames":
        return usernames;
      default:
        return [];
    }
  }

  getPackItems(packId: string): ShopItem[] {
    const pack = packs.find((p) => p.id === packId);
    if (!pack) return [];
    return pack.items
      .map((id) => this.getItemById(id))
      .filter(Boolean) as ShopItem[];
  }

  getRarityColor(rarity: string): string {
    switch (rarity) {
      case "common":
        return "#6b7280";
      case "rare":
        return "#3b82f6";
      case "epic":
        return "#a855f7";
      case "legendary":
        return "#fbbf24";
      default:
        return "#6b7280";
    }
  }

  getRarityName(rarity: string): string {
    switch (rarity) {
      case "common":
        return "Обычный";
      case "rare":
        return "Редкий";
      case "epic":
        return "Эпический";
      case "legendary":
        return "Легендарный";
      default:
        return "Обычный";
    }
  }

  getRarityGradient(rarity: string): string {
    switch (rarity) {
      case "common":
        return "linear-gradient(135deg, #374151, #1f2937)";
      case "rare":
        return "linear-gradient(135deg, #1e3a5f, #1e40af)";
      case "epic":
        return "linear-gradient(135deg, #4c1d95, #7c3aed)";
      case "legendary":
        return "linear-gradient(135deg, #78350f, #f59e0b)";
      default:
        return "linear-gradient(135deg, #374151, #1f2937)";
    }
  }

  getTitleIconName(titleId: string): string {
    const title = titles.find((t) => t.id === titleId);
    return title?.icon || "HiOutlineMusicalNote";
  }
}

export const shopService = new ShopService();
