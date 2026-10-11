"use client";

import { useState } from "react";
import type { ApplicationEvent, ApplicationStage, OfferDecision } from "@/lib/types";
import StageJourney from "@/components/StageJourney";
import JourneyEditor from "@/components/JourneyEditor";
import { formatDate, relativeTime } from "@/lib/format";
import { STAGE_LABELS } from "@/lib/types";

export default function JourneySection({
  applicationId,
  events,
  current,
  decision,
}: {
  applicationId: string;
  events: ApplicationEvent[];
  current: ApplicationStage;
  decision: OfferDecision | null;
}) {
  const [editing, setEditing] = useState(false);
  return (
    <section>
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-neutral-900">Journey</h2>
        {!editing && (
          <button onClick={() => setEditing(true)} className="text-xs font-medium text-indigo-600 hover:text-indigo-700">
            Edit journey
          </button>
        )}
      </div>
      <p className="mt-0.5 text-xs text-neutral-500">
        {editing ? "Fix any step that isn’t right." : "Every stage this application has been through. Hover a stage for details."}
      </p>
      <div className="mt-4 rounded-3xl bg-white p-5 shadow-sm">
        {editing ? (
          <JourneyEditor applicationId={applicationId} events={events} onDone={() => setEditing(false)} />
        ) : (
          <>
            <StageJourney events={events} current={current} decision={decision} />
            <details className="group mt-4 border-t border-neutral-100 pt-3">
              <summary className="cursor-pointer list-none text-xs font-medium text-neutral-500 hover:text-neutral-800">
                <span className="inline-block transition group-open:rotate-90">›</span> Full history ({events.length})
              </summary>
              <ol className="mt-3 space-y-2.5">
                {[...events]
                  .sort((a, b) => a.event_date.localeCompare(b.event_date))
                  .map((e) => (
                    <li key={e.id} className="text-sm">
                      <span className="font-medium text-neutral-800">{STAGE_LABELS[e.stage]}</span>
                      <span className="ml-2 text-xs text-neutral-400">
                        {formatDate(e.event_date)} · {relativeTime(e.event_date)}
                      </span>
                      {e.notes && <span className="block text-xs text-neutral-500">{e.notes}</span>}
                    </li>
                  ))}
              </ol>
            </details>
          </>
        )}
      </div>
    </section>
  );
}
