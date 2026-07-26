"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Application, ApplicationStage } from "@/lib/types";
import ApplicationCard from "@/components/ApplicationCard";
import JDSlideOver from "@/components/JDSlideOver";
import SearchFilterBar from "@/components/SearchFilterBar";
import KanbanBoard from "@/components/KanbanBoard";
import ApplicationsTable from "@/components/ApplicationsTable";
import CalendarView from "@/components/CalendarView";
import StageBreakdown from "@/components/StageBreakdown";
import { computeStats } from "@/lib/stats";
import { isStale } from "@/lib/format";
import { useLocalStorage } from "@/lib/use-local-storage";
import { CardsSkeleton, KanbanSkeleton, TableSkeleton, CalendarSkeleton } from "@/components/Skeletons";

type ViewMode = "cards" | "kanban" | "table" | "calendar";

const VIEW_OPTIONS: { key: ViewMode; label: string }[] = [
  { key: "cards", label: "Cards" },
  { key: "kanban", label: "Kanban" },
  { key: "table", label: "Table" },
  { key: "calendar", label: "Calendar" },
];

export default function DashboardPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quickView, setQuickView] = useState<Application | null>(null);

  // View + filters persist across reloads via localStorage (useSyncExternalStore-backed,
  // so there's no hydration flash or extra effect needed to restore them).
  const [search, setSearch] = useLocalStorage("applytrack:search", "");
  const [stage, setStage] = useLocalStorage("applytrack:stage", "");
  const [rawView, setRawView] = useLocalStorage("applytrack:view", "kanban");
  const view: ViewMode = VIEW_OPTIONS.some((o) => o.key === rawView)
    ? (rawView as ViewMode)
    : "kanban";
  const setView = (next: ViewMode) => setRawView(next);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (stage) params.set("stage", stage);

    const controller = new AbortController();

    async function run() {
      setLoading(true);
      try {
        const res = await fetch(`/api/applications?${params.toString()}`, {
          signal: controller.signal,
        });
        const data = await res.json();
        if (cancelled) return;
        if (data.error) throw new Error(data.error);
        setApplications(data.applications ?? []);
        setError(null);
      } catch (err) {
        if (!cancelled && (err as Error).name !== "AbortError") {
          setError((err as Error).message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [search, stage]);

  const stats = useMemo(() => computeStats(applications), [applications]);

  const staleCount = useMemo(
    () =>
      applications.filter(
        (a) =>
          !["offer", "rejected", "withdrawn"].includes(a.current_stage) &&
          isStale(a.updated_at)
      ).length,
    [applications]
  );

  async function handleStageChange(id: string, newStage: ApplicationStage) {
    // Optimistic update so kanban drag feels instant.
    setApplications((prev) =>
      prev.map((a) => (a.id === id ? { ...a, current_stage: newStage, updated_at: new Date().toISOString() } : a))
    );
    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_stage: newStage }),
      });
      if (!res.ok) throw new Error("Failed to update stage");
    } catch {
      // Revert on failure by refetching.
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      if (stage) params.set("stage", stage);
      const res = await fetch(`/api/applications?${params.toString()}`);
      const data = await res.json();
      setApplications(data.applications ?? []);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Applications</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Every application, in one place — auto-tracked once Gmail sync (Phase 3) ships.
          </p>
        </div>
        <Link
          href="/applications/new"
          className="inline-flex items-center justify-center rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
        >
          + Add application
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total applications" value={stats.total.toString()} />
        <StatCard label="Response rate" value={formatPct(stats.responseRate)} />
        <StatCard label="Interview conversion" value={formatPct(stats.interviewConversionRate)} />
        <StatCard label="Stale (needs follow-up)" value={staleCount.toString()} />
      </div>

      <div className="mt-4">
        <StageBreakdown stats={stats} />
      </div>

      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SearchFilterBar
          search={search}
          stage={stage}
          onSearchChange={setSearch}
          onStageChange={setStage}
        />
        <div className="flex gap-1 rounded-lg border border-neutral-200 bg-white p-1">
          {VIEW_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setView(opt.key)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                view === opt.key
                  ? "bg-neutral-900 text-white"
                  : "text-neutral-500 hover:bg-neutral-100"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        {loading && view === "cards" && <CardsSkeleton />}
        {loading && view === "kanban" && <KanbanSkeleton />}
        {loading && view === "table" && <TableSkeleton />}
        {loading && view === "calendar" && <CalendarSkeleton />}
        {error && <p className="text-sm text-rose-600">{error}</p>}
        {!loading && !error && applications.length === 0 && (
          <div className="rounded-xl border border-dashed border-neutral-200 py-16 text-center">
            <p className="text-sm text-neutral-500">No applications yet.</p>
            <Link
              href="/applications/new"
              className="mt-2 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              Add your first one →
            </Link>
          </div>
        )}

        {!loading && !error && applications.length > 0 && (
          <>
            {view === "cards" && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {applications.map((app) => (
                  <ApplicationCard key={app.id} application={app} onQuickView={setQuickView} />
                ))}
              </div>
            )}
            {view === "kanban" && (
              <KanbanBoard
                applications={applications}
                onQuickView={setQuickView}
                onStageChange={handleStageChange}
              />
            )}
            {view === "table" && (
              <ApplicationsTable applications={applications} onQuickView={setQuickView} />
            )}
            {view === "calendar" && (
              <CalendarView applications={applications} onQuickView={setQuickView} />
            )}
          </>
        )}
      </div>

      <JDSlideOver application={quickView} onClose={() => setQuickView(null)} />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-neutral-900">{value}</p>
    </div>
  );
}

function formatPct(v: number): string {
  return `${Math.round(v * 100)}%`;
}
