"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, Suspense } from "react";
import { useToast } from "@/components/ToastProvider";
import PasswordInput from "@/components/PasswordInput";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("كلمة المرور غير متطابقة.");
      return;
    }
    if (password.length < 6) {
      setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: "فشل إعادة التعيين." }));
      setError(data.error || "الرمز غير صالح أو منتهي الصلاحية.");
      return;
    }

    toast("success", "تم تغيير كلمة المرور بنجاح.");
    setSuccess(true);
  }

  if (!token) {
    return (
      <div className="mx-auto max-w-lg">
        <section className="glass rounded-3xl p-6 md:p-10 text-center">
          <h1 className="title">رابط غير صالح</h1>
          <p className="subtitle">الرابط الذي استخدمته غير صالح. يرجى طلب رابط جديد.</p>
        </section>
      </div>
    );
  }

  if (success) {
    return (
      <div className="mx-auto max-w-lg">
        <section className="glass rounded-3xl p-6 md:p-10 text-center">
          <h1 className="title">تم إعادة التعيين</h1>
          <p className="subtitle">تم تغيير كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول.</p>
          <a href="/login" className="btn-primary mt-4 inline-block px-6 py-3">تسجيل الدخول</a>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg page-transition">
      <section className="glass rounded-3xl p-6 md:p-10">
        <h1 className="title">إعادة تعيين كلمة المرور</h1>
        <p className="subtitle">أدخل كلمة المرور الجديدة.</p>

        <form className="mt-6 grid gap-4" onSubmit={onSubmit}>
          <label className="grid gap-2">
            <span className="text-sm font-bold text-white/80">كلمة المرور الجديدة</span>
            <PasswordInput
              className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-white outline-none focus:border-indigo-400/50"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-bold text-white/80">تأكيد كلمة المرور</span>
            <PasswordInput
              className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-white outline-none focus:border-indigo-400/50"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
            />
          </label>

          {error ? (
            <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm font-bold text-rose-100">
              {error}
            </div>
          ) : null}

          <button className={`btn-primary h-12 w-full ${loading ? "loading" : ""}`} type="submit" disabled={loading}>
            {loading ? "جاري تغيير كلمة المرور..." : "تغيير كلمة المرور"}
          </button>
        </form>
      </section>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-lg"><section className="glass rounded-3xl p-6 md:p-10"><p className="text-center text-white/60">جاري التحميل...</p></section></div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
