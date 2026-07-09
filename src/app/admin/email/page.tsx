"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ToastProvider";
import { Skeleton } from "@/components/Skeleton";

export default function AdminEmailCenterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => {
      if (d.user?.role !== "admin") { router.push("/admin/login"); return; }
      setLoading(false);
    }).catch(() => router.push("/admin/login"));
  }, [router]);

  async function sendCustomEmail() {
    if (!email.trim() || !subject.trim() || !message.trim()) { toast("error", "املأ جميع الحقول"); return; }
    setSending(true);
    try {
      const res = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: subject, message, userId: email }),
      });
      if (res.ok) { toast("success", "تم الإرسال"); setEmail(""); setSubject(""); setMessage(""); }
      else toast("error", "فشل الإرسال");
    } catch { toast("error", "خطأ"); }
    setSending(false);
  }

  if (loading) return <div className="py-12 text-center text-white/60">جاري التحميل...</div>;

  return (
    <div>
      <section className="glass rounded-3xl p-6 md:p-8">
        <h1 className="title">مركز البريد</h1>
        <p className="subtitle">إرسال رسائل البريد الإلكتروني والإشعارات</p>
      </section>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {/* Custom Email */}
        <section className="glass rounded-3xl p-6">
          <h2 className="text-lg font-black mb-1">إرسال بريد مخصص</h2>
          <p className="text-sm text-white/60 mb-4">إرسال بريد إلكتروني لمستخدم محدد</p>
          <div className="grid gap-4">
            <label className="grid gap-1">
              <span className="text-sm font-bold text-white/80">البريد الإلكتروني</span>
              <input className="h-11 rounded-2xl border border-white/10 bg-white/5 px-4 text-white outline-none focus:border-indigo-400/50" placeholder="user@example.com" value={email} onChange={e => setEmail(e.target.value)} />
            </label>
            <label className="grid gap-1">
              <span className="text-sm font-bold text-white/80">العنوان</span>
              <input className="h-11 rounded-2xl border border-white/10 bg-white/5 px-4 text-white outline-none focus:border-indigo-400/50" placeholder="عنوان الرسالة" value={subject} onChange={e => setSubject(e.target.value)} />
            </label>
            <label className="grid gap-1">
              <span className="text-sm font-bold text-white/80">الرسالة</span>
              <textarea className="min-h-[120px] rounded-2xl border border-white/10 bg-white/5 p-4 text-white outline-none focus:border-indigo-400/50" placeholder="نص الرسالة..." value={message} onChange={e => setMessage(e.target.value)} />
            </label>
            <button className="btn-primary h-12" onClick={sendCustomEmail} disabled={sending}>
              {sending ? "جاري الإرسال..." : "📧 إرسال البريد"}
            </button>
          </div>
        </section>

        {/* Quick actions */}
        <section className="glass rounded-3xl p-6">
          <h2 className="text-lg font-black mb-1">إجراءات سريعة</h2>
          <p className="text-sm text-white/60 mb-4">إعادة إرسال وإدارة الرسائل</p>
          <div className="grid gap-3">
            <a className="btn-secondary w-full text-center" href="/admin/broadcast">
              📢 إرسال إشعار جماعي
            </a>
            <a className="btn-secondary w-full text-center" href="/admin/settings">
              ⚙️ إعدادات البريد
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
