const STORAGE_KEY = 'harmonix-proxy-settings';

export interface ProxyConfig {
  enabled: boolean;
  url: string;
  type: 'http' | 'https' | 'socks5';
}

export type ProxyServiceName = 'soundcloud' | 'youtube' | 'spotify' | 'yandex' | 'vk' | 'artwork';

export interface ProxySettings {
  serviceProxies: {
    soundcloud: ProxyConfig | null;
    youtube: ProxyConfig | null;
    spotify: ProxyConfig | null;
    yandex: ProxyConfig | null;
    vk: ProxyConfig | null;
    artwork: ProxyConfig | null;
  };
}

const defaultSettings: ProxySettings = {
  serviceProxies: {
    soundcloud: null,
    youtube: null,
    spotify: null,
    yandex: null,
    vk: null,
    artwork: null,
  },
};

class ProxyService {
  private settings: ProxySettings;
  
  // Public CORS proxies
  private corsProxies = [
    'https://corsproxy.io/?',
    'https://api.allorigins.win/raw?url=',
  ];
  private currentProxyIndex = 0;

  constructor() {
    this.settings = this.loadSettings();
  }

  private loadSettings(): ProxySettings {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...defaultSettings, ...parsed };
      }
    } catch (e) {
      console.error('[ProxyService] Error loading settings:', e);
    }
    return { ...defaultSettings };
  }

  private saveSettings(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
    } catch (e) {
      console.error('[ProxyService] Error saving settings:', e);
    }
  }

  getSettings(): ProxySettings {
    return { ...this.settings };
  }

  setServiceProxy(service: ProxyServiceName, proxy: ProxyConfig | null): void {
    this.settings.serviceProxies[service] = proxy;
    this.saveSettings();
  }

  isServiceProxied(service: ProxyServiceName): boolean {
    return this.settings.serviceProxies[service]?.enabled ?? false;
  }

  // Rotate to next CORS proxy on failure
  private rotateProxy(): void {
    this.currentProxyIndex = (this.currentProxyIndex + 1) % this.corsProxies.length;
  }

  // Proxy fetch for a specific service
  async proxyFetch(service: ProxyServiceName, url: string, options?: RequestInit): Promise<Response> {
    const isProxyEnabled = this.isServiceProxied(service);
    
    // Только если прокси включен для этого сервиса
    if (!isProxyEnabled) {
      // Прямое подключение без прокси
      return fetch(url, options);
    }
    
    // Try local server proxy first if available
    try {
      const localServerUrl = `http://localhost:5002/proxy?url=${encodeURIComponent(url)}`;
      const response = await fetch(localServerUrl, {
        ...options,
        headers: {
          ...options?.headers,
          'Accept': 'application/json',
        },
      });
      
      if (response.ok) {
        console.log(`[ProxyService] Local server proxy success for ${service}`);
        return response;
      }
    } catch (error) {
      // Тихо игнорируем ошибку локального сервера
    }
    
    // If proxy is enabled for this service, try CORS proxies
    for (let i = 0; i < this.corsProxies.length; i++) {
      const proxyIndex = (this.currentProxyIndex + i) % this.corsProxies.length;
      const proxy = this.corsProxies[proxyIndex];
      
      try {
        console.log(`[ProxyService] Trying proxy ${proxyIndex + 1} for ${service}: ${proxy}`);
        const proxiedUrl = `${proxy}${encodeURIComponent(url)}`;
        const response = await fetch(proxiedUrl, {
          ...options,
          headers: {
            ...options?.headers,
          },
        });
        
        if (response.ok) {
          console.log(`[ProxyService] Proxy ${proxyIndex + 1} success`);
          this.currentProxyIndex = proxyIndex;
          return response;
        }
        
        console.warn(`[ProxyService] Proxy ${proxyIndex + 1} failed: ${response.status}`);
      } catch (error) {
        console.warn(`[ProxyService] Proxy ${proxyIndex + 1} failed:`, error);
      }
    }
    
    console.log(`[ProxyService] All proxies failed, trying direct fetch`);
    
    // Fallback to direct fetch
    return fetch(url, options);
  }

  // Get current CORS proxy URL
  getCurrentProxyUrl(): string {
    return this.corsProxies[this.currentProxyIndex];
  }

  // Build proxied URL for a service
  buildProxiedUrl(service: ProxyServiceName, url: string): string {
    if (!this.isServiceProxied(service)) {
      return url;
    }
    const proxy = this.corsProxies[this.currentProxyIndex];
    return `${proxy}${encodeURIComponent(url)}`;
  }

  // Reset all settings
  reset(): void {
    this.settings = { ...defaultSettings };
    this.saveSettings();
  }
}

export const proxyService = new ProxyService();
