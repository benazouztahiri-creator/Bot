"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ToastProvider";
import { Skeleton } from "@/components/Skeleton";
import EmptyState from "@/components/EmptyState";

type Notification = {
  id: string;
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

const icons: Record<string, string> = {
  new_order: "🛒", payment_confirmed: "✅", code_verified: "🔑",
  delivered: "📦", dispute_opened: "⚖️",
  dispute_resolved: "🤝", new_review: "⭐", wrong_code: "❌",
  admin_broadcast: "📢", admin: "📋",
};

export default function NotificationsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((data) => {
      if (!data.user) { router.push("/login"); return; }
      loadNotifs();
    }).catch(() => router.push("/login"));
  }, [router]);

  async function loadNotifs() {
    const res = await fetch("/api/notifications", { cache: "no-store" });
    if (res.ok) { const data = await res.json(); setNotifications(data.notifications || []); }
    setLoading(false);
  }

  async function markAllRead() {
    const res = await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    if (res.ok) toast("success", "تم تحديد الكل كمقروء.");
    setNotifications((prev) => prev.map((n) => ({ ...n, read: 1 })));
  }

  async function deleteNotif(id: string) {
    const res = await fetch("/api/notifications", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ notificationId: id }) });
    if (res.ok) toast("success", "تم حذف الإشعار.");
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }

  async function deleteAll() {
    if (!confirm("حذف جميع الإشعارات؟")) return;
    const res = await fetch("/api/notifications", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ all: true }) });
    if (res.ok) toast("success", "تم حذف جميع الإشعارات.");
    setNotifications([]);
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl">
        <section className="glass rounded-3xl p-6 md:p-8">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="mt-3 h-5 w-48" />
        </section>
        <div className="mt-6 grid gap-3">
          <Skeleton className="h-24 rounded-3xl" />
          <Skeleton className="h-24 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="mx-auto max-w-2xl">
        <section className="glass rounded-3xl p-6 md:p-8">
          <h1 className="title">الإشعارات</h1>
          <p className="subtitle">ليس لديك أي إشعارات جديدة.</p>
        </section>
        <EmptyState
          icon="🔔"
          title="لا توجد إشعارات"
          description="عندما يصلك إشعار جديد، سيظهر هنا."
          action
          onAction={() => router.push("/")}
          actionLabel="العودة للتسوق"
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl page-transition">
      <section className="glass rounded-3xl p-6 md:p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="title">الإشعارات</h1>
            <p className="subtitle">{notifications.filter((n) => !n.read).length} غير مقروءة</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="btn-secondary" onClick={markAllRead}>تحديد الكل مقروء</button>
            <button className="btn-secondary" onClick={deleteAll}>حذف الكل</button>
            <button className="btn-secondary" onClick={() => router.push("/")}>العودة</button>
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-3">
        {notifications.map((n) => (
          <Link
            key={n.id}
            href={n.link || (n.order_id ? `/orders/${n.order_id}` : "#")}
            className={`glass rounded-3xl p-5 transition hover:bg-white/[0.07] group ${n.read ? "" : "border-r-2 border-indigo-400"}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/5 text-xl">
                  {n.icon || icons[n.type] || "🔔"}
                </span>
                <div className="min-w-0 flex-1">
                  {n.title && <div className="font-black text-white">{n.title}</div>}
                  <div className="text-sm text-white/80">{n.message}</div>
                  <div className="mt-2 flex items-center gap-3">
                    <span className="text-xs text-white/50">{new Date(n.created_at).toLocaleString("ar-DZ")}</span>
                    {n.order_id && (
                      <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-bold text-indigo-300">
                        عرض الطلب ←
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 items-start gap-2">
                {!n.read && <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-xs font-bold text-indigo-300 animate-fade-in">جديد</span>}
                <button className="text-white/20 hover:text-rose-400 transition text-sm" onClick={(e) => { e.preventDefault(); e.stopPropagation(); deleteNotif(n.id); }}>✕</button>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
