"use client";

// A stat tile that opens a detail panel. Plain tiles (no onClick) render static.
export default function StatTile({
  label,
  value,
  caption,
  tone = "default",
  onClick,
}: {
  label: string;
  value: string;
  caption?: string;
  tone?: "default" | "attention";
  onClick?: () => void;
}) {
  const attention = tone === "attention";
  const base = `group rounded-xl border bg-white p-4 text-left shadow-sm transition ${
    attention ? "border-amber-200" : "border-neutral-200"
  }`;
  const body = (
    <>
      <p className="flex items-center justify-between text-xs font-medium uppercase tracking-wide text-neutral-400">
        <span>{label}</span>
        {attention && <span aria-hidden className="h-2 w-2 rounded-full bg-amber-400" />}
      </p>
      <p className="mt-1 text-2xl font-semibold text-neutral-900">{value}</p>
      {(caption || onClick) && (
        <p className="mt-1 flex items-center justify-between text-xs text-neutral-500">
          <span>{caption}</span>
          {onClick && (
            <span className="font-medium text-indigo-600 opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
              Details →
            </span>
          )}
        </p>
      )}
    </>
  );

  if (!onClick) return <div className={base}>{body}</div>;
  return (
    <button
      onClick={onClick}
      className={`${base} cursor-pointer hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400`}
    >
      {body}
    </button>
  );
}
