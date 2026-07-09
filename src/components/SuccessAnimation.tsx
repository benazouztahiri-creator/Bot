"use client";

import { useEffect, useState } from "react";

export default function SuccessAnimation({
  title,
  message,
  stats,
  primaryAction,
  primaryLabel,
  secondaryAction,
  secondaryLabel,
}: {
  title: string;
  message?: string;
  stats?: { label: string; value: string }[];
  primaryAction?: () => void;
  primaryLabel?: string;
  secondaryAction?: () => void;
  secondaryLabel?: string;
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center animate-fade-in-up">
      {/* Animated checkmark */}
      <div
        className={`flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 transition-all duration-500 ${
          show ? "scale-100 opacity-100" : "scale-0 opacity-0"
        }`}
      >
        <span className="text-4xl text-white animate-success-pop">✓</span>
      </div>

      {/* Sparkle particles */}
      {show && (
        <div className="relative">
          {[...Array(6)].map((_, i) => (
            <span
              key={i}
              className="absolute text-xs animate-fade-in-up"
              style={{
                left: `${Math.cos((i * 60 * Math.PI) / 180) * 60}px`,
                top: `${Math.sin((i * 60 * Math.PI) / 180) * 60}px`,
                animationDelay: `${i * 100}ms`,
                opacity: 0.6,
              }}
            >
              ✨
            </span>
          ))}
        </div>
      )}

      <h2 className="mt-6 text-2xl font-black text-white">{title}</h2>
      {message && <p className="mt-2 max-w-sm text-sm leading-7 text-white/70">{message}</p>}

      {/* Stats */}
      {stats && stats.length > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-3">
          {stats.map((s, i) => (
            <div
              key={i}
              className="animate-fade-in-up rounded-xl border border-white/10 bg-white/5 px-4 py-3"
              style={{ animationDelay: `${(i + 1) * 150}ms` }}
            >
              <div className="text-lg font-black text-indigo-300">{s.value}</div>
              <div className="mt-0.5 text-xs text-white/50">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      {(primaryAction || secondaryAction) && (
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {primaryAction && primaryLabel && (
            <button className="btn-primary px-8 py-3" onClick={primaryAction}>
              {primaryLabel}
            </button>
          )}
          {secondaryAction && secondaryLabel && (
            <button className="btn-secondary px-8 py-3" onClick={secondaryAction}>
              {secondaryLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
