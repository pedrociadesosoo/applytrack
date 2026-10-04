"use client";

import { useMemo, useState } from "react";
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
  subMonths,
} from "date-fns";
import type { Application } from "@/lib/types";
import { buildCalendarEvents } from "@/lib/calendar";
import { formatDate } from "@/lib/format";
import StageBadge from "@/components/StageBadge";

export default function CalendarView({
  applications,
  onQuickView,
}: {
  applications: Application[];
  onQuickView: (application: Application) => void;
}) {
  const [month, setMonth] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const events = useMemo(() => buildCalendarEvents(applications), [applications]);

  const gridStart = startOfWeek(startOfMonth(month));
  const gridEnd = endOfWeek(endOfMonth(month));
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const eventsByDay = useMemo(() => {
    const map = new Map<string, typeof events>();
    for (const event of events) {
      const key = event.date;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(event);
    }
    return map;
  }, [events]);

  const upcoming = useMemo(
    () =>
      [...events]
        .filter((e) => new Date(e.date).getTime() >= new Date().setHours(0, 0, 0, 0))
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 8),
    [events]
  );

  const selectedEvents = selectedDay
    ? eventsByDay.get(format(selectedDay, "yyyy-MM-dd")) ?? []
    : [];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="rounded-xl border border-neutral-200 bg-white p-4 lg:col-span-2">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-neutral-900">{format(month, "MMMM yyyy")}</h3>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setMonth((m) => subMonths(m, 1))}
              className="rounded-md px-2 py-1 text-sm text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
            >
              ←
            </button>
            <button
              onClick={() => setMonth(new Date())}
              className="rounded-md px-2 py-1 text-xs font-medium text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
            >
              Today
            </button>
            <button
              onClick={() => setMonth((m) => addMonths(m, 1))}
              className="rounded-md px-2 py-1 text-sm text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
            >
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
            const dayEvents = eventsByDay.get(key) ?? [];
            const inMonth = isSameMonth(day, month);
            const selected = selectedDay && isSameDay(day, selectedDay);

            return (
              <button
                key={key}
                onClick={() => setSelectedDay(day)}
                className={`flex h-16 flex-col items-start rounded-lg border p-1.5 text-left text-xs transition ${
                  selected
                    ? "border-indigo-300 bg-indigo-50"
                    : "border-transparent hover:border-neutral-200 hover:bg-neutral-50"
                } ${!inMonth ? "opacity-30" : ""}`}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${
                    isToday(day) ? "bg-neutral-900 font-semibold text-white" : "text-neutral-600"
                  }`}
                >
                  {format(day, "d")}
                </span>
                {dayEvents.length > 0 && (
                  <span className="mt-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                    {dayEvents.length} due
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {selectedDay && (
          <div className="mt-4 border-t border-neutral-100 pt-3">
            <p className="mb-2 text-xs font-medium text-neutral-500">
              {format(selectedDay, "EEEE, MMM d")}
            </p>
            {selectedEvents.length === 0 ? (
              <p className="text-xs text-neutral-300">Nothing due this day.</p>
            ) : (
              <ul className="space-y-1.5">
                {selectedEvents.map((event, i) => (
                  <li key={i}>
                    <button
                      onClick={() => onQuickView(event.application)}
                      className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-xs hover:bg-neutral-50"
                    >
                      <span className="text-neutral-700">
                        {event.application.company} — {event.label}
                      </span>
                      <StageBadge stage={event.application.current_stage} decision={event.application.offer_decision} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold text-neutral-900">Upcoming</h3>
        {upcoming.length === 0 ? (
          <p className="text-xs text-neutral-300">No upcoming deadlines set.</p>
        ) : (
          <ul className="space-y-2">
            {upcoming.map((event, i) => (
              <li key={i}>
                <button
                  onClick={() => onQuickView(event.application)}
                  className="flex w-full flex-col items-start rounded-lg border border-neutral-100 px-3 py-2 text-left hover:bg-neutral-50"
                >
                  <span className="text-xs font-medium text-neutral-400">{formatDate(event.date)}</span>
                  <span className="text-sm text-neutral-800">
                    {event.application.company} — {event.application.role_title}
                  </span>
                  <span className="text-xs text-neutral-500">{event.label}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
