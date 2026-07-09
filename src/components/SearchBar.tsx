"use client";

import { useState, useMemo } from "react";

type Product = {
  id: string;
  title: string;
  price: number;
  currency: string;
  image?: string;
  description?: string;
  status?: string;
  seller_name?: string;
  category?: string;
  created_at?: string;
};

export default function SearchBar({
  products,
  onFiltered,
  placeholder,
}: {
  products: Product[];
  onFiltered: (filtered: Product[]) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [sortBy, setSortBy] = useState<"default" | "price_asc" | "price_desc" | "newest">("default");

  const filtered = useMemo(() => {
    let result = [...products];

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.description || "").toLowerCase().includes(q) ||
          (p.seller_name || "").toLowerCase().includes(q)
      );
    }

    if (sortBy === "price_asc") result.sort((a, b) => a.price - b.price);
    else if (sortBy === "price_desc") result.sort((a, b) => b.price - a.price);
    else if (sortBy === "newest") result.sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));

    return result;
  }, [products, query, sortBy]);

  const suggestions = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.trim().toLowerCase();
    return products
      .filter((p) => p.title.toLowerCase().includes(q))
      .slice(0, 5);
  }, [products, query]);

  return (
    <div className="relative">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30">🔍</span>
          <input
            type="text"
            className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 pl-4 pr-12 text-white outline-none transition focus:border-indigo-400/50"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setShowSuggestions(true); }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder={placeholder || "ابحث عن منتج..."}
          />
          {query && (
            <button
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition"
              onClick={() => { setQuery(""); onFiltered(products); }}
              type="button"
            >
              ✕
            </button>
          )}
        </div>

        <select
          className="h-12 rounded-2xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none transition focus:border-indigo-400/50"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as "default" | "price_asc" | "price_desc" | "newest")}
        >
          <option value="default">ترتيب</option>
          <option value="price_asc">السعر: الأقل</option>
          <option value="price_desc">السعر: الأعلى</option>
          <option value="newest">الأحدث</option>
        </select>
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-xl animate-scale-in">
          {suggestions.map((p) => (
            <button
              key={p.id}
              className="flex w-full items-center gap-3 px-4 py-3 text-right text-sm text-white/80 hover:bg-white/5 transition"
              onMouseDown={() => { setQuery(p.title); setShowSuggestions(false); onFiltered(filtered); }}
              type="button"
            >
              <span className="text-white/40">🔍</span>
              <span className="font-bold">{p.title}</span>
              <span className="mr-auto text-indigo-300">{p.price} {p.currency}</span>
            </button>
          ))}
        </div>
      )}

      {/* Results count */}
      <div className="mt-1 text-xs text-white/40">
        {query.trim() && (
          <span className="animate-fade-in">{filtered.length} نتيجة من {products.length}</span>
        )}
      </div>
    </div>
  );
}
