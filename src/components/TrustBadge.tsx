"use client";

type BadgeVariant = "shield" | "dispute" | "secure" | "encrypted" | "guaranteed" | "verified";

const badgeConfig: Record<BadgeVariant, { icon: string; label: string; description: string; color: string }> = {
  shield: {
    icon: "🛡️",
    label: "وساطة آمنة",
    description: "الأموال محفوظة في حساب وساطة حتى اكتمال الطلب",
    color: "border-emerald-400/20 bg-emerald-500/10 text-emerald-300",
  },
  dispute: {
    icon: "⚖️",
    label: "نظام نزاعات",
    description: "يمكنك فتح نزاع إذا لم تحصل على المنتج",
    color: "border-indigo-400/20 bg-indigo-500/10 text-indigo-300",
  },
  secure: {
    icon: "🔒",
    label: "دفع آمن",
    description: "معلومات الدفع مشفرة بالكامل",
    color: "border-amber-400/20 bg-amber-500/10 text-amber-300",
  },
  encrypted: {
    icon: "🔐",
    label: "تشفير كامل",
    description: "جميع البيانات مشفرة AES-256-GCM",
    color: "border-cyan-400/20 bg-cyan-500/10 text-cyan-300",
  },
  guaranteed: {
    icon: "✅",
    label: "تسليم مضمون",
    description: "ضمان استلام المنتج أو استرداد الأموال",
    color: "border-emerald-400/20 bg-emerald-500/10 text-emerald-300",
  },
  verified: {
    icon: "✓",
    label: "مستخدم موثوق",
    description: "هذا البائع موثق من قبل الإدارة",
    color: "border-sky-400/20 bg-sky-500/10 text-sky-300",
  },
};

export default function TrustBadge({
  variant,
  showDescription = false,
  size = "sm",
}: {
  variant: BadgeVariant;
  showDescription?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const cfg = badgeConfig[variant];

  if (showDescription) {
    return (
      <div className={`flex items-start gap-3 rounded-2xl border ${cfg.color} p-4`}>
        <span className="mt-0.5 text-xl">{cfg.icon}</span>
        <div>
          <div className={`font-bold text-white ${size === "lg" ? "text-base" : "text-sm"}`}>{cfg.label}</div>
          <div className="mt-0.5 text-xs leading-6 text-white/60">{cfg.description}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`trust-badge border ${cfg.color}`}>
      <span>{cfg.icon}</span>
      <span>{cfg.label}</span>
    </div>
  );
}
