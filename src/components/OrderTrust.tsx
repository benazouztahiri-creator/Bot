"use client";

const statusMoneyMap: Record<string, { holder: string; holderLabel: string; description: string; color: string }> = {
  awaiting_payment_proof: {
    holder: "buyer",
    holderLabel: "المشتري",
    description: "المبلغ لم يُودع بعد. أنت من يملك المال.",
    color: "text-amber-300",
  },
  payment_under_review: {
    holder: "escrow",
    holderLabel: "الوسيط (الإدارة)",
    description: "المبلغ تحت مراجعة الإدارة. لا يمكن لأي طرف التصرف به.",
    color: "text-indigo-300",
  },
  payment_rejected: {
    holder: "buyer",
    holderLabel: "المشتري",
    description: "تم رفض الدفع. المبلغ لم يتحرك.",
    color: "text-rose-300",
  },
  payment_confirmed_waiting_code: {
    holder: "escrow",
    holderLabel: "الوسيط (الإدارة)",
    description: "المبلغ محجوز في حساب الوساطة. الإدارة تنتظر الكود للتسليم.",
    color: "text-indigo-300",
  },
  code_verified_deliver_now: {
    holder: "escrow",
    holderLabel: "الوسيط (الإدارة)",
    description: "تم التحقق من الكود. الإدارة ستُسلم الحساب قريباً.",
    color: "text-indigo-300",
  },
  delivered: {
    holder: "escrow",
    holderLabel: "الوسيط (الإدارة)",
    description: "تم التسليم. المشتري يختبر المنتج. المبلغ لا يزال في الوساطة.",
    color: "text-emerald-300",
  },
  disputed: {
    holder: "escrow",
    holderLabel: "الوسيط (الإدارة)",
    description: "نزاع مفتوح. المبلغ مجمّد حتى يتم حل النزاع.",
    color: "text-rose-300",
  },
};

export default function OrderTrust({ status }: { status: string }) {
  const info = statusMoneyMap[status] || {
    holder: "escrow",
    holderLabel: "الوسيط",
    description: "المبلغ تحت إدارة نظام الوساطة.",
    color: "text-white/60",
  };

  return (
    <div className="rounded-2xl border border-indigo-400/20 bg-gradient-to-br from-indigo-500/10 to-emerald-500/5 p-4 animate-fade-in-up">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">🛡️</span>
        <span className="text-sm font-black text-white">أموالك آمنة</span>
      </div>

      <div className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-lg">
          {info.holder === "buyer" ? "👤" : "🛡️"}
        </div>
        <div>
          <div className="text-xs text-white/50">المال الآن في يد</div>
          <div className={`text-sm font-black ${info.color}`}>{info.holderLabel}</div>
        </div>
      </div>

      <p className="mt-2 text-xs leading-6 text-white/60">{info.description}</p>

      {info.holder === "escrow" && (
        <div className="mt-2 flex items-center gap-2 text-[10px] font-bold text-emerald-300">
          <span>🔒</span>
          <span>لا يمكن لأي طرف التصرف بالمال منفرداً</span>
        </div>
      )}
    </div>
  );
}
