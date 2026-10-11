import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isDemoRequest } from "@/lib/demo";

// Keys of suggestions you've marked done or skipped.
export async function GET() {
  if (await isDemoRequest()) return NextResponse.json({ dismissed: [] });
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from("dismissed_suggestions").select("key");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ dismissed: (data ?? []).map((r) => r.key) });
}

export async function POST(request: NextRequest) {
  if (await isDemoRequest()) return NextResponse.json({ ok: true, demo: true });
  const supabase = await createServerSupabaseClient();
  const { key } = await request.json();
  if (typeof key !== "string" || !key) return NextResponse.json({ error: "key required" }, { status: 400 });
  const { error } = await supabase.from("dismissed_suggestions").upsert({ key }, { onConflict: "user_id,key", ignoreDuplicates: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
