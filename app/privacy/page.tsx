import Link from "next/link";

export const metadata = { title: "Privacy · ApplyTrack" };

// Plain-language privacy policy. Public (no sign-in needed).
export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-8">
      <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-800">
        ← ApplyTrack
      </Link>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-neutral-900">Privacy</h1>
      <p className="mt-1 text-sm text-neutral-500">Last updated October 11, 2026</p>

      <div className="mt-8 space-y-6 text-[15px] leading-relaxed text-neutral-700">
        <p>
          ApplyTrack is a student-built tool for tracking job and internship applications. Here&apos;s exactly what it
          does with your data, in plain words.
        </p>

        <Section title="What ApplyTrack reads">
          When you sign in with Google, you give ApplyTrack <b>read-only</b> access to your Gmail. It searches for emails
          that look job-related (application confirmations, assessments, interviews, offers, rejections) so it can
          track your applications for you. It <b>cannot</b> send, delete, or change any email.
        </Section>

        <Section title="What ApplyTrack stores">
          <ul className="list-disc space-y-1 pl-5">
            <li>Your name, email address, and profile photo from Google, so you can sign in.</li>
            <li>A Google access token, so the app can keep syncing without asking you to sign in every time. Only the server can read it.</li>
            <li>Your applications and their history: companies, roles, stages, dates, and anything you type in yourself.</li>
            <li>
              For each job-related email it looks at: the sender, subject line, date, a short preview, and what the app
              decided it meant. <b>It does not store full email contents.</b>
            </li>
            <li>Your settings, like your theme and encouragement preference.</li>
          </ul>
        </Section>

        <Section title="What ApplyTrack never does">
          It doesn&apos;t sell or share your data, show ads, or use your emails to train AI models. Each person can only
          see their own data. That&apos;s enforced by the database itself, not just the app.
        </Section>

        <Section title="Where your data lives">
          Data is stored with <b>Supabase</b> (the database) and the app runs on <b>Vercel</b> (hosting). Google provides
          sign-in and Gmail access.
        </Section>

        <Section title="Google user data">
          ApplyTrack&apos;s use and transfer of information received from Google APIs adheres to the{" "}
          <a
            className="font-medium text-indigo-600 underline"
            href="https://developers.google.com/terms/api-services-user-data-policy"
            target="_blank"
            rel="noreferrer"
          >
            Google API Services User Data Policy
          </a>
          , including the Limited Use requirements.
        </Section>

        <Section title="Deleting your data">
          Go to <b>Settings → Delete my account</b>. That disconnects Gmail and permanently deletes your applications,
          history, saved email details, settings, and account. You can also remove ApplyTrack&apos;s Gmail access anytime
          at{" "}
          <a className="font-medium text-indigo-600 underline" href="https://myaccount.google.com/connections" target="_blank" rel="noreferrer">
            myaccount.google.com/connections
          </a>
          .
        </Section>

        <Section title="Questions">
          ApplyTrack is built by Pedrocia De-Sosoo. Reach out at{" "}
          <a className="font-medium text-indigo-600 underline" href="mailto:desosoop7@gmail.com">
            desosoop7@gmail.com
          </a>
          .
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm">
      <h2 className="text-base font-semibold text-neutral-900">{title}</h2>
      <div className="mt-2">{children}</div>
    </section>
  );
}
