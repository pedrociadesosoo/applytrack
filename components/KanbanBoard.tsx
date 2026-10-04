"use client";

import { useState } from "react";
import type { Application, ApplicationStage } from "@/lib/types";
import { STAGE_ORDER, STAGE_LABELS } from "@/lib/types";
import { daysSince, formatDate } from "@/lib/format";

const COLUMN_STAGES: ApplicationStage[] = STAGE_ORDER.filter(
  (s) => !["ghosted", "withdrawn"].includes(s)
);

export default function KanbanBoard({
  applications,
  onQuickView,
  onStageChange,
  focusStage,
}: {
  applications: Application[];
  onQuickView: (application: Application) => void;
  onStageChange: (id: string, stage: ApplicationStage) => void;
  // Set when the dashboard is filtered to one stage: show just that column,
  // laid out as a full-width grid instead of a narrow lane.
  focusStage?: ApplicationStage;
}) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<ApplicationStage | null>(null);

  const byStage = new Map<ApplicationStage, Application[]>();
  for (const stage of COLUMN_STAGES) byStage.set(stage, []);
  for (const app of applications) {
    if (!byStage.has(app.current_stage)) byStage.set(app.current_stage, []);
    byStage.get(app.current_stage)!.push(app);
  }

  return (
    <div className={focusStage ? "pb-4" : "flex gap-4 overflow-x-auto pb-4"}>
      {(focusStage ? [focusStage] : COLUMN_STAGES).map((stage) => {
        const items = byStage.get(stage) ?? [];
        const isOver = dragOverStage === stage;
        return (
          <div
            key={stage}
            className={`flex ${focusStage ? "w-full" : "w-72 flex-shrink-0"} flex-col rounded-xl border bg-neutral-50/60 transition-colors ${
              isOver ? "border-indigo-300 bg-indigo-50/60" : "border-neutral-200"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverStage(stage);
            }}
            onDragLeave={() => setDragOverStage((s) => (s === stage ? null : s))}
            onDrop={(e) => {
              e.preventDefault();
              setDragOverStage(null);
              const id = e.dataTransfer.getData("text/application-id") || dragId;
              if (id) onStageChange(id, stage);
              setDragId(null);
            }}
          >
            <div className="flex items-center justify-between border-b border-neutral-200 px-3 py-2.5">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                {STAGE_LABELS[stage]}
              </h3>
              <span className="rounded-full bg-neutral-200 px-1.5 py-0.5 text-[10px] font-medium text-neutral-600">
                {items.length}
              </span>
            </div>

            <div
              className={
                focusStage
                  ? "grid flex-1 grid-cols-1 gap-2 p-2 sm:grid-cols-2 lg:grid-cols-3"
                  : "flex-1 space-y-2 p-2"
              }
            >
              {items.length === 0 && (
                <p className="px-2 py-4 text-center text-xs text-neutral-300">No applications</p>
              )}
              {items.map((app) => (
                <div
                  key={app.id}
                  draggable
                  onDragStart={(e) => {
                    setDragId(app.id);
                    e.dataTransfer.setData("text/application-id", app.id);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  onClick={() => onQuickView(app)}
                  className="cursor-grab rounded-lg border border-neutral-200 bg-white p-3 shadow-sm transition hover:shadow-md active:cursor-grabbing"
                >
                  <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-400">
                    {app.company}
                  </p>
                  <p className="text-sm font-medium text-neutral-900 line-clamp-1">
                    {app.role_title}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-neutral-400">
                    <span>{daysSince(app.updated_at)}d since update</span>
                    {app.current_stage === "offer" && app.offer_decision && app.offer_decision !== "pending" ? (
                      <span className={app.offer_decision === "accepted" ? "font-medium text-emerald-700" : ""}>
                        {app.offer_decision === "accepted" ? "✓ Accepted" : "Declined"}
                      </span>
                    ) : (
                      app.next_action_date && <span>Due {formatDate(app.next_action_date)}</span>
                    )}
                  </div>

                  {/* Drag-and-drop doesn't work on touch devices, so this select is the
                      primary way to move a card on mobile — and a fine desktop fallback too. */}
                  <div onClick={(e) => e.stopPropagation()} className="mt-2">
                    <select
                      value={app.current_stage}
                      onChange={(e) => onStageChange(app.id, e.target.value as ApplicationStage)}
                      className="w-full rounded-md border border-neutral-200 bg-neutral-50 px-1.5 py-1 text-[11px] text-neutral-600"
                    >
                      {STAGE_ORDER.map((s) => (
                        <option key={s} value={s}>
                          {STAGE_LABELS[s]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
