import { useState, useRef, useEffect } from 'react';
import { HiOutlineXMark, HiOutlineCheck } from 'react-icons/hi2';

interface BannerEditorProps {
  image: string;
  onSave: (editedImage: string, displayMode: 'cover' | 'fill') => void;
  onCancel: () => void;
}

export function BannerEditor({ image, onSave, onCancel }: BannerEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [displayMode, setDisplayMode] = useState<'cover' | 'fill'>('cover');
  const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const BANNER_WIDTH = 800;
  const BANNER_HEIGHT = 320; // 2.5:1 aspect ratio

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImageObj(img);
      // Center image initially
      if (displayMode === 'cover') {
        const scaleX = BANNER_WIDTH / img.width;
        const scaleY = BANNER_HEIGHT / img.height;
        const newScale = Math.max(scaleX, scaleY);
        setScale(newScale);
        
        // Center the image
        const drawWidth = img.width * newScale;
        const drawHeight = img.height * newScale;
        setPosition({ 
          x: (BANNER_WIDTH - drawWidth) / 2, 
          y: (BANNER_HEIGHT - drawHeight) / 2 
        });
      } else if (displayMode === 'fill') {
        setScale(1);
        setPosition({ x: 0, y: 0 });
      }
    };
    img.src = image;
  }, [image, displayMode]);

  useEffect(() => {
    if (!imageObj || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, BANNER_WIDTH, BANNER_HEIGHT);

    // Calculate dimensions based on display mode
    let drawWidth = imageObj.width * scale;
    let drawHeight = imageObj.height * scale;
    
    if (displayMode === 'fill') {
      drawWidth = BANNER_WIDTH;
      drawHeight = BANNER_HEIGHT;
      ctx.drawImage(imageObj, 0, 0, drawWidth, drawHeight);
    } else {
      // In cover mode, position is absolute (not centered)
      ctx.drawImage(imageObj, position.x, position.y, drawWidth, drawHeight);
    }
  }, [imageObj, scale, position, displayMode]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (displayMode === 'fill') return;
    setIsDragging(true);
    setIsTransitioning(false);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    
    // Add cursor style to body
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || displayMode === 'fill' || !imageObj) return;
    
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
    // Calculate image dimensions
    const drawWidth = imageObj.width * scale;
    const drawHeight = imageObj.height * scale;
    
    // Calculate boundaries to prevent image from going outside banner
    const minX = Math.min(0, BANNER_WIDTH - drawWidth);
    const maxX = Math.max(0, BANNER_WIDTH - drawWidth);
    const minY = Math.min(0, BANNER_HEIGHT - drawHeight);
    const maxY = Math.max(0, BANNER_HEIGHT - drawHeight);
    
    // Clamp position within boundaries
    const clampedX = Math.max(minX, Math.min(maxX, newX));
    const clampedY = Math.max(minY, Math.min(maxY, newY));
    
    setPosition({
      x: clampedX,
      y: clampedY,
    });
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      setIsTransitioning(true);
      
      // Remove cursor style from body
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      
      // Remove transition after animation
      setTimeout(() => setIsTransitioning(false), 200);
    }
  };

  // Add global mouse up listener
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        handleMouseUp();
      }
    };
    
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging]);

  const handleSave = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.95);
    onSave(dataUrl, displayMode);
  };

  const handleScaleChange = (newScale: number) => {
    if (displayMode === 'fill' || !imageObj) return;
    
    setIsTransitioning(true);
    const clampedScale = Math.max(0.1, Math.min(5, newScale));
    setScale(clampedScale);
    
    // Recalculate position to keep image within bounds
    const drawWidth = imageObj.width * clampedScale;
    const drawHeight = imageObj.height * clampedScale;
    
    const minX = Math.min(0, BANNER_WIDTH - drawWidth);
    const maxX = Math.max(0, BANNER_WIDTH - drawWidth);
    const minY = Math.min(0, BANNER_HEIGHT - drawHeight);
    const maxY = Math.max(0, BANNER_HEIGHT - drawHeight);
    
    setPosition({
      x: Math.max(minX, Math.min(maxX, position.x)),
      y: Math.max(minY, Math.min(maxY, position.y)),
    });
    
    // Remove transition after animation
    setTimeout(() => setIsTransitioning(false), 100);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.9)' }}>
      <div className="w-full max-w-4xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold" style={{ color: '#fff' }}>Настройка баннера</h2>
          <button
            onClick={onCancel}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:bg-white/10"
            style={{ color: 'rgba(255,255,255,0.6)' }}
          >
            <HiOutlineXMark className="w-5 h-5" />
          </button>
        </div>

        {/* Canvas */}
        <div 
          ref={containerRef}
          className="relative rounded-xl overflow-hidden shadow-2xl" 
          style={{ 
            background: '#000',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          }}
        >
          <canvas
            ref={canvasRef}
            width={BANNER_WIDTH}
            height={BANNER_HEIGHT}
            className="w-full select-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ 
              cursor: displayMode === 'fill' ? 'default' : isDragging ? 'grabbing' : 'grab',
              transition: isTransitioning ? 'opacity 0.2s ease' : 'none',
            }}
          />
        </div>

        {/* Display Mode Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Режим отображения
          </label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: 'cover', label: 'Заполнить', desc: 'Обрезает края, заполняет баннер' },
              { value: 'fill', label: 'Растянуть', desc: 'Растягивает на весь баннер' },
            ].map((mode) => (
              <button
                key={mode.value}
                onClick={() => setDisplayMode(mode.value as any)}
                className="flex flex-col items-start gap-1 p-3 rounded-lg text-sm font-medium transition-all hover:scale-105"
                style={{ 
                  background: displayMode === mode.value 
                    ? 'rgba(139, 92, 246, 0.2)' 
                    : 'rgba(255,255,255,0.05)',
                  border: displayMode === mode.value 
                    ? '2px solid #8B5CF6' 
                    : '1px solid rgba(255,255,255,0.1)',
                  color: displayMode === mode.value 
                    ? '#8B5CF6' 
                    : 'rgba(255,255,255,0.7)'
                }}
              >
                <span className="font-bold">{mode.label}</span>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>{mode.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Scale Control */}
        {displayMode !== 'fill' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>
                Масштаб
              </label>
              <span className="text-sm font-mono" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {Math.round(scale * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.1"
              max="3"
              step="0.01"
              value={scale}
              onChange={(e) => handleScaleChange(parseFloat(e.target.value))}
              className="w-full"
              style={{
                accentColor: '#8B5CF6',
              }}
            />
          </div>
        )}

        {/* Instructions */}
        <div className="p-3 rounded-lg" style={{ background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>
            {displayMode === 'fill' 
              ? '💡 Изображение растянуто на весь баннер'
              : '💡 Перетаскивайте изображение мышью и используйте ползунок для масштабирования'
            }
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl text-sm font-medium transition-all hover:opacity-80"
            style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)' }}
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3 rounded-xl text-sm font-medium transition-all hover:opacity-90 flex items-center justify-center gap-2"
            style={{ background: '#8B5CF6', color: '#fff' }}
          >
            <HiOutlineCheck className="w-5 h-5" />
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}
