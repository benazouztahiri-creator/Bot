"use client";

import Link from "next/link";
import NavNotificationBell from "@/components/NavNotificationBell";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useGlobalPortals } from "@/components/GlobalPortalContainer";

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

export default function HeaderNav() {
  const pathname = usePathname();
  const { openSideNav, setNotificationData, setUserId } = useGlobalPortals();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        setUserId(d.user?.id || null);
        // Update notification data
        if (d.user?.id) {
          fetch("/api/notifications", { cache: "no-store" })
            .then((r) => r.json())
            .then((data) => {
              const notifications: Notification[] = data.notifications || [];
              setNotificationData(() => ({
                notifications,
                unread: data.unread_count || 0,
                markAllRead: async () => {
                  await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
                  setNotificationData((prev) => ({
                    ...prev,
                    unread: 0,
                    notifications: prev.notifications.map((n: Notification) => ({ ...n, read: 1 })),
                  }));
                },
                deleteNotif: async (id: string, e: React.MouseEvent) => {
                  e.stopPropagation();
                  e.preventDefault();
                  await fetch("/api/notifications", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ notificationId: id }) });
                  setNotificationData((prev) => ({
                    ...prev,
                    notifications: prev.notifications.filter((n: Notification) => n.id !== id),
                    unread: Math.max(0, prev.unread - (prev.notifications.find((n: Notification) => n.id === id)?.read ? 0 : 1)),
                  }));
                },
              }));
            })
            .catch(() => {});
        }
      })
      .catch(() => setUserId(null));
  }, [pathname, setNotificationData, setUserId]);

  return (
    <div className="flex w-full items-center justify-between gap-4">
      <Link href="/" className="flex items-center gap-3 font-black tracking-tight">
        <img src="https://aisndkhxmhgtnfu9.public.blob.vercel-storage.com/WhatsApp%20Image%202026-07-04%20at%2011.25.00%20AM.jpeg" alt="Nexivo" className="h-9 w-9 rounded-2xl object-cover shadow-[0_10px_30px_rgba(2,6,23,0.18)]" />
        <span>Nexivo</span>
      </Link>

      <div className="flex items-center gap-2">
        <NavNotificationBell
          className="rounded-full px-3 py-2 font-bold text-white/80 hover:bg-white/5 hover:text-white"
        />
        <button
          onClick={openSideNav}
          aria-label="القائمة"
          className="rounded-full px-2 py-2 text-white/80 hover:bg-white/5 hover:text-white transition"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}
