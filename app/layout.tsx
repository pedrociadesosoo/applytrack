import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "ApplyTrack",
  description:
    "A data-driven job/internship application tracker with Gmail-powered status detection and AI follow-up assistance.",
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

  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-neutral-50">
        <header className="border-b border-neutral-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
            <Link href="/" className="text-sm font-semibold tracking-tight text-neutral-900">
              ApplyTrack
            </Link>
            {user && (
              <form action="/auth/signout" method="post" className="flex items-center gap-3">
                <span className="hidden text-xs text-neutral-400 sm:inline">{user.email}</span>
                <button
                  type="submit"
                  className="text-xs font-medium text-neutral-500 hover:text-neutral-900"
                >
                  Sign out
                </button>
              </form>
            )}
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
