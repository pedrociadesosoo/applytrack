"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Application } from "@/lib/types";

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

// "This is a duplicate of…" — folds this application into another one.
export default function MergeApplication({ application }: { application: Application }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<Application[]>([]);
  const [target, setTarget] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    fetch("/api/applications")
      .then((r) => r.json())
      .then((d) => {
        const me = norm(application.company);
        const others = ((d.applications ?? []) as Application[]).filter((a) => a.id !== application.id);
        // Likely matches (similar company name) first.
        const score = (a: Application) => {
          const c = norm(a.company);
          return c === me ? 0 : c.startsWith(me.slice(0, 3)) || me.startsWith(c.slice(0, 3)) ? 1 : 2;
        };
        others.sort((a, b) => score(a) - score(b) || a.company.localeCompare(b.company));
        setOptions(others);
      })
      .catch(() => setError("Couldn't load applications"));
  }, [open, application.id, application.company]);

  async function merge() {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/applications/${application.id}/merge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ into: target }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Merge failed");
      setBusy(false);
      return;
    }
    router.push(`/applications/${data.id}`);
    router.refresh();
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-xs font-medium text-neutral-500 hover:text-neutral-800">
        Merge a Duplicate
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-neutral-500">
        Merge <b className="text-neutral-700">{application.company}</b> into another application. Its history and emails move
        over, and this copy is removed.
      </p>
      <select
        value={target}
        onChange={(e) => setTarget(e.target.value)}
        className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm"
      >
        <option value="">Choose the application to keep…</option>
        {options.map((a) => (
          <option key={a.id} value={a.id}>
            {a.company} — {a.role_title}
          </option>
        ))}
      </select>
      <div className="flex gap-2">
        <button
          onClick={merge}
          disabled={!target || busy}
          className="rounded-full bg-neutral-900 px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
        >
          {busy ? "Merging…" : "Merge"}
        </button>
        <button onClick={() => setOpen(false)} className="rounded-full px-3 py-1.5 text-xs text-neutral-500 hover:bg-neutral-100">
          Cancel
        </button>
      </div>
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  );
}
