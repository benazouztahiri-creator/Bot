"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/Skeleton";

type Order = {
  id: string;
  order_tracking_id: string;
  product_type: "account" | "recharge";
  currency: string;
  product_price: number;
  total_amount: number;
  status: string;
  product_title: string | null;
  created_at: string;
};

const statusLabels: Record<string, { label: string; color: string }> = {
  awaiting_payment_proof: { label: "بانتظار إثبات الدفع", color: "text-yellow-300" },
  payment_under_review: { label: "قيد المراجعة", color: "text-yellow-300" },
  payment_rejected: { label: "مرفوض", color: "text-rose-300" },
  payment_confirmed_waiting_code: { label: "بانتظار الكود", color: "text-blue-300" },
  code_verified_deliver_now: { label: "تم التحقق من الكود", color: "text-indigo-300" },
  delivered: { label: "تم التسليم", color: "text-emerald-300" },
  disputed: { label: "نزاع", color: "text-rose-300" },

};

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (!data.user) {
          router.push("/login");
          return;
        }
        fetch("/api/orders", { cache: "no-store" })
          .then((r) => r.json())
          .then((data) => {
            setOrders(Array.isArray(data) ? data : []);
            setLoading(false);
          });
      })
      .catch(() => router.push("/login"));
  }, [router]);

  if (loading) {
    return (
      <div>
        <section className="glass rounded-3xl p-6 md:p-8">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="mt-3 h-5 w-48" />
        </section>
        <div className="mt-6 grid gap-4">
          <Skeleton className="h-28 rounded-3xl" />
          <Skeleton className="h-28 rounded-3xl" />
          <Skeleton className="h-28 rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="page-transition">
      <section className="glass rounded-3xl p-6 md:p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="title">طلباتي</h1>
            <p className="subtitle">عرض ومتابعة طلباتك.</p>
          </div>
          <button className="btn-primary" onClick={() => router.push("/orders/new")}>
            طلب جديد
          </button>
        </div>
      </section>

      <div className="mt-6 grid gap-4">
        {orders.map((order) => {
          const st = statusLabels[order.status] || { label: order.status, color: "text-white" };
          return (
            <div
              key={order.id}
              className="glass glass-hover rounded-3xl p-5 cursor-pointer"
              onClick={() => router.push(`/orders/${order.id}`)}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white/50">{order.order_tracking_id}</span>
                    <span className={`text-sm font-bold ${st.color}`}>{st.label}</span>
                  </div>
                  <h3 className="mt-2 text-lg font-black text-white">
                    {order.product_title || `${order.product_type === "account" ? "حساب" : "شحن"}`}
                  </h3>
                  <div className="mt-1 text-sm text-white/70">
                    {order.product_price} {order.currency}
                    {order.total_amount > order.product_price && (
                      <span className="mr-2 text-xs text-white/50">(شامل الضريبة: {order.total_amount})</span>
                    )}
                  </div>
                </div>
                <div className="text-left text-xs text-white/50">
                  {new Date(order.created_at).toLocaleDateString("ar-DZ")}
                </div>
              </div>
            </div>
          );
        })}

        {orders.length === 0 && (
          <div className="glass rounded-3xl p-6 text-center text-white/70">
            لا توجد طلبات بعد.
          </div>
        )}
      </div>
    </div>
  );
}
