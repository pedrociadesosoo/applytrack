import type { Application } from "@/lib/types";

export interface DashboardStats {
  total: number;
  responseRate: number; // fraction that moved past "applied" (any signal back)
  interviewConversionRate: number; // fraction that reached phone screen or later
  byStage: Record<string, number>;
}

const NO_RESPONSE_STAGES = new Set(["applied", "ghosted"]);
const PRE_INTERVIEW_STAGES = new Set(["applied", "oa", "ghosted", "withdrawn"]);

export function computeStats(applications: Application[]): DashboardStats {
  const total = applications.length;
  const byStage: Record<string, number> = {};

  let responded = 0;
  let interviewed = 0;

  for (const app of applications) {
    byStage[app.current_stage] = (byStage[app.current_stage] ?? 0) + 1;
    if (!NO_RESPONSE_STAGES.has(app.current_stage)) responded += 1;
    if (!PRE_INTERVIEW_STAGES.has(app.current_stage)) interviewed += 1;
  }

  return {
    total,
    responseRate: total ? responded / total : 0,
    interviewConversionRate: total ? interviewed / total : 0,
    byStage,
  };
}
