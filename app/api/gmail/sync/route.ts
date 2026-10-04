import { NextResponse } from "next/server";
import { runGmailSync } from "@/lib/gmail/sync";
import { GoogleReconnectError } from "@/lib/gmail/client";

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
