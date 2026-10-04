"use client";

import { useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

// Read-only Gmail access, requested at sign-in so one Google login covers
// both authentication and inbox sync.
const GMAIL_SCOPE = "https://www.googleapis.com/auth/gmail.readonly";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn() {
    setLoading(true);
    setError(null);
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: GMAIL_SCOPE,
        // offline + consent makes Google return a refresh token, which the
        // Gmail sync needs to keep reading the inbox after this session ends.
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col items-center px-4 py-24 text-center">
      <h1 className="text-2xl font-semibold text-neutral-900">ApplyTrack</h1>
      <p className="mt-2 text-sm text-neutral-500">
        Sign in with the Google account you apply to jobs with. ApplyTrack gets read-only
        access to your Gmail so it can track applications for you.
      </p>
      <button
        onClick={signIn}
        disabled={loading}
        className="mt-8 w-full rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60"
      >
        {loading ? "Redirecting…" : "Continue with Google"}
      </button>
      {error && <p className="mt-4 text-sm text-rose-600">{error}</p>}
    </div>
  );
}
