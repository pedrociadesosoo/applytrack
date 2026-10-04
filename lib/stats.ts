import type { ApplicationStage, OfferDecision } from "@/lib/types";
import { daysSince } from "@/lib/format";

// Everything on the dashboard's stat row, computed from each application's
// full stage history (not just where it sits today).

export interface StatsApp {
  id: string;
  company: string;
  role_title: string;
  current_stage: ApplicationStage;
  next_action: string | null;
  next_action_date: string | null;
  contact_email: string | null;
  application_date: string;
  offer_decision: OfferDecision | null;
  created_at: string;
}

export interface StatsEvent {
  application_id: string;
  stage: ApplicationStage;
  event_date: string;
}

export interface StaleItem {
  id: string;
  company: string;
  role_title: string;
  current_stage: ApplicationStage;
  daysIdle: number;
  nextAction: string | null;
  contactEmail: string | null;
}

export interface Outcomes {
  offer: number;
  inProcess: number;
  rejected: number;
  wentQuiet: number; // heard back once, then ghosted/withdrawn
  noResponse: number;
}

export interface DashboardStats {
  total: number;
  responded: number;
  responseRate: number;
  interviewed: number;
  interviewConversionRate: number;
  staleCount: number;
  stale: StaleItem[];
  byStage: Record<string, number>; // current stage counts
  outcomes: Outcomes; // sums to total; the responded part explains responseRate
  reached: Record<string, number>; // apps that ever reached each response stage
  offerDecisions: Record<OfferDecision, number>; // among apps currently at "offer"
}

// Hearing anything back from the company, including a rejection.
export const RESPONSE_STAGES: ApplicationStage[] = [
  "oa", "hirevue", "phone_screen", "behavioral", "technical_interview", "onsite", "offer", "rejected",
];
// A live conversation with a person.
const INTERVIEW_STAGES = new Set<ApplicationStage>([
  "phone_screen", "behavioral", "technical_interview", "onsite", "offer",
]);
const CLOSED = new Set<ApplicationStage>(["offer", "rejected", "ghosted", "withdrawn"]);
const STALE_AFTER_DAYS = 10;

export function computeStats(apps: StatsApp[], events: StatsEvent[]): DashboardStats {
  const today = new Date().toISOString().slice(0, 10);
  const byApp = new Map<string, StatsEvent[]>();
  for (const e of events) {
    const list = byApp.get(e.application_id) ?? [];
    list.push(e);
    byApp.set(e.application_id, list);
  }

  const byStage: Record<string, number> = {};
  const reached: Record<string, number> = Object.fromEntries(RESPONSE_STAGES.map((s) => [s, 0]));
  const outcomes: Outcomes = { offer: 0, inProcess: 0, rejected: 0, wentQuiet: 0, noResponse: 0 };
  const stale: StaleItem[] = [];
  const offerDecisions: Record<OfferDecision, number> = { pending: 0, accepted: 0, declined: 0 };
  let responded = 0;
  let interviewed = 0;

  for (const app of apps) {
    byStage[app.current_stage] = (byStage[app.current_stage] ?? 0) + 1;
    if (app.current_stage === "offer") offerDecisions[app.offer_decision ?? "pending"] += 1;

    const history = byApp.get(app.id) ?? [];
    const stages = new Set<ApplicationStage>([app.current_stage, ...history.map((e) => e.stage)]);
    for (const s of RESPONSE_STAGES) if (stages.has(s)) reached[s] += 1;

    const heardBack = RESPONSE_STAGES.some((s) => stages.has(s));
    if (heardBack) responded += 1;
    if ([...stages].some((s) => INTERVIEW_STAGES.has(s))) interviewed += 1;

    if (!heardBack) outcomes.noResponse += 1;
    else if (app.current_stage === "offer") outcomes.offer += 1;
    else if (app.current_stage === "rejected") outcomes.rejected += 1;
    else if (app.current_stage === "ghosted" || app.current_stage === "withdrawn") outcomes.wentQuiet += 1;
    else outcomes.inProcess += 1;

    const lastActivity = history.reduce(
      (latest, e) => (e.event_date > latest ? e.event_date : latest),
      app.created_at
    );
    const daysIdle = daysSince(lastActivity);
    const hasUpcomingAction = app.next_action_date !== null && app.next_action_date > today;
    if (!CLOSED.has(app.current_stage) && daysIdle >= STALE_AFTER_DAYS && !hasUpcomingAction) {
      stale.push({
        id: app.id,
        company: app.company,
        role_title: app.role_title,
        current_stage: app.current_stage,
        daysIdle,
        nextAction: app.next_action,
        contactEmail: app.contact_email,
      });
    }
  }

  stale.sort((a, b) => b.daysIdle - a.daysIdle);
  const total = apps.length;
  return {
    total,
    responded,
    responseRate: total ? responded / total : 0,
    interviewed,
    interviewConversionRate: total ? interviewed / total : 0,
    staleCount: stale.length,
    stale,
    byStage,
    outcomes,
    reached,
    offerDecisions,
  };
}
