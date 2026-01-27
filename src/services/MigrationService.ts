// Migration Service - очистка старых данных и миграция на Supabase

const KEYS_TO_CLEAR = [
  'harmonix-users',      // Старые аккаунты
  'harmonix-user',       // Текущий пользователь в zustand
  'harmonix-account',    // Возможные старые данные
];

class MigrationService {
  // Очистить все старые аккаунты
  clearOldAccounts(): void {
    console.log('[Migration] Очистка старых аккаунтов...');
    
    KEYS_TO_CLEAR.forEach(key => {
      const data = localStorage.getItem(key);
      if (data) {
        console.log(`[Migration] Удаляю: ${key}`);
        localStorage.removeItem(key);
      }
    });
    
    console.log('[Migration] Готово! Перезагрузите страницу.');
  }

  // Проверить есть ли старые данные
  hasOldData(): boolean {
    return KEYS_TO_CLEAR.some(key => localStorage.getItem(key) !== null);
  }

  // Полная очистка (для разработки)
  fullReset(): void {
    console.log('[Migration] Полный сброс...');
    
    // Очищаем всё что связано с harmonix
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes('harmonix')) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => {
      console.log(`[Migration] Удаляю: ${key}`);
      localStorage.removeItem(key);
    });
    
    console.log('[Migration] Полный сброс завершён!');
  }
}

export const migrationService = new MigrationService();

// Для удобства - можно вызвать из консоли браузера
if (typeof window !== 'undefined') {
  (window as any).harmonixMigration = {
    clearOldAccounts: () => migrationService.clearOldAccounts(),
    fullReset: () => migrationService.fullReset(),
    hasOldData: () => migrationService.hasOldData(),
  };
  
  console.log('[Harmonix] Для очистки старых данных введите в консоли:');
  console.log('  harmonixMigration.clearOldAccounts() - очистить аккаунты');
  console.log('  harmonixMigration.fullReset() - полный сброс');
}
