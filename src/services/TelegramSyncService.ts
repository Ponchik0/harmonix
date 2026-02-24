/**
 * Telegram Sync Service
 * 
 * Синхронизация аккаунтов Harmonix через Telegram Bot без сервера.
 * Бот хранит данные пользователей и позволяет:
 * - Регистрация/вход по Telegram
 * - Синхронизация монет, инвентаря, статистики
 * - Админ-панель через бота
 * 
 * ВАЖНО: Замените BOT_TOKEN на токен вашего бота
 */

// Конфигурация бота
const BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE'; // Получить у @BotFather
const API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

// Типы данных для синхронизации
export interface SyncUserData {
  odId: string;
  odUsername: string;
  displayName: string;
  avatar: string;
  coins: number;
  isAdmin: boolean;
  inventory: {
    banners: string[];
    frames: string[];
    titles: string[];
    backgrounds: string[];
  };
  equipped: {
    banner: string;
    frame: string;
    title: string;
    background: string;
    profileColor: string;
  };
  stats: {
    tracksPlayed: number;
    hoursListened: number;
    playlists: number;
  };
  lastSync: string;
}

export interface TelegramUser {
  odId: number;
  odUsername?: string;
  first_name: string;
}

class TelegramSyncService {
  private chatId: string | null = null;
  private isConnected: boolean = false;

  constructor() {
    // Загружаем сохранённый chat_id
    this.chatId = localStorage.getItem('harmonix-telegram-chat-id');
    this.isConnected = !!this.chatId;
  }

  // Проверка подключения
  isLinked(): boolean {
    return this.isConnected && !!this.chatId;
  }

  getChatId(): string | null {
    return this.chatId;
  }

  // Генерация кода привязки (6 символов)
  generateLinkCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // Сохранить привязку
  linkAccount(chatId: string) {
    this.chatId = chatId;
    this.isConnected = true;
    localStorage.setItem('harmonix-telegram-chat-id', chatId);
  }

  // Отвязать аккаунт
  unlinkAccount() {
    this.chatId = null;
    this.isConnected = false;
    localStorage.removeItem('harmonix-telegram-chat-id');
  }

  // Отправить данные для синхронизации в бота
  async syncToTelegram(userData: SyncUserData): Promise<boolean> {
    if (!this.chatId) return false;

    try {
      // Формируем сообщение с данными (JSON в base64)
      const dataStr = JSON.stringify(userData);
      const base64Data = btoa(unescape(encodeURIComponent(dataStr)));
      
      // Отправляем как скрытое сообщение (бот его обработает)
      const response = await fetch(`${API_URL}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: this.chatId,
          text: `🔄 SYNC_DATA:${base64Data}`,
          disable_notification: true,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('[TelegramSync] Error syncing:', error);
      return false;
    }
  }

  // Запросить данные из бота
  async requestDataFromTelegram(): Promise<SyncUserData | null> {
    if (!this.chatId) return null;

    try {
      // Отправляем запрос на получение данных
      await fetch(`${API_URL}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: this.chatId,
          text: '📥 REQUEST_DATA',
          disable_notification: true,
        }),
      });

      // Данные придут через webhook бота
      // Приложение должно слушать ответ через другой механизм
      return null;
    } catch (error) {
      console.error('[TelegramSync] Error requesting data:', error);
      return null;
    }
  }

  // Отправить уведомление админу
  async notifyAdmin(adminChatId: string, message: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_URL}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: adminChatId,
          text: message,
          parse_mode: 'HTML',
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('[TelegramSync] Error notifying admin:', error);
      return false;
    }
  }
}

export const telegramSyncService = new TelegramSyncService();

/**
 * ============================================
 * ИНСТРУКЦИЯ ДЛЯ TELEGRAM БОТА (для разработчика бота)
 * ============================================
 * 
 * Бот должен обрабатывать следующие команды и сообщения:
 * 
 * 1. /start - Приветствие и инструкция
 * 2. /link <CODE> - Привязка аккаунта Harmonix по коду
 * 3. /unlink - Отвязка аккаунта
 * 4. /stats - Показать статистику пользователя
 * 5. /coins - Показать баланс монет
 * 6. /inventory - Показать инвентарь
 * 7. /admin - Админ-панель (только для админов)
 * 
 * АДМИН КОМАНДЫ:
 * /admin_give <user_id> <coins> - Выдать монеты
 * /admin_item <user_id> <item_id> - Выдать предмет
 * /admin_setadmin <user_id> - Сделать админом
 * /admin_ban <user_id> - Забанить
 * /admin_users - Список пользователей
 * 
 * ОБРАБОТКА SYNC_DATA:
 * Когда приходит сообщение "🔄 SYNC_DATA:<base64>":
 * 1. Декодировать base64 в JSON
 * 2. Сохранить данные пользователя в БД бота (можно использовать JSON файл)
 * 3. Ответить "✅ Данные синхронизированы"
 * 
 * ОБРАБОТКА REQUEST_DATA:
 * Когда приходит "📥 REQUEST_DATA":
 * 1. Найти данные пользователя по chat_id
 * 2. Отправить ответ: "📤 USER_DATA:<base64 JSON>"
 * 
 * ХРАНЕНИЕ ДАННЫХ:
 * Можно использовать простой JSON файл:
 * {
 *   "users": {
 *     "chat_id_123": {
 *       "odId": "user123",
 *       "coins": 1000,
 *       "isAdmin": false,
 *       "inventory": {...},
 *       ...
 *     }
 *   },
 *   "linkCodes": {
 *     "ABC123": { "odId": "user123", "expires": 1234567890 }
 *   }
 * }
 * 
 * ПРИМЕР КОДА БОТА (Python):
 * 
 * ```python
 * import telebot
 * import json
 * import base64
 * from datetime import datetime
 * 
 * bot = telebot.TeleBot("YOUR_BOT_TOKEN")
 * 
 * # Загрузка данных
 * def load_data():
 *     try:
 *         with open('harmonix_data.json', 'r') as f:
 *             return json.load(f)
 *     except:
 *         return {"users": {}, "linkCodes": {}}
 * 
 * def save_data(data):
 *     with open('harmonix_data.json', 'w') as f:
 *         json.dump(data, f, indent=2)
 * 
 * @bot.message_handler(commands=['start'])
 * def start(message):
 *     bot.reply_to(message, "🎵 Harmonix Bot\n\nИспользуйте /link <КОД> для привязки аккаунта")
 * 
 * @bot.message_handler(commands=['link'])
 * def link(message):
 *     args = message.text.split()
 *     if len(args) < 2:
 *         bot.reply_to(message, "Использование: /link <КОД>")
 *         return
 *     code = args[1].upper()
 *     data = load_data()
 *     if code in data['linkCodes']:
 *         user_id = data['linkCodes'][code]['odId']
 *         data['users'][str(message.chat.id)] = {"odId": user_id, "linked": True}
 *         del data['linkCodes'][code]
 *         save_data(data)
 *         bot.reply_to(message, f"✅ Аккаунт привязан!\nВаш chat_id: {message.chat.id}")
 *     else:
 *         bot.reply_to(message, "❌ Неверный код")
 * 
 * @bot.message_handler(func=lambda m: m.text and m.text.startswith("🔄 SYNC_DATA:"))
 * def sync_data(message):
 *     try:
 *         base64_data = message.text.replace("🔄 SYNC_DATA:", "")
 *         json_str = base64.b64decode(base64_data).decode('utf-8')
 *         user_data = json.loads(json_str)
 *         
 *         data = load_data()
 *         data['users'][str(message.chat.id)] = user_data
 *         save_data(data)
 *         
 *         bot.reply_to(message, "✅ Данные синхронизированы")
 *     except Exception as e:
 *         bot.reply_to(message, f"❌ Ошибка: {e}")
 * 
 * @bot.message_handler(commands=['stats'])
 * def stats(message):
 *     data = load_data()
 *     user = data['users'].get(str(message.chat.id))
 *     if user:
 *         bot.reply_to(message, f"📊 Статистика:\n"
 *             f"🎵 Треков: {user.get('stats', {}).get('tracksPlayed', 0)}\n"
 *             f"⏱ Часов: {user.get('stats', {}).get('hoursListened', 0):.1f}\n"
 *             f"💰 Монет: {user.get('coins', 0)}")
 *     else:
 *         bot.reply_to(message, "❌ Аккаунт не привязан")
 * 
 * @bot.message_handler(commands=['admin'])
 * def admin(message):
 *     data = load_data()
 *     user = data['users'].get(str(message.chat.id))
 *     if user and user.get('isAdmin'):
 *         bot.reply_to(message, "👑 Админ-панель:\n"
 *             "/admin_give <chat_id> <coins>\n"
 *             "/admin_item <chat_id> <item_id>\n"
 *             "/admin_users")
 *     else:
 *         bot.reply_to(message, "❌ Нет доступа")
 * 
 * bot.polling()
 * ```
 */
