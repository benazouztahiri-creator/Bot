"use client";

export default function EmptyState({
  icon = "📭",
  title,
  description,
  action,
  onAction,
  actionLabel,
}: {
  icon?: string;
  title: string;
  description?: string;
  action?: boolean;
  onAction?: () => void;
  actionLabel?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 animate-fade-in-up text-center">
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500/10 to-emerald-500/10 text-5xl">
        {icon}
      </div>
      <h3 className="mt-6 text-xl font-black text-white">{title}</h3>
      {description && (
        <p className="mt-2 max-w-sm text-sm leading-7 text-white/60">{description}</p>
      )}
      {action && onAction && actionLabel && (
        <button className="btn-primary mt-8 px-8 py-3" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
