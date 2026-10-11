import { NextRequest, NextResponse } from "next/server";
import { DEMO_COOKIE } from "@/lib/demo";

// "Try the demo": set the demo flag (for this browser session) and open the dashboard.
export async function GET(request: NextRequest) {
  const res = NextResponse.redirect(new URL("/", request.url));
  res.cookies.set(DEMO_COOKIE, "1", { path: "/", sameSite: "lax", httpOnly: false });
  return res;
}
