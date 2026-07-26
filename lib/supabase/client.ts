import { createClient } from "@supabase/supabase-js";

// Browser-side client. Uses the anon key; safe to expose (RLS governs access).
export function createBrowserSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, anonKey);
}
