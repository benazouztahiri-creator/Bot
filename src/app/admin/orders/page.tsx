"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { copyToClipboard } from "@/lib/clipboard";
import { downloadCSV } from "@/lib/export";
import { useToast } from "@/components/ToastProvider";
import { Skeleton } from "@/components/Skeleton";
import SensitiveToggle from "@/components/SensitiveToggle";

type Order = {
  id: string;
  order_tracking_id: string;
  buyer_name: string;
  product_title: string | null;
  product_type: "account" | "recharge";
  currency: string;
  product_price: number;
  total_amount: number;
  payment_proof_file: string;
  order_secret_code: string;
  status: string;
  created_at: string;
  transaction_id?: string;
  payment_proof_submitted_at?: string;
  matched_via_email?: number;
  auto_confirmed_at?: string;
};

type ChatMessage = {
  id: string;
  sender_id: string;
  sender_name: string;
  text: string;
  created_at: string;
};

const statusLabels: Record<string, string> = {
  awaiting_payment_proof: "بانتظار الإثبات",
  payment_under_review: "قيد المراجعة",
  payment_rejected: "مرفوض",
  payment_confirmed_waiting_code: "بانتظار الكود",
  code_verified_deliver_now: "تم التحقق من الكود",
  delivered: "تم التسليم",
  disputed: "نزاع",
  waiting_for_payment: "بانتظار الدفع",
  waiting_payment_verification: "بانتظار التحقق",
  paid: "تم الدفع",
};

export default function AdminOrdersPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showSecret, setShowSecret] = useState<string | null>(null);
  const [chatData, setChatData] = useState<Record<string, ChatMessage[]>>({});

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    const chatOrders = orders.filter((o) =>
      o.status === "payment_confirmed_waiting_code" || o.status === "disputed"
    );
    for (const order of chatOrders) {
      if (!chatData[order.id]) {
        fetch(`/api/order-chat/${order.id}`, { cache: "no-store" })
          .then((r) => r.ok ? r.json() : [])
          .then((data) => setChatData((prev) => ({ ...prev, [order.id]: Array.isArray(data) ? data : [] })))
          .catch(() => {});
      }
    }
  }, [orders]);

  async function loadOrders() {
    const res = await fetch("/api/admin/orders", { cache: "no-store" });
    if (!res.ok) {
      router.push("/admin/login");
      return;
    }
    const data = await res.json();
    setOrders(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function confirmPayment(orderId: string) {
    setActionLoading(orderId);
    const res = await fetch(`/api/admin/orders/${orderId}/confirm`, { method: "POST" });
    setActionLoading(null);
    if (res.ok) toast("success", "تم تأكيد الدفع.");
    else toast("error", "فشل تأكيد الدفع.");
    await loadOrders();
  }

  async function rejectPayment(orderId: string) {
    if (!confirm("هل أنت متأكد؟ سيتم حظر المشتري.")) return;
    setActionLoading(orderId);
    const res = await fetch(`/api/admin/orders/${orderId}/reject`, { method: "POST" });
    setActionLoading(null);
    if (res.ok) toast("success", "تم رفض الدفع.");
    else toast("error", "فشل رفض الدفع.");
    await loadOrders();
  }

  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  if (loading) {
    return (
      <div>
        <section className="glass rounded-3xl p-6 md:p-8">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="mt-3 h-5 w-56" />
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
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="title">إدارة الطلبات</h1>
            <p className="subtitle">مراجعة الطلبات وإدارة المدفوعات.</p>
          </div>
          <button className="btn-secondary" onClick={() => loadOrders()}>تحديث</button>
        </div>
      </section>

      <div className="mt-4 flex flex-wrap gap-2">
          {["all", "payment_under_review", "waiting_payment_verification", "payment_confirmed_waiting_code", "paid", "delivered", "disputed"].map((f) => (
          <button
            key={f}
            className={filter === f ? "btn-primary" : "btn-secondary"}
            onClick={() => setFilter(f)}
          >
            {f === "all" ? "الكل" : statusLabels[f] || f}
          </button>
        ))}
        {filtered.length > 0 && (
          <button className="btn-secondary" onClick={() => downloadCSV(filtered.map(o => ({
            tracking_id: o.order_tracking_id,
            product: o.product_title,
            buyer: o.buyer_name,
            total: o.total_amount,
            currency: o.currency,
            status: statusLabels[o.status] || o.status,
            created_at: o.created_at,
          })), "orders")}>
            تصدير CSV
          </button>
        )}
      </div>

      <div className="mt-6 grid gap-4">
        {filtered.map((order) => (
          <div key={order.id} className="glass rounded-3xl p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white/50">{order.order_tracking_id}</span>
                  <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-xs font-bold text-indigo-300">
                    {statusLabels[order.status] || order.status}
                  </span>
                </div>
                <h3 className="mt-2 font-bold text-white">{order.product_title || "—"}</h3>
                <div className="mt-1 text-sm text-white/70">
                  {order.buyer_name} | {order.total_amount} {order.currency}
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap gap-2">
                {order.payment_proof_file && (
                  <a
                    href={order.payment_proof_file}
                    target="_blank"
                    className="btn-secondary"
                  >
                    عرض الإثبات
                  </a>
                )}

                {(order.status === "payment_under_review" || order.status === "waiting_payment_verification") && (
                  <>
                    <button
                      className="btn-primary"
                      onClick={() => confirmPayment(order.id)}
                      disabled={actionLoading === order.id}
                    >
                      {actionLoading === order.id ? "جاري التنفيذ..." : "تأكيد الدفع"}
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => rejectPayment(order.id)}
                      disabled={actionLoading === order.id}
                    >
                      رفض
                    </button>
                  </>
                )}

                {(order.status === "payment_confirmed_waiting_code" || order.status === "code_verified_deliver_now") && (
                  <button
                    className="btn-secondary"
                    onClick={() => setShowSecret(showSecret === order.id ? null : order.id)}
                  >
                    {showSecret === order.id ? "إخفاء" : "عرض الكود"}
                  </button>
                )}

                {order.status === "payment_confirmed_waiting_code" && order.order_secret_code && (
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      copyToClipboard(order.order_secret_code);
                    }}
                  >
                    نسخ الكود
                  </button>
                )}

                {order.status === "disputed" && (
                  <>
                    <a href={`/orders/${order.id}`} className="btn-primary">
                      محادثة
                    </a>
                    <button
                      className="btn-secondary"
                      onClick={async () => {
                        if (!confirm("إغلاق النزاع مع استمرار الطلب؟")) return;
                        setActionLoading(order.id);
                        const res = await fetch("/api/disputes/resolve", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ order_id: order.id, resolution: "close" }),
                        });
                        setActionLoading(null);
                        if (res.ok) await loadOrders();
                      }}
                      disabled={actionLoading === order.id}
                    >
                      {actionLoading === order.id ? "جاري التنفيذ..." : "إغلاق النزاع"}
                    </button>
                  </>
                )}
              </div>
            </div>

            {order.status === "waiting_payment_verification" && order.transaction_id && (
              <div className="mt-4 rounded-2xl border border-yellow-400/30 bg-yellow-500/10 p-4">
                <div className="text-xs font-bold text-white/50">Transaction ID المقدم من المشتري</div>
                <div className="mt-1 font-bold text-white" dir="ltr">{order.transaction_id}</div>
                {order.payment_proof_submitted_at && (
                  <div className="mt-1 text-xs text-white/50">
                    تاريخ الإرسال: {new Date(order.payment_proof_submitted_at).toLocaleString("ar-DZ")}
                  </div>
                )}
              </div>
            )}

            {showSecret === order.id && order.order_secret_code && (
              <div className="mt-4 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4">
                <div className="text-xs font-bold text-white/50">الكود السري</div>
                <div className="mt-1 text-2xl font-black tracking-widest text-emerald-300" dir="ltr">
                  <SensitiveToggle>{order.order_secret_code}</SensitiveToggle>
                </div>
              </div>
            )}

            {order.status === "payment_confirmed_waiting_code" && (
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-sm font-bold text-white/80">أدخل الكود المرسل من المشتري:</div>
                {chatData[order.id] ? (
                  <div className="mt-3 grid gap-3">
                    {chatData[order.id].length > 0 ? (
                      chatData[order.id].map((msg) => (
                        <div key={msg.id} className="rounded-2xl bg-indigo-500/20 p-3 text-white/90">
                          <div className="mb-1 text-xs font-bold text-white/60">{msg.sender_name || "مستخدم"}</div>
                          <div className="text-sm leading-7 whitespace-pre-wrap">{msg.text}</div>
                          <div className="mt-1 text-xs font-bold text-white/50">
                            {new Date(msg.created_at).toLocaleString()}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="mt-2 text-sm text-white/50">لم يرسل المشتري الكود بعد.</div>
                    )}
                  </div>
                ) : (
                  <div className="mt-2 text-sm text-white/50">جاري التحميل...</div>
                )}
              </div>
            )}

            {order.status === "disputed" && (
              <div className="mt-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4">
                <div className="text-sm font-bold text-white/80">دردشة النزاع</div>
                {chatData[order.id] ? (
                  <div className="mt-3 grid gap-3 max-h-60 overflow-y-auto">
                    {chatData[order.id].length > 0 ? (
                      chatData[order.id].map((msg) => (
                        <div key={msg.id} className="rounded-2xl bg-indigo-500/20 p-3 text-white/90">
                          <div className="mb-1 text-xs font-bold text-white/60">{msg.sender_name || "مستخدم"}</div>
                          <div className="text-sm leading-7 whitespace-pre-wrap">{msg.text}</div>
                          <div className="mt-1 text-xs font-bold text-white/50">
                            {new Date(msg.created_at).toLocaleString()}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-white/50">لا توجد رسائل بعد.</div>
                    )}
                  </div>
                ) : (
                  <div className="mt-2 text-sm text-white/50">جاري التحميل...</div>
                )}
              </div>
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="glass rounded-3xl p-6 text-center text-white/70">لا توجد طلبات.</div>
        )}
      </div>

    </div>
  );
}
