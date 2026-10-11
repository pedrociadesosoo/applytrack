// Theme + encouragement preferences, stored in the user's Supabase auth
// metadata so they follow the account across devices.

export type ThemeId = "blush" | "lavender" | "sage" | "ocean" | "coffee" | "midnight" | "leopard" | "classic";
export type EncouragementMode = "scripture" | "quotes" | "off";

export const DEFAULT_THEME: ThemeId = "blush";
export const DEFAULT_ENCOURAGEMENT: EncouragementMode = "scripture";

export const THEMES: { id: ThemeId; name: string; swatches: string[] }[] = [
  { id: "blush", name: "Blush", swatches: ["#f7eef1", "#c55a87", "#f6c9da", "#3b2533"] },
  { id: "lavender", name: "Lavender", swatches: ["#f3f0f8", "#8162d6", "#e6d4f5", "#2f2842"] },
  { id: "sage", name: "Sage", swatches: ["#f1f4ee", "#538f58", "#cfe2c3", "#2a3225"] },
  { id: "ocean", name: "Ocean", swatches: ["#eef3f7", "#3285bb", "#cadff2", "#233039"] },
  { id: "coffee", name: "Coffee", swatches: ["#f8efe2", "#b06f35", "#efd3b0", "#3b2819"] },
  { id: "midnight", name: "Dark", swatches: ["#131116", "#e08ab5", "#43283b", "#f6f2f8"] },
  { id: "leopard", name: "Leopard", swatches: ["#19120c", "#cf9d54", "#c8995a", "#f7ecdc"] },
  { id: "classic", name: "Classic", swatches: ["#fafafa", "#4f46e5", "#e5e5e5", "#171717"] },
];

// Demo visitors have no account, so their Settings choices live in a
// browser-session cookie with the same shape as the account metadata.
export const DEMO_PREFS_COOKIE = "applytrack_demo_prefs";

export function parseDemoPrefs(value: string | undefined | null): Record<string, unknown> {
  if (!value) return {};
  try {
    const parsed = JSON.parse(decodeURIComponent(value));
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function readDemoPrefsCookie(): Record<string, unknown> {
  const match = document.cookie.split("; ").find((c) => c.startsWith(`${DEMO_PREFS_COOKIE}=`));
  return parseDemoPrefs(match?.slice(DEMO_PREFS_COOKIE.length + 1));
}

export function writeDemoPrefsCookie(prefs: Record<string, unknown>) {
  document.cookie = `${DEMO_PREFS_COOKIE}=${encodeURIComponent(JSON.stringify(prefs))}; path=/; samesite=lax`;
}

export function themeFrom(meta: Record<string, unknown> | undefined): ThemeId {
  const t = meta?.theme;
  return THEMES.some((x) => x.id === t) ? (t as ThemeId) : DEFAULT_THEME;
}

export function encouragementFrom(meta: Record<string, unknown> | undefined): EncouragementMode {
  const e = meta?.encouragement;
  return e === "scripture" || e === "quotes" || e === "off" ? e : DEFAULT_ENCOURAGEMENT;
}

export function firstNameFrom(meta: Record<string, unknown> | undefined, email?: string | null): string {
  const custom = typeof meta?.display_name === "string" ? meta.display_name : "";
  const full = custom || (typeof meta?.full_name === "string" ? meta.full_name : "") || (typeof meta?.name === "string" ? meta.name : "");
  const first = full.trim().split(/\s+/)[0];
  if (first) return first;
  return email ? email.split("@")[0] : "there";
}
