const steps = [
  {
    icon: "💰",
    title: "يدفع المشتري",
    desc: "المبلغ يُحفظ في حساب الوساطة (Escrow) — ليس للإدارة ولا للمشتري بعد.",
    color: "from-amber-500/20 to-amber-600/10 border-amber-400/20",
    iconBg: "bg-amber-500/20",
  },
  {
    icon: "🤝",
    title: "الوسيط يحمي الطرفين",
    desc: "الإدارة تؤكد الدفع وتسلم الحساب، والمشتري يستلم ويختبر المنتج.",
    color: "from-indigo-500/20 to-indigo-600/10 border-indigo-400/20",
    iconBg: "bg-indigo-500/20",
  },
  {
    icon: "✅",
    title: "تسليم + إتمام",
    desc: "المشتري يؤكد الاستلام → الأموال تتحرر. الكل رابح.",
    color: "from-emerald-500/20 to-emerald-600/10 border-emerald-400/20",
    iconBg: "bg-emerald-500/20",
  },
];

export default function EscrowFlow({ compact = false }: { compact?: boolean }) {
  return (
    <div className="rounded-3xl border border-indigo-400/20 bg-gradient-to-br from-indigo-500/5 to-emerald-500/5 p-6 md:p-8 animate-fade-in-up">
      <div className="flex items-center gap-3 mb-6">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/20 text-lg">🛡️</span>
        <div>
          <div className="text-lg font-black text-white">كيف تعمل الوساطة؟</div>
          <div className="text-xs text-white/50">أموالك آمنة في كل خطوة</div>
        </div>
      </div>

      <div className={`grid gap-4 md:grid-cols-3`}>
        {steps.map((step, i) => (
          <div
            key={i}
            className={`relative rounded-2xl border bg-gradient-to-br ${step.color} p-4 animate-slide-up-fade`}
            style={{ animationDelay: `${(i + 1) * 150}ms` }}
          >
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${step.iconBg} text-2xl`}>
              {step.icon}
            </div>
            <div className="mt-3 text-sm font-black text-white">{step.title}</div>
            <div className="mt-1 text-xs leading-6 text-white/60">{step.desc}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-center">
        <p className="text-sm font-bold text-emerald-300">
          🛡️ أموالك محمية بواسطة نظام الوساطة — لا يمكن لأي طرف استخدامها بدون موافقة الطرف الآخر
        </p>
      </div>
    </div>
  );
}
