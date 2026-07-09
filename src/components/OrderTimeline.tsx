"use client";

type Step = {
  key: string;
  label: string;
  icon: string;
  done: boolean;
  active: boolean;
};

const ORDER_STEPS: { key: string; label: string; icon: string }[] = [
  { key: "awaiting_payment_proof", label: "بانتظار الدفع", icon: "💳" },
  { key: "payment_under_review", label: "الدفع قيد المراجعة", icon: "🔍" },
  { key: "payment_confirmed_waiting_code", label: "تم تأكيد الدفع", icon: "✅" },
  { key: "code_verified_deliver_now", label: "بانتظار التسليم", icon: "📦" },
  { key: "delivered", label: "تم التسليم", icon: "🎉" },
];

const DISPUTED = { key: "disputed", label: "في نزاع", icon: "⚖️" };

function getSteps(currentStatus: string): Step[] {
  const statusOrder = ORDER_STEPS.map((s) => s.key);
  const currentIndex = statusOrder.indexOf(currentStatus);

  if (currentStatus === "disputed") {
    return ORDER_STEPS.map((s) => ({
      ...s,
      done: false,
      active: false,
    })).concat({ ...DISPUTED, done: false, active: true });
  }

  if (currentStatus === "payment_rejected") {
    return ORDER_STEPS.map((s, i) => ({
      ...s,
      done: false,
      active: i === 0,
    }));
  }

  return ORDER_STEPS.map((s, i) => ({
    ...s,
    done: i < currentIndex,
    active: i === currentIndex,
  }));
}

export default function OrderTimeline({ status }: { status: string }) {
  const steps = getSteps(status);

  return (
    <div className="relative">
      {steps.map((step, i) => (
        <div key={step.key} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm transition-all duration-300 ${
                step.active
                  ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 animate-pulse-glow"
                  : step.done
                  ? "bg-emerald-500 text-white"
                  : "bg-white/5 text-white/30"
              }`}
            >
              {step.done ? "✓" : step.icon}
            </div>
            {i < steps.length - 1 && (
              <div
                className={`mt-1 h-8 w-px ${
                  step.done ? "bg-emerald-500/30" : "bg-white/5"
                }`}
              />
            )}
          </div>
          <div className={`pb-6 ${step.active ? "opacity-100" : step.done ? "opacity-60" : "opacity-30"}`}>
            <div className="text-sm font-bold text-white">{step.label}</div>
            {step.active && (
              <div className="mt-1 text-xs text-indigo-300 animate-fade-in">
                {step.done ? "مكتمل" : "جاري..."}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
