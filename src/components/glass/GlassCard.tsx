import React from 'react';
import './GlassCard.css';

export interface GlassCardProps {
  children: React.ReactNode;
  intensity?: 'subtle' | 'medium' | 'strong';
  hover?: boolean;
  className?: string;
  onClick?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  intensity = 'medium',
  hover = true,
  className = '',
  onClick
}) => {
  const intensityClass = `glass-card--${intensity}`;
  const hoverClass = hover ? 'glass-card--hoverable' : '';
  const clickableClass = onClick ? 'glass-card--clickable' : '';

  return (
    <div
      className={`glass-card ${intensityClass} ${hoverClass} ${clickableClass} ${className}`.trim()}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      } : undefined}
    >
      {children}
    </div>
  );
};
