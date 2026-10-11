import type { Application, ApplicationStage } from "@/lib/types";
import { STAGE_LABELS } from "@/lib/types";
import { ghostDeadline } from "@/lib/ghosting";

// Check-ins ApplyTrack suggests on its own, based on where each application
// is and how long it's been there. Each has a stable key so "Done" sticks.

export interface Suggestion {
  key: string;
  date: string; // yyyy-mm-dd
  application: Application;
  title: string;
  detail: string;
  kind: "finish" | "prep" | "check_in" | "follow_up" | "decide" | "ghost_soon" | "yours";
}

const DAY = 24 * 60 * 60 * 1000;
const iso = (t: number) => new Date(t).toISOString().slice(0, 10);
const plus = (date: string, days: number) => iso(new Date(`${date.slice(0, 10)}T12:00:00Z`).getTime() + days * DAY);

const INTERVIEWS = new Set<ApplicationStage>(["phone_screen", "behavioral", "technical_interview", "onsite"]);
const CLOSED = new Set<ApplicationStage>(["rejected", "ghosted", "withdrawn"]);

export function buildSuggestions(apps: Application[], today = iso(Date.now())): Suggestion[] {
  const out: Suggestion[] = [];

  for (const app of apps) {
    if (CLOSED.has(app.current_stage)) continue;
    const events = [...(app.application_events ?? [])].sort((a, b) => a.event_date.localeCompare(b.event_date));
    // When did it arrive at its current stage?
    let since = app.application_date;
    for (let i = events.length - 1; i >= 0; i--) {
      if (events[i].stage !== app.current_stage) break;
      since = events[i].event_date.slice(0, 10);
    }
    const s = app.current_stage;
    const add = (kind: Suggestion["kind"], date: string, title: string, detail: string) =>
      out.push({ key: `${app.id}:${kind}:${s}:${since}`, date, application: app, title, detail, kind });

    if (s === "oa" || s === "hirevue") {
      add(
        "finish",
        plus(since, 5),
        `Finish your ${STAGE_LABELS[s]} for ${app.company}`,
        "Most companies give about a week. Done already? Mark it done."
      );
    } else if (INTERVIEWS.has(s)) {
      add(
        "prep",
        plus(since, 1),
        `Prep for your ${STAGE_LABELS[s].toLowerCase()} with ${app.company}`,
        "Review the job description, then send a short thank-you within a day of the interview."
      );
      add(
        "check_in",
        plus(since, 10),
        `Check in with ${app.company}`,
        "No news since your interview? A polite check-in with the recruiter is completely normal."
      );
    } else if (s === "applied") {
      add(
        "follow_up",
        plus(app.application_date, 14),
        `Follow up on your ${app.company} application`,
        "Two weeks without a reply. A short note to a recruiter can put you back on their radar."
      );
    } else if (s === "offer" && (!app.offer_decision || app.offer_decision === "pending")) {
      add("decide", plus(since, 5), `Decide on your ${app.company} offer`, "Check the deadline in your offer letter, and ask for more time if you need it.");
    }

    // Heads-up before auto-ghosting.
    const heardBack = s !== "applied" || events.some((e) => e.stage !== "applied");
    const deadline = s === "offer" ? null : ghostDeadline(app.role_title, app.application_date, heardBack);
    if (deadline && deadline.date > today) {
      out.push({
        key: `${app.id}:ghost_soon:${deadline.date}`,
        date: plus(deadline.date, -7),
        application: app,
        title: `${app.company} moves to Ghosted on ${deadline.date.slice(5).replace("-", "/")}`,
        detail: "Last chance to follow up before it's marked as ghosted.",
        kind: "ghost_soon",
      });
    }

    if (app.next_action_date) {
      out.push({
        key: `${app.id}:yours:${app.next_action_date}`,
        date: app.next_action_date,
        application: app,
        title: app.next_action || `Your reminder for ${app.company}`,
        detail: "A reminder you set.",
        kind: "yours",
      });
    }
  }

  return out.sort((a, b) => a.date.localeCompare(b.date));
}
