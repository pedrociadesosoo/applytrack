import { NextResponse } from "next/server";
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/supabase/server";

// Permanently delete the signed-in user's account and everything tied to it.
export async function DELETE() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const admin = createAdminSupabaseClient();
  try {
    // 1. Disconnect Gmail on Google's side.
    const { data: creds } = await admin
      .from("google_credentials")
      .select("refresh_token")
      .eq("user_id", user.id)
      .maybeSingle();
    if (creds?.refresh_token) {
      await fetch("https://oauth2.googleapis.com/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ token: creds.refresh_token }),
      }).catch(() => {});
    }

    // 2. Applications (their history goes with them), then the account.
    //    Everything else (emails, sync state, tokens, dismissed suggestions)
    //    is removed with the account.
    const { error: appsError } = await admin.from("applications").delete().eq("user_id", user.id);
    if (appsError) throw appsError;
    const { error: userError } = await admin.auth.admin.deleteUser(user.id);
    if (userError) throw userError;

    await supabase.auth.signOut();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
