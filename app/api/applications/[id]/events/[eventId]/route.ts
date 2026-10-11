import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isDemoRequest } from "@/lib/demo";
import { STAGE_ORDER, type ApplicationStage } from "@/lib/types";

type Params = { params: Promise<{ id: string; eventId: string }> };

// Fix a step: change its stage, date, or note. The application's current
// stage is then recomputed from its latest step.
export async function PATCH(request: NextRequest, { params }: Params) {
  if (await isDemoRequest()) return NextResponse.json({ ok: true, demo: true });
  const { id, eventId } = await params;
  const supabase = await createServerSupabaseClient();
  try {
    const body = await request.json();
    const patch: Record<string, unknown> = {};
    if (body.stage !== undefined) {
      if (!STAGE_ORDER.includes(body.stage as ApplicationStage)) {
        return NextResponse.json({ error: "Unknown stage" }, { status: 400 });
      }
      patch.stage = body.stage;
    }
    if (body.date) patch.event_date = `${String(body.date).slice(0, 10)}T12:00:00Z`;
    if (body.notes !== undefined) patch.notes = String(body.notes).trim() || null;

    const { error } = await supabase
      .from("application_events")
      .update(patch)
      .eq("id", eventId)
      .eq("application_id", id);
    if (error) throw error;
    const { data: current } = await supabase.rpc("recompute_application_stage", { p_app: id });
    return NextResponse.json({ ok: true, current_stage: current });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

// Remove a step that shouldn't be there.
export async function DELETE(_request: NextRequest, { params }: Params) {
  if (await isDemoRequest()) return NextResponse.json({ ok: true, demo: true });
  const { id, eventId } = await params;
  const supabase = await createServerSupabaseClient();
  try {
    const { error } = await supabase
      .from("application_events")
      .delete()
      .eq("id", eventId)
      .eq("application_id", id);
    if (error) throw error;
    const { data: current } = await supabase.rpc("recompute_application_stage", { p_app: id });
    return NextResponse.json({ ok: true, current_stage: current });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
