import { useState, useEffect } from "react";
import { X, AlertCircle, CheckCircle, Info, WifiOff } from "lucide-react";
import { errorService, ErrorCategory } from "../../services/ErrorService";

interface ToastMessage {
  id: string;
  type: "error" | "success" | "info" | "warning";
  message: string;
  category?: ErrorCategory;
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const unsubscribe = errorService.subscribe((error) => {
      const toast: ToastMessage = {
        id: error.id,
        type: error.resolved ? "success" : "error",
        message: errorService.getUserFriendlyMessage(
          error.category,
          error.message
        ),
        category: error.category,
      };

      setToasts((prev) => [...prev, toast]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, 5000);
    });

    return unsubscribe;
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const getIcon = (type: ToastMessage["type"], category?: ErrorCategory) => {
    if (category === "network") return WifiOff;
    switch (type) {
      case "error":
        return AlertCircle;
      case "success":
        return CheckCircle;
      default:
        return Info;
    }
  };

  const getStyles = (type: ToastMessage["type"]) => {
    switch (type) {
      case "error":
        return {
          bg: "rgba(20, 20, 20, 0.85)",
          border: "rgba(239, 68, 68, 0.4)",
          shadow: "0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(239, 68, 68, 0.1) inset",
          iconColor: "#EF4444",
          backdrop: "blur(20px)",
        };
      case "success":
        return {
          bg: "rgba(20, 20, 20, 0.85)",
          border: "rgba(34, 197, 94, 0.4)",
          shadow: "0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(34, 197, 94, 0.1) inset",
          iconColor: "#22C55E",
          backdrop: "blur(20px)",
        };
      case "warning":
        return {
          bg: "rgba(20, 20, 20, 0.85)",
          border: "rgba(234, 179, 8, 0.4)",
          shadow: "0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(234, 179, 8, 0.1) inset",
          iconColor: "#EAB308",
          backdrop: "blur(20px)",
        };
      default:
        return {
          bg: "rgba(20, 20, 20, 0.85)",
          border: "rgba(139, 92, 246, 0.4)",
          shadow: "0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(139, 92, 246, 0.1) inset",
          iconColor: "#8B5CF6",
          backdrop: "blur(20px)",
        };
    }
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-32 right-6 z-50 flex flex-col gap-3 max-w-md">
      {toasts.map((toast) => {
        const Icon = getIcon(toast.type, toast.category);
        const styles = getStyles(toast.type);
        return (
          <div
            key={toast.id}
            className="toast flex items-center gap-4 px-5 py-4 rounded-2xl animate-slide-up border"
            style={{
              background: styles.bg,
              borderColor: styles.border,
              boxShadow: styles.shadow,
              backdropFilter: styles.backdrop,
              WebkitBackdropFilter: styles.backdrop,
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: `${styles.iconColor}25`,
                boxShadow: `0 4px 15px ${styles.iconColor}30, 0 0 0 1px ${styles.iconColor}20 inset`,
              }}
            >
              <Icon size={22} style={{ color: styles.iconColor }} />
            </div>
            <p className="text-[15px] font-medium text-white flex-1 leading-snug">
              {toast.message}
            </p>
            <button
              onClick={() => removeToast(toast.id)}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 hover:bg-white/10 flex-shrink-0"
              style={{ color: 'rgba(255,255,255,0.6)' }}
            >
              <X size={18} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export function showToast(
  message: string,
  type: "error" | "success" | "info" = "info"
) {
  console.log(`[TOAST ${type}]`, message);
}
