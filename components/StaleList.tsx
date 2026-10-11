"use client";

import { useState } from "react";
import Link from "next/link";
import type { StaleItem } from "@/lib/stats";
import StageBadge from "@/components/StageBadge";

// Follow-up queue: open applications with no movement in 10+ days, longest
// waits first. Each row has the three things you'd actually do next.
export default function StaleList({ items, onChanged }: { items: StaleItem[]; onChanged: () => void }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [done, setDone] = useState<Record<string, string>>({});

  async function patch(id: string, body: Record<string, unknown>, label: string) {
    setBusy(id);
    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      setDone((d) => ({ ...d, [id]: label }));
      onChanged();
    } catch {
      setDone((d) => ({ ...d, [id]: "Something went wrong — try again" }));
    } finally {
      setBusy(null);
    }
  }

  const inAWeek = () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  };

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-neutral-200 py-16 text-center">
        <p className="text-sm font-medium text-neutral-700">Nothing stale. You&apos;re on top of it.</p>
        <p className="mt-1 text-xs text-neutral-400">Open applications show up here after 10 days without news.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => {
        const urgency =
          item.daysIdle >= 21
            ? { cls: "bg-rose-100 text-rose-700", label: "Overdue" }
            : item.daysIdle >= 14
              ? { cls: "bg-amber-100 text-amber-800", label: "Follow up" }
              : { cls: "bg-neutral-100 text-neutral-600", label: "Check in" };
        return (
          <li key={item.id} className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">{item.company}</p>
                <Link
                  href={`/applications/${item.id}`}
                  className="block truncate text-sm font-medium text-neutral-900 hover:text-indigo-600"
                >
                  {item.role_title}
                </Link>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <StageBadge stage={item.current_stage} />
                  {item.nextAction && <span className="text-xs text-neutral-500">Next: {item.nextAction}</span>}
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xl font-semibold tabular-nums text-neutral-900">{item.daysIdle}d</p>
                <p className="text-[11px] text-neutral-400">since last update</p>
                <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${urgency.cls}`}>
                  {urgency.label}
                </span>
              </div>
            </div>

            {done[item.id] ? (
              <p className="mt-3 text-xs font-medium text-emerald-700">✓ {done[item.id]}</p>
            ) : (
              <div className="mt-3 flex flex-wrap gap-2">
                {item.contactEmail && (
                  <a
                    href={`mailto:${item.contactEmail}?subject=${encodeURIComponent(`Following up — ${item.role_title}`)}`}
                    className="rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-800"
                  >
                    Email recruiter
                  </a>
                )}
                <button
                  disabled={busy === item.id}
                  onClick={() =>
                    patch(
                      item.id,
                      { next_action: item.nextAction || "Follow up", next_action_date: inAWeek() },
                      "Reminder set for next week"
                    )
                  }
                  className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
                >
                  Followed up · remind me in 7d
                </button>
                <button
                  disabled={busy === item.id}
                  onClick={() => patch(item.id, { current_stage: "ghosted" }, "Marked as ghosted")}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-neutral-500 hover:bg-neutral-100 disabled:opacity-50"
                >
                  Mark ghosted
                </button>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
