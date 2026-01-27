import Hls from "hls.js";
import { usePlayerStore } from "../stores/playerStore";
import { useQueueStore } from "../stores/queueStore";
import { usePlayerSettingsStore } from "../stores/playerSettingsStore";
import { artworkService } from "./ArtworkService";
import type { Track } from "../types";

const EQ_FREQUENCIES = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

// Helper to decode HTML entities in URLs
const decodeUrlEntities = (url: string): string => {
  if (!url) return "";
  
  let decoded = url;
  let previous = "";
  
  while (decoded !== previous) {
    previous = decoded;
    decoded = decoded.replace(/&amp;/g, "&");
    decoded = decoded.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => 
      String.fromCharCode(parseInt(hex, 16))
    );
    decoded = decoded.replace(/&#(\d+);/g, (_, dec) => 
      String.fromCharCode(parseInt(dec, 10))
    );
    decoded = decoded
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&nbsp;/g, " ");
  }
  
  return decoded.replace(/\[link_removed\]/g, "").trim();
};

class AudioService {
  private audio: HTMLAudioElement | null = null;
  private nextAudio: HTMLAudioElement | null = null; // For crossfade
  private hls: Hls | null = null;
  private progressInterval: number | null = null;
  private shouldAutoPlay: boolean = true;
  private currentVolume: number = 0.7;
  private isCrossfading: boolean = false;

  // Equalizer
  private audioContext: AudioContext | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private filters: BiquadFilterNode[] = [];
  private eqEnabled: boolean = true;
  private eqBands: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  private eqConnected: boolean = false;

  constructor() {
    this.audio = new Audio();
    this.nextAudio = new Audio(); // For crossfade
    
    // CRITICAL: Set crossOrigin to allow Web Audio API access
    // Without this, CORS will block audio when using MediaElementSource
    this.audio.crossOrigin = "anonymous";
    this.nextAudio.crossOrigin = "anonymous";
    
    // Load saved volume and apply scaling
    this.currentVolume = this.loadVolume();
    const scaledVolume = this.currentVolume === 0 ? 0 : Math.pow(this.currentVolume, 2);
    this.audio.volume = scaledVolume;
    this.nextAudio.volume = 0; // Start silent for crossfade
    this.setupEventListeners();
    this.setupNextAudioListeners();
    this.loadEqSettings();
  }

  private loadVolume(): number {
    try {
      const saved = localStorage.getItem("harmonix-volume");
      if (saved) {
        const vol = parseFloat(saved);
        if (!isNaN(vol) && vol >= 0 && vol <= 1) return vol;
      }
    } catch {}
    return 0.7;
  }

  private saveVolume(volume: number): void {
    localStorage.setItem("harmonix-volume", volume.toString());
  }

  private loadEqSettings(): void {
    try {
      const saved = localStorage.getItem("eq_settings");
      if (saved) {
        const { enabled, bands } = JSON.parse(saved);
        this.eqEnabled = enabled ?? true;
        this.eqBands = bands ?? [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      }
    } catch (e) {
      console.log("[AudioService] No saved EQ settings");
    }
  }

  private saveEqSettings(): void {
    localStorage.setItem(
      "eq_settings",
      JSON.stringify({
        enabled: this.eqEnabled,
        bands: this.eqBands,
      })
    );
  }

  private connectEqualizer(): void {
    if (!this.audio || this.eqConnected) return;

    try {
      if (!this.audioContext) {
        console.log("[AudioService] Creating new AudioContext");
        this.audioContext = new AudioContext();
        console.log("[AudioService] AudioContext state:", this.audioContext.state);
      }

      if (this.audioContext.state === "suspended") {
        console.log("[AudioService] AudioContext is suspended, resuming...");
        this.audioContext.resume().then(() => {
          console.log("[AudioService] AudioContext resumed in connectEqualizer");
        });
      }

      // Only create source node if it doesn't exist
      // CRITICAL: MediaElementSource can only be created once per audio element
      if (!this.sourceNode) {
        try {
          console.log("[AudioService] Creating MediaElementSource");
          this.sourceNode = this.audioContext.createMediaElementSource(this.audio);
          console.log("[AudioService] MediaElementSource created successfully");
        } catch (e) {
          console.error("[AudioService] Failed to create source node (already exists?):", e);
          // Source node already exists, this is OK
          return;
        }
      }

      this.filters = EQ_FREQUENCIES.map((freq, i) => {
        const filter = this.audioContext!.createBiquadFilter();
        filter.type = "peaking";
        filter.frequency.value = freq;
        filter.Q.value = 1.4;
        filter.gain.value = this.eqEnabled ? this.eqBands[i] : 0;
        return filter;
      });

      // Disconnect existing connections first
      try {
        this.sourceNode.disconnect();
      } catch (e) {
        // Ignore if nothing was connected
      }

      let lastNode: AudioNode = this.sourceNode;
      for (const filter of this.filters) {
        lastNode.connect(filter);
        lastNode = filter;
      }
      lastNode.connect(this.audioContext.destination);

      this.eqConnected = true;
      console.log("[AudioService] Equalizer connected");

      // Apply saved EQ settings immediately
      if (this.eqEnabled) {
        this.filters.forEach((f, i) => {
          f.gain.value = this.eqBands[i];
        });
      }
    } catch (e) {
      console.error("[AudioService] Failed to connect equalizer:", e);
    }
  }

  setEqEnabled(enabled: boolean): void {
    this.eqEnabled = enabled;
    if (!this.eqConnected) {
      this.connectEqualizer();
    }
    // Apply immediately to all filters
    if (this.filters.length > 0) {
      this.filters.forEach((f, i) => {
        f.gain.setValueAtTime(
          enabled ? this.eqBands[i] : 0,
          this.audioContext?.currentTime || 0
        );
      });
    }
    this.saveEqSettings();
  }

  isEqEnabled(): boolean {
    return this.eqEnabled;
  }

  setEqBand(index: number, gain: number): void {
    if (index < 0 || index >= 10) return;
    const clamped = Math.max(-12, Math.min(12, gain));
    this.eqBands[index] = clamped;
    if (!this.eqConnected) {
      this.connectEqualizer();
    }
    // Apply immediately if EQ is enabled and filter exists
    if (this.filters[index] && this.eqEnabled && this.audioContext) {
      this.filters[index].gain.setValueAtTime(
        clamped,
        this.audioContext.currentTime
      );
    }
    this.saveEqSettings();
  }

  getEqBands(): number[] {
    return [...this.eqBands];
  }

  applyEqPreset(bands: number[]): void {
    this.eqBands = [...bands];
    if (!this.eqConnected) {
      this.connectEqualizer();
    }
    // Apply immediately to all filters
    if (this.filters.length > 0 && this.audioContext) {
      this.filters.forEach((f, i) => {
        f.gain.setValueAtTime(
          this.eqEnabled ? bands[i] : 0,
          this.audioContext!.currentTime
        );
      });
    }
    this.saveEqSettings();
  }

  getAudioElement(): HTMLAudioElement | null {
    return this.audio;
  }

  // Methods for VisualizerService to access shared AudioContext
  getAudioContext(): AudioContext | null {
    return this.audioContext;
  }

  getSourceNode(): MediaElementAudioSourceNode | null {
    return this.sourceNode;
  }

  // Method to connect visualizer to the same audio chain
  connectVisualizer(analyser: AnalyserNode): void {
    if (!this.sourceNode || !this.audioContext) {
      console.warn("[AudioService] Cannot connect visualizer - no audio context");
      return;
    }

    try {
      // Connect the source to the analyser
      this.sourceNode.connect(analyser);
      console.log("[AudioService] Visualizer connected to audio chain");
    } catch (e) {
      console.error("[AudioService] Failed to connect visualizer:", e);
    }
  }

  private setupEventListeners(): void {
    if (!this.audio) return;

    this.audio.addEventListener("play", () => {
      console.log("[AudioService] Playing");
      usePlayerStore.getState().play();
      this.startProgressTracking();
    });

    this.audio.addEventListener("pause", () => {
      console.log("[AudioService] Paused");
      usePlayerStore.getState().pause();
      this.stopProgressTracking();
    });

    this.audio.addEventListener("ended", () => {
      console.log("[AudioService] Track ended");
      this.stopProgressTracking();
      this.handleTrackEnd();
    });

    this.audio.addEventListener("error", (e) => {
      console.error("[AudioService] Error:", e);
      this.handleLoadError();
    });

    this.audio.addEventListener("canplay", () => {
      console.log("[AudioService] Can play");
      
      // CRITICAL: Resume AudioContext before playing
      if (this.audioContext?.state === "suspended") {
        console.log("[AudioService] Resuming AudioContext on canplay");
        this.audioContext.resume();
      }
      
      // Connect equalizer on first play
      if (!this.eqConnected) {
        this.connectEqualizer();
      }

      // Only autoplay if shouldAutoPlay flag is set
      if (this.shouldAutoPlay) {
        this.audio?.play().catch((err) => {
          console.error("[AudioService] Autoplay failed:", err);
          // If autoplay fails, it's likely due to browser policy
          // User will need to click play button manually
        });
      }
    });
  }

  private setupNextAudioListeners(): void {
    if (!this.nextAudio) return;

    // Minimal listeners for next audio - just error handling
    this.nextAudio.addEventListener("error", (e) => {
      console.error("[AudioService] Next audio error:", e);
      // Don't show error to user, crossfade will just be skipped
      this.isCrossfading = false;
    });
  }

  load(track: Track, autoPlay: boolean = true): void {
    // Reset fallback flag for new track
    this.hasTriedFallback = false;
    
    // Decode any HTML entities in URLs
    const decodedStreamUrl = decodeUrlEntities(track.streamUrl || "");
    const decodedArtworkUrl = decodeUrlEntities(track.artworkUrl || "");
    
    // Create a clean track object with decoded URLs
    const cleanTrack: Track = {
      ...track,
      streamUrl: decodedStreamUrl,
      artworkUrl: decodedArtworkUrl,
    };
    
    console.log(
      "[AudioService] Loading track:",
      cleanTrack.title,
      "autoPlay:",
      autoPlay
    );
    console.log(
      "[AudioService] Stream URL:",
      cleanTrack.streamUrl?.substring(0, 80) + "..."
    );

    // Validate URL - must be a proper URL with domain
    const isValidStreamUrl = (url: string): boolean => {
      if (!url) return false;
      try {
        const parsed = new URL(url);
        const hasValidProtocol = parsed.protocol === 'http:' || parsed.protocol === 'https:';
        const hasValidHostname = Boolean(parsed.hostname && parsed.hostname.length > 0 && parsed.hostname.includes('.'));
        const noEncodedEntities = !url.includes('&#') && !url.includes('&amp;');
        
        console.log("[AudioService] URL validation:", {
          url: url.substring(0, 60),
          protocol: parsed.protocol,
          hostname: parsed.hostname,
          hasValidProtocol,
          hasValidHostname,
          noEncodedEntities
        });
        
        return hasValidProtocol && hasValidHostname && noEncodedEntities;
      } catch (e) {
        console.log("[AudioService] URL parse error:", e);
        return false;
      }
    };

    if (!isValidStreamUrl(cleanTrack.streamUrl)) {
      console.log("[AudioService] Invalid stream URL detected:", cleanTrack.streamUrl?.substring(0, 80));
      console.log("[AudioService] Using fallback service...");
      // Try to get fresh URL via fallback service
      this.loadWithFallback(cleanTrack, autoPlay);
      return;
    }

    // Dispatch track-changed event for recently played tracking
    window.dispatchEvent(
      new CustomEvent("track-changed", { detail: { track: cleanTrack } })
    );

    // Set autoplay flag
    this.shouldAutoPlay = autoPlay;

    // Stop current playback
    this.stopProgressTracking();
    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }

    // Reset current audio element instead of creating new one
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }

    const isHls =
      cleanTrack.streamUrl.includes(".m3u8") || cleanTrack.streamUrl.includes("playlist");

    if (isHls && Hls.isSupported()) {
      console.log("[AudioService] Using HLS.js for streaming");
      this.hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        maxBufferLength: 10,
        maxMaxBufferLength: 30,
      });
      this.hls.loadSource(cleanTrack.streamUrl);
      this.hls.attachMedia(this.audio!);
      this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log("[AudioService] HLS manifest parsed, playing...");
        if (this.shouldAutoPlay) {
          this.audio
            ?.play()
            .catch((err) => console.error("[AudioService] Play error:", err));
        }
      });
      this.hls.on(Hls.Events.ERROR, (_, data) => {
        console.error("[AudioService] HLS error:", data);
        if (data.fatal) {
          this.handleLoadError();
        }
      });
    } else if (this.audio?.canPlayType("application/vnd.apple.mpegurl")) {
      // Safari native HLS support
      console.log("[AudioService] Using native HLS support");
      this.audio.src = cleanTrack.streamUrl;
    } else if (this.audio) {
      // Direct MP3/audio file
      console.log("[AudioService] Using direct audio source");
      this.audio.src = cleanTrack.streamUrl;
    }

    usePlayerStore.getState().setTrack(cleanTrack);

    // Автоматически подгружаем обложку если её нет
    if (!this.isValidImageUrl(cleanTrack.artworkUrl)) {
      this.fetchArtworkInBackground(cleanTrack);
    }
  }

  /**
   * Подгружает обложку для трека в фоне и обновляет store
   */
  private async fetchArtworkInBackground(track: Track): Promise<void> {
    try {
      const artworkUrl = await artworkService.searchArtwork(track);
      if (artworkUrl) {
        const currentTrack = usePlayerStore.getState().currentTrack;
        // Обновляем только если это всё ещё тот же трек
        if (currentTrack && currentTrack.id === track.id) {
          usePlayerStore.getState().updateCurrentTrackArtwork(artworkUrl);
        }
        useQueueStore.getState().updateTrackArtwork(track.id, artworkUrl);
      }
    } catch (error) {
      console.error("[AudioService] Failed to fetch artwork:", error);
    }
  }

  private async loadWithFallback(track: Track, autoPlay: boolean): Promise<void> {
    try {
      console.log("[AudioService] Trying fallback for:", track.title);
      
      // Prevent infinite recursion
      if (this.hasTriedFallback) {
        console.error("[AudioService] Already tried fallback, skipping");
        usePlayerStore.getState().pause();
        window.dispatchEvent(
          new CustomEvent("show-toast", {
            detail: { message: "Не удалось найти трек", type: "error" },
          })
        );
        return;
      }
      
      this.hasTriedFallback = true;
      
      const { streamFallbackService } = await import("./StreamFallbackService");
      const result = await streamFallbackService.getStreamUrl(track);
      
      if (result.streamUrl) {
        // Keep original track info, but use fallback's streamUrl and artworkUrl if available
        const fallback = result.fallbackTrack;
        const trackToPlay: Track = {
          ...track,
          streamUrl: result.streamUrl,
          // Use fallback artwork if original is invalid/empty
          artworkUrl: this.isValidImageUrl(track.artworkUrl) 
            ? track.artworkUrl 
            : (fallback?.artworkUrl || track.artworkUrl),
        };
        console.log("[AudioService] Playing with fallback:", {
          title: trackToPlay.title,
          streamUrl: result.streamUrl.substring(0, 50),
          artworkUrl: trackToPlay.artworkUrl?.substring(0, 50)
        });
        
        // Update player store with new track info
        usePlayerStore.getState().setTrack(trackToPlay);
        
        // Load without calling load() again to prevent recursion
        this.loadDirectly(trackToPlay, autoPlay);
      } else {
        console.error("[AudioService] Fallback failed - no stream URL found");
        usePlayerStore.getState().pause();
        window.dispatchEvent(
          new CustomEvent("show-toast", {
            detail: { message: "Не удалось найти трек", type: "error" },
          })
        );
      }
    } catch (error) {
      console.error("[AudioService] Fallback error:", error);
      usePlayerStore.getState().pause();
      window.dispatchEvent(
        new CustomEvent("show-toast", {
          detail: { message: "Ошибка поиска трека", type: "error" },
        })
      );
    }
  }

  private isValidImageUrl(url: string | undefined): boolean {
    if (!url) return false;
    try {
      const parsed = new URL(url);
      const hasValidProtocol = parsed.protocol === 'http:' || parsed.protocol === 'https:';
      const hasValidHostname = Boolean(parsed.hostname && parsed.hostname.includes('.'));
      const noEncodedEntities = !url.includes('&#') && !url.includes('&amp;');
      return hasValidProtocol && hasValidHostname && noEncodedEntities;
    } catch {
      return false;
    }
  }

  /**
   * Load track directly without URL validation (used by fallback)
   */
  private loadDirectly(track: Track, autoPlay: boolean): void {
    console.log("[AudioService] Loading directly:", track.title);
    
    // Dispatch track-changed event
    window.dispatchEvent(
      new CustomEvent("track-changed", { detail: { track } })
    );

    // Set autoplay flag
    this.shouldAutoPlay = autoPlay;

    // Stop current playback
    this.stopProgressTracking();
    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }

    // Reset current audio element
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }

    const isHls = track.streamUrl.includes(".m3u8") || track.streamUrl.includes("playlist");

    if (isHls && Hls.isSupported()) {
      console.log("[AudioService] Using HLS.js for streaming");
      this.hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        maxBufferLength: 10,
        maxMaxBufferLength: 30,
      });
      this.hls.loadSource(track.streamUrl);
      this.hls.attachMedia(this.audio!);
      this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log("[AudioService] HLS manifest parsed, playing...");
        if (this.shouldAutoPlay) {
          this.audio?.play().catch((err) => console.error("[AudioService] Play error:", err));
        }
      });
      this.hls.on(Hls.Events.ERROR, (_, data) => {
        console.error("[AudioService] HLS error:", data);
        if (data.fatal) {
          this.handleLoadError();
        }
      });
    } else {
      // Regular audio
      this.audio!.src = track.streamUrl;
      this.audio!.load();
      if (this.shouldAutoPlay) {
        this.audio?.play().catch((err) => console.error("[AudioService] Play error:", err));
      }
    }

    // Update player store
    usePlayerStore.getState().setTrack(track);
    if (this.shouldAutoPlay) {
      usePlayerStore.getState().play();
    }

    // Start progress tracking
    this.startProgressTracking();
  }

  private playPromise: Promise<void> | null = null;
  private hasTriedFallback: boolean = false;

  play(): void {
    if (!this.audio) return;

    // Check if we have a valid audio source
    if (!this.audio.src || this.audio.src === "") {
      const currentTrack = usePlayerStore.getState().currentTrack;
      if (currentTrack?.streamUrl) {
        console.log(
          "[AudioService] No audio source in play(), reloading track"
        );
        // Reset fallback flag when manually reloading
        this.hasTriedFallback = false;
        this.load(currentTrack, true);
        return;
      }
      console.log("[AudioService] Cannot play - no audio source");
      return;
    }

    // CRITICAL: Resume AudioContext if suspended (required for user interaction)
    // This is the main fix for dev mode audio issues
    if (this.audioContext?.state === "suspended") {
      console.log("[AudioService] Resuming suspended AudioContext...");
      this.audioContext.resume().then(() => {
        console.log("[AudioService] AudioContext resumed successfully");
      }).catch(err => {
        console.error("[AudioService] Failed to resume AudioContext:", err);
      });
    }
    
    // If AudioContext doesn't exist yet, create it on first play
    if (!this.audioContext && !this.eqConnected) {
      console.log("[AudioService] Creating AudioContext on first play");
      this.connectEqualizer();
    }

    // Cancel any pending play promise
    if (this.playPromise) {
      this.playPromise = null;
    }

    this.playPromise = this.audio.play();
    this.playPromise
      .then(() => {
        this.playPromise = null;
      })
      .catch((err) => {
        this.playPromise = null;
        if (err.name !== "AbortError") {
          console.error("[AudioService] Play error:", err);
          // If play fails, try to reload with fallback
          const currentTrack = usePlayerStore.getState().currentTrack;
          if (currentTrack && !this.hasTriedFallback) {
            console.log("[AudioService] Play failed, trying fallback...");
            this.loadWithFallback(currentTrack, true);
          }
        }
      });
  }

  pause(): void {
    if (!this.audio) return;

    // Wait for play promise to resolve before pausing
    if (this.playPromise) {
      this.playPromise
        .then(() => {
          this.audio?.pause();
        })
        .catch(() => {
          this.audio?.pause();
        });
    } else {
      this.audio.pause();
    }
  }

  toggle(): void {
    console.log("[AudioService] toggle() called");
    console.log("[AudioService] audio:", !!this.audio);
    console.log("[AudioService] audio.src:", this.audio?.src);
    console.log("[AudioService] audio.paused:", this.audio?.paused);
    console.log("[AudioService] audioContext.state:", this.audioContext?.state);

    // CRITICAL: Resume AudioContext on user interaction (fixes dev mode)
    if (this.audioContext?.state === "suspended") {
      console.log("[AudioService] Resuming AudioContext on toggle");
      this.audioContext.resume();
    }

    // Check if we have a valid audio source
    if (!this.audio || !this.audio.src || this.audio.src === "") {
      // No audio source - try to restore last track
      const currentTrack = usePlayerStore.getState().currentTrack;
      console.log(
        "[AudioService] No audio source, currentTrack:",
        currentTrack?.title
      );
      if (currentTrack?.streamUrl) {
        console.log("[AudioService] Reloading current track");
        // Reset fallback flag when manually reloading
        this.hasTriedFallback = false;
        this.load(currentTrack, true);
      } else {
        console.log("[AudioService] No track to play");
      }
      return;
    }

    if (this.audio.paused) {
      console.log("[AudioService] Calling play()");
      this.play();
    } else {
      console.log("[AudioService] Calling pause()");
      this.pause();
    }
  }

  stop(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }
  }

  seek(position: number): void {
    if (this.audio && this.audio.duration) {
      this.audio.currentTime = position * this.audio.duration;
      usePlayerStore.getState().setProgress(position);
    }
  }

  setVolume(volume: number): void {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    this.currentVolume = clampedVolume;
    if (this.audio) {
      // Apply logarithmic scaling for more natural volume control
      // This makes low volumes more usable and high volumes less jarring
      const scaledVolume = clampedVolume === 0 ? 0 : Math.pow(clampedVolume, 2);
      this.audio.volume = scaledVolume;
    }
    this.saveVolume(clampedVolume);
    usePlayerStore.getState().setVolume(clampedVolume);
  }

  getVolume(): number {
    // Return the current volume (not the scaled one)
    return this.currentVolume;
  }

  getDuration(): number {
    return this.audio?.duration || 0;
  }

  getCurrentTime(): number {
    return this.audio?.currentTime || 0;
  }

  isPlaying(): boolean {
    return this.audio ? !this.audio.paused : false;
  }

  unload(): void {
    this.stopProgressTracking();
    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }
    if (this.audio) {
      this.audio.pause();
      // Don't clear src if equalizer is connected - just pause
      if (!this.eqConnected) {
        this.audio.src = "";
      }
    }
  }

  private startProgressTracking(): void {
    this.stopProgressTracking();
    // Reduced frequency from 100ms to 250ms - still smooth but less CPU
    this.progressInterval = window.setInterval(() => {
      if (this.audio && !this.audio.paused && this.audio.duration) {
        const progress = this.audio.currentTime / this.audio.duration;
        usePlayerStore.getState().setProgress(progress);
        
        // Check if crossfade should start
        this.checkCrossfade();
      }
    }, 250);
  }

  private stopProgressTracking(): void {
    if (this.progressInterval !== null) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }

  private handleTrackEnd(): void {
    // If we're crossfading, the track transition is already handled
    if (this.isCrossfading) {
      console.log("[AudioService] Track ended during crossfade, skipping normal end handling");
      return;
    }
    
    const { repeatMode } = usePlayerStore.getState();
    if (repeatMode === "one") {
      this.seek(0);
      this.play();
    } else {
      usePlayerStore.getState().nextTrack();
    }
  }

  // Crossfade implementation
  private startCrossfade(duration: number): void {
    if (this.isCrossfading || !this.audio || !this.nextAudio) return;
    
    console.log("[AudioService] Starting crossfade:", duration, "seconds");
    this.isCrossfading = true;
    const steps = 50; // Number of volume steps
    const interval = (duration * 1000) / steps;
    const targetVolume = this.currentVolume === 0 ? 0 : Math.pow(this.currentVolume, 2);
    
    // Get the next track info before we start
    const upcoming = useQueueStore.getState().upcoming;
    const nextTrack = upcoming[0];
    
    let step = 0;
    const fadeInterval = setInterval(() => {
      step++;
      const progress = step / steps;
      
      // Fade out current track
      if (this.audio) {
        this.audio.volume = targetVolume * (1 - progress);
      }
      
      // Fade in next track
      if (this.nextAudio) {
        this.nextAudio.volume = targetVolume * progress;
      }
      
      if (step >= steps) {
        clearInterval(fadeInterval);
        console.log("[AudioService] Crossfade complete, swapping tracks");
        
        // Swap audio elements
        if (this.audio && this.nextAudio) {
          // Stop and cleanup old audio
          this.audio.pause();
          this.audio.currentTime = 0;
          this.audio.src = "";
          
          // Swap references
          const temp = this.audio;
          this.audio = this.nextAudio;
          this.nextAudio = temp;
          
          // Reset next audio
          this.nextAudio.volume = 0;
          this.nextAudio.pause();
          this.nextAudio.currentTime = 0;
          this.nextAudio.src = "";
          
          // Reconnect equalizer to new audio element
          this.reconnectEqualizer();
          
          // Update player state to next track
          if (nextTrack) {
            usePlayerStore.getState().setTrack(nextTrack);
            useQueueStore.getState().removeFromQueue(0);
          }
          
          // Make sure we're tracking progress for the new audio element
          this.startProgressTracking();
        }
        
        this.isCrossfading = false;
      }
    }, interval);
  }
  
  // Reconnect equalizer after swapping audio elements
  private reconnectEqualizer(): void {
    if (!this.audioContext || !this.audio) return;
    
    try {
      // Disconnect old source
      if (this.sourceNode) {
        try {
          this.sourceNode.disconnect();
        } catch (e) {
          // Already disconnected, ignore
        }
        this.sourceNode = null;
      }
      
      // Create new source for new audio element
      // CRITICAL: This will fail if source was already created for this element
      try {
        this.sourceNode = this.audioContext.createMediaElementSource(this.audio);
      } catch (e) {
        console.error("[AudioService] Cannot create source node - audio element already has one:", e);
        // Mark as not connected so it will be recreated on next play
        this.eqConnected = false;
        return;
      }
      
      // Reconnect filters
      let lastNode: AudioNode = this.sourceNode;
      for (const filter of this.filters) {
        lastNode.connect(filter);
        lastNode = filter;
      }
      lastNode.connect(this.audioContext.destination);
      
      console.log("[AudioService] Equalizer reconnected to new audio element");
    } catch (e) {
      console.error("[AudioService] Failed to reconnect equalizer:", e);
      // If reconnection fails, mark as not connected and try again on next play
      this.eqConnected = false;
    }
  }

  // Check if crossfade should start
  private checkCrossfade(): void {
    if (!this.audio || this.isCrossfading) return;
    
    // Get crossfade duration from store
    const { crossfadeDuration } = usePlayerSettingsStore.getState();
    
    // Skip if crossfade is disabled (0 seconds)
    if (crossfadeDuration === 0) return;
    
    const currentTime = this.audio.currentTime;
    const totalDuration = this.audio.duration;
    
    if (isNaN(totalDuration) || totalDuration === 0) return;
    
    const timeRemaining = totalDuration - currentTime;
    
    // Start crossfade when time remaining equals crossfade duration
    if (timeRemaining <= crossfadeDuration && timeRemaining > crossfadeDuration - 0.5) {
      const upcoming = useQueueStore.getState().upcoming;
      if (upcoming.length > 0) {
        const nextTrack = upcoming[0];
        this.preloadNextTrack(nextTrack, crossfadeDuration);
      }
    }
  }

  // Preload next track for crossfade
  private async preloadNextTrack(track: Track, crossfadeDuration: number): Promise<void> {
    if (!this.nextAudio || this.isCrossfading) return;
    
    try {
      console.log("[AudioService] Preloading next track for crossfade:", track.title);
      
      // Decode URL entities
      const decodedStreamUrl = decodeUrlEntities(track.streamUrl || "");
      
      // Check if it's a local file, blob, or data URL
      if (decodedStreamUrl.startsWith("file://") || 
          decodedStreamUrl.startsWith("blob:") || 
          decodedStreamUrl.startsWith("data:")) {
        this.nextAudio.src = decodedStreamUrl;
      } else if (decodedStreamUrl.includes(".m3u8")) {
        // HLS stream - skip crossfade for now as it requires separate HLS instance
        console.log("[AudioService] Skipping crossfade for HLS stream");
        return;
      } else {
        this.nextAudio.src = decodedStreamUrl;
      }
      
      this.nextAudio.load();
      
      // Wait for next track to be ready
      await new Promise<void>((resolve, reject) => {
        if (!this.nextAudio) return reject();
        
        const onCanPlay = () => {
          cleanup();
          resolve();
        };
        
        const onError = () => {
          cleanup();
          reject();
        };
        
        const cleanup = () => {
          if (this.nextAudio) {
            this.nextAudio.removeEventListener("canplay", onCanPlay);
            this.nextAudio.removeEventListener("error", onError);
          }
        };
        
        this.nextAudio.addEventListener("canplay", onCanPlay);
        this.nextAudio.addEventListener("error", onError);
        
        // Timeout after 3 seconds
        setTimeout(() => {
          cleanup();
          resolve(); // Continue anyway
        }, 3000);
      });
      
      // Start playing next track silently
      this.nextAudio.volume = 0;
      await this.nextAudio.play();
      
      console.log("[AudioService] Next track preloaded, starting crossfade");
      
      // Start crossfade
      this.startCrossfade(crossfadeDuration);
      
    } catch (error) {
      console.error("[AudioService] Failed to preload next track:", error);
      this.isCrossfading = false;
      // Don't show error to user, just skip crossfade and play normally
    }
  }

  private handleLoadError(): void {
    console.error("[AudioService] Failed to load track");

    const currentTrack = usePlayerStore.getState().currentTrack;
    
    // Если трек есть и у него был streamUrl, пробуем fallback
    if (currentTrack && !this.hasTriedFallback) {
      console.log("[AudioService] Trying fallback after load error...");
      this.hasTriedFallback = true;
      this.loadWithFallback(currentTrack, true);
      return;
    }

    // Сбрасываем флаг для следующего трека
    this.hasTriedFallback = false;

    // Просто останавливаем воспроизведение и показываем ошибку
    // НЕ переключаем автоматически на следующий трек - только пользователь может переключать
    usePlayerStore.getState().pause();

    // Показываем уведомление
    window.dispatchEvent(
      new CustomEvent("show-toast", {
        detail: { message: "Не удалось загрузить трек", type: "error" },
      })
    );
  }
}

export const audioService = new AudioService();
