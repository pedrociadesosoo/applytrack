import { NextRequest, NextResponse } from "next/server";
import {
  deleteApplication,
  getApplication,
  getApplicationEvents,
  updateApplication,
} from "@/lib/applications";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const application = await getApplication(id);
    if (!application) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const events = await getApplicationEvents(id);
    return NextResponse.json({ application, events });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const application = await updateApplication(id, body);
    return NextResponse.json({ application });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await deleteApplication(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
