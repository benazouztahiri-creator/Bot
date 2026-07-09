"use client";

import { createContext, useContext, useState, useCallback } from "react";

type ToastType = "success" | "error" | "info";

type Toast = {
  id: number;
  type: ToastType;
  message: string;
  exiting?: boolean;
};

type ToastContextType = {
  toast: (type: ToastType, message: string) => void;
};

const ToastContext = createContext<ToastContextType>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

let nextId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 250);
  }, []);

  const toast = useCallback((type: ToastType, message: string) => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      dismiss(id);
    }, 4000);
  }, [dismiss]);

  const colors: Record<ToastType, string> = {
    success: "border-emerald-400/30 bg-emerald-500/10 text-emerald-100",
    error: "border-rose-400/30 bg-rose-500/10 text-rose-100",
    info: "border-indigo-400/30 bg-indigo-500/10 text-indigo-100",
  };

  const icons: Record<ToastType, { icon: string; className: string }> = {
    success: { icon: "✓", className: "text-emerald-300" },
    error: { icon: "✗", className: "text-rose-300" },
    info: { icon: "ℹ", className: "text-indigo-300" },
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[1100] mx-auto flex max-w-lg flex-col gap-2 px-4" role="region" aria-label="الإشعارات">
        {toasts.map((t) => {
          const { icon, className } = icons[t.type];
          return (
            <div
              key={t.id}
              className={`pointer-events-auto cursor-pointer rounded-2xl border px-4 py-3 text-sm font-bold shadow-lg backdrop-blur-xl flex items-center gap-2 ${colors[t.type]} ${t.exiting ? "opacity-0 translate-y-[-10px] scale-95" : "opacity-100 translate-y-0 scale-100 animate-slide-up"} transition-all duration-250 ease-out`}
              onClick={() => dismiss(t.id)}
              role="alert"
            >
              <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/10 text-xs shrink-0 ${className}`}>
                {icon}
              </span>
              <span>{t.message}</span>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
