import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/supabase/server";
import { classifyEmail } from "@/lib/gmail/classify";
import { getAccessToken, getMessage, listMessageIds, mapWithConcurrency } from "@/lib/gmail/client";
import { applySignal, type AppRow } from "@/lib/gmail/apply";

// First sync looks back to the start of this recruiting season.
const BACKFILL_FROM = new Date("2026-08-01T00:00:00Z");
// Keeps one sync run to a reasonable length; press Sync again for the rest.
const MAX_PER_RUN = 150;

// Narrow the inbox to likely candidates before downloading anything.
// The classifier makes the real call; this just skips obvious noise.
const ATS_SENDERS = [
  "greenhouse.io", "greenhouse-mail.io", "lever.co", "myworkday.com", "myworkdayjobs.com",
  "ashbyhq.com", "smartrecruiters.com", "icims.com", "jobvite.com", "taleo.net",
  "successfactors.com", "hackerrank.com", "hackerrankforwork.com", "codesignal.com",
  "hirevue.com", "codility.com", "jobs-noreply@linkedin.com", "eightfold.ai", "avature.net",
  "joinhandshake.com",
];
const SUBJECT_TERMS = [
  "application", "applying", "applied", "interview", "assessment", "candidacy",
  '"next steps"', "offer", '"your interest"', '"thank you for"', "superday", '"phone screen"',
];

function buildQuery(after: Date) {
  const since = Math.floor(after.getTime() / 1000);
  return [
    `after:${since}`,
    "-from:me",
    "-category:promotions",
    `{subject:(${SUBJECT_TERMS.join(" OR ")}) from:(${ATS_SENDERS.join(" OR ")})}`,
  ].join(" ");
}

export interface SyncResult {
  scanned: number;
  created: number;
  updated: number;
  needsReview: number;
  remaining: number;
}

export async function runGmailSync(): Promise<SyncResult> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  // Refresh tokens are service-role only, so read them with the admin client.
  const admin = createAdminSupabaseClient();
  const { data: creds } = await admin
    .from("google_credentials")
    .select("refresh_token")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!creds?.refresh_token) {
    throw new Error("Gmail isn't connected yet. Sign out and sign back in with Google.");
  }
  const token = await getAccessToken(creds.refresh_token);

  const { data: state } = await supabase
    .from("gmail_sync_state")
    .select("last_synced_at")
    .eq("user_id", user.id)
    .maybeSingle();
  // Overlap by a day so nothing slips through between runs; already-seen
  // messages are skipped below.
  const after = state?.last_synced_at
    ? new Date(new Date(state.last_synced_at).getTime() - 24 * 60 * 60 * 1000)
    : BACKFILL_FROM;

  const allIds = await listMessageIds(token, buildQuery(after));

  // Skip anything already recorded.
  const seen = new Set<string>();
  for (let i = 0; i < allIds.length; i += 200) {
    const { data } = await supabase
      .from("email_signals")
      .select("gmail_message_id")
      .in("gmail_message_id", allIds.slice(i, i + 200));
    (data ?? []).forEach((r) => seen.add(r.gmail_message_id));
  }
  // Gmail lists newest first; process oldest first so "applied" lands
  // before the OA, and the OA before the rejection.
  const fresh = allIds.filter((id) => !seen.has(id)).reverse();
  const batch = fresh.slice(0, MAX_PER_RUN);

  const messages = (await mapWithConcurrency(batch, 8, (id) => getMessage(token, id))).sort(
    (a, b) => a.receivedAt.getTime() - b.receivedAt.getTime()
  );

  const { data: appRows, error: appsError } = await supabase
    .from("applications")
    .select("id, company, role_title, current_stage, updated_at");
  if (appsError) throw appsError;
  const apps = (appRows ?? []) as AppRow[];

  const result: SyncResult = { scanned: messages.length, created: 0, updated: 0, needsReview: 0, remaining: fresh.length - batch.length };
  let newest = after;

  for (const msg of messages) {
    if (msg.receivedAt > newest) newest = msg.receivedAt;
    const c = classifyEmail({ from: msg.from, subject: msg.subject, body: msg.body });

    let status: string;
    let applicationId: string | null = null;

    if (c.kind === "unrelated") {
      status = "ignored";
    } else if (c.confidence === "low" || !c.company || !c.stage) {
      status = "pending_review";
    } else {
      const { outcome, applicationId: id } = await applySignal(supabase, apps, {
        kind: c.kind,
        stage: c.stage,
        company: c.company,
        role: c.role,
        receivedAt: msg.receivedAt.toISOString(),
        gmailMessageId: msg.id,
        subject: msg.subject,
        fromHeader: msg.from,
      });
      applicationId = id;
      if (outcome === "created") result.created += 1;
      if (outcome === "updated") result.updated += 1;
      // Would move an application backwards: let a human decide.
      status = outcome === "backward" ? "pending_review" : outcome === "duplicate" ? "duplicate" : "auto_applied";
    }
    if (status === "pending_review") result.needsReview += 1;

    const { error } = await supabase.from("email_signals").insert({
      gmail_message_id: msg.id,
      thread_id: msg.threadId,
      from_header: msg.from,
      subject: msg.subject,
      snippet: msg.snippet,
      received_at: msg.receivedAt.toISOString(),
      kind: c.kind,
      suggested_stage: c.stage,
      company_guess: c.company,
      role_guess: c.role,
      confidence: c.confidence,
      reason: c.reason,
      status,
      application_id: applicationId,
    });
    if (error && error.code !== "23505") throw error;
  }

  await supabase.from("gmail_sync_state").upsert({
    user_id: user.id,
    // If this run was capped, resume from the newest email processed;
    // otherwise everything up to now has been seen.
    last_synced_at: (result.remaining > 0 ? newest : new Date()).toISOString(),
    last_run_at: new Date().toISOString(),
  });

  return result;
}
