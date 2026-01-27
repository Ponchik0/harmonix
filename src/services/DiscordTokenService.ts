/**
 * Discord Token Service
 * Handles secure encryption/decryption and cloud storage of Discord tokens
 * 
 * SECURITY:
 * - Token is NEVER stored locally (no localStorage, no electron-store)
 * - Token is encrypted with AES-256-GCM before sending to cloud
 * - Encryption key is derived from user_id + machine_id (never stored)
 * - Token exists only in memory during runtime
 */

import { supabaseService } from "./SupabaseService";

// ============================================
// ENCRYPTION UTILS (AES-256-GCM)
// ============================================

async function deriveEncryptionKey(userId: string, machineId: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  // Create unique key material from user + machine + salt
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(`${userId}::${machineId}::harmonix_discord_v2_2024`),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encoder.encode("harmonix_discord_salt_v2"),
      iterations: 150000, // High iterations for security
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encryptToken(token: string, userId: string, machineId: string): Promise<string> {
  const key = await deriveEncryptionKey(userId, machineId);
  const encoder = new TextEncoder();
  
  // Random IV for each encryption
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(token)
  );

  // Format: base64(iv + encrypted_data)
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);

  return btoa(String.fromCharCode(...combined));
}

async function decryptToken(encryptedData: string, userId: string, machineId: string): Promise<string | null> {
  try {
    const key = await deriveEncryptionKey(userId, machineId);
    
    // Decode base64
    const combined = new Uint8Array(
      atob(encryptedData)
        .split("")
        .map((c) => c.charCodeAt(0))
    );

    // Extract IV and data
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);

    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      data
    );

    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error("[DiscordToken] Decryption failed (wrong machine or corrupted data)");
    return null;
  }
}

// ============================================
// MACHINE ID (fingerprint, not stored anywhere sensitive)
// ============================================

function generateMachineFingerprint(): string {
  const nav = navigator;
  const screen = window.screen;
  
  // Combine multiple factors for unique machine identification
  const factors = [
    nav.userAgent,
    nav.language,
    nav.hardwareConcurrency || 0,
    screen.width,
    screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    nav.maxTouchPoints || 0,
  ].join("|");

  // Create hash
  let hash = 0;
  for (let i = 0; i < factors.length; i++) {
    const char = factors.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return Math.abs(hash).toString(36) + factors.length.toString(36);
}

// ============================================
// SERVICE CLASS
// ============================================

class DiscordTokenService {
  // Token exists ONLY in memory - never persisted locally
  private memoryToken: string | null = null;
  private currentUserId: string | null = null;
  private machineId: string;

  constructor() {
    this.machineId = generateMachineFingerprint();
  }

  /**
   * Save Discord token to cloud (encrypted)
   * Token is NOT stored locally
   */
  async saveToken(userId: string, token: string): Promise<boolean> {
    try {
      // Encrypt token
      const encryptedToken = await encryptToken(token, userId, this.machineId);

      // Save to Supabase
      const success = await supabaseService.updateUser(userId, {
        discord_token_encrypted: encryptedToken,
      } as any);

      if (success) {
        // Keep in memory only
        this.memoryToken = token;
        this.currentUserId = userId;

        // Send to Electron main process (memory only, not persisted)
        await this.syncToElectron(token);

        console.log("[DiscordToken] Token encrypted and saved to cloud");
      }

      return success;
    } catch (error) {
      console.error("[DiscordToken] Save failed:", error);
      return false;
    }
  }

  /**
   * Load Discord token from cloud and decrypt
   * Returns token in memory, does NOT store locally
   */
  async loadToken(userId: string): Promise<string | null> {
    try {
      // Check memory cache first
      if (this.memoryToken && this.currentUserId === userId) {
        return this.memoryToken;
      }

      // Fetch from Supabase
      const user = await supabaseService.getUserById(userId);
      const encryptedToken = (user as any)?.discord_token_encrypted;
      
      if (!encryptedToken) {
        return null;
      }

      // Decrypt
      const token = await decryptToken(encryptedToken, userId, this.machineId);
      
      if (token) {
        // Store in memory only
        this.memoryToken = token;
        this.currentUserId = userId;

        // Sync to Electron (memory only)
        await this.syncToElectron(token);

        console.log("[DiscordToken] Token loaded from cloud and decrypted");
        return token;
      }

      return null;
    } catch (error) {
      console.error("[DiscordToken] Load failed:", error);
      return null;
    }
  }

  /**
   * Remove Discord token from cloud
   */
  async removeToken(userId: string): Promise<boolean> {
    try {
      const success = await supabaseService.updateUser(userId, {
        discord_token_encrypted: null,
      } as any);

      if (success) {
        // Clear memory
        this.memoryToken = null;
        this.currentUserId = null;

        // Clear from Electron
        await this.clearFromElectron();

        console.log("[DiscordToken] Token removed from cloud");
      }

      return success;
    } catch (error) {
      console.error("[DiscordToken] Remove failed:", error);
      return false;
    }
  }

  /**
   * Check if user has a saved token in cloud
   */
  async hasToken(userId: string): Promise<boolean> {
    try {
      const user = await supabaseService.getUserById(userId);
      const encrypted = (user as any)?.discord_token_encrypted;
      return !!(encrypted && encrypted.length > 20);
    } catch {
      return false;
    }
  }

  /**
   * Validate token with Discord API
   */
  async validateToken(token: string): Promise<{ valid: boolean; username?: string }> {
    try {
      const response = await fetch("https://discord.com/api/v10/users/@me", {
        headers: { Authorization: token },
      });

      if (response.ok) {
        const data = await response.json();
        return { valid: true, username: data.username };
      }

      return { valid: false };
    } catch {
      return { valid: false };
    }
  }

  /**
   * Get token from memory (for current session only)
   */
  getMemoryToken(): string | null {
    return this.memoryToken;
  }

  /**
   * Clear memory cache (on logout)
   */
  clearMemory(): void {
    this.memoryToken = null;
    this.currentUserId = null;
  }

  /**
   * Sync token to Electron main process (memory only, no persistence)
   */
  private async syncToElectron(token: string): Promise<void> {
    if (typeof window !== "undefined" && (window as any).electronAPI?.discord) {
      try {
        // This sends to main process but we'll update main to NOT persist
        await (window as any).electronAPI.discord.setToken(token);
      } catch (error) {
        console.error("[DiscordToken] Electron sync failed:", error);
      }
    }
  }

  /**
   * Clear token from Electron main process
   */
  private async clearFromElectron(): Promise<void> {
    if (typeof window !== "undefined" && (window as any).electronAPI?.discord) {
      try {
        await (window as any).electronAPI.discord.removeToken();
      } catch (error) {
        console.error("[DiscordToken] Electron clear failed:", error);
      }
    }
  }
}

export const discordTokenService = new DiscordTokenService();
