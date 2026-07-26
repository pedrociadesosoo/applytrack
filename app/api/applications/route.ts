import { NextRequest, NextResponse } from "next/server";
import { createApplication, listApplications } from "@/lib/applications";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  try {
    const applications = await listApplications({
      search: searchParams.get("q") ?? undefined,
      stage: searchParams.get("stage") ?? undefined,
      source: searchParams.get("source") ?? undefined,
    });
    return NextResponse.json({ applications });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.company || !body.role_title) {
      return NextResponse.json(
        { error: "company and role_title are required" },
        { status: 400 }
      );
    }

    const application = await createApplication(body);
    return NextResponse.json({ application }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
