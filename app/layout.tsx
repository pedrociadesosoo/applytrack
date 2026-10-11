import type { Metadata } from "next";
import "./globals.css";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import { firstNameFrom, themeFrom } from "@/lib/themes";
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
  const demo = !user && (await cookies()).get(DEMO_COOKIE)?.value === "1";

  return (
    <html lang="en" data-theme={themeFrom(meta)} className="h-full antialiased">
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
