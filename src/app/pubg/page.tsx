"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import AddProductButton from "@/components/AddProductButton";
import SearchBar from "@/components/SearchBar";
import EmptyState from "@/components/EmptyState";

export default function PubgPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/products?category=pubg", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        const arr = Array.isArray(data) ? data : [];
        setProducts(arr);
        setFiltered(arr);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid gap-6">
        <section className="glass rounded-3xl p-6 md:p-10">
          <div className="skeleton h-8 w-48" />
          <div className="skeleton mt-3 h-5 w-72" />
        </section>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-72 rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 page-transition">
      {/* Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-transparent to-orange-500/5 p-6 md:p-10">
        <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-amber-500/10 to-transparent pointer-events-none" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-500/10 px-4 py-2 text-sm font-bold text-amber-300">
            <span>🎯</span>
            <span>PUBG Mobile — حسابات احترافية</span>
          </div>
          <h1 className="title mt-4">حسابات PUBG Mobile</h1>
          <p className="subtitle">اختر حسابك المناسب. جميع العروض موثوقة ومضمونة.</p>
          <div className="mt-4 flex flex-wrap gap-4">
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-center">
              <div className="text-lg font-black text-white">{products.length}</div>
              <div className="text-xs text-white/50">إجمالي الحسابات</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-center">
              <div className="text-lg font-black text-emerald-300">
                {products.filter((p) => p.status === "active").length}
              </div>
              <div className="text-xs text-white/50">متاح الآن</div>
            </div>
          </div>
        </div>
      </section>

      {/* Search + Sort */}
      <SearchBar
        products={products}
        onFiltered={setFiltered}
        placeholder="ابحث في حسابات PUBG..."
      />

      {/* Products Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="🎯"
          title={products.length === 0 ? "لا توجد حسابات متاحة" : "لا توجد نتائج للبحث"}
          description={products.length === 0 ? "لم يتم إضافة أي حساب PUBG بعد. كن أول من يضيف!" : "حاول تغيير كلمات البحث"}
        />
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {filtered.map((p: any) => (
            <article key={p.id} className="product-card glass flex flex-col rounded-3xl">
              <div className="relative h-48 shrink-0 overflow-hidden rounded-t-3xl product-card-image">
                <Image src={p.image || "/uploads/placeholder.svg"} alt={p.title} fill className="object-cover" />
                {p.status === "sold" && (
                  <div className="absolute left-2 top-2 z-10 rounded-full bg-rose-500 px-3 py-1 text-xs font-bold text-white shadow-lg">
                    تم البيع
                  </div>
                )}
                {p.status !== "sold" && (
                  <div className="quick-actions absolute inset-x-0 bottom-0 z-10 flex gap-2 p-3 bg-gradient-to-t from-black/60 to-transparent">
                    <a href={`/products/${encodeURIComponent(p.id)}`} className="flex-1 rounded-full bg-white/20 backdrop-blur-md px-3 py-2 text-center text-xs font-bold text-white hover:bg-white/30 transition">
                      عرض المنتج
                    </a>
                    <a href={`/orders/new?productId=${encodeURIComponent(p.id)}`} className="flex-1 rounded-full bg-indigo-500/80 backdrop-blur-md px-3 py-2 text-center text-xs font-bold text-white hover:bg-indigo-500 transition">
                      شراء
                    </a>
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col p-5">
                <div className="text-lg font-black">{p.title}</div>
                <div className="mt-2 flex-1 line-clamp-2 text-sm leading-7 text-white/70">{p.description}</div>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-xl font-black text-white">{p.price} دج</div>
                  {p.status === "sold" ? (
                    <span className="btn-secondary w-full cursor-not-allowed opacity-50 sm:w-auto text-center">تم البيع</span>
                  ) : (
                    <a className="btn-primary w-full sm:w-auto" href={`/products/${encodeURIComponent(p.id)}`}>شراء</a>
                  )}
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
      <AddProductButton />
    </div>
  );
}
