import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/supabase/server";

// Google redirects here after sign-in. Exchange the code for a Supabase
// session, then save Google's refresh token: Supabase hands it over only
// once, right here, and the Gmail sync needs it later.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const refreshToken = data.session.provider_refresh_token;
  if (refreshToken) {
    const admin = createAdminSupabaseClient();
    await admin.from("google_credentials").upsert({
      user_id: data.session.user.id,
      refresh_token: refreshToken,
      updated_at: new Date().toISOString(),
    });
  }

  return NextResponse.redirect(`${origin}/`);
}
