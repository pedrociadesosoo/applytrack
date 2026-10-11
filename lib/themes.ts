// Theme + encouragement preferences, stored in the user's Supabase auth
// metadata so they follow the account across devices.

export type ThemeId = "blush" | "lavender" | "sage" | "ocean" | "classic";
export type EncouragementMode = "scripture" | "quotes" | "off";

export const DEFAULT_THEME: ThemeId = "blush";
export const DEFAULT_ENCOURAGEMENT: EncouragementMode = "scripture";

export const THEMES: { id: ThemeId; name: string; swatches: string[] }[] = [
  { id: "blush", name: "Blush", swatches: ["#f7eef1", "#c55a87", "#f6c9da", "#3b2533"] },
  { id: "lavender", name: "Lavender", swatches: ["#f3f0f8", "#8162d6", "#e6d4f5", "#2f2842"] },
  { id: "sage", name: "Sage", swatches: ["#f1f4ee", "#538f58", "#cfe2c3", "#2a3225"] },
  { id: "ocean", name: "Ocean", swatches: ["#eef3f7", "#3285bb", "#cadff2", "#233039"] },
  { id: "classic", name: "Classic", swatches: ["#fafafa", "#4f46e5", "#e5e5e5", "#171717"] },
];

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
