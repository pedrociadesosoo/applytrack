"use client";

import { useState } from "react";

interface SyncResult {
  scanned: number;
  created: number;
  updated: number;
  needsReview: number;
  remaining: number;
}

export default function GmailSyncButton({ onSynced }: { onSynced: () => void }) {
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  async function sync() {
    setSyncing(true);
    setMessage(null);
    try {
      const res = await fetch("/api/gmail/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Sync failed");
      const r: SyncResult = data.result;
      setIsError(false);
      setMessage(summarize(r));
      onSynced();
    } catch (err) {
      setIsError(true);
      setMessage((err as Error).message);
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="flex flex-col items-stretch gap-1 sm:items-end">
      <button
        onClick={sync}
        disabled={syncing}
        className="inline-flex items-center justify-center rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50 disabled:opacity-60"
      >
        {syncing ? "Syncing Gmail…" : "Sync Gmail"}
      </button>
      {message && (
        <p className={`text-xs ${isError ? "text-rose-600" : "text-neutral-500"}`}>{message}</p>
      )}
    </div>
  );
}

function summarize(r: SyncResult) {
  if (r.scanned === 0) return "Up to date — no new application emails.";
  const parts = [`Scanned ${r.scanned} emails`];
  if (r.created) parts.push(`${r.created} new application${r.created === 1 ? "" : "s"}`);
  if (r.updated) parts.push(`${r.updated} stage update${r.updated === 1 ? "" : "s"}`);
  if (r.needsReview) parts.push(`${r.needsReview} to review`);
  let text = parts.join(" · ");
  if (r.remaining) text += ` — ${r.remaining} more, sync again to continue`;
  return text;
}
