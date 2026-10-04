import Link from "next/link";
import { notFound } from "next/navigation";
import { getApplication, getApplicationEvents } from "@/lib/applications";
import { STAGE_LABELS, SOURCE_LABELS } from "@/lib/types";
import { formatDate, relativeTime } from "@/lib/format";
import StageBadge from "@/components/StageBadge";
import JDReadingView from "@/components/JDReadingView";
import DeleteApplicationButton from "@/components/DeleteApplicationButton";
import { ghostDeadline } from "@/lib/ghosting";
import OfferDecisionPicker from "@/components/OfferDecisionPicker";

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const application = await getApplication(id);
  if (!application) notFound();
  const events = await getApplicationEvents(id);
  const heardBack =
    application.current_stage !== "applied" || events.some((e) => e.stage !== "applied");
  const deadline = ghostDeadline(application.role_title, application.application_date, heardBack);
  const ghostsOnOpen =
    deadline && !["offer", "rejected", "ghosted", "withdrawn"].includes(application.current_stage);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <Link href="/" className="text-sm text-neutral-400 hover:text-neutral-600">
        ← All applications
      </Link>

      <div className="mt-3 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
            {application.company}
          </p>
          <h1 className="mt-0.5 text-2xl font-semibold text-neutral-900">
            {application.role_title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StageBadge stage={application.current_stage} decision={application.offer_decision} />
            <span className="text-xs text-neutral-400">
              {SOURCE_LABELS[application.source]} · Applied {formatDate(application.application_date)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href={`/applications/${application.id}/edit`}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            Edit
          </Link>
          <DeleteApplicationButton id={application.id} />
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <section>
            <h2 className="text-sm font-semibold text-neutral-900">Job description</h2>
            <div className="mt-3 rounded-xl border border-neutral-200 bg-white p-5">
              {application.job_description ? (
                <JDReadingView text={application.job_description} />
              ) : (
                <p className="text-sm text-neutral-400">No job description saved.</p>
              )}
              {application.job_post_url && (
                <a
                  href={application.job_post_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-block text-xs font-medium text-indigo-600 hover:text-indigo-700"
                >
                  Original posting ↗
                </a>
              )}
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-neutral-900">Stage history</h2>
            <ol className="mt-3 space-y-3 border-l border-neutral-200 pl-4">
              {events.map((event) => (
                <li key={event.id} className="relative">
                  <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-neutral-300" />
                  <p className="text-sm font-medium text-neutral-800">{STAGE_LABELS[event.stage]}</p>
                  <p className="text-xs text-neutral-400">
                    {formatDate(event.event_date)} · {relativeTime(event.event_date)}
                  </p>
                  {event.notes && <p className="mt-0.5 text-xs text-neutral-500">{event.notes}</p>}
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="space-y-4">
          {application.current_stage === "offer" && (
            <InfoBlock title="Offer decision">
              <OfferDecisionPicker applicationId={application.id} initial={application.offer_decision} />
            </InfoBlock>
          )}
          {deadline && (
            <InfoBlock title="Ghost date">
              <p className="text-sm text-neutral-700">{formatDate(deadline.date)}</p>
              <p className="mt-1 text-xs text-neutral-400">
                {ghostsOnOpen
                  ? deadline.rule === "season"
                    ? `Moves to Ghosted automatically if there's no outcome by the start of ${deadline.label}.`
                    : `Moves to Ghosted automatically if there's still no reply ${deadline.label}.`
                  : deadline.rule === "season"
                    ? `Start of ${deadline.label}.`
                    : deadline.label}
              </p>
            </InfoBlock>
          )}
          <InfoBlock title="Next action">
            <p className="text-sm text-neutral-700">{application.next_action || "—"}</p>
            {application.next_action_date && (
              <p className="mt-1 text-xs text-neutral-400">
                Due {formatDate(application.next_action_date)}
              </p>
            )}
          </InfoBlock>

          <InfoBlock title="Materials">
            <dl className="space-y-1.5 text-sm">
              <Row label="Resume" value={application.resume_version_used} />
              <Row label="Cover letter" value={application.cover_letter_used} />
            </dl>
          </InfoBlock>

          <InfoBlock title="Contact">
            <dl className="space-y-1.5 text-sm">
              <Row label="Name" value={application.contact_name} />
              <Row label="Email" value={application.contact_email} />
            </dl>
          </InfoBlock>
        </aside>
      </div>
    </div>
  );
}

function InfoBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-400">{title}</h3>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-neutral-400">{label}</dt>
      <dd className="text-neutral-700">{value || "—"}</dd>
    </div>
  );
}
