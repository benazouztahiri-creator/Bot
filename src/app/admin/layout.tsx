"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const navItems = [
  { href: "/admin", label: "لوحة القيادة", icon: "📊" },
  { href: "/admin/orders", label: "الطلبات", icon: "📋" },
  { href: "/admin/disputes", label: "النزاعات", icon: "⚖️" },
  { href: "/admin/users", label: "المستخدمين", icon: "👥" },
  { href: "/admin/products", label: "المنتجات", icon: "📦" },
  { href: "/admin/manual-review", label: "مراجعة يدوية", icon: "🔍" },
  { href: "/admin/unmatched-payments", label: "مدفوعات غير مطابقة", icon: "⚠️" },
  { href: "/admin/reports", label: "البلاغات", icon: "🚨" },
  { href: "/admin/security", label: "الأمان", icon: "🔒" },
  { href: "/admin/health", label: "صحة النظام", icon: "🩺" },
  { href: "/admin/email", label: "البريد", icon: "📧" },
  { href: "/admin/broadcast", label: "إشعار جماعي", icon: "📢" },
  { href: "/admin/audit-log", label: "سجل التدقيق", icon: "📜" },
  { href: "/admin/analytics", label: "التحليلات", icon: "📈" },
  { href: "/admin/settings", label: "الإعدادات", icon: "⚙️" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState({ pending_review: 0, open_disputes: 0, manual_review: 0, unmatched_payments: 0, total: 0 });

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(d => {
        if (d.user?.role !== "admin") router.push("/admin/login");
      })
      .catch(() => router.push("/admin/login"));
  }, [router]);

  useEffect(() => {
    fetch("/api/admin/notifications")
      .then(r => r.json())
      .then(setNotifications)
      .catch(() => {});
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    window.location.href = `/admin/users?q=${encodeURIComponent(searchQuery.trim())}`;
  }

  const totalAlerts = notifications.pending_review + notifications.open_disputes;

  return (
    <div className="flex min-h-screen flex-col">
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-10 flex h-14 items-center justify-between border-b border-white/10 bg-zinc-950/90 backdrop-blur-xl px-4">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-white text-xl">
          {sidebarOpen ? "✕" : "☰"}
        </button>
        <span className="text-sm font-black text-white">لوحة الإدارة</span>
        <div className="relative">
          <span className="text-lg">🔔</span>
          {totalAlerts > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white">
              {totalAlerts > 9 ? "9+" : totalAlerts}
            </span>
          )}
        </div>
      </div>

      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/60" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 right-0 z-50 h-full w-64 max-w-[calc(100vw-1.5rem)] border-l border-white/10 bg-zinc-950/95 backdrop-blur-xl transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex h-full flex-col p-5 pt-[calc(1.25rem+env(safe-area-inset-top))] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-lg font-black text-white">Nexivo</div>
              <div className="text-xs text-white/50">لوحة الإدارة</div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white/60 hover:text-white transition">✕</button>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="mb-4 shrink-0">
            <input
              className="h-10 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none focus:border-indigo-400/50 placeholder:text-white/30"
              placeholder="بحث سريع..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>

          <nav className="flex-1 overflow-y-auto overflow-x-hidden grid gap-1 pb-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
              const alertCount =
                item.href === "/admin/orders" ? notifications.pending_review :
                item.href === "/admin/disputes" ? notifications.open_disputes :
                item.href === "/admin/manual-review" ? notifications.manual_review :
                item.href === "/admin/unmatched-payments" ? notifications.unmatched_payments : 0;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-bold transition ${
                    isActive
                      ? "bg-indigo-500/20 text-indigo-200 border border-indigo-400/20"
                      : "text-white/70 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <span className="text-base shrink-0">{item.icon}</span>
                  <span className="flex-1 truncate">{item.label}</span>
                  {alertCount > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white shrink-0">
                      {alertCount}
                    </span>
                  )}
                </a>
              );
            })}
          </nav>

          <a href="/" className="shrink-0 flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold text-white/50 hover:text-white hover:bg-white/5 transition">
            <span>🏠</span>
            <span>العودة للمتجر</span>
          </a>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:mr-64 pt-14 lg:pt-6 p-4 md:p-6 max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  );
}
