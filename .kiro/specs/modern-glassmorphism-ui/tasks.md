# Implementation Plan: Модернизация UI в стиле Glassmorphism

## Обзор

Данный план описывает пошаговую реализацию модернизации UI музыкального приложения Harmonix с использованием современного стиля glassmorphism. Реализация будет выполняться инкрементально, с регулярными проверками функциональности через тесты.

## Задачи

- [x] 1. Обновить систему токенов и создать базовые CSS файлы
  - Расширить `src/styles/tokens.css` новыми glass, fluid и animation токенами
  - Создать `src/styles/glass.css` с базовыми glass эффектами
  - Создать `src/styles/animations.css` с fluid анимациями
  - Создать `src/styles/fluid.css` с fluid дизайн стилями
  - _Requirements: 9.1, 9.4, 9.5_

- [ ] 2. Создать базовые glass компоненты
  - [x] 2.1 Создать GlassCard компонент
    - Реализовать компонент с backdrop-filter blur и градиентами
    - Добавить поддержку intensity levels (subtle, medium, strong)
    - Реализовать hover эффекты с увеличением blur
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  
  - [ ]* 2.2 Написать property тесты для GlassCard
    - **Property 1: Glass Blur Minimum Values**
    - **Property 3: Multi-Stop Gradients**
    - **Property 5: Background Opacity Range**
    - **Validates: Requirements 1.1, 1.2, 1.5**
  
  - [-] 2.3 Создать GlassPanel компонент
    - Реализовать компонент для больших секций
    - Добавить поддержку динамического blur и opacity
    - Реализовать опциональный анимированный градиент
    - _Requirements: 1.1, 1.2_
  
  - [ ]* 2.4 Написать unit тесты для GlassPanel
    - Тест рендеринга children
    - Тест динамического изменения blur
    - Тест fallback для неподдерживаемых браузеров
    - _Requirements: 1.1, 1.2_

- [ ] 3. Создать GlassButton и GlassModal компоненты
  - [ ] 3.1 Создать GlassButton компонент
    - Реализовать варианты: primary, secondary, ghost
    - Добавить размеры: sm, md, lg
    - Реализовать glow эффект для primary варианта
    - Добавить scale анимацию при нажатии
    - _Requirements: 2.3, 2.4, 5.2_
  
  - [ ]* 3.2 Написать property тесты для GlassButton
    - **Property 6: Interactive Element Glow Effect**
    - **Property 7: Pulsing Animation Duration**
    - **Property 12: Scale Transform Range**
    - **Validates: Requirements 2.3, 2.4, 5.2**
  
  - [ ] 3.3 Создать GlassModal компонент
    - Реализовать backdrop с blur 20px
    - Добавить scale + fade анимации открытия/закрытия
    - Реализовать keyboard navigation (ESC для закрытия)
    - Добавить светящуюся границу
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_
  
  - [ ]* 3.4 Написать property тесты для GlassModal
    - **Property 19: Modal Animation Properties**
    - **Property 20: Modal Backdrop Blur**
    - **Property 21: Modal Border Glow**
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5**

- [ ] 4. Checkpoint - Убедиться, что все тесты проходят
  - Убедиться, что все тесты проходят, спросить пользователя, если возникнут вопросы.


- [ ] 5. Создать hooks для glass эффектов и анимаций
  - [ ] 5.1 Создать useGlassEffect hook
    - Реализовать адаптацию blur и opacity к фону
    - Добавить поддержку performance режимов
    - Реализовать логику для nested glass элементов
    - Добавить проверку поддержки backdrop-filter
    - _Requirements: 11.1, 11.2, 11.5, 10.4_
  
  - [ ]* 5.2 Написать property тесты для useGlassEffect
    - **Property 32: Adaptive Opacity on Light Background**
    - **Property 33: Adaptive Border on Dark Background**
    - **Property 34: Nested Glass Blur Reduction**
    - **Property 31: Performance Mode Blur Reduction**
    - **Validates: Requirements 11.1, 11.2, 11.5, 10.4**
  
  - [ ] 5.3 Создать useFluidAnimation hook
    - Реализовать предустановленные анимации (morphing, floating, pulsing, shimmer, liquidFlow)
    - Добавить методы play, pause, reset
    - Реализовать проверку конфликтов анимаций
    - Добавить поддержку prefers-reduced-motion
    - _Requirements: 3.1, 3.5, 12.3_
  
  - [ ]* 5.4 Написать unit тесты для useFluidAnimation
    - Тест применения анимаций
    - Тест методов управления (play, pause, reset)
    - Тест respect для prefers-reduced-motion
    - _Requirements: 3.1, 3.5, 12.3_

- [ ] 6. Модернизировать PlayerBar с glass эффектами
  - [ ] 6.1 Обновить PlayerBarGlass компонент
    - Увеличить blur до 40px (60px при hover)
    - Добавить многослойный градиент из 3+ точек
    - Реализовать локальное усиление glass эффекта при hover на controls
    - Добавить glass эффект для progress bar трека
    - Реализовать пульсирующее свечение для play/pause кнопки
    - Добавить glass рамку для обложки трека
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  
  - [ ]* 6.2 Написать property тесты для PlayerBar
    - **Property 1: Glass Blur Minimum Values**
    - **Property 2: Glass Blur Enhancement on Interaction**
    - **Property 22: Progress Bar Glass Opacity**
    - **Property 23: Playing State Glow**
    - **Property 24: Album Art Glass Frame**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**
  
  - [ ]* 6.3 Написать unit тесты для PlayerBar
    - Тест hover эффектов на controls
    - Тест pulsing анимации при воспроизведении
    - Тест glass рамки обложки
    - _Requirements: 6.2, 6.4, 6.5_

- [ ] 7. Улучшить AuroraBackground компонент
  - [ ] 7.1 Обновить AuroraBackground
    - Увеличить количество blob элементов до 4-5
    - Увеличить blur до 100px
    - Реализовать независимые анимации для каждого blob (15-25s)
    - Улучшить генерацию цветов из accent с большим разбросом
    - Добавить проверку prefers-reduced-motion
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  
  - [ ]* 7.2 Написать property тесты для AuroraBackground
    - **Property 14: Background Effect Animation Duration**
    - **Property 15: Aurora Blob Blur Minimum**
    - **Property 16: Aurora Blob Opacity Range**
    - **Property 17: Aurora Disabled State**
    - **Validates: Requirements 4.2, 4.3, 4.4, 4.5, 12.3**

- [ ] 8. Checkpoint - Убедиться, что все тесты проходят
  - Убедиться, что все тесты проходят, спросить пользователя, если возникнут вопросы.

- [ ] 9. Создать модернизированные карточки треков и плейлистов
  - [ ] 9.1 Создать TrackCard компонент с glass эффектами
    - Применить glass эффект с blur 24px (32px при hover)
    - Реализовать lift эффект (translateY -4px) при hover
    - Добавить staggered animation при загрузке
    - Реализовать glass overlay на изображении для читаемости
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  
  - [ ]* 9.2 Написать property тесты для TrackCard
    - **Property 25: Card Hover Effects**
    - **Property 26: Staggered Animation Delay**
    - **Property 27: Image Overlay Gradient**
    - **Validates: Requirements 7.2, 7.3, 7.4, 7.5**
  
  - [ ] 9.3 Создать PlaylistCard компонент
    - Использовать TrackCard как базу
    - Добавить glass badge для количества треков
    - Реализовать hover preview треков
    - Добавить более выраженное свечение
    - _Requirements: 7.1, 7.2, 7.3_
  
  - [ ]* 9.4 Написать unit тесты для карточек
    - Тест рендеринга TrackCard
    - Тест hover эффектов
    - Тест staggered animation
    - Тест PlaylistCard с badge
    - _Requirements: 7.1, 7.2, 7.4_

- [ ] 10. Добавить fluid анимации в CSS
  - [ ] 10.1 Создать CSS keyframes для fluid анимаций
    - Реализовать @keyframes morphing
    - Реализовать @keyframes liquidFlow
    - Реализовать @keyframes shimmer
    - Реализовать @keyframes floating
    - Реализовать @keyframes pulsing
    - _Requirements: 3.1, 3.5_
  
  - [ ]* 10.2 Написать property тесты для анимаций
    - **Property 10: Morphing Animation Duration**
    - **Property 13: Appearance Animation Combination**
    - **Validates: Requirements 3.1, 3.4**

- [ ] 11. Реализовать transitions и микроанимации
  - [ ] 11.1 Добавить transitions для всех интерактивных элементов
    - Реализовать hover transitions (150-250ms)
    - Добавить click scale animations (100ms)
    - Реализовать focus outline с анимированным свечением
    - Добавить page transition fade (200-300ms)
    - _Requirements: 5.1, 5.2, 5.4, 5.5_
  
  - [ ]* 11.2 Написать property тесты для transitions
    - **Property 9: Transition Duration Range**
    - **Property 18: Focus Outline Presence**
    - **Validates: Requirements 5.1, 5.2, 5.4, 5.5**

- [ ] 12. Checkpoint - Убедиться, что все тесты проходят
  - Убедиться, что все тесты проходят, спросить пользователя, если возникнут вопросы.

- [ ] 13. Добавить performance оптимизации
  - [ ] 13.1 Реализовать usePerformanceMonitor hook
    - Добавить измерение FPS
    - Реализовать автоматическую адаптацию performance режима
    - Добавить применение will-change для backdrop-filter элементов
    - _Requirements: 10.1, 10.3_
  
  - [ ]* 13.2 Написать property тесты для оптимизаций
    - **Property 30: Will-Change Optimization**
    - **Validates: Requirements 10.1**
  
  - [ ] 13.3 Добавить performance режимы в настройки
    - Реализовать переключатель performance режима
    - Добавить автоматическое уменьшение blur в low режиме
    - _Requirements: 10.4_
  
  - [ ]* 13.4 Написать unit тесты для performance
    - Тест FPS monitoring
    - Тест автоматической адаптации
    - Тест уменьшения blur в low режиме
    - _Requirements: 10.3, 10.4_

- [ ] 14. Реализовать accessibility улучшения
  - [ ] 14.1 Добавить проверку контраста
    - Реализовать функцию calculateContrastRatio
    - Добавить ensureAccessibleContrast для текста на glass
    - Реализовать автоматическую корректировку при низком контрасте
    - _Requirements: 12.1_
  
  - [ ]* 14.2 Написать property тесты для accessibility
    - **Property 35: Text Contrast Ratio**
    - **Property 36: High Contrast Mode Opacity**
    - **Property 37: Keyboard Focus Outline Thickness**
    - **Validates: Requirements 12.1, 12.2, 12.5**
  
  - [ ] 14.3 Добавить режим высокой контрастности
    - Реализовать переключатель high contrast режима
    - Увеличить opacity glass элементов до 0.95
    - Добавить более выраженные границы
    - _Requirements: 12.2_
  
  - [ ] 14.4 Улучшить keyboard navigation
    - Добавить высококонтрастный outline (минимум 2px)
    - Реализовать анимированное свечение при focus
    - Убедиться, что все интерактивные элементы доступны с клавиатуры
    - _Requirements: 12.5_
  
  - [ ]* 14.5 Написать accessibility тесты
    - Тест axe для violations
    - Тест контраста текста
    - Тест keyboard navigation
    - Тест focus outline
    - _Requirements: 12.1, 12.5_

- [ ] 15. Интегрировать glass компоненты в существующие views
  - [ ] 15.1 Обновить LibraryView с glass карточками
    - Заменить существующие карточки на TrackCard/PlaylistCard
    - Добавить staggered animation при загрузке
    - _Requirements: 7.1, 7.4_
  
  - [ ] 15.2 Обновить SearchView с glass эффектами
    - Применить glass эффект к search bar
    - Обновить результаты поиска с glass карточками
    - _Requirements: 1.1, 7.1_
  
  - [ ] 15.3 Обновить модальные окна
    - Заменить существующие модалы на GlassModal
    - Добавить backdrop blur
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_
  
  - [ ]* 15.4 Написать integration тесты
    - Тест LibraryView с glass карточками
    - Тест SearchView с glass эффектами
    - Тест модальных окон
    - _Requirements: 7.1, 8.1_

- [ ] 16. Checkpoint - Убедиться, что все тесты проходят
  - Убедиться, что все тесты проходят, спросить пользователя, если возникнут вопросы.

- [ ] 17. Добавить visual regression тесты
  - [ ]* 17.1 Настроить Playwright для screenshot testing
    - Установить Playwright
    - Настроить конфигурацию для screenshot comparison
  
  - [ ]* 17.2 Создать visual тесты для glass компонентов
    - Тест GlassCard default и hover состояний
    - Тест GlassButton всех вариантов
    - Тест GlassModal открытия/закрытия
    - Тест PlayerBar с glass эффектами
    - Тест TrackCard и PlaylistCard
  
  - [ ]* 17.3 Создать visual тесты для views
    - Тест LibraryView
    - Тест SearchView
    - Тест PlayerBar в разных состояниях

- [ ] 18. Финальная интеграция и полировка
  - [ ] 18.1 Проверить все компоненты на консистентность
    - Убедиться, что все glass эффекты используют токены
    - Проверить transitions и анимации
    - Убедиться в accessibility compliance
  
  - [ ] 18.2 Оптимизировать производительность
    - Проверить FPS на разных устройствах
    - Оптимизировать количество backdrop-filter элементов
    - Добавить lazy loading для тяжелых эффектов
  
  - [ ] 18.3 Обновить документацию
    - Документировать новые компоненты
    - Добавить примеры использования
    - Обновить style guide
  
  - [ ]* 18.4 Финальное тестирование
    - Запустить все unit тесты
    - Запустить все property тесты
    - Запустить visual regression тесты
    - Запустить accessibility тесты
    - Проверить performance на разных устройствах

- [ ] 19. Финальный checkpoint
  - Убедиться, что все тесты проходят, спросить пользователя, если возникнут вопросы.

## Примечания

- Задачи, отмеченные `*`, являются опциональными и могут быть пропущены для более быстрого MVP
- Каждая задача ссылается на конкретные требования для трассируемости
- Checkpoints обеспечивают инкрементальную валидацию
- Property тесты валидируют универсальные свойства корректности
- Unit тесты валидируют конкретные примеры и edge cases
- Visual regression тесты обеспечивают соответствие дизайну
