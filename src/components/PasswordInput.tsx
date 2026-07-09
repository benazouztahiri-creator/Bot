"use client";

import { useState, type InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  containerClass?: string;
};

export default function PasswordInput({ containerClass = "", className = "", ...props }: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={`relative ${containerClass}`}>
      <input
        {...props}
        type={visible ? "text" : "password"}
        className={className}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-white/40 hover:text-white/80 transition"
        aria-label={visible ? "إخفاء" : "إظهار"}
      >
        {visible ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}