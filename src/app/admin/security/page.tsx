"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/Skeleton";

type SecurityEvent = {
  id: string;
  event_type: string;
  user_name: string;
  email: string;
  ip_address: string;
  details: string;
  created_at: string;
};

export default function AdminSecurityPage() {
  const router = useRouter();
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => {
      if (d.user?.role !== "admin") { router.push("/admin/login"); return; }
      loadEvents();
    }).catch(() => router.push("/admin/login"));
  }, [router]);

  async function loadEvents() {
    const res = await fetch("/api/admin/audit-log", { cache: "no-store" });
    if (res.ok) setEvents(Array.isArray(await res.json()) ? await res.json() : []);
    setLoading(false);
  }

  const securityKeywords = ["login", "logout", "password", "ban", "delete", "email_verified", "promoted", "demoted"];
  const securityEvents = events.filter(e =>
    securityKeywords.some(k => e.event_type?.toLowerCase().includes(k))
  );

  const filtered = filter === "all" ? securityEvents : securityEvents.filter(e => e.event_type?.includes(filter));

  const stats = {
    total: securityEvents.length,
    logins: securityEvents.filter(e => e.event_type?.includes("login")).length,
    password_changes: securityEvents.filter(e => e.event_type?.includes("password")).length,
    bans: securityEvents.filter(e => e.event_type?.includes("ban")).length,
  };

  return (
    <div>
      <section className="glass rounded-3xl p-6 md:p-8">
        <h1 className="title">لوحة الأمان</h1>
        <p className="subtitle">أحداث الأمان، محاولات الدخول، والنشاطات المشبوهة</p>
      </section>

      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        <div className="glass rounded-3xl p-4 text-center">
          <div className="text-2xl">🔒</div>
          <div className="mt-1 text-xl font-black text-white">{stats.total}</div>
          <div className="text-xs text-white/50">إجمالي الأحداث</div>
        </div>
        <div className="glass rounded-3xl p-4 text-center">
          <div className="text-2xl">🔓</div>
          <div className="mt-1 text-xl font-black text-emerald-300">{stats.logins}</div>
          <div className="text-xs text-white/50">تسجيلات دخول</div>
        </div>
        <div className="glass rounded-3xl p-4 text-center">
          <div className="text-2xl">🔑</div>
          <div className="mt-1 text-xl font-black text-indigo-300">{stats.password_changes}</div>
          <div className="text-xs text-white/50">تغيير كلمة مرور</div>
        </div>
        <div className="glass rounded-3xl p-4 text-center">
          <div className="text-2xl">🔨</div>
          <div className="mt-1 text-xl font-black text-rose-300">{stats.bans}</div>
          <div className="text-xs text-white/50">حظر</div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {["all", "login", "logout", "password", "ban", "delete"].map(f => (
          <button key={f} className={filter === f ? "btn-primary" : "btn-secondary"} onClick={() => setFilter(f)}>
            {f === "all" ? "الكل" : f === "login" ? "تسجيل دخول" : f === "logout" ? "تسجيل خروج" : f === "password" ? "كلمة مرور" : f === "ban" ? "حظر" : "حذف"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="mt-6 grid gap-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-3xl" />)}</div>
      ) : (
        <div className="mt-6 glass rounded-3xl p-5">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-white/50">لا توجد أحداث أمان</div>
          ) : (
            <div className="grid gap-2">
              {filtered.map((e) => (
                <div key={e.id} className="flex items-start gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                  <span className="mt-0.5 text-lg">
                    {e.event_type?.includes("login") ? "🔓" :
                     e.event_type?.includes("logout") ? "🔒" :
                     e.event_type?.includes("password") ? "🔑" :
                     e.event_type?.includes("ban") ? "🔨" :
                     e.event_type?.includes("delete") ? "🗑️" : "🔔"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-white">{e.event_type}</div>
                    {e.details && <div className="mt-0.5 text-xs text-white/60">{e.details}</div>}
                    <div className="mt-1 flex flex-wrap gap-2 text-[10px] text-white/40">
                      <span>{e.user_name || "—"}</span>
                      {e.ip_address && <span>• IP: {e.ip_address}</span>}
                      <span>• {new Date(e.created_at).toLocaleString("ar-DZ")}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
