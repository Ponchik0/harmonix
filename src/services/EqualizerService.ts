import { storageService } from "./StorageService";
import type { EqualizerConfig, EqualizerPreset, EqualizerBand } from "../types";

// Standard 10-band frequencies
const FREQUENCIES = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

// Built-in presets
const PRESETS: EqualizerPreset[] = [
  {
    id: "flat",
    name: "Flat",
    bands: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    isCustom: false,
  },
  {
    id: "bass-boost",
    name: "Bass Boost",
    bands: [6, 5, 4, 2, 0, 0, 0, 0, 0, 0],
    isCustom: false,
  },
  {
    id: "treble-boost",
    name: "Treble Boost",
    bands: [0, 0, 0, 0, 0, 2, 4, 5, 6, 6],
    isCustom: false,
  },
  {
    id: "vocal",
    name: "Vocal",
    bands: [-2, -1, 0, 2, 4, 4, 3, 1, 0, -1],
    isCustom: false,
  },
  {
    id: "rock",
    name: "Rock",
    bands: [4, 3, 2, 0, -1, 0, 2, 3, 4, 4],
    isCustom: false,
  },
  {
    id: "electronic",
    name: "Electronic",
    bands: [4, 3, 0, -2, -1, 2, 0, 2, 4, 5],
    isCustom: false,
  },
  {
    id: "acoustic",
    name: "Acoustic",
    bands: [3, 2, 1, 1, 0, 0, 1, 2, 2, 2],
    isCustom: false,
  },
  {
    id: "jazz",
    name: "Jazz",
    bands: [2, 1, 0, 1, 2, 2, 1, 2, 3, 3],
    isCustom: false,
  },
];

class EqualizerService {
  private audioContext: AudioContext | null = null;
  private filters: BiquadFilterNode[] = [];
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private enabled: boolean = true;
  private currentBands: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  private presets: EqualizerPreset[] = [...PRESETS];
  private currentPresetId: string | null = "flat";
  private customPresets: EqualizerPreset[] = [];

  async init(): Promise<void> {
    // Load saved config
    const config = await storageService.getEqualizerConfig();
    if (config) {
      this.enabled = config.enabled;
      this.currentBands = config.bands.map((b) => b.gain);
      this.currentPresetId = config.presetId;
    }

    // Load custom presets
    const savedPresets = await storageService.getPreference<EqualizerPreset[]>(
      "customEqPresets"
    );
    if (savedPresets) {
      this.customPresets = savedPresets;
      this.presets = [...PRESETS, ...savedPresets];
    }
  }

  connectToAudio(audioElement: HTMLAudioElement): void {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }

    // Disconnect existing
    this.disconnect();

    // Create source from audio element
    this.sourceNode = this.audioContext.createMediaElementSource(audioElement);

    // Create filters for each frequency band
    this.filters = FREQUENCIES.map((freq, index) => {
      const filter = this.audioContext!.createBiquadFilter();
      filter.type = "peaking";
      filter.frequency.value = freq;
      filter.Q.value = 1.4; // Standard Q for 10-band EQ
      filter.gain.value = this.enabled ? this.currentBands[index] : 0;
      return filter;
    });

    // Connect: source -> filters -> destination
    let lastNode: AudioNode = this.sourceNode;
    for (const filter of this.filters) {
      lastNode.connect(filter);
      lastNode = filter;
    }
    lastNode.connect(this.audioContext.destination);
  }

  disconnect(): void {
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    this.filters.forEach((f) => f.disconnect());
    this.filters = [];
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.applyBands();
    this.saveConfig();
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  setBand(index: number, gain: number): void {
    if (index < 0 || index >= 10) return;

    const clampedGain = Math.max(-12, Math.min(12, gain));
    this.currentBands[index] = clampedGain;

    if (this.filters[index] && this.enabled) {
      this.filters[index].gain.value = clampedGain;
    }

    this.currentPresetId = null; // Custom settings
    this.saveConfig();
  }

  getBands(): EqualizerBand[] {
    return FREQUENCIES.map((freq, index) => ({
      frequency: freq,
      gain: this.currentBands[index],
    }));
  }

  applyPreset(presetId: string): void {
    const preset = this.presets.find((p) => p.id === presetId);
    if (!preset) return;

    this.currentBands = [...preset.bands];
    this.currentPresetId = presetId;
    this.applyBands();
    this.saveConfig();
  }

  getCurrentPresetId(): string | null {
    return this.currentPresetId;
  }

  getPresets(): EqualizerPreset[] {
    return this.presets;
  }

  async saveCustomPreset(name: string): Promise<EqualizerPreset> {
    const preset: EqualizerPreset = {
      id: `custom-${Date.now()}`,
      name,
      bands: [...this.currentBands],
      isCustom: true,
    };

    this.customPresets.push(preset);
    this.presets = [...PRESETS, ...this.customPresets];
    this.currentPresetId = preset.id;

    await storageService.savePreference("customEqPresets", this.customPresets);
    this.saveConfig();

    return preset;
  }

  async deleteCustomPreset(presetId: string): Promise<void> {
    this.customPresets = this.customPresets.filter((p) => p.id !== presetId);
    this.presets = [...PRESETS, ...this.customPresets];

    if (this.currentPresetId === presetId) {
      this.applyPreset("flat");
    }

    await storageService.savePreference("customEqPresets", this.customPresets);
  }

  getFrequencies(): number[] {
    return FREQUENCIES;
  }

  private applyBands(): void {
    this.filters.forEach((filter, index) => {
      filter.gain.value = this.enabled ? this.currentBands[index] : 0;
    });
  }

  private async saveConfig(): Promise<void> {
    const config: EqualizerConfig = {
      enabled: this.enabled,
      bands: this.getBands(),
      presetId: this.currentPresetId,
    };
    await storageService.saveEqualizerConfig(config);
  }

  // Get analyzer node for visualizer
  getAnalyzerNode(): AnalyserNode | null {
    if (!this.audioContext) return null;

    const analyzer = this.audioContext.createAnalyser();
    analyzer.fftSize = 2048;

    // Connect last filter to analyzer
    if (this.filters.length > 0) {
      this.filters[this.filters.length - 1].connect(analyzer);
    }

    return analyzer;
  }
}

export const equalizerService = new EqualizerService();
