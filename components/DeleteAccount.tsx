"use client";

import { useState } from "react";

// Settings danger zone: type DELETE to permanently remove everything.
export default function DeleteAccount() {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/account", { method: "DELETE" });
    if (res.ok) {
      window.location.href = "/login";
      return;
    }
    const data = await res.json().catch(() => ({}));
    setError(data.error ?? "Couldn't delete your account. Try again.");
    setBusy(false);
  }

  return (
    <section className="mt-5 rounded-2xl border border-rose-200 bg-white p-6">
      <h2 className="text-base font-semibold text-neutral-900">Delete My Account</h2>
      <p className="mt-0.5 text-sm text-neutral-500">
        Disconnects Gmail and permanently deletes your applications, history, saved email details, settings, and
        account. This can&apos;t be undone.
      </p>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="mt-4 rounded-full border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50"
        >
          Delete My Account…
        </button>
      ) : (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-neutral-700">
            Type <b>DELETE</b> to confirm.
          </p>
          <div className="flex flex-wrap gap-2">
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              className="rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm"
              aria-label="Type DELETE to confirm"
            />
            <button
              disabled={typed !== "DELETE" || busy}
              onClick={remove}
              className="rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
            >
              {busy ? "Deleting…" : "Permanently Delete"}
            </button>
            <button onClick={() => { setOpen(false); setTyped(""); }} className="rounded-full px-3 py-2 text-sm text-neutral-500 hover:bg-neutral-100">
              Cancel
            </button>
          </div>
          {error && <p className="text-sm text-rose-600">{error}</p>}
        </div>
      )}
    </section>
  );
}
