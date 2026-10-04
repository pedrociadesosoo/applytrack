import type { ApplicationStage } from "@/lib/types";

// Auto-ghosting: an internship/co-op that hasn't reached an outcome by the
// day its season starts is over, whether or not the company ever said so.
// The ghost date comes from the role title ("Summer 2027 SWE Intern").

const SEASON_START: Record<string, [month: number, day: number]> = {
  winter: [1, 5],
  spring: [1, 15],
  summer: [6, 1],
  fall: [9, 1],
  autumn: [9, 1],
};

const SEASON = "(spring|summer|fall|autumn|winter)";
const YEAR = "(20\\d{2})";

export interface GhostDeadline {
  date: string; // YYYY-MM-DD
  label: string; // "Summer 2027"
}

const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

export function ghostDeadline(roleTitle: string, applicationDate: string): GhostDeadline | null {
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
  return { date, label: `${cap(season === "autumn" ? "fall" : season)} ${year}` };
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
  const out: GhostCandidate[] = [];
  for (const app of apps) {
    if (FINISHED.has(app.current_stage) || everGhosted.has(app.id)) continue;
    const deadline = ghostDeadline(app.role_title, app.application_date);
    if (deadline && today >= deadline.date) out.push({ id: app.id, deadline });
  }
  return out;
}
