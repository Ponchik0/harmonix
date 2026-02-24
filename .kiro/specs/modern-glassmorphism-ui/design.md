# Дизайн: Модернизация UI в стиле Glassmorphism

## Обзор

Данный дизайн описывает модернизацию пользовательского интерфейса музыкального приложения Harmonix с использованием современного стиля glassmorphism (жидкое стекло). Основная цель - создать визуально привлекательный, современный UI с улучшенными glass эффектами, плавными анимациями и fluid дизайном, сохраняя черно-белую цветовую схему и высокую производительность.

### Ключевые принципы дизайна

1. **Layered Depth**: Многослойность через backdrop-filter blur и прозрачность
2. **Fluid Motion**: Органичные, плавные анимации и переходы
3. **Subtle Elegance**: Минималистичный дизайн с акцентом на детали
4. **Performance First**: Оптимизация для 60 FPS на современном оборудовании
5. **Accessibility**: Сохранение читаемости и поддержка accessibility стандартов

### Технологический стек

- **CSS**: backdrop-filter, CSS custom properties, CSS animations
- **React**: Компонентная архитектура, hooks для управления состоянием
- **Framer Motion**: Для сложных анимаций и transitions
- **TypeScript**: Типизация для компонентов и стилей

## Архитектура

### Структура системы стилей

```
src/
├── styles/
│   ├── tokens.css              # CSS переменные (обновленные)
│   ├── glass.css               # Glass эффекты (новый)
│   ├── animations.css          # Анимации (новый)
│   └── fluid.css               # Fluid дизайн (новый)
├── components/
│   ├── glass/                  # Glass компоненты (новый)
│   │   ├── GlassCard.tsx
│   │   ├── GlassPanel.tsx
│   │   ├── GlassModal.tsx
│   │   └── GlassButton.tsx
│   ├── player/
│   │   └── styles/
│   │       └── PlayerBarGlass.tsx  # Обновленный
│   └── background/
│       └── AuroraBackground.tsx    # Обновленный
└── hooks/
    ├── useGlassEffect.ts       # Hook для glass эффектов (новый)
    └── useFluidAnimation.ts    # Hook для fluid анимаций (новый)
```

### Система токенов (обновленная)

Расширяем существующую систему токенов в `tokens.css`:


```css
:root {
  /* Glass Effect Tokens */
  --glass-blur-subtle: 24px;
  --glass-blur-medium: 40px;
  --glass-blur-strong: 60px;
  --glass-blur-extreme: 80px;
  
  --glass-opacity-subtle: 0.05;
  --glass-opacity-medium: 0.12;
  --glass-opacity-strong: 0.18;
  
  --glass-border-opacity: 0.18;
  --glass-border-hover: 0.25;
  
  /* Gradient Tokens */
  --gradient-glass-start: rgba(255, 255, 255, 0.12);
  --gradient-glass-mid: rgba(255, 255, 255, 0.08);
  --gradient-glass-end: rgba(255, 255, 255, 0.04);
  
  /* Glow Tokens */
  --glow-subtle: 0 0 20px rgba(255, 255, 255, 0.1);
  --glow-medium: 0 0 30px rgba(255, 255, 255, 0.2);
  --glow-strong: 0 0 40px rgba(255, 255, 255, 0.3);
  
  /* Animation Tokens */
  --duration-instant: 100ms;
  --duration-fast: 200ms;
  --duration-normal: 300ms;
  --duration-slow: 500ms;
  --duration-fluid: 800ms;
  
  --easing-smooth: cubic-bezier(0.4, 0, 0.2, 1);
  --easing-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
  --easing-fluid: cubic-bezier(0.23, 1, 0.32, 1);
  
  /* Fluid Design Tokens */
  --fluid-radius-sm: 16px;
  --fluid-radius-md: 24px;
  --fluid-radius-lg: 32px;
  --fluid-radius-xl: 48px;
  
  /* Aurora Tokens */
  --aurora-blob-size-sm: 300px;
  --aurora-blob-size-md: 500px;
  --aurora-blob-size-lg: 700px;
  --aurora-blob-blur: 100px;
  --aurora-duration: 20s;
}
```

## Компоненты и Интерфейсы

### 1. Glass Effect System

#### GlassCard Component

Универсальный компонент карточки с glass эффектом.

**Interface:**
```typescript
interface GlassCardProps {
  children: React.ReactNode;
  intensity?: 'subtle' | 'medium' | 'strong';
  hover?: boolean;
  className?: string;
  onClick?: () => void;
}
```

**Стили:**
```css
.glass-card {
  background: linear-gradient(
    135deg,
    var(--gradient-glass-start) 0%,
    var(--gradient-glass-mid) 50%,
    var(--gradient-glass-end) 100%
  );
  backdrop-filter: blur(var(--glass-blur-medium)) saturate(180%);
  -webkit-backdrop-filter: blur(var(--glass-blur-medium)) saturate(180%);
  border: 1px solid rgba(255, 255, 255, var(--glass-border-opacity));
  border-radius: var(--fluid-radius-md);
  transition: all var(--duration-normal) var(--easing-smooth);
}

.glass-card:hover {
  backdrop-filter: blur(var(--glass-blur-strong)) saturate(200%);
  border-color: rgba(255, 255, 255, var(--glass-border-hover));
  transform: translateY(-4px);
  box-shadow: var(--glow-medium);
}
```


#### GlassPanel Component

Панель с glass эффектом для больших секций интерфейса.

**Interface:**
```typescript
interface GlassPanelProps {
  children: React.ReactNode;
  blur?: number;
  opacity?: number;
  gradient?: boolean;
  className?: string;
}
```

**Реализация:**
- Использует backdrop-filter для размытия фона
- Поддерживает динамическое изменение blur и opacity
- Опциональный анимированный градиент

#### GlassModal Component

Модальное окно с glass эффектом.

**Interface:**
```typescript
interface GlassModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  closeOnBackdrop?: boolean;
}
```

**Особенности:**
- Backdrop с blur 20px
- Scale + fade анимация при открытии/закрытии
- Светящаяся граница
- Поддержка keyboard navigation (ESC для закрытия)

#### GlassButton Component

Кнопка с glass эффектом и анимациями.

**Interface:**
```typescript
interface GlassButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  glow?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}
```

**Варианты:**
- **primary**: Белый фон, черный текст, пульсирующее свечение
- **secondary**: Glass эффект, белый текст
- **ghost**: Прозрачный, только border

### 2. Enhanced Player Bar

Модернизированный Player Bar с улучшенными glass эффектами.

**Ключевые улучшения:**

1. **Многослойный glass эффект**
   - Основной слой: blur 40px
   - Hover состояние: blur 60px
   - Градиент из 3 точек

2. **Улучшенный progress bar**
   - Glass эффект для трека (opacity 0.15)
   - Плавная анимация заполнения
   - Glow эффект на активной части

3. **Анимированная кнопка play/pause**
   - Пульсирующее свечение при воспроизведении
   - Scale анимация при нажатии
   - Smooth transition между состояниями

4. **Glass рамка для обложки**
   - Тонкая glass граница с blur 20px
   - Subtle glow эффект

**Псевдокод:**
```
function EnhancedPlayerBar():
  state = {
    isPlaying: boolean,
    isHovered: boolean,
    progress: number
  }
  
  glassEffect = {
    blur: isHovered ? 60px : 40px,
    gradient: [
      rgba(255,255,255,0.12),
      rgba(255,255,255,0.08),
      rgba(255,255,255,0.04)
    ],
    border: rgba(255,255,255,0.18)
  }
  
  playButtonGlow = isPlaying ? 
    "0 0 30px rgba(255,255,255,0.3)" : 
    "none"
  
  render:
    <GlassPanel blur={glassEffect.blur}>
      <ProgressBar glass={true} progress={progress} />
      <PlayButton glow={isPlaying} />
      <AlbumArt glassFrame={true} />
    </GlassPanel>
```


### 3. Enhanced Aurora Background

Улучшенный aurora эффект с более выраженными blob элементами.

**Улучшения:**

1. **Увеличенный blur**: 100px вместо 80px
2. **Больше blob элементов**: 4-5 вместо 3
3. **Независимые анимации**: Каждый blob с уникальной duration (15-25s)
4. **Динамические цвета**: Генерация из accent цвета с большим разбросом

**Псевдокод:**
```
function EnhancedAuroraBackground():
  accentColor = getAccentColor()
  blobColors = generateBlobColors(accentColor, count: 5)
  
  for each blob in blobColors:
    blob.size = random(300px, 700px)
    blob.blur = 100px
    blob.opacity = random(0.08, 0.15)
    blob.duration = random(15s, 25s)
    blob.path = generateRandomPath()
  
  if prefersReducedMotion:
    disableAnimations()
  
  render:
    <div className="aurora-container">
      {blobColors.map(blob => 
        <AnimatedBlob 
          color={blob.color}
          size={blob.size}
          blur={blob.blur}
          duration={blob.duration}
        />
      )}
    </div>
```

### 4. Fluid Animations System

Система для создания плавных, органичных анимаций.

**useFluidAnimation Hook:**

```typescript
interface FluidAnimationOptions {
  duration?: number;
  easing?: string;
  delay?: number;
  loop?: boolean;
}

function useFluidAnimation(
  element: RefObject<HTMLElement>,
  options: FluidAnimationOptions
): {
  play: () => void;
  pause: () => void;
  reset: () => void;
}
```

**Предустановленные анимации:**

1. **morphing**: Плавное изменение формы (border-radius)
2. **floating**: Легкое покачивание вверх-вниз
3. **pulsing**: Пульсация размера и opacity
4. **shimmer**: Эффект блеска/переливания
5. **liquidFlow**: Волнообразное движение

**CSS Animations:**
```css
@keyframes morphing {
  0%, 100% { border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%; }
  25% { border-radius: 58% 42% 75% 25% / 76% 46% 54% 24%; }
  50% { border-radius: 50% 50% 33% 67% / 55% 27% 73% 45%; }
  75% { border-radius: 33% 67% 58% 42% / 63% 68% 32% 37%; }
}

@keyframes liquidFlow {
  0% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -30px) scale(1.1); }
  66% { transform: translate(-20px, 20px) scale(0.9); }
  100% { transform: translate(0, 0) scale(1); }
}

@keyframes shimmer {
  0% { 
    background-position: -200% center;
    opacity: 0.5;
  }
  50% {
    opacity: 1;
  }
  100% { 
    background-position: 200% center;
    opacity: 0.5;
  }
}
```


### 5. Adaptive Glass System

Система адаптации glass эффектов к контексту.

**useGlassEffect Hook:**

```typescript
interface GlassEffectConfig {
  baseBlur: number;
  baseOpacity: number;
  adaptToBackground: boolean;
  performanceMode?: 'high' | 'balanced' | 'low';
}

function useGlassEffect(
  config: GlassEffectConfig
): {
  blur: number;
  opacity: number;
  borderOpacity: number;
  shouldRender: boolean;
}
```

**Логика адаптации:**

```
function adaptGlassEffect(element, background):
  backgroundLuminance = calculateLuminance(background)
  
  if backgroundLuminance > 0.7:  // Светлый фон
    opacity = baseOpacity * 1.5
    borderOpacity = 0.25
  else:  // Темный фон
    opacity = baseOpacity
    borderOpacity = 0.18
  
  if isNested(element):
    blur = baseBlur * 0.7  // Уменьшаем blur для вложенных элементов
  
  if performanceMode == 'low':
    blur = blur * 0.5
  
  return { blur, opacity, borderOpacity }
```

### 6. Enhanced Cards and Panels

Модернизированные карточки треков и плейлистов.

**TrackCard Component:**

**Особенности:**
- Glass эффект с blur 24px (32px при hover)
- Lift эффект: translateY(-4px) при hover
- Staggered animation при загрузке списка
- Glass overlay на изображении для читаемости текста

**Псевдокод:**
```
function TrackCard({ track, index }):
  isHovered = useState(false)
  
  glassEffect = {
    blur: isHovered ? 32px : 24px,
    opacity: 0.12,
    border: isHovered ? 0.25 : 0.18
  }
  
  animationDelay = index * 50ms
  
  render:
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: animationDelay }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <GlassCard 
        blur={glassEffect.blur}
        lift={isHovered}
      >
        <AlbumArt>
          <GlassOverlay gradient={true} />
        </AlbumArt>
        <TrackInfo />
      </GlassCard>
    </motion.div>
```

**PlaylistCard Component:**

Аналогично TrackCard, но с дополнительными элементами:
- Количество треков с glass badge
- Hover эффект с preview треков
- Более выраженное свечение


### 7. Enhanced Modals

Модернизированные модальные окна с glass эффектами.

**Структура:**

```
Modal Container
├── Backdrop (blur 20px)
└── Modal Content
    ├── Glass Panel (blur 40px)
    ├── Glowing Border
    └── Content
```

**Анимации:**

**Открытие:**
```css
@keyframes modalOpen {
  from {
    opacity: 0;
    transform: scale(0.95);
    filter: blur(10px);
  }
  to {
    opacity: 1;
    transform: scale(1);
    filter: blur(0);
  }
}
```

**Закрытие:**
```css
@keyframes modalClose {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.95);
  }
}
```

**Псевдокод:**
```
function GlassModal({ isOpen, onClose, children }):
  if not isOpen:
    return null
  
  backdropBlur = 20px
  contentBlur = 40px
  
  handleBackdropClick = (e):
    if e.target == backdrop:
      onClose()
  
  handleEscKey = (e):
    if e.key == 'Escape':
      onClose()
  
  useEffect:
    document.addEventListener('keydown', handleEscKey)
    return () => document.removeEventListener('keydown', handleEscKey)
  
  render:
    <AnimatePresence>
      <motion.div 
        className="modal-backdrop"
        style={{ backdropFilter: `blur(${backdropBlur})` }}
        onClick={handleBackdropClick}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="modal-content"
          initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0)' }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <GlassPanel blur={contentBlur}>
            {children}
          </GlassPanel>
        </motion.div>
      </motion.div>
    </AnimatePresence>
```

## Модели данных

### GlassEffectConfig

```typescript
interface GlassEffectConfig {
  blur: number;              // Значение blur в px
  opacity: number;           // Прозрачность фона (0-1)
  borderOpacity: number;     // Прозрачность границы (0-1)
  gradient: {
    start: string;           // rgba цвет начала градиента
    mid: string;             // rgba цвет середины градиента
    end: string;             // rgba цвет конца градиента
  };
  glow?: {
    enabled: boolean;
    color: string;
    intensity: number;       // 0-1
  };
}
```

### AnimationConfig

```typescript
interface AnimationConfig {
  duration: number;          // Длительность в ms
  easing: string;            // CSS easing function
  delay?: number;            // Задержка в ms
  loop?: boolean;            // Зацикливание
  direction?: 'normal' | 'reverse' | 'alternate';
}
```

### AuroraConfig

```typescript
interface AuroraConfig {
  enabled: boolean;
  blobCount: number;         // Количество blob элементов
  blobs: Array<{
    size: number;            // Размер в px
    color: string;           // rgba цвет
    blur: number;            // Blur в px
    opacity: number;         // 0-1
    duration: number;        // Длительность анимации в s
    path: string;            // CSS animation path
  }>;
  respectReducedMotion: boolean;
}
```

### ThemeGlassTokens

```typescript
interface ThemeGlassTokens {
  blur: {
    subtle: number;
    medium: number;
    strong: number;
    extreme: number;
  };
  opacity: {
    subtle: number;
    medium: number;
    strong: number;
  };
  border: {
    base: number;
    hover: number;
  };
  glow: {
    subtle: string;          // CSS box-shadow
    medium: string;
    strong: string;
  };
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Glass Blur Minimum Values

*For any* glass surface component (GlassCard, GlassPanel, GlassModal, PlayerBar), the computed backdrop-filter blur value should be at least 40px in default state.

**Validates: Requirements 1.1, 6.1, 7.1, 8.2**

### Property 2: Glass Blur Enhancement on Interaction

*For any* glass surface component in hover or focus state, the backdrop-filter blur value should increase to at least 60px with a smooth transition.

**Validates: Requirements 1.3, 6.2, 7.2**

### Property 3: Multi-Stop Gradients

*For any* glass surface component, the background gradient should contain at least 3 color stops.

**Validates: Requirements 1.2, 2.1, 6.1**

### Property 4: Border Opacity in Dark Theme

*For any* glass surface component in dark theme, the border color should have an opacity value of approximately 0.18 (±0.02).

**Validates: Requirements 1.4**

### Property 5: Background Opacity Range

*For any* glass surface component in dark theme, the background opacity should be within the range of 0.05 to 0.15.

**Validates: Requirements 1.5**

### Property 6: Interactive Element Glow Effect

*For any* interactive element in active state, the computed box-shadow should include a glow effect with opacity between 0.3 and 0.6.

**Validates: Requirements 2.3**

### Property 7: Pulsing Animation Duration

*For any* accent element (like play button) with pulsing glow animation, the animation-duration should be between 2 and 3 seconds.

**Validates: Requirements 2.4**

### Property 8: Cubic Bezier Easing

*For any* animated gradient, the animation-timing-function or transition-timing-function should use cubic-bezier easing.

**Validates: Requirements 2.5**

### Property 9: Transition Duration Range

*For any* element with state transitions (hover, focus, active), the transition-duration should be within appropriate ranges: 100-250ms for hover, 300-500ms for appearance animations, 200-300ms for page transitions.

**Validates: Requirements 5.1, 5.2, 5.3, 5.5**

### Property 10: Morphing Animation Duration

*For any* element with morphing animation on state change, the animation-duration should be between 400ms and 600ms.

**Validates: Requirements 3.1**

### Property 11: Minimum Border Radius

*For any* card or panel component, the border-radius should be at least 16px.

**Validates: Requirements 3.2**

### Property 12: Scale Transform Range

*For any* interactive element during user interaction, the transform scale value should be within the range of 0.95 to 1.05.

**Validates: Requirements 3.3, 5.2**

### Property 13: Appearance Animation Combination

*For any* element appearing on screen, the animation should include both opacity (fade-in) and translateY (slide-up) transforms with duration between 300ms and 500ms.

**Validates: Requirements 3.4**

### Property 14: Background Effect Animation Duration

*For any* background effect (aurora blobs), the animation-duration should be between 8 and 25 seconds.

**Validates: Requirements 3.5, 4.2**

### Property 15: Aurora Blob Blur Minimum

*For any* aurora blob element, the filter blur value should be at least 80px.

**Validates: Requirements 4.3**

### Property 16: Aurora Blob Opacity Range

*For any* aurora blob element in dark theme, the opacity should be between 0.08 and 0.15.

**Validates: Requirements 4.4**

### Property 17: Aurora Disabled State

*For any* application state where animations are disabled (prefers-reduced-motion or user settings), the aurora background component should not render animated blobs.

**Validates: Requirements 4.5, 12.3**

### Property 18: Focus Outline Presence

*For any* interactive element receiving keyboard focus, the computed outline should be present with animated glow effect.

**Validates: Requirements 5.4**

### Property 19: Modal Animation Properties

*For any* modal component, opening animation should include scale (0.95 → 1.0) and opacity (0 → 1) with 300ms duration, and closing animation should have 250ms duration.

**Validates: Requirements 8.3, 8.4**

### Property 20: Modal Backdrop Blur

*For any* open modal, the backdrop element should have backdrop-filter blur of 20px.

**Validates: Requirements 8.1**

### Property 21: Modal Border Glow

*For any* modal component, the border should have opacity of approximately 0.2 with glow effect.

**Validates: Requirements 8.5**

### Property 22: Progress Bar Glass Opacity

*For any* progress bar track in PlayerBar, the opacity should be between 0.15 and 0.2.

**Validates: Requirements 6.3**

### Property 23: Playing State Glow

*For any* play/pause button when track is playing, a pulsing glow animation should be present.

**Validates: Requirements 6.4**

### Property 24: Album Art Glass Frame

*For any* album artwork in PlayerBar, a glass frame with blur 20px should be applied.

**Validates: Requirements 6.5**

### Property 25: Card Hover Effects

*For any* track or playlist card in hover state, the blur should increase to 32px, border opacity to 0.25, and translateY to -4px.

**Validates: Requirements 7.2, 7.3**

### Property 26: Staggered Animation Delay

*For any* group of cards rendering together, each subsequent card should have an animation-delay increased by 50-100ms.

**Validates: Requirements 7.4**

### Property 27: Image Overlay Gradient

*For any* card containing an image, a glass overlay with gradient should be present to ensure text readability.

**Validates: Requirements 7.5**

### Property 28: CSS Token Definitions

*For any* initialized theme system, CSS custom properties for glass parameters (blur levels, opacity levels, gradient stops) should be defined in :root.

**Validates: Requirements 9.1, 9.4, 9.5**

### Property 29: Token Reactivity

*For any* theme change, CSS custom property values should update to match the new theme.

**Validates: Requirements 9.3**

### Property 30: Will-Change Optimization

*For any* element with backdrop-filter, the will-change property should be set for rendering optimization.

**Validates: Requirements 10.1**

### Property 31: Performance Mode Blur Reduction

*For any* glass element when low performance mode is enabled, blur values should be reduced by approximately 50%.

**Validates: Requirements 10.4**

### Property 32: Adaptive Opacity on Light Background

*For any* glass surface overlaying light content (luminance > 0.7), the background opacity should be increased by 50% from base value.

**Validates: Requirements 11.1**

### Property 33: Adaptive Border on Dark Background

*For any* glass surface overlaying dark content, the border opacity should be more pronounced for visibility.

**Validates: Requirements 11.2**

### Property 34: Nested Glass Blur Reduction

*For any* glass element nested within another glass element, the blur value should be reduced by approximately 30%.

**Validates: Requirements 11.5**

### Property 35: Text Contrast Ratio

*For any* text displayed on glass surface, the contrast ratio should be at least 4.5:1 for normal text.

**Validates: Requirements 12.1**

### Property 36: High Contrast Mode Opacity

*For any* glass element when high contrast mode is enabled, the background opacity should be increased to 0.95.

**Validates: Requirements 12.2**

### Property 37: Keyboard Focus Outline Thickness

*For any* element receiving keyboard focus, the outline thickness should be at least 2px.

**Validates: Requirements 12.5**


## Error Handling

### Browser Compatibility

**Проблема:** Не все браузеры поддерживают backdrop-filter.

**Решение:**
```typescript
function checkBackdropFilterSupport(): boolean {
  return CSS.supports('backdrop-filter', 'blur(10px)') || 
         CSS.supports('-webkit-backdrop-filter', 'blur(10px)');
}

function applyGlassEffect(element: HTMLElement, config: GlassEffectConfig) {
  if (!checkBackdropFilterSupport()) {
    // Fallback: использовать полупрозрачный фон без blur
    element.style.background = `rgba(0, 0, 0, ${config.opacity * 2})`;
    element.style.border = `1px solid rgba(255, 255, 255, ${config.borderOpacity})`;
    return;
  }
  
  // Применить полный glass эффект
  element.style.backdropFilter = `blur(${config.blur}px) saturate(180%)`;
  element.style.background = config.gradient.start;
  // ...
}
```

### Performance Degradation

**Проблема:** Множество backdrop-filter элементов могут снизить производительность.

**Решение:**
```typescript
function usePerformanceMonitor() {
  const [fps, setFps] = useState(60);
  const [performanceMode, setPerformanceMode] = useState<'high' | 'balanced' | 'low'>('high');
  
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    
    function measureFPS() {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime >= lastTime + 1000) {
        const currentFPS = Math.round((frameCount * 1000) / (currentTime - lastTime));
        setFps(currentFPS);
        
        // Автоматическая адаптация
        if (currentFPS < 30) {
          setPerformanceMode('low');
        } else if (currentFPS < 50) {
          setPerformanceMode('balanced');
        } else {
          setPerformanceMode('high');
        }
        
        frameCount = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(measureFPS);
    }
    
    const rafId = requestAnimationFrame(measureFPS);
    return () => cancelAnimationFrame(rafId);
  }, []);
  
  return { fps, performanceMode };
}
```

### Invalid Configuration

**Проблема:** Некорректные значения в конфигурации glass эффектов.

**Решение:**
```typescript
function validateGlassConfig(config: Partial<GlassEffectConfig>): GlassEffectConfig {
  const defaults: GlassEffectConfig = {
    blur: 40,
    opacity: 0.12,
    borderOpacity: 0.18,
    gradient: {
      start: 'rgba(255,255,255,0.12)',
      mid: 'rgba(255,255,255,0.08)',
      end: 'rgba(255,255,255,0.04)'
    }
  };
  
  return {
    blur: Math.max(0, Math.min(100, config.blur ?? defaults.blur)),
    opacity: Math.max(0, Math.min(1, config.opacity ?? defaults.opacity)),
    borderOpacity: Math.max(0, Math.min(1, config.borderOpacity ?? defaults.borderOpacity)),
    gradient: config.gradient ?? defaults.gradient
  };
}
```

### Animation Conflicts

**Проблема:** Конфликты между CSS и JavaScript анимациями.

**Решение:**
```typescript
function useFluidAnimation(
  ref: RefObject<HTMLElement>,
  options: FluidAnimationOptions
) {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    
    // Проверить существующие анимации
    const existingAnimations = element.getAnimations();
    
    // Отменить конфликтующие анимации
    existingAnimations.forEach(animation => {
      if (animation.id === options.id) {
        animation.cancel();
      }
    });
    
    // Применить новую анимацию
    const animation = element.animate(
      options.keyframes,
      {
        duration: options.duration,
        easing: options.easing,
        fill: 'forwards',
        id: options.id
      }
    );
    
    return () => animation.cancel();
  }, [ref, options]);
}
```

### Accessibility Violations

**Проблема:** Glass эффекты могут снижать контраст и читаемость.

**Решение:**
```typescript
function calculateContrastRatio(foreground: string, background: string): number {
  // Реализация WCAG contrast ratio calculation
  const getLuminance = (color: string) => {
    // Parse RGB and calculate relative luminance
    // ...
  };
  
  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);
  
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

function ensureAccessibleContrast(
  textColor: string,
  glassBackground: string,
  contentBehind: string
): string {
  // Вычислить эффективный цвет фона с учетом glass эффекта
  const effectiveBackground = blendColors(glassBackground, contentBehind);
  
  const contrast = calculateContrastRatio(textColor, effectiveBackground);
  
  if (contrast < 4.5) {
    // Увеличить opacity фона или изменить цвет текста
    return adjustForContrast(textColor, effectiveBackground);
  }
  
  return textColor;
}
```

### Memory Leaks

**Проблема:** Анимации и эффекты могут вызывать утечки памяти.

**Решение:**
```typescript
function useCleanupAnimations() {
  const animationsRef = useRef<Animation[]>([]);
  
  const registerAnimation = useCallback((animation: Animation) => {
    animationsRef.current.push(animation);
  }, []);
  
  useEffect(() => {
    return () => {
      // Cleanup all animations on unmount
      animationsRef.current.forEach(animation => {
        animation.cancel();
      });
      animationsRef.current = [];
    };
  }, []);
  
  return { registerAnimation };
}
```


## Testing Strategy

### Dual Testing Approach

Мы будем использовать комбинацию unit тестов и property-based тестов для обеспечения полного покрытия:

- **Unit тесты**: Проверка конкретных примеров, edge cases и интеграционных точек
- **Property тесты**: Проверка универсальных свойств на множестве сгенерированных входных данных

### Property-Based Testing

Для property-based тестирования будем использовать библиотеку **fast-check** (для TypeScript/JavaScript).

**Конфигурация:**
- Минимум 100 итераций на каждый property тест
- Каждый тест должен ссылаться на соответствующее свойство из дизайна
- Формат тега: `Feature: modern-glassmorphism-ui, Property {number}: {property_text}`

**Пример property теста:**

```typescript
import fc from 'fast-check';
import { render } from '@testing-library/react';
import { GlassCard } from './GlassCard';

describe('GlassCard Properties', () => {
  // Feature: modern-glassmorphism-ui, Property 1: Glass Blur Minimum Values
  it('should have backdrop-filter blur of at least 40px', () => {
    fc.assert(
      fc.property(
        fc.record({
          intensity: fc.constantFrom('subtle', 'medium', 'strong'),
          children: fc.string()
        }),
        (props) => {
          const { container } = render(
            <GlassCard intensity={props.intensity}>
              {props.children}
            </GlassCard>
          );
          
          const element = container.firstChild as HTMLElement;
          const style = window.getComputedStyle(element);
          const backdropFilter = style.backdropFilter || style.webkitBackdropFilter;
          
          // Extract blur value
          const blurMatch = backdropFilter.match(/blur\((\d+)px\)/);
          expect(blurMatch).toBeTruthy();
          
          const blurValue = parseInt(blurMatch![1], 10);
          expect(blurValue).toBeGreaterThanOrEqual(40);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  // Feature: modern-glassmorphism-ui, Property 3: Multi-Stop Gradients
  it('should have gradient with at least 3 color stops', () => {
    fc.assert(
      fc.property(
        fc.record({
          intensity: fc.constantFrom('subtle', 'medium', 'strong')
        }),
        (props) => {
          const { container } = render(<GlassCard intensity={props.intensity} />);
          
          const element = container.firstChild as HTMLElement;
          const style = window.getComputedStyle(element);
          const background = style.background || style.backgroundImage;
          
          // Count color stops in gradient
          const colorStops = background.match(/rgba?\([^)]+\)/g);
          expect(colorStops).toBeTruthy();
          expect(colorStops!.length).toBeGreaterThanOrEqual(3);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  // Feature: modern-glassmorphism-ui, Property 5: Background Opacity Range
  it('should have background opacity between 0.05 and 0.15 in dark theme', () => {
    fc.assert(
      fc.property(
        fc.record({
          intensity: fc.constantFrom('subtle', 'medium', 'strong')
        }),
        (props) => {
          const { container } = render(
            <div data-theme="dark">
              <GlassCard intensity={props.intensity} />
            </div>
          );
          
          const element = container.querySelector('.glass-card') as HTMLElement;
          const style = window.getComputedStyle(element);
          const background = style.background;
          
          // Extract opacity from rgba
          const opacityMatch = background.match(/rgba?\([^,]+,[^,]+,[^,]+,\s*([0-9.]+)\)/);
          if (opacityMatch) {
            const opacity = parseFloat(opacityMatch[1]);
            expect(opacity).toBeGreaterThanOrEqual(0.05);
            expect(opacity).toBeLessThanOrEqual(0.15);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Unit Testing

Unit тесты фокусируются на конкретных сценариях и edge cases:

**Примеры unit тестов:**

```typescript
describe('GlassCard Component', () => {
  it('should render children correctly', () => {
    const { getByText } = render(
      <GlassCard>Test Content</GlassCard>
    );
    expect(getByText('Test Content')).toBeInTheDocument();
  });
  
  it('should apply hover effects on mouse enter', async () => {
    const { container } = render(<GlassCard hover />);
    const element = container.firstChild as HTMLElement;
    
    fireEvent.mouseEnter(element);
    
    await waitFor(() => {
      const style = window.getComputedStyle(element);
      const backdropFilter = style.backdropFilter;
      expect(backdropFilter).toContain('blur(60px)');
    });
  });
  
  it('should handle click events', () => {
    const handleClick = jest.fn();
    const { container } = render(
      <GlassCard onClick={handleClick}>Click me</GlassCard>
    );
    
    fireEvent.click(container.firstChild!);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
  
  it('should fallback gracefully when backdrop-filter is not supported', () => {
    // Mock CSS.supports to return false
    const originalSupports = CSS.supports;
    CSS.supports = jest.fn(() => false);
    
    const { container } = render(<GlassCard />);
    const element = container.firstChild as HTMLElement;
    const style = window.getComputedStyle(element);
    
    // Should have fallback background
    expect(style.background).toContain('rgba');
    
    CSS.supports = originalSupports;
  });
});
```

### Integration Testing

Тестирование взаимодействия между компонентами:

```typescript
describe('PlayerBar with Glass Effects', () => {
  it('should enhance glass effect on hover over controls', async () => {
    const { getByRole } = render(<PlayerBar currentTrack={mockTrack} />);
    const playButton = getByRole('button', { name: /play/i });
    
    fireEvent.mouseEnter(playButton);
    
    await waitFor(() => {
      const playerBar = playButton.closest('.player-bar');
      const style = window.getComputedStyle(playerBar!);
      const backdropFilter = style.backdropFilter;
      
      // Should have enhanced blur
      expect(backdropFilter).toContain('blur(60px)');
    });
  });
  
  it('should show pulsing glow when playing', () => {
    const { container } = render(
      <PlayerBar currentTrack={mockTrack} isPlaying={true} />
    );
    
    const playButton = container.querySelector('.play-button');
    const style = window.getComputedStyle(playButton!);
    
    // Should have animation
    expect(style.animation).toContain('pulse');
  });
});
```

### Visual Regression Testing

Для проверки визуального соответствия дизайну используем **Playwright** с screenshot comparison:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Glass Effects Visual Tests', () => {
  test('GlassCard should match design', async ({ page }) => {
    await page.goto('/components/glass-card');
    
    const card = page.locator('.glass-card').first();
    await expect(card).toHaveScreenshot('glass-card-default.png');
  });
  
  test('GlassCard hover state should match design', async ({ page }) => {
    await page.goto('/components/glass-card');
    
    const card = page.locator('.glass-card').first();
    await card.hover();
    await expect(card).toHaveScreenshot('glass-card-hover.png');
  });
  
  test('PlayerBar with glass effects should match design', async ({ page }) => {
    await page.goto('/player');
    
    const playerBar = page.locator('.player-bar');
    await expect(playerBar).toHaveScreenshot('player-bar-glass.png');
  });
});
```

### Performance Testing

Тестирование производительности glass эффектов:

```typescript
describe('Glass Effects Performance', () => {
  it('should maintain 60 FPS with multiple glass elements', async () => {
    const { container } = render(
      <div>
        {Array.from({ length: 20 }).map((_, i) => (
          <GlassCard key={i}>Card {i}</GlassCard>
        ))}
      </div>
    );
    
    // Measure FPS
    let frameCount = 0;
    const startTime = performance.now();
    
    const measureFPS = () => {
      frameCount++;
      if (performance.now() - startTime < 1000) {
        requestAnimationFrame(measureFPS);
      }
    };
    
    requestAnimationFrame(measureFPS);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    expect(frameCount).toBeGreaterThanOrEqual(55); // Allow some margin
  });
  
  it('should reduce blur in low performance mode', () => {
    const { container } = render(
      <GlassCard />,
      { wrapper: ({ children }) => (
        <PerformanceContext.Provider value={{ mode: 'low' }}>
          {children}
        </PerformanceContext.Provider>
      )}
    );
    
    const element = container.firstChild as HTMLElement;
    const style = window.getComputedStyle(element);
    const backdropFilter = style.backdropFilter;
    
    const blurMatch = backdropFilter.match(/blur\((\d+)px\)/);
    const blurValue = parseInt(blurMatch![1], 10);
    
    // Should be reduced by 50%
    expect(blurValue).toBeLessThanOrEqual(20);
  });
});
```

### Accessibility Testing

Тестирование accessibility требований:

```typescript
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Glass Components Accessibility', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(<GlassCard>Content</GlassCard>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
  
  it('should have sufficient contrast ratio', () => {
    const { getByText } = render(
      <GlassCard>
        <p>Test Text</p>
      </GlassCard>
    );
    
    const text = getByText('Test Text');
    const textColor = window.getComputedStyle(text).color;
    const backgroundColor = window.getComputedStyle(text.parentElement!).backgroundColor;
    
    const contrast = calculateContrastRatio(textColor, backgroundColor);
    expect(contrast).toBeGreaterThanOrEqual(4.5);
  });
  
  it('should respect prefers-reduced-motion', () => {
    // Mock media query
    window.matchMedia = jest.fn().mockImplementation(query => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    }));
    
    const { container } = render(<AuroraBackground />);
    
    // Aurora should not render animated blobs
    const blobs = container.querySelectorAll('.fluid-blob');
    blobs.forEach(blob => {
      const style = window.getComputedStyle(blob);
      expect(style.animation).toBe('none');
    });
  });
  
  it('should have visible focus outline', () => {
    const { getByRole } = render(
      <GlassButton>Click me</GlassButton>
    );
    
    const button = getByRole('button');
    button.focus();
    
    const style = window.getComputedStyle(button);
    expect(style.outline).not.toBe('none');
    expect(style.outlineWidth).toMatch(/[2-9]px/); // At least 2px
  });
});
```

### Test Coverage Goals

- **Unit Tests**: 80%+ code coverage
- **Property Tests**: Все 37 correctness properties покрыты
- **Integration Tests**: Все основные user flows
- **Visual Regression**: Все ключевые компоненты и состояния
- **Accessibility**: 100% WCAG 2.1 Level AA compliance

