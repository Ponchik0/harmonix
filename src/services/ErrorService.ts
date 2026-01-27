import { storageService } from "./StorageService";

export type ErrorCategory = "network" | "api" | "playback" | "storage" | "ui";

interface ErrorLog {
  id: string;
  category: ErrorCategory;
  message: string;
  details?: string;
  timestamp: number;
  resolved: boolean;
}

interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
};

type ErrorListener = (error: ErrorLog) => void;

class ErrorService {
  private listeners: ErrorListener[] = [];
  private isOnline: boolean = navigator.onLine;

  constructor() {
    // Monitor network status
    window.addEventListener("online", () => {
      this.isOnline = true;
      this.notifyListeners({
        id: `network-${Date.now()}`,
        category: "network",
        message: "Connection restored",
        timestamp: Date.now(),
        resolved: true,
      });
    });

    window.addEventListener("offline", () => {
      this.isOnline = false;
      this.notifyListeners({
        id: `network-${Date.now()}`,
        category: "network",
        message: "Connection lost - switching to offline mode",
        timestamp: Date.now(),
        resolved: false,
      });
    });
  }

  isNetworkOnline(): boolean {
    return this.isOnline;
  }

  subscribe(listener: ErrorListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners(error: ErrorLog): void {
    this.listeners.forEach((listener) => listener(error));
  }

  async handleError(
    category: ErrorCategory,
    error: Error | string,
    details?: string
  ): Promise<void> {
    const errorLog: ErrorLog = {
      id: `${category}-${Date.now()}`,
      category,
      message: typeof error === "string" ? error : error.message,
      details: details || (error instanceof Error ? error.stack : undefined),
      timestamp: Date.now(),
      resolved: false,
    };

    // Log to storage
    await this.logError(errorLog);

    // Notify listeners
    this.notifyListeners(errorLog);

    // Console log for debugging
    console.error(`[${category.toUpperCase()}]`, errorLog.message, details);
  }

  async logError(error: ErrorLog): Promise<void> {
    try {
      await storageService.init();
      const errors =
        (await storageService.getPreference<ErrorLog[]>("errorLogs")) || [];
      errors.unshift(error);
      // Keep last 100 errors
      await storageService.savePreference("errorLogs", errors.slice(0, 100));
    } catch (e) {
      console.error("Failed to log error:", e);
    }
  }

  async getErrorLogs(): Promise<ErrorLog[]> {
    await storageService.init();
    return (await storageService.getPreference<ErrorLog[]>("errorLogs")) || [];
  }

  async clearErrorLogs(): Promise<void> {
    await storageService.savePreference("errorLogs", []);
  }

  async withRetry<T>(
    operation: () => Promise<T>,
    category: ErrorCategory,
    config: Partial<RetryConfig> = {}
  ): Promise<T> {
    const { maxAttempts, baseDelay, maxDelay, backoffMultiplier } = {
      ...DEFAULT_RETRY_CONFIG,
      ...config,
    };

    let lastError: Error | null = null;
    let delay = baseDelay;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt === maxAttempts) {
          await this.handleError(
            category,
            lastError,
            `Failed after ${maxAttempts} attempts`
          );
          throw lastError;
        }

        // Wait before retry
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay = Math.min(delay * backoffMultiplier, maxDelay);
      }
    }

    throw lastError;
  }

  getUserFriendlyMessage(
    category: ErrorCategory,
    originalMessage: string
  ): string {
    const messages: Record<ErrorCategory, Record<string, string>> = {
      network: {
        default: "Unable to connect. Please check your internet connection.",
        timeout: "The request timed out. Please try again.",
        offline: "You are currently offline. Some features may be unavailable.",
      },
      api: {
        default: "Something went wrong. Please try again later.",
        "401": "Your session has expired. Please log in again.",
        "403": "You don't have permission to access this content.",
        "404": "The requested content was not found.",
        "429": "Too many requests. Please wait a moment and try again.",
        "500": "Server error. Please try again later.",
      },
      playback: {
        default: "Unable to play this track. Skipping to next.",
        not_found: "This track is no longer available.",
        geo_blocked: "This track is not available in your region.",
      },
      storage: {
        default: "Storage error. Some data may not be saved.",
        quota: "Storage is full. Please free up some space.",
      },
      ui: {
        default: "Something went wrong. Please refresh the page.",
      },
    };

    const categoryMessages = messages[category];

    // Check for specific error codes in message
    for (const [key, msg] of Object.entries(categoryMessages)) {
      if (originalMessage.includes(key)) {
        return msg;
      }
    }

    return categoryMessages.default;
  }
}

export const errorService = new ErrorService();
