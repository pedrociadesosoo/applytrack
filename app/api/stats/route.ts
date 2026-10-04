import { NextResponse } from "next/server";
import { listForStats } from "@/lib/applications";
import { computeStats } from "@/lib/stats";
import { findGhostCandidates } from "@/lib/ghosting";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const { apps, events } = await listForStats();

    // Auto-ghost internships whose season has started with no outcome.
    // Runs whenever the dashboard loads; idempotent, and each one is logged
    // as a "ghosted" event so the timeline says why.
    const candidates = findGhostCandidates(apps, events);
    if (candidates.length) {
      const supabase = await createServerSupabaseClient();
      const now = new Date().toISOString();
      const rows = candidates.map((c) => ({
        application_id: c.id,
        stage: "ghosted" as const,
        event_date: now,
        notes: `Auto-ghosted: ${c.deadline.reason}`,
      }));
      const { error } = await supabase.from("application_events").insert(rows);
      if (error) throw error;
      // Reflect it in this response too (the trigger already updated the DB).
      const ghosted = new Set(candidates.map((c) => c.id));
      for (const app of apps) if (ghosted.has(app.id)) app.current_stage = "ghosted";
      events.push(...rows);
    }

    const stats = computeStats(apps, events);
    return NextResponse.json({ stats, autoGhosted: candidates.length });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
