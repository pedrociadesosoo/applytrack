import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Application, ApplicationEvent, ApplicationInput } from "@/lib/types";
import type { StatsApp, StatsEvent } from "@/lib/stats";
import { isDemoRequest } from "@/lib/demo";
import { demoData } from "@/lib/demo-data";

export interface ListFilters {
  search?: string;
  stage?: string;
  source?: string;
}

export async function listApplications(filters: ListFilters = {}): Promise<Application[]> {
  if (await isDemoRequest()) {
    const q = filters.search?.trim().toLowerCase();
    return demoData().apps.filter(
      (a) =>
        (!filters.stage || a.current_stage === filters.stage) &&
        (!filters.source || a.source === filters.source) &&
        (!q || a.company.toLowerCase().includes(q) || a.role_title.toLowerCase().includes(q))
    );
  }
  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from("applications")
    .select("*, application_events(stage, event_date, notes)")
    .order("updated_at", { ascending: false });

  if (filters.stage) {
    query = query.eq("current_stage", filters.stage);
  }
  if (filters.source) {
    query = query.eq("source", filters.source);
  }
  if (filters.search) {
    // Matches Feature 1a: "show me every JD that mentioned SQL" style search
    // across company, role, and job description text.
    // Partial matches on company/role ("stri" finds Stripe), plus full-text
    // search over saved job descriptions ("SQL"). Characters that PostgREST
    // filter syntax treats as delimiters are stripped first.
    const q = filters.search.replace(/[,()%*:"\\]/g, " ").trim();
    if (q) {
      query = query.or(
        `company.ilike.%${q}%,role_title.ilike.%${q}%,search_vector.wfts(english).${q}`
      );
    }
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getApplication(id: string): Promise<Application | null> {
  if (await isDemoRequest()) return demoData().apps.find((a) => a.id === id) ?? null;
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getApplicationEvents(applicationId: string): Promise<ApplicationEvent[]> {
  if (await isDemoRequest()) return demoData().events.filter((e) => e.application_id === applicationId);
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("application_events")
    .select("*")
    .eq("application_id", applicationId)
    .order("event_date", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createApplication(input: ApplicationInput): Promise<Application> {
  if (await isDemoRequest()) {
    // Demo: pretend it saved.
    const now = new Date().toISOString();
    return { ...input, id: `demo-new-${Date.now()}`, user_id: null, created_at: now, updated_at: now };
  }
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("applications")
    .insert(input)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function updateApplication(
  id: string,
  input: Partial<ApplicationInput>
): Promise<Application> {
  if (await isDemoRequest()) {
    const app = demoData().apps.find((a) => a.id === id);
    if (!app) throw new Error("Not found");
    return { ...app, ...input, updated_at: new Date().toISOString() };
  }
  const supabase = await createServerSupabaseClient();

  // Stage changes are logged to application_events by a Postgres trigger
  // (migration 002), so this stays a single atomic write.
  const { data, error } = await supabase
    .from("applications")
    .update(input)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteApplication(id: string): Promise<void> {
  if (await isDemoRequest()) return;
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("applications").delete().eq("id", id);
  if (error) throw error;
}

// Everything the stats need, always unfiltered: the dashboard numbers
// describe your whole search, not whatever the search box matches.
// Pages through results so large histories aren't cut at Supabase's
// 1,000-row default.
export async function listForStats(): Promise<{ apps: StatsApp[]; events: StatsEvent[] }> {
  if (await isDemoRequest()) {
    const { apps, events } = demoData();
    return { apps, events };
  }
  const supabase = await createServerSupabaseClient();
  const PAGE = 1000;

  async function all<T>(table: string, columns: string): Promise<T[]> {
    const rows: T[] = [];
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await supabase.from(table).select(columns).range(from, from + PAGE - 1);
      if (error) throw error;
      rows.push(...((data ?? []) as T[]));
      if (!data || data.length < PAGE) return rows;
    }
  }

  const [apps, events] = await Promise.all([
    all<StatsApp>(
      "applications",
      "id, company, role_title, current_stage, next_action, next_action_date, contact_email, application_date, offer_decision, created_at"
    ),
    all<StatsEvent>("application_events", "application_id, stage, event_date"),
  ]);
  return { apps, events };
}
