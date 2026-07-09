"use client";

import RatingStars from "./RatingStars";

type SellerStats = {
  average: number;
  count: number;
  satisfaction: number;
  total_orders?: number;
  member_since?: string;
  response_time?: string;
};

export default function SellerReputation({
  sellerName,
  sellerId,
  stats,
  compact = false,
}: {
  sellerName: string;
  sellerId: string;
  stats: SellerStats;
  compact?: boolean;
}) {
  const memberDate = stats.member_since
    ? new Date(stats.member_since).toLocaleDateString("ar-DZ", { year: "numeric", month: "long" })
    : null;

  if (compact) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-emerald-400 text-base font-black text-white">
          {sellerName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-bold text-white">{sellerName}</span>
            {stats.count >= 5 && <span className="shrink-0 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">✓ موثوق</span>}
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-white/50">
            <RatingStars rating={Math.round(stats.average)} size="sm" />
            <span>({stats.count})</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <a
      href={`/profile/${encodeURIComponent(sellerId)}`}
      className="group block rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition duration-200 hover:bg-white/[0.06]"
    >
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-emerald-400 text-xl font-black text-white transition duration-200 group-hover:scale-105">
          {sellerName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="truncate text-lg font-black text-white group-hover:text-indigo-200 transition">{sellerName}</div>
            {stats.count >= 5 && (
              <span className="shrink-0 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
                ✓ بائع موثوق
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1">
              <RatingStars rating={Math.round(stats.average)} size="sm" />
              <span className="text-xs text-white/50">{stats.average.toFixed(1)}</span>
            </div>
            <span className="text-xs text-white/50">{stats.count} تقييم</span>
            <span className="text-xs text-emerald-300">{stats.satisfaction}% رضا</span>
          </div>
          <div className="mt-1 flex items-center gap-3 flex-wrap text-xs text-white/40">
            {stats.total_orders !== undefined && <span>📦 {stats.total_orders} طلب</span>}
            {stats.response_time && <span>⏱ {stats.response_time}</span>}
            {memberDate && <span>📅 عضو منذ {memberDate}</span>}
          </div>
        </div>
        <span className="text-sm text-white/30 group-hover:text-indigo-300 transition">←</span>
      </div>
    </a>
  );
}
