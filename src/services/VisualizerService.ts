import type { VisualizerConfig } from "../types";
import { audioService } from "./AudioService";

export type VisualizerStyle = "waveform" | "spectrum" | "circular";

class VisualizerService {
  private analyser: AnalyserNode | null = null;
  private config: VisualizerConfig = {
    style: "spectrum",
    colorMode: "theme",
    sensitivity: 1,
  };

  connectToAudio(_: HTMLAudioElement): void {
    try {
      // Get shared AudioContext from AudioService
      const audioContext = audioService.getAudioContext();
      
      if (!audioContext) {
        console.warn('[VisualizerService] No AudioContext available from AudioService');
        return;
      }

      // Resume AudioContext if suspended
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }

      // Disconnect existing analyzer
      this.disconnect();

      // Create analyzer
      this.analyser = audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;

      // Connect to the shared audio chain via AudioService
      audioService.connectVisualizer(this.analyser);
      
      console.log('[VisualizerService] Connected to shared audio context, state:', audioContext.state);
    } catch (error) {
      console.error('[VisualizerService] Failed to connect to audio:', error);
    }
  }

  disconnect(): void {
    if (this.analyser) {
      try {
        this.analyser.disconnect();
      } catch (e) {
        // Ignore disconnect errors
      }
      this.analyser = null;
    }
  }

  getFrequencyData(): Uint8Array {
    if (!this.analyser) return new Uint8Array(0);

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(dataArray);
    return dataArray;
  }

  getTimeDomainData(): Uint8Array {
    if (!this.analyser) return new Uint8Array(0);

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteTimeDomainData(dataArray);
    return dataArray;
  }

  setStyle(style: VisualizerStyle): void {
    this.config.style = style;
  }

  getStyle(): VisualizerStyle {
    return this.config.style;
  }

  setSensitivity(sensitivity: number): void {
    this.config.sensitivity = Math.max(0.1, Math.min(2, sensitivity));
  }

  getSensitivity(): number {
    return this.config.sensitivity;
  }

  isConnected(): boolean {
    return this.analyser !== null;
  }
}

export const visualizerService = new VisualizerService();
