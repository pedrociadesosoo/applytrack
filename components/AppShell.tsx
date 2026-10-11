"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface ShellUser {
  firstName: string;
  email: string | null;
  avatarUrl: string | null;
  demo?: boolean;
}

const NAV = [
  { href: "/", label: "Dashboard", icon: IconHome },
  { href: "/review", label: "Review emails", icon: IconInbox },
  { href: "/applications/new", label: "Add application", icon: IconPlus },
  { href: "/guide", label: "How it works", icon: IconHelp },
  { href: "/settings", label: "Settings", icon: IconSettings },
];

// Sidebar on desktop, a compact top bar on phones.
export default function AppShell({ user, children }: { user: ShellUser | null; children: React.ReactNode }) {
  const pathname = usePathname();
  if (!user) return <main className="flex-1">{children}</main>;

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <div className="flex min-h-screen flex-1 flex-col md:flex-row">
      {/* Desktop sidebar */}
      <aside className="theme-pattern sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-neutral-200 bg-white/70 px-4 py-6 backdrop-blur md:flex">
        <Link href="/" className="px-2 text-xl font-bold tracking-tight text-neutral-900">
          Apply<span className="text-indigo-500">Track</span>
        </Link>

        <div className="mt-8 flex items-center gap-3 rounded-2xl bg-neutral-50 p-3">
          <Avatar user={user} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-neutral-900">{user.firstName}</p>
            <p className="truncate text-[11px] text-neutral-500">{user.email}</p>
          </div>
        </div>

        <nav className="mt-6 space-y-1">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium transition ${
                isActive(href)
                  ? "bg-neutral-900 text-white shadow-sm"
                  : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
              }`}
            >
              <Icon />
              {label}
            </Link>
          ))}
        </nav>

        <form action="/auth/signout" method="post" className="mt-auto">
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900"
          >
            <IconLogout />
            {user.demo ? "Exit demo" : "Sign out"}
          </button>
        </form>
      </aside>

      {/* Phone top bar */}
      <header className="theme-pattern sticky top-0 z-30 border-b border-neutral-200 bg-white/90 backdrop-blur md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/" className="text-base font-bold tracking-tight text-neutral-900">
            Apply<span className="text-indigo-500">Track</span>
          </Link>
          <Avatar user={user} small />
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-2">
          {NAV.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${
                isActive(href) ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-600"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="min-w-0 flex-1">
        {user.demo && (
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-neutral-900 px-4 py-2 text-center text-xs text-white">
            <span>You&apos;re viewing a demo with sample data. Changes aren&apos;t saved.</span>
            <a href="/login" className="font-semibold underline">
              Sign in to track your own →
            </a>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}

function Avatar({ user, small }: { user: ShellUser; small?: boolean }) {
  const size = small ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm";
  if (user.avatarUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={user.avatarUrl} alt="" referrerPolicy="no-referrer" className={`${size} shrink-0 rounded-full object-cover`} />;
  }
  return (
    <span className={`${size} flex shrink-0 items-center justify-center rounded-full bg-indigo-200 font-semibold text-indigo-700`}>
      {user.firstName.slice(0, 1).toUpperCase()}
    </span>
  );
}

const iconProps = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};
function IconHome() {
  return (
    <svg {...iconProps}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V20h14V9.5" />
    </svg>
  );
}
function IconInbox() {
  return (
    <svg {...iconProps}>
      <path d="M4 13h4l2 3h4l2-3h4" />
      <path d="M5.5 5h13L21 13v6H3v-6z" />
    </svg>
  );
}
function IconPlus() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  );
}
function IconHelp() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17h.01" />
    </svg>
  );
}
function IconSettings() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </svg>
  );
}
function IconLogout() {
  return (
    <svg {...iconProps}>
      <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
      <path d="M10 17l5-5-5-5M15 12H4" />
    </svg>
  );
}
