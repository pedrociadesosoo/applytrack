import { NextResponse } from "next/server";
import { runGmailSync } from "@/lib/gmail/sync";
import { GoogleReconnectError } from "@/lib/gmail/client";
import { isDemoRequest } from "@/lib/demo";

// Give the sync up to a minute on Vercel (reading Gmail is the slow part).
export const maxDuration = 60;

export async function POST() {
  if (await isDemoRequest()) {
    return NextResponse.json({ result: { scanned: 0, created: 0, updated: 0, needsReview: 0, remaining: 0 }, demo: true });
  }
  try {
    const result = await runGmailSync();
    return NextResponse.json({ result });
  } catch (error) {
    const reconnect = error instanceof GoogleReconnectError;
    return NextResponse.json(
      { error: (error as Error).message, reconnect },
      { status: reconnect ? 401 : 500 }
    );
  }
}
