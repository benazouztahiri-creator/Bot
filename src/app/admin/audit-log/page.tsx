"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Log = {
  id: string;
  event_type: string;
  user_name: string;
  order_id: string | null;
  ip_address: string | null;
  details: string | null;
  created_at: string;
};

export default function AdminAuditLogPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/audit-log", { cache: "no-store" })
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((data) => { setLogs(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => router.push("/admin/login"));
  }, [router]);

  if (loading) return null;

  return (
    <div>
      <section className="glass rounded-3xl p-6 md:p-8">
        <h1 className="title">سجل التدقيق</h1>
        <p className="subtitle">جميع الأحداث في النظام.</p>
      </section>

      <div className="mt-6 glass rounded-3xl p-5">
        <div className="grid gap-2">
          {logs.map((log) => (
            <div key={log.id} className="rounded-2xl border border-white/5 bg-white/[0.02] p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-bold text-white">{log.event_type}</div>
                  <div className="mt-0.5 text-xs text-white/60">{log.details || "—"}</div>
                </div>
                <div className="shrink-0 text-left text-xs text-white/40">
                  <div>{log.user_name || "—"}</div>
                  <div>{new Date(log.created_at).toLocaleString("ar-DZ")}</div>
                  {log.ip_address && <div>IP: {log.ip_address}</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
