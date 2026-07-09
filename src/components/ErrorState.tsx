"use client";

export default function ErrorState({
  title = "حدث خطأ",
  message,
  solution,
  onRetry,
}: {
  title?: string;
  message?: string;
  solution?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 animate-error-shake text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-rose-500/10 text-4xl">
        ⚠️
      </div>
      <h3 className="mt-6 text-xl font-black text-white">{title}</h3>
      {message && (
        <p className="mt-2 max-w-sm text-sm leading-7 text-white/60">{message}</p>
      )}
      {solution && (
        <p className="mt-3 max-w-sm rounded-xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm font-bold text-amber-200">
          💡 {solution}
        </p>
      )}
      {onRetry && (
        <button className="btn-primary mt-8 px-8 py-3" onClick={onRetry}>
          إعادة المحاولة
        </button>
      )}
    </div>
  );
}
