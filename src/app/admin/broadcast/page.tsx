"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminBroadcastPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetAll, setTargetAll] = useState(true);
  const [userId, setUserId] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => {
      if (d.user?.role !== "admin") { router.push("/admin/login"); return; }
      fetch("/api/admin/users", { cache: "no-store" }).then(r => r.json()).then(d => setUsers(Array.isArray(d) ? d.map((u: any) => ({ id: u.id, name: `${u.first_name} ${u.last_name}` })) : [])).catch(() => {});
    }).catch(() => router.push("/admin/login"));
  }, [router]);

  async function send() {
    if (!message.trim()) return;
    setSending(true);
    setResult(null);

    const res = await fetch("/api/admin/broadcast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, message, userId: targetAll ? undefined : userId }),
    });

    if (res.ok) {
      const data = await res.json();
      setResult(`تم الإرسال بنجاح${data.sent ? ` إلى ${data.sent} مستخدم` : ""}`);
      setTitle("");
      setMessage("");
    } else {
      setResult("فشل الإرسال");
    }
    setSending(false);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <section className="glass rounded-3xl p-6 md:p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="title">إرسال إشعار</h1>
            <p className="subtitle">إشعار جماعي أو لمستخدم محدد</p>
          </div>
          <button className="btn-secondary" onClick={() => router.push("/admin")}>العودة</button>
        </div>
      </section>

      <div className="mt-6 glass rounded-3xl p-6">
        <div className="mb-4 flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input type="radio" checked={targetAll} onChange={() => setTargetAll(true)} className="accent-indigo-500" />
            <span className="text-sm text-white/80">جميع المستخدمين</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" checked={!targetAll} onChange={() => setTargetAll(false)} className="accent-indigo-500" />
            <span className="text-sm text-white/80">مستخدم محدد</span>
          </label>
        </div>

        {!targetAll && (
          <select className="mb-4 h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-white outline-none focus:border-indigo-400/50" value={userId} onChange={(e) => setUserId(e.target.value)}>
            <option value="">اختر مستخدم</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        )}

        <input className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-white outline-none focus:border-indigo-400/50 mb-4" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="عنوان الإشعار (اختياري)" />

        <textarea className="min-h-[120px] w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-white outline-none focus:border-indigo-400/50" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="نص الإشعار" />

        {result && <div className="mt-4 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-100">{result}</div>}

        <button className="btn-primary mt-4 h-12 w-full" onClick={send} disabled={sending || !message.trim()}>
          {sending ? "جارٍ الإرسال..." : "إرسال الإشعار"}
        </button>
      </div>
    </div>
  );
}
