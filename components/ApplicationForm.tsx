"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Application, ApplicationInput } from "@/lib/types";
import { STAGE_ORDER, STAGE_LABELS, SOURCE_LABELS } from "@/lib/types";

const SOURCE_OPTIONS = Object.keys(SOURCE_LABELS) as (keyof typeof SOURCE_LABELS)[];

function toInput(app?: Partial<Application>): ApplicationInput {
  return {
    company: app?.company ?? "",
    role_title: app?.role_title ?? "",
    application_date: app?.application_date ?? new Date().toISOString().slice(0, 10),
    source: app?.source ?? "other",
    current_stage: app?.current_stage ?? "applied",
    next_action: app?.next_action ?? "",
    next_action_date: app?.next_action_date ?? "",
    job_description: app?.job_description ?? "",
    job_post_url: app?.job_post_url ?? "",
    resume_version_used: app?.resume_version_used ?? "",
    cover_letter_used: app?.cover_letter_used ?? "",
    contact_name: app?.contact_name ?? "",
    contact_email: app?.contact_email ?? "",
    confidence_rating: app?.confidence_rating ?? null,
  };
}

export default function ApplicationForm({
  applicationId,
  initial,
}: {
  applicationId?: string;
  initial?: Partial<Application>;
}) {
  const router = useRouter();
  const [form, setForm] = useState<ApplicationInput>(toInput(initial));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = Boolean(applicationId);

  function update<K extends keyof ApplicationInput>(key: K, value: ApplicationInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      ...form,
      next_action: form.next_action || null,
      next_action_date: form.next_action_date || null,
      job_description: form.job_description || null,
      job_post_url: form.job_post_url || null,
      resume_version_used: form.resume_version_used || null,
      cover_letter_used: form.cover_letter_used || null,
      contact_name: form.contact_name || null,
      contact_email: form.contact_email || null,
    };

    try {
      const res = await fetch(
        isEdit ? `/api/applications/${applicationId}` : "/api/applications",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");

      router.push(`/applications/${data.application.id}`);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400";
  const labelClass = "mb-1 block text-xs font-medium text-neutral-600";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Company *</label>
          <input
            required
            className={inputClass}
            value={form.company}
            onChange={(e) => update("company", e.target.value)}
            placeholder="Rivian"
          />
        </div>
        <div>
          <label className={labelClass}>Role title *</label>
          <input
            required
            className={inputClass}
            value={form.role_title}
            onChange={(e) => update("role_title", e.target.value)}
            placeholder="Data Science Intern"
          />
        </div>
        <div>
          <label className={labelClass}>Application date</label>
          <input
            type="date"
            className={inputClass}
            value={form.application_date}
            onChange={(e) => update("application_date", e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass}>Source</label>
          <select
            className={inputClass}
            value={form.source}
            onChange={(e) => update("source", e.target.value as ApplicationInput["source"])}
          >
            {SOURCE_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {SOURCE_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Current stage</label>
          <select
            className={inputClass}
            value={form.current_stage}
            onChange={(e) => update("current_stage", e.target.value as ApplicationInput["current_stage"])}
          >
            {STAGE_ORDER.map((s) => (
              <option key={s} value={s}>
                {STAGE_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Job posting URL</label>
          <input
            className={inputClass}
            value={form.job_post_url ?? ""}
            onChange={(e) => update("job_post_url", e.target.value)}
            placeholder="https://..."
          />
        </div>
        <div>
          <label className={labelClass}>Next action</label>
          <input
            className={inputClass}
            value={form.next_action ?? ""}
            onChange={(e) => update("next_action", e.target.value)}
            placeholder="Follow up if no response by..."
          />
        </div>
        <div>
          <label className={labelClass}>Next action date</label>
          <input
            type="date"
            className={inputClass}
            value={form.next_action_date ?? ""}
            onChange={(e) => update("next_action_date", e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass}>Resume version used</label>
          <input
            className={inputClass}
            value={form.resume_version_used ?? ""}
            onChange={(e) => update("resume_version_used", e.target.value)}
            placeholder="resume_v3_ds.pdf"
          />
        </div>
        <div>
          <label className={labelClass}>Cover letter used</label>
          <input
            className={inputClass}
            value={form.cover_letter_used ?? ""}
            onChange={(e) => update("cover_letter_used", e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass}>Contact name</label>
          <input
            className={inputClass}
            value={form.contact_name ?? ""}
            onChange={(e) => update("contact_name", e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass}>Contact email</label>
          <input
            className={inputClass}
            value={form.contact_email ?? ""}
            onChange={(e) => update("contact_email", e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>
          Job description
          <span className="ml-1 font-normal text-neutral-400">
            (saved permanently — postings disappear once a role closes)
          </span>
        </label>
        <textarea
          className={`${inputClass} min-h-[220px] font-mono text-xs leading-relaxed`}
          value={form.job_description ?? ""}
          onChange={(e) => update("job_description", e.target.value)}
          placeholder="Paste the full job description here..."
        />
      </div>

      {error && <p className="text-sm text-rose-600">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          {saving ? "Saving..." : isEdit ? "Save changes" : "Add application"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm text-neutral-500 hover:text-neutral-700"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
