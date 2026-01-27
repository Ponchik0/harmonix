import { useState, useRef, useCallback, useEffect } from 'react';
import {
  HiOutlineXMark,
  HiOutlineCheck,
  HiOutlineMagnifyingGlassPlus,
  HiOutlineMagnifyingGlassMinus,
  HiOutlineArrowPath,
} from 'react-icons/hi2';

interface AvatarEditorProps {
  image: string;
  onSave: (croppedImage: string) => void;
  onCancel: () => void;
}

export function AvatarEditor({ image, onSave, onCancel }: AvatarEditorProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageRef.current = img;
    };
    img.src = image;
  }, [image]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  }, [isDragging, dragStart]);

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale(prev => Math.min(3, Math.max(0.5, prev + delta)));
  };

  const handleSave = () => {
    if (!canvasRef.current || !imageRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 256; // Output size
    canvas.width = size;
    canvas.height = size;

    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, size, size);

    const img = imageRef.current;
    const containerSize = 200; // Preview container size
    
    // Calculate scaled dimensions
    const imgAspect = img.width / img.height;
    let drawWidth, drawHeight;
    
    if (imgAspect > 1) {
      drawHeight = containerSize * scale;
      drawWidth = drawHeight * imgAspect;
    } else {
      drawWidth = containerSize * scale;
      drawHeight = drawWidth / imgAspect;
    }

    // Scale position from preview to output
    const scaleFactor = size / containerSize;
    const scaledX = position.x * scaleFactor;
    const scaledY = position.y * scaleFactor;
    
    // Center point
    const centerX = size / 2;
    const centerY = size / 2;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-centerX, -centerY);
    
    ctx.drawImage(
      img,
      centerX - (drawWidth * scaleFactor) / 2 + scaledX,
      centerY - (drawHeight * scaleFactor) / 2 + scaledY,
      drawWidth * scaleFactor,
      drawHeight * scaleFactor
    );
    ctx.restore();

    // Create circular mask
    ctx.globalCompositeOperation = 'destination-in';
    ctx.beginPath();
    ctx.arc(centerX, centerY, size / 2, 0, Math.PI * 2);
    ctx.fill();

    const croppedImage = canvas.toDataURL('image/png', 0.9);
    onSave(croppedImage);
  };

  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setRotation(0);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/90" />
      <div 
        className="relative w-full max-w-md rounded-2xl p-6"
        style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)' }}
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold mb-4 text-center" style={{ color: 'rgba(255,255,255,0.9)' }}>
          Редактировать аватар
        </h3>

        {/* Preview area */}
        <div 
          ref={containerRef}
          className="relative w-[200px] h-[200px] mx-auto rounded-full overflow-hidden cursor-move select-none"
          style={{ 
            background: 'rgba(255,255,255,0.05)',
            border: '2px dashed rgba(255,255,255,0.2)',
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          <div 
            className="absolute inset-0 flex items-center justify-center"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
              transition: isDragging ? 'none' : 'transform 0.1s ease-out',
            }}
          >
            <img 
              src={image} 
              alt="" 
              className="max-w-none pointer-events-none"
              style={{ 
                width: 'auto',
                height: 'auto',
                maxWidth: '200px',
                maxHeight: '200px',
              }}
              draggable={false}
            />
          </div>
          
          {/* Grid overlay */}
          <div className="absolute inset-0 pointer-events-none" style={{
            background: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
            opacity: isDragging ? 1 : 0,
            transition: 'opacity 0.2s',
          }} />
        </div>

        {/* Controls */}
        <div className="mt-6 space-y-4">
          {/* Zoom slider */}
          <div className="flex items-center gap-3">
            <HiOutlineMagnifyingGlassMinus className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.5)' }} />
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.1"
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
              style={{ 
                background: `linear-gradient(to right, rgba(255,255,255,0.4) ${((scale - 0.5) / 2.5) * 100}%, rgba(255,255,255,0.1) ${((scale - 0.5) / 2.5) * 100}%)`,
              }}
            />
            <HiOutlineMagnifyingGlassPlus className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.5)' }} />
          </div>

          {/* Rotation slider */}
          <div className="flex items-center gap-3">
            <HiOutlineArrowPath className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.5)' }} />
            <input
              type="range"
              min="-180"
              max="180"
              step="1"
              value={rotation}
              onChange={(e) => setRotation(parseInt(e.target.value))}
              className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
              style={{ 
                background: `linear-gradient(to right, rgba(255,255,255,0.1) ${((rotation + 180) / 360) * 100}%, rgba(255,255,255,0.4) ${((rotation + 180) / 360) * 100}%, rgba(255,255,255,0.1) ${((rotation + 180) / 360) * 100}%)`,
              }}
            />
            <span className="text-xs w-10 text-right" style={{ color: 'rgba(255,255,255,0.5)' }}>{rotation}°</span>
          </div>

          {/* Quick actions */}
          <div className="flex justify-center gap-2">
            <button
              onClick={handleReset}
              className="px-4 py-2 rounded-lg text-xs font-medium transition-all"
              style={{ background: 'var(--surface-elevated)', color: 'var(--text-secondary)' }}
            >
              Сбросить
            </button>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all"
            style={{ background: 'var(--surface-elevated)', color: 'var(--text-secondary)' }}
          >
            <HiOutlineXMark className="w-4 h-4" />
            Отмена
          </button>
          <button
            onClick={handleSave}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all hover:opacity-90"
            style={{ background: 'rgba(34, 197, 94, 0.2)', color: '#22c55e' }}
          >
            <HiOutlineCheck className="w-4 h-4" />
            Сохранить
          </button>
        </div>

        {/* Hidden canvas for export */}
        <canvas ref={canvasRef} className="hidden" />

        <p className="text-[10px] text-center mt-4" style={{ color: 'rgba(255,255,255,0.3)' }}>
          Перетаскивай для позиции • Колёсико мыши для зума
        </p>
      </div>

      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        }
        input[type="range"]::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        }
      `}</style>
    </div>
  );
}
