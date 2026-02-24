// Lyrics Service with Genius + LRCLIB + Musixmatch for synced lyrics

const GENIUS_ACCESS_TOKEN = import.meta.env.VITE_GENIUS_ACCESS_TOKEN || "";
const HAPPI_API_KEY = import.meta.env.VITE_HAPPI_API_KEY || "demo";

export interface SyncedLine {
  time: number; // seconds
  text: string;
}

export interface LyricsResult {
  plain: string | null;
  synced: SyncedLine[] | null;
  source: string;
}

class LyricsServiceClass {
  private cache: Map<string, LyricsResult> = new Map();

  async getLyrics(artist: string, title: string): Promise<LyricsResult> {
    const cacheKey = `${artist}-${title}`.toLowerCase();

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const cleanTitle = this.cleanString(title);
    const cleanArtist = this.cleanString(artist);

    console.log("[Lyrics] Searching for:", cleanArtist, "-", cleanTitle);

    // Try LRCLIB first (has synced lyrics)
    const lrcResult = await this.tryLRCLIB(cleanArtist, cleanTitle);
    if (lrcResult.plain || lrcResult.synced) {
      this.cache.set(cacheKey, lrcResult);
      return lrcResult;
    }

    // Try with original title (sometimes has better results)
    if (cleanTitle !== title) {
      const lrcResult2 = await this.tryLRCLIB(artist, title);
      if (lrcResult2.plain || lrcResult2.synced) {
        this.cache.set(cacheKey, lrcResult2);
        return lrcResult2;
      }
    }

    // Try Genius
    const geniusResult = await this.tryGenius(cleanArtist, cleanTitle);
    if (geniusResult.plain) {
      this.cache.set(cacheKey, geniusResult);
      return geniusResult;
    }

    // Try Musixmatch (good for Russian songs)
    const musixResult = await this.tryMusixmatch(cleanArtist, cleanTitle);
    if (musixResult.plain) {
      this.cache.set(cacheKey, musixResult);
      return musixResult;
    }

    // Fallback APIs
    const fallback = await this.tryFallback(cleanArtist, cleanTitle);
    this.cache.set(cacheKey, fallback);
    return fallback;
  }

  private async tryLRCLIB(
    artist: string,
    title: string
  ): Promise<LyricsResult> {
    try {
      // First try exact match
      const response = await fetch(
        `https://lrclib.net/api/get?artist_name=${encodeURIComponent(
          artist
        )}&track_name=${encodeURIComponent(title)}`,
        { signal: AbortSignal.timeout(5000) }
      );

      if (response.ok) {
        const data = await response.json();

        let synced: SyncedLine[] | null = null;
        if (data.syncedLyrics) {
          synced = this.parseLRC(data.syncedLyrics);
        }

        if (data.plainLyrics || synced) {
          console.log("[LRCLIB] Found lyrics", synced ? "(synced)" : "(plain)");
          return {
            plain:
              data.plainLyrics ||
              (synced ? synced.map((l) => l.text).join("\n") : null),
            synced,
            source: "LRCLIB",
          };
        }
      }

      // Try search endpoint
      const searchResponse = await fetch(
        `https://lrclib.net/api/search?q=${encodeURIComponent(
          `${artist} ${title}`
        )}`,
        { signal: AbortSignal.timeout(5000) }
      );

      if (searchResponse.ok) {
        const results = await searchResponse.json();
        if (results.length > 0) {
          const best = results[0];
          let synced: SyncedLine[] | null = null;
          if (best.syncedLyrics) {
            synced = this.parseLRC(best.syncedLyrics);
          }
          if (best.plainLyrics || synced) {
            console.log("[LRCLIB Search] Found lyrics");
            return {
              plain:
                best.plainLyrics ||
                (synced ? synced.map((l) => l.text).join("\n") : null),
              synced,
              source: "LRCLIB",
            };
          }
        }
      }
    } catch (e) {
      console.log("[LRCLIB] Failed:", e);
    }

    return { plain: null, synced: null, source: "" };
  }

  private parseLRC(lrc: string): SyncedLine[] {
    const lines: SyncedLine[] = [];
    const regex = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/g;
    let match;

    while ((match = regex.exec(lrc)) !== null) {
      const minutes = parseInt(match[1]);
      const seconds = parseInt(match[2]);
      const ms = parseInt(match[3].padEnd(3, "0"));
      const time = minutes * 60 + seconds + ms / 1000;
      const text = match[4].trim();

      if (text) {
        lines.push({ time, text });
      }
    }

    return lines.sort((a, b) => a.time - b.time);
  }

  private async tryMusixmatch(
    artist: string,
    title: string
  ): Promise<LyricsResult> {
    try {
      // Use a proxy/alternative API for Musixmatch
      const query = `${artist} ${title}`;

      // Try happi.dev (free lyrics API)
      const happiRes = await fetch(
        `https://api.happi.dev/v1/music?q=${encodeURIComponent(
          query
        )}&limit=1&type=track`,
        {
          headers: { "x-happi-key": HAPPI_API_KEY },
          signal: AbortSignal.timeout(5000),
        }
      );

      if (happiRes.ok) {
        const data = await happiRes.json();
        if (data.result?.[0]?.api_lyrics) {
          const lyricsRes = await fetch(data.result[0].api_lyrics, {
            headers: { "x-happi-key": HAPPI_API_KEY },
            signal: AbortSignal.timeout(5000),
          });
          if (lyricsRes.ok) {
            const lyricsData = await lyricsRes.json();
            if (lyricsData.result?.lyrics?.length > 50) {
              console.log("[Happi] Found lyrics");
              return {
                plain: lyricsData.result.lyrics,
                synced: null,
                source: "Happi",
              };
            }
          }
        }
      }
    } catch (e) {
      console.log("[Musixmatch] Failed:", e);
    }

    return { plain: null, synced: null, source: "" };
  }

  private async tryGenius(
    artist: string,
    title: string
  ): Promise<LyricsResult> {
    try {
      const query = `${artist} ${title}`;
      const response = await fetch(
        `https://api.genius.com/search?q=${encodeURIComponent(query)}`,
        {
          headers: { Authorization: `Bearer ${GENIUS_ACCESS_TOKEN}` },
          signal: AbortSignal.timeout(5000),
        }
      );

      if (!response.ok) return { plain: null, synced: null, source: "" };

      const data = await response.json();
      if (data.response.hits.length === 0)
        return { plain: null, synced: null, source: "" };

      const song = data.response.hits[0].result;
      console.log("[Genius] Found:", song.title);

      // Try to get lyrics from page
      const lyrics = await this.scrapeGeniusLyrics(song.url);
      if (lyrics) {
        return { plain: lyrics, synced: null, source: "Genius" };
      }
    } catch (e) {
      console.log("[Genius] Failed:", e);
    }

    return { plain: null, synced: null, source: "" };
  }

  private async scrapeGeniusLyrics(url: string): Promise<string | null> {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!response.ok) return null;

      const html = await response.text();

      // Find lyrics containers - improved regex
      const containerRegex =
        /<div[^>]*data-lyrics-container="true"[^>]*>([\s\S]*?)<\/div>/gi;
      const matches: string[] = [];
      let match;

      while ((match = containerRegex.exec(html)) !== null) {
        matches.push(match[1]);
      }

      if (matches.length > 0) {
        const lyrics = matches
          .map((m) => {
            // Remove all HTML tags properly
            let text = m
              // Replace <br> with newlines
              .replace(/<br\s*\/?>/gi, "\n")
              // Remove <a> tags but keep content
              .replace(/<a[^>]*>([\s\S]*?)<\/a>/gi, "$1")
              // Remove <span> tags but keep content
              .replace(/<span[^>]*>([\s\S]*?)<\/span>/gi, "$1")
              // Remove <i>, <b>, <em>, <strong> tags but keep content
              .replace(/<(i|b|em|strong)[^>]*>([\s\S]*?)<\/\1>/gi, "$2")
              // Remove any remaining HTML tags
              .replace(/<[^>]+>/g, "")
              // Decode HTML entities
              .replace(/&quot;/g, '"')
              .replace(/&amp;/g, "&")
              .replace(/&#x27;/g, "'")
              .replace(/&apos;/g, "'")
              .replace(/&nbsp;/g, " ")
              .replace(/&#(\d+);/g, (_, code) =>
                String.fromCharCode(parseInt(code))
              )
              .replace(/&#x([0-9a-f]+);/gi, (_, code) =>
                String.fromCharCode(parseInt(code, 16))
              )
              // Clean up whitespace
              .replace(/\n{3,}/g, "\n\n")
              .trim();
            return text;
          })
          .filter((t) => t.length > 0)
          .join("\n\n")
          .trim();

        // Remove "Contributors" and similar metadata at the start
        const cleanedLyrics = lyrics
          .replace(/^\d+\s*Contributors?\s*/i, "")
          .replace(/^.*Lyrics\s*/i, "")
          .trim();

        if (cleanedLyrics.length > 50) {
          console.log("[Genius] Scraped lyrics successfully");
          return cleanedLyrics;
        }
      }
    } catch (e) {
      console.log("[Genius] Scrape failed:", e);
    }
    return null;
  }

  private async tryFallback(
    artist: string,
    title: string
  ): Promise<LyricsResult> {
    // lyrics.ovh
    try {
      const res = await fetch(
        `https://api.lyrics.ovh/v1/${encodeURIComponent(
          artist
        )}/${encodeURIComponent(title)}`,
        { signal: AbortSignal.timeout(5000) }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.lyrics?.trim().length > 50) {
          console.log("[lyrics.ovh] Found");
          return {
            plain: data.lyrics.trim(),
            synced: null,
            source: "lyrics.ovh",
          };
        }
      }
    } catch (e) {
      /* silent */
    }

    // lyrist
    try {
      const res = await fetch(
        `https://lyrist.vercel.app/api/${encodeURIComponent(
          title
        )}/${encodeURIComponent(artist)}`,
        { signal: AbortSignal.timeout(5000) }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.lyrics?.trim().length > 50) {
          console.log("[lyrist] Found");
          return { plain: data.lyrics.trim(), synced: null, source: "lyrist" };
        }
      }
    } catch (e) {
      /* silent */
    }

    // Try with just title (sometimes artist name is different)
    try {
      const res = await fetch(
        `https://lrclib.net/api/search?q=${encodeURIComponent(title)}`,
        { signal: AbortSignal.timeout(5000) }
      );
      if (res.ok) {
        const results = await res.json();
        if (results.length > 0) {
          const best = results[0];
          if (best.plainLyrics?.length > 50) {
            console.log("[LRCLIB title-only] Found");
            return { plain: best.plainLyrics, synced: null, source: "LRCLIB" };
          }
        }
      }
    } catch (e) {
      /* silent */
    }

    return { plain: null, synced: null, source: "" };
  }

  private cleanString(str: string): string {
    return (
      str
        // Remove content in brackets/parentheses
        .replace(/\s*[\(\[].*?[\)\]]\s*/g, "")
        // Remove feat/ft/prod
        .replace(/\s*feat\.?\s*.*/i, "")
        .replace(/\s*ft\.?\s*.*/i, "")
        .replace(/\s*prod\.?\s*.*/i, "")
        // Remove hashtags
        .replace(/#\w+/g, "")
        // Remove extra spaces
        .replace(/\s+/g, " ")
        .trim()
    );
  }

  clearCache() {
    this.cache.clear();
  }
}

export const lyricsService = new LyricsServiceClass();
