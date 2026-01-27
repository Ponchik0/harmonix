import { useState, useEffect } from "react";
import { IoTrash, IoCheckmark } from "react-icons/io5";
import {
  HiOutlineInformationCircle,
} from "react-icons/hi2";
import { proxyService } from "../../services/ProxyService";

// ========== SOUNDCLOUD PAGE ==========
export function SoundCloudPage() {
  const storageKey = "harmonix-srv-soundcloud";
  
  // Токены из базы (те же что в SoundCloudService)
  const databaseTokens = [
    { id: "id1", name: "Токен 1", value: "iZIs9mchVcX5lhVRyQGGAYlNPVldzAoX" },
    { id: "id2", name: "Токен 2", value: "a3e059563d7fd3372b49b37f00a00bcf" },
  ];

  const [selectedToken, setSelectedToken] = useState<"id1" | "id2" | "custom">("id1");
  const [customToken, setCustomToken] = useState("");
  const [tokenStatus, setTokenStatus] = useState<"idle" | "checking" | "valid" | "invalid">("idle");
  const [showTutorial, setShowTutorial] = useState(false);

  // Загрузка настроек
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const data = JSON.parse(saved);
        if (data.activeToken) setSelectedToken(data.activeToken);
        if (data.customToken) setCustomToken(data.customToken);
        if (data.token) {
          // Проверяем какой токен активен
          if (data.token === databaseTokens[0].value) {
            setSelectedToken("id1");
            setTokenStatus("valid");
          } else if (data.token === databaseTokens[1].value) {
            setSelectedToken("id2");
            setTokenStatus("valid");
          } else if (data.customToken && data.token === data.customToken) {
            setSelectedToken("custom");
            setTokenStatus("valid");
          }
        }
      }
    } catch (e) {
      console.error("[SoundCloud] Error loading settings:", e);
    }
  }, []);

  // Проверка токена через proxyService
  const verifyToken = async (token: string): Promise<boolean> => {
    if (!token) return false;
    try {
      const response = await proxyService.proxyFetch(
        "soundcloud",
        `https://api-v2.soundcloud.com/search/tracks?q=test&limit=1&client_id=${token}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        }
      );
      return response.ok;
    } catch {
      return false;
    }
  };

  // Получить текущий токен
  const getCurrentToken = (): string => {
    if (selectedToken === "id1") return databaseTokens[0].value;
    if (selectedToken === "id2") return databaseTokens[1].value;
    if (selectedToken === "custom") return customToken;
    return "";
  };

  // Сохранение настроек
  const handleSave = async () => {
    const token = getCurrentToken();
    if (!token) {
      setTokenStatus("invalid");
      setTimeout(() => setTokenStatus("idle"), 2000);
      return;
    }

    setTokenStatus("checking");
    const isValid = await verifyToken(token);
    
    if (isValid) {
      const settings = {
        activeToken: selectedToken,
        customToken,
        token,
        enabled: true,
      };
      localStorage.setItem(storageKey, JSON.stringify(settings));
      setTokenStatus("valid");
      
      // Уведомляем сервис об обновлении токена
      window.dispatchEvent(new CustomEvent("soundcloud-token-updated"));
    } else {
      setTokenStatus("invalid");
      setTimeout(() => setTokenStatus("idle"), 3000);
    }
  };

  // Сброс настроек
  const handleClear = () => {
    localStorage.removeItem(storageKey);
    setSelectedToken("id1");
    setCustomToken("");
    setTokenStatus("idle");
  };

  const isConnected = tokenStatus === "valid";
  const statusInfo = tokenStatus === "valid"
    ? { text: "Подключено", bg: "rgba(34,197,94,0.15)", border: "rgba(34,197,94,0.3)", color: "#22C55E" }
    : tokenStatus === "invalid"
    ? { text: "Неверный токен", bg: "rgba(239,68,68,0.15)", border: "rgba(239,68,68,0.3)", color: "#EF4444" }
    : tokenStatus === "checking"
    ? { text: "Проверка...", bg: "rgba(245,158,11,0.15)", border: "rgba(245,158,11,0.3)", color: "#F59E0B" }
    : { text: "Не подключено", bg: "rgba(107,114,128,0.15)", border: "rgba(107,114,128,0.3)", color: "#6B7280" };

  const currentToken = getCurrentToken();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-2xl p-4 border relative overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(255,85,0,0.12), rgba(255,85,0,0.02))", borderColor: "rgba(255,85,0,0.2)" }}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#ff5500", boxShadow: "0 4px 16px rgba(255,85,0,0.3)" }}>
            <svg viewBox="0 0 24 24" className="w-7 h-7" fill="white">
              <path d="M7 17.939h-1v-8.068c.308-.231.639-.429 1-.566v8.634zm3 0h1v-9.224c-.229.265-.443.548-.621.857l-.379-.184v8.551zm-2 0h1v-8.848c-.508-.079-.623-.05-1-.01v8.858zm-4 0h1v-7.02c-.312.458-.555.971-.692 1.535l-.308-.182v5.667zm-3-5.25c-.606.547-1 1.354-1 2.268 0 .914.394 1.721 1 2.268v-4.536zm18.879-.671c-.204-2.837-2.404-5.079-5.117-5.079-1.022 0-1.964.328-2.762.877v10.123h9.089c1.607 0 2.911-1.393 2.911-3.106 0-2.233-2.168-3.772-4.121-2.815zm-16.879-.027c-.302-.024-.526-.03-1 .122v5.689c.446.143.636.138 1 .138v-5.949z"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>SoundCloud</h2>
              <span className="px-2 py-0.5 rounded-md text-[11px] font-medium flex items-center gap-1" style={{ background: statusInfo.bg, border: `1px solid ${statusInfo.border}`, color: statusInfo.color }}>
                {tokenStatus === "checking" && <div className="w-3 h-3 border-2 border-current/30 border-t-current rounded-full animate-spin" />}
                {tokenStatus === "valid" && <IoCheckmark size={12} />}
                {statusInfo.text}
              </span>
            </div>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-subtle)" }}>Поиск и воспроизведение треков</p>
          </div>
          {isConnected && (
            <button onClick={handleClear} className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium flex items-center gap-1 transition-all hover:scale-105 flex-shrink-0" style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444" }}>
              <IoTrash size={12} />Сбросить
            </button>
          )}
        </div>
      </div>

      {/* Token Selection */}
      <div className="rounded-xl overflow-hidden" style={{ background: "var(--surface-card)", border: "1px solid var(--border-base)" }}>
        <div className="px-3 py-2.5" style={{ borderBottom: "1px solid var(--border-base)" }}>
          <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Выбор токена</span>
        </div>
        <div className="p-3 space-y-2.5">
          {/* Preset Tokens */}
          <div className="space-y-2">
            {databaseTokens.map((token) => (
              <label
                key={token.id}
                className="flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all hover:bg-[var(--surface-elevated)]"
                style={{
                  background: selectedToken === token.id ? "var(--surface-elevated)" : "transparent",
                  border: selectedToken === token.id ? "1px solid var(--border-base)" : "1px solid transparent",
                }}
              >
                <input
                  type="radio"
                  name="token"
                  checked={selectedToken === token.id}
                  onChange={() => {
                    setSelectedToken(token.id as "id1" | "id2");
                    setTokenStatus("idle");
                  }}
                  className="w-4 h-4 accent-[#ff5500]"
                />
                <span className="text-sm flex-1" style={{ color: "var(--text-primary)" }}>
                  {token.name}
                </span>
                {selectedToken === token.id && tokenStatus === "valid" && (
                  <IoCheckmark size={16} className="text-green-500" />
                )}
              </label>
            ))}
            
            {/* Custom Token */}
            <label
              className="flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all hover:bg-[var(--surface-elevated)]"
              style={{
                background: selectedToken === "custom" ? "var(--surface-elevated)" : "transparent",
                border: selectedToken === "custom" ? "1px solid var(--border-base)" : "1px solid transparent",
              }}
            >
              <input
                type="radio"
                name="token"
                checked={selectedToken === "custom"}
                onChange={() => {
                  setSelectedToken("custom");
                  setTokenStatus("idle");
                }}
                className="w-4 h-4 accent-[#ff5500]"
              />
              <span className="text-sm flex-1" style={{ color: "var(--text-primary)" }}>
                Свой токен
              </span>
              {selectedToken === "custom" && tokenStatus === "valid" && (
                <IoCheckmark size={16} className="text-green-500" />
              )}
            </label>
          </div>

          {/* Custom Token Input */}
          {selectedToken === "custom" && (
            <div className="relative">
              <input
                type="text"
                value={customToken}
                onChange={(e) => {
                  setCustomToken(e.target.value);
                  setTokenStatus("idle");
                }}
                placeholder="Введите Client ID"
                className="w-full px-3 py-2.5 pr-12 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff5500]/50"
                style={{
                  background: "var(--surface-elevated)",
                  border: "1px solid var(--border-base)",
                  color: "var(--text-primary)"
                }}
              />
              {customToken && tokenStatus !== "valid" && (
                <button
                  onClick={handleSave}
                  disabled={tokenStatus === "checking"}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110 disabled:opacity-50"
                  style={{ background: "var(--interactive-accent)", color: "var(--interactive-accent-text)" }}
                >
                  {tokenStatus === "checking" ? (
                    <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: "var(--interactive-accent-text)", borderTopColor: "transparent" }} />
                  ) : (
                    <IoCheckmark size={18} />
                  )}
                </button>
              )}
              {tokenStatus === "valid" && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center">
                  <IoCheckmark size={18} className="text-white" />
                </div>
              )}
            </div>
          )}

          {/* Save Button for Preset Tokens */}
          {selectedToken !== "custom" && currentToken && tokenStatus !== "valid" && (
            <button
              onClick={handleSave}
              disabled={tokenStatus === "checking"}
              className="w-full py-2.5 rounded-lg text-sm font-medium transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: "#ff5500", color: "white" }}
            >
              {tokenStatus === "checking" ? "Проверка..." : "Подключить"}
            </button>
          )}
        </div>
      </div>

      {/* Tutorial */}
      <button
        onClick={() => setShowTutorial(!showTutorial)}
        className="w-full py-2 rounded-lg text-[11px] font-medium transition-all flex items-center justify-center gap-1.5"
        style={{ background: "var(--surface-card)", border: "1px solid var(--border-base)" }}
      >
        <HiOutlineInformationCircle size={14} className="text-[#ff5500]" />
        <span style={{ color: "var(--text-subtle)" }}>
          {showTutorial ? "Скрыть инструкцию" : "Как получить свой Client ID?"}
        </span>
      </button>
      
      {showTutorial && (
        <div className="rounded-lg p-3 space-y-2" style={{ background: "rgba(255,85,0,0.08)", border: "1px solid rgba(255,85,0,0.15)" }}>
          <p className="text-xs font-medium text-[#ff5500]">Как получить Client ID:</p>
          <div className="space-y-1.5 text-[11px]" style={{ color: "var(--text-subtle)" }}>
            <p>1. Откройте DevTools в браузере (F12)</p>
            <p>2. Перейдите на <a href="https://soundcloud.com" target="_blank" rel="noopener noreferrer" className="text-[#ff5500] hover:underline font-medium">soundcloud.com</a></p>
            <p>3. Во вкладке Network найдите запросы к api-v2.soundcloud.com</p>
            <p>4. Скопируйте параметр <span className="font-mono text-[#ff5500]">client_id</span> из URL</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ========== SPOTIFY PAGE ==========
export function SpotifyPage() {
  const storageKey = "harmonix-srv-spotify";
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [tokenStatus, setTokenStatus] = useState<"idle" | "checking" | "valid" | "invalid">("idle");
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const data = JSON.parse(saved);
        if (data.clientId) setClientId(data.clientId);
        if (data.clientSecret) setClientSecret(data.clientSecret);
        if (data.clientId && data.clientSecret) setTokenStatus("valid");
      }
    } catch {}
  }, []);

  const verifyToken = async (): Promise<boolean> => {
    if (!clientId || !clientSecret) return false;
    try {
      const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`,
      });
      return response.ok;
    } catch {
      return false;
    }
  };

  const handleSave = async () => {
    if (!clientId || !clientSecret) return;
    setTokenStatus("checking");
    const isValid = await verifyToken();
    if (isValid) {
      localStorage.setItem(storageKey, JSON.stringify({ clientId, clientSecret }));
      setTokenStatus("valid");
    } else {
      setTokenStatus("invalid");
      setTimeout(() => setTokenStatus("idle"), 3000);
    }
  };

  const handleClear = () => {
    localStorage.removeItem(storageKey);
    setClientId("");
    setClientSecret("");
    setTokenStatus("idle");
  };

  const isConnected = tokenStatus === "valid";
  const statusInfo = tokenStatus === "valid"
    ? { text: "Подключено", bg: "rgba(34,197,94,0.15)", border: "rgba(34,197,94,0.3)", color: "#22C55E" }
    : tokenStatus === "invalid"
    ? { text: "Неверные данные", bg: "rgba(239,68,68,0.15)", border: "rgba(239,68,68,0.3)", color: "#EF4444" }
    : tokenStatus === "checking"
    ? { text: "Проверка...", bg: "rgba(245,158,11,0.15)", border: "rgba(245,158,11,0.3)", color: "#F59E0B" }
    : { text: "Не подключено", bg: "rgba(107,114,128,0.15)", border: "rgba(107,114,128,0.3)", color: "#6B7280" };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-2xl p-4 border relative overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(29,185,84,0.12), rgba(29,185,84,0.02))", borderColor: "rgba(29,185,84,0.2)" }}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#1DB954", boxShadow: "0 4px 16px rgba(29,185,84,0.3)" }}>
            <svg viewBox="0 0 24 24" className="w-7 h-7">
              <circle cx="12" cy="12" r="12" fill="#1DB954" />
              <path d="M17.2 10.5c-2.8-1.7-7.4-1.8-10-1-.4.1-.8-.1-.9-.5-.1-.4.1-.8.5-.9 3-1 8-.8 11.2 1.1.4.2.5.7.3 1.1-.2.3-.7.4-1.1.2zm-.2 2.7c-.2.3-.6.4-.9.2-2.3-1.4-5.8-1.8-8.5-1-.3.1-.7-.1-.8-.4-.1-.3.1-.7.4-.8 3.1-.9 6.9-.5 9.6 1.1.3.2.4.6.2.9zm-1 2.6c-.2.3-.5.3-.7.2-2-1.2-4.5-1.5-7.5-.8-.3.1-.5-.1-.6-.4-.1-.3.1-.5.4-.6 3.3-.8 6.1-.4 8.3 1 .2.1.3.4.1.6z" fill="white" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Spotify</h2>
              <span className="px-2 py-0.5 rounded-md text-[11px] font-medium flex items-center gap-1" style={{ background: statusInfo.bg, border: `1px solid ${statusInfo.border}`, color: statusInfo.color }}>
                {tokenStatus === "checking" && <div className="w-3 h-3 border-2 border-current/30 border-t-current rounded-full animate-spin" />}
                {tokenStatus === "valid" && <IoCheckmark size={12} />}
                {statusInfo.text}
              </span>
            </div>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-subtle)" }}>Импорт плейлистов и рекомендации</p>
          </div>
          {isConnected && (
            <button onClick={handleClear} className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium flex items-center gap-1 transition-all hover:scale-105 flex-shrink-0" style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444" }}>
              <IoTrash size={12} />Сбросить
            </button>
          )}
        </div>
      </div>

      {/* Credentials */}
      <div className="rounded-xl overflow-hidden" style={{ background: "var(--surface-card)", border: "1px solid var(--border-base)" }}>
        <div className="px-3 py-2.5" style={{ borderBottom: "1px solid var(--border-base)" }}>
          <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Учётные данные</span>
        </div>
        <div className="p-3 space-y-2.5">
          <input type="text" value={clientId} onChange={(e) => { setClientId(e.target.value); setTokenStatus("idle"); }} placeholder="Client ID" className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1DB954]/50" style={{ background: "var(--surface-elevated)", border: "1px solid var(--border-base)", color: "var(--text-primary)" }} />
          <div className="relative">
            <input type="password" value={clientSecret} onChange={(e) => { setClientSecret(e.target.value); setTokenStatus("idle"); }} placeholder="Client Secret" className="w-full px-3 py-2.5 pr-12 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1DB954]/50" style={{ background: "var(--surface-elevated)", border: "1px solid var(--border-base)", color: "var(--text-primary)" }} />
            {clientId && clientSecret && tokenStatus !== "valid" && (
              <button onClick={handleSave} disabled={tokenStatus === "checking"} className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110 disabled:opacity-50" style={{ background: "var(--interactive-accent)", color: "var(--interactive-accent-text)" }}>
                {tokenStatus === "checking" ? <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: "var(--interactive-accent-text)", borderTopColor: "transparent" }} /> : <IoCheckmark size={18} />}
              </button>
            )}
            {tokenStatus === "valid" && <div className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center"><IoCheckmark size={18} className="text-white" /></div>}
          </div>
        </div>
      </div>

      {/* Tutorial */}
      <button onClick={() => setShowTutorial(!showTutorial)} className="w-full py-2 rounded-lg text-[11px] font-medium transition-all flex items-center justify-center gap-1.5" style={{ background: "var(--surface-card)", border: "1px solid var(--border-base)" }}>
        <HiOutlineInformationCircle size={14} className="text-[#1DB954]" />
        <span style={{ color: "var(--text-subtle)" }}>{showTutorial ? "Скрыть инструкцию" : "Как получить Client ID и Secret?"}</span>
      </button>
      {showTutorial && (
        <div className="rounded-lg p-3 space-y-2" style={{ background: "rgba(29,185,84,0.08)", border: "1px solid rgba(29,185,84,0.15)" }}>
          <p className="text-xs font-medium text-[#1DB954]">Как получить данные:</p>
          <div className="space-y-1.5 text-[11px]" style={{ color: "var(--text-subtle)" }}>
            <p>1. Перейдите на <a href="https://developer.spotify.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-[#1DB954] hover:underline font-medium">developer.spotify.com/dashboard</a></p>
            <p>2. Войдите в аккаунт Spotify</p>
            <p>3. Нажмите "Create App"</p>
            <p>4. Заполните название и описание</p>
            <p>5. Скопируйте Client ID и Client Secret</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ========== YANDEX MUSIC PAGE ==========
export function YandexMusicPage() {
  const storageKey = "harmonix-srv-yandex";
  const [accessToken, setAccessToken] = useState("");
  const [tokenStatus, setTokenStatus] = useState<"idle" | "checking" | "valid" | "invalid">("idle");
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const data = JSON.parse(saved);
        if (data.accessToken || data.token) {
          setAccessToken(data.accessToken || data.token);
          setTokenStatus("valid");
        }
      }
    } catch {}
  }, []);

  const verifyToken = async (): Promise<boolean> => {
    if (!accessToken) return false;
    try {
      const response = await fetch(
        `https://api.music.yandex.net/search?text=test&type=track`,
        {
          headers: { Authorization: `OAuth ${accessToken}` },
        }
      );
      return response.ok;
    } catch {
      return false;
    }
  };

  const handleSave = async () => {
    if (!accessToken) return;
    setTokenStatus("checking");
    const isValid = await verifyToken();
    if (isValid) {
      localStorage.setItem(storageKey, JSON.stringify({ accessToken, enabled: true }));
      setTokenStatus("valid");
    } else {
      setTokenStatus("invalid");
      setTimeout(() => setTokenStatus("idle"), 3000);
    }
  };

  const handleClear = () => {
    localStorage.removeItem(storageKey);
    setAccessToken("");
    setTokenStatus("idle");
  };

  const isConnected = tokenStatus === "valid";
  const statusInfo = tokenStatus === "valid"
    ? { text: "Подключено", bg: "rgba(34,197,94,0.15)", border: "rgba(34,197,94,0.3)", color: "#22C55E" }
    : tokenStatus === "invalid"
    ? { text: "Неверный токен", bg: "rgba(239,68,68,0.15)", border: "rgba(239,68,68,0.3)", color: "#EF4444" }
    : tokenStatus === "checking"
    ? { text: "Проверка...", bg: "rgba(245,158,11,0.15)", border: "rgba(245,158,11,0.3)", color: "#F59E0B" }
    : { text: "Не подключено", bg: "rgba(107,114,128,0.15)", border: "rgba(107,114,128,0.3)", color: "#6B7280" };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-2xl p-4 border relative overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(255,204,0,0.12), rgba(255,204,0,0.02))", borderColor: "rgba(255,204,0,0.2)" }}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#FFCC00", boxShadow: "0 4px 16px rgba(255,204,0,0.3)" }}>
            <svg viewBox="0 0 24 24" className="w-7 h-7" fill="#000">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Яндекс Музыка</h2>
              <span className="px-2 py-0.5 rounded-md text-[11px] font-medium flex items-center gap-1" style={{ background: statusInfo.bg, border: `1px solid ${statusInfo.border}`, color: statusInfo.color }}>
                {tokenStatus === "checking" && <div className="w-3 h-3 border-2 border-current/30 border-t-current rounded-full animate-spin" />}
                {tokenStatus === "valid" && <IoCheckmark size={12} />}
                {statusInfo.text}
              </span>
            </div>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-subtle)" }}>Поиск и воспроизведение треков</p>
          </div>
          {isConnected && (
            <button onClick={handleClear} className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium flex items-center gap-1 transition-all hover:scale-105 flex-shrink-0" style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444" }}>
              <IoTrash size={12} />Сбросить
            </button>
          )}
        </div>
      </div>

      {/* Access Token */}
      <div className="rounded-xl overflow-hidden" style={{ background: "var(--surface-card)", border: "1px solid var(--border-base)" }}>
        <div className="px-3 py-2.5" style={{ borderBottom: "1px solid var(--border-base)" }}>
          <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Access Token</span>
        </div>
        <div className="p-3 space-y-2.5">
          <div className="relative">
            <input type="password" value={accessToken} onChange={(e) => { setAccessToken(e.target.value); setTokenStatus("idle"); }} placeholder="Введите Access Token" className="w-full px-3 py-2.5 pr-12 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FFCC00]/50" style={{ background: "var(--surface-elevated)", border: "1px solid var(--border-base)", color: "var(--text-primary)" }} />
            {accessToken && tokenStatus !== "valid" && (
              <button onClick={handleSave} disabled={tokenStatus === "checking"} className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110 disabled:opacity-50" style={{ background: "var(--interactive-accent)", color: "var(--interactive-accent-text)" }}>
                {tokenStatus === "checking" ? <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: "var(--interactive-accent-text)", borderTopColor: "transparent" }} /> : <IoCheckmark size={18} />}
              </button>
            )}
            {tokenStatus === "valid" && <div className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center"><IoCheckmark size={18} className="text-white" /></div>}
          </div>
        </div>
      </div>

      {/* Tutorial */}
      <button onClick={() => setShowTutorial(!showTutorial)} className="w-full py-2 rounded-lg text-[11px] font-medium transition-all flex items-center justify-center gap-1.5" style={{ background: "var(--surface-card)", border: "1px solid var(--border-base)" }}>
        <HiOutlineInformationCircle size={14} className="text-[#FFCC00]" />
        <span style={{ color: "var(--text-subtle)" }}>{showTutorial ? "Скрыть инструкцию" : "Как получить Access Token?"}</span>
      </button>
      {showTutorial && (
        <div className="rounded-lg p-3 space-y-2" style={{ background: "rgba(255,204,0,0.08)", border: "1px solid rgba(255,204,0,0.15)" }}>
          <p className="text-xs font-medium text-[#FFCC00]">Как получить токен:</p>
          <div className="space-y-1.5 text-[11px]" style={{ color: "var(--text-subtle)" }}>
            <p>1. Перейдите на <a href="https://oauth.yandex.ru" target="_blank" rel="noopener noreferrer" className="text-[#FFCC00] hover:underline font-medium">oauth.yandex.ru</a></p>
            <p>2. Создайте приложение</p>
            <p>3. Получите OAuth токен с правами на Яндекс.Музыку</p>
            <p>4. Скопируйте токен и вставьте выше</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ========== VK MUSIC PAGE ==========
export function VKMusicPage() {
  const storageKey = "harmonix-srv-vk";
  const [accessToken, setAccessToken] = useState("");
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [tokenStatus, setTokenStatus] = useState<"idle" | "checking" | "valid" | "invalid">("idle");
  const [authStatus, setAuthStatus] = useState<"idle" | "authenticating" | "success" | "error">("idle");
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const data = JSON.parse(saved);
        if (data.accessToken || data.token) {
          setAccessToken(data.accessToken || data.token);
          setTokenStatus("valid");
        }
      }
    } catch {}
  }, []);

  const verifyToken = async (token: string): Promise<boolean> => {
    if (!token) return false;
    try {
      const response = await fetch(
        `https://api.vk.com/method/audio.search?q=test&access_token=${token}&v=5.131`
      );
      return response.ok;
    } catch {
      return false;
    }
  };

  // Автоматическое получение токена по логину и паролю
  const handleAutoAuth = async () => {
    if (!login || !password) return;
    
    setAuthStatus("authenticating");
    
    try {
      // VK Kate Mobile client credentials
      const clientId = "2685278";
      const clientSecret = "lxhD8OD7dMsqtXIm5IUY";
      
      // Получаем токен через Direct Auth
      const params = new URLSearchParams({
        grant_type: "password",
        client_id: clientId,
        client_secret: clientSecret,
        username: login,
        password: password,
        v: "5.131",
        scope: "audio,offline",
      });

      const response = await fetch("https://oauth.vk.com/token?" + params.toString());
      const data = await response.json();

      if (data.access_token) {
        const token = data.access_token;
        setAccessToken(token);
        
        // Проверяем токен
        const isValid = await verifyToken(token);
        if (isValid) {
          localStorage.setItem(storageKey, JSON.stringify({ accessToken: token, enabled: true }));
          setTokenStatus("valid");
          setAuthStatus("success");
          
          // Очищаем пароль из соображений безопасности
          setPassword("");
        } else {
          setAuthStatus("error");
          setTimeout(() => setAuthStatus("idle"), 3000);
        }
      } else {
        setAuthStatus("error");
        setTimeout(() => setAuthStatus("idle"), 3000);
      }
    } catch (error) {
      console.error("[VK] Auth error:", error);
      setAuthStatus("error");
      setTimeout(() => setAuthStatus("idle"), 3000);
    }
  };

  const handleManualSave = async () => {
    if (!accessToken) return;
    setTokenStatus("checking");
    const isValid = await verifyToken(accessToken);
    if (isValid) {
      localStorage.setItem(storageKey, JSON.stringify({ accessToken, enabled: true }));
      setTokenStatus("valid");
    } else {
      setTokenStatus("invalid");
      setTimeout(() => setTokenStatus("idle"), 3000);
    }
  };

  const handleClear = () => {
    localStorage.removeItem(storageKey);
    setAccessToken("");
    setLogin("");
    setPassword("");
    setTokenStatus("idle");
    setAuthStatus("idle");
  };

  const isConnected = tokenStatus === "valid";
  const statusInfo = tokenStatus === "valid"
    ? { text: "Подключено", bg: "rgba(34,197,94,0.15)", border: "rgba(34,197,94,0.3)", color: "#22C55E" }
    : tokenStatus === "invalid"
    ? { text: "Неверный токен", bg: "rgba(239,68,68,0.15)", border: "rgba(239,68,68,0.3)", color: "#EF4444" }
    : tokenStatus === "checking"
    ? { text: "Проверка...", bg: "rgba(245,158,11,0.15)", border: "rgba(245,158,11,0.3)", color: "#F59E0B" }
    : { text: "Не подключено", bg: "rgba(107,114,128,0.15)", border: "rgba(107,114,128,0.3)", color: "#6B7280" };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-2xl p-4 border relative overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(0,119,255,0.12), rgba(0,119,255,0.02))", borderColor: "rgba(0,119,255,0.2)" }}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#0077FF", boxShadow: "0 4px 16px rgba(0,119,255,0.3)" }}>
            <svg viewBox="0 0 24 24" className="w-7 h-7" fill="white">
              <path d="M13.162 18.994c.609 0 .858-.406.851-.915-.031-1.917.714-2.949 2.059-1.604 1.488 1.488 1.796 2.519 3.603 2.519h3.2c.808 0 1.126-.26 1.126-.668 0-.863-1.421-2.386-2.625-3.504-1.686-1.565-1.765-1.602-.313-3.486 1.801-2.339 4.157-5.336 2.073-5.336h-3.981c-.772 0-.828.435-1.103 1.083-.995 2.347-2.886 5.387-3.604 4.922-.751-.485-.407-2.406-.35-5.261.015-.754.011-1.271-1.141-1.539-.629-.145-1.241-.205-1.809-.205-2.273 0-3.841.953-2.95 1.119 1.571.293 1.42 3.692 1.054 5.16-.638 2.556-3.036-2.024-4.035-4.305-.241-.548-.315-.974-1.175-.974h-3.255c-.492 0-.787.16-.787.516 0 .602 2.96 6.72 5.786 9.77 2.756 2.975 5.48 2.708 7.376 2.708z"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>VK Музыка</h2>
              <span className="px-2 py-0.5 rounded-md text-[11px] font-medium flex items-center gap-1" style={{ background: statusInfo.bg, border: `1px solid ${statusInfo.border}`, color: statusInfo.color }}>
                {tokenStatus === "checking" && <div className="w-3 h-3 border-2 border-current/30 border-t-current rounded-full animate-spin" />}
                {tokenStatus === "valid" && <IoCheckmark size={12} />}
                {statusInfo.text}
              </span>
            </div>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-subtle)" }}>Поиск и воспроизведение треков</p>
          </div>
          {isConnected && (
            <button onClick={handleClear} className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium flex items-center gap-1 transition-all hover:scale-105 flex-shrink-0" style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444" }}>
              <IoTrash size={12} />Сбросить
            </button>
          )}
        </div>
      </div>

      {/* Manual Token Input */}
      <div className="rounded-xl overflow-hidden" style={{ background: "var(--surface-card)", border: "1px solid var(--border-base)" }}>
        <div className="px-3 py-2.5" style={{ borderBottom: "1px solid var(--border-base)" }}>
          <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Ручной ввод токена</span>
          <p className="text-[11px] mt-0.5" style={{ color: "var(--text-subtle)" }}>Если у вас уже есть Access Token</p>
        </div>
        <div className="p-3 space-y-2.5">
          <div className="relative">
            <input 
              type="password" 
              value={accessToken} 
              onChange={(e) => { 
                setAccessToken(e.target.value); 
                setTokenStatus("idle"); 
              }} 
              placeholder="Введите Access Token вручную" 
              className="w-full px-3 py-2.5 pr-12 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0077FF]/50" 
              style={{ background: "var(--surface-elevated)", border: "1px solid var(--border-base)", color: "var(--text-primary)" }} 
            />
            {accessToken && tokenStatus !== "valid" && (
              <button 
                onClick={handleManualSave} 
                disabled={tokenStatus === "checking"} 
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110 disabled:opacity-50" 
                style={{ background: "var(--interactive-accent)", color: "var(--interactive-accent-text)" }}
              >
                {tokenStatus === "checking" ? (
                  <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: "var(--interactive-accent-text)", borderTopColor: "transparent" }} />
                ) : (
                  <IoCheckmark size={18} />
                )}
              </button>
            )}
            {tokenStatus === "valid" && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center">
                <IoCheckmark size={18} className="text-white" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Auto Auth with Login/Password */}
      <div className="rounded-xl overflow-hidden" style={{ background: "var(--surface-card)", border: "1px solid var(--border-base)" }}>
        <div className="px-3 py-2.5" style={{ borderBottom: "1px solid var(--border-base)" }}>
          <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Автоматическое получение токена</span>
          <p className="text-[11px] mt-0.5" style={{ color: "var(--text-subtle)" }}>Войдите через логин и пароль VK</p>
        </div>
        <div className="p-3 space-y-2.5">
          <input 
            type="text" 
            value={login} 
            onChange={(e) => setLogin(e.target.value)} 
            placeholder="Логин (телефон или email)" 
            className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0077FF]/50" 
            style={{ background: "var(--surface-elevated)", border: "1px solid var(--border-base)", color: "var(--text-primary)" }} 
          />
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            onKeyDown={(e) => e.key === "Enter" && login && password && handleAutoAuth()}
            placeholder="Пароль" 
            className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0077FF]/50" 
            style={{ background: "var(--surface-elevated)", border: "1px solid var(--border-base)", color: "var(--text-primary)" }} 
          />
          <button
            onClick={handleAutoAuth}
            disabled={!login || !password || authStatus === "authenticating"}
            className="w-full py-2.5 rounded-lg text-sm font-medium transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: "#0077FF", color: "white" }}
          >
            {authStatus === "authenticating" ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Получение токена...
              </>
            ) : authStatus === "success" ? (
              <>
                <IoCheckmark size={18} />
                Токен получен!
              </>
            ) : authStatus === "error" ? (
              "Ошибка авторизации"
            ) : (
              "Получить токен"
            )}
          </button>
          {authStatus === "error" && (
            <p className="text-[11px] text-red-400 text-center">
              Неверный логин или пароль. Проверьте данные и попробуйте снова.
            </p>
          )}
        </div>
      </div>

      {/* Tutorial */}
      <button onClick={() => setShowTutorial(!showTutorial)} className="w-full py-2 rounded-lg text-[11px] font-medium transition-all flex items-center justify-center gap-1.5" style={{ background: "var(--surface-card)", border: "1px solid var(--border-base)" }}>
        <HiOutlineInformationCircle size={14} className="text-[#0077FF]" />
        <span style={{ color: "var(--text-subtle)" }}>{showTutorial ? "Скрыть инструкцию" : "Как получить Access Token вручную?"}</span>
      </button>
      {showTutorial && (
        <div className="rounded-lg p-3 space-y-2" style={{ background: "rgba(0,119,255,0.08)", border: "1px solid rgba(0,119,255,0.15)" }}>
          <p className="text-xs font-medium text-[#0077FF]">Как получить токен вручную:</p>
          <div className="space-y-1.5 text-[11px]" style={{ color: "var(--text-subtle)" }}>
            <p>1. Перейдите на <a href="https://vk.com/dev" target="_blank" rel="noopener noreferrer" className="text-[#0077FF] hover:underline font-medium">vk.com/dev</a></p>
            <p>2. Создайте Standalone-приложение</p>
            <p>3. Получите токен с правами audio</p>
            <p>4. Скопируйте токен и вставьте в поле выше</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ========== YOUTUBE PAGE ==========
export function YouTubePage() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-2xl p-4 border relative overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(255,0,0,0.12), rgba(255,0,0,0.02))", borderColor: "rgba(255,0,0,0.2)" }}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#FF0000", boxShadow: "0 4px 16px rgba(255,0,0,0.3)" }}>
            <svg viewBox="0 0 24 24" className="w-7 h-7" fill="white">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>YouTube</h2>
              <span className="px-2 py-0.5 rounded-md text-[11px] font-medium flex items-center gap-1" style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)", color: "#22C55E" }}>
                <IoCheckmark size={12} />
                Активно
              </span>
            </div>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-subtle)" }}>Поиск треков (воспроизведение через SoundCloud)</p>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="rounded-xl p-4" style={{ background: "var(--surface-card)", border: "1px solid var(--border-base)" }}>
        <div className="flex items-start gap-3">
          <HiOutlineInformationCircle size={20} className="text-[#FF0000] flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              Настройка не требуется
            </p>
            <p className="text-xs" style={{ color: "var(--text-subtle)" }}>
              YouTube работает автоматически с встроенным API ключом. Поиск осуществляется через YouTube, а воспроизведение через SoundCloud.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
