"use client";

import type { ApplicationStage, OfferDecision } from "@/lib/types";
import { formatDate } from "@/lib/format";
import { pillLabel, pillStyle } from "@/components/StageBadge";

export interface JourneyEvent {
  stage: ApplicationStage;
  event_date: string;
  notes: string | null;
}

// Every stage an application has been through, as a row of pills. Hover
// (or tab to) a pill to see when it happened and why.
export default function StageJourney({
  events,
  current,
  decision,
  size = "md",
}: {
  events: JourneyEvent[];
  current: ApplicationStage;
  decision?: OfferDecision | null;
  size?: "sm" | "md";
}) {
  const sorted = [...events].sort((a, b) => a.event_date.localeCompare(b.event_date));
  const steps: { stage: ApplicationStage; date: string | null; notes: string[] }[] = [];
  for (const e of sorted) {
    const last = steps[steps.length - 1];
    if (last && last.stage === e.stage) {
      if (e.notes) last.notes.push(e.notes);
      continue;
    }
    steps.push({ stage: e.stage, date: e.event_date, notes: e.notes ? [e.notes] : [] });
  }
  if (!steps.length || steps[steps.length - 1].stage !== current) {
    steps.push({ stage: current, date: null, notes: [] });
  }

  const pill = size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs";

  return (
    <ol className="flex flex-wrap items-center gap-y-2" aria-label="Stage journey">
      {steps.map((step, i) => {
        const isCurrent = i === steps.length - 1;
        return (
          <li key={`${step.stage}-${i}`} className="flex items-center">
            {i > 0 && (
              <svg width="14" height="14" viewBox="0 0 24 24" className="mx-0.5 shrink-0 text-neutral-300" aria-hidden>
                <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            )}
            <span
              tabIndex={0}
              className={`group/pill relative inline-flex cursor-default items-center whitespace-nowrap rounded-full border font-medium outline-none transition hover:-translate-y-0.5 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-400 ${pill} ${pillStyle(
                step.stage,
                step.stage === "offer" ? decision : undefined
              )} ${isCurrent ? "font-semibold shadow-sm" : "opacity-80"}`}
            >
              {pillLabel(step.stage, step.stage === "offer" ? decision : undefined)}
              <span
                role="tooltip"
                className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 w-max max-w-[15rem] -translate-x-1/2 translate-y-1 rounded-xl bg-neutral-900 px-3 py-2 text-left text-[11px] font-normal leading-snug whitespace-normal text-white opacity-0 shadow-lg transition group-hover/pill:translate-y-0 group-hover/pill:opacity-100 group-focus/pill:translate-y-0 group-focus/pill:opacity-100"
              >
                <span className="block font-semibold">
                  {step.date ? formatDate(step.date) : "Current stage"}
                  {isCurrent && step.date ? " · now" : ""}
                </span>
                {step.notes.length > 0 && <span className="mt-0.5 block text-white/80">{step.notes[step.notes.length - 1]}</span>}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
