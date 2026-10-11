"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DeleteAccount from "@/components/DeleteAccount";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/use-profile";
import { THEMES, writeDemoPrefsCookie, type EncouragementMode, type ThemeId } from "@/lib/themes";

const ENCOURAGEMENT_OPTIONS: { id: EncouragementMode; label: string; hint: string }[] = [
  { id: "scripture", label: "Scripture", hint: "A Bible verse for the day, and for rejections, progress, and offers" },
  { id: "quotes", label: "Encouraging words", hint: "Short, uplifting notes without scripture" },
  { id: "off", label: "Off", hint: "Just the dashboard" },
];

export default function SettingsPage() {
  const router = useRouter();
  const profile = useProfile();
  const [theme, setTheme] = useState<ThemeId | null>(null);
  const [encouragement, setEncouragement] = useState<EncouragementMode | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const currentTheme = theme ?? profile?.theme ?? null;
  const currentEnc = encouragement ?? profile?.encouragement ?? null;
  const currentName = displayName ?? profile?.displayName ?? "";

  // Live preview: repaint the page as soon as a theme is clicked.
  useEffect(() => {
    if (theme) document.documentElement.dataset.theme = theme;
  }, [theme]);

  async function save() {
    if (profile?.demo) {
      // Demo: remember choices for this browser session only.
      writeDemoPrefsCookie({ theme: currentTheme, encouragement: currentEnc, display_name: currentName.trim() || null });
      setStatus("saved");
      router.refresh();
      return;
    }
    setStatus("saving");
    const { error } = await createBrowserSupabaseClient().auth.updateUser({
      data: {
        theme: currentTheme,
        encouragement: currentEnc,
        display_name: currentName.trim() || null,
      },
    });
    setStatus(error ? "error" : "saved");
    if (!error) router.refresh();
  }

  if (!profile) {
    return <div className="mx-auto max-w-3xl px-4 py-10 text-sm text-neutral-400 sm:px-8">Loading…</div>;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-8 lg:py-10">
      <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Settings</h1>
      <p className="mt-1 text-sm text-neutral-500">Make ApplyTrack feel like yours.</p>

      <section className="mt-8 rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-neutral-900">What should we call you?</h2>
        <p className="mt-0.5 text-sm text-neutral-500">Used in your greeting.</p>
        <input
          value={currentName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder={profile.firstName}
          className="mt-3 w-full max-w-xs rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
        />
      </section>

      <section className="mt-5 rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-neutral-900">Theme</h2>
        <p className="mt-0.5 text-sm text-neutral-500">Click one to preview it.</p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {THEMES.map((t) => {
            const selected = currentTheme === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                aria-pressed={selected}
                className={`rounded-2xl border p-3 text-left transition ${
                  selected ? "border-neutral-900 ring-2 ring-neutral-900" : "border-neutral-200 hover:border-neutral-400"
                }`}
              >
                <span className="flex h-10 overflow-hidden rounded-xl">
                  {t.swatches.map((c) => (
                    <span key={c} className="flex-1" style={{ background: c }} />
                  ))}
                </span>
                <span className="mt-2 block text-sm font-medium text-neutral-800">
                  {t.name}
                  {selected && " ✓"}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-5 rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-neutral-900">Encouragement</h2>
        <p className="mt-0.5 text-sm text-neutral-500">Shown under your greeting on the dashboard.</p>
        <div className="mt-4 space-y-2">
          {ENCOURAGEMENT_OPTIONS.map((o) => (
            <label
              key={o.id}
              className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-3.5 transition ${
                currentEnc === o.id ? "border-neutral-900 bg-neutral-50" : "border-neutral-200 hover:bg-neutral-50"
              }`}
            >
              <input
                type="radio"
                name="encouragement"
                checked={currentEnc === o.id}
                onChange={() => setEncouragement(o.id)}
                className="mt-1 accent-neutral-900"
              />
              <span>
                <span className="block text-sm font-medium text-neutral-900">{o.label}</span>
                <span className="block text-xs text-neutral-500">{o.hint}</span>
              </span>
            </label>
          ))}
        </div>
      </section>

      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={save}
          disabled={status === "saving"}
          className="rounded-full bg-neutral-900 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-neutral-800 disabled:opacity-60"
        >
          {status === "saving" ? "Saving…" : "Save changes"}
        </button>
        {status === "saved" && (
          <span className="text-sm text-neutral-600">{profile.demo ? "Saved for this visit ✓" : "Saved ✓"}</span>
        )}
        {status === "error" && <span className="text-sm text-rose-600">Couldn&apos;t save. Try again.</span>}
        <Link
          href="/"
          className="ml-auto rounded-full border border-neutral-200 px-5 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-white"
        >
          Go to my dashboard →
        </Link>
      </div>

      {!profile.demo && <DeleteAccount />}
      <p className="mt-4 text-xs text-neutral-500">
        Read how ApplyTrack handles your data in the{" "}
        <Link href="/privacy" className="font-medium underline">
          privacy policy
        </Link>
        .
      </p>
    </div>
  );
}
