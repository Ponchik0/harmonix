import { useState } from 'react';
import {
  useAppearanceStore,
  AnimationSpeed,
  AnimationStyle,
  BlurIntensity,
  CornerRadius,
  Density,
  VisualizerType,
  GlowIntensity,
} from '../../stores/appearanceStore';
import { Toggle as WhiteToggle } from '../common/Toggle';

// Компонент переключателя
const Toggle = ({ 
  enabled, 
  onChange, 
  label, 
  description 
}: { 
  enabled: boolean; 
  onChange: (v: boolean) => void; 
  label: string; 
  description?: string;
}) => (
  <div className="flex items-center justify-between py-3">
    <div>
      <p className="text-sm font-medium text-white">{label}</p>
      {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
    </div>
    <WhiteToggle enabled={enabled} onChange={onChange} size="md" />
  </div>
);

// Компонент выбора из списка
const OptionSelector = <T extends string>({
  value,
  options,
  onChange,
  label,
  description,
}: {
  value: T;
  options: { value: T; label: string; icon?: string }[];
  onChange: (v: T) => void;
  label: string;
  description?: string;
}) => (
  <div className="py-3">
    <div className="mb-2">
      <p className="text-sm font-medium text-white">{label}</p>
      {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
    </div>
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className="px-3 py-2 rounded-lg text-xs font-medium transition-all"
          style={{
            background: value === opt.value 
              ? 'linear-gradient(135deg, #8B5CF6, #A78BFA)' 
              : 'rgba(255,255,255,0.05)',
            border: `1px solid ${value === opt.value ? '#8B5CF6' : 'rgba(255,255,255,0.1)'}`,
            color: value === opt.value ? '#fff' : 'rgba(255,255,255,0.6)',
          }}
        >
          {opt.icon && <span className="mr-1">{opt.icon}</span>}
          {opt.label}
        </button>
      ))}
    </div>
  </div>
);

// Компонент слайдера
const Slider = ({
  value,
  min,
  max,
  step = 1,
  onChange,
  label,
  description,
  formatValue,
}: {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  label: string;
  description?: string;
  formatValue?: (v: number) => string;
}) => (
  <div className="py-3">
    <div className="flex items-center justify-between mb-2">
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
      <span className="text-sm font-mono text-violet-400">
        {formatValue ? formatValue(value) : value}
      </span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full h-2 rounded-full appearance-none cursor-pointer"
      style={{
        background: `linear-gradient(to right, #8B5CF6 0%, #8B5CF6 ${((value - min) / (max - min)) * 100}%, rgba(255,255,255,0.1) ${((value - min) / (max - min)) * 100}%, rgba(255,255,255,0.1) 100%)`,
      }}
    />
  </div>
);

// Секция с заголовком
const Section = ({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) => (
  <div className="rounded-2xl overflow-hidden mb-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}>
    <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
      <span className="text-lg">{icon}</span>
      <span className="text-sm font-semibold text-white">{title}</span>
    </div>
    <div className="px-4 divide-y divide-white/5">
      {children}
    </div>
  </div>
);

export function AppearanceSettings() {
  const store = useAppearanceStore();
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-2xl p-4 border relative overflow-hidden" 
        style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.12), rgba(249,115,22,0.02))', borderColor: 'rgba(249,115,22,0.2)' }}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
            style={{ background: 'linear-gradient(135deg, #F97316, #FB923C)', boxShadow: '0 4px 16px rgba(249,115,22,0.3)' }}>
            🎨
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-white">Внешний вид</h2>
            <p className="text-gray-500 text-xs mt-0.5">Настройте интерфейс под себя</p>
          </div>
          <button
            onClick={() => store.resetToDefaults()}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}
          >
            Сбросить
          </button>
        </div>
      </div>

      {/* Анимации */}
      <Section title="Анимации" icon="✨">
        <Toggle
          enabled={!store.reduceMotion}
          onChange={(v) => store.setReduceMotion(!v)}
          label="Анимации"
          description="Включить анимации интерфейса"
        />
        
        {!store.reduceMotion && (
          <>
            <OptionSelector<AnimationSpeed>
              value={store.animationSpeed}
              onChange={store.setAnimationSpeed}
              label="Скорость анимаций"
              options={[
                { value: 'slow', label: 'Медленно', icon: '🐢' },
                { value: 'normal', label: 'Нормально', icon: '🚶' },
                { value: 'fast', label: 'Быстро', icon: '⚡' },
              ]}
            />
            
            <OptionSelector<AnimationStyle>
              value={store.animationStyle}
              onChange={store.setAnimationStyle}
              label="Стиль анимаций"
              options={[
                { value: 'minimal', label: 'Минимальный' },
                { value: 'smooth', label: 'Плавный' },
                { value: 'bouncy', label: 'Пружинистый' },
                { value: 'spring', label: 'Упругий' },
              ]}
            />

            <Slider
              value={store.transitionDuration}
              min={100}
              max={500}
              step={50}
              onChange={store.setTransitionDuration}
              label="Длительность переходов"
              formatValue={(v) => `${v}ms`}
            />
          </>
        )}
      </Section>

      {/* Эффекты */}
      <Section title="Эффекты" icon="💫">
        <Toggle
          enabled={store.glassmorphism}
          onChange={store.setGlassmorphism}
          label="Glassmorphism"
          description="Эффект матового стекла"
        />

        {store.glassmorphism && (
          <OptionSelector<BlurIntensity>
            value={store.blurIntensity}
            onChange={store.setBlurIntensity}
            label="Интенсивность размытия"
            options={[
              { value: 'none', label: 'Нет' },
              { value: 'light', label: 'Лёгкое' },
              { value: 'medium', label: 'Среднее' },
              { value: 'heavy', label: 'Сильное' },
            ]}
          />
        )}

        <Toggle
          enabled={store.glowEffects}
          onChange={store.setGlowEffects}
          label="Свечение"
          description="Эффекты свечения на элементах"
        />

        {store.glowEffects && (
          <OptionSelector<GlowIntensity>
            value={store.glowIntensity}
            onChange={store.setGlowIntensity}
            label="Интенсивность свечения"
            options={[
              { value: 'subtle', label: 'Слабое' },
              { value: 'medium', label: 'Среднее' },
              { value: 'strong', label: 'Сильное' },
            ]}
          />
        )}

        <Toggle
          enabled={store.shadows}
          onChange={store.setShadows}
          label="Тени"
          description="Тени под элементами"
        />

        <Toggle
          enabled={store.hoverEffects}
          onChange={store.setHoverEffects}
          label="Hover эффекты"
          description="Эффекты при наведении"
        />
      </Section>

      {/* Визуализатор */}
      <Section title="Визуализатор музыки" icon="📊">
        <Toggle
          enabled={store.visualizerEnabled}
          onChange={store.setVisualizerEnabled}
          label="Визуализатор"
          description="Анимация в такт музыке"
        />

        {store.visualizerEnabled && (
          <>
            <OptionSelector<VisualizerType>
              value={store.visualizerType}
              onChange={store.setVisualizerType}
              label="Тип визуализатора"
              options={[
                { value: 'bars', label: 'Столбцы', icon: '📊' },
                { value: 'wave', label: 'Волна', icon: '🌊' },
                { value: 'circle', label: 'Круг', icon: '⭕' },
                { value: 'particles', label: 'Частицы', icon: '✨' },
              ]}
            />

            <OptionSelector<'accent' | 'rainbow' | 'monochrome'>
              value={store.visualizerColor}
              onChange={store.setVisualizerColor}
              label="Цвет визуализатора"
              options={[
                { value: 'accent', label: 'Акцентный', icon: '🎨' },
                { value: 'rainbow', label: 'Радуга', icon: '🌈' },
                { value: 'monochrome', label: 'Монохром', icon: '⚪' },
              ]}
            />

            <Slider
              value={store.visualizerSensitivity}
              min={0.1}
              max={2.0}
              step={0.1}
              onChange={store.setVisualizerSensitivity}
              label="Чувствительность"
              formatValue={(v) => `${(v * 100).toFixed(0)}%`}
            />
          </>
        )}
      </Section>

      {/* Интерфейс */}
      <Section title="Интерфейс" icon="🖼️">
        <OptionSelector<CornerRadius>
          value={store.cornerRadius}
          onChange={store.setCornerRadius}
          label="Скругление углов"
          options={[
            { value: 'none', label: 'Нет' },
            { value: 'small', label: 'Малое' },
            { value: 'medium', label: 'Среднее' },
            { value: 'large', label: 'Большое' },
            { value: 'full', label: 'Полное' },
          ]}
        />

        <OptionSelector<Density>
          value={store.density}
          onChange={store.setDensity}
          label="Плотность интерфейса"
          description="Расстояние между элементами"
          options={[
            { value: 'compact', label: 'Компактно' },
            { value: 'comfortable', label: 'Комфортно' },
            { value: 'spacious', label: 'Просторно' },
          ]}
        />

        <Slider
          value={store.fontSize}
          min={12}
          max={18}
          step={1}
          onChange={store.setFontSize}
          label="Размер шрифта"
          formatValue={(v) => `${v}px`}
        />

        <Toggle
          enabled={store.smoothScrolling}
          onChange={store.setSmoothScrolling}
          label="Плавная прокрутка"
          description="Плавный скролл страниц"
        />
      </Section>

      {/* Превью */}
      <button
        onClick={() => setShowPreview(!showPreview)}
        className="w-full py-3 rounded-xl text-sm font-medium transition-all"
        style={{ 
          background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(139,92,246,0.1))',
          border: '1px solid rgba(139,92,246,0.3)',
          color: '#A78BFA'
        }}
      >
        {showPreview ? 'Скрыть превью' : 'Показать превью настроек'}
      </button>

      {showPreview && (
        <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="text-xs text-gray-500 mb-3">Превью ваших настроек:</p>
          
          {/* Пример карточки */}
          <div 
            className="p-4 transition-all"
            style={{ 
              background: store.glassmorphism ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
              backdropFilter: store.glassmorphism ? `blur(${store.blurIntensity === 'light' ? '8px' : store.blurIntensity === 'medium' ? '16px' : '24px'})` : 'none',
              borderRadius: store.cornerRadius === 'none' ? '0' : store.cornerRadius === 'small' ? '4px' : store.cornerRadius === 'medium' ? '12px' : store.cornerRadius === 'large' ? '20px' : '9999px',
              boxShadow: store.shadows ? '0 8px 32px rgba(0,0,0,0.3)' : 'none',
              border: '1px solid rgba(255,255,255,0.1)',
              transition: `all ${store.transitionDuration}ms ${store.animationStyle === 'bouncy' ? 'cubic-bezier(0.68, -0.55, 0.265, 1.55)' : 'ease-out'}`,
            }}
          >
            <div className="flex items-center gap-3">
              <div 
                className="w-12 h-12 flex items-center justify-center text-xl"
                style={{ 
                  background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
                  borderRadius: store.cornerRadius === 'full' ? '50%' : store.cornerRadius === 'large' ? '12px' : '8px',
                  boxShadow: store.glowEffects ? `0 0 ${store.glowIntensity === 'subtle' ? '10px' : store.glowIntensity === 'medium' ? '20px' : '30px'} rgba(139,92,246,0.5)` : 'none',
                }}
              >
                🎵
              </div>
              <div>
                <p className="font-medium text-white" style={{ fontSize: `${store.fontSize}px` }}>Пример трека</p>
                <p className="text-gray-400" style={{ fontSize: `${store.fontSize - 2}px` }}>Исполнитель</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        }
      `}</style>
    </div>
  );
}
