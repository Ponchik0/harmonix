// Keyboard Shortcuts Service - manages customizable hotkeys

export interface Shortcut {
  id: string;
  label: string;
  description: string;
  key: string;
  modifiers: { ctrl?: boolean; shift?: boolean; alt?: boolean };
  action: string;
  enabled?: boolean;
}

const DEFAULT_SHORTCUTS: Shortcut[] = [
  { id: "play-pause", label: "Воспроизведение/Пауза", description: "Запустить или остановить трек", key: "", modifiers: {}, action: "toggle", enabled: true },
  { id: "next-track", label: "Следующий трек", description: "Переключить на следующий", key: "", modifiers: {}, action: "next", enabled: true },
  { id: "prev-track", label: "Предыдущий трек", description: "Вернуться к предыдущему", key: "", modifiers: {}, action: "prev", enabled: true },
  { id: "seek-forward", label: "Перемотка вперёд", description: "+5 секунд", key: "", modifiers: {}, action: "seekForward", enabled: true },
  { id: "seek-backward", label: "Перемотка назад", description: "-5 секунд", key: "", modifiers: {}, action: "seekBackward", enabled: true },
  { id: "volume-up", label: "Громкость +", description: "Увеличить на 10%", key: "", modifiers: {}, action: "volumeUp", enabled: true },
  { id: "volume-down", label: "Громкость -", description: "Уменьшить на 10%", key: "", modifiers: {}, action: "volumeDown", enabled: true },
  { id: "mute", label: "Без звука", description: "Включить/выключить звук", key: "", modifiers: {}, action: "mute", enabled: true },
  { id: "shuffle", label: "Перемешать", description: "Случайный порядок", key: "", modifiers: {}, action: "shuffle", enabled: true },
  { id: "repeat", label: "Повтор", description: "Режим повтора", key: "", modifiers: {}, action: "repeat", enabled: true },
  { id: "like", label: "Нравится", description: "Добавить в избранное", key: "", modifiers: {}, action: "like", enabled: true },
  { id: "fullscreen", label: "Полный экран", description: "Открыть плеер на весь экран", key: "", modifiers: {}, action: "fullscreen", enabled: true },
];

const STORAGE_KEY = "harmonix-shortcuts";

class KeyboardShortcutsService {
  private shortcuts: Shortcut[] = [];

  constructor() {
    this.load();
  }

  private load() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        this.shortcuts = JSON.parse(saved);
      } else {
        this.shortcuts = [...DEFAULT_SHORTCUTS];
      }
    } catch {
      this.shortcuts = [...DEFAULT_SHORTCUTS];
    }
  }

  private save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.shortcuts));
  }

  getShortcuts(): Shortcut[] {
    return [...this.shortcuts];
  }

  getShortcut(id: string): Shortcut | undefined {
    return this.shortcuts.find(s => s.id === id);
  }

  updateShortcut(id: string, key: string, modifiers: Shortcut["modifiers"]) {
    const idx = this.shortcuts.findIndex(s => s.id === id);
    if (idx !== -1) {
      this.shortcuts[idx] = { ...this.shortcuts[idx], key, modifiers };
      this.save();
      // Notify about changes for global shortcuts re-registration
      window.dispatchEvent(new CustomEvent("shortcuts-changed"));
    }
  }

  toggleShortcut(id: string, enabled: boolean) {
    const idx = this.shortcuts.findIndex(s => s.id === id);
    if (idx !== -1) {
      this.shortcuts[idx] = { ...this.shortcuts[idx], enabled };
      this.save();
      window.dispatchEvent(new CustomEvent("shortcuts-changed"));
    }
  }

  resetToDefaults() {
    this.shortcuts = [...DEFAULT_SHORTCUTS];
    this.save();
    window.dispatchEvent(new CustomEvent("shortcuts-changed"));
  }

  formatShortcut(shortcut: Shortcut): string {
    if (!shortcut.key) return "Не назначено";
    
    const parts: string[] = [];
    if (shortcut.modifiers.ctrl) parts.push("Ctrl");
    if (shortcut.modifiers.shift) parts.push("Shift");
    if (shortcut.modifiers.alt) parts.push("Alt");
    
    let keyDisplay = shortcut.key;
    if (keyDisplay === "Space") keyDisplay = "Пробел";
    else if (keyDisplay === "ArrowUp") keyDisplay = "↑";
    else if (keyDisplay === "ArrowDown") keyDisplay = "↓";
    else if (keyDisplay === "ArrowLeft") keyDisplay = "←";
    else if (keyDisplay === "ArrowRight") keyDisplay = "→";
    else if (keyDisplay === "Mouse4") keyDisplay = "Кнопка мыши 4";
    else if (keyDisplay === "Mouse5") keyDisplay = "Кнопка мыши 5";
    else if (keyDisplay.startsWith("Key")) keyDisplay = keyDisplay.replace("Key", "");
    else if (keyDisplay.startsWith("Digit")) keyDisplay = keyDisplay.replace("Digit", "");
    
    parts.push(keyDisplay);
    return parts.join(" + ");
  }

  isValidShortcut(_key: string, _modifiers: Shortcut["modifiers"]): boolean {
    // Allow any key
    return true;
  }

  matchesEvent(shortcut: Shortcut, e: KeyboardEvent): boolean {
    if (!shortcut.key) return false; // No shortcut assigned
    
    const keyMatch = e.code === shortcut.key || e.key.toUpperCase() === shortcut.key;
    const ctrlMatch = !!shortcut.modifiers.ctrl === (e.ctrlKey || e.metaKey);
    const shiftMatch = !!shortcut.modifiers.shift === e.shiftKey;
    const altMatch = !!shortcut.modifiers.alt === e.altKey;
    return keyMatch && ctrlMatch && shiftMatch && altMatch;
  }

  matchesMouseEvent(shortcut: Shortcut, button: number): boolean {
    if (!shortcut.key) return false;
    // button 3 = Mouse4 (back), button 4 = Mouse5 (forward)
    if (button === 3 && shortcut.key === "Mouse4") return true;
    if (button === 4 && shortcut.key === "Mouse5") return true;
    return false;
  }
}

export const keyboardShortcutsService = new KeyboardShortcutsService();
