import { NextResponse } from "next/server";
import { listProgress } from "@/lib/applications";
import { computeStats } from "@/lib/stats";

export async function GET() {
  try {
    const stats = computeStats(await listProgress());
    return NextResponse.json({ stats });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
