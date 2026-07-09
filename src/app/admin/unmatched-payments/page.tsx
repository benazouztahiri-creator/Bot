"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ToastProvider";
import { Skeleton } from "@/components/Skeleton";

type PotentialOrder = {
  id: string;
  order_tracking_id: string;
  buyer_name: string;
  product_title: string;
  total_amount: number;
  currency: string;
  created_at: string;
};

type UnmatchedItem = {
  id: string;
  transaction_id: string;
  amount: number | null;
  currency: string;
  target_account: string;
  email_sender: string;
  email_subject: string;
  email_body: string;
  created_at: string;
  potential_orders: PotentialOrder[];
};

export default function AdminUnmatchedPaymentsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [items, setItems] = useState<UnmatchedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState<string | null>(null);
  const [dismissing, setDismissing] = useState<string | null>(null);

  useEffect(() => {
    loadItems();
  }, []);

  async function loadItems() {
    const res = await fetch("/api/admin/unmatched-payments", { cache: "no-store" });
    if (!res.ok) { router.push("/admin/login"); return; }
    const data = await res.json();
    setItems(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function resolveItem(itemId: string, orderId: string) {
    setResolving(itemId);
    const res = await fetch("/api/admin/unmatched-payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ unmatched_payment_id: itemId, selected_order_id: orderId }),
    });
    setResolving(null);
    if (res.ok) {
      toast("success", "تم ربط الدفع بالطلب وتأكيده");
      await loadItems();
    } else {
      const err = await res.json().catch(() => ({}));
      toast("error", err.error || "فشل تأكيد الدفع");
    }
  }

  async function dismissItem(itemId: string) {
    if (!confirm("هل أنت متأكد من تجاهل هذا الدفع غير المطابق؟")) return;
    setDismissing(itemId);
    const res = await fetch("/api/admin/unmatched-payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ unmatched_payment_id: itemId, notes: "تم التجاهل" }),
    });
    setDismissing(null);
    if (res.ok) {
      toast("success", "تم تجاهل الدفع");
      await loadItems();
    } else {
      toast("error", "فشل تجاهل الدفع");
    }
  }

  if (loading) {
    return (
      <div>
        <section className="glass rounded-3xl p-6 md:p-8">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="mt-3 h-5 w-72" />
        </section>
        <div className="mt-6 grid gap-4">
          <Skeleton className="h-40 rounded-3xl" />
          <Skeleton className="h-40 rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <section className="glass rounded-3xl p-6 md:p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="title">المدفوعات غير المطابقة</h1>
            <p className="subtitle">مدفوعات لم يتم العثور على طلب مطابق لها - يمكن ربطها يدوياً.</p>
          </div>
          <button className="btn-secondary" onClick={loadItems}>تحديث</button>
        </div>
      </section>

      <div className="mt-6 grid gap-4">
        {items.map((item) => (
          <div key={item.id} className="glass rounded-3xl p-5">
            <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4 mb-4">
              <div className="grid gap-2 md:grid-cols-2">
                <div>
                  <div className="text-xs font-bold text-white/50">Transaction ID</div>
                  <div className="mt-1 font-bold text-white" dir="ltr">{item.transaction_id || "—"}</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-white/50">المبلغ</div>
                  <div className="mt-1 font-bold text-white">{item.amount ?? "—"} {item.currency}</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-white/50">الحساب المستهدف</div>
                  <div className="mt-1 font-bold text-white" dir="ltr">{item.target_account || "—"}</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-white/50">تاريخ البريد</div>
                  <div className="mt-1 font-bold text-white">{new Date(item.created_at).toLocaleString("ar-DZ")}</div>
                </div>
              </div>
              {item.email_body && (
                <details className="mt-3">
                  <summary className="text-sm font-bold text-white/60 cursor-pointer">عرض نص البريد</summary>
                  <div className="mt-2 rounded-2xl bg-white/5 p-3 text-xs text-white/70 whitespace-pre-wrap max-h-40 overflow-y-auto" dir="ltr">
                    {item.email_body}
                  </div>
                </details>
              )}
            </div>

            {item.potential_orders && item.potential_orders.length > 0 && (
              <>
                <div className="text-sm font-bold text-white/70 mb-3">الطلبات المحتملة ({item.potential_orders.length})</div>
                {item.potential_orders.map((order) => (
                  <div key={order.id} className="rounded-2xl border border-white/10 bg-white/5 p-4 mb-2">
                    <div className="grid gap-2 md:grid-cols-2">
                      <div>
                        <div className="text-xs font-bold text-white/50">رقم الطلب</div>
                        <div className="mt-1 font-bold text-white">{order.order_tracking_id}</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white/50">المشتري</div>
                        <div className="mt-1 font-bold text-white">{order.buyer_name}</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white/50">المنتج</div>
                        <div className="mt-1 font-bold text-white">{order.product_title}</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white/50">المبلغ</div>
                        <div className="mt-1 font-bold text-white">{order.total_amount} {order.currency}</div>
                      </div>
                    </div>
                    <button
                      className="btn-primary mt-3"
                      onClick={() => resolveItem(item.id, order.id)}
                      disabled={resolving === item.id}
                    >
                      {resolving === item.id ? "جاري التنفيذ..." : "ربط بهذا الطلب"}
                    </button>
                  </div>
                ))}
              </>
            )}

            <div className="mt-3 flex gap-2">
              {(!item.potential_orders || item.potential_orders.length === 0) && (
                <div className="text-sm text-white/50">لا توجد طلبات مطابقة.</div>
              )}
              <button
                className="btn-secondary"
                onClick={() => dismissItem(item.id)}
                disabled={dismissing === item.id}
              >
                {dismissing === item.id ? "جاري التنفيذ..." : "تجاهل"}
              </button>
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <div className="glass rounded-3xl p-6 text-center text-white/70">لا توجد مدفوعات غير مطابقة.</div>
        )}
      </div>
    </div>
  );
}
