import { useEffect, useRef, useState } from "react";
import { usePlayerSettingsStore } from "../../stores/playerSettingsStore";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
}

export function BackgroundParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const animationRef = useRef<number>();

  const {
    particlesEnabled,
    particleCount,
    particleSpeed,
    particleSize,
    particleShape,
    particleColor,
    particleOpacity,
    parallaxEnabled,
    parallaxStrength,
  } = usePlayerSettingsStore();

  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Initialize particles
  useEffect(() => {
    if (!particlesEnabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateDimensions = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setDimensions({ width, height });
      canvas.width = width;
      canvas.height = height;
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);

    // Create particles
    particlesRef.current = Array.from({ length: particleCount }, () => ({
      x: Math.random() * dimensions.width,
      y: Math.random() * dimensions.height,
      vx: (Math.random() - 0.5) * particleSpeed,
      vy: (Math.random() - 0.5) * particleSpeed,
      size: Math.random() * particleSize + 1,
    }));

    return () => {
      window.removeEventListener("resize", updateDimensions);
    };
  }, [particlesEnabled, particleCount, particleSpeed, particleSize, dimensions.width, dimensions.height]);

  // Mouse move handler for parallax
  useEffect(() => {
    if (!parallaxEnabled) return;

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [parallaxEnabled]);

  // Animation loop
  useEffect(() => {
    if (!particlesEnabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Set particle color and opacity
      const getColorFromVar = (colorValue: string) => {
        if (colorValue.startsWith('var(')) {
          // Get computed style for CSS variable
          const computedStyle = getComputedStyle(document.documentElement);
          const varName = colorValue.slice(4, -1); // Remove 'var(' and ')'
          return computedStyle.getPropertyValue(varName).trim();
        }
        return colorValue;
      };

      const hexToRgb = (hex: string) => {
        // Remove # if present
        hex = hex.replace('#', '');
        
        // Handle 3-digit hex
        if (hex.length === 3) {
          hex = hex.split('').map(char => char + char).join('');
        }
        
        const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result
          ? {
              r: parseInt(result[1], 16),
              g: parseInt(result[2], 16),
              b: parseInt(result[3], 16),
            }
          : { r: 139, g: 92, b: 246 };
      };

      const actualColor = getColorFromVar(particleColor);
      const rgb = hexToRgb(actualColor);
      ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${particleOpacity / 100})`;

      particlesRef.current.forEach((particle) => {
        // Update position
        particle.x += particle.vx * particleSpeed;
        particle.y += particle.vy * particleSpeed;

        // Parallax effect
        if (parallaxEnabled) {
          const dx = (mouseRef.current.x - canvas.width / 2) / canvas.width;
          const dy = (mouseRef.current.y - canvas.height / 2) / canvas.height;
          particle.x += dx * parallaxStrength * 0.1;
          particle.y += dy * parallaxStrength * 0.1;
        }

        // Wrap around screen
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;

        // Draw particle based on shape
        ctx.save();
        ctx.translate(particle.x, particle.y);

        switch (particleShape) {
          case "circle":
            ctx.beginPath();
            ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
            ctx.fill();
            break;

          case "square":
            ctx.fillRect(-particle.size, -particle.size, particle.size * 2, particle.size * 2);
            break;

          case "star":
            drawStar(ctx, 0, 0, 5, particle.size * 2, particle.size);
            ctx.fill();
            break;

          case "note":
            ctx.font = `${particle.size * 3}px Arial`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("♪", 0, 0);
            break;
        }

        ctx.restore();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [
    particlesEnabled,
    particleSpeed,
    particleShape,
    particleColor,
    particleOpacity,
    parallaxEnabled,
    parallaxStrength,
  ]);

  // Helper function to draw star
  const drawStar = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    spikes: number,
    outerRadius: number,
    innerRadius: number
  ) => {
    let rot = (Math.PI / 2) * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);

    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }

    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
  };

  // Render if particles are enabled
  const shouldRender = particlesEnabled;

  if (!shouldRender) return null;

  return (
    <>
      {/* Particles Canvas - separate layer */}
      {particlesEnabled && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            zIndex: 5,
            overflow: "hidden",
          }}
        >
          <canvas
            ref={canvasRef}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
            }}
          />
        </div>
      )}
    </>
  );
}
