// Service to extract dominant color from artwork images

class ColorExtractorService {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private cache: Map<string, string> = new Map();

  constructor() {
    if (typeof document !== 'undefined') {
      this.canvas = document.createElement('canvas');
      this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    }
  }

  async extractDominantColor(imageUrl: string): Promise<string | null> {
    if (!imageUrl || !this.canvas || !this.ctx) return null;

    // Check cache
    if (this.cache.has(imageUrl)) {
      return this.cache.get(imageUrl)!;
    }

    try {
      // Проксируем обложку если включено
      const { proxyService } = await import('./ProxyService');
      let finalUrl = imageUrl;
      let blobUrl: string | null = null;
      
      if (proxyService.isServiceProxied('artwork')) {
        try {
          console.log('[ColorExtractor] Proxying artwork:', imageUrl.substring(0, 80));
          const response = await proxyService.proxyFetch('artwork', imageUrl, {
            headers: { 'Accept': 'image/*' }
          });
          if (response.ok) {
            const blob = await response.blob();
            blobUrl = URL.createObjectURL(blob);
            finalUrl = blobUrl;
            console.log('[ColorExtractor] Proxy success, using blob URL');
          } else {
            console.warn('[ColorExtractor] Proxy response not OK:', response.status);
          }
        } catch (e) {
          console.warn('[ColorExtractor] Proxy failed, using direct URL:', e);
        }
      }
      
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      const color = await new Promise<string | null>((resolve) => {
        img.onload = () => {
          try {
            // Resize to small size for faster processing
            const size = 50;
            this.canvas!.width = size;
            this.canvas!.height = size;
            
            this.ctx!.drawImage(img, 0, 0, size, size);
            
            // Cleanup blob URL immediately after drawing
            if (blobUrl) {
              URL.revokeObjectURL(blobUrl);
            }
            
            const imageData = this.ctx!.getImageData(0, 0, size, size);
            const data = imageData.data;
            
            // Color buckets for quantization
            const colorCounts: Map<string, { r: number; g: number; b: number; count: number }> = new Map();
            
            for (let i = 0; i < data.length; i += 4) {
              const r = data[i];
              const g = data[i + 1];
              const b = data[i + 2];
              const a = data[i + 3];
              
              // Skip transparent pixels
              if (a < 128) continue;
              
              // Skip very dark or very light colors
              const brightness = (r + g + b) / 3;
              if (brightness < 30 || brightness > 225) continue;
              
              // Quantize to reduce color space
              const qr = Math.round(r / 32) * 32;
              const qg = Math.round(g / 32) * 32;
              const qb = Math.round(b / 32) * 32;
              
              const key = `${qr},${qg},${qb}`;
              const existing = colorCounts.get(key);
              
              if (existing) {
                existing.r += r;
                existing.g += g;
                existing.b += b;
                existing.count++;
              } else {
                colorCounts.set(key, { r, g, b, count: 1 });
              }
            }
            
            // Find most vibrant color (high saturation)
            let bestColor: { r: number; g: number; b: number } | null = null;
            let bestScore = 0;
            
            colorCounts.forEach((color) => {
              const avgR = color.r / color.count;
              const avgG = color.g / color.count;
              const avgB = color.b / color.count;
              
              // Calculate saturation
              const max = Math.max(avgR, avgG, avgB);
              const min = Math.min(avgR, avgG, avgB);
              const saturation = max === 0 ? 0 : (max - min) / max;
              
              // Score based on saturation and count
              const score = saturation * Math.sqrt(color.count);
              
              if (score > bestScore) {
                bestScore = score;
                bestColor = { r: avgR, g: avgG, b: avgB };
              }
            });
            
            if (bestColor) {
              // Boost saturation for more vibrant result
              const { r, g, b } = bestColor;
              
              // Convert to HSL, boost saturation, convert back
              const hsl = this.rgbToHsl(r, g, b);
              hsl.s = Math.min(1, hsl.s * 1.3); // Boost saturation by 30%
              hsl.l = Math.max(0.35, Math.min(0.65, hsl.l)); // Keep lightness in good range
              
              const rgb = this.hslToRgb(hsl.h, hsl.s, hsl.l);
              const hex = this.rgbToHex(rgb.r, rgb.g, rgb.b);
              
              resolve(hex);
            } else {
              resolve(null);
            }
          } catch (e) {
            console.error('[ColorExtractor] Processing error:', e);
            resolve(null);
          }
        };
        
        img.onerror = () => {
          console.error('[ColorExtractor] Image load failed:', finalUrl.substring(0, 80));
          // Cleanup blob URL if created
          if (blobUrl) {
            URL.revokeObjectURL(blobUrl);
          }
          resolve(null);
        };
        
        img.src = finalUrl;
        
        // Timeout after 5 seconds
        setTimeout(() => {
          if (blobUrl) {
            URL.revokeObjectURL(blobUrl);
          }
          resolve(null);
        }, 5000);
      });
      
      if (color) {
        this.cache.set(imageUrl, color);
        // Limit cache size
        if (this.cache.size > 100) {
          const firstKey = this.cache.keys().next().value;
          if (firstKey) this.cache.delete(firstKey);
        }
      }
      
      return color;
    } catch (e) {
      console.error('[ColorExtractor] Error:', e);
      return null;
    }
  }

  private rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;
    
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    
    return { h, s, l };
  }

  private hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
    let r, g, b;
    
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    
    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255),
    };
  }

  private rgbToHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const colorExtractorService = new ColorExtractorService();
