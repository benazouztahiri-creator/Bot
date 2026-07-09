"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ToastProvider";
import { Skeleton } from "@/components/Skeleton";
import { downloadCSV } from "@/lib/export";

type ChatMessage = {
  id: string;
  sender_id: string;
  sender_name: string;
  text: string;
  created_at: string;
};

type Dispute = {
  id: string;
  order_id: string;
  buyer_name: string;
  buyer_id: string;
  order_tracking_id: string;
  reason: string;
  status: string;
  resolution_note: string;
  created_at: string;
  updated_at: string;
  product_title: string;
  product_price: number;
  currency: string;
};

export default function AdminDisputesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [resolutionNote, setResolutionNote] = useState("");

  useEffect(() => { loadDisputes(); }, []);

  async function loadDisputes() {
    const res = await fetch("/api/disputes", { cache: "no-store" });
    if (!res.ok) { router.push("/admin/login"); return; }
    const data = await res.json();
    setDisputes(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function loadChat(orderId: string) {
    const res = await fetch(`/api/order-chat/${orderId}`, { cache: "no-store" });
    if (res.ok) setChatMessages(Array.isArray(await res.json()) ? await res.json() : []);
  }

  async function resolveDispute(disputeId: string, status: string, note: string) {
    setActionLoading(disputeId);
    const res = await fetch(`/api/disputes/${disputeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, resolution_note: note }),
    });
    setActionLoading(null);
    if (res.ok) toast("success", `تم ${status === "resolved" ? "حل النزاع" : "رفض النزاع"}.`);
    else toast("error", "فشل");
    setSelectedDispute(null);
    setResolutionNote("");
    await loadDisputes();
  }

  function openDisputeDetail(dispute: Dispute) {
    setSelectedDispute(dispute);
    setChatMessages([]);
    loadChat(dispute.order_id);
    setResolutionNote(dispute.resolution_note || "");
  }

  const filtered = filter === "all" ? disputes : disputes.filter(d => d.status === filter);

  if (loading) {
    return (
      <div>
        <section className="glass rounded-3xl p-6 md:p-8">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-3 h-5 w-64" />
        </section>
        <div className="mt-6 grid gap-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-28 rounded-3xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div>
      <section className="glass rounded-3xl p-6 md:p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="title">مركز النزاعات</h1>
            <p className="subtitle">{disputes.filter(d => d.status === "open").length} نزاع مفتوح • إدارة وحل النزاعات</p>
          </div>
          <button className="btn-secondary" onClick={() => loadDisputes()}>تحديث</button>
        </div>
      </section>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {[
          { key: "all", label: "الكل", count: disputes.length },
          { key: "open", label: "مفتوح", count: disputes.filter(d => d.status === "open").length },
          { key: "resolved", label: "تم الحل", count: disputes.filter(d => d.status === "resolved").length },
          { key: "dismissed", label: "مرفوض", count: disputes.filter(d => d.status === "dismissed").length },
        ].map(f => (
          <button key={f.key} className={filter === f.key ? "btn-primary" : "btn-secondary"} onClick={() => setFilter(f.key)}>
            {f.label} ({f.count})
          </button>
        ))}
        <button className="btn-secondary" onClick={() => downloadCSV(filtered.map(d => ({
          order: d.order_tracking_id,
          buyer: d.buyer_name,
          reason: d.reason,
          status: d.status,
          created: d.created_at,
        })), "disputes")}>تصدير CSV</button>
      </div>

      {/* Split view: list + detail */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_400px]">
        {/* List */}
        <div className="grid gap-4">
          {filtered.map((dispute) => (
            <div
              key={dispute.id}
              className={`glass rounded-3xl p-5 cursor-pointer transition duration-200 hover:bg-white/[0.07] ${
                selectedDispute?.id === dispute.id ? "border-indigo-400/30" : ""
              }`}
              onClick={() => openDisputeDetail(dispute)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white/50">{dispute.order_tracking_id}</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      dispute.status === "open" ? "bg-rose-500/20 text-rose-300" :
                      dispute.status === "resolved" ? "bg-emerald-500/20 text-emerald-300" :
                      "bg-white/10 text-white/50"
                    }`}>
                      {dispute.status === "open" ? "⚖️ مفتوح" : dispute.status === "resolved" ? "✅ تم الحل" : "❌ مرفوض"}
                    </span>
                  </div>
                  <div className="mt-2 text-sm font-bold text-white">{dispute.product_title || "منتج"}</div>
                  <div className="mt-1 text-sm text-white/70">
                    المشتري: {dispute.buyer_name}
                  </div>
                  <div className="mt-2 rounded-xl bg-rose-500/10 p-3 text-sm leading-7 text-white/80 border border-rose-400/10">
                    {dispute.reason}
                  </div>
                  <div className="mt-1 text-xs text-white/40">{new Date(dispute.created_at).toLocaleString("ar-DZ")}</div>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="py-12 text-center text-sm text-white/50">لا توجد نزاعات</div>
          )}
        </div>

        {/* Detail Panel */}
        {selectedDispute && (
          <div className="glass rounded-3xl p-5 lg:sticky lg:top-6 lg:h-[calc(100vh-8rem)] lg:overflow-y-auto">
            <h3 className="text-lg font-black text-white mb-4">تفاصيل النزاع</h3>

            <div className="grid gap-3">
              <div className="rounded-xl bg-white/5 px-4 py-3">
                <div className="text-xs text-white/50">المشتري</div>
                <button className="text-sm font-bold text-white hover:text-indigo-200" onClick={() => router.push(`/admin/users/${selectedDispute.buyer_id}`)}>
                  {selectedDispute.buyer_name} ←
                </button>
              </div>
              <div className="rounded-xl bg-white/5 px-4 py-3">
                <div className="text-xs text-white/50">المنتج</div>
                <div className="text-sm font-bold text-white">{selectedDispute.product_title || "—"}</div>
              </div>
              <div className="rounded-xl bg-white/5 px-4 py-3">
                <div className="text-xs text-white/50">السعر</div>
                <div className="text-sm font-bold text-white">{selectedDispute.product_price} {selectedDispute.currency}</div>
              </div>

              {/* Reason */}
              <div className="rounded-xl bg-rose-500/10 border border-rose-400/10 p-3">
                <div className="text-xs font-bold text-rose-300">سبب النزاع</div>
                <div className="mt-1 text-sm text-white/80">{selectedDispute.reason}</div>
              </div>

              {/* Chat */}
              {chatMessages.length > 0 && (
                <div>
                  <div className="text-xs font-bold text-white/60 mb-2">الرسائل</div>
                  <div className="grid gap-2 max-h-48 overflow-y-auto">
                    {chatMessages.map((msg) => (
                      <div key={msg.id} className="rounded-xl bg-white/5 p-3">
                        <div className="text-xs font-bold text-white/60">{msg.sender_name}</div>
                        <div className="mt-0.5 text-sm text-white/80">{msg.text}</div>
                        <div className="mt-0.5 text-[10px] text-white/40">{new Date(msg.created_at).toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Admin Actions */}
              {selectedDispute.status === "open" && (
                <div className="mt-4 grid gap-3">
                  <div className="text-xs font-bold text-white/60">ملاحظة القرار</div>
                  <textarea
                    className="min-h-[80px] rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-white outline-none focus:border-indigo-400/50"
                    value={resolutionNote}
                    onChange={e => setResolutionNote(e.target.value)}
                    placeholder="اكتب ملاحظة عن القرار..."
                  />
                  <button className="btn-primary" onClick={() => resolveDispute(selectedDispute.id, "resolved", resolutionNote)} disabled={actionLoading === selectedDispute.id}>
                    ⚖️ الحكم للمشتري (استرداد)
                  </button>
                  <button className="btn-primary bg-emerald-600 hover:bg-emerald-500" onClick={() => {
                    if (!resolutionNote.trim()) { toast("error", "اكتب ملاحظة القرار"); return; }
                    resolveDispute(selectedDispute.id, "resolved", resolutionNote);
                  }} disabled={actionLoading === selectedDispute.id}>
                    ✅ الحكم للبائع (تحرير الدفع)
                  </button>
                  <button className="btn-secondary" onClick={() => resolveDispute(selectedDispute.id, "dismissed", resolutionNote)} disabled={actionLoading === selectedDispute.id}>
                    ❌ رفض النزاع
                  </button>
                  <button className="btn-secondary" onClick={() => setSelectedDispute(null)}>
                    إغلاق
                  </button>
                </div>
              )}

              {selectedDispute.status !== "open" && (
                <div className="mt-4 p-4 rounded-xl bg-white/5">
                  <div className="text-xs text-white/50">تم إغلاق النزاع</div>
                  {selectedDispute.resolution_note && (
                    <div className="mt-1 text-sm text-white/70">{selectedDispute.resolution_note}</div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
