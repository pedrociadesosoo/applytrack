"use client";

import { STAGE_LABELS, STAGE_ORDER } from "@/lib/types";

export default function SearchFilterBar({
  search,
  stage,
  onSearchChange,
  onStageChange,
}: {
  search: string;
  stage: string;
  onSearchChange: (v: string) => void;
  onStageChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <input
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search company, role, or JD text (e.g. SQL)"
        className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 sm:max-w-sm"
      />
      <select
        value={stage}
        onChange={(e) => onStageChange(e.target.value)}
        className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 sm:w-auto"
      >
        <option value="">All stages</option>
        {STAGE_ORDER.map((s) => (
          <option key={s} value={s}>
            {STAGE_LABELS[s]}
          </option>
        ))}
      </select>
    </div>
  );
}
