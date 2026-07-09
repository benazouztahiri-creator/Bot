"use client";

import { useEffect, useRef, useState } from "react";
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

type Props = {
  className?: string;
  userId?: string | null;
};

export default function NavNotificationBell({ className, userId }: Props) {
  const [unread, setUnread] = useState(0);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { notificationButtonRef, openNotification, notificationData } = useGlobalPortals();

  useEffect(() => {
    if (buttonRef.current) {
      notificationButtonRef.current = buttonRef.current;
    }
  }, [notificationButtonRef]);

  async function loadNotifs() {
    const res = await fetch("/api/notifications", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setUnread(data.unread_count || 0);
    }
  }

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          loadNotifs();
          const interval = setInterval(loadNotifs, 15000);
          return () => clearInterval(interval);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <button
      ref={buttonRef}
      className={`relative ${className || ""}`}
      onClick={openNotification}
      aria-label="الإشعارات"
    >
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
      {notificationData.unread > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
          {notificationData.unread > 9 ? "9+" : notificationData.unread}
        </span>
      )}
    </button>
  );
}