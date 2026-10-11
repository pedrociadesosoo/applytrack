import type { Metadata } from "next";
import "./globals.css";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import { DEMO_PREFS_COOKIE, firstNameFrom, parseDemoPrefs, themeFrom } from "@/lib/themes";
import { cookies } from "next/headers";
import { DEMO_COOKIE } from "@/lib/demo";

export const metadata: Metadata = {
  title: "ApplyTrack",
  description: "A calm, encouraging job and internship tracker that updates itself from your Gmail.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const meta = user?.user_metadata as Record<string, unknown> | undefined;
  const jar = await cookies();
  const demo = !user && jar.get(DEMO_COOKIE)?.value === "1";
  const themeMeta = demo ? parseDemoPrefs(jar.get(DEMO_PREFS_COOKIE)?.value) : meta;

  return (
    <html lang="en" data-theme={themeFrom(themeMeta)} className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-neutral-50 text-neutral-900">
        <AppShell
          user={
            user
              ? {
                  firstName: firstNameFrom(meta, user.email),
                  email: user.email ?? null,
                  avatarUrl: typeof meta?.avatar_url === "string" ? meta.avatar_url : null,
                }
              : demo
                ? { firstName: "Demo", email: "Sample data", avatarUrl: null, demo: true }
                : null
          }
        >
          {children}
        </AppShell>
      </body>
    </html>
  );
}
