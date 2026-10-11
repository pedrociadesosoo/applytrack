"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ApplicationEvent, ApplicationStage } from "@/lib/types";
import { STAGE_LABELS, STAGE_ORDER } from "@/lib/types";

// Fix an application's journey: change a step's stage, date, or note,
// remove a wrong step, or add one the sync missed.
export default function JourneyEditor({
  applicationId,
  events,
  onDone,
}: {
  applicationId: string;
  events: ApplicationEvent[];
  onDone: () => void;
}) {
  const router = useRouter();
  const sorted = [...events].sort((a, b) => a.event_date.localeCompare(b.event_date));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [adding, setAdding] = useState({ stage: "oa" as ApplicationStage, date: new Date().toISOString().slice(0, 10), notes: "" });

  async function call(url: string, method: string, body?: unknown) {
    setBusy(true);
    setError(null);
    const res = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Something went wrong");
      return false;
    }
    router.refresh();
    return true;
  }

  const input = "rounded-xl border border-neutral-200 bg-white px-2.5 py-1.5 text-sm text-neutral-800";

  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {sorted.map((e) => (
          <EventRow key={e.id} event={e} input={input} busy={busy} onSave={(patch) => call(`/api/applications/${applicationId}/events/${e.id}`, "PATCH", patch)} onDelete={() => call(`/api/applications/${applicationId}/events/${e.id}`, "DELETE")} />
        ))}
      </ul>

      <div className="rounded-2xl border border-dashed border-neutral-300 p-3">
        <p className="mb-2 text-xs font-semibold text-neutral-600">Add a Missing Step</p>
        <div className="flex flex-wrap gap-2">
          <select className={input} value={adding.stage} onChange={(e) => setAdding((a) => ({ ...a, stage: e.target.value as ApplicationStage }))}>
            {STAGE_ORDER.map((s) => (
              <option key={s} value={s}>
                {STAGE_LABELS[s]}
              </option>
            ))}
          </select>
          <input type="date" className={input} value={adding.date} onChange={(e) => setAdding((a) => ({ ...a, date: e.target.value }))} />
          <input className={`${input} min-w-[10rem] flex-1`} placeholder="Note (optional)" value={adding.notes} onChange={(e) => setAdding((a) => ({ ...a, notes: e.target.value }))} />
          <button
            disabled={busy}
            onClick={async () => {
              if (await call(`/api/applications/${applicationId}/events`, "POST", adding)) setAdding((a) => ({ ...a, notes: "" }));
            }}
            className="rounded-full bg-neutral-900 px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
          >
            Add Step
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={onDone} className="rounded-full border border-neutral-200 px-4 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50">
          Done Editing
        </button>
        <p className="text-xs text-neutral-500">The current stage always follows the latest step.</p>
      </div>
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  );
}

function EventRow({
  event,
  input,
  busy,
  onSave,
  onDelete,
}: {
  event: ApplicationEvent;
  input: string;
  busy: boolean;
  onSave: (patch: { stage: ApplicationStage; date: string; notes: string }) => Promise<boolean>;
  onDelete: () => Promise<boolean>;
}) {
  const original = { stage: event.stage, date: event.event_date.slice(0, 10), notes: event.notes ?? "" };
  const [draft, setDraft] = useState(original);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const dirty = draft.stage !== original.stage || draft.date !== original.date || draft.notes !== original.notes;

  return (
    <li className="flex flex-wrap items-center gap-2 rounded-2xl bg-neutral-50 p-2.5">
      <select className={input} value={draft.stage} onChange={(e) => setDraft((d) => ({ ...d, stage: e.target.value as ApplicationStage }))}>
        {STAGE_ORDER.map((s) => (
          <option key={s} value={s}>
            {STAGE_LABELS[s]}
          </option>
        ))}
      </select>
      <input type="date" className={input} value={draft.date} onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))} />
      <input className={`${input} min-w-[10rem] flex-1`} value={draft.notes} placeholder="Note" onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))} />
      {dirty && (
        <button disabled={busy} onClick={() => onSave(draft)} className="rounded-full bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">
          Save
        </button>
      )}
      {confirmDelete ? (
        <span className="flex items-center gap-1 text-xs">
          <button disabled={busy} onClick={onDelete} className="rounded-full bg-rose-600 px-3 py-1.5 font-semibold text-white">
            Remove
          </button>
          <button onClick={() => setConfirmDelete(false)} className="rounded-full px-2 py-1.5 text-neutral-500">
            Keep
          </button>
        </span>
      ) : (
        <button onClick={() => setConfirmDelete(true)} className="rounded-full px-3 py-1.5 text-xs font-medium text-neutral-500 hover:bg-neutral-100" aria-label="Remove this step">
          Remove
        </button>
      )}
    </li>
  );
}
