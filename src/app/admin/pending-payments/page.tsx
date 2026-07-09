"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/Skeleton";

type Order = {
  id: string;
  order_tracking_id: string;
  total_amount: number;
  currency: string;
  product_title: string;
  delivery_date: string;
};

export default function AdminPendingPaymentsPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadOrders(); }, []);

  async function loadOrders() {
    const res = await fetch("/api/admin/pending-payments", { cache: "no-store" });
    if (!res.ok) { router.push("/admin/login"); return; }
    const data = await res.json();
    setOrders(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  if (loading) {
    return (
      <div>
        <section className="glass rounded-3xl p-6 md:p-8">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="mt-3 h-5 w-72" />
        </section>
        <div className="mt-6 grid gap-4">
          <Skeleton className="h-28 rounded-3xl" />
          <Skeleton className="h-28 rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <section className="glass rounded-3xl p-6 md:p-8">
        <h1 className="title">المدفوعات المستحقة</h1>
        <p className="subtitle">لا توجد مدفوعات مستحقة حالياً.</p>
      </section>

      <div className="mt-6 grid gap-4">
        {orders.map((o) => (
          <div key={o.id} className="glass rounded-3xl p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-white/50">{o.order_tracking_id}</div>
                <h3 className="mt-1 font-bold text-white">{o.product_title}</h3>
                <div className="mt-1 text-sm text-white/70">المبلغ: {o.total_amount} {o.currency}</div>
              </div>
            </div>
          </div>
        ))}

        {orders.length === 0 && (
          <div className="glass rounded-3xl p-6 text-center text-white/70">لا توجد مدفوعات مستحقة.</div>
        )}
      </div>
    </div>
  );
}
