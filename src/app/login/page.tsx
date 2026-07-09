"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { useToast } from "@/components/ToastProvider";
import PasswordInput from "@/components/PasswordInput";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [verificationMsg, setVerificationMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showVerifyPrompt, setShowVerifyPrompt] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState<string | null>(null);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);

  useEffect(() => {
    const v = searchParams.get("verification");
    if (v === "success") {
      setVerificationMsg("تم تأكيد بريدك الإلكتروني بنجاح! يمكنك الآن تسجيل الدخول.");
    } else if (v === "invalid") {
      setVerificationMsg("رابط التأكيد غير صالح أو منتهي الصلاحية. يرجى طلب رابط جديد.");
    } else if (v === "failed") {
      setVerificationMsg("رابط التأكيد غير صالح.");
    } else if (v === "error") {
      setVerificationMsg("حدث خطأ أثناء تأكيد البريد. يرجى المحاولة مرة أخرى.");
    }
  }, [searchParams]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setShowVerifyPrompt(false);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: "بيانات الدخول غير صحيحة" }));
      setError(data.error || "بيانات الدخول غير صحيحة");
      return;
    }

    const data = await res.json();
    const role = data.user?.role;

    if (data.requires_verification) {
      setShowVerifyPrompt(true);
      toast("info", "يجب تأكيد بريدك الإلكتروني أولاً.");
      return;
    }

    toast("success", "تم تسجيل الدخول بنجاح.");
    if (role === "admin") {
      router.push("/admin");
    } else {
      router.push("/");
    }
  }

  async function handleResend() {
    setResending(true);
    setResendMsg(null);

    try {
      const res = await fetch("/api/auth/send-verification", {
        method: "POST",
      });

      if (res.ok) {
        setResendMsg("تم إرسال رابط التأكيد إلى بريدك الإلكتروني.");
      } else {
        const data = await res.json().catch(() => ({ error: "" }));
        setResendMsg(data.error || "فشل إرسال البريد. تحقق من إعدادات Resend.");
      }
    } catch {
      setResendMsg("فشل إرسال البريد. تحقق من اتصالك.");
    }

    setResending(false);
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    setForgotLoading(true);
    setForgotError(null);
    setForgotSent(false);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail || email }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "" }));
        setForgotError(data.error || "فشل إرسال البريد.");
        setForgotLoading(false);
        return;
      }

      setForgotSent(true);
    } catch {
      setForgotError("فشل إرسال البريد. تحقق من اتصالك.");
    }

    setForgotLoading(false);
  }

  return (
    <div className="mx-auto max-w-lg page-transition">
      <section className="glass rounded-3xl p-6 md:p-10">
        <h1 className="title">تسجيل دخول</h1>
        <p className="subtitle">أدخل بريدك الإلكتروني وكلمة المرور.</p>

        {verificationMsg ? (
          <div className="mt-4 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-100">
            {verificationMsg}
          </div>
        ) : null}

        {showVerifyPrompt ? (
          <div className="mt-4 grid gap-4">
            <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm font-bold text-amber-100">
              يجب عليك تأكيد بريدك الإلكتروني قبل استخدام الحساب. يرجى التحقق من بريدك الوارد (بما في ذلك مجلد البريد المزعج).
            </div>
            {resendMsg ? (
              <div className={`rounded-2xl border px-4 py-3 text-sm font-bold ${
                resendMsg.includes("تم") || resendMsg.includes("أرسل")
                  ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-100"
                  : "border-rose-400/30 bg-rose-500/10 text-rose-100"
              }`}>
                {resendMsg}
              </div>
            ) : null}
            <button
              className={`btn-secondary h-12 w-full ${resending ? "loading" : ""}`}
              onClick={handleResend}
              disabled={resending}
            >
              {resending ? "جاري الإرسال..." : "إعادة إرسال رابط التأكيد"}
            </button>
          </div>
        ) : null}

        {showForgot ? (
          <form className="mt-6 grid gap-4" onSubmit={handleForgotPassword}>
            <p className="text-sm font-bold text-white/80">أدخل بريدك الإلكتروني لإعادة تعيين كلمة المرور.</p>
            <label className="grid gap-2">
              <span className="text-sm font-bold text-white/80">البريد الإلكتروني</span>
              <input
                className="h-12 rounded-2xl border border-white/10 bg-white/5 px-4 text-white outline-none focus:border-indigo-400/50"
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="example@mail.com"
                required
              />
            </label>
            {forgotError ? (
              <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm font-bold text-rose-100">
                {forgotError}
              </div>
            ) : null}
            {forgotSent ? (
              <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-100">
                إذا كان البريد الإلكتروني مسجلاً، ستتلقى رابط إعادة التعيين.
              </div>
            ) : null}
            <button className={`btn-primary h-12 w-full ${forgotLoading ? "loading" : ""}`} type="submit" disabled={forgotLoading}>
              {forgotLoading ? "جاري الإرسال..." : "إرسال رابط إعادة التعيين"}
            </button>
            <button
              type="button"
              className="text-center text-sm text-indigo-300 hover:text-indigo-200"
              onClick={() => { setShowForgot(false); setForgotError(null); setForgotSent(false); }}
            >
              العودة إلى تسجيل الدخول
            </button>
          </form>
        ) : (
          <form className="mt-6 grid gap-4" onSubmit={onSubmit}>
            <label className="grid gap-2">
              <span className="text-sm font-bold text-white/80">البريد الإلكتروني</span>
              <input
                className="h-12 rounded-2xl border border-white/10 bg-white/5 px-4 text-white outline-none focus:border-indigo-400/50"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@mail.com"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-bold text-white/80">كلمة المرور</span>
              <PasswordInput
                className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-white outline-none focus:border-indigo-400/50"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </label>

            <div className="text-left">
              <button
                type="button"
                className="text-sm font-bold text-indigo-300 hover:text-indigo-200"
                onClick={() => { setShowForgot(true); setForgotEmail(email); }}
              >
                نسيت كلمة السر؟
              </button>
            </div>

            {error ? (
              <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm font-bold text-rose-100">
                {error}
              </div>
            ) : null}

            <button className={`btn-primary h-12 w-full ${loading ? "loading" : ""}`} type="submit" disabled={loading}>
              {loading ? "جاري تسجيل الدخول..." : "دخول"}
            </button>

            <div className="text-center text-sm text-white/60">
              ليس لديك حساب؟{" "}
              <a href="/register" className="font-bold text-indigo-300 hover:text-indigo-200">
                إنشاء حساب
              </a>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-lg"><section className="glass rounded-3xl p-6 md:p-10"><p className="text-center text-white/60">جاري التحميل...</p></section></div>}>
      <LoginForm />
    </Suspense>
  );
}
