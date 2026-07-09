"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";

type Notification = {
  id: string;
  user_id: string;
  order_id: string | null;
  type: string;
  title: string;
  message: string;
  icon: string;
  link: string;
  read: number;
  created_at: string;
  order_tracking_id: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  notifications: Notification[];
  unread: number;
  onMarkAllRead: () => void;
  onDeleteNotif: (id: string, e: React.MouseEvent) => void;
  triggerRef: React.RefObject<HTMLButtonElement>;
};

export default function NotificationDropdownPortal({
  open,
  onClose,
  notifications,
  unread,
  onMarkAllRead,
  onDeleteNotif,
  triggerRef,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, right: 0, isMobile: false });

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const isMobile = window.innerWidth < 768;
      
      if (isMobile) {
        setPosition({
          top: rect.bottom + 8,
          left: 0,
          right: 16,
          isMobile: true,
        });
      } else {
        setPosition({
          top: rect.bottom + 8,
          left: rect.left + rect.width / 2,
          right: 0,
          isMobile: false,
        });
      }
    }
  }, [open, triggerRef]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        const dropdown = document.getElementById('notification-dropdown');
        if (dropdown && !dropdown.contains(e.target as Node)) {
          onClose();
        }
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, onClose, triggerRef]);

  function getIcon(n: Notification) {
    if (n.icon) return n.icon;
    const icons: Record<string, string> = {
      new_order: "🛒", payment_confirmed: "✅", code_verified: "🔑",
      delivered: "📦", dispute_opened: "⚖️",
      dispute_resolved: "🤝", new_review: "⭐", wrong_code: "❌",
      admin_broadcast: "📢", admin: "📋",
    };
    return icons[n.type] || "🔔";
  }

  function getLink(n: Notification): string {
    if (n.link) return n.link;
    if (n.order_id) return `/orders/${n.order_id}`;
    return "#";
  }

  if (!mounted || !open) return null;

  return createPortal(
    <div
      id="notification-dropdown"
      className={`absolute z-[250] w-80 rounded-3xl border border-white/10 bg-zinc-900 p-4 shadow-[0_20px_60px_rgba(2,6,23,0.4)] animate-scale-in ${position.isMobile ? 'max-md:right-4 max-md:left-4 max-md:max-w-[calc(100vw-2rem)]' : ''}`}
      style={{
        top: `${position.top}px`,
        left: position.isMobile ? 'auto' : `${position.left}px`,
        right: position.isMobile ? `${position.right}px` : 'auto',
        transform: position.isMobile ? 'none' : 'translateX(-50%)',
      }}
    >
      {/* Notifications */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-black text-white">الإشعارات</span>
          {unread > 0 && (
            <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-300">
              {unread}
            </span>
          )}
        </div>
        {unread > 0 && (
          <button className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 shrink-0" onClick={onMarkAllRead}>
            تحديد الكل
          </button>
        )}
      </div>

      <div className="mt-3 grid max-h-60 gap-1 overflow-y-auto">
        {notifications.length === 0 && (
          <div className="py-6 text-center text-sm text-white/50">لا توجد إشعارات</div>
        )}
        {notifications.map((n) => (
          <Link key={n.id} href={getLink(n)} className={`group relative rounded-2xl p-3 text-sm transition hover:bg-white/5 ${n.read ? "opacity-40" : "bg-white/[0.03]"}`} onClick={onClose}>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 shrink-0 text-lg">{getIcon(n)}</span>
              <div className="min-w-0 flex-1">
                {n.title && <div className="font-bold text-white text-sm">{n.title}</div>}
                <div className="text-white/80 leading-5 line-clamp-2 text-xs">{n.message}</div>
                <div className="mt-0.5 text-[10px] text-white/40">{new Date(n.created_at).toLocaleString("ar-DZ")}</div>
              </div>
              <button className="shrink-0 opacity-0 group-hover:opacity-100 transition text-white/30 hover:text-rose-400 text-[10px] mt-1" onClick={(e) => onDeleteNotif(n.id, e)}>✕</button>
            </div>
          </Link>
        ))}
      </div>

      {notifications.length > 0 && (
        <Link href="/notifications" className="mt-1.5 block text-center text-xs font-bold text-indigo-400 hover:text-indigo-300" onClick={onClose}>
          عرض الكل
        </Link>
      )}
    </div>,
    document.body
  );
}
