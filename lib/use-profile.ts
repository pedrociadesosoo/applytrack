"use client";

import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { encouragementFrom, firstNameFrom, themeFrom, type EncouragementMode, type ThemeId } from "@/lib/themes";

export interface Profile {
  firstName: string;
  theme: ThemeId;
  encouragement: EncouragementMode;
  displayName: string;
}

// The signed-in user's name and preferences, read from their auth metadata.
export function useProfile(): Profile | null {
  const [profile, setProfile] = useState<Profile | null>(null);
  useEffect(() => {
    let cancelled = false;
    createBrowserSupabaseClient()
      .auth.getUser()
      .then(({ data }) => {
        if (cancelled || !data.user) return;
        const meta = data.user.user_metadata as Record<string, unknown>;
        setProfile({
          firstName: firstNameFrom(meta, data.user.email),
          theme: themeFrom(meta),
          encouragement: encouragementFrom(meta),
          displayName: typeof meta.display_name === "string" ? meta.display_name : "",
        });
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return profile;
}
