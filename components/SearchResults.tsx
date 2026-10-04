"use client";

import type { Application } from "@/lib/types";
import { relativeTime } from "@/lib/format";
import StageBadge from "@/components/StageBadge";

// Compact, scroll-free results while searching: company, role, status.
export default function SearchResults({
  query,
  applications,
  onOpen,
}: {
  query: string;
  applications: Application[];
  onOpen: (a: Application) => void;
}) {
  if (applications.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-neutral-200 py-12 text-center text-sm text-neutral-500">
        No applications match &ldquo;{query}&rdquo;.
      </div>
    );
  }

  return (
    <div>
      <p className="mb-2 text-xs text-neutral-500">
        {applications.length} result{applications.length === 1 ? "" : "s"} for &ldquo;{query}&rdquo;
      </p>
      <ul className="divide-y divide-neutral-100 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
        {applications.map((app) => (
          <li key={app.id}>
            <button
              onClick={() => onOpen(app)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-neutral-50"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-neutral-900">{app.company}</span>
                <span className="block truncate text-xs text-neutral-500">{app.role_title}</span>
              </span>
              <span className="hidden shrink-0 text-xs text-neutral-400 sm:block">
                updated {relativeTime(app.updated_at)}
              </span>
              <span className="shrink-0">
                <StageBadge stage={app.current_stage} decision={app.offer_decision} />
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
