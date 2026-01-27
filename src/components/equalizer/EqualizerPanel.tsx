import { useState, useEffect, useRef } from "react";
import { X, RotateCcw, Save, Trash2 } from "lucide-react";
import { audioService } from "../../services/AudioService";
import type { EqualizerBand, EqualizerPreset } from "../../types";

// Частоты для 10-полосного эквалайзера
const FREQUENCIES = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

// Встроенные пресеты
const BUILT_IN_PRESETS: EqualizerPreset[] = [
  { id: "flat", name: "Обычный", bands: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], isCustom: false },
  { id: "bass", name: "Басы", bands: [8, 6, 4, 2, 0, 0, 0, 0, 0, 0], isCustom: false },
  { id: "treble", name: "Высокие", bands: [0, 0, 0, 0, 0, 2, 4, 6, 8, 8], isCustom: false },
  { id: "vocal", name: "Вокал", bands: [-2, -1, 0, 2, 4, 4, 3, 1, 0, -1], isCustom: false },
  { id: "rock", name: "Рок", bands: [5, 4, 3, 1, -1, 0, 2, 3, 4, 5], isCustom: false },
  { id: "pop", name: "Поп", bands: [2, 1, 0, 2, 4, 4, 2, 0, 1, 2], isCustom: false },
];

const STORAGE_KEY = "harmonix-eq-custom-presets";

interface EqualizerPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EqualizerPanel({ isOpen, onClose }: EqualizerPanelProps) {
  const [enabled, setEnabled] = useState(true);
  const [bands, setBands] = useState<number[]>([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const [customPresets, setCustomPresets] = useState<EqualizerPreset[]>([]);
  const [activePresetId, setActivePresetId] = useState<string>("flat");
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [presetName, setPresetName] = useState("");

  // Загрузка состояния при открытии
  useEffect(() => {
    if (!isOpen) return;
    
    // Загружаем кастомные пресеты
    loadCustomPresets();
    
    // Загружаем текущее состояние эквалайзера
    const currentBands = audioService.getEqBands();
    const isEnabled = audioService.isEqEnabled();
    
    setBands(currentBands);
    setEnabled(isEnabled);
    
    // Определяем активный пресет
    detectActivePreset(currentBands);
  }, [isOpen]);

  // Загрузка кастомных пресетов из localStorage
  const loadCustomPresets = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setCustomPresets(JSON.parse(saved));
      }
    } catch (error) {
      console.error("Failed to load custom presets:", error);
    }
  };

  // Определение активного пресета
  const detectActivePreset = (currentBands: number[]) => {
    const allPresets = [...BUILT_IN_PRESETS, ...customPresets];
    
    for (const preset of allPresets) {
      if (arraysEqual(preset.bands, currentBands)) {
        setActivePresetId(preset.id);
        return;
      }
    }
    
    setActivePresetId(""); // Кастомные настройки
  };

  // Сравнение массивов
  const arraysEqual = (a: number[], b: number[]): boolean => {
    return a.length === b.length && a.every((val, idx) => val === b[idx]);
  };

  // Переключение вкл/выкл
  const toggleEnabled = () => {
    const newEnabled = !enabled;
    setEnabled(newEnabled);
    audioService.setEqEnabled(newEnabled);
  };

  // Изменение полосы
  const handleBandChange = (index: number, value: number) => {
    if (!enabled) {
      setEnabled(true);
      audioService.setEqEnabled(true);
    }
    
    const newBands = [...bands];
    newBands[index] = value;
    setBands(newBands);
    
    audioService.setEqBand(index, value);
    setActivePresetId(""); // Теперь кастомные настройки
  };

  // Применение пресета
  const applyPreset = (presetId: string) => {
    const allPresets = [...BUILT_IN_PRESETS, ...customPresets];
    const preset = allPresets.find(p => p.id === presetId);
    
    if (!preset) return;
    
    // Для "Обычный" - выключаем эквалайзер
    if (presetId === "flat") {
      setEnabled(false);
      audioService.setEqEnabled(false);
    } else if (!enabled) {
      setEnabled(true);
      audioService.setEqEnabled(true);
    }
    
    setBands(preset.bands);
    audioService.applyEqPreset(preset.bands);
    setActivePresetId(presetId);
  };

  // Сброс к обычному
  const reset = () => {
    applyPreset("flat");
  };

  // Сохранение пресета
  const savePreset = () => {
    const name = presetName.trim();
    if (!name) return;
    
    // Проверка на дубликаты
    const allPresets = [...BUILT_IN_PRESETS, ...customPresets];
    if (allPresets.some(p => p.name.toLowerCase() === name.toLowerCase())) {
      alert("Пресет с таким именем уже существует");
      return;
    }
    
    const newPreset: EqualizerPreset = {
      id: `custom-${Date.now()}`,
      name,
      bands: [...bands],
      isCustom: true,
    };
    
    const updated = [...customPresets, newPreset];
    setCustomPresets(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    
    setActivePresetId(newPreset.id);
    setPresetName("");
    setShowSaveDialog(false);
  };

  // Удаление пресета
  const deletePreset = (presetId: string) => {
    const updated = customPresets.filter(p => p.id !== presetId);
    setCustomPresets(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    
    if (activePresetId === presetId) {
      applyPreset("flat");
    }
  };

  // Форматирование частоты
  const formatFreq = (freq: number): string => {
    return freq >= 1000 ? `${freq / 1000}k` : `${freq}`;
  };

  if (!isOpen) return null;

  const allPresets = [...BUILT_IN_PRESETS, ...customPresets];

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{
          background: "rgba(0, 0, 0, 0.9)",
          backdropFilter: "blur(20px)",
        }}
        onClick={onClose}
      >
        {/* Panel */}
        <div
          className="relative w-[600px] max-w-[95vw] max-h-[90vh] overflow-y-auto rounded-3xl p-8"
          style={{
            background: "#0a0a0a",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold" style={{ color: "#ffffff" }}>
                Эквалайзер
              </h2>
              <p className="text-sm mt-1" style={{ color: "rgba(255, 255, 255, 0.5)" }}>
                Настройте звучание
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Reset */}
              <button
                onClick={reset}
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform hover:scale-110"
                style={{
                  background: "rgba(255, 255, 255, 0.1)",
                  color: "#ffffff",
                }}
                title="Сбросить"
              >
                <RotateCcw size={18} />
              </button>
              
              {/* Toggle */}
              <button
                onClick={toggleEnabled}
                className="relative w-14 h-8 rounded-full transition-all"
                style={{
                  background: enabled ? "#ffffff" : "rgba(255, 255, 255, 0.2)",
                }}
                title={enabled ? "Выключить" : "Включить"}
              >
                <div
                  className="absolute top-1 w-6 h-6 rounded-full transition-all"
                  style={{
                    background: enabled ? "#000000" : "#ffffff",
                    left: enabled ? "calc(100% - 28px)" : "4px",
                  }}
                />
              </button>
              
              {/* Close */}
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform hover:scale-110"
                style={{
                  background: "rgba(255, 255, 255, 0.1)",
                  color: "#ffffff",
                }}
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Presets */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold" style={{ color: "rgba(255, 255, 255, 0.6)" }}>
                ПРЕСЕТЫ
              </span>
              <button
                onClick={() => setShowSaveDialog(true)}
                disabled={!enabled}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:scale-105 disabled:opacity-30 disabled:cursor-not-allowed"
                style={{
                  background: "#ffffff",
                  color: "#000000",
                }}
              >
                <Save size={14} className="inline mr-1" />
                Сохранить
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {allPresets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => applyPreset(preset.id)}
                  className="px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105 flex items-center gap-2"
                  style={{
                    background: activePresetId === preset.id ? "#ffffff" : "rgba(255, 255, 255, 0.1)",
                    color: activePresetId === preset.id ? "#000000" : "#ffffff",
                  }}
                >
                  {preset.name}
                  {preset.isCustom && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deletePreset(preset.id);
                      }}
                      className="w-5 h-5 rounded flex items-center justify-center hover:bg-red-500/30 transition-colors"
                    >
                      <Trash2 size={12} className="text-red-400" />
                    </button>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Bands */}
          <div
            className="p-6 rounded-2xl mb-6"
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              opacity: enabled ? 1 : 0.4,
              pointerEvents: enabled ? "auto" : "none",
            }}
          >
            <div className="flex justify-between items-end gap-3">
              {bands.map((gain, index) => (
                <div key={index} className="flex flex-col items-center gap-3 flex-1">
                  {/* Value */}
                  <div
                    className="text-xs font-bold px-2 py-1 rounded-lg min-w-[36px] text-center"
                    style={{
                      background: gain !== 0 ? "#ffffff" : "rgba(255, 255, 255, 0.15)",
                      color: gain !== 0 ? "#000000" : "rgba(255, 255, 255, 0.5)",
                    }}
                  >
                    {gain > 0 ? "+" : ""}{gain}
                  </div>
                  
                  {/* Slider */}
                  <input
                    type="range"
                    min="-12"
                    max="12"
                    step="1"
                    value={gain}
                    onChange={(e) => handleBandChange(index, parseInt(e.target.value))}
                    className="eq-slider"
                    style={{
                      height: "160px",
                      writingMode: "vertical-lr",
                      direction: "rtl",
                    }}
                  />
                  
                  {/* Frequency */}
                  <span
                    className="text-xs font-semibold"
                    style={{
                      color: gain !== 0 ? "#ffffff" : "rgba(255, 255, 255, 0.4)",
                    }}
                  >
                    {formatFreq(FREQUENCIES[index])}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center"
          style={{
            background: "rgba(0, 0, 0, 0.95)",
            backdropFilter: "blur(20px)",
          }}
          onClick={() => setShowSaveDialog(false)}
        >
          <div
            className="w-[400px] max-w-[90vw] rounded-2xl p-6"
            style={{
              background: "#0a0a0a",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-4" style={{ color: "#ffffff" }}>
              Сохранить пресет
            </h3>
            
            <input
              type="text"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && presetName.trim()) savePreset();
                if (e.key === "Escape") setShowSaveDialog(false);
              }}
              placeholder="Название пресета"
              className="w-full px-4 py-3 rounded-xl mb-4 outline-none"
              style={{
                background: "rgba(255, 255, 255, 0.1)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                color: "#ffffff",
              }}
              autoFocus
              maxLength={30}
            />
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="px-5 py-2.5 rounded-xl font-medium transition-transform hover:scale-105"
                style={{
                  background: "rgba(255, 255, 255, 0.1)",
                  color: "#ffffff",
                }}
              >
                Отмена
              </button>
              <button
                onClick={savePreset}
                disabled={!presetName.trim()}
                className="px-5 py-2.5 rounded-xl font-medium transition-transform hover:scale-105 disabled:opacity-30 disabled:cursor-not-allowed"
                style={{
                  background: "#ffffff",
                  color: "#000000",
                }}
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Styles */}
      <style>{`
        .eq-slider {
          -webkit-appearance: none;
          appearance: none;
          background: transparent;
          cursor: pointer;
          width: 100%;
        }
        
        .eq-slider::-webkit-slider-track {
          width: 4px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 999px;
        }
        
        .eq-slider::-moz-range-track {
          width: 4px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 999px;
        }
        
        .eq-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #ffffff;
          cursor: grab;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.5);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        
        .eq-slider::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 4px 16px rgba(255, 255, 255, 0.5);
        }
        
        .eq-slider::-webkit-slider-thumb:active {
          cursor: grabbing;
          transform: scale(1.1);
        }
        
        .eq-slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #ffffff;
          cursor: grab;
          border: none;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.5);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        
        .eq-slider::-moz-range-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 4px 16px rgba(255, 255, 255, 0.5);
        }
        
        .eq-slider::-moz-range-thumb:active {
          cursor: grabbing;
          transform: scale(1.1);
        }
      `}</style>
    </>
  );
}
