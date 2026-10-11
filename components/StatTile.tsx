"use client";

// A pastel stat card. Clickable ones open a detail panel.
export default function StatTile({
  label,
  value,
  caption,
  tint = 1,
  attention = false,
  onClick,
}: {
  label: string;
  value: string;
  caption?: string;
  tint?: 1 | 2 | 3 | 4;
  attention?: boolean;
  onClick?: () => void;
}) {
  const base = "group relative flex min-h-[8.5rem] flex-col rounded-3xl p-5 text-left transition";
  const style = { background: `var(--tile-${tint})` };
  const body = (
    <>
      <p className="flex items-start justify-between gap-2 text-sm font-semibold text-neutral-800">
        <span>{label}</span>
        {attention && (
          <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-700">
            Needs you
          </span>
        )}
      </p>
      <p className="mt-auto pt-3 text-4xl font-bold tracking-tight text-neutral-900">{value}</p>
      <p className="mt-1 flex items-center justify-between text-xs text-neutral-700">
        <span>{caption}</span>
        {onClick && (
          <span className="rounded-full bg-white/70 px-2 py-0.5 font-semibold opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
            Details →
          </span>
        )}
      </p>
    </>
  );

  if (!onClick) return <div className={base} style={style}>{body}</div>;
  return (
    <button
      onClick={onClick}
      style={style}
      className={`${base} cursor-pointer hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900`}
    >
      {body}
    </button>
  );
}
