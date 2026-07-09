"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import RatingStars from "@/components/RatingStars";
import { useToast } from "@/components/ToastProvider";
import { Skeleton } from "@/components/Skeleton";

type Review = {
  id: string;
  buyer_name: string;
  product_title: string;
  rating: number;
  comment: string;
  created_at: string;
};

export default function AdminReviewsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => {
      if (d.user?.role !== "admin") { router.push("/admin/login"); return; }
      loadReviews();
    }).catch(() => router.push("/admin/login"));
  }, [router]);

  async function loadReviews() {
    const res = await fetch("/api/reviews?admin=1", { cache: "no-store" });
    if (res.ok) setReviews(await res.json());
    setLoading(false);
  }

  async function deleteReview(id: string) {
    if (!confirm("حذف التقييم؟")) return;
    const res = await fetch(`/api/reviews/${id}`, { method: "DELETE" });
    if (res.ok) toast("success", "تم حذف التقييم.");
    else toast("error", "فشل حذف التقييم.");
    await loadReviews();
  }

  async function hideComment(id: string) {
    const res = await fetch(`/api/reviews/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "hide" }) });
    if (res.ok) toast("success", "تم إخفاء التعليق.");
    else toast("error", "فشل إخفاء التعليق.");
    await loadReviews();
  }

  if (loading) {
    return (
      <div>
        <section className="glass rounded-3xl p-6 md:p-8">
          <Skeleton className="h-8 w-44" />
          <Skeleton className="mt-3 h-5 w-56" />
        </section>
        <div className="mt-6 grid gap-4">
          <Skeleton className="h-28 rounded-3xl" />
          <Skeleton className="h-28 rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <section className="glass rounded-3xl p-6 md:p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="title">إدارة التقييمات</h1>
            <p className="subtitle">جميع تقييمات البائعين</p>
          </div>
          <button className="btn-secondary" onClick={() => router.push("/admin")}>العودة</button>
        </div>
      </section>

      <div className="mt-6 grid gap-4">
        {reviews.length === 0 && <div className="glass rounded-3xl p-6 text-center text-white/70">لا توجد تقييمات</div>}
        {reviews.map((r) => (
          <div key={r.id} className="glass rounded-3xl p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <RatingStars rating={r.rating} size="sm" />
                <div className="mt-2 font-bold text-white">{r.buyer_name || "مشتري"}</div>
                <div className="text-xs text-white/50">منتج: {r.product_title}</div>
                {r.comment && <div className="mt-2 text-sm text-white/70">{r.comment}</div>}
                <div className="mt-1 text-xs text-white/50">{new Date(r.created_at).toLocaleString("ar-DZ")}</div>
              </div>
              <div className="flex shrink-0 gap-2">
                {r.comment && r.comment !== "[مخفي من قبل الإدارة]" && (
                  <button className="btn-secondary text-xs" onClick={() => hideComment(r.id)}>إخفاء</button>
                )}
                <button className="btn-secondary text-xs" onClick={() => deleteReview(r.id)}>حذف</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
