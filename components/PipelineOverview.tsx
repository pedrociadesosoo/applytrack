"use client";

import type { ApplicationStage } from "@/lib/types";
import { STAGE_LABELS } from "@/lib/types";
import { NO_REPLY_DAYS } from "@/lib/ghosting";

// The pipeline at a glance, left to right in the order a process moves.
// Bar length = how many applications sit at that stage right now (one hue:
// it's magnitude, not identity). Click a stage to filter the list below.

const ACTIVE: ApplicationStage[] = [
  "applied", "oa", "hirevue", "phone_screen", "behavioral", "technical_interview", "onsite", "offer",
];
const CLOSED: ApplicationStage[] = ["rejected", "ghosted", "withdrawn"];

const SHORT: Partial<Record<ApplicationStage, string>> = {
  phone_screen: "Phone",
  technical_interview: "Technical",
  onsite: "Onsite",
};

export default function PipelineOverview({
  byStage,
  selected,
  onSelect,
}: {
  byStage: Record<string, number>;
  selected: string;
  onSelect: (stage: string) => void;
}) {
  const max = Math.max(1, ...ACTIVE.map((s) => byStage[s] ?? 0));
  const toggle = (s: string) => onSelect(selected === s ? "" : s);

  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="text-sm font-semibold text-neutral-900">Where things stand</h3>
        {selected ? (
          <button onClick={() => onSelect("")} className="text-xs font-medium text-indigo-600 hover:text-indigo-700">
            Clear filter ✕
          </button>
        ) : (
          <span className="text-xs text-neutral-400">Click a stage to filter</span>
        )}
      </div>

      <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
        {ACTIVE.map((stage, i) => {
          const count = byStage[stage] ?? 0;
          const isSelected = selected === stage;
          const dim = selected && !isSelected;
          return (
            <li key={stage}>
              <button
                onClick={() => toggle(stage)}
                title={`${count} application${count === 1 ? "" : "s"} currently at ${STAGE_LABELS[stage]}`}
                className={`relative flex h-full w-full flex-col rounded-lg border px-3 py-2.5 text-left transition ${
                  isSelected
                    ? "border-indigo-400 bg-indigo-50/60 ring-1 ring-indigo-400"
                    : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50"
                } ${dim ? "opacity-50" : ""}`}
              >
                <span className="flex items-center gap-1 text-[11px] font-medium text-neutral-500">
                  <span className="tabular-nums text-neutral-300">{i + 1}</span>
                  {SHORT[stage] ?? STAGE_LABELS[stage]}
                </span>
                <span className={`mt-0.5 text-xl font-semibold ${count ? "text-neutral-900" : "text-neutral-300"}`}>
                  {count}
                </span>
                <span className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
                  <span
                    className="block h-full rounded-full transition-all"
                    style={{ width: `${(count / max) * 100}%`, background: "#2a78d6" }}
                  />
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-neutral-100 pt-3">
        <span className="text-xs text-neutral-400">Closed</span>
        {CLOSED.map((stage) => {
          const count = byStage[stage] ?? 0;
          const isSelected = selected === stage;
          return (
            <button
              key={stage}
              onClick={() => toggle(stage)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition ${
                isSelected
                  ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                  : "border-neutral-200 text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              {STAGE_LABELS[stage]}
              <span className="font-semibold text-neutral-900">{count}</span>
            </button>
          );
        })}
      </div>

      <details className="group mt-3 text-xs text-neutral-500">
        <summary className="cursor-pointer list-none font-medium text-neutral-500 hover:text-neutral-700">
          <span className="inline-block transition group-open:rotate-90">›</span> How does an application get ghosted?
        </summary>
        <div className="mt-2 space-y-2 rounded-lg bg-neutral-50 p-3 leading-relaxed">
          <p>ApplyTrack moves an open application to <b className="text-neutral-700">Ghosted</b> automatically when:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <b className="text-neutral-700">Its season starts with no outcome.</b> The season comes from the role title:
              Summer 2027 → Jun 1, 2027 · Fall → Sep 1 · Winter → Jan 5 · Spring → Jan 15. An intern role with only a
              year (&ldquo;2027 Intern&rdquo;) counts as that summer; a season with no year means the next one after you applied.
            </li>
            <li>
              <b className="text-neutral-700">Or, for roles without a season, there&apos;s been no reply at all {NO_REPLY_DAYS} days after applying.</b>
            </li>
          </ul>
          <p>
            Offers, rejections, and withdrawn applications are never touched. A later email from the company brings the
            application back, and if you move one out of Ghosted yourself, it stays where you put it. Each application&apos;s
            page shows its ghost date.
          </p>
        </div>
      </details>
    </section>
  );
}
