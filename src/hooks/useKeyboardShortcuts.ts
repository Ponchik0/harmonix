import { useEffect } from "react";
import { audioService } from "../services/AudioService";
import { usePlayerStore } from "../stores/playerStore";
import { storageService } from "../services/StorageService";
import { soundCloudService } from "../services/SoundCloudService";
import { useUserStore } from "../stores/userStore";
import { keyboardShortcutsService } from "../services/KeyboardShortcutsService";

export function useKeyboardShortcuts() {
  useEffect(() => {
    const executeAction = async (action: string) => {
      switch (action) {
        case "toggle":
          audioService.toggle();
          break;
        case "next":
          usePlayerStore.getState().nextTrack();
          break;
        case "prev":
          usePlayerStore.getState().previousTrack();
          break;
        case "seekForward":
          const progress = usePlayerStore.getState().progress;
          audioService.seek(Math.min(1, progress + 0.05));
          break;
        case "seekBackward":
          const currentProgress = usePlayerStore.getState().progress;
          audioService.seek(Math.max(0, currentProgress - 0.05));
          break;
        case "volumeUp":
          const currentVolume = usePlayerStore.getState().volume;
          audioService.setVolume(Math.min(1, currentVolume + 0.1));
          break;
        case "volumeDown":
          const vol = usePlayerStore.getState().volume;
          audioService.setVolume(Math.max(0, vol - 0.1));
          break;
        case "mute":
          const v = usePlayerStore.getState().volume;
          audioService.setVolume(v === 0 ? 0.7 : 0);
          break;
        case "shuffle":
          usePlayerStore.getState().toggleShuffle();
          break;
        case "repeat":
          usePlayerStore.getState().cycleRepeatMode();
          break;
        case "like":
          await handleLike();
          break;
        case "fullscreen":
          window.dispatchEvent(new CustomEvent("toggle-fullscreen-player"));
          break;
      }
    };

    const handleKeyDown = async (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const shortcuts = keyboardShortcutsService.getShortcuts();
      
      for (const shortcut of shortcuts) {
        if (keyboardShortcutsService.matchesEvent(shortcut, e)) {
          e.preventDefault();
          await executeAction(shortcut.action);
          return;
        }
      }
    };

    const handleMouseDown = async (e: MouseEvent) => {
      // Only handle side buttons (3 = back, 4 = forward)
      if (e.button !== 3 && e.button !== 4) return;
      
      // Ignore if in input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const shortcuts = keyboardShortcutsService.getShortcuts();
      
      for (const shortcut of shortcuts) {
        if (keyboardShortcutsService.matchesMouseEvent(shortcut, e.button)) {
          e.preventDefault();
          await executeAction(shortcut.action);
          return;
        }
      }
    };

    const handleLike = async () => {
      const currentTrack = usePlayerStore.getState().currentTrack;
      if (!currentTrack) return;
      
      try {
        await storageService.init();
        const likedTracks = await storageService.getLikedTracks();
        const isLiked = likedTracks.some(t => t.id === currentTrack.id);
        
        if (isLiked) {
          await storageService.removeLikedTrack(currentTrack.id);
        } else {
          let streamUrl = currentTrack.streamUrl || "";
          if (!streamUrl && currentTrack.id.startsWith("sc-")) {
            const url = await soundCloudService.getStreamUrl(currentTrack.id.replace("sc-", ""));
            streamUrl = url || "";
          }
          await storageService.addLikedTrack({ ...currentTrack, streamUrl });
          useUserStore.getState().incrementStat("likedTracks", 1);
        }
        
        window.dispatchEvent(new CustomEvent("track-like-changed", { detail: { trackId: currentTrack.id } }));
      } catch (err) {
        console.error("[Shortcut] Like error:", err);
      }
    };

    // Register global shortcuts (work even when app is not focused)
    const registerGlobalShortcuts = async () => {
      if (window.electronAPI?.shortcuts) {
        const shortcuts = keyboardShortcutsService.getShortcuts();
        // Only register shortcuts with Ctrl or Alt modifiers as global
        const globalShortcuts = shortcuts.filter(s => 
          s.key && (s.modifiers.ctrl || s.modifiers.alt)
        );
        await window.electronAPI.shortcuts.register(globalShortcuts);
        
        // Listen for global shortcut events
        window.electronAPI.shortcuts.onGlobalShortcut(executeAction);
      }
    };

    registerGlobalShortcuts();

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("mousedown", handleMouseDown);
    
    // Re-register when shortcuts change
    const handleShortcutsChange = () => registerGlobalShortcuts();
    window.addEventListener("shortcuts-changed", handleShortcutsChange);
    
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("shortcuts-changed", handleShortcutsChange);
      
      if (window.electronAPI?.shortcuts) {
        window.electronAPI.shortcuts.removeGlobalShortcutListener();
      }
    };
  }, []);
}
