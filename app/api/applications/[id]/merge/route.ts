import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isDemoRequest } from "@/lib/demo";
import type { Application } from "@/lib/types";
import { PLACEHOLDER_ROLE } from "@/lib/gmail/apply";

// Merge this application (the duplicate) into another one: its history and
// emails move over, missing details are filled in, then the duplicate is
// removed.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (await isDemoRequest()) {
    const { into } = await request.json();
    return NextResponse.json({ ok: true, demo: true, id: into });
  }
  const { id: fromId } = await params;
  const supabase = await createServerSupabaseClient();
  try {
    const { into: intoId } = await request.json();
    if (!intoId || intoId === fromId) {
      return NextResponse.json({ error: "Pick a different application to merge into" }, { status: 400 });
    }

    const { data: apps, error } = await supabase.from("applications").select("*").in("id", [fromId, intoId]);
    if (error) throw error;
    const from = apps?.find((a) => a.id === fromId) as Application | undefined;
    const into = apps?.find((a) => a.id === intoId) as Application | undefined;
    if (!from || !into) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Move email-based and manual stage events; the duplicate's own
    // "Application created" event is dropped with it.
    const { error: moveError } = await supabase
      .from("application_events")
      .update({ application_id: intoId })
      .eq("application_id", fromId)
      .or('notes.is.null,notes.neq."Application created"');
    if (moveError) throw moveError;
    await supabase.from("email_signals").update({ application_id: intoId }).eq("application_id", fromId);

    // Fill gaps on the kept application from the duplicate.
    const patch: Partial<Application> = {};
    const fill = <K extends keyof Application>(key: K) => {
      if (!into[key] && from[key]) patch[key] = from[key];
    };
    fill("job_description");
    fill("job_post_url");
    fill("contact_name");
    fill("contact_email");
    fill("resume_version_used");
    if (into.role_title === PLACEHOLDER_ROLE && from.role_title !== PLACEHOLDER_ROLE) patch.role_title = from.role_title;
    if (from.application_date < into.application_date) patch.application_date = from.application_date;

    if (Object.keys(patch).length) {
      const { error: patchError } = await supabase.from("applications").update(patch).eq("id", intoId);
      if (patchError) throw patchError;
    }

    const { error: deleteError } = await supabase.from("applications").delete().eq("id", fromId);
    if (deleteError) throw deleteError;

    // Current stage = the latest step in the combined history (quietly,
    // without logging an extra "Stage updated manually" step).
    await supabase.rpc("recompute_application_stage", { p_app: intoId });

    return NextResponse.json({ ok: true, id: intoId });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
