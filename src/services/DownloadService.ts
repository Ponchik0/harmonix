/**
 * Download Service
 * Скачивание треков
 */

import type { Track } from "../types";

class DownloadService {
  private downloading: Set<string> = new Set();
  private progress: Map<string, number> = new Map();

  isDownloading(trackId: string): boolean {
    return this.downloading.has(trackId);
  }

  getProgress(trackId: string): number {
    return this.progress.get(trackId) || 0;
  }

  async downloadTrack(track: Track): Promise<boolean> {
    if (!track.streamUrl) {
      this.showToast("Нет ссылки для скачивания", "error");
      return false;
    }

    if (this.downloading.has(track.id)) {
      this.showToast("Уже скачивается", "info");
      return false;
    }

    this.downloading.add(track.id);
    this.progress.set(track.id, 0);
    this.showToast(`Скачивание: ${track.title}`, "info");

    try {
      const response = await fetch(track.streamUrl);

      if (!response.ok) {
        throw new Error("Failed to fetch");
      }

      const contentLength = response.headers.get("content-length");
      const total = contentLength ? parseInt(contentLength) : 0;

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader");

      const chunks: BlobPart[] = [];
      let received = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        chunks.push(value);
        received += value.length;

        if (total > 0) {
          this.progress.set(track.id, (received / total) * 100);
        }
      }

      // Собираем blob
      const blob = new Blob(chunks, { type: "audio/mpeg" });

      // Создаём ссылку для скачивания
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = this.sanitizeFilename(
        `${track.artist} - ${track.title}.mp3`
      );
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      this.showToast(`Скачано: ${track.title}`, "success");
      return true;
    } catch (error) {
      console.error("[Download] Error:", error);
      this.showToast("Ошибка скачивания", "error");
      return false;
    } finally {
      this.downloading.delete(track.id);
      this.progress.delete(track.id);
    }
  }

  private sanitizeFilename(name: string): string {
    return name.replace(/[<>:"/\\|?*]/g, "_").substring(0, 200);
  }

  private showToast(message: string, type: "success" | "error" | "info") {
    window.dispatchEvent(
      new CustomEvent("show-toast", { detail: { message, type } })
    );
  }
}

export const downloadService = new DownloadService();
