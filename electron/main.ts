import { app, BrowserWindow, ipcMain, globalShortcut, shell, Tray, Menu, nativeImage, dialog } from "electron";
import path from "path";
import fs from "fs";
import http from "http";
import https from "https";
import { networkInterfaces } from "os";
import { URL } from "url";
import Store from "electron-store";
import { exec } from "child_process";
import { autoUpdater } from "electron-updater";

// Add isQuitting flag to app
let isQuitting = false;

// Discord RPC Module
import * as discordRpc from "./rpc/discordRpc";

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let localServer: http.Server | null = null;
let serverPort = 5002;
let pendingDeepLink: string | null = null;

// Electron Store для сохранения настроек
const store = new Store();

// Persistent data store — shared between dev and production
// Stored in %APPDATA%/harmonix/harmonix-data.json
const dataStore = new Store({ name: "harmonix-data" });

// Get user data path for IndexedDB backup
function getIndexedDBBackupPath(): string {
  return path.join(app.getPath("userData"), "harmonix-idb-backup.json");
}

// Settings
let minimizeToTray = false;
let closeToTray = false;
let startMinimized = false;

// ============================================
// AUTO UPDATER
// ============================================

// Configure auto updater
autoUpdater.setFeedURL({
  provider: "github",
  owner: "Ponchik0", // Ваш GitHub username
  repo: "harmonix", // Имя вашего репозитория
});

// Disable auto download - let user decide when to update
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = false;

// Auto updater events
autoUpdater.on("checking-for-update", () => {
  console.log("[AutoUpdater] Checking for updates...");
  sendUpdateStatus("checking");
});

autoUpdater.on("update-available", (info) => {
  console.log("[AutoUpdater] Update available:", info.version);
  sendUpdateStatus("available", info);
});

autoUpdater.on("update-not-available", (info) => {
  console.log("[AutoUpdater] Update not available:", info.version);
  sendUpdateStatus("not-available");
});

autoUpdater.on("error", (err) => {
  console.error("[AutoUpdater] Error:", err);
  sendUpdateStatus("error", { message: err.message });
});

autoUpdater.on("download-progress", (progress) => {
  console.log("[AutoUpdater] Download progress:", progress);
  sendUpdateStatus("downloading", progress);
});

autoUpdater.on("update-downloaded", (info) => {
  console.log("[AutoUpdater] Update downloaded:", info.version);
  sendUpdateStatus("downloaded", info);
});

// Send update status to renderer
function sendUpdateStatus(status: string, data?: any) {
  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.send("update-status", { status, data });
  }
}

// Check for updates
async function checkForUpdates(): Promise<{ success: boolean; updateAvailable?: boolean; version?: string; error?: string }> {
  try {
    console.log("[AutoUpdater] Checking for updates...");
    const result = await autoUpdater.checkForUpdates();
    if (result && result.updateInfo && result.updateInfo.version) {
      return {
        success: true,
        updateAvailable: true,
        version: result.updateInfo.version,
      };
    }
    return {
      success: true,
      updateAvailable: false,
    };
  } catch (error: any) {
    console.error("[AutoUpdater] Check failed:", error);
    return {
      success: false,
      error: error.message || "Failed to check for updates",
    };
  }
}

// Download update
async function downloadUpdate(): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("[AutoUpdater] Downloading update...");
    await autoUpdater.downloadUpdate();
    return { success: true };
  } catch (error: any) {
    console.error("[AutoUpdater] Download failed:", error);
    return {
      success: false,
      error: error.message || "Failed to download update",
    };
  }
}

// Install update (quit and install)
function installUpdate(): void {
  console.log("[AutoUpdater] Installing update...");
  autoUpdater.quitAndInstall();
}

// ============================================
// GLOBAL SHORTCUTS
// ============================================

interface ShortcutData {
  id: string;
  key: string;
  modifiers: { ctrl?: boolean; shift?: boolean; alt?: boolean };
  action: string;
}

let registeredShortcuts: string[] = [];

function keyCodeToAccelerator(key: string, modifiers: ShortcutData["modifiers"]): string | null {
  // Only register shortcuts with Ctrl or Alt (global shortcuts need modifiers)
  if (!modifiers.ctrl && !modifiers.alt) return null;
  
  const parts: string[] = [];
  if (modifiers.ctrl) parts.push("CommandOrControl");
  if (modifiers.alt) parts.push("Alt");
  if (modifiers.shift) parts.push("Shift");
  
  // Convert key code to Electron accelerator format
  let keyName = key;
  if (key.startsWith("Key")) keyName = key.replace("Key", "");
  else if (key.startsWith("Digit")) keyName = key.replace("Digit", "");
  else if (key === "Space") keyName = "Space";
  else if (key === "ArrowUp") keyName = "Up";
  else if (key === "ArrowDown") keyName = "Down";
  else if (key === "ArrowLeft") keyName = "Left";
  else if (key === "ArrowRight") keyName = "Right";
  else if (key.startsWith("F") && !isNaN(Number(key.slice(1)))) keyName = key; // F1-F12
  
  parts.push(keyName);
  return parts.join("+");
}

function registerGlobalShortcuts(shortcuts: ShortcutData[]) {
  // Unregister all previous shortcuts
  for (const accelerator of registeredShortcuts) {
    try {
      globalShortcut.unregister(accelerator);
    } catch {}
  }
  registeredShortcuts = [];
  
  // Register new shortcuts
  for (const shortcut of shortcuts) {
    if (!shortcut.key) continue;
    
    const accelerator = keyCodeToAccelerator(shortcut.key, shortcut.modifiers);
    if (!accelerator) continue;
    
    try {
      const success = globalShortcut.register(accelerator, () => {
        // Send action to renderer
        if (mainWindow) {
          mainWindow.webContents.send("global-shortcut", shortcut.action);
        }
      });
      
      if (success) {
        registeredShortcuts.push(accelerator);
        console.log(`[GlobalShortcut] Registered: ${accelerator} -> ${shortcut.action}`);
      }
    } catch (err) {
      console.error(`[GlobalShortcut] Failed to register ${accelerator}:`, err);
    }
  }
}

// ============================================
// TRAY
// ============================================

function createTray() {
  if (tray) return;
  
  try {
    let iconPath: string;
    if (process.env.VITE_DEV_SERVER_URL) {
      // Dev mode - use build folder
      iconPath = path.join(__dirname, "../build/icon.ico");
    } else {
      // Production - use resources folder (extraResources in package.json)
      iconPath = path.join(process.resourcesPath, "icon.ico");
    }
    
    console.log('[Tray] Icon path:', iconPath);
    
    const icon = nativeImage.createFromPath(iconPath);
    if (icon.isEmpty()) {
      console.error('[Tray] Icon is empty, trying alternative path');
      // Fallback to app icon
      iconPath = app.getAppPath() + '/build/icon.ico';
      const fallbackIcon = nativeImage.createFromPath(iconPath);
      if (!fallbackIcon.isEmpty()) {
        tray = new Tray(fallbackIcon.resize({ width: 16, height: 16 }));
      } else {
        console.error('[Tray] Failed to load icon');
        return;
      }
    } else {
      tray = new Tray(icon.resize({ width: 16, height: 16 }));
    }
    
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Показать Harmonix',
        click: () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
          }
        }
      },
      { type: 'separator' },
      {
        label: 'Выход',
        click: () => {
          isQuitting = true;
          app.quit();
        }
      }
    ]);
    
    tray.setToolTip('Harmonix');
    tray.setContextMenu(contextMenu);
    
    tray.on('click', () => {
      if (mainWindow) {
        if (mainWindow.isVisible()) {
          mainWindow.hide();
        } else {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    });
    
    console.log('[Tray] Created');
  } catch (error) {
    console.error('[Tray] Failed to create:', error);
  }
}

function destroyTray() {
  if (tray) {
    tray.destroy();
    tray = null;
    console.log('[Tray] Destroyed');
  }
}

// ============================================
// AUTOSTART
// ============================================

function setAutoStart(enabled: boolean): boolean {
  try {
    app.setLoginItemSettings({
      openAtLogin: enabled,
      path: app.getPath("exe"),
      args: ["--hidden"],
    });
    console.log("[Autostart] Set to:", enabled);
    return true;
  } catch (error) {
    console.error("[Autostart] Failed to set:", error);
    return false;
  }
}

function getAutoStartEnabled(): boolean {
  try {
    const settings = app.getLoginItemSettings();
    return settings.openAtLogin;
  } catch {
    return false;
  }
}

// ============================================
// WINDOW
// ============================================

function createWindow() {
  // Load settings
  minimizeToTray = store.get('minimizeToTray', false) as boolean;
  closeToTray = store.get('closeToTray', false) as boolean;
  startMinimized = store.get('startMinimized', false) as boolean;
  const alwaysOnTop = store.get('alwaysOnTop', false) as boolean;
  
  // Определяем путь к иконке (ICO для Windows)
  let iconPath: string;
  if (process.env.VITE_DEV_SERVER_URL) {
    // Dev mode - use build folder
    iconPath = path.join(__dirname, "../build/icon.ico");
  } else {
    // Production - use resources folder (extraResources in package.json)
    iconPath = path.join(process.resourcesPath, "icon.ico");
  }
  
  console.log('[Window] Icon path:', iconPath);

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    frame: false,
    titleBarStyle: "hidden",
    backgroundColor: "#0a0a0f",
    transparent: false,
    icon: nativeImage.createFromPath(iconPath),
    show: !startMinimized,
    alwaysOnTop: alwaysOnTop,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
      devTools: process.env.VITE_DEV_SERVER_URL ? true : false, // Disable DevTools in production
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  // Открыть DevTools по F12 только в dev режиме
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.webContents.on('before-input-event', (event, input) => {
      if (input.key === 'F12' && mainWindow) {
        mainWindow.webContents.toggleDevTools();
      }
    });
  }

  // Handle minimize
  mainWindow.on('minimize', () => {
    if (minimizeToTray) {
      mainWindow?.hide();
    }
  });

// Handle close
  mainWindow.on('close', (event) => {
    if (closeToTray && !isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
  
  // Create tray if needed
  if (minimizeToTray || closeToTray) {
    createTray();
  }
}

// ============================================
// LOCAL SERVER
// ============================================

function getLocalIP(): string {
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    const netList = nets[name];
    if (!netList) continue;
    for (const net of netList) {
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }
  return "127.0.0.1";
}

function createLocalServer(port: number): Promise<{
  success: boolean;
  localAddress?: string;
  networkAddress?: string;
  error?: string;
}> {
  return new Promise((resolve) => {
    if (localServer) {
      resolve({ success: false, error: "Сервер уже запущен" });
      return;
    }

    const server = http.createServer((req, res) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Range, Content-Type");
      res.setHeader("Access-Control-Expose-Headers", "Content-Length, Content-Range, Accept-Ranges");

      if (req.method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
      }

      const reqUrl = new URL(req.url || "/", `http://localhost:${port}`);

      if (reqUrl.pathname === "/health") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "ok", port }));
        return;
      }

      if (reqUrl.pathname === "/proxy") {
        const targetUrl = reqUrl.searchParams.get("url");

        if (!targetUrl) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Missing url parameter" }));
          return;
        }

        try {
          const parsedUrl = new URL(targetUrl);
          const isHttps = parsedUrl.protocol === "https:";
          const httpModule = isHttps ? https : http;

          const proxyReq = httpModule.request(
            targetUrl,
            {
              method: "GET",
              headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                ...(req.headers.range ? { Range: req.headers.range } : {}),
              },
            },
            (proxyRes) => {
              const headers: Record<string, string | string[] | undefined> = {
                "Content-Type": proxyRes.headers["content-type"] || "audio/mpeg",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Expose-Headers": "Content-Length, Content-Range, Accept-Ranges",
              };

              if (proxyRes.headers["content-length"]) {
                headers["Content-Length"] = proxyRes.headers["content-length"];
              }
              if (proxyRes.headers["content-range"]) {
                headers["Content-Range"] = proxyRes.headers["content-range"];
              }
              if (proxyRes.headers["accept-ranges"]) {
                headers["Accept-Ranges"] = proxyRes.headers["accept-ranges"];
              }

              res.writeHead(proxyRes.statusCode || 200, headers);
              proxyRes.pipe(res);
            }
          );

          proxyReq.on("error", (err) => {
            console.error("Proxy error:", err);
            if (!res.headersSent) {
              res.writeHead(502, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: "Proxy error", details: err.message }));
            }
          });

          proxyReq.end();
        } catch (err) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Invalid URL" }));
        }
        return;
      }

      if (reqUrl.pathname.startsWith("/stream/")) {
        const streamId = reqUrl.pathname.replace("/stream/", "");
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Stream not found", id: streamId }));
        return;
      }

      if (reqUrl.pathname === "/" || reqUrl.pathname === "/api") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            name: "Harmonix Local Server",
            version: "1.0.0",
            endpoints: {
              "/health": "Health check",
              "/proxy?url=<url>": "Proxy audio stream",
              "/stream/<id>": "Stream by ID",
            },
          })
        );
        return;
      }

      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Not found" }));
    });

    server.on("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "EADDRINUSE") {
        resolve({ success: false, error: `Порт ${port} уже занят` });
      } else {
        resolve({ success: false, error: err.message });
      }
    });

    server.listen(port, "0.0.0.0", () => {
      localServer = server;
      serverPort = port;
      const localIP = getLocalIP();
      resolve({
        success: true,
        localAddress: `http://localhost:${port}`,
        networkAddress: `http://${localIP}:${port}`,
      });
    });
  });
}

function stopLocalServer(): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    if (!localServer) {
      resolve({ success: true });
      return;
    }

    localServer.close((err) => {
      if (err) {
        resolve({ success: false, error: err.message });
      } else {
        localServer = null;
        resolve({ success: true });
      }
    });
  });
}

// ============================================
// IPC HANDLERS
// ============================================

// Window controls
ipcMain.handle("window:minimize", () => mainWindow?.minimize());
ipcMain.handle("window:maximize", () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});
ipcMain.handle("window:close", () => mainWindow?.close());

ipcMain.handle("window:setOpacity", (_event, opacity: number) => {
  if (mainWindow) {
    mainWindow.setOpacity(Math.max(0.5, Math.min(1, opacity)));
    return { success: true };
  }
  return { success: false };
});

ipcMain.handle("window:getOpacity", () => {
  return mainWindow ? mainWindow.getOpacity() : 1;
});

// Change window icon (for light/dark theme)
ipcMain.handle("window:setIcon", (_event, isLight: boolean) => {
  if (!mainWindow) return { success: false };
  
  try {
    let iconPath: string;
    
    if (process.env.VITE_DEV_SERVER_URL) {
      // Dev mode - use build folder
      iconPath = isLight 
        ? path.join(__dirname, "../build/icon-light.ico")
        : path.join(__dirname, "../build/icon.ico");
    } else {
      // Production - use resources folder (extraResources in package.json)
      iconPath = isLight
        ? path.join(process.resourcesPath, "icon-light.ico")
        : path.join(process.resourcesPath, "icon.ico");
    }
    
    console.log("[Window] Setting icon:", iconPath);
    const icon = nativeImage.createFromPath(iconPath);
    
    if (icon.isEmpty()) {
      console.error("[Window] Icon is empty");
      return { success: false, error: "Icon file not found or empty" };
    }
    
    mainWindow.setIcon(icon);
    console.log("[Window] Icon changed to:", isLight ? "light" : "dark");
    return { success: true };
  } catch (error) {
    console.error("[Window] Failed to change icon:", error);
    return { success: false, error: String(error) };
  }
});

// Open URL in existing browser tab (not new window)
ipcMain.handle("shell:openURL", async (_event, url: string) => {
  try {
    console.log("[Shell] Opening URL in existing browser:", url);
    
    // On Windows, use 'start' command which opens URL in existing browser
    if (process.platform === 'win32') {
      return new Promise((resolve) => {
        exec(`start "" "${url}"`, (error) => {
          if (error) {
            console.error("[Shell] Failed to open URL:", error);
            // Fallback to shell.openExternal
            shell.openExternal(url).then(() => {
              resolve({ success: true });
            }).catch((err) => {
              console.error("[Shell] Fallback failed:", err);
              resolve({ success: false, error: String(err) });
            });
          } else {
            resolve({ success: true });
          }
        });
      });
    } else {
      // On macOS/Linux, shell.openExternal should work fine
      await shell.openExternal(url);
      return { success: true };
    }
  } catch (error) {
    console.error("[Shell] Error opening URL:", error);
    return { success: false, error: String(error) };
  }
});

// Local server
ipcMain.handle("localServer:start", async (_event, port: number) => {
  return await createLocalServer(port);
});

ipcMain.handle("localServer:stop", async () => {
  return await stopLocalServer();
});

ipcMain.handle("localServer:getStatus", () => {
  return {
    running: localServer !== null,
    port: serverPort,
    localAddress: localServer ? `http://localhost:${serverPort}` : "",
    networkAddress: localServer ? `http://${getLocalIP()}:${serverPort}` : "",
  };
});

// Discord RPC handlers
ipcMain.handle("discord:connect", async () => {
  return await discordRpc.connect();
});

ipcMain.handle("discord:setActivity", async (_event, activity: any) => {
  return discordRpc.setActivity(activity);
});

ipcMain.handle("discord:clearActivity", async () => {
  return await discordRpc.clearActivity();
});

ipcMain.handle("discord:getStatus", () => {
  return discordRpc.getStatus();
});

ipcMain.handle("discord:setEnabled", async (_event, enabled: boolean) => {
  return await discordRpc.setEnabled(enabled);
});

ipcMain.handle("discord:setToken", async (_event, token: string) => {
  return await discordRpc.setToken(token);
});

ipcMain.handle("discord:getToken", () => {
  return discordRpc.getToken();
});

ipcMain.handle("discord:removeToken", async () => {
  return await discordRpc.removeToken();
});

ipcMain.handle("discord:autoExtract", async () => {
  return await discordRpc.tryAutoExtract();
});

// Autostart handlers
ipcMain.handle("autostart:set", (_event, enabled: boolean) => {
  const success = setAutoStart(enabled);
  return { success, enabled: getAutoStartEnabled() };
});

ipcMain.handle("autostart:get", () => {
  return { enabled: getAutoStartEnabled() };
});

// Tray handlers
ipcMain.handle("tray:setMinimizeToTray", (_event, enabled: boolean) => {
  minimizeToTray = enabled;
  store.set('minimizeToTray', enabled);
  if (enabled || closeToTray) {
    createTray();
  } else if (!closeToTray) {
    destroyTray();
  }
  return { success: true };
});

ipcMain.handle("tray:setCloseToTray", (_event, enabled: boolean) => {
  closeToTray = enabled;
  store.set('closeToTray', enabled);
  if (enabled || minimizeToTray) {
    createTray();
  } else if (!minimizeToTray) {
    destroyTray();
  }
  return { success: true };
});

ipcMain.handle("tray:setStartMinimized", (_event, enabled: boolean) => {
  startMinimized = enabled;
  store.set('startMinimized', enabled);
  return { success: true };
});

ipcMain.handle("tray:getSettings", () => {
  return {
    minimizeToTray: store.get('minimizeToTray', false),
    closeToTray: store.get('closeToTray', false),
    startMinimized: store.get('startMinimized', false),
  };
});

// Always on top handler
ipcMain.handle("window:setAlwaysOnTop", (_event, enabled: boolean) => {
  if (mainWindow) {
    mainWindow.setAlwaysOnTop(enabled);
    store.set('alwaysOnTop', enabled);
    return { success: true };
  }
  return { success: false };
});

ipcMain.handle("window:getAlwaysOnTop", () => {
  return { enabled: mainWindow?.isAlwaysOnTop() || false };
});

// Global shortcuts handlers
ipcMain.handle("shortcuts:register", (_event, shortcuts: ShortcutData[]) => {
  registerGlobalShortcuts(shortcuts);
  return { success: true, registered: registeredShortcuts.length };
});

ipcMain.handle("shortcuts:unregisterAll", () => {
  for (const accelerator of registeredShortcuts) {
    try {
      globalShortcut.unregister(accelerator);
    } catch {}
  }
  registeredShortcuts = [];
  return { success: true };
});

// Auto updater handlers
ipcMain.handle("updater:check", async () => {
  return await checkForUpdates();
});

ipcMain.handle("updater:download", async () => {
  return await downloadUpdate();
});

  ipcMain.handle("updater:install", () => {
  installUpdate();
  return { success: true };
});

// ============================================
// PERSISTENT STORAGE (shared between dev & production)
// ============================================

// Save all localStorage data to disk
ipcMain.handle("persistentStorage:saveLocalStorage", (_event, data: Record<string, string>) => {
  try {
    dataStore.set("localStorage", data);
    console.log("[PersistentStorage] Saved localStorage:", Object.keys(data).length, "keys");
    return { success: true };
  } catch (error) {
    console.error("[PersistentStorage] Error saving localStorage:", error);
    return { success: false, error: String(error) };
  }
});

// Load all localStorage data from disk
ipcMain.handle("persistentStorage:loadLocalStorage", () => {
  try {
    const data = dataStore.get("localStorage", {}) as Record<string, string>;
    console.log("[PersistentStorage] Loaded localStorage:", Object.keys(data).length, "keys");
    return { success: true, data };
  } catch (error) {
    console.error("[PersistentStorage] Error loading localStorage:", error);
    return { success: false, data: {}, error: String(error) };
  }
});

// Save IndexedDB backup to disk (as JSON file for large data)
ipcMain.handle("persistentStorage:saveIndexedDB", (_event, data: string) => {
  try {
    const backupPath = getIndexedDBBackupPath();
    fs.writeFileSync(backupPath, data, "utf-8");
    console.log("[PersistentStorage] Saved IndexedDB backup:", (data.length / 1024).toFixed(1), "KB");
    return { success: true };
  } catch (error) {
    console.error("[PersistentStorage] Error saving IndexedDB:", error);
    return { success: false, error: String(error) };
  }
});

// Load IndexedDB backup from disk
ipcMain.handle("persistentStorage:loadIndexedDB", () => {
  try {
    const backupPath = getIndexedDBBackupPath();
    if (!fs.existsSync(backupPath)) {
      console.log("[PersistentStorage] No IndexedDB backup found");
      return { success: true, data: null };
    }
    const data = fs.readFileSync(backupPath, "utf-8");
    console.log("[PersistentStorage] Loaded IndexedDB backup:", (data.length / 1024).toFixed(1), "KB");
    return { success: true, data };
  } catch (error) {
    console.error("[PersistentStorage] Error loading IndexedDB:", error);
    return { success: false, data: null, error: String(error) };
  }
});

// Get the data directory path
ipcMain.handle("persistentStorage:getDataPath", () => {
  return { path: app.getPath("userData") };
});

// ============================================
// APP LIFECYCLE
// ============================================

// Handle deep link on Windows (single instance)
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
}

function handleDeepLink(url: string) {
  console.log("[DeepLink] Received:", url);
  
  // Handle track links: harmonix://track/BASE64DATA
  const trackMatch = url.match(/harmonix:\/\/track\/(.+)/i);
  if (trackMatch) {
    const trackData = trackMatch[1];
    console.log("[DeepLink] Track data received");
    
    if (mainWindow && mainWindow.webContents) {
      console.log("[DeepLink] Sending track to renderer");
      mainWindow.webContents.send("deep-link-track", trackData);
    } else {
      console.log("[DeepLink] Window not ready, storing for later");
      pendingDeepLink = `track:${trackData}`;
    }
    return;
  }
  
  // Parse the URL: harmonix://import/HRMX-XXXX-XXXX or harmonix://import/?code=HRMX-XXXX-XXXX
  let code: string | null = null;
  
  // Try query param format: harmonix://import/?code=HRMX-XXXX-XXXX
  const queryMatch = url.match(/[?&]code=([A-Z0-9-]+)/i);
  if (queryMatch) {
    code = queryMatch[1].toUpperCase();
  }
  
  // Try path format: harmonix://import/HRMX-XXXX-XXXX
  if (!code) {
    const pathMatch = url.match(/harmonix:\/\/import\/([A-Z0-9-]+)/i);
    if (pathMatch) {
      code = pathMatch[1].toUpperCase();
    }
  }
  
  if (code) {
    console.log("[DeepLink] Import code:", code);
    
    if (mainWindow && mainWindow.webContents) {
      console.log("[DeepLink] Sending to renderer");
      mainWindow.webContents.send("deep-link-import", code);
    } else {
      console.log("[DeepLink] Window not ready, storing for later");
      pendingDeepLink = code;
    }
  } else {
    console.log("[DeepLink] Could not parse code from URL");
  }
}

// Handle deep link on macOS
app.on("open-url", (_event, url) => {
  handleDeepLink(url);
});

app.whenReady().then(async () => {
  // Register custom protocol for deep links (harmonix://)
  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient("harmonix", process.execPath, [path.resolve(process.argv[1])]);
    }
  } else {
    app.setAsDefaultProtocolClient("harmonix");
  }

  createWindow();
  await discordRpc.initialize();

  // Check for updates on startup (only in production)
  if (!process.env.VITE_DEV_SERVER_URL) {
    setTimeout(() => {
      checkForUpdates();
    }, 5000); // Check after 5 seconds
  }

  // Handle deep link from command line on startup (Windows)
  const deepLink = process.argv.find(arg => arg.startsWith("harmonix://"));
  if (deepLink) {
    handleDeepLink(deepLink);
  }

  // Send pending deep link if window is ready
  if (pendingDeepLink && mainWindow) {
    setTimeout(() => {
      if (pendingDeepLink && mainWindow) {
        // Check if it's a track link
        if (pendingDeepLink.startsWith("track:")) {
          mainWindow.webContents.send("deep-link-track", pendingDeepLink.replace("track:", ""));
        } else {
          mainWindow.webContents.send("deep-link-import", pendingDeepLink);
        }
        pendingDeepLink = null;
      }
    }, 2000); // Wait for renderer to be ready
  }
});

// Handle deep link on macOS
app.on("open-url", (_event, url) => {
  handleDeepLink(url);
});

app.on("window-all-closed", async () => {
  // Unregister all global shortcuts
  globalShortcut.unregisterAll();
  
  await discordRpc.cleanup();

  if (localServer) {
    localServer.close();
    localServer = null;
  }

  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
