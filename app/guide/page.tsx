import Link from "next/link";
import { STAGE_DESCRIPTIONS, STAGE_LABELS, STAGE_ORDER } from "@/lib/types";

// A short, friendly manual for first-time users.
const STEPS: { title: string; body: React.ReactNode; tint: 1 | 2 | 3 | 4 }[] = [
  {
    title: "Sync Your Gmail",
    tint: 1,
    body: (
      <>
        Click <b>Sync Gmail</b> on the dashboard. ApplyTrack reads your job emails (read-only, it can&apos;t send or
        delete anything). A &ldquo;thanks for applying&rdquo; email adds a new application, and online assessment, video interview,
        interview, offer, and rejection emails move it to the right stage. The first sync goes back to August 1.
      </>
    ),
  },
  {
    title: "Review Unclear Emails",
    tint: 2,
    body: (
      <>
        If an email is unclear, ApplyTrack asks you instead of guessing. You&apos;ll see a bar saying some emails
        need a quick review. Open <b>Review emails</b>, fix the company, role, or stage if needed, then hit{" "}
        <b>Confirm</b>, or <b>Not job-related</b> to skip it.
      </>
    ),
  },
  {
    title: "Read Your Dashboard",
    tint: 3,
    body: (
      <>
        The colored cards are clickable. <b>Response rate</b> shows exactly where that number comes from, and{" "}
        <b>Needs follow-up</b> lists applications that have gone quiet. <b>Where things stand</b> shows your pipeline.
        Click a stage to see only those applications. Switch between Cards, Kanban, Table, and Calendar anytime.
      </>
    ),
  },
  {
    title: "Follow Each Application’s Journey",
    tint: 4,
    body: (
      <>
        Each application shows the stages it has been through as pills, like Applied › Online Assessment › Video Interview › Offer. Hover a
        pill to see the date and what happened. On the Kanban board you can drag a card to move it to a new stage.
      </>
    ),
  },
  {
    title: "Let It Remind You",
    tint: 1,
    body: (
      <>
        The <b>Calendar</b> suggests check-ins for you: finishing an online assessment, sending a thank-you note after an
        interview, following up when things go quiet, and deciding on offers. Applications that never hear back
        move to <b>Ghosted</b> on their own (when the internship season starts, or after 60 days with no reply).
      </>
    ),
  },
  {
    title: "Add or Fix Things Yourself",
    tint: 2,
    body: (
      <>
        Use <b>Add application</b> for anything the sync missed, and <b>Edit</b> on any application to change details.
        If something shows up twice, open it and use <b>Merge</b>. Got an offer? Mark it Deciding, Accepted, or
        Declined.
      </>
    ),
  },
  {
    title: "Make It Yours",
    tint: 3,
    body: (
      <>
        In <b>Settings</b>, choose what to call you, pick a theme, and choose your encouragement: a Bible verse, encouraging
        words, or nothing at all.
      </>
    ),
  },
];

export default function GuidePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-8 lg:py-10">
      <h1 className="text-3xl font-bold tracking-tight text-neutral-900">How ApplyTrack Works</h1>
      <p className="mt-1.5 text-sm text-neutral-500">
        A one-minute tour. Job hunting is stressful enough. This should make it a little lighter.
      </p>

      <ol className="mt-8 space-y-4">
        {STEPS.map((step, i) => (
          <li key={step.title} className="flex gap-4 rounded-2xl border border-neutral-200/80 bg-white p-5">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-base font-bold text-neutral-900"
              style={{ background: `var(--tile-${step.tint})` }}
            >
              {i + 1}
            </span>
            <div>
              <h2 className="text-base font-semibold text-neutral-900">{step.title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-neutral-600">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <section className="mt-8 rounded-2xl border border-neutral-200/80 bg-white p-5">
        <h2 className="text-base font-semibold text-neutral-900">What the Stages Mean</h2>
        <dl className="mt-3 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
          {STAGE_ORDER.map((s) => (
            <div key={s}>
              <dt className="font-semibold text-neutral-800">{STAGE_LABELS[s]}</dt>
              <dd className="text-neutral-600">{STAGE_DESCRIPTIONS[s]}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="mt-6 rounded-2xl bg-indigo-50 p-5 text-sm text-neutral-700">
        <b>Heads-up:</b> while ApplyTrack is in testing, Google asks you to reconnect Gmail every 7 days. If a sync says
        access expired, just sign out and sign back in.
      </div>

      <Link
        href="/"
        className="mt-6 inline-flex rounded-full bg-neutral-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}
