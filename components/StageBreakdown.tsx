"use client";

import { STAGE_LABELS, STAGE_ORDER } from "@/lib/types";
import type { DashboardStats } from "@/lib/stats";

export default function StageBreakdown({ stats }: { stats: DashboardStats }) {
  const max = Math.max(1, ...Object.values(stats.byStage));

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-neutral-900">By stage</h3>
      <div className="space-y-2">
        {STAGE_ORDER.map((stage) => {
          const count = stats.byStage[stage] ?? 0;
          if (count === 0) return null;
          return (
            <div key={stage} className="flex items-center gap-3">
              <span className="w-32 flex-shrink-0 text-xs text-neutral-500">
                {STAGE_LABELS[stage]}
              </span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-100">
                <div
                  className="h-full rounded-full bg-neutral-800"
                  style={{ width: `${(count / max) * 100}%` }}
                />
              </div>
              <span className="w-6 flex-shrink-0 text-right text-xs font-medium text-neutral-600">
                {count}
              </span>
            </div>
          );
        })}
        {stats.total === 0 && <p className="text-xs text-neutral-300">No data yet.</p>}
      </div>
    </div>
  );
}
