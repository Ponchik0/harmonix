# Настройка Harmonix

## Быстрый старт

### 1. Установка зависимостей

```bash
npm install
```

### 2. Настройка переменных окружения

Скопируйте файл с примерами:

```bash
cp .env.example .env
```

Откройте `.env` и заполните необходимые значения:

```env
# Обязательные переменные
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_YOUTUBE_API_KEY=your_youtube_api_key

# Опциональные переменные
VITE_DISCORD_CLIENT_ID=your_discord_client_id
VITE_GENIUS_ACCESS_TOKEN=your_genius_token
VITE_HAPPI_API_KEY=demo
VITE_TELEGRAM_BOT_TOKEN=your_telegram_bot_token
```

### 3. Получение API ключей

#### Supabase (обязательно)

1. Создайте проект на [supabase.com](https://supabase.com)
2. Перейдите в Settings → API
3. Скопируйте:
   - Project URL → `VITE_SUPABASE_URL`
   - anon/public key → `VITE_SUPABASE_ANON_KEY`

⚠️ **Важно:** Используйте только anon key, НЕ service_role key!

#### YouTube Data API (обязательно)

1. Перейдите в [Google Cloud Console](https://console.cloud.google.com)
2. Создайте новый проект или выберите существующий
3. Включите YouTube Data API v3
4. Создайте API ключ в разделе Credentials
5. Настройте ограничения:
   - Application restrictions: HTTP referrers (или None для разработки)
   - API restrictions: Restrict key → YouTube Data API v3
6. Скопируйте ключ → `VITE_YOUTUBE_API_KEY`

#### Discord Rich Presence (опционально)

1. Перейдите на [Discord Developer Portal](https://discord.com/developers/applications)
2. Создайте новое приложение
3. Скопируйте Application ID → `VITE_DISCORD_CLIENT_ID`
4. В разделе Rich Presence загрузите иконки приложения

#### Genius Lyrics (опционально)

1. Зарегистрируйтесь на [genius.com](https://genius.com)
2. Перейдите в [API Clients](https://genius.com/api-clients)
3. Создайте новое приложение
4. Сгенерируйте Client Access Token
5. Скопируйте токен → `VITE_GENIUS_ACCESS_TOKEN`

#### Happi.dev (опционально)

1. Зарегистрируйтесь на [happi.dev](https://happi.dev)
2. Получите API ключ
3. Скопируйте ключ → `VITE_HAPPI_API_KEY`

По умолчанию используется демо-ключ с ограничениями.

#### Telegram Bot (опционально)

1. Напишите [@BotFather](https://t.me/BotFather) в Telegram
2. Создайте нового бота командой `/newbot`
3. Скопируйте токен → `VITE_TELEGRAM_BOT_TOKEN`

### 4. Запуск приложения

#### Режим разработки

```bash
npm run dev
```

#### Сборка для продакшена

```bash
# Windows
npm run build:win

# Только установщик
npm run build:installer
```

## Структура переменных окружения

### Обязательные

Эти переменные необходимы для базовой работы приложения:

- `VITE_SUPABASE_URL` - URL Supabase проекта
- `VITE_SUPABASE_ANON_KEY` - Публичный ключ Supabase
- `VITE_YOUTUBE_API_KEY` - Ключ YouTube Data API

### Опциональные

Эти переменные добавляют дополнительный функционал:

- `VITE_DISCORD_CLIENT_ID` - Discord Rich Presence
- `VITE_GENIUS_ACCESS_TOKEN` - Тексты песен через Genius
- `VITE_HAPPI_API_KEY` - Альтернативный источник текстов
- `VITE_TELEGRAM_BOT_TOKEN` - Синхронизация через Telegram
- `VITE_SOUNDCLOUD_CLIENT_ID` - Кастомный SoundCloud токен

## Безопасность

⚠️ **ВАЖНО:**

1. **НИКОГДА** не коммитьте файл `.env` в Git
2. Файл `.env` уже добавлен в `.gitignore`
3. Используйте разные ключи для dev и production
4. Регулярно обновляйте API ключи
5. Настройте ограничения для всех API ключей

Подробнее читайте в [SECURITY.md](./SECURITY.md)

## Проверка настройки

После настройки переменных окружения проверьте:

```bash
# Убедитесь что .env не отслеживается Git
git check-ignore .env
# Должно вывести: .env

# Запустите приложение
npm run dev
```

В консоли браузера не должно быть ошибок о недостающих API ключах.

## Troubleshooting

### Ошибка: "Supabase URL not configured"

Проверьте что `VITE_SUPABASE_URL` установлен в `.env` и начинается с `https://`

### Ошибка: "YouTube API quota exceeded"

1. Проверьте квоты в Google Cloud Console
2. Настройте ограничения по IP/домену
3. Рассмотрите создание нескольких ключей

### SoundCloud не работает

SoundCloud использует публичные токены, которые периодически обновляются. Приложение автоматически пытается получить свежий токен.

### Discord Rich Presence не подключается

1. Убедитесь что Discord запущен
2. Проверьте что `VITE_DISCORD_CLIENT_ID` правильный
3. Перезапустите приложение

## Дополнительная информация

- [SECURITY.md](./SECURITY.md) - Руководство по безопасности
- [SECURITY_AUDIT.md](./SECURITY_AUDIT.md) - Отчет по аудиту безопасности
- [package.json](./package.json) - Зависимости и скрипты

## Поддержка

Если у вас возникли проблемы с настройкой, создайте issue в репозитории.
