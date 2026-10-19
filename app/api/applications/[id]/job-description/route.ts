import { NextRequest, NextResponse } from "next/server";
import { updateApplication } from "@/lib/applications";
import { fetchPosting, isSupportedPostingUrl } from "@/lib/jobs/posting";

// Save a job description, either by fetching it from a supported job board
// link (Greenhouse, Lever, Ashby) or from text the user pasted.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = (await request.json()) as { url?: string; text?: string };
    const url = body.url?.trim();
    const text = body.text?.trim();

    if (url) {
      if (!isSupportedPostingUrl(url)) {
        return NextResponse.json(
          { error: "unsupported", message: "That site isn't supported yet. Paste the description instead." },
          { status: 422 }
        );
      }
      const posting = await fetchPosting(url);
      if (!posting) {
        return NextResponse.json(
          { error: "not_found", message: "Couldn't find that posting. It may have closed. Paste the description instead." },
          { status: 404 }
        );
      }
      await updateApplication(id, { job_description: posting.description, job_post_url: posting.url });
      return NextResponse.json({ description: posting.description, url: posting.url });
    }

    if (text && text.length > 20) {
      await updateApplication(id, { job_description: text });
      return NextResponse.json({ description: text });
    }

    return NextResponse.json({ error: "empty", message: "Add a link or paste the description." }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "server", message: (error as Error).message }, { status: 500 });
  }
}
