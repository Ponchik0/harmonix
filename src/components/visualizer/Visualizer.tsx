import { useRef, useEffect, useState } from "react";
import { Activity, Waves, Circle, Sparkles } from "lucide-react";
import {
  visualizerService,
  VisualizerStyle,
} from "../../services/VisualizerService";
import { usePlayerStore } from "../../stores/playerStore";
import { usePlayerSettingsStore, VisualizerStyle as SettingsVisualizerStyle } from "../../stores/playerSettingsStore";
import { useOptimization } from "../../hooks/useOptimization";

interface VisualizerProps {
  width?: number;
  height?: number;
  className?: string;
}

// Map settings store style to visualizer service style
const mapStyleToService = (style: SettingsVisualizerStyle): VisualizerStyle => {
  switch (style) {
    case 'wave': return 'waveform';
    case 'circle': return 'circular';
    case 'bars':
    case 'particles':
    default: return 'spectrum';
  }
};

export function Visualizer({
  width = 300,
  height = 100,
  className,
}: VisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const particlesRef = useRef<{ x: number; y: number; vx: number; vy: number; life: number; size: number }[]>([]);

  const { visualizerStyle, visualizerEnabled } = usePlayerSettingsStore();
  const [style, setStyle] = useState<VisualizerStyle>(() => mapStyleToService(visualizerStyle));

  // Use selector to prevent re-renders from progress updates
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const optimization = useOptimization();

  // Sync with settings store
  useEffect(() => {
    if (visualizerStyle !== 'none') {
      setStyle(mapStyleToService(visualizerStyle));
    }
  }, [visualizerStyle]);

  // If visualizer is disabled in settings or optimization
  if (!visualizerEnabled || visualizerStyle === 'none' || optimization.disableVisualizer) {
    return (
      <div className={className} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div 
          className="rounded-2xl flex items-center justify-center"
          style={{
            width,
            height,
            background: "var(--surface-elevated)",
            opacity: 0.5,
          }}
        >
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <div 
                key={i} 
                className="w-1 rounded-full"
                style={{ 
                  height: 8 + Math.random() * 16, 
                  opacity: 0.3,
                  background: 'var(--interactive-accent)'
                }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let isVisible = true;
    const handleVisibility = () => {
      isVisible = !document.hidden;
    };
    document.addEventListener("visibilitychange", handleVisibility);

    const draw = () => {
      // Stop animation when not playing or tab not visible
      if (!isPlaying || !isVisible) {
        // Draw static gradient line when paused
        const computedStyle = getComputedStyle(document.documentElement);
        const accentColor = computedStyle.getPropertyValue('--interactive-accent').trim() || "#8B5CF6";
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = `${accentColor}40`;
        ctx.fillRect(0, height / 2 - 2, width, 4);
        return;
      }

      // Get accent color from CSS variable
      const computedStyle = getComputedStyle(document.documentElement);
      const accentColor = computedStyle.getPropertyValue('--interactive-accent').trim() || "#8B5CF6";
      
      ctx.clearRect(0, 0, width, height);

      const frequencyData = visualizerService.getFrequencyData();
      const timeDomainData = visualizerService.getTimeDomainData();

      if (frequencyData.length === 0) {
        animationRef.current = requestAnimationFrame(draw);
        return;
      }

      // Check for particles style from settings
      if (visualizerStyle === 'particles') {
        drawParticles(ctx, frequencyData, accentColor);
      } else {
        switch (style) {
          case "waveform":
            drawWaveform(ctx, timeDomainData, accentColor);
            break;
          case "spectrum":
            drawSpectrum(ctx, frequencyData, accentColor);
            break;
          case "circular":
            drawCircular(ctx, frequencyData, accentColor);
            break;
        }
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    // Only start animation when playing
    if (isPlaying) {
      draw();
    } else {
      // Draw static state once
      const computedStyle = getComputedStyle(document.documentElement);
      const accentColor = computedStyle.getPropertyValue('--interactive-accent').trim() || "#8B5CF6";
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = `${accentColor}40`;
      ctx.fillRect(0, height / 2 - 2, width, 4);
    }

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, style, visualizerStyle, width, height]);

  const drawWaveform = (
    ctx: CanvasRenderingContext2D,
    data: Uint8Array,
    color: string
  ) => {
    ctx.lineWidth = 2;
    ctx.strokeStyle = color;
    ctx.shadowBlur = 10;
    ctx.shadowColor = color;
    ctx.beginPath();

    const sliceWidth = width / data.length;
    let x = 0;

    for (let i = 0; i < data.length; i++) {
      const v = data[i] / 128.0;
      const y = (v * height) / 2;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    ctx.lineTo(width, height / 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
  };

  const drawSpectrum = (
    ctx: CanvasRenderingContext2D,
    data: Uint8Array,
    color: string
  ) => {
    const barCount = 40;
    const barWidth = width / barCount - 3;
    const step = Math.floor(data.length / barCount);

    for (let i = 0; i < barCount; i++) {
      const value = data[i * step];
      const barHeight = (value / 255) * height * 0.95;
      const x = i * (barWidth + 3);

      // Use accent color with opacity gradient
      const opacity = 0.4 + (barHeight / height) * 0.6;
      ctx.fillStyle = color;
      ctx.globalAlpha = opacity;
      ctx.shadowBlur = 8;
      ctx.shadowColor = color;

      const radius = barWidth / 2;
      ctx.beginPath();
      ctx.moveTo(x + radius, height);
      ctx.lineTo(x + radius, height - barHeight + radius);
      ctx.arc(x + radius, height - barHeight + radius, radius, Math.PI, 0, false);
      ctx.lineTo(x + barWidth - radius, height);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  };

  const drawCircular = (
    ctx: CanvasRenderingContext2D,
    data: Uint8Array,
    color: string
  ) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 3;
    const barCount = 64;
    const step = Math.floor(data.length / barCount);

    for (let i = 0; i < barCount; i++) {
      const value = data[i * step];
      const barHeight = (value / 255) * radius * 0.9;
      const angle = (i / barCount) * Math.PI * 2 - Math.PI / 2;

      const x1 = centerX + Math.cos(angle) * radius;
      const y1 = centerY + Math.sin(angle) * radius;
      const x2 = centerX + Math.cos(angle) * (radius + barHeight);
      const y2 = centerY + Math.sin(angle) * (radius + barHeight);

      const opacity = 0.4 + (barHeight / radius) * 0.6;
      ctx.strokeStyle = color;
      ctx.globalAlpha = opacity;
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.shadowBlur = 6;
      ctx.shadowColor = color;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  };

  const drawParticles = (
    ctx: CanvasRenderingContext2D,
    data: Uint8Array,
    color: string
  ) => {
    // Calculate average energy
    let energy = 0;
    for (let i = 0; i < data.length; i++) {
      energy += data[i];
    }
    energy = energy / data.length / 255;

    // Spawn new particles based on energy
    if (energy > 0.3 && particlesRef.current.length < 100) {
      const count = Math.floor(energy * 5);
      for (let i = 0; i < count; i++) {
        particlesRef.current.push({
          x: Math.random() * width,
          y: height,
          vx: (Math.random() - 0.5) * 2,
          vy: -Math.random() * 3 - 1,
          life: 1,
          size: Math.random() * 4 + 2,
        });
      }
    }

    // Update and draw particles
    ctx.shadowBlur = 8;
    ctx.shadowColor = color;
    
    particlesRef.current = particlesRef.current.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.02; // gravity
      p.life -= 0.015;

      if (p.life <= 0) return false;

      ctx.globalAlpha = p.life * 0.8;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();

      return true;
    });

    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  };

  const handleStyleChange = (newStyle: VisualizerStyle) => {
    setStyle(newStyle);
    visualizerService.setStyle(newStyle);
  };

  const styles: { id: VisualizerStyle; icon: typeof Activity; label: string }[] = [
    { id: "waveform", icon: Waves, label: "Волна" },
    { id: "spectrum", icon: Activity, label: "Спектр" },
    { id: "circular", icon: Circle, label: "Круг" },
  ];

  return (
    <div className={className} style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="rounded-2xl"
        style={{
          background: "color-mix(in srgb, var(--surface-elevated) 50%, transparent)",
          backdropFilter: "blur(8px)",
        }}
      />
      {/* Style selector - compact pills */}
      <div 
        className="flex gap-1 p-1 rounded-xl"
        style={{ background: 'var(--surface-elevated)' }}
      >
        {styles.map((s) => {
          const isActive = style === s.id && visualizerStyle !== 'particles';
          return (
            <button
              key={s.id}
              onClick={() => handleStyleChange(s.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: isActive ? 'var(--interactive-accent)' : 'transparent',
                color: isActive ? 'var(--surface-canvas)' : 'var(--text-secondary)',
              }}
              title={s.label}
            >
              <s.icon size={14} />
              <span>{s.label}</span>
            </button>
          );
        })}
        {/* Particles button */}
        <button
          onClick={() => usePlayerSettingsStore.getState().setVisualizerStyle('particles')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
          style={{
            background: visualizerStyle === 'particles' ? 'var(--interactive-accent)' : 'transparent',
            color: visualizerStyle === 'particles' ? 'var(--surface-canvas)' : 'var(--text-secondary)',
          }}
          title="Частицы"
        >
          <Sparkles size={14} />
          <span>Частицы</span>
        </button>
      </div>
    </div>
  );
}
