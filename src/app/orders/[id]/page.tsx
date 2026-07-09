"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { copyToClipboard } from "@/lib/clipboard";
import RatingStars from "@/components/RatingStars";
import { useToast } from "@/components/ToastProvider";
import { Skeleton } from "@/components/Skeleton";
import DisputeClarity from "@/components/DisputeClarity";
import SensitiveToggle from "@/components/SensitiveToggle";

type Order = {
  id: string;
  order_tracking_id: string;
  buyer_id: string;
  product_type: "account" | "recharge";
  currency: string;
  product_price: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  payment_proof_file: string;
  order_secret_code: string;
  delivery_data: string;
  delivery_date: string | null;
  warranty_end_date: string | null;
  status: string;
  created_at: string;
  buyer_name: string;
  product_title: string | null;
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

type SafeUser = {
  id: string;
  role: string;
  first_name: string;
};

const statusLabels: Record<string, { label: string; color: string }> = {
  awaiting_payment_proof: { label: "بانتظار إثبات الدفع", color: "text-yellow-300" },
  payment_under_review: { label: "قيد المراجعة", color: "text-yellow-300" },
  payment_rejected: { label: "مرفوض", color: "text-rose-300" },
  payment_confirmed_waiting_code: { label: "الكود: انسخه وأرسله للبائع", color: "text-blue-300" },
  code_verified_deliver_now: { label: "تم التحقق من الكود", color: "text-indigo-300" },
  delivered: { label: "تم التسليم", color: "text-emerald-300" },
  disputed: { label: "نزاع مفتوح", color: "text-rose-300" },

  waiting_for_payment: { label: "بانتظار الدفع", color: "text-yellow-300" },
  waiting_payment_verification: { label: "بانتظار التحقق من الدفع", color: "text-orange-300" },
  paid: { label: "تم الدفع", color: "text-emerald-300" },
};

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [user, setUser] = useState<SafeUser | null>(null);
  const [loading, setLoading] = useState(true);

  const [showDeliveryData, setShowDeliveryData] = useState(false);
  const [deliveryDataDecrypted, setDeliveryDataDecrypted] = useState("");
  const [deliveryDataLoading, setDeliveryDataLoading] = useState(false);
  const [copiedDelivery, setCopiedDelivery] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [copied, setCopied] = useState(false);
  const [codeToSend, setCodeToSend] = useState("");
  const [sendingCode, setSendingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatText, setChatText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [existingReview, setExistingReview] = useState<any>(null);
  const [sendingReview, setSendingReview] = useState(false);
  const [paymentTransactionId, setPaymentTransactionId] = useState("");
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [paymentSubmitError, setPaymentSubmitError] = useState("");

  useEffect(() => {
    if (order?.status === "disputed" || order?.status === "payment_confirmed_waiting_code") {
      fetch(`/api/order-chat/${params.id}`, { cache: "no-store" })
        .then((r) => r.ok ? r.json() : [])
        .then((data) => setChatMessages(Array.isArray(data) ? data : []))
        .catch(() => {});
    }
  }, [order?.status, params.id]);

  useEffect(() => {
    if (order?.status === "delivered" && user?.id && order?.buyer_id && user.id === order.buyer_id) {
      fetch(`/api/reviews?order_id=${order.id}`, { cache: "no-store" })
        .then((r) => r.ok ? r.json() : [])
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) setExistingReview(data[0]);
        })
        .catch(() => {});
    }
  }, [order?.status, order?.id, user?.id, order?.buyer_id]);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (!data.user) { router.push("/login"); return; }
        setUser(data.user);
        fetch(`/api/orders/${params.id}`, { cache: "no-store" })
          .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
          .then(setOrder)
          .catch(() => {})
          .finally(() => setLoading(false));
      })
      .catch(() => router.push("/login"));
  }, [router, params.id]);

  async function sendCodeToChat() {
    if (!codeToSend.trim()) return;
    setSendingCode(true);
    const res = await fetch(`/api/order-chat/${params.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: codeToSend }),
    });
    setSendingCode(false);
    if (res.ok) {
      setCodeSent(true);
      setCodeToSend("");
    }
  }

  async function sendChatMessage() {
    if (!chatText.trim()) return;
    const res = await fetch(`/api/order-chat/${params.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: chatText }),
    });
    if (res.ok) {
      setChatText("");
      const msg = await res.json();
      setChatMessages((prev) => [...prev, msg]);
    }
  }

  async function confirmPayment() {
    const res = await fetch(`/api/admin/orders/${params.id}/confirm`, { method: "POST" });
    if (res.ok) toast("success", "تم تأكيد الدفع.");
    else toast("error", "فشل تأكيد الدفع.");
    const orderRes = await fetch(`/api/orders/${params.id}`, { cache: "no-store" });
    if (orderRes.ok) setOrder(await orderRes.json());
  }

  async function rejectPayment() {
    if (!confirm("هل أنت متأكد؟ سيتم حظر المشتري.")) return;
    const res = await fetch(`/api/admin/orders/${params.id}/reject`, { method: "POST" });
    if (res.ok) toast("success", "تم رفض الدفع.");
    else toast("error", "فشل رفض الدفع.");
    const orderRes = await fetch(`/api/orders/${params.id}`, { cache: "no-store" });
    if (orderRes.ok) setOrder(await orderRes.json());
  }

  async function openDispute(reason?: string) {
    const r = reason || disputeReason;
    if (!r.trim()) return;
    const res = await fetch("/api/disputes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_id: params.id, reason: r }),
    });
    if (res.ok) {
      toast("success", "تم فتح النزاع.");
      setShowDisputeForm(false);
      setDisputeReason("");
      const orderRes = await fetch(`/api/orders/${params.id}`, { cache: "no-store" });
      if (orderRes.ok) setOrder(await orderRes.json());
    } else {
      toast("error", "فشل فتح النزاع.");
    }
  }

  function copyCode() {
    if (order?.order_secret_code) {
      copyToClipboard(order.order_secret_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function handleCopyDelivery() {
    copyToClipboard(deliveryDataDecrypted);
    setCopiedDelivery(true);
    setTimeout(() => setCopiedDelivery(false), 2000);
  }

  async function submitPaymentProof() {
    if (!paymentTransactionId.trim() || !paymentProofFile) {
      setPaymentSubmitError("يرجى إدخال Transaction ID ورفع صورة الإيصال");
      return;
    }
    setPaymentSubmitting(true);
    setPaymentSubmitError("");

    let proofUrl = "";
    try {
      const formData = new FormData();
      formData.append("file", paymentProofFile);
      const uploadRes = await fetch("/api/upload-proof", {
        method: "POST",
        body: formData,
      });
      if (!uploadRes.ok) {
        const errData = await uploadRes.json().catch(() => ({}));
        setPaymentSubmitError(errData.error || "فشل رفع الصورة");
        setPaymentSubmitting(false);
        return;
      }
      const uploadData = await uploadRes.json();
      proofUrl = uploadData.url;
    } catch {
      setPaymentSubmitError("فشل رفع الصورة. تحقق من الاتصال.");
      setPaymentSubmitting(false);
      return;
    }

    const res = await fetch(`/api/orders/${params.id}/submit-payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transaction_id: paymentTransactionId.trim(), payment_proof_file: proofUrl }),
    });

    setPaymentSubmitting(false);
    if (res.ok) {
      toast("success", "تم إرسال معلومات الدفع. في انتظار التحقق.");
      setPaymentTransactionId("");
      setPaymentProofFile(null);
      const orderRes = await fetch(`/api/orders/${params.id}`, { cache: "no-store" });
      if (orderRes.ok) setOrder(await orderRes.json());
    } else {
      const errData = await res.json().catch(() => ({}));
      setPaymentSubmitError(errData.error || "فشل إرسال معلومات الدفع");
    }
  }

  async function submitReview() {
    if (sendingReview) return;
    setSendingReview(true);
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_id: params.id, rating: reviewRating, comment: reviewComment }),
    });
    setSendingReview(false);
    if (res.ok) {
      const review = await res.json();
      setExistingReview(review);
      toast("success", "تم إرسال التقييم بنجاح.");
    } else {
      const data = await res.json();
      toast("error", data.error || "فشل إرسال التقييم");
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl">
        <section className="glass rounded-3xl p-6 md:p-8">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="mt-3 h-5 w-56" />
        </section>
        <div className="mt-6 grid gap-4">
          <section className="glass rounded-3xl p-5">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="mt-4 h-6 w-full" />
            <Skeleton className="mt-4 h-6 w-3/4" />
          </section>
        </div>
      </div>
    );
  }
  if (!order) {
    return (
      <div className="mx-auto max-w-2xl pt-12">
        <section className="glass rounded-3xl p-6 text-center md:p-10">
          <h1 className="title">الطلب غير موجود</h1>
          <button className="btn-secondary mt-4" onClick={() => router.push("/orders")}>طلباتي</button>
        </section>
      </div>
    );
  }

  const isBuyer = user?.id === order.buyer_id;
  const isAdmin = user?.role === "admin";
  const st = statusLabels[order.status] || { label: order.status, color: "text-white" };

  return (
    <div className="mx-auto max-w-2xl page-transition">
      <section className="glass rounded-3xl p-6 md:p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="title">تفاصيل الطلب</h1>
            <p className="subtitle">{order.order_tracking_id}</p>
          </div>
          <button className="btn-secondary" onClick={() => router.push("/orders")}>طلباتي</button>
        </div>
      </section>

      <div className="mt-6 grid gap-4">
        <section className="glass rounded-3xl p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="text-xs font-bold text-white/50">حالة الطلب</div>
              <div className={`mt-1 text-lg font-black ${st.color}`}>{st.label}</div>
            </div>
            <div>
              <div className="text-xs font-bold text-white/50">المنتج</div>
              <div className="mt-1 font-bold text-white">{order.product_title || "—"}</div>
            </div>
            <div>
              <div className="text-xs font-bold text-white/50">السعر الأصلي</div>
              <div className="mt-1 font-bold text-white">{order.product_price} {order.currency}</div>
            </div>
            <div>
              <div className="text-xs font-bold text-white/50">الضريبة ({order.tax_rate}%)</div>
              <div className="mt-1 font-bold text-white">{order.tax_amount} {order.currency}</div>
            </div>
            <div>
              <div className="text-xs font-bold text-white/50">السعر النهائي</div>
              <div className="mt-1 font-black text-indigo-300">{order.total_amount} {order.currency}</div>
            </div>
            <div>
              <div className="text-xs font-bold text-white/50">المشتري</div>
              <div className="mt-1 font-bold text-white">{order.buyer_name}</div>
            </div>
          </div>

          {(order.status === "payment_confirmed_waiting_code" || order.status === "paid") && isBuyer && order.order_secret_code && (
            <div className="mt-4 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4">
              <div className="text-xs font-bold text-white/50">الكود السري (أرسله للبائع)</div>
              <div className="mt-1 text-2xl font-black tracking-widest text-emerald-300" dir="ltr">
                <SensitiveToggle>{order.order_secret_code}</SensitiveToggle>
              </div>
              <button className="btn-primary mt-3" onClick={copyCode}>
                {copied ? "تم النسخ!" : "نسخ الكود"}
              </button>
            </div>
          )}

          {order.payment_proof_file && (
            <div className="mt-4">
              <button className="btn-secondary" onClick={() => {
                const reason = window.prompt("سبب فتح النزاع:");
                if (reason) openDispute(reason);
              }}>
                فتح نزاع
              </button>
            </div>
          )}

          {order.status === "waiting_for_payment" && isBuyer && (
            <div className="mt-6 rounded-2xl border border-indigo-400/30 bg-indigo-500/10 p-4">
              <h3 className="text-sm font-black text-white">تأكيد الدفع</h3>
              <p className="mt-1 text-xs text-white/60">بعد تحويل الأموال، قم برفع صورة الإيصال وإدخال Transaction ID</p>
              <div className="mt-4 grid gap-3">
                <label className="grid gap-1">
                  <span className="text-xs font-bold text-white/70">Transaction ID (رقم المعاملة)</span>
                  <input
                    className="h-11 rounded-2xl border border-white/10 bg-white/5 px-4 text-white outline-none focus:border-indigo-400/50"
                    value={paymentTransactionId}
                    onChange={(e) => setPaymentTransactionId(e.target.value)}
                    placeholder="أدخل Transaction ID من الإيصال"
                    dir="ltr"
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-xs font-bold text-white/70">صورة الإيصال</span>
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      className="block w-full text-sm text-white/70 file:mr-3 file:py-2 file:px-4 file:rounded-2xl file:border-0 file:bg-indigo-500/20 file:text-indigo-200 file:font-bold file:text-sm"
                      onChange={(e) => setPaymentProofFile(e.target.files?.[0] || null)}
                    />
                    {paymentProofFile && (
                      <span className="text-xs text-white/50 truncate max-w-[120px]">{paymentProofFile.name}</span>
                    )}
                  </div>
                </label>
                {paymentSubmitError && (
                  <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm font-bold text-rose-100">
                    {paymentSubmitError}
                  </div>
                )}
                <button
                  className="btn-primary h-12"
                  onClick={submitPaymentProof}
                  disabled={paymentSubmitting}
                >
                  {paymentSubmitting ? "جاري الإرسال..." : "لقد قمت بالدفع"}
                </button>
              </div>
            </div>
          )}

          {order.status === "waiting_payment_verification" && isBuyer && (
            <div className="mt-4 rounded-2xl border border-yellow-400/30 bg-yellow-500/10 p-4">
              <div className="text-sm font-bold text-yellow-200">في انتظار التحقق من الدفع</div>
              <p className="mt-1 text-xs text-white/60">
                سيتم التحقق من معلومات الدفع تلقائياً فور وصول إشعار التحويل عبر البريد الإلكتروني.
                يتم فحص البريد كل 5 دقائق. بمجرد تأكيد الدفع، سيتم إعلامك فوراً.
              </p>
              {order.transaction_id && (
                <div className="mt-2 rounded-xl bg-white/5 px-3 py-2 text-xs">
                  <span className="text-white/50">Transaction ID: </span>
                  <span className="text-white font-bold" dir="ltr">{order.transaction_id}</span>
                </div>
              )}
            </div>
          )}

          {order.status === "paid" && isBuyer && (
            <div className="mt-4 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4">
              <div className="flex items-center gap-2">
                <span className="text-lg">✅</span>
                <div className="text-sm font-bold text-emerald-200">تم تأكيد الدفع بنجاح</div>
              </div>
              <p className="mt-1 text-xs text-white/60">يمكنك الآن الاطلاع على الكود السري لإرساله للبائع.</p>
            </div>
          )}

          {order.status === "payment_under_review" && isAdmin && (
            <div className="mt-4 flex flex-wrap gap-2">
              <button className="btn-primary" onClick={confirmPayment}>تأكيد الدفع</button>
              <button className="btn-secondary" onClick={rejectPayment}>رفض</button>
            </div>
          )}

          {order.status === "delivered" && order.delivery_data && (
            <div className="mt-4">
              <div className="text-xs font-bold text-white/50">بيانات الحساب</div>
              {showDeliveryData ? (
                <div className="mt-2">
                  {deliveryDataLoading ? (
                    <div className="flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-6 text-white/50">
                      جاري فتح البيانات...
                    </div>
                  ) : deliveryDataDecrypted ? (
                    <>
                      <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-white/90 whitespace-pre-wrap">
                        {deliveryDataDecrypted}
                      </div>
                      <button className="btn-primary mt-2" onClick={() => handleCopyDelivery()}>
                        {copiedDelivery ? "تم النسخ!" : "نسخ البيانات"}
                      </button>
                    </>
                  ) : (
                    <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4 text-sm text-rose-200">
                      تعذر فتح البيانات
                    </div>
                  )}
                  <div className="mt-2 text-xs text-white/50">تم تسجيل فتح هذه البيانات في سجل التدقيق</div>
                </div>
              ) : (
                <button className="btn-primary mt-2" onClick={async () => {
                  setShowDeliveryData(true);
                  setDeliveryDataLoading(true);
                  const res = await fetch(`/api/orders/${order.id}/delivery-data`);
                  if (res.ok) {
                    const data = await res.json();
                    setDeliveryDataDecrypted(data.delivery_data);
                  }
                  setDeliveryDataLoading(false);
                }}>
                  عرض بيانات الحساب
                </button>
              )}
            </div>
          )}

          {order.warranty_end_date && (
            <div className="mt-4">
              <div className="text-xs font-bold text-white/50">ينتهي الضمان في</div>
              <div className="mt-1 font-bold text-white">
                {new Date(order.warranty_end_date).toLocaleDateString("ar-DZ")}
              </div>
            </div>
          )}

          {order.status === "disputed" && (
            <>
              <div className="mt-4">
                <DisputeClarity />
              </div>
              <div className="mt-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4">
              <div className="text-sm font-bold text-white/80">دردشة النزاع (الأدمن + البائع + المشتري)</div>
              <div className="mt-3 grid gap-3 max-h-60 overflow-y-auto">
                {chatMessages.length > 0 ? (
                  chatMessages.map((msg) => (
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
              <div className="mt-3 flex gap-2">
                <input
                  className="h-10 flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 text-white outline-none focus:border-indigo-400/50"
                  value={chatText}
                  onChange={(e) => setChatText(e.target.value)}
                  placeholder="اكتب رسالتك..."
                  onKeyDown={(e) => { if (e.key === "Enter") sendChatMessage(); }}
                />
                <button className="btn-primary" onClick={sendChatMessage}>إرسال</button>
              </div>
            </div>
            </>
          )}

          {order.status === "delivered" && isBuyer && (
            <div className="mt-4">
              {existingReview ? (
                <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4">
                  <div className="mb-2 text-sm font-bold text-white/80">تقييمك</div>
                  <RatingStars rating={existingReview.rating} size="md" />
                  {existingReview.comment && <div className="mt-2 text-sm text-white/70">{existingReview.comment}</div>}
                  <div className="mt-1 text-xs text-white/50">{new Date(existingReview.created_at).toLocaleString("ar-DZ")}</div>
                </div>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="mb-3 text-sm font-bold text-white/80">تقييم البائع</div>
                  <div className="flex items-center gap-2">
                    {[1,2,3,4,5].map((star) => (
                      <button key={star} onClick={() => setReviewRating(star)} className="text-2xl transition hover:scale-110">
                        {star <= reviewRating ? "⭐" : "☆"}
                      </button>
                    ))}
                  </div>
                  <textarea
                    className="mt-3 min-h-[60px] w-full rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-white outline-none focus:border-indigo-400/50"
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="أكتب تعليقاً (اختياري)"
                  />
                  <div className="mt-3 flex gap-2">
                    <button className="btn-primary" onClick={submitReview} disabled={sendingReview}>
                      {sendingReview ? "جاري الإرسال..." : "إرسال التقييم"}
                    </button>
                  </div>
                </div>
              )}
              {!existingReview && (
                <div className="mt-4">
                  {showDisputeForm ? (
                    <div className="grid gap-3">
                      <textarea
                        className="min-h-[80px] rounded-2xl border border-white/10 bg-white/5 p-4 text-white outline-none focus:border-rose-400/50"
                        value={disputeReason}
                        onChange={(e) => setDisputeReason(e.target.value)}
                        placeholder="سبب فتح النزاع..."
                      />
                      <div className="flex gap-2">
                        <button className="btn-primary" onClick={() => openDispute()}>فتح نزاع</button>
                        <button className="btn-secondary" onClick={() => setShowDisputeForm(false)}>إلغاء</button>
                      </div>
                    </div>
                  ) : (
                    <button className="btn-secondary" onClick={() => setShowDisputeForm(true)}>
                      فتح نزاع
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </section>

          {order.status === "payment_confirmed_waiting_code" && isBuyer && (
            <section className="glass rounded-3xl p-5">
              <h2 className="text-sm font-black text-white">إرسال الكود للبائع</h2>
              <p className="text-xs font-bold text-white/50">انسخ الكود من الأعلى وألصقه هنا لإرساله للبائع</p>
              <div className="mt-4 grid gap-3">
                <input
                  className="h-12 rounded-2xl border border-white/10 bg-white/5 px-4 text-white text-center text-2xl tracking-widest outline-none focus:border-indigo-400/50"
                  value={codeToSend}
                  onChange={(e) => setCodeToSend(e.target.value)}
                  placeholder="****"
                  dir="ltr"
                  maxLength={20}
                />
                {codeSent && (
                  <div className="text-sm font-bold text-emerald-300">تم إرسال الكود للبائع!</div>
                )}
                <button
                  className="btn-primary h-12"
                  onClick={sendCodeToChat}
                  disabled={sendingCode || !codeToSend.trim()}
                >
                  {sendingCode ? "جاري الإرسال..." : "إرسال الكود"}
                </button>
              </div>

              {chatMessages.length > 0 && (
                <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-sm font-bold text-white/80">الرسائل من البائع:</div>
                  <div className="mt-3 grid gap-3 max-h-60 overflow-y-auto">
                    {chatMessages.map((msg) => (
                      <div key={msg.id} className="rounded-2xl bg-indigo-500/20 p-3 text-white/90">
                        <div className="mb-1 text-xs font-bold text-white/60">{msg.sender_name || "مستخدم"}</div>
                        <div className="text-sm leading-7 whitespace-pre-wrap">{msg.text}</div>
                        <div className="mt-1 text-xs font-bold text-white/50">
                          {new Date(msg.created_at).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}
      </div>
    </div>
  );
}
