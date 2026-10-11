import { cookies } from "next/headers";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// Demo mode: a visitor who isn't signed in but clicked "Try the demo" gets
// sample data everywhere, and nothing they do is saved.
export const DEMO_COOKIE = "applytrack_demo";

export async function isDemoRequest(): Promise<boolean> {
  const jar = await cookies();
  if (jar.get(DEMO_COOKIE)?.value !== "1") return false;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return !user;
}
