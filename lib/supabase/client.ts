import { createBrowserClient } from "@supabase/ssr";

// Browser-side client. Uses the anon key; safe to expose (RLS governs access).
export function createBrowserSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
