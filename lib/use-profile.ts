"use client";

import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { encouragementFrom, firstNameFrom, readDemoPrefsCookie, themeFrom, type EncouragementMode, type ThemeId } from "@/lib/themes";

export interface Profile {
  firstName: string;
  theme: ThemeId;
  encouragement: EncouragementMode;
  displayName: string;
  onboarded: boolean;
  demo: boolean;
}

// The signed-in user's name and preferences, read from their auth metadata.
export function useProfile(): Profile | null {
  const [profile, setProfile] = useState<Profile | null>(null);
  useEffect(() => {
    let cancelled = false;
    createBrowserSupabaseClient()
      .auth.getUser()
      .then(({ data }) => {
        if (cancelled) return;
        if (!data.user) {
          if (document.cookie.includes("applytrack_demo=1")) {
            const prefs = readDemoPrefsCookie();
            const displayName = typeof prefs.display_name === "string" ? prefs.display_name : "";
            setProfile({
              firstName: displayName.trim().split(/\s+/)[0] ?? "",
              theme: themeFrom(prefs),
              encouragement: encouragementFrom(prefs),
              displayName,
              onboarded: false,
              demo: true,
            });
          }
          return;
        }
        const meta = data.user.user_metadata as Record<string, unknown>;
        setProfile({
          firstName: firstNameFrom(meta, data.user.email),
          theme: themeFrom(meta),
          encouragement: encouragementFrom(meta),
          displayName: typeof meta.display_name === "string" ? meta.display_name : "",
          onboarded: meta.onboarded === true,
          demo: false,
        });
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return profile;
}
