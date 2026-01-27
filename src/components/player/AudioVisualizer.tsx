import { useEffect, useRef } from "react";
import { usePlayerStore } from "../../stores/playerStore";
import { useThemeStore } from "../../stores/themeStore";
import { usePlayerSettingsStore } from "../../stores/playerSettingsStore";
import { visualizerService } from "../../services/VisualizerService";

interface AudioVisualizerProps {
  height?: number;
  barCount?: number;
}

export function AudioVisualizer({
  height = 40,
  barCount = 24,
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const phaseRef = useRef(0);
  const isVisibleRef = useRef(true);
  const particlesRef = useRef<{ x: number; y: number; vx: number; vy: number; life: number; size: number }[]>([]);

  // Use selector to prevent re-renders from progress updates
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const { currentTheme } = useThemeStore();
  const { visualizerStyle, visualizerEnabled } = usePlayerSettingsStore();
  const color = currentTheme.colors.accent;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const canvasHeight = canvas.height;

    // Random seed for each bar to make animation more organic
    const barSeeds = Array.from({ length: barCount }, () => Math.random() * 10);

    // Pause when tab is not visible
    const handleVisibility = () => {
      isVisibleRef.current = !document.hidden;
    };
    document.addEventListener("visibilitychange", handleVisibility);

    // Draw bars style (default/fallback)
    const drawBars = () => {
      phaseRef.current += 0.12;
      const barWidth = width / barCount;

      // Try to get real audio data
      const frequencyData = visualizerService.getFrequencyData();
      const hasRealData = frequencyData.length > 0 && frequencyData.some(v => v > 0);

      for (let i = 0; i < barCount; i++) {
        let value: number;
        
        if (hasRealData) {
          // Use real audio data
          const step = Math.floor(frequencyData.length / barCount);
          value = frequencyData[i * step] / 255;
        } else {
          // Fallback to animated simulation
          const seed = barSeeds[i];
          const wave1 = Math.sin(phaseRef.current * 1.2 + i * 0.35 + seed) * 0.25;
          const wave2 = Math.sin(phaseRef.current * 0.8 + i * 0.5 + seed * 0.5) * 0.2;
          const wave3 = Math.sin(phaseRef.current * 1.5 + i * 0.25 + seed * 0.3) * 0.15;
          const wave4 = Math.sin(phaseRef.current * 0.5 + seed) * 0.1;
          value = 0.35 + wave1 + wave2 + wave3 + wave4;
        }

        const barHeight = Math.max(3, value * canvasHeight * 0.9);
        const x = i * barWidth;
        const y = canvasHeight - barHeight;

        const gradient = ctx.createLinearGradient(x, y, x, canvasHeight);
        gradient.addColorStop(0, color);
        gradient.addColorStop(0.5, `${color}90`);
        gradient.addColorStop(1, `${color}30`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x + 1.5, y, barWidth - 3, barHeight, 2);
        ctx.fill();
      }
    };

    // Draw wave style
    const drawWave = () => {
      phaseRef.current += 0.08;
      
      const timeDomainData = visualizerService.getTimeDomainData();
      const hasRealData = timeDomainData.length > 0 && timeDomainData.some(v => v !== 128);

      ctx.lineWidth = 2.5;
      ctx.strokeStyle = color;
      ctx.shadowBlur = 12;
      ctx.shadowColor = color;
      ctx.beginPath();

      const sliceWidth = width / (hasRealData ? timeDomainData.length : 100);
      let x = 0;

      if (hasRealData) {
        for (let i = 0; i < timeDomainData.length; i++) {
          const v = timeDomainData[i] / 128.0;
          const y = (v * canvasHeight) / 2;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          x += sliceWidth;
        }
      } else {
        // Animated fallback
        for (let i = 0; i < 100; i++) {
          const wave1 = Math.sin(phaseRef.current * 2 + i * 0.1) * 0.3;
          const wave2 = Math.sin(phaseRef.current * 1.5 + i * 0.15) * 0.2;
          const v = 1 + wave1 + wave2;
          const y = (v * canvasHeight) / 2;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          x += sliceWidth;
        }
      }

      ctx.lineTo(width, canvasHeight / 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    };

    // Draw circle style
    const drawCircle = () => {
      phaseRef.current += 0.05;
      
      const centerX = width / 2;
      const centerY = canvasHeight / 2;
      const radius = Math.min(width, canvasHeight) / 3;
      const circleBarCount = 32;

      const frequencyData = visualizerService.getFrequencyData();
      const hasRealData = frequencyData.length > 0 && frequencyData.some(v => v > 0);
      const step = Math.floor(frequencyData.length / circleBarCount);

      for (let i = 0; i < circleBarCount; i++) {
        let value: number;
        
        if (hasRealData) {
          value = frequencyData[i * step] / 255;
        } else {
          const seed = barSeeds[i % barSeeds.length];
          value = 0.3 + Math.sin(phaseRef.current * 1.5 + i * 0.2 + seed) * 0.25;
        }

        const barHeight = value * radius * 0.8;
        const angle = (i / circleBarCount) * Math.PI * 2 - Math.PI / 2;

        const x1 = centerX + Math.cos(angle) * (radius * 0.6);
        const y1 = centerY + Math.sin(angle) * (radius * 0.6);
        const x2 = centerX + Math.cos(angle) * (radius * 0.6 + barHeight);
        const y2 = centerY + Math.sin(angle) * (radius * 0.6 + barHeight);

        const opacity = 0.5 + value * 0.5;
        ctx.strokeStyle = color;
        ctx.globalAlpha = opacity;
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.shadowBlur = 8;
        ctx.shadowColor = color;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    };

    // Draw particles style
    const drawParticles = () => {
      const frequencyData = visualizerService.getFrequencyData();
      const hasRealData = frequencyData.length > 0 && frequencyData.some(v => v > 0);
      
      let energy = 0;
      if (hasRealData) {
        for (let i = 0; i < frequencyData.length; i++) {
          energy += frequencyData[i];
        }
        energy = energy / frequencyData.length / 255;
      } else {
        phaseRef.current += 0.1;
        energy = 0.4 + Math.sin(phaseRef.current) * 0.2;
      }

      // Spawn new particles based on energy
      if (energy > 0.2 && particlesRef.current.length < 60) {
        const count = Math.floor(energy * 4);
        for (let i = 0; i < count; i++) {
          particlesRef.current.push({
            x: Math.random() * width,
            y: canvasHeight + 5,
            vx: (Math.random() - 0.5) * 2,
            vy: -Math.random() * 2.5 - 1,
            life: 1,
            size: Math.random() * 3 + 1.5,
          });
        }
      }

      // Update and draw particles
      ctx.shadowBlur = 10;
      ctx.shadowColor = color;
      
      particlesRef.current = particlesRef.current.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.03;
        p.life -= 0.02;

        if (p.life <= 0) return false;

        ctx.globalAlpha = p.life * 0.9;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();

        return true;
      });

      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    };

    const draw = () => {
      if (!isPlaying || !isVisibleRef.current || !visualizerEnabled || visualizerStyle === 'none') {
        animationRef.current = 0;
        return;
      }

      ctx.clearRect(0, 0, width, canvasHeight);

      switch (visualizerStyle) {
        case 'wave':
          drawWave();
          break;
        case 'circle':
          drawCircle();
          break;
        case 'particles':
          drawParticles();
          break;
        case 'bars':
        default:
          drawBars();
          break;
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    // Start animation only when playing
    if (isPlaying && visualizerEnabled && visualizerStyle !== 'none') {
      draw();
    }

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, color, barCount, visualizerStyle, visualizerEnabled, height]);

  // Don't render if disabled
  if (!visualizerEnabled || visualizerStyle === 'none') {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      width={300}
      height={height}
      className="w-full transition-opacity duration-300"
      style={{ height, opacity: isPlaying ? 1 : 0.3 }}
    />
  );
}
