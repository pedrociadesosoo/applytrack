import type { ApplicationStage } from "@/lib/types";

// Auto-ghosting, two rules:
//  1. Season roles: an internship/co-op with no outcome by the day its
//     season starts is over ("Summer 2027 SWE Intern" -> Jun 1 2027).
//  2. Everything else: no reply at all NO_REPLY_DAYS after applying.

const SEASON_START: Record<string, [month: number, day: number]> = {
  winter: [1, 5],
  spring: [1, 15],
  summer: [6, 1],
  fall: [9, 1],
  autumn: [9, 1],
};

const SEASON = "(spring|summer|fall|autumn|winter)";
const YEAR = "(20\\d{2})";

export const NO_REPLY_DAYS = 60;

export interface GhostDeadline {
  date: string; // YYYY-MM-DD
  label: string; // "Summer 2027"
  reason: string; // goes in the timeline note
  rule: "season" | "no_reply";
}

const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

export function ghostDeadline(
  roleTitle: string,
  applicationDate: string,
  heardBack = false
): GhostDeadline | null {
  const season = seasonDeadline(roleTitle, applicationDate);
  if (season) return season;
  if (heardBack) return null; // they replied; only a season end closes it
  const d = new Date(`${applicationDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + NO_REPLY_DAYS);
  return {
    date: d.toISOString().slice(0, 10),
    label: `${NO_REPLY_DAYS} days after applying`,
    reason: `no reply ${NO_REPLY_DAYS} days after applying`,
    rule: "no_reply",
  };
}

function seasonDeadline(roleTitle: string, applicationDate: string): GhostDeadline | null {
  const role = roleTitle.toLowerCase();
  let season: string | null = null;
  let year: number | null = null;

  const seasonThenYear = role.match(new RegExp(`\\b${SEASON}\\b[^0-9]{0,30}?\\b${YEAR}\\b`));
  const yearThenSeason = role.match(new RegExp(`\\b${YEAR}\\b[^0-9]{0,30}?\\b${SEASON}\\b`));
  if (seasonThenYear) {
    season = seasonThenYear[1];
    year = Number(seasonThenYear[2]);
  } else if (yearThenSeason) {
    year = Number(yearThenSeason[1]);
    season = yearThenSeason[2];
  } else {
    season = role.match(new RegExp(`\\b${SEASON}\\b`))?.[1] ?? null;
    const y = role.match(new RegExp(`\\b${YEAR}\\b`))?.[1];
    year = y ? Number(y) : null;
    // "2027 Intern - Technology": an internship year with no season = summer.
    if (!season && year && /\b(intern|internship|co-?op)\b/.test(role)) season = "summer";
  }
  if (!season) return null;

  const [month, day] = SEASON_START[season];
  if (!year) {
    // "Summer Internship" with no year: the first such season after you applied.
    const applied = new Date(`${applicationDate}T00:00:00Z`);
    year = applied.getUTCFullYear();
    const startThisYear = Date.UTC(year, month - 1, day);
    if (applied.getTime() >= startThisYear) year += 1;
  }

  const date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const label = `${cap(season === "autumn" ? "fall" : season)} ${year}`;
  return { date, label, reason: `no news by the start of ${label}`, rule: "season" };
}

const FINISHED = new Set<ApplicationStage>(["offer", "rejected", "ghosted", "withdrawn"]);

export interface GhostCandidate {
  id: string;
  deadline: GhostDeadline;
}

export function findGhostCandidates(
  apps: { id: string; role_title: string; application_date: string; current_stage: ApplicationStage }[],
  events: { application_id: string; stage: ApplicationStage }[],
  today = new Date().toISOString().slice(0, 10)
): GhostCandidate[] {
  // If an application was ever ghosted and you moved it back, that's your call.
  const everGhosted = new Set(events.filter((e) => e.stage === "ghosted").map((e) => e.application_id));
  const heardBack = new Set(events.filter((e) => e.stage !== "applied").map((e) => e.application_id));
  const out: GhostCandidate[] = [];
  for (const app of apps) {
    if (FINISHED.has(app.current_stage) || everGhosted.has(app.id)) continue;
    const replied = heardBack.has(app.id) || app.current_stage !== "applied";
    const deadline = ghostDeadline(app.role_title, app.application_date, replied);
    if (deadline && today >= deadline.date) out.push({ id: app.id, deadline });
  }
  return out;
}
