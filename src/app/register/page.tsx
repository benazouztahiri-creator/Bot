"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/ToastProvider";
import PasswordInput from "@/components/PasswordInput";

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!firstName || !lastName || !email || !password) {
      setError("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    if (password.length < 6) {
      setError("كلمة المرور يجب أن تكون 6 أحرف أو أكثر");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        role: "buyer",
        date_of_birth: dateOfBirth,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: "فشل التسجيل" }));
      setError(data.error || "فشل التسجيل");
      return;
    }

    toast("success", "تم إنشاء الحساب بنجاح! تحقق من بريدك الإلكتروني.");
    setRegistered(true);
  }

  if (registered) {
    return (
      <div className="mx-auto max-w-lg">
        <section className="glass rounded-3xl p-6 md:p-10">
          <h1 className="title">تم إنشاء الحساب!</h1>
          <div className="mt-4 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-100">
            تم إرسال رابط تأكيد إلى <span dir="ltr">{email}</span>. يرجى التحقق من بريدك الإلكتروني (بما في ذلك مجلد البريد المزعج) والنقر على الرابط لتفعيل حسابك.
          </div>
          <div className="mt-6 text-center">
            <a href="/login" className="btn-primary inline-block h-12 px-8 leading-[3rem]">
              تسجيل الدخول
            </a>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg page-transition">
      <section className="glass rounded-3xl p-6 md:p-10">
        <h1 className="title">إنشاء حساب جديد</h1>
        <p className="subtitle">سجّل للوصول إلى الطلبات والمتجر.</p>

        <form className="mt-6 grid gap-4" onSubmit={onSubmit}>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-bold text-white/80">الاسم الأول</span>
              <input
                className="h-12 rounded-2xl border border-white/10 bg-white/5 px-4 text-white outline-none focus:border-indigo-400/50"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="محمد"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-bold text-white/80">الاسم الأخير</span>
              <input
                className="h-12 rounded-2xl border border-white/10 bg-white/5 px-4 text-white outline-none focus:border-indigo-400/50"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="أحمد"
              />
            </label>
          </div>

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

          <label className="grid gap-2">
            <span className="text-sm font-bold text-white/80">تاريخ الميلاد (اختياري)</span>
            <input
              className="h-12 rounded-2xl border border-white/10 bg-white/5 px-4 text-white outline-none focus:border-indigo-400/50"
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
            />
          </label>

          {error && (
            <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm font-bold text-rose-100">
              {error}
            </div>
          )}

          <button className={`btn-primary h-12 w-full ${loading ? "loading" : ""}`} type="submit" disabled={loading}>
            {loading ? "جاري إنشاء الحساب..." : "إنشاء حساب"}
          </button>

          <div className="text-center text-sm text-white/60">
            لديك حساب بالفعل؟{" "}
            <a href="/login" className="font-bold text-indigo-300 hover:text-indigo-200">
              تسجيل دخول
            </a>
          </div>
        </form>
      </section>
    </div>
  );
}
