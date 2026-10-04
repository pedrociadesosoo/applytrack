import type { ApplicationProgress } from "@/lib/types";
import { isStale } from "@/lib/format";

export interface DashboardStats {
  total: number;
  responseRate: number; // fraction where the company ever replied (OA, interview, offer, or rejection)
  interviewConversionRate: number; // fraction that ever reached a phone screen or later
  staleCount: number; // active apps with no movement in 10+ days and no upcoming planned action
  byStage: Record<string, number>; // current stage counts
}

// Stages where the application is finished and needs no follow-up.
const CLOSED_STAGES = new Set(["offer", "rejected", "ghosted", "withdrawn"]);

export function computeStats(rows: ApplicationProgress[]): DashboardStats {
  const total = rows.length;
  const byStage: Record<string, number> = {};
  let responded = 0;
  let interviewed = 0;
  let staleCount = 0;
  const today = new Date().toISOString().slice(0, 10);

  for (const r of rows) {
    byStage[r.current_stage] = (byStage[r.current_stage] ?? 0) + 1;
    if (r.got_response) responded += 1;
    if (r.reached_interview) interviewed += 1;

    const hasUpcomingAction = r.next_action_date !== null && r.next_action_date > today;
    if (!CLOSED_STAGES.has(r.current_stage) && isStale(r.last_activity_at) && !hasUpcomingAction) {
      staleCount += 1;
    }
  }

  return {
    total,
    responseRate: total ? responded / total : 0,
    interviewConversionRate: total ? interviewed / total : 0,
    staleCount,
    byStage,
  };
}
