import { createClient } from "@supabase/supabase-js";

// Server-side client for API routes. Uses the service role key so Phase 1
// (no auth flow yet) can read/write without a logged-in session. Once
// Google OAuth (Phase 3) lands, swap this for a per-request client built
// from the user's session token and rely on RLS instead of the service key.
export function createServerSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!url || !serviceKey) {
    throw new Error(
      "Missing Supabase env vars. Copy .env.example to .env.local and fill in your project URL/keys."
    );
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}
