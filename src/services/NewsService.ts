// News Service - manages news/mail items
// Updates are loaded from public/updates.json file
import type { NewsItem } from '../types/shop';

const NEWS_VERSION_KEY = 'harmonix-news-version';
const CURRENT_VERSION = 13;

interface UpdateItem {
  id: string;
  title: string;
  date?: string;
  type: 'news' | 'giveaway' | 'update' | 'event' | 'promo' | 'feature' | 'fix' | 'release' | 'roadmap';
  content?: string;
  items?: { text: string; status: 'done' | 'pending' | 'progress' | 'soon' | 'planned' }[];
  changes?: string[];
  reward?: { type: 'coins' | 'item'; amount?: number; itemId?: string };
  participants?: string[];
  winnerId?: string;
  version?: string;
}

class NewsService {
  private news: NewsItem[] = [];
  private _isLoaded: boolean = false;

  constructor() {
    this.checkVersion();
    this.loadUpdatesFromFile();
  }

  get isLoaded(): boolean {
    return this._isLoaded;
  }

  // Check version and reset if needed
  private checkVersion() {
    try {
      const savedVersion = localStorage.getItem(NEWS_VERSION_KEY);
      if (!savedVersion || parseInt(savedVersion) < CURRENT_VERSION) {
        // Reset old data
        localStorage.removeItem('harmonix-news');
        localStorage.removeItem('harmonix-updates-loaded');
        localStorage.setItem(NEWS_VERSION_KEY, CURRENT_VERSION.toString());
        console.log('[NewsService] Version updated, cache cleared');
      }
    } catch {}
  }

  // Load updates from public/updates.json - ALWAYS fresh from file
  private async loadUpdatesFromFile() {
    try {
      const response = await fetch('/updates.json?t=' + Date.now());
      if (!response.ok) {
        console.log('[NewsService] Failed to load updates.json:', response.status);
        this._isLoaded = true; // Mark as loaded even if failed to prevent infinite retries
        return;
      }
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.log('[NewsService] updates.json returned non-JSON content, skipping');
        this._isLoaded = true;
        return;
      }
      
      const updates: UpdateItem[] = await response.json();
      console.log('[NewsService] Loaded updates from file:', updates.length);
      
      // Convert all updates to news items - always fresh from file
      this.news = updates.map(update => ({
        id: update.id,
        title: update.title,
        content: update.content || '',
        items: update.items,
        changes: update.changes, // This is the key field!
        type: update.type as any,
        date: update.date || new Date().toISOString(),
        read: false,
        reward: update.reward,
      }));
      
      console.log('[NewsService] Created news items:', this.news.length);
      if (this.news.length > 0) {
        console.log('[NewsService] First news changes:', this.news[0].changes);
      }
      
      this._isLoaded = true;
    } catch (e) {
      console.log('[NewsService] Error loading updates (file may not exist):', e instanceof Error ? e.message : 'Unknown error');
      this._isLoaded = true; // Mark as loaded to prevent infinite retries
    }
  }

  // Force reload updates
  async reloadUpdates() {
    await this.loadUpdatesFromFile();
    console.log('[NewsService] Reloaded, news count:', this.news.length);
  }

  getAllNews(): NewsItem[] {
    return this.news.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  getUnreadNews(readIds: string[]): NewsItem[] {
    return this.news.filter(n => !readIds.includes(n.id));
  }

  getUnreadCount(readIds: string[]): number {
    return this.news.filter(n => !readIds.includes(n.id)).length;
  }

  getNewsById(id: string): NewsItem | undefined {
    return this.news.find(n => n.id === id);
  }

  // Admin: Add news
  addNews(news: Omit<NewsItem, 'id' | 'date' | 'read'>): NewsItem {
    const newItem: NewsItem = {
      ...news,
      id: 'news_' + Date.now().toString(36),
      date: new Date().toISOString(),
      read: false,
    };
    this.news.unshift(newItem);
    return newItem;
  }

  // Admin: Delete news
  deleteNews(id: string): boolean {
    const index = this.news.findIndex(n => n.id === id);
    if (index === -1) return false;
    this.news.splice(index, 1);
    return true;
  }

  // Giveaway: Add participant
  addParticipant(newsId: string, userId: string): boolean {
    const news = this.news.find(n => n.id === newsId);
    if (!news || news.type !== 'giveaway') return false;
    if (!news.participants) news.participants = [];
    if (news.participants.includes(userId)) return false;
    news.participants.push(userId);
    return true;
  }

  // Giveaway: Get participants
  getParticipants(newsId: string): string[] {
    const news = this.news.find(n => n.id === newsId);
    return news?.participants || [];
  }

  // Giveaway: Set winner
  setWinner(newsId: string, winnerId: string): boolean {
    const news = this.news.find(n => n.id === newsId);
    if (!news || news.type !== 'giveaway') return false;
    if (!news.winnerIds) news.winnerIds = [];
    if (!news.winnerIds.includes(winnerId)) {
      news.winnerIds.push(winnerId);
    }
    return true;
  }

  // Giveaway: End giveaway and pick random winners
  endGiveaway(newsId: string): string[] {
    const news = this.news.find(n => n.id === newsId);
    if (!news || news.type !== 'giveaway' || news.isEnded) return [];
    
    const participants = news.participants || [];
    const winnersCount = Math.min(news.winnersCount || 1, participants.length);
    
    const shuffled = [...participants].sort(() => Math.random() - 0.5);
    const winners = shuffled.slice(0, winnersCount);
    
    news.winnerIds = winners;
    news.isEnded = true;
    
    return winners;
  }

  // Update news item
  updateNews(newsId: string, updates: Partial<NewsItem>): boolean {
    const news = this.news.find(n => n.id === newsId);
    if (!news) return false;
    Object.assign(news, updates);
    return true;
  }
}

export const newsService = new NewsService();
