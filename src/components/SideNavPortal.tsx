"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import NavDashboardLink from "@/components/NavDashboardLink";
import NavAuthButton from "@/components/NavAuthButton";

type Props = {
  userId?: string | null;
  open: boolean;
  onClose: () => void;
};

export default function SideNavPortal({ userId: propUserId, open, onClose }: Props) {
  const [mounted, setMounted] = useState(false);
  const [fetchedUserId, setFetchedUserId] = useState<string | null>(null);

  const userId = propUserId ?? fetchedUserId;

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (propUserId) return;
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setFetchedUserId(data?.user?.id ?? null))
      .catch(() => setFetchedUserId(null));
  }, [propUserId]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
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
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 z-[299] bg-black/60 animate-fade-in" onClick={onClose} />
      <div className="fixed top-0 bottom-0 right-0 z-[300] flex h-dvh w-72 max-w-[calc(100vw-1.5rem)] flex-col border-l border-white/10 bg-zinc-950/95 backdrop-blur-xl">
        <div className="flex items-center justify-between shrink-0 px-5 pt-4 pb-3">
          <span className="text-sm font-black text-white">القائمة</span>
          <button onClick={onClose} className="text-white/60 hover:text-white text-lg leading-none transition">✕</button>
        </div>

        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
          <div className="grid gap-1 mt-3">
            <Link href="/pubg" className="rounded-2xl px-4 py-3 font-bold text-white/80 hover:bg-white/5 hover:text-white transition" onClick={onClose}>
              PUBG
            </Link>
            <Link href="/free-fire" className="rounded-2xl px-4 py-3 font-bold text-white/80 hover:bg-white/5 hover:text-white transition" onClick={onClose}>
              Free Fire
            </Link>
            <Link href="/topup" className="rounded-2xl px-4 py-3 font-bold text-white/80 hover:bg-white/5 hover:text-white transition" onClick={onClose}>
              Top-up
            </Link>

            {userId && (
              <>
                <hr className="my-1 border-white/10" />
                <Link href={`/profile/${encodeURIComponent(userId)}`} className="rounded-2xl px-4 py-3 font-bold text-white/80 hover:bg-white/5 hover:text-white transition" onClick={onClose}>
                  الملف الشخصي
                </Link>
                <Link href="/settings" className="rounded-2xl px-4 py-3 font-bold text-white/80 hover:bg-white/5 hover:text-white transition" onClick={onClose}>
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
    </>,
    document.body
  );
}
