"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Application } from "@/lib/types";
import { SOURCE_LABELS } from "@/lib/types";
import { daysSince, formatDate, isStale } from "@/lib/format";
import StageBadge from "@/components/StageBadge";

type SortKey = "company" | "role_title" | "application_date" | "updated_at" | "current_stage";

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "company", label: "Company" },
  { key: "role_title", label: "Role" },
  { key: "current_stage", label: "Stage" },
  { key: "application_date", label: "Applied" },
  { key: "updated_at", label: "Last update" },
];

export default function ApplicationsTable({
  applications,
  onQuickView,
}: {
  applications: Application[];
  onQuickView: (application: Application) => void;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("updated_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const sorted = useMemo(() => {
    const copy = [...applications];
    copy.sort((a, b) => {
      const av = a[sortKey] ?? "";
      const bv = b[sortKey] ?? "";
      const cmp = String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [applications, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-400">
            {COLUMNS.map((col) => (
              <th
                key={col.key}
                onClick={() => toggleSort(col.key)}
                className="cursor-pointer select-none px-4 py-2.5 font-medium hover:text-neutral-600"
              >
                {col.label}
                {sortKey === col.key && (sortDir === "asc" ? " ▲" : " ▼")}
              </th>
            ))}
            <th className="px-4 py-2.5 font-medium">Source</th>
            <th className="px-4 py-2.5 font-medium">Next action</th>
            <th className="px-4 py-2.5" />
          </tr>
        </thead>
        <tbody>
          {sorted.map((app) => {
            const stale =
              isStale(app.updated_at) &&
              !["offer", "rejected", "withdrawn"].includes(app.current_stage);
            return (
              <tr key={app.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50">
                <td className="px-4 py-2.5 font-medium text-neutral-800">{app.company}</td>
                <td className="px-4 py-2.5">
                  <Link href={`/applications/${app.id}`} className="text-neutral-700 hover:text-indigo-600">
                    {app.role_title}
                  </Link>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <StageBadge stage={app.current_stage} decision={app.offer_decision} />
                    {stale && <span className="text-[10px] font-semibold text-orange-500">STALE</span>}
                  </div>
                </td>
                <td className="px-4 py-2.5 text-neutral-500">{formatDate(app.application_date)}</td>
                <td className="px-4 py-2.5 text-neutral-500">{daysSince(app.updated_at)}d ago</td>
                <td className="px-4 py-2.5 text-neutral-500">{SOURCE_LABELS[app.source]}</td>
                <td className="px-4 py-2.5 text-neutral-500">
                  {app.next_action_date ? formatDate(app.next_action_date) : "—"}
                </td>
                <td className="px-4 py-2.5 text-right">
                  {app.job_description && (
                    <button
                      onClick={() => onQuickView(app)}
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                    >
                      JD
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {sorted.length === 0 && (
        <p className="px-4 py-8 text-center text-sm text-neutral-400">No applications match.</p>
      )}
    </div>
  );
}
