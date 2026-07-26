import type { Application } from "@/lib/types";

export interface CalendarEvent {
  date: string; // yyyy-mm-dd
  application: Application;
  label: string;
  kind: "next_action" | "applied";
}

// Pulls every date-bearing signal off an application into flat calendar
// events. Phase 1 only has application_date + next_action_date to work
// with; Phase 3's Gmail sync will add OA-due-date and interview-date
// events here without changing this shape.
export function buildCalendarEvents(applications: Application[]): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  for (const app of applications) {
    if (app.next_action_date) {
      events.push({
        date: app.next_action_date,
        application: app,
        label: app.next_action || "Next action due",
        kind: "next_action",
      });
    }
  }
  return events;
}
