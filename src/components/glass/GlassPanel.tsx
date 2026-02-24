import React from 'react';
import './GlassPanel.css';

export interface GlassPanelProps {
  children: React.ReactNode;
  blur?: number;
  opacity?: number;
  gradient?: boolean;
  className?: string;
}

export const GlassPanel: React.FC<GlassPanelProps> = ({
  children,
  blur,
  opacity,
  gradient = false,
  className = ''
}) => {
  const style: React.CSSProperties = {};

  // Apply dynamic blur if provided
  if (blur !== undefined) {
    style.backdropFilter = `blur(${blur}px) saturate(180%)`;
    style.WebkitBackdropFilter = `blur(${blur}px) saturate(180%)`;
  }

  // Apply dynamic opacity if provided
  if (opacity !== undefined) {
    style.background = `linear-gradient(
      135deg,
      rgba(255, 255, 255, ${opacity}) 0%,
      rgba(255, 255, 255, ${opacity * 0.7}) 50%,
      rgba(255, 255, 255, ${opacity * 0.4}) 100%
    )`;
  }

  const gradientClass = gradient ? 'glass-panel--animated-gradient' : '';

  return (
    <div
      className={`glass-panel ${gradientClass} ${className}`.trim()}
      style={style}
    >
      {children}
    </div>
  );
};
