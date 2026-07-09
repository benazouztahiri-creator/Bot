"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SalesChart from "@/components/charts/SalesChart";
import { downloadCSV, downloadJSON } from "@/lib/export";

type Stats = {
  cards: Record<string, number>;
  charts: { daily_sales: { label: string; value: number }[] };
  top_products: { title: string; sales: number; revenue: number }[];
};

const periods = [
  { label: "اليوم", value: "today" },
  { label: "آخر 7 أيام", value: "week" },
  { label: "آخر 30 يوماً", value: "month" },
  { label: "هذا الشهر", value: "month" },
  { label: "هذه السنة", value: "year" },
  { label: "الكل", value: "all" },
];

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const [data, setData] = useState<Stats | null>(null);
  const [period, setPeriod] = useState("today");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => {
      if (d.user?.role !== "admin") { router.push("/admin/login"); return; }
      loadStats();
    }).catch(() => router.push("/admin/login"));
  }, [router]);

  useEffect(() => { if (data) loadStats(); }, [period]);

  async function loadStats() {
    const res = await fetch(`/api/admin/stats?period=${period}`, { cache: "no-store" });
    if (res.ok) setData(await res.json());
    setLoading(false);
  }

  if (loading) return null;

  const cards = data?.cards ? [
    { label: "إجمالي المبيعات", value: data.cards.total_sales, color: "text-emerald-300" },
    { label: "إجمالي الأرباح", value: data.cards.total_profit, color: "text-indigo-300" },
    { label: "عدد الطلبات", value: data.cards.total_orders, color: "text-blue-300" },
    { label: "مكتملة", value: data.cards.completed_orders, color: "text-emerald-300" },
    { label: "ملغاة", value: data.cards.cancelled_orders, color: "text-rose-300" },
    { label: "نزاعات", value: data.cards.disputes, color: "text-yellow-300" },
    { label: "المشترين", value: data.cards.buyers, color: "text-cyan-300" },
    { label: "المنتجات", value: data.cards.products, color: "text-pink-300" },
    { label: "العمولات", value: data.cards.total_commissions, color: "text-orange-300" },
    { label: "أموال محتجزة", value: data.cards.held_funds, color: "text-rose-300" },
  ] : [];

  return (
    <div>
      <section className="glass rounded-3xl p-6 md:p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="title">الإحصائيات</h1>
            <p className="subtitle">تحليلات المبيعات والأرباح</p>
          </div>
          <button className="btn-secondary" onClick={() => router.push("/admin")}>العودة</button>
        </div>
      </section>

      <div className="mt-4 flex flex-wrap gap-2">
        {periods.map((p) => (
          <button key={p.value} className={period === p.value ? "btn-primary" : "btn-secondary"} onClick={() => setPeriod(p.value)}>
            {p.label}
          </button>
        ))}
      </div>

      {data && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button className="btn-secondary" onClick={() => downloadCSV(data.cards ? Object.entries(data.cards).map(([k, v]) => ({ metric: k, value: v })) : [], `stats-${period}`)}>
            تصدير CSV
          </button>
          <button className="btn-secondary" onClick={() => downloadJSON(data, `stats-${period}`)}>
            تصدير JSON
          </button>
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="glass rounded-3xl p-5">
            <div className="text-xs font-bold text-white/50">{c.label}</div>
            <div className={`mt-2 text-2xl font-black ${c.color}`}>{c.value.toLocaleString()} DZD</div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {data?.charts?.daily_sales && (
          <SalesChart data={data.charts.daily_sales} title="المبيعات اليومية (آخر 30 يوم)" />
        )}

        <div className="glass rounded-3xl p-5">
          <div className="mb-4 text-sm font-black text-white/80">أفضل المنتجات</div>
          <div className="grid gap-3">
            {data?.top_products?.map((p, i) => (
              <div key={i} className="flex items-center justify-between rounded-2xl bg-white/5 p-3">
                <div>
                  <div className="font-bold text-white">{p.title}</div>
                  <div className="text-xs text-white/50">{p.sales} مبيعات</div>
                </div>
                <div className="font-black text-indigo-300">{p.revenue.toLocaleString()} DZD</div>
              </div>
            ))}
            {(!data?.top_products || data.top_products.length === 0) && (
              <div className="text-sm text-white/50">لا توجد بيانات</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
