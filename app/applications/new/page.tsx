import ApplicationForm from "@/components/ApplicationForm";

export default function NewApplicationPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-xl font-semibold text-neutral-900">Add application</h1>
      <p className="mt-1 text-sm text-neutral-500">
        The job description gets archived permanently with this record.
      </p>
      <div className="mt-6">
        <ApplicationForm />
      </div>
    </div>
  );
}
