"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Application } from "@/lib/types";
import ApplicationCard from "@/components/ApplicationCard";
import JDSlideOver from "@/components/JDSlideOver";
import SearchFilterBar from "@/components/SearchFilterBar";
import { computeStats } from "@/lib/stats";
import { isStale } from "@/lib/format";

export default function DashboardPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState("");
  const [quickView, setQuickView] = useState<Application | null>(null);

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

      <div className="mt-8">
        <SearchFilterBar
          search={search}
          stage={stage}
          onSearchChange={setSearch}
          onStageChange={setStage}
        />
      </div>

      <div className="mt-6">
        {loading && <p className="text-sm text-neutral-400">Loading...</p>}
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {applications.map((app) => (
            <ApplicationCard key={app.id} application={app} onQuickView={setQuickView} />
          ))}
        </div>
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
