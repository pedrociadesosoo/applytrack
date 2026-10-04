// Minimal Gmail REST client (plain fetch, no googleapis dependency).

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const GMAIL_API = "https://gmail.googleapis.com/gmail/v1/users/me";

export class GoogleReconnectError extends Error {}

export async function getAccessToken(refreshToken: string): Promise<string> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env.local, then restart the dev server.");
  }

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    if (data.error === "invalid_grant") {
      // Google expires refresh tokens for apps in "Testing" mode after 7 days.
      throw new GoogleReconnectError("Gmail access expired. Sign out and sign back in to reconnect.");
    }
    throw new Error(`Google token refresh failed: ${data.error_description ?? data.error}`);
  }
  return data.access_token as string;
}

async function gmail<T>(token: string, path: string): Promise<T> {
  const res = await fetch(`${GMAIL_API}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (res.status === 401) throw new GoogleReconnectError("Gmail access expired. Sign out and sign back in to reconnect.");
  if (res.status === 403) {
    const text = await res.text();
    if (text.includes("ACCESS_TOKEN_SCOPE_INSUFFICIENT")) {
      // Google's consent screen shows Gmail as an unticked checkbox.
      throw new GoogleReconnectError(
        "Gmail permission wasn't granted. Sign out, sign back in, and tick the box that lets ApplyTrack view your email."
      );
    }
    throw new Error(`Gmail API 403: ${text}`);
  }
  if (!res.ok) throw new Error(`Gmail API ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

export async function listMessageIds(token: string, query: string, max = 2000): Promise<string[]> {
  const ids: string[] = [];
  let pageToken: string | undefined;
  do {
    const params = new URLSearchParams({ q: query, maxResults: "500" });
    if (pageToken) params.set("pageToken", pageToken);
    const page = await gmail<{ messages?: { id: string }[]; nextPageToken?: string }>(
      token,
      `/messages?${params}`
    );
    ids.push(...(page.messages ?? []).map((m) => m.id));
    pageToken = page.nextPageToken;
  } while (pageToken && ids.length < max);
  return ids.slice(0, max);
}

interface GmailPart {
  mimeType?: string;
  body?: { data?: string };
  parts?: GmailPart[];
  headers?: { name: string; value: string }[];
}

export interface GmailMessage {
  id: string;
  threadId: string;
  receivedAt: Date;
  from: string;
  subject: string;
  snippet: string;
  body: string;
}

export async function getMessage(token: string, id: string): Promise<GmailMessage> {
  const msg = await gmail<{
    id: string;
    threadId: string;
    internalDate: string;
    snippet?: string;
    payload: GmailPart;
  }>(token, `/messages/${id}?format=full`);

  const header = (name: string) =>
    msg.payload.headers?.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? "";

  return {
    id: msg.id,
    threadId: msg.threadId,
    receivedAt: new Date(Number(msg.internalDate)),
    from: header("From"),
    subject: header("Subject"),
    snippet: decodeEntities(msg.snippet ?? ""),
    body: extractText(msg.payload),
  };
}

function extractText(part: GmailPart): string {
  const plain = findPart(part, "text/plain");
  if (plain) return decode(plain);
  const html = findPart(part, "text/html");
  return html ? htmlToText(decode(html)) : "";
}

function findPart(part: GmailPart, mimeType: string): string | null {
  if (part.mimeType === mimeType && part.body?.data) return part.body.data;
  for (const child of part.parts ?? []) {
    const found = findPart(child, mimeType);
    if (found) return found;
  }
  return null;
}

function decode(data: string) {
  return Buffer.from(data, "base64url").toString("utf8");
}

function htmlToText(html: string) {
  return decodeEntities(
    html
      .replace(/<(style|script)[\s\S]*?<\/\1>/gi, " ")
      .replace(/<br\s*\/?>|<\/p>|<\/div>|<\/li>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
  )
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim();
}

function decodeEntities(s: string) {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

export async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}
