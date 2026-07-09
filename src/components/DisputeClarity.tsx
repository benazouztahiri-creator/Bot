"use client";

const disputeSteps = [
  {
    icon: "⚠️",
    title: "فتح النزاع",
    desc: "المشتري أو البائع يصف المشكلة بالتفصيل.",
    color: "text-amber-300",
    border: "border-amber-400/20",
    bg: "bg-amber-500/10",
  },
  {
    icon: "💬",
    title: "تواصل الطرفين",
    desc: "المشتري، البائع، والإدارة يتناقشون في دردشة جماعية لحل المشكلة.",
    color: "text-indigo-300",
    border: "border-indigo-400/20",
    bg: "bg-indigo-500/10",
  },
  {
    icon: "🔍",
    title: "مراجعة الإدارة",
    desc: "الإدارة تراجع الأدلة (إثبات الدفع، التسليم، المحادثات) وتتخذ قراراً.",
    color: "text-sky-300",
    border: "border-sky-400/20",
    bg: "bg-sky-500/10",
  },
  {
    icon: "⚖️",
    title: "القرار النهائي",
    desc: "إما استرداد أموال المشتري أو تحرير الدفع للبائع بناءً على الأدلة.",
    color: "text-emerald-300",
    border: "border-emerald-400/20",
    bg: "bg-emerald-500/10",
  },
];

export default function DisputeClarity() {
  return (
    <div className="rounded-3xl border border-rose-400/20 bg-gradient-to-br from-rose-500/5 to-indigo-500/5 p-6 md:p-8 animate-fade-in-up">
      <div className="flex items-center gap-3 mb-6">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-500/20 text-lg">⚖️</span>
        <div>
          <div className="text-lg font-black text-white">كيف يعمل نظام النزاعات؟</div>
          <div className="text-xs text-white/50">حل عادل وشفاف لجميع الأطراف</div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {disputeSteps.map((step, i) => (
          <div
            key={i}
            className={`rounded-2xl border ${step.border} ${step.bg} p-4 transition-all duration-300 hover:scale-[1.02]`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{step.icon}</span>
              <div>
                <div className={`text-sm font-black ${step.color}`}>{step.title}</div>
                <div className="mt-0.5 text-xs leading-6 text-white/60">{step.desc}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3">
        <p className="text-center text-xs font-bold text-emerald-300">
          🤝 نظام النزاعات يضمن حقوق جميع الأطراف — المال مجمّد في حساب الوساطة حتى يتم الحل
        </p>
      </div>
    </div>
  );
}
