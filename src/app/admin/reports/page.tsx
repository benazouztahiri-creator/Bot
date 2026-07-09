"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ToastProvider";
import { Skeleton } from "@/components/Skeleton";

type Report = {
  id: string;
  reporter_name: string;
  reported_user_name: string;
  report_type: string;
  description: string;
  evidence: string;
  status: string;
  created_at: string;
};

export default function AdminReportsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => {
      if (d.user?.role !== "admin") { router.push("/admin/login"); return; }
      loadReports();
    }).catch(() => router.push("/admin/login"));
  }, [router]);

  async function loadReports() {
    const res = await fetch("/api/admin/reports", { cache: "no-store" }).catch(() => null);
    if (res?.ok) setReports(Array.isArray(await res.json()) ? await res.json() : []);
    setLoading(false);
  }

  async function handleAction(reportId: string, action: string) {
    const note = prompt("ملاحظة:");
    if (note === null) return;
    setActionLoading(reportId);
    const res = await fetch(`/api/admin/reports/${reportId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, note }),
    });
    setActionLoading(null);
    if (res.ok) toast("success", "تم تحديث البلاغ");
    else toast("error", "فشل");
    await loadReports();
  }

  const filtered = filter === "all" ? reports : reports.filter(r => r.status === filter);

  return (
    <div>
      <section className="glass rounded-3xl p-6 md:p-8">
        <h1 className="title">مركز البلاغات</h1>
        <p className="subtitle">إدارة بلاغات المستخدمين</p>
      </section>

      <div className="mt-4 flex flex-wrap gap-2">
        {["all", "open", "resolved", "dismissed"].map(f => (
          <button key={f} className={filter === f ? "btn-primary" : "btn-secondary"} onClick={() => setFilter(f)}>
            {f === "all" ? "الكل" : f === "open" ? "مفتوح" : f === "resolved" ? "تم الحل" : "مرفوض"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="mt-6 grid gap-4">{[1,2].map(i => <Skeleton key={i} className="h-28 rounded-3xl" />)}</div>
      ) : (
        <div className="mt-6 grid gap-4">
          {filtered.map((r) => (
            <div key={r.id} className="glass rounded-3xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-rose-500/20 px-2.5 py-0.5 text-xs font-bold text-rose-300">{r.report_type}</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      r.status === "open" ? "bg-amber-500/20 text-amber-300" :
                      r.status === "resolved" ? "bg-emerald-500/20 text-emerald-300" :
                      "bg-white/10 text-white/50"
                    }`}>{r.status === "open" ? "مفتوح" : r.status === "resolved" ? "تم الحل" : "مرفوض"}</span>
                  </div>
                  <div className="mt-2 text-sm text-white/80"><span className="font-bold text-white">مبلغ:</span> {r.reporter_name}</div>
                  <div className="text-sm text-white/80"><span className="font-bold text-white">ضد:</span> {r.reported_user_name || "—"}</div>
                  <div className="mt-2 rounded-xl bg-white/5 p-3 text-sm leading-7 text-white/70">{r.description}</div>
                  {r.evidence && (
                    <a href={r.evidence} target="_blank" className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-indigo-300 hover:text-indigo-200">
                      📎 عرض الأدلة
                    </a>
                  )}
                  <div className="mt-1 text-xs text-white/40">{new Date(r.created_at).toLocaleString("ar-DZ")}</div>
                </div>
                {r.status === "open" && (
                  <div className="flex shrink-0 flex-col gap-2">
                    <button className="btn-primary text-sm" onClick={() => handleAction(r.id, "resolve")} disabled={actionLoading === r.id}>حل البلاغ</button>
                    <button className="btn-secondary text-sm" onClick={() => handleAction(r.id, "dismiss")} disabled={actionLoading === r.id}>رفض</button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div className="py-12 text-center text-sm text-white/50">لا توجد بلاغات</div>}
        </div>
      )}
    </div>
  );
}
