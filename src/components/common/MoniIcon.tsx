// Moni Currency Icon - Custom crystal/gem design
export function MoniIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      {/* Crystal/Gem shape */}
      <path 
        d="M12 2L3 9L12 22L21 9L12 2Z" 
        fill="currentColor" 
        fillOpacity="0.2"
      />
      <path 
        d="M12 2L3 9L12 22L21 9L12 2Z" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinejoin="round"
      />
      {/* Inner facets */}
      <path 
        d="M3 9H21M12 2L8 9L12 22L16 9L12 2" 
        stroke="currentColor" 
        strokeWidth="1" 
        strokeOpacity="0.5"
        strokeLinejoin="round"
      />
      {/* Shine */}
      <path 
        d="M9 6L12 4L15 6" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeOpacity="0.8"
      />
    </svg>
  );
}

// Moni display component
export function MoniDisplay({ amount, size = 'sm' }: { amount: number; size?: 'xs' | 'sm' | 'md' }) {
  const sizes = {
    xs: { icon: 'w-3 h-3', text: 'text-[10px]', gap: 'gap-0.5', px: 'px-1.5 py-0.5' },
    sm: { icon: 'w-3.5 h-3.5', text: 'text-xs', gap: 'gap-1', px: 'px-2 py-1' },
    md: { icon: 'w-4 h-4', text: 'text-sm', gap: 'gap-1.5', px: 'px-3 py-1.5' },
  };
  
  const s = sizes[size];
  
  return (
    <div 
      className={`inline-flex items-center ${s.gap} ${s.px} rounded-lg`}
      style={{ background: 'rgba(139, 92, 246, 0.15)', border: '1px solid rgba(139, 92, 246, 0.25)' }}
    >
      <MoniIcon className={`${s.icon} text-violet-400`} />
      <span className={`${s.text} font-semibold text-violet-400`}>{amount.toLocaleString()}</span>
    </div>
  );
}
