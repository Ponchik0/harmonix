import React from 'react';

interface ToggleProps {
  enabled: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Универсальный белый тумблер для всех тем
 */
export const Toggle: React.FC<ToggleProps> = ({ 
  enabled, 
  onChange, 
  disabled = false,
  size = 'md' 
}) => {
  const sizes = {
    sm: { container: 'w-10 h-5', thumb: 'w-4 h-4 top-0.5', thumbOn: 'calc(100% - 18px)', thumbOff: '2px' },
    md: { container: 'w-12 h-7', thumb: 'w-5 h-5 top-1', thumbOn: '26px', thumbOff: '4px' },
    lg: { container: 'w-14 h-8', thumb: 'w-6 h-6 top-1', thumbOn: '30px', thumbOff: '4px' },
  };

  const s = sizes[size];

  return (
    <button
      onClick={() => !disabled && onChange(!enabled)}
      disabled={disabled}
      className={`${s.container} rounded-full relative transition-all duration-200 flex-shrink-0`}
      style={{
        background: enabled ? '#ffffff' : 'rgba(255, 255, 255, 0.2)',
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      <div
        className={`${s.thumb} absolute rounded-full shadow-md transition-all duration-200`}
        style={{
          left: enabled ? s.thumbOn : s.thumbOff,
          background: enabled ? '#000000' : '#ffffff',
        }}
      />
    </button>
  );
};
