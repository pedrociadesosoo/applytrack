import type { SupabaseClient } from "@supabase/supabase-js";
import type { ApplicationSource, ApplicationStage } from "@/lib/types";

// Turns a classified email into data: create the application, add a stage
// event, or recognize it as something already known. Shared by the
// automatic sync and the "Confirm" button in the review queue.

export const PLACEHOLDER_ROLE = "Role not detected";

export interface AppRow {
  id: string;
  company: string;
  role_title: string;
  current_stage: ApplicationStage;
  updated_at: string;
}

export interface SignalToApply {
  kind: "applied" | "stage";
  stage: ApplicationStage;
  company: string;
  role: string | null;
  receivedAt: string; // ISO timestamp
  gmailMessageId: string;
  subject: string;
  fromHeader: string;
}

export type ApplyOutcome = "created" | "updated" | "duplicate" | "backward";

const PIPELINE_RANK: Partial<Record<ApplicationStage, number>> = {
  applied: 0,
  oa: 1,
  hirevue: 2,
  phone_screen: 3,
  behavioral: 4,
  technical_interview: 5,
  onsite: 6,
  offer: 7,
};

// Emails only move an application forward. A late OA reminder after a phone
// screen shouldn't drag the card back to "OA".
export function isForward(current: ApplicationStage, next: ApplicationStage): boolean {
  if (current === "ghosted") return true; // any reply revives a ghosted app
  if (current === "rejected" || current === "withdrawn") return false;
  if (next === "rejected") return true;
  const a = PIPELINE_RANK[current];
  const b = PIPELINE_RANK[next];
  return a !== undefined && b !== undefined && b > a;
}

export function normalizeCompany(s: string) {
  return s
    .toLowerCase()
    .replace(/\b(?:inc|llc|ltd|corp|corporation|co|company|technologies|technology|labs|group|the)\b/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function companiesMatch(a: string, b: string) {
  if (!a || !b) return false;
  if (a === b) return true;
  return Math.min(a.length, b.length) >= 4 && (a.includes(b) || b.includes(a));
}

const normRole = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

export function findMatch(apps: AppRow[], company: string, role: string | null): AppRow | null {
  const c = normalizeCompany(company);
  const matches = apps.filter((a) => companiesMatch(normalizeCompany(a.company), c));
  if (!matches.length) return null;
  if (role) {
    const exact = matches.find((a) => normRole(a.role_title) === normRole(role));
    if (exact) return exact;
  }
  const open = matches.filter((a) => a.current_stage !== "rejected" && a.current_stage !== "withdrawn");
  const pool = open.length ? open : matches;
  return [...pool].sort((x, y) => y.updated_at.localeCompare(x.updated_at))[0];
}

function inferSource(fromHeader: string): ApplicationSource {
  if (/linkedin\.com/i.test(fromHeader)) return "linkedin";
  return "company_site";
}

async function createFromEmail(supabase: SupabaseClient, s: SignalToApply): Promise<AppRow> {
  const { data, error } = await supabase
    .from("applications")
    .insert({
      company: s.company,
      role_title: s.role ?? PLACEHOLDER_ROLE,
      application_date: s.receivedAt.slice(0, 10),
      source: inferSource(s.fromHeader),
      current_stage: "applied",
    })
    .select("id, company, role_title, current_stage, updated_at")
    .single();
  if (error) throw error;
  return data as AppRow;
}

/**
 * `apps` is the caller's in-memory list of the user's applications; it is
 * updated in place so later emails in the same sync see earlier changes.
 * `force` (used by manual confirmation) skips the forward-only check.
 */
export async function applySignal(
  supabase: SupabaseClient,
  apps: AppRow[],
  s: SignalToApply,
  { force = false }: { force?: boolean } = {}
): Promise<{ outcome: ApplyOutcome; applicationId: string }> {
  const match = findMatch(apps, s.company, s.role);

  if (s.kind === "applied") {
    const sameRole =
      match &&
      (!s.role ||
        match.role_title === PLACEHOLDER_ROLE ||
        normRole(match.role_title) === normRole(s.role));
    if (match && sameRole) return { outcome: "duplicate", applicationId: match.id };
    const created = await createFromEmail(supabase, s);
    apps.push(created);
    return { outcome: "created", applicationId: created.id };
  }

  let app = match;
  let created = false;
  if (!app) {
    // e.g. an OA invite for something you applied to before the sync window
    app = await createFromEmail(supabase, s);
    apps.push(app);
    created = true;
  } else {
    const { data: events, error: eventsError } = await supabase
      .from("application_events")
      .select("stage, event_date")
      .eq("application_id", app.id);
    if (eventsError) throw eventsError;
    const history = (events ?? []) as { stage: ApplicationStage; event_date: string }[];

    // Already in the timeline (reminders, "you've completed it" emails).
    if (history.some((e) => e.stage === s.stage)) {
      return { outcome: "duplicate", applicationId: app.id };
    }
    // Older than the application's latest event: it fills in history (the
    // stage trigger won't move current_stage backwards). Only a NEW email
    // that would move things backwards needs a human.
    const received = new Date(s.receivedAt).getTime();
    const isHistory = history.some((e) => new Date(e.event_date).getTime() > received);
    if (!force && !isHistory && !isForward(app.current_stage, s.stage)) {
      return { outcome: "backward", applicationId: app.id };
    }
  }

  const subject = s.subject.length > 120 ? `${s.subject.slice(0, 117)}…` : s.subject;
  const { error } = await supabase.from("application_events").insert({
    application_id: app.id,
    stage: s.stage,
    event_date: s.receivedAt,
    source_email_id: s.gmailMessageId,
    notes: `Detected from email: "${subject}"`,
  });
  if (error?.code === "23505") return { outcome: "duplicate", applicationId: app.id };
  if (error) throw error;

  app.current_stage = s.stage;
  app.updated_at = new Date().toISOString();
  return { outcome: created ? "created" : "updated", applicationId: app.id };
}
