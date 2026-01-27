# Design Document: Auth Redesign

## Overview

Редизайн системы аутентификации и регистрации для музыкального приложения Harmonix с фокусом на создание уникального, запоминающегося и эмоционально привлекательного пользовательского опыта. Дизайн использует современные UI/UX тренды (glassmorphism, fluid animations, micro-interactions) в сочетании с музыкальной тематикой для создания целостного визуального языка.

**Ключевые принципы дизайна:**
- **Музыкальность**: Визуальные элементы отражают природу музыки (волны, ритм, частицы)
- **Плавность**: Все переходы и анимации создают ощущение непрерывного потока
- **Прозрачность**: Glassmorphism эффекты создают глубину и современность
- **Отзывчивость**: Мгновенная визуальная обратная связь на каждое действие
- **Персонализация**: Пользователь создаёт свой профиль с первых секунд

## Architecture

### Component Hierarchy

```
AuthPage (Main Container)
├── AnimatedBackground (Background Layer)
│   ├── ParticleSystem (Canvas/CSS)
│   ├── WaveAnimation (SVG/CSS)
│   └── GradientOrbs (CSS)
│
├── WelcomeScreen (Entry Point)
│   ├── AnimatedLogo
│   ├── WelcomeText
│   └── ActionButtons
│       ├── LoginButton
│       ├── RegisterButton
│       └── GuestButton
│
├── LoginForm (Authentication)
│   ├── FormCard (Glassmorphism Container)
│   ├── BackButton
│   ├── FormHeader
│   ├── InputFields[]
│   │   ├── EmailInput
│   │   └── PasswordInput
│   ├── SocialLoginSection (Optional)
│   │   ├── Divider
│   │   └── SocialButtons[]
│   └── SubmitButton
│
├── RegistrationForm (Multi-Step)
│   ├── ProgressIndicator
│   │   ├── StepDots[]
│   │   └