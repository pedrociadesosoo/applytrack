"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ApplicationStage, EmailSignal } from "@/lib/types";
import { STAGE_LABELS, STAGE_ORDER } from "@/lib/types";
import { formatDate } from "@/lib/format";

const STAGE_CHOICES = STAGE_ORDER.filter((s) => s !== "ghosted" && s !== "withdrawn");

// Human-in-the-loop: emails the sync wasn't confident about. Confirm (after
// fixing anything it guessed wrong) or dismiss.
export default function ReviewPage() {
  const [signals, setSignals] = useState<EmailSignal[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/review")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setSignals(data.signals);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  const remove = (id: string) => setSignals((prev) => (prev ?? []).filter((s) => s.id !== id));

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <Link href="/" className="text-sm text-neutral-400 hover:text-neutral-600">
        ← All applications
      </Link>
      <h1 className="mt-3 text-xl font-semibold text-neutral-900">Review emails</h1>
      <p className="mt-1 text-sm text-neutral-500">
        The sync wasn&apos;t sure about these. Fix anything it guessed wrong, then confirm or dismiss.
      </p>

      {error && <p className="mt-6 text-sm text-rose-600">{error}</p>}
      {!signals && !error && <p className="mt-6 text-sm text-neutral-400">Loading…</p>}
      {signals && signals.length === 0 && (
        <div className="mt-6 rounded-xl border border-dashed border-neutral-200 py-16 text-center text-sm text-neutral-500">
          Nothing to review. 🎉
        </div>
      )}

      <div className="mt-6 space-y-4">
        {signals?.map((signal) => (
          <ReviewCard key={signal.id} signal={signal} onDone={() => remove(signal.id)} />
        ))}
      </div>
    </div>
  );
}

function ReviewCard({ signal, onDone }: { signal: EmailSignal; onDone: () => void }) {
  const [company, setCompany] = useState(signal.company_guess ?? "");
  const [role, setRole] = useState(signal.role_guess ?? "");
  const [stage, setStage] = useState<ApplicationStage>(signal.suggested_stage ?? "applied");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function act(action: "confirm" | "dismiss") {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/review/${signal.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, company, role_title: role, stage }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      onDone();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  const input =
    "w-full rounded-md border border-neutral-200 bg-white px-2.5 py-1.5 text-sm text-neutral-800";

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-medium text-neutral-900">{signal.subject || "(no subject)"}</p>
        <span className="text-xs text-neutral-400">{formatDate(signal.received_at)}</span>
      </div>
      <p className="mt-0.5 truncate text-xs text-neutral-400">{signal.from_header}</p>
      {signal.snippet && <p className="mt-2 text-sm text-neutral-600 line-clamp-3">{signal.snippet}</p>}
      {signal.reason && (
        <p className="mt-2 text-xs text-amber-700">Flagged because: {signal.reason}</p>
      )}

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <input className={input} placeholder="Company" value={company} onChange={(e) => setCompany(e.target.value)} />
        <input className={input} placeholder="Role (optional)" value={role} onChange={(e) => setRole(e.target.value)} />
        <select className={input} value={stage} onChange={(e) => setStage(e.target.value as ApplicationStage)}>
          {STAGE_CHOICES.map((s) => (
            <option key={s} value={s}>
              {STAGE_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={() => act("confirm")}
          disabled={busy || !company.trim()}
          className="rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          Confirm
        </button>
        <button
          onClick={() => act("dismiss")}
          disabled={busy}
          className="rounded-lg px-3 py-1.5 text-xs font-medium text-neutral-500 hover:bg-neutral-100"
        >
          Not job-related
        </button>
        {error && <span className="text-xs text-rose-600">{error}</span>}
      </div>
    </div>
  );
}
