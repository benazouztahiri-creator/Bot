"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useToast } from "@/components/ToastProvider";
import { Skeleton } from "@/components/Skeleton";
import SensitiveToggle from "@/components/SensitiveToggle";

type UserDetail = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  email_verified: number;
  banned: number;
  id_file_path: string;
  date_of_birth: string;
  created_at: string;
};

export default function AdminUserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(d => {
        if (d.user?.role !== "admin") { router.push("/admin/login"); return; }
        fetch(`/api/admin/users/${params.id}`, { cache: "no-store" })
          .then(r => r.ok ? r.json() : null)
          .then(d => { setData(d); setLoading(false); })
          .catch(() => setLoading(false));
      })
      .catch(() => router.push("/admin/login"));
  }, [router, params.id]);

  if (loading) {
    return (
      <div className="grid gap-6">
        <section className="glass rounded-3xl p-6 md:p-8">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="mt-3 h-5 w-72" />
        </section>
        <div className="grid gap-4"><Skeleton className="h-48 rounded-3xl" /></div>
      </div>
    );
  }

  if (!data) {
    return <div className="py-12 text-center text-white/60">المستخدم غير موجود</div>;
  }

  const user: UserDetail = data.user;
  const tabs = [
    { key: "profile", label: "الملف الشخصي", icon: "👤" },
    { key: "orders", label: "الطلبات", icon: "📋" },
    { key: "products", label: "المنتجات", icon: "📦" },
    { key: "reviews", label: "التقييمات", icon: "⭐" },
    { key: "audit", label: "سجل النشاط", icon: "📜" },
  ];

  return (
    <div>
      {/* Header */}
      <section className="glass rounded-3xl p-6 md:p-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-emerald-400 text-2xl font-black text-white">
              {(user.first_name?.charAt(0) || "?").toUpperCase()}
            </div>
            <div>
              <h1 className="title">{user.first_name} {user.last_name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-white/60">
                  <SensitiveToggle>{user.email}</SensitiveToggle>
                </span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                  user.role === "admin" ? "bg-rose-500/20 text-rose-300" :
                  "bg-indigo-500/20 text-indigo-300"
                }`}>
                  {user.role === "admin" ? "أدمن" : "مشتري"}
                </span>
                {user.banned ? (
                  <span className="rounded-full bg-rose-500/20 px-2.5 py-0.5 text-xs font-bold text-rose-300">محظور</span>
                ) : (
                  <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-300">نشط</span>
                )}
                {user.email_verified ? (
                  <span className="rounded-full bg-sky-500/20 px-2.5 py-0.5 text-xs font-bold text-sky-300">✓ بريد موثق</span>
                ) : (
                  <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-bold text-amber-300">بريد غير موثق</span>
                )}
              </div>
            </div>
          </div>
          <button className="btn-secondary" onClick={() => router.push("/admin/users")}>العودة</button>
        </div>
      </section>

      {/* Tabs */}
      <div className="mt-4 flex flex-wrap gap-2">
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={activeTab === tab.key ? "btn-primary" : "btn-secondary"}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <section className="glass rounded-3xl p-6">
            <h2 className="text-lg font-black mb-4">معلومات الحساب</h2>
            <div className="grid gap-3">
              <div className="flex justify-between rounded-xl bg-white/5 px-4 py-3">
                <span className="text-sm text-white/60">ID</span>
                <span className="text-sm font-bold text-white">{user.id}</span>
              </div>
              <div className="flex justify-between rounded-xl bg-white/5 px-4 py-3">
                <span className="text-sm text-white/60">تاريخ التسجيل</span>
                <span className="text-sm font-bold text-white">{new Date(user.created_at).toLocaleString("ar-DZ")}</span>
              </div>
              <div className="flex justify-between rounded-xl bg-white/5 px-4 py-3">
                <span className="text-sm text-white/60">تاريخ الميلاد</span>
                <span className="text-sm font-bold text-white">{user.date_of_birth || "—"}</span>
              </div>
            </div>
          </section>

          <section className="glass rounded-3xl p-6">
            <h2 className="text-lg font-black mb-4">إجراءات</h2>
            <div className="grid gap-3">
              <button className="btn-primary w-full" onClick={() => {
                const reason = prompt("سبب الحظر:");
                if (reason === null) return;
                fetch("/api/admin/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ user_id: user.id, action: user.banned ? "unban" : "ban", reason }) })
                  .then(r => r.ok ? toast("success", user.banned ? "تم إلغاء الحظر" : "تم الحظر") : toast("error", "فشل"));
              }}>
                {user.banned ? "🔓 إلغاء الحظر" : "🔒 حظر الحساب"}
              </button>
              {user.role !== "admin" && (
                <button className="btn-primary w-full" onClick={() => {
                  fetch("/api/admin/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ user_id: user.id, action: "promote_admin" }) })
                    .then(r => r.ok ? toast("success", "تمت الترقية") : toast("error", "فشل"));
                }}>
                  ⬆ ترقية إلى أدمن
                </button>
              )}
              {user.role === "admin" && (
                <button className="btn-secondary w-full" onClick={() => {
                  fetch("/api/admin/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ user_id: user.id, action: "demote_buyer" }) })
                    .then(r => r.ok ? toast("success", "تم الخفض") : toast("error", "فشل"));
                }}>
                  ⬇ خفض إلى مشتري
                </button>
              )}
              {!user.email_verified && (
                <button className="btn-secondary w-full" onClick={() => {
                  fetch("/api/admin/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ user_id: user.id, action: "verify_email" }) })
                    .then(r => r.ok ? toast("success", "تم توثيق البريد") : toast("error", "فشل"));
                }}>
                  ✓ توثيق البريد الإلكتروني
                </button>
              )}
              {user.id_file_path && (
                <a href={user.id_file_path} target="_blank" className="btn-secondary w-full text-center">
                  📎 عرض وثائق الهوية
                </a>
              )}
              <button className="btn-secondary w-full text-rose-300 border-rose-500/30" onClick={() => {
                if (!confirm("هل أنت متأكد من حذف هذا المستخدم نهائياً؟")) return;
                const reason = prompt("سبب الحذف:");
                if (reason === null) return;
                fetch("/api/admin/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ user_id: user.id, action: "delete", reason }) })
                  .then(r => r.ok ? (toast("success", "تم الحذف"), router.push("/admin/users")) : toast("error", "فشل الحذف"));
              }}>
                🗑️ حذف الحساب
              </button>
            </div>
          </section>
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === "orders" && (
        <section className="mt-6 glass rounded-3xl p-5">
          <h2 className="text-lg font-black mb-4">الطلبات</h2>
          {data.orders?.length > 0 ? (
            <div className="grid gap-3">
              {data.orders.map((o: any) => (
                <div key={o.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div>
                    <div className="text-sm font-bold text-white">{o.product_title || "—"}</div>
                    <div className="text-xs text-white/50">{o.order_tracking_id} • {o.total_amount} {o.currency}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-xs font-bold text-indigo-300">{o.status}</span>
                    <button className="btn-primary text-xs px-3 py-1" onClick={() => router.push(`/orders/${o.id}`)}>عرض</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-white/50">لا توجد طلبات</div>
          )}
        </section>
      )}

      {/* Products Tab */}
      {activeTab === "products" && (
        <section className="mt-6 glass rounded-3xl p-5">
          <h2 className="text-lg font-black mb-4">المنتجات</h2>
          {data.products?.length > 0 ? (
            <div className="grid gap-3">
              {data.products.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div>
                    <div className="text-sm font-bold text-white">{p.title}</div>
                    <div className="text-xs text-white/50">{p.category} • {p.price} {p.currency}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                      p.status === "active" ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"
                    }`}>{p.status === "active" ? "نشط" : "غير نشط"}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-white/50">لا توجد منتجات</div>
          )}
        </section>
      )}

      {/* Reviews Tab */}
      {activeTab === "reviews" && (
        <section className="mt-6 glass rounded-3xl p-5">
          <h2 className="text-lg font-black mb-4">التقييمات</h2>
          {data.reviews?.length > 0 ? (
            <div className="grid gap-3">
              {data.reviews.map((r: any) => (
                <div key={r.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-bold text-white">{r.product_title || "—"}</div>
                    <div className="text-yellow-300 text-xs">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</div>
                  </div>
                  {r.comment && <div className="mt-1 text-sm text-white/60">{r.comment}</div>}
                  <div className="mt-1 text-xs text-white/40">{new Date(r.created_at).toLocaleString("ar-DZ")}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-white/50">لا توجد تقييمات</div>
          )}
        </section>
      )}

      {/* Audit Log Tab */}
      {activeTab === "audit" && (
        <section className="mt-6 glass rounded-3xl p-5">
          <h2 className="text-lg font-black mb-4">سجل النشاط</h2>
          {data.audit_log?.length > 0 ? (
            <div className="grid gap-2">
              {data.audit_log.map((log: any) => (
                <div key={log.id} className="flex items-start gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-3">
                  <span className="mt-0.5 text-lg">
                    {log.event_type?.includes("login") ? "🔓" :
                     log.event_type?.includes("logout") ? "🔒" :
                     log.event_type?.includes("password") ? "🔑" :
                     log.event_type?.includes("delete") ? "🗑️" :
                     log.event_type?.includes("ban") ? "🔨" :
                     log.event_type?.includes("update") ? "✏️" : "🔔"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-white">{log.event_type}</div>
                    {log.details && <div className="text-xs text-white/60">{log.details}</div>}
                    <div className="text-[10px] text-white/40">
                      {new Date(log.created_at).toLocaleString("ar-DZ")}
                      {log.ip_address && <span> • IP: {log.ip_address}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-white/50">لا يوجد سجل نشاط</div>
          )}
        </section>
      )}
    </div>
  );
}
