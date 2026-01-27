import { RefObject } from "react";

export interface Track {
  id: string;
  title: string;
  artist: string;
  artworkUrl?: string;
  duration?: number;
}

export interface ThemeColors {
  background: string;
  surface: string;
  accent: string;
  textPrimary: string;
  textSecondary: string;
}

export type SliderStyle = "default" | "ios" | "thin" | "wavy";
export type TitleAlignment = "left" | "center" | "right";

export interface PlayerBarProps {
  currentTrack: Track | null;
  artworkUrl: string;
  displayPlaying: boolean;
  isLiked: boolean;
  isDragging: boolean;
  isDraggingVolume: boolean;
  displayProgress: number;
  volume: number;
  shuffle: boolean;
  repeatMode: "off" | "all" | "one";
  currentTime: number;
  colors: ThemeColors;
  isLightTheme: boolean;
  progressRef: RefObject<HTMLDivElement>;
  sliderStyle: SliderStyle;
  titleAlignment: TitleAlignment;
  // New props for equalizer and speed
  playbackSpeed: number;
  showSpeedMenu: boolean;
  showEqualizerMenu: boolean;
  onProgressMouseDown: (e: React.MouseEvent) => void;
  onLikeClick: () => void;
  onPrev: () => void;
  onNext: () => void;
  onToggle: () => void;
  onShuffle: () => void;
  onRepeat: () => void;
  onVolToggle: () => void;
  onVolChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onVolDragStart: () => void;
  onVolDragEnd: () => void;
  onExpand: () => void;
  onTrackClick: () => void;
  onSpeedClick: () => void;
  onEqualizerClick: () => void;
  onSpeedChange: (speed: number) => void;
  onShareClick: () => void;
  speedOptions: number[];
  formatTime: (s: number) => string;
}
