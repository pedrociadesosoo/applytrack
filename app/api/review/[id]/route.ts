import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { applySignal, type AppRow } from "@/lib/gmail/apply";
import type { ApplicationStage } from "@/lib/types";

// Confirm (optionally with corrected company/role/stage) or dismiss a
// flagged email.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  try {
    const body = await request.json();
    const { data: signal, error } = await supabase
      .from("email_signals")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    if (!signal) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (body.action === "dismiss") {
      await supabase.from("email_signals").update({ status: "dismissed" }).eq("id", id);
      return NextResponse.json({ ok: true });
    }

    const company = String(body.company ?? "").trim();
    const stage = body.stage as ApplicationStage;
    if (body.action !== "confirm" || !company || !stage) {
      return NextResponse.json({ error: "company and stage are required" }, { status: 400 });
    }

    const { data: appRows, error: appsError } = await supabase
      .from("applications")
      .select("id, company, role_title, current_stage, updated_at");
    if (appsError) throw appsError;

    const { applicationId } = await applySignal(
      supabase,
      (appRows ?? []) as AppRow[],
      {
        kind: stage === "applied" ? "applied" : "stage",
        stage,
        company,
        role: String(body.role_title ?? "").trim() || null,
        receivedAt: signal.received_at,
        gmailMessageId: signal.gmail_message_id,
        subject: signal.subject ?? "",
        fromHeader: signal.from_header ?? "",
      },
      { force: true }
    );

    await supabase
      .from("email_signals")
      .update({ status: "confirmed", application_id: applicationId })
      .eq("id", id);
    return NextResponse.json({ ok: true, applicationId });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
