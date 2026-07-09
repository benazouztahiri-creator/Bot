"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminSettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings", { cache: "no-store" })
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((data) => { setSettings(data); setLoading(false); })
      .catch(() => router.push("/admin/login"));
  }, [router]);

  async function save() {
    setSaving(true);
    await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const fields = [
    { key: "tax_rate", label: "نسبة الضريبة (%)", type: "number" },
    { key: "warranty_days", label: "فترة الضمان (أيام)", type: "number" },
    { key: "bank_name", label: "اسم البنك", type: "text" },
    { key: "bank_account_holder", label: "صاحب الحساب البنكي", type: "text" },
    { key: "bank_iban", label: "IBAN", type: "text" },
    { key: "usdt_address", label: "عنوان USDT (TRC20)", type: "text" },
    { key: "payment_email", label: "الإيميل لإرسال الوصل", type: "email" },
  ];

  if (loading) return null;

  return (
    <div className="mx-auto max-w-2xl">
      <section className="glass rounded-3xl p-6 md:p-8">
        <h1 className="title">الإعدادات العامة</h1>
        <p className="subtitle">تعديل إعدادات الموقع.</p>
      </section>

      <div className="mt-6 glass rounded-3xl p-6">
        <div className="grid gap-5">
          {fields.map((f) => (
            <label key={f.key} className="grid gap-2">
              <span className="text-sm font-bold text-white/80">{f.label}</span>
              <input
                className="h-12 rounded-2xl border border-white/10 bg-white/5 px-4 text-white outline-none focus:border-indigo-400/50"
                type={f.type}
                value={settings[f.key] || ""}
                onChange={(e) => setSettings((s) => ({ ...s, [f.key]: e.target.value }))}
                step={f.type === "number" ? "0.01" : undefined}
              />
            </label>
          ))}
        </div>

        <button className="btn-primary mt-6 w-full" onClick={save} disabled={saving}>
          {saving ? "..." : saved ? "تم الحفظ!" : "حفظ الإعدادات"}
        </button>
      </div>
    </div>
  );
}
