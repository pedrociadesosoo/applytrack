// Finds a job posting link in text (usually a confirmation email) and pulls
// the full job description from the job board's free public API.
// Supported: Greenhouse, Lever, Ashby. Everything else falls back to the
// user pasting the description, so we never guess.

export interface Posting {
  title: string | null;
  description: string;
  url: string;
  board: "greenhouse" | "lever" | "ashby";
}

type Ref =
  | { board: "greenhouse"; org: string; id: string; url: string }
  | { board: "lever"; org: string; id: string; url: string }
  | { board: "ashby"; org: string; id: string; url: string };

const PATTERNS: { board: Ref["board"]; re: RegExp }[] = [
  { board: "greenhouse", re: /https?:\/\/(?:boards|job-boards)(?:\.eu)?\.greenhouse\.io\/([\w-]+)\/jobs\/(\d+)/i },
  { board: "greenhouse", re: /https?:\/\/boards\.greenhouse\.io\/embed\/job_app\?[^\s"'<>]*?for=([\w-]+)[^\s"'<>]*?token=(\d+)/i },
  { board: "lever", re: /https?:\/\/jobs\.(?:eu\.)?lever\.co\/([\w.-]+)\/([0-9a-f-]{36})/i },
  { board: "ashby", re: /https?:\/\/jobs\.ashbyhq\.com\/([\w.%-]+)\/([0-9a-f-]{36})/i },
];

export function findPostingRef(text: string): Ref | null {
  for (const { board, re } of PATTERNS) {
    const m = text.match(re);
    if (m) return { board, org: decodeURIComponent(m[1]), id: m[2], url: m[0] } as Ref;
  }
  return null;
}

export function isSupportedPostingUrl(url: string) {
  return findPostingRef(url) !== null;
}

/** Turns posting HTML into readable plain text with bullets and line breaks. */
export function htmlToText(html: string): string {
  const decoded = html
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, "&");
  return decoded
    .replace(/<\s*(script|style)[\s\S]*?<\/\s*\1\s*>/gi, "")
    .replace(/<\s*li[^>]*>/gi, "\n- ")
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/\s*(p|div|h[1-6]|ul|ol|li|section)\s*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&amp;/g, "&")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\n\n(?=- )/g, "\n")
    .trim();
}

async function getJson(url: string): Promise<unknown | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000), headers: { accept: "application/json" } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchPosting(textOrUrl: string): Promise<Posting | null> {
  const ref = findPostingRef(textOrUrl);
  if (!ref) return null;

  if (ref.board === "greenhouse") {
    const data = (await getJson(
      `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(ref.org)}/jobs/${ref.id}`
    )) as { title?: string; content?: string; absolute_url?: string } | null;
    if (!data?.content) return null;
    return { board: "greenhouse", title: data.title ?? null, description: htmlToText(data.content), url: data.absolute_url || ref.url };
  }

  if (ref.board === "lever") {
    const data = (await getJson(
      `https://api.lever.co/v0/postings/${encodeURIComponent(ref.org)}/${ref.id}`
    )) as {
      text?: string;
      descriptionPlain?: string;
      description?: string;
      lists?: { text: string; content: string }[];
      additionalPlain?: string;
      hostedUrl?: string;
    } | null;
    if (!data) return null;
    const parts = [data.descriptionPlain || (data.description ? htmlToText(data.description) : "")];
    for (const l of data.lists ?? []) parts.push(`${l.text}\n${htmlToText(`<ul>${l.content}</ul>`)}`);
    if (data.additionalPlain) parts.push(data.additionalPlain);
    const description = parts.filter(Boolean).join("\n\n").trim();
    if (!description) return null;
    return { board: "lever", title: data.text ?? null, description, url: data.hostedUrl || ref.url };
  }

  const data = (await getJson(
    `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(ref.org)}`
  )) as { jobs?: { id: string; title?: string; descriptionPlain?: string; descriptionHtml?: string; jobUrl?: string }[] } | null;
  const job = data?.jobs?.find((j) => j.id === ref.id);
  if (!job) return null;
  const description = job.descriptionPlain || (job.descriptionHtml ? htmlToText(job.descriptionHtml) : "");
  if (!description) return null;
  return { board: "ashby", title: job.title ?? null, description, url: job.jobUrl || ref.url };
}
