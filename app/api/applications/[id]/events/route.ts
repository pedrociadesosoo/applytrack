import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isDemoRequest } from "@/lib/demo";
import { STAGE_ORDER, type ApplicationStage } from "@/lib/types";

// Add a missing step to an application's journey.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (await isDemoRequest()) return NextResponse.json({ ok: true, demo: true });
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  try {
    const body = await request.json();
    const stage = body.stage as ApplicationStage;
    if (!STAGE_ORDER.includes(stage) || !body.date) {
      return NextResponse.json({ error: "stage and date are required" }, { status: 400 });
    }
    const { error } = await supabase.from("application_events").insert({
      application_id: id,
      stage,
      event_date: `${String(body.date).slice(0, 10)}T12:00:00Z`,
      notes: body.notes?.trim() || "Added by you",
    });
    if (error) throw error;
    const { data: current } = await supabase.rpc("recompute_application_stage", { p_app: id });
    return NextResponse.json({ ok: true, current_stage: current });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
