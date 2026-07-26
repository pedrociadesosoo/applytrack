import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Application, ApplicationEvent, ApplicationInput } from "@/lib/types";

export interface ListFilters {
  search?: string;
  stage?: string;
  source?: string;
}

export async function listApplications(filters: ListFilters = {}): Promise<Application[]> {
  const supabase = createServerSupabaseClient();
  let query = supabase
    .from("applications")
    .select("*")
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
    query = query.textSearch("search_vector", filters.search, {
      type: "websearch",
      config: "english",
    });
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getApplication(id: string): Promise<Application | null> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getApplicationEvents(applicationId: string): Promise<ApplicationEvent[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("application_events")
    .select("*")
    .eq("application_id", applicationId)
    .order("event_date", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createApplication(input: ApplicationInput): Promise<Application> {
  const supabase = createServerSupabaseClient();
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
  const supabase = createServerSupabaseClient();

  // If the caller is changing current_stage, log it as an event so
  // stage_history stays complete without extra client-side calls.
  if (input.current_stage) {
    const existing = await getApplication(id);
    if (existing && existing.current_stage !== input.current_stage) {
      await supabase.from("application_events").insert({
        application_id: id,
        stage: input.current_stage,
        notes: "Stage updated manually",
      });
    }
  }

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
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("applications").delete().eq("id", id);
  if (error) throw error;
}
