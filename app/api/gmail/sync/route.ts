import { NextResponse } from "next/server";
import { runGmailSync } from "@/lib/gmail/sync";
import { GoogleReconnectError } from "@/lib/gmail/client";

// Give the sync up to a minute on Vercel (reading Gmail is the slow part).
export const maxDuration = 60;

export async function POST() {
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
