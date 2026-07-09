"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/components/ToastProvider";
import { downloadCSV } from "@/lib/export";

type AdminProduct = {
  id: string;
  title: string;
  category: string;
  price: number;
  currency: string;
  status: string;
  created_at: string;
  description: string;
  image: string;
};

function useButtonState() {
  const [loading, setLoading] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async (id: string, fn: () => Promise<void>) => {
    setLoading(id);
    setSuccess(null);
    setError(null);
    try {
      await fn();
      setSuccess(id);
      setTimeout(() => setSuccess(null), 1500);
    } catch {
      setError(id);
      setTimeout(() => setError(null), 1500);
    } finally {
      setLoading(null);
    }
  }, []);

  const cls = useCallback((id: string) => {
    if (loading === id) return "loading";
    if (success === id) return "success";
    if (error === id) return "error";
    return "";
  }, [loading, success, error]);

  return { loading: loading !== null, run, cls };
}

export default function AdminProductsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [fetching, setFetching] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const actionBtn = useButtonState();
  const bulkBtn = useButtonState();

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => {
      if (d.user?.role !== "admin") { router.push("/admin/login"); return; }
      loadProducts();
    }).catch(() => router.push("/admin/login"));
  }, [router]);

  async function loadProducts() {
    const res = await fetch("/api/products", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    }
    setFetching(false);
  }

  async function handleAction(productId: string, action: string) {
    await actionBtn.run(productId, async () => {
      if (action === "delete") {
        const res = await fetch(`/api/products/${productId}`, { method: "DELETE" });
        if (!res.ok) throw new Error();
        toast("success", "تم الحذف");
        await loadProducts();
        return;
      }
      const status = action === "activate" ? "active" : "inactive";
      const res = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      toast("success", `تم ${action === "activate" ? "التفعيل" : "الإيقاف"}`);
      await loadProducts();
    });
  }

  async function handleBulkAction(action: string) {
    if (selected.size === 0) return;
    await bulkBtn.run("bulk", async () => {
      for (const id of selected) {
        if (action === "delete") {
          await fetch(`/api/products/${id}`, { method: "DELETE" });
        } else {
          await fetch(`/api/products/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: action === "activate" ? "active" : "inactive" }),
          });
        }
      }
      toast("success", `تم ${action === "delete" ? "حذف" : "تحديث"} ${selected.size} منتج`);
      setSelected(new Set());
      await loadProducts();
    });
  }

  const filtered = products.filter(p => {
    if (statusFilter && p.status !== statusFilter) return false;
    if (categoryFilter && p.category !== categoryFilter) return false;
    if (searchQuery && !p.title.toLowerCase().includes(searchQuery.toLowerCase()) && !p.id.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  function toggleSelect(id: string) {
    setSelected(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  }

  if (fetching) {
    return <div className="grid gap-4">
      <section className="glass rounded-2xl p-5"><div className="skeleton h-7 w-40" /><div className="skeleton mt-2 h-4 w-52" /></section>
      <div className="glass rounded-2xl p-4">{[1,2,3].map(i => <div key={i} className="skeleton h-16 mb-2" />)}</div>
    </div>;
  }

  return (
    <div>
      <section className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-black">إدارة المنتجات</h1>
            <p className="mt-1 text-sm text-white/60">{products.length} منتج</p>
          </div>
          <div className="flex gap-2">
            <button className="btn-primary text-sm" onClick={() => router.push("/admin/products/new")}>+ إضافة منتج</button>
            <button className={`btn-secondary text-sm ${bulkBtn.cls("refresh")}`} onClick={() => { setFetching(true); loadProducts(); }} disabled={bulkBtn.loading}>تحديث</button>
          </div>
        </div>
      </section>

      <div className="mt-3 flex flex-wrap items-end gap-2">
        <div className="flex-1 min-w-[160px]">
          <input className="h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none focus:border-indigo-400/50" placeholder="بحث..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <select className="h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="">كل الأقسام</option>
          <option value="pubg">PUBG</option>
          <option value="free-fire">Free Fire</option>
          <option value="topup">Top-up</option>
        </select>
        <select className="h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">كل الحالات</option>
          <option value="active">نشط</option>
          <option value="inactive">غير نشط</option>
          <option value="sold">تم البيع</option>
        </select>
        {filtered.length > 0 && (
          <button className="btn-secondary text-sm h-10" onClick={() => downloadCSV(filtered.map(p => ({ title: p.title, category: p.category, price: p.price, currency: p.currency, status: p.status })), "products")}>CSV</button>
        )}
      </div>

      {selected.size > 0 && (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-indigo-400/20 bg-indigo-500/10 p-3">
          <span className="text-sm font-bold text-white">{selected.size}</span>
          <button className={`btn-primary text-xs h-9 px-3 ${bulkBtn.cls("activate")}`} onClick={() => handleBulkAction("activate")} disabled={bulkBtn.loading}>تفعيل</button>
          <button className={`btn-secondary text-xs h-9 px-3 ${bulkBtn.cls("suspend")}`} onClick={() => handleBulkAction("suspend")} disabled={bulkBtn.loading}>إيقاف</button>
          <button className={`btn-secondary text-xs h-9 px-3 text-rose-300 ${bulkBtn.cls("delete")}`} onClick={() => { if (confirm(`حذف ${selected.size} منتج؟`)) handleBulkAction("delete"); }} disabled={bulkBtn.loading}>حذف</button>
          <button className="btn-secondary text-xs h-9 px-3" onClick={() => setSelected(new Set())}>إلغاء</button>
        </div>
      )}

      <div className="mt-4 glass rounded-2xl p-3 overflow-x-auto">
        <table className="w-full text-right text-sm">
          <thead>
            <tr className="border-b border-white/10 text-xs font-bold text-white/50">
              <th className="pb-2 pl-2"><input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={() => { if (selected.size === filtered.length) setSelected(new Set()); else setSelected(new Set(filtered.map(p => p.id))); }} className="accent-indigo-500" /></th>
              <th className="pb-2 pl-2">المنتج</th>
              <th className="pb-2 pl-2">القسم</th>
              <th className="pb-2 pl-2">السعر</th>
              <th className="pb-2 pl-2">الحالة</th>
              <th className="pb-2 pl-2">التاريخ</th>
              <th className="pb-2">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                <td className="py-2 pl-2"><input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleSelect(p.id)} className="accent-indigo-500" /></td>
                <td className="py-2 pl-2">
                  <div className="text-sm font-bold text-white">{p.title}</div>
                  <div className="text-[10px] text-white/40">{p.id.slice(0, 10)}...</div>
                </td>
                <td className="py-2 pl-2 text-xs text-white/60">{p.category}</td>
                <td className="py-2 pl-2 text-sm font-bold text-white">{p.price} {p.currency}</td>
                <td className="py-2 pl-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    p.status === "active" ? "bg-emerald-500/20 text-emerald-300" :
                    p.status === "sold" ? "bg-rose-500/20 text-rose-300" :
                    "bg-amber-500/20 text-amber-300"
                  }`}>{p.status === "active" ? "نشط" : p.status === "sold" ? "بيع" : "غير نشط"}</span>
                </td>
                <td className="py-2 pl-2 text-[10px] text-white/40">{new Date(p.created_at).toLocaleDateString("ar-DZ")}</td>
                <td className="py-2">
                  <div className="flex gap-1">
                    <a className={`btn-primary text-[10px] px-2 py-1 ${actionBtn.cls(p.id + "view")}`} href={`/products/${p.id}`}>عرض</a>
                    {p.status !== "active" && (
                      <button className={`btn-secondary text-[10px] px-2 py-1 ${actionBtn.cls(p.id + "activate")}`} onClick={() => handleAction(p.id, "activate")} disabled={actionBtn.loading}>تفعيل</button>
                    )}
                    {p.status === "active" && (
                      <button className={`btn-secondary text-[10px] px-2 py-1 ${actionBtn.cls(p.id + "suspend")}`} onClick={() => handleAction(p.id, "suspend")} disabled={actionBtn.loading}>إيقاف</button>
                    )}
                    <button className={`btn-secondary text-[10px] px-2 py-1 text-rose-300 ${actionBtn.cls(p.id + "delete")}`} onClick={() => { if (confirm("حذف المنتج؟")) handleAction(p.id, "delete"); }} disabled={actionBtn.loading}>حذف</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="py-10 text-center text-sm text-white/50">لا توجد منتجات</div>}
      </div>
    </div>
  );
}