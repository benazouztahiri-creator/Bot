"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Stats = {
  total_users: number;
  total_buyers: number;
  total_products: number;
  total_sales: number;
  total_profit: number;
  active_orders: number;
  open_disputes: number;
};

type Activity = {
  id: string;
  type: string;
  description: string;
  user_name: string;
  created_at: string;
};

const quickActions = [
  { href: "/admin/disputes", label: "مراجعة النزاعات", icon: "⚖️", desc: "نزاعات مفتوحة تحتاج لحل", color: "from-rose-500/20 to-rose-600/10 border-rose-400/20" },
  { href: "/admin/orders", label: "الطلبات المعلقة", icon: "⏳", desc: "مدفوعات بانتظار المراجعة", color: "from-amber-500/20 to-amber-600/10 border-amber-400/20" },
  { href: "/admin/reports", label: "البلاغات", icon: "🚨", desc: "بلاغات المستخدمين", color: "from-red-500/20 to-red-600/10 border-red-400/20" },
  { href: "/admin/users", label: "إدارة المستخدمين", icon: "👥", desc: "بحث وتعديل حسابات المستخدمين", color: "from-indigo-500/20 to-indigo-600/10 border-indigo-400/20" },
  { href: "/admin/products", label: "المنتجات", icon: "📦", desc: "إدارة منتجات المنصة", color: "from-cyan-500/20 to-cyan-600/10 border-cyan-400/20" },
];

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(d => {
        if (d.user?.role !== "admin") { router.push("/admin/login"); return; }
        Promise.all([
          fetch("/api/admin/stats", { cache: "no-store" }).then(r => r.json()).catch(() => ({ cards: {} })),
          fetch("/api/admin/activity", { cache: "no-store" }).then(r => r.json()).catch(() => []),
        ]).then(([statsData, activityData]) => {
          const c = statsData.cards || {};
          setStats({
            total_users: (c.buyers || 0) + (c.admins || 0),
            total_buyers: c.buyers || 0,
            total_products: c.products || 0,
            total_sales: c.total_sales || 0,
            total_profit: c.total_profit || 0,
            active_orders: (c.total_orders || 0) - (c.completed_orders || 0) - (c.cancelled_orders || 0),
            open_disputes: c.disputes || 0,
          });
          setActivities(Array.isArray(activityData) ? activityData.slice(0, 10) : []);
          setLoading(false);
        }).catch(() => setLoading(false));
      })
      .catch(() => router.push("/admin/login"));
  }, [router]);

  if (loading) {
    return (
      <div className="grid gap-6">
        <section className="glass rounded-3xl p-6 md:p-8">
          <div className="skeleton h-8 w-56" />
          <div className="skeleton mt-3 h-5 w-72" />
        </section>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton h-28 rounded-3xl" />)}
        </div>
      </div>
    );
  }

  const statCards = stats ? [
    { label: "إجمالي المستخدمين", value: stats.total_users, icon: "👥", color: "text-indigo-300" },
    { label: "المشترين", value: stats.total_buyers, icon: "🛒", color: "text-cyan-300" },
    { label: "المنتجات", value: stats.total_products, icon: "📦", color: "text-amber-300" },
    { label: "حجم المبيعات", value: stats.total_sales, icon: "💰", color: "text-emerald-300", isCurrency: true },
    { label: "الأرباح", value: stats.total_profit, icon: "📈", color: "text-indigo-300", isCurrency: true },
    { label: "الطلبات النشطة", value: stats.active_orders, icon: "📬", color: "text-blue-300" },
    { label: "النزاعات المفتوحة", value: stats.open_disputes, icon: "⚠️", color: "text-rose-300" },
  ] : [];

  return (
    <div className="grid gap-6">
      {/* Header */}
      <section className="glass rounded-3xl p-6 md:p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-sm font-bold text-emerald-300">
              <span>🛡️</span>
              <span>لوحة القيادة</span>
            </div>
            <h1 className="title mt-4">مرحباً بك في لوحة الإدارة</h1>
            <p className="subtitle">مركز قيادة منصة Nexivo — كل ما تحتاجه لإدارة المنصة في مكان واحد.</p>
          </div>
          <button className="btn-secondary" onClick={() => window.location.reload()}>تحديث</button>
        </div>
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="mb-4 text-lg font-black">إجراءات سريعة</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action, i) => (
            <button
              key={i}
              className={`rounded-2xl border bg-gradient-to-br ${action.color} p-5 text-right transition duration-200 hover:scale-[1.02] animate-slide-up-fade`}
              style={{ animationDelay: `${i * 80}ms` }}
              onClick={() => router.push(action.href)}
            >
              <div className="text-2xl">{action.icon}</div>
              <div className="mt-3 text-base font-black text-white">{action.label}</div>
              <div className="mt-1 text-xs text-white/60">{action.desc}</div>
            </button>
          ))}
        </div>
      </section>

      {/* Platform Statistics */}
      {statCards.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-sm font-black text-white/60">إحصائيات المنصة</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {statCards.map((s, i) => (
              <div
                key={i}
                className="glass rounded-3xl p-5 text-center animate-slide-up-fade"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="text-2xl">{s.icon}</div>
                <div className={`mt-2 text-2xl font-black ${s.color}`}>
                  {s.isCurrency ? `${Number(s.value).toFixed(2)}` : s.value.toLocaleString("ar-DZ")}
                </div>
                <div className="mt-1 text-xs text-white/60">{s.label}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Activity Feed */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-sm font-black text-white/60">آخر النشاطات</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>
        <div className="glass rounded-3xl p-5">
          {activities.length === 0 ? (
            <div className="py-8 text-center text-sm text-white/50">لا توجد نشاطات حديثة</div>
          ) : (
            <div className="grid gap-2">
              {activities.map((act) => (
                <div key={act.id} className="flex items-start gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                  <span className="mt-0.5 text-lg">
                    {act.type === "new_user" ? "👤" :
                     act.type === "new_product" ? "📦" :
                     act.type === "new_dispute" ? "⚖️" :
                     act.type === "new_order" ? "🛒" :
                     act.type === "order_completed" ? "🎉" : "🔔"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-white/90">{act.description || act.type}</div>
                    <div className="mt-0.5 text-xs text-white/50">
                      {act.user_name && <span>{act.user_name} • </span>}
                      <span>{new Date(act.created_at).toLocaleString("ar-DZ")}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
