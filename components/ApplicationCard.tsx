"use client";

import Link from "next/link";
import type { Application } from "@/lib/types";
import { daysSince, formatDate, isStale } from "@/lib/format";
import { SOURCE_LABELS } from "@/lib/types";
import StageBadge from "@/components/StageBadge";

export default function ApplicationCard({
  application,
  onQuickView,
}: {
  application: Application;
  onQuickView: (application: Application) => void;
}) {
  const stale = isStale(application.updated_at) && !["offer", "rejected", "withdrawn"].includes(application.current_stage);

  return (
    <div className="group relative flex flex-col rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      {stale && (
        <span className="absolute -top-2 -right-2 rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-semibold text-white shadow">
          Stale
        </span>
      )}

      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
            {application.company}
          </p>
          <Link
            href={`/applications/${application.id}`}
            className="text-sm font-semibold text-neutral-900 hover:text-indigo-600"
          >
            {application.role_title}
          </Link>
        </div>
        <StageBadge stage={application.current_stage} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500">
        <span>{SOURCE_LABELS[application.source]}</span>
        <span>·</span>
        <span>{daysSince(application.updated_at)}d since update</span>
        {application.next_action_date && (
          <>
            <span>·</span>
            <span>Next: {formatDate(application.next_action_date)}</span>
          </>
        )}
      </div>

      {application.next_action && (
        <p className="mt-2 text-xs text-neutral-600 line-clamp-2">{application.next_action}</p>
      )}

      {application.job_description && (
        <button
          onClick={() => onQuickView(application)}
          className="mt-3 self-start text-xs font-medium text-indigo-600 hover:text-indigo-700"
        >
          Quick-view JD →
        </button>
      )}
    </div>
  );
}
