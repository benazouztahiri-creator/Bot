"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/ToastProvider";
import PasswordInput from "@/components/PasswordInput";

export default function AdminLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    setLoading(false);

    if (!res.ok) {
      toast("error", "بيانات الدخول غير صحيحة");
      setError("بيانات الدخول غير صحيحة");
      return;
    }

    toast("success", "تم تسجيل الدخول.");
    router.push("/admin");
  }

  return (
    <div className="mx-auto max-w-lg page-transition">
      <section className="glass rounded-3xl p-6 md:p-10">
        <h1 className="title">تسجيل دخول الأدمن</h1>
        <p className="subtitle">أدخل البريد الإلكتروني وكلمة المرور للوصول إلى لوحة التحكم.</p>

        <form className="mt-6 grid gap-4" onSubmit={onSubmit}>
          <label className="grid gap-2">
            <span className="text-sm font-bold text-white/80">البريد الإلكتروني</span>
            <input
              className="h-12 rounded-2xl border border-white/10 bg-white/5 px-4 text-white outline-none focus:border-indigo-400/50"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
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

          {error ? <div className="text-sm font-bold text-rose-300">{error}</div> : null}

          <button className={`btn-primary h-12 w-full ${loading ? "loading" : ""}`} type="submit" disabled={loading}>
            {loading ? "جاري تسجيل الدخول..." : "دخول"}
          </button>
        </form>
      </section>
    </div>
  );
}
