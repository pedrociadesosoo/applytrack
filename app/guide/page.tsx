import Link from "next/link";

// A short, friendly manual for first-time users.
const STEPS: { title: string; body: React.ReactNode; tint: 1 | 2 | 3 | 4 }[] = [
  {
    title: "Sync your Gmail",
    tint: 1,
    body: (
      <>
        Click <b>Sync Gmail</b> on the dashboard. ApplyTrack reads your job emails (read-only, it can&apos;t send or
        delete anything). A &ldquo;thanks for applying&rdquo; email adds a new application, and OA, HireVue,
        interview, offer, and rejection emails move it to the right stage. The first sync goes back to August 1.
      </>
    ),
  },
  {
    title: "Check the emails it wasn’t sure about",
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
    title: "Read your dashboard",
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
    title: "Follow each application’s journey",
    tint: 4,
    body: (
      <>
        Each application shows the stages it has been through as pills, like Applied › OA › HireVue › Offer. Hover a
        pill to see the date and what happened. On the Kanban board you can drag a card to move it to a new stage.
      </>
    ),
  },
  {
    title: "Let it remind you",
    tint: 1,
    body: (
      <>
        The <b>Calendar</b> suggests check-ins for you: finishing an OA, sending a thank-you note after an
        interview, following up when things go quiet, and deciding on offers. Applications that never hear back
        move to <b>Ghosted</b> on their own (when the internship season starts, or after 60 days with no reply).
      </>
    ),
  },
  {
    title: "Add or fix things yourself",
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
    title: "Make it yours",
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
      <h1 className="text-3xl font-bold tracking-tight text-neutral-900">How ApplyTrack works</h1>
      <p className="mt-1.5 text-sm text-neutral-500">
        A one-minute tour. Job hunting is stressful enough. This should make it a little lighter.
      </p>

      <ol className="mt-8 space-y-4">
        {STEPS.map((step, i) => (
          <li key={step.title} className="flex gap-4 rounded-3xl bg-white p-5 shadow-sm">
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

      <div className="mt-6 rounded-3xl bg-indigo-50 p-5 text-sm text-neutral-700">
        <b>Heads-up:</b> while ApplyTrack is in testing, Google asks you to reconnect Gmail every 7 days. If a sync says
        access expired, just sign out and sign back in.
      </div>

      <Link
        href="/"
        className="mt-6 inline-flex rounded-full bg-neutral-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800"
      >
        Go to my dashboard →
      </Link>
    </div>
  );
}
