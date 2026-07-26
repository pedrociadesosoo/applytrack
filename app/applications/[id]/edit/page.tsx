import { notFound } from "next/navigation";
import { getApplication } from "@/lib/applications";
import ApplicationForm from "@/components/ApplicationForm";

export default async function EditApplicationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const application = await getApplication(id);
  if (!application) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-xl font-semibold text-neutral-900">
        Edit {application.company} — {application.role_title}
      </h1>
      <div className="mt-6">
        <ApplicationForm applicationId={application.id} initial={application} />
      </div>
    </div>
  );
}
