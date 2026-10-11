"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
} from "date-fns";
import type { Application } from "@/lib/types";
import { buildSuggestions, type Suggestion } from "@/lib/suggestions";
import { formatDate } from "@/lib/format";

const KIND_STYLE: Record<Suggestion["kind"], { label: string; tint: 1 | 2 | 3 | 4 }> = {
  finish: { label: "To do", tint: 1 },
  prep: { label: "Prep", tint: 3 },
  check_in: { label: "Check in", tint: 4 },
  follow_up: { label: "Follow up", tint: 4 },
  decide: { label: "Decide", tint: 2 },
  ghost_soon: { label: "Heads-up", tint: 2 },
  yours: { label: "Your reminder", tint: 1 },
};

// Calendar of check-ins ApplyTrack suggests (plus reminders you set).
export default function CalendarView({
  applications,
  onQuickView,
}: {
  applications: Application[];
  onQuickView: (application: Application) => void;
}) {
  const [month, setMonth] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    fetch("/api/suggestions")
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && d.dismissed) setDismissed(new Set(d.dismissed));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const today = format(new Date(), "yyyy-MM-dd");
  const suggestions = useMemo(
    () => buildSuggestions(applications, today).filter((s) => !dismissed.has(s.key)),
    [applications, today, dismissed]
  );

  const byDay = useMemo(() => {
    const map = new Map<string, Suggestion[]>();
    for (const s of suggestions) map.set(s.date, [...(map.get(s.date) ?? []), s]);
    return map;
  }, [suggestions]);

  // Keep the list short: recent overdue items first, then what's coming up.
  // Anything overdue by more than two weeks has almost certainly been
  // handled (or missed), so it only shows on the calendar grid.
  const [showAll, setShowAll] = useState(false);
  const twoWeeksAgo = format(subDays(new Date(), 14), "yyyy-MM-dd");
  const overdueAll = suggestions.filter((s) => s.date < today && s.date >= twoWeeksAgo);
  const soonAll = suggestions.filter((s) => s.date >= today);
  const overdue = showAll ? overdueAll : overdueAll.slice(-4);
  const soon = showAll ? soonAll : soonAll.slice(0, 5);
  const hiddenCount = overdueAll.length + soonAll.length - overdue.length - soon.length;

  async function dismiss(key: string) {
    setDismissed((prev) => new Set(prev).add(key));
    await fetch("/api/suggestions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key }),
    }).catch(() => {});
  }

  const gridStart = startOfWeek(startOfMonth(month));
  const gridEnd = endOfWeek(endOfMonth(month));
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });
  const selectedItems = selectedDay ? byDay.get(format(selectedDay, "yyyy-MM-dd")) ?? [] : [];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="rounded-3xl bg-white p-5 shadow-sm lg:col-span-2">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold text-neutral-900">{format(month, "MMMM yyyy")}</h3>
          <div className="flex items-center gap-1">
            <button onClick={() => setMonth((m) => subMonths(m, 1))} className="rounded-full px-2.5 py-1 text-sm text-neutral-500 hover:bg-neutral-100" aria-label="Previous month">
              ←
            </button>
            <button onClick={() => setMonth(new Date())} className="rounded-full px-3 py-1 text-xs font-medium text-neutral-500 hover:bg-neutral-100">
              Today
            </button>
            <button onClick={() => setMonth((m) => addMonths(m, 1))} className="rounded-full px-2.5 py-1 text-sm text-neutral-500 hover:bg-neutral-100" aria-label="Next month">
              →
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium uppercase tracking-wide text-neutral-400">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="py-1">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const items = byDay.get(key) ?? [];
            const selected = selectedDay && isSameDay(day, selectedDay);
            return (
              <button
                key={key}
                onClick={() => setSelectedDay(day)}
                className={`flex h-[4.5rem] flex-col items-start rounded-2xl border p-1.5 text-left text-xs transition ${
                  selected ? "border-indigo-300 bg-indigo-50" : "border-transparent hover:bg-neutral-50"
                } ${!isSameMonth(day, month) ? "opacity-30" : ""}`}
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] ${
                    isToday(day) ? "bg-neutral-900 font-semibold text-white" : "text-neutral-600"
                  }`}
                >
                  {format(day, "d")}
                </span>
                {items.length > 0 && (
                  <span
                    className="mt-auto w-full truncate rounded-full px-1.5 py-0.5 text-[10px] font-semibold text-neutral-800"
                    style={{ background: `var(--tile-${KIND_STYLE[items[0].kind].tint})` }}
                  >
                    {items.length === 1 ? KIND_STYLE[items[0].kind].label : `${items.length} to do`}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {selectedDay && (
          <div className="mt-4 border-t border-neutral-100 pt-4">
            <p className="mb-2 text-xs font-semibold text-neutral-500">{format(selectedDay, "EEEE, MMM d")}</p>
            {selectedItems.length === 0 ? (
              <p className="text-xs text-neutral-400">Nothing planned. Enjoy the breather.</p>
            ) : (
              <ul className="space-y-2">
                {selectedItems.map((s) => (
                  <SuggestionRow key={s.key} s={s} today={today} onOpen={onQuickView} onDismiss={dismiss} />
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <div className="rounded-3xl bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-neutral-900">Suggested for you</h3>
        <p className="mt-0.5 text-xs text-neutral-500">Check-ins based on where each application is.</p>

        {overdue.length + soon.length === 0 ? (
          <p className="mt-6 text-sm text-neutral-400">You&apos;re all caught up. 🎉</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {overdue.map((s) => (
              <SuggestionRow key={s.key} s={s} today={today} onOpen={onQuickView} onDismiss={dismiss} />
            ))}
            {soon.map((s) => (
              <SuggestionRow key={s.key} s={s} today={today} onOpen={onQuickView} onDismiss={dismiss} />
            ))}
          </ul>
        )}
        {(hiddenCount > 0 || showAll) && (
          <button
            onClick={() => setShowAll((v) => !v)}
            className="mt-3 w-full rounded-full border border-neutral-200 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-50"
          >
            {showAll ? "Show less" : `Show ${hiddenCount} more`}
          </button>
        )}
      </div>
    </div>
  );
}

function SuggestionRow({
  s,
  today,
  onOpen,
  onDismiss,
}: {
  s: Suggestion;
  today: string;
  onOpen: (a: Application) => void;
  onDismiss: (key: string) => void;
}) {
  const style = KIND_STYLE[s.kind];
  const overdue = s.date < today;
  return (
    <li className="rounded-2xl border border-neutral-100 p-3">
      <div className="flex items-center gap-2">
        <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-neutral-800" style={{ background: `var(--tile-${style.tint})` }}>
          {style.label}
        </span>
        <span className={`text-[11px] font-medium ${overdue ? "text-rose-600" : "text-neutral-400"}`}>
          {s.date === today ? "Today" : overdue ? `Since ${formatDate(s.date)}` : formatDate(s.date)}
        </span>
      </div>
      <button onClick={() => onOpen(s.application)} className="mt-1.5 block text-left text-sm font-medium text-neutral-900 hover:text-indigo-600">
        {s.title}
      </button>
      <p className="mt-0.5 text-xs text-neutral-500">{s.detail}</p>
      <div className="mt-2 flex gap-1.5">
        <button onClick={() => onDismiss(s.key)} className="rounded-full bg-neutral-900 px-3 py-1 text-[11px] font-semibold text-white hover:bg-neutral-800">
          Done ✓
        </button>
        <button onClick={() => onDismiss(s.key)} className="rounded-full px-3 py-1 text-[11px] font-medium text-neutral-500 hover:bg-neutral-100">
          Skip
        </button>
      </div>
    </li>
  );
}
