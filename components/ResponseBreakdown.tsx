"use client";

import { useState } from "react";
import type { DashboardStats, Outcomes } from "@/lib/stats";
import { RESPONSE_STAGES } from "@/lib/stats";
import { STAGE_LABELS } from "@/lib/types";

// Explains the response-rate number: every application lands in exactly one
// segment, and the colored segments together ARE the response rate.

const SEGMENTS: { key: keyof Outcomes; label: string; color: string; heardBack: boolean; hint: string }[] = [
  { key: "offer", label: "Offer", color: "#1baf7a", heardBack: true, hint: "Got an offer" },
  { key: "inProcess", label: "In process", color: "#2a78d6", heardBack: true, hint: "Heard back and still moving (OA, HireVue, interviews)" },
  { key: "rejected", label: "Rejected", color: "#eb6834", heardBack: true, hint: "Heard back with a no" },
  { key: "wentQuiet", label: "Went quiet", color: "#898781", heardBack: true, hint: "Heard back once, then ghosted or withdrawn" },
  { key: "noResponse", label: "No response yet", color: "#e1e0d9", heardBack: false, hint: "Still at Applied, or ghosted without a reply" },
];

const pct = (n: number, total: number) => (total ? Math.round((n / total) * 100) : 0);

export default function ResponseBreakdown({ stats }: { stats: DashboardStats }) {
  const [hovered, setHovered] = useState<keyof Outcomes | null>(null);
  const { total, outcomes } = stats;
  const visible = SEGMENTS.filter((s) => outcomes[s.key] > 0);
  const heardBackWidth = total ? (stats.responded / total) * 100 : 0;
  const active = SEGMENTS.find((s) => s.key === hovered);

  const maxReached = Math.max(1, ...RESPONSE_STAGES.map((s) => stats.reached[s] ?? 0));

  return (
    <div className="space-y-10">
      {/* Headline */}
      <div>
        <p className="text-5xl font-semibold tracking-tight text-neutral-900">{pct(stats.responded, total)}%</p>
        <p className="mt-1 text-sm text-neutral-500">
          {stats.responded} of {total} applications heard back from the company — any reply counts,
          including OAs, HireVues and rejections.
        </p>
      </div>

      {/* Part-to-whole bar */}
      <section>
        <h3 className="text-sm font-semibold text-neutral-900">Where every application stands</h3>

        {total === 0 ? (
          <p className="mt-3 text-sm text-neutral-400">No applications yet.</p>
        ) : (
          <>
            <div className="mt-6">
              {stats.responded > 0 && (
                <div className="mb-1.5 border-t-2 border-neutral-800 pt-1" style={{ width: `${heardBackWidth}%` }}>
                  <span className="whitespace-nowrap text-xs font-medium text-neutral-700">
                    Heard back · {pct(stats.responded, total)}%
                  </span>
                </div>
              )}
              <div className="flex h-8 w-full gap-[2px]" onMouseLeave={() => setHovered(null)}>
                {visible.map((seg, i) => (
                  <button
                    key={seg.key}
                    onMouseEnter={() => setHovered(seg.key)}
                    onFocus={() => setHovered(seg.key)}
                    onBlur={() => setHovered(null)}
                    aria-label={`${seg.label}: ${outcomes[seg.key]} (${pct(outcomes[seg.key], total)}%)`}
                    className={`h-full transition-opacity ${i === 0 ? "rounded-l" : ""} ${
                      i === visible.length - 1 ? "rounded-r" : ""
                    } ${hovered && hovered !== seg.key ? "opacity-40" : ""}`}
                    style={{ width: `${(outcomes[seg.key] / total) * 100}%`, background: seg.color, minWidth: 6 }}
                  />
                ))}
              </div>
              <p className="mt-2 h-5 text-xs text-neutral-600">
                {active
                  ? `${active.label}: ${outcomes[active.key]} application${outcomes[active.key] === 1 ? "" : "s"} (${pct(outcomes[active.key], total)}%) — ${active.hint}`
                  : "Hover a segment for details"}
              </p>
            </div>

            {/* Legend doubles as the table view */}
            <table className="mt-3 w-full text-sm">
              <tbody>
                {SEGMENTS.map((seg) => (
                  <tr
                    key={seg.key}
                    onMouseEnter={() => setHovered(seg.key)}
                    onMouseLeave={() => setHovered(null)}
                    className={`border-b border-neutral-100 last:border-0 ${hovered === seg.key ? "bg-neutral-50" : ""}`}
                  >
                    <td className="py-2 pr-2">
                      <span className="inline-block h-3 w-3 rounded-sm align-middle" style={{ background: seg.color }} />
                    </td>
                    <td className="w-full py-2 text-neutral-800">
                      {seg.label}
                      {seg.key === "offer" && outcomes.offer > 0 && (
                        <span className="ml-1.5 text-xs text-neutral-400">
                          ({stats.offerDecisions.accepted} accepted · {stats.offerDecisions.declined} declined ·{" "}
                          {stats.offerDecisions.pending} deciding)
                        </span>
                      )}
                      {!seg.heardBack && <span className="ml-1.5 text-xs text-neutral-400">(not counted)</span>}
                    </td>
                    <td className="py-2 pl-4 text-right font-semibold tabular-nums text-neutral-900">{outcomes[seg.key]}</td>
                    <td className="py-2 pl-3 text-right tabular-nums text-neutral-400">{pct(outcomes[seg.key], total)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </section>

      {/* Every step reached */}
      <section>
        <h3 className="text-sm font-semibold text-neutral-900">Every step you&apos;ve reached</h3>
        <p className="mt-0.5 text-xs text-neutral-500">
          How many applications ever got each kind of reply. One application can show up in several rows
          (e.g. an OA, then a rejection).
        </p>
        <ul className="mt-4 space-y-2.5">
          {RESPONSE_STAGES.map((stage) => {
            const n = stats.reached[stage] ?? 0;
            return (
              <li key={stage} className="group grid grid-cols-[7.5rem_1fr_3.5rem] items-center gap-3" title={`${n} of ${total} applications (${pct(n, total)}%)`}>
                <span className="truncate text-sm text-neutral-600">
                  {stage === "rejected" ? "Rejection" : STAGE_LABELS[stage]}
                </span>
                <span className="h-5 rounded-r bg-neutral-50">
                  <span
                    className="block h-full rounded-r transition-all group-hover:brightness-110"
                    style={{ width: `${(n / maxReached) * 100}%`, background: "#2a78d6", minWidth: n ? 4 : 0 }}
                  />
                </span>
                <span className="text-right text-sm tabular-nums">
                  <span className="font-semibold text-neutral-900">{n}</span>
                  <span className="ml-1 text-xs text-neutral-400">{pct(n, total)}%</span>
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="rounded-lg bg-neutral-50 p-4 text-sm text-neutral-600">
        <span className="font-semibold text-neutral-900">Interview conversion: {pct(stats.interviewed, total)}%</span>
        <span className="block mt-0.5">
          {stats.interviewed} of {total} applications reached a live interview (phone screen or later). OAs and
          HireVues count as hearing back, not as interviews.
        </span>
      </section>
    </div>
  );
}
