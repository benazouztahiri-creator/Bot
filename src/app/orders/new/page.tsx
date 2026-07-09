"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { copyToClipboard } from "@/lib/clipboard";
import { useToast } from "@/components/ToastProvider";
import SuccessAnimation from "@/components/SuccessAnimation";
import { getGameSpec } from "@/lib/game-specs";
import TrustBadge from "@/components/TrustBadge";
import EscrowFlow from "@/components/EscrowFlow";

function NewOrderForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const productIdParam = searchParams.get("productId");

  const [user, setUser] = useState<any>(null);
  const [product, setProduct] = useState<any>(null);
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [transactionId, setTransactionId] = useState("");
  const [currency, setCurrency] = useState("DZD");
  const [settings, setSettings] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedBank, setCopiedBank] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (!data.user) { router.push("/login"); return; }
        setUser(data.user);
      })
      .catch(() => router.push("/login"));

    fetch("/api/settings", { cache: "no-store" })
      .then((r) => r.json())
      .then(setSettings)
      .catch(() => {});

    if (productIdParam) {
      fetch("/api/products", { cache: "no-store" })
        .then((r) => r.json())
        .then((data) => {
          const arr = Array.isArray(data) ? data : [];
          const found = arr.find((p: any) => p.id === productIdParam);
          if (found) setProduct(found);
        })
        .catch(() => {});
    } else {
      router.push("/");
    }
  }, [router, productIdParam]);

  async function uploadProof(file: File): Promise<string> {
    setUploading(true);
    setUploadProgress(0);
    const formData = new FormData();
    formData.append("file", file);
    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100));
    };
    await new Promise<void>((resolve, reject) => {
      xhr.onload = () => resolve();
      xhr.onerror = () => reject(new Error("Network error"));
      xhr.open("POST", "/api/upload-proof");
      xhr.send(formData);
    });
    if (xhr.status !== 200) throw new Error("فشل رفع الملف");
    const data = JSON.parse(xhr.responseText);
    return data.url;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const useNewFlow = !!transactionId.trim();

    if (!useNewFlow && !paymentProof) {
      setError("يرجى رفع إثبات الدفع أو إدخال Transaction ID للتحقق التلقائي");
      return;
    }

    setLoading(true);
    try {
      let proofUrl = "";
      if (paymentProof) {
        proofUrl = await uploadProof(paymentProof);
      }
      const orderData: any = { currency };
      if (useNewFlow) {
        orderData.transaction_id = transactionId.trim();
        orderData.payment_proof_file = proofUrl;
        orderData.payment_flow = "new";
      } else {
        orderData.payment_proof_file = proofUrl;
      }
      if (product) {
        orderData.product_id = product.id;
        orderData.product_type = product.product_type;
      } else {
        orderData.product_type = "account";
      }
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "فشل إنشاء الطلب" }));
        throw new Error(data.error || "فشل إنشاء الطلب");
      }
      const order = await res.json();
      toast("success", useNewFlow ? "تم إنشاء الطلب. سيتم التحقق من الدفع تلقائياً." : "تم إنشاء الطلب بنجاح.");
      setCreated(order.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل إنشاء الطلب");
    } finally {
      setLoading(false);
    }
  }

  const taxRate = parseFloat(settings?.tax_rate || "1");
  const totalAmount = product ? Math.round(product.price * (1 + taxRate / 100) * 100) / 100 : 0;

  if (created) {
    return (
      <div className="mx-auto max-w-lg pt-12">
        <section className="glass rounded-3xl p-6 md:p-10">
          <SuccessAnimation
            title="تم إنشاء الطلب 🎉"
            message="سيتم مراجعة إثبات الدفع من قبل الإدارة. سنخطرك عند التحديث."
            stats={[
              { label: "رقم الطلب", value: created.slice(-8).toUpperCase() },
              { label: "الحالة", value: "قيد المراجعة" },
            ]}
            primaryAction={() => router.push(`/orders/${created}`)}
            primaryLabel="عرض الطلب"
            secondaryAction={() => router.push("/orders")}
            secondaryLabel="طلباتي"
          />
        </section>
      </div>
    );
  }

  const spec = product ? getGameSpec(product.category) : null;

  return (
    <div className="mx-auto max-w-lg page-transition">
      <section className="glass rounded-3xl p-6 md:p-10">
        <h1 className="title">طلب جديد</h1>
        <p className="subtitle">قبل التأكيد، راجع ملخص الطلب.</p>

        {/* Order Summary */}
        {product && (
          <div className="mt-6 rounded-3xl border border-indigo-400/20 bg-indigo-500/5 p-5">
            <div className="flex items-center gap-3 mb-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/20 text-lg">🛡️</span>
              <div>
                <div className="text-sm font-bold text-white">ملخص الطلب</div>
                <div className="text-xs text-white/50">تمتع بالحماية الكاملة</div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3">
                <span className="text-sm text-white/70">المنتج</span>
                <span className="text-sm font-bold text-white">{product.title}</span>
              </div>

              {spec && product.attributes && (
                <div className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3">
                  <span className="text-sm text-white/70">القسم</span>
                  <span className="text-sm font-bold text-white">{spec.name}</span>
                </div>
              )}

              <div className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3">
                <span className="text-sm text-white/70">السعر</span>
                <span className="text-sm font-bold text-white">{product.price} {product.currency}</span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3">
                <span className="text-sm text-white/70">الضريبة ({taxRate}%)</span>
                <span className="text-sm font-bold text-amber-300">+{Math.round(product.price * taxRate / 100 * 100) / 100} {product.currency}</span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-indigo-500/10 px-4 py-3 border border-indigo-400/20">
                <span className="text-sm font-bold text-white">الإجمالي</span>
                <span className="text-lg font-black text-indigo-300">{totalAmount} {product.currency}</span>
              </div>
            </div>

            {/* Trust Protection */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <TrustBadge variant="shield" />
              <TrustBadge variant="dispute" />
            </div>
          </div>
        )}

        {/* Escrow Explanation */}
        {product && <div className="mt-4"><EscrowFlow compact /></div>}

        <form className="mt-6 grid gap-4" onSubmit={onSubmit}>
          <label className="grid gap-2">
            <span className="text-sm font-bold text-white/80">عملة الدفع</span>
            <div className="flex gap-2">
              <button type="button" className={currency === "DZD" ? "btn-primary flex-1" : "btn-secondary flex-1"} onClick={() => setCurrency("DZD")}>
                دينار (DZD)
              </button>
              <button type="button" className={currency === "USDT" ? "btn-primary flex-1" : "btn-secondary flex-1"} onClick={() => setCurrency("USDT")}>
                USDT
              </button>
            </div>
          </label>

          {currency === "DZD" && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
              <p className="font-bold text-white">تعليمات التحويل (CCP):</p>
              <div className="mt-2 grid gap-1">
                <p><span className="text-white">البنك:</span> {settings?.bank_name || "—"}</p>
                <p><span className="text-white">صاحب الحساب:</span> {settings?.bank_account_holder || "—"}
                  {settings?.bank_account_holder && settings.bank_account_holder !== "—" && (
                    <button type="button" className="btn-primary text-xs px-2 py-0.5 mr-2" onClick={() => {
                      copyToClipboard(settings.bank_account_holder);
                      setCopiedBank(true);
                      setTimeout(() => setCopiedBank(false), 2000);
                    }}>
                      {copiedBank ? "تم" : "نسخ"}
                    </button>
                  )}
                </p>
                <p><span className="text-white">IBAN:</span> <span dir="ltr">{settings?.bank_iban || "—"}</span></p>
              </div>
            </div>
          )}

          {currency === "DZD" && settings?.payment_email && settings.payment_email !== "—" && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
              <p className="font-bold text-white">أرسل الوصل على الإيميل:</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <p className="break-all text-white" dir="ltr">{settings.payment_email}</p>
                <button type="button" className="btn-primary text-xs px-3 py-1 shrink-0" onClick={() => {
                  copyToClipboard(settings.payment_email);
                  setCopiedEmail(true);
                  setTimeout(() => setCopiedEmail(false), 2000);
                }}>
                  {copiedEmail ? "تم" : "نسخ"}
                </button>
              </div>
            </div>
          )}

          {currency === "USDT" && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
              <p className="font-bold text-white">عنوان USDT (شبكة TRC20):</p>
              <p className="mt-2 text-white break-all" dir="ltr">{settings?.usdt_address || "—"}</p>
            </div>
          )}

          <div className="rounded-2xl border border-indigo-400/30 bg-indigo-500/10 p-4 text-sm text-white/80">
            <p className="font-bold text-indigo-200">🔄 التحقق التلقائي من الدفع</p>
            <p className="mt-1 text-xs text-white/60">
              بعد التحويل، سيتم التحقق من الدفع تلقائياً عبر البريد الإلكتروني دون الحاجة لمراجعة الإدارة.
            </p>
          </div>

          <label className="grid gap-2">
            <span className="text-sm font-bold text-white/80">Transaction ID (رقم المعاملة)</span>
            <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/5 px-4 py-3">
              <input
                className="w-full bg-transparent text-white outline-none text-sm"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="أدخل Transaction ID الموجود في الإيصال (للتحقق التلقائي)"
                dir="ltr"
              />
            </div>
            <span className="text-xs text-white/40">إذا أدخلت Transaction ID، سيتم التحقق من الدفع تلقائياً. يمكنك أيضاً رفع صورة الإيصال كدعم إضافي.</span>
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-bold text-white/80">صورة الإيصال (اختياري مع Transaction ID)</span>
            <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/5 px-4 py-3">
              <span className="text-sm text-white/70">
                {paymentProof ? paymentProof.name : "PDF, JPG, PNG"}
              </span>
              <button type="button" className="btn-secondary text-sm" onClick={() => document.getElementById("proof-input")?.click()}>
                تصفّح
              </button>
              <input id="proof-input" type="file" accept=".pdf,image/*" className="hidden" onChange={(e) => setPaymentProof(e.target.files?.[0] || null)} />
            </div>
            {uploading && (
              <div className="grid gap-1">
                <div className="text-xs text-white/60">جاري الرفع... {uploadProgress}%</div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-indigo-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}
          </label>

          {error && (
            <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm font-bold text-rose-100 animate-error-shake">
              <div className="font-bold">❌ خطأ</div>
              <div className="mt-1 text-rose-200">{error}</div>
            </div>
          )}

          <button className="btn-primary h-12 w-full" type="submit" disabled={loading || uploading || (!paymentProof && !transactionId.trim())}>
            {loading ? "جاري إنشاء الطلب..." : "✅ تأكيد الطلب"}
          </button>
        </form>
      </section>
    </div>
  );
}

export default function NewOrderPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-white/70">جاري التحميل...</div>}>
      <NewOrderForm />
    </Suspense>
  );
}
