"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import NavDashboardLink from "@/components/NavDashboardLink";
import NavAuthButton from "@/components/NavAuthButton";

type Props = {
  userId?: string | null;
};

export default function SideNav({ userId }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) {
      document.addEventListener("keydown", handleKey);
      const prev = document.body.style.overflow;
      const prevPadding = document.body.style.paddingRight;
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "hidden";
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
      return () => {
        document.removeEventListener("keydown", handleKey);
        document.body.style.overflow = prev;
        document.body.style.paddingRight = prevPadding;
      };
    }
    return () => {
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <>
      <button onClick={() => setOpen(true)} aria-label="القائمة" className="rounded-full px-2 py-2 text-white/80 hover:bg-white/5 hover:text-white transition">
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-[299] bg-black/60 animate-fade-in" onClick={() => setOpen(false)} />
      )}

      <div
        className={`fixed inset-y-0 right-0 z-[300] flex w-72 max-w-[calc(100vw-1.5rem)] flex-col border-l border-white/10 bg-zinc-950/95 backdrop-blur-xl transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between shrink-0 px-5 pt-4 pb-3">
          <span className="text-sm font-black text-white">القائمة</span>
          <button onClick={() => setOpen(false)} className="text-white/60 hover:text-white text-lg leading-none transition">✕</button>
        </div>

        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 pb-[calc(1.25rem+env(safe-area-inset-bottom))] min-h-0">
          <div className="grid gap-1 min-h-full">
            <Link href="/pubg" className="rounded-2xl px-4 py-3 font-bold text-white/80 hover:bg-white/5 hover:text-white transition" onClick={() => setOpen(false)}>
              PUBG
            </Link>
            <Link href="/free-fire" className="rounded-2xl px-4 py-3 font-bold text-white/80 hover:bg-white/5 hover:text-white transition" onClick={() => setOpen(false)}>
              Free Fire
            </Link>
            <Link href="/topup" className="rounded-2xl px-4 py-3 font-bold text-white/80 hover:bg-white/5 hover:text-white transition" onClick={() => setOpen(false)}>
              Top-up
            </Link>

            {userId && (
              <>
                <hr className="my-1 border-white/10" />
                <Link href={`/profile/${encodeURIComponent(userId)}`} className="rounded-2xl px-4 py-3 font-bold text-white/80 hover:bg-white/5 hover:text-white transition" onClick={() => setOpen(false)}>
                  الملف الشخصي
                </Link>
                <Link href="/settings" className="rounded-2xl px-4 py-3 font-bold text-white/80 hover:bg-white/5 hover:text-white transition" onClick={() => setOpen(false)}>
                  الإعدادات
                </Link>
              </>
            )}

            <hr className="my-1 border-white/10" />
            <NavDashboardLink className="rounded-2xl px-4 py-3 font-bold text-white/80 hover:bg-white/5 hover:text-white transition" />
            <NavAuthButton className="rounded-2xl px-4 py-3 font-bold text-white/80 hover:bg-white/5 hover:text-white transition" />
          </div>
        </nav>
      </div>
    </>
  );
}
