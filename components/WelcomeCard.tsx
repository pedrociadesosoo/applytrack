"use client";

import { useState } from "react";
import Link from "next/link";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/use-profile";

// First-visit welcome. Dismissing it is remembered on the account.
export default function WelcomeCard() {
  const profile = useProfile();
  const [hidden, setHidden] = useState(false);
  if (!profile || profile.onboarded || hidden) return null;

  async function dismiss() {
    setHidden(true);
    await createBrowserSupabaseClient().auth.updateUser({ data: { onboarded: true } });
  }

  return (
    <div className="mt-6 flex flex-col gap-3 rounded-3xl p-5 sm:flex-row sm:items-center sm:justify-between" style={{ background: "var(--tile-2)" }}>
      <div>
        <p className="text-base font-semibold text-neutral-900">Welcome to ApplyTrack 👋</p>
        <p className="mt-0.5 text-sm text-neutral-700">New here? Take the one-minute tour to see how everything works.</p>
      </div>
      <div className="flex shrink-0 gap-2">
        <Link
          href="/guide"
          onClick={dismiss}
          className="rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800"
        >
          Show me how it works
        </Link>
        <button onClick={dismiss} className="rounded-full px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-white/50">
          Maybe later
        </button>
      </div>
    </div>
  );
}
