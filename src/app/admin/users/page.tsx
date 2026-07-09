"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, useCallback } from "react";
import { useToast } from "@/components/ToastProvider";
import { downloadCSV } from "@/lib/export";

type AdminUser = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  email_verified: number;
  banned: number;
  created_at: string;
  product_count: number;
  order_count: number;
  dispute_count: number;
};

function UsersList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [verifiedFilter, setVerifiedFilter] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [bulkAction, setBulkAction] = useState("");

  const loadUsers = useCallback(async () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (roleFilter) params.set("role", roleFilter);
    if (statusFilter) params.set("status", statusFilter);
    if (verifiedFilter) params.set("verified", verifiedFilter);
    const res = await fetch(`/api/admin/users?${params}`, { cache: "no-store" });
    if (!res.ok) { router.push("/admin/login"); return; }
    const data = await res.json();
    setUsers(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [searchQuery, roleFilter, statusFilter, verifiedFilter, router]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === filtered.length) { setSelected(new Set()); }
    else { setSelected(new Set(filtered.map(u => u.id))); }
  }

  const filtered = users;

  async function handleUserAction(userId: string, action: string) {
    const reasonMap: Record<string, string> = {
      ban: "حظر الحساب",
      delete: "حذف الحساب",
      promote_admin: "ترقية إلى أدمن",
      demote_buyer: "تحويل إلى مشتري",
      verify_email: "توثيق البريد",
    };

    if (action === "delete" || action === "ban") {
      const reason = prompt(`سبب ${reasonMap[action]}:`);
      if (reason === null) return;
      setActionLoading(userId);
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, action, reason }),
      });
      setActionLoading(null);
      if (res.ok) { toast("success", `تم ${reasonMap[action]}`); await loadUsers(); }
      else { toast("error", "فشل العملية"); }
    } else {
      setActionLoading(userId);
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, action }),
      });
      setActionLoading(null);
      if (res.ok) { toast("success", `تم ${reasonMap[action]}`); await loadUsers(); }
      else { toast("error", "فشل العملية"); }
    }
  }

  async function handleBulkAction() {
    if (!bulkAction || selected.size === 0) return;
    const actionLabels: Record<string, string> = {
      ban: "حظر", unban: "إلغاء حظر", delete: "حذف", verify_email: "توثيق بريد",
    };
    if (bulkAction === "delete" && !confirm(`تأكيد حذف ${selected.size} مستخدم؟`)) return;
    if (bulkAction === "ban") {
      const reason = prompt(`سبب الحظر الجماعي (${selected.size} مستخدم):`);
      if (reason === null) return;
    }
    for (const userId of selected) {
      await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, action: bulkAction, reason: bulkAction === "ban" ? prompt("") : undefined }),
      });
    }
    toast("success", `تم ${actionLabels[bulkAction]} ${selected.size} مستخدم`);
    setSelected(new Set());
    await loadUsers();
  }

  if (loading) {
    return (
      <div className="grid gap-6">
        <section className="glass rounded-3xl p-6 md:p-8">
          <div className="skeleton h-8 w-48" />
          <div className="skeleton mt-3 h-5 w-64" />
        </section>
        <div className="glass rounded-3xl p-5">
          {[1,2,3,4].map(i => <div key={i} className="skeleton h-16 mb-3" />)}
        </div>
      </div>
    );
  }

  return (
    <div>
      <section className="glass rounded-3xl p-6 md:p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="title">إدارة المستخدمين</h1>
            <p className="subtitle">{users.length} مستخدم • إدارة الحسابات والأدوار والصلاحيات</p>
          </div>
        </div>
      </section>

      {/* Search + Filters */}
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[200px]">
          <div className="text-xs font-bold text-white/60 mb-1">بحث</div>
          <input
            className="h-11 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-white outline-none focus:border-indigo-400/50"
            placeholder="الاسم، البريد، ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") loadUsers(); }}
          />
        </div>
        <select
          className="h-11 rounded-2xl border border-white/10 bg-white/5 px-4 text-white outline-none focus:border-indigo-400/50"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="">كل الأدوار</option>
          <option value="buyer">مشتري</option>
          <option value="admin">أدمن</option>
        </select>
        <select
          className="h-11 rounded-2xl border border-white/10 bg-white/5 px-4 text-white outline-none focus:border-indigo-400/50"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">كل الحالات</option>
          <option value="active">نشط</option>
          <option value="banned">محظور</option>
        </select>
        <select
          className="h-11 rounded-2xl border border-white/10 bg-white/5 px-4 text-white outline-none focus:border-indigo-400/50"
          value={verifiedFilter}
          onChange={(e) => setVerifiedFilter(e.target.value)}
        >
          <option value="">كل البريد</option>
          <option value="verified">موثق</option>
          <option value="unverified">غير موثق</option>
        </select>
        <button className="btn-primary h-11" onClick={() => loadUsers()}>بحث</button>
        {filtered.length > 0 && (
          <button className="btn-secondary h-11" onClick={() => downloadCSV(filtered.map(u => ({
            name: `${u.first_name} ${u.last_name}`,
            email: u.email,
            role: u.role,
            status: u.banned ? "محظور" : "نشط",
            verified: u.email_verified ? "نعم" : "لا",
            created: u.created_at,
          })), "users")}>تصدير CSV</button>
        )}
      </div>

      {/* Bulk Actions */}
      {selected.size > 0 && (
        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-indigo-400/20 bg-indigo-500/10 p-4">
          <span className="text-sm font-bold text-white">{selected.size} مستخدم محدد</span>
          <select
            className="h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none"
            value={bulkAction}
            onChange={(e) => setBulkAction(e.target.value)}
          >
            <option value="">إجراء جماعي...</option>
            <option value="ban">حظر</option>
            <option value="unban">إلغاء حظر</option>
            <option value="delete">حذف</option>
            <option value="verify_email">توثيق بريد</option>
          </select>
          <button className="btn-primary h-10 text-sm" onClick={handleBulkAction} disabled={!bulkAction}>تطبيق</button>
          <button className="btn-secondary h-10 text-sm" onClick={() => setSelected(new Set())}>إلغاء التحديد</button>
        </div>
      )}

      {/* Users list */}
      <div className="mt-6 glass rounded-3xl p-5 overflow-x-auto">
        <table className="w-full text-right">
          <thead>
            <tr className="border-b border-white/10 text-xs font-bold text-white/50">
              <th className="pb-3 pl-3">
                <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleSelectAll} className="accent-indigo-500" />
              </th>
              <th className="pb-3 pl-3">المستخدم</th>
              <th className="pb-3 pl-3">البريد</th>
              <th className="pb-3 pl-3">الدور</th>
              <th className="pb-3 pl-3">الحالة</th>
              <th className="pb-3 pl-3">توثيق</th>
              <th className="pb-3 pl-3">منتجات</th>
              <th className="pb-3 pl-3">طلبات</th>
              <th className="pb-3 pl-3">نزاعات</th>
              <th className="pb-3 pl-3">التسجيل</th>
              <th className="pb-3">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.02] transition">
                <td className="py-3 pl-3">
                  <input type="checkbox" checked={selected.has(u.id)} onChange={() => toggleSelect(u.id)} className="accent-indigo-500" />
                </td>
                <td className="py-3 pl-3">
                  <button onClick={() => router.push(`/admin/users/${u.id}`)} className="font-bold text-white hover:text-indigo-200 transition">
                    {u.first_name} {u.last_name}
                  </button>
                </td>
                <td className="py-3 pl-3 text-sm text-white/60">{u.email}</td>
                <td className="py-3 pl-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    u.role === "admin" ? "bg-rose-500/20 text-rose-300" :
                    "bg-indigo-500/20 text-indigo-300"
                  }`}>
                    {u.role === "admin" ? "أدمن" : "مشتري"}
                  </span>
                </td>
                <td className="py-3 pl-3">
                  {u.banned ? (
                    <span className="rounded-full bg-rose-500/20 px-2.5 py-0.5 text-xs font-bold text-rose-300">محظور</span>
                  ) : (
                    <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-300">نشط</span>
                  )}
                </td>
                <td className="py-3 pl-3 text-sm">
                  {u.email_verified ? (
                    <span className="text-emerald-300">✓ موثق</span>
                  ) : (
                    <span className="text-white/40">—</span>
                  )}
                </td>
                <td className="py-3 pl-3 text-sm text-white/60">{u.product_count}</td>
                <td className="py-3 pl-3 text-sm text-white/60">{u.order_count}</td>
                <td className="py-3 pl-3 text-sm text-white/60">{u.dispute_count}</td>
                <td className="py-3 pl-3 text-xs text-white/40">{new Date(u.created_at).toLocaleDateString("ar-DZ")}</td>
                <td className="py-3">
                  <div className="flex gap-1 flex-wrap">
                    <button className="btn-primary text-xs px-2 py-1" onClick={() => router.push(`/admin/users/${u.id}`)}>عرض</button>
                    {!u.banned && <button className="btn-secondary text-xs px-2 py-1" onClick={() => handleUserAction(u.id, "ban")} disabled={actionLoading === u.id}>حظر</button>}
                    {u.banned && <button className="btn-secondary text-xs px-2 py-1" onClick={() => handleUserAction(u.id, "unban")} disabled={actionLoading === u.id}>إلغاء حظر</button>}
                    {u.role === "buyer" && <button className="btn-secondary text-xs px-2 py-1" onClick={() => handleUserAction(u.id, "promote_admin")} disabled={actionLoading === u.id}>ترقية</button>}
                    {u.role === "admin" && <button className="btn-secondary text-xs px-2 py-1" onClick={() => handleUserAction(u.id, "demote_buyer")} disabled={actionLoading === u.id}>خفض</button>}
                    {!u.email_verified && <button className="btn-secondary text-xs px-2 py-1" onClick={() => handleUserAction(u.id, "verify_email")} disabled={actionLoading === u.id}>توثيق</button>}
                    <button className="btn-secondary text-xs px-2 py-1 text-rose-300 border-rose-500/30" onClick={() => handleUserAction(u.id, "delete")} disabled={actionLoading === u.id}>حذف</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-white/50">لا يوجد مستخدمين مطابقين للبحث</div>
        )}
      </div>
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-white/70">جاري التحميل...</div>}>
      <UsersList />
    </Suspense>
  );
}
