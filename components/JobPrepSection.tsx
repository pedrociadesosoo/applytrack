"use client";

import { useEffect, useState } from "react";
import type { ApplicationStage } from "@/lib/types";
import { buildPrep, PREP_STAGES } from "@/lib/prep";
import JDReadingView from "./JDReadingView";

interface Props {
  applicationId: string;
  company: string;
  role: string;
  stage: ApplicationStage;
  initialDescription: string | null;
  initialUrl: string | null;
}

export default function JobPrepSection({ applicationId, company, role, stage, initialDescription, initialUrl }: Props) {
  const [description, setDescription] = useState(initialDescription);
  const [url, setUrl] = useState(initialUrl);
  const prep = buildPrep({ stage, company, role, jobDescription: description });

  return (
    <>
      {prep && <PrepGuideView prep={prep} hasDescription={!!description} />}
      <section>
        <h2 className="text-sm font-semibold text-neutral-900">Job Description</h2>
        <div className="mt-3 rounded-2xl border border-neutral-200/70 bg-white p-5">
          {description ? (
            <JDReadingView text={description} />
          ) : (
            <AddDescription
              applicationId={applicationId}
              wantsPrep={PREP_STAGES.includes(stage)}
              onSaved={(d, u) => {
                setDescription(d);
                if (u) setUrl(u);
              }}
            />
          )}
          {url && (
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-block text-xs font-medium text-indigo-600 hover:text-indigo-700"
            >
              Original Posting
            </a>
          )}
        </div>
      </section>
    </>
  );
}

function AddDescription({
  applicationId,
  wantsPrep,
  onSaved,
}: {
  applicationId: string;
  wantsPrep: boolean;
  onSaved: (description: string, url?: string) => void;
}) {
  const [mode, setMode] = useState<"link" | "paste">("link");
  const [link, setLink] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(payload: { url?: string; text?: string }) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/applications/${applicationId}/job-description`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Something went wrong. Try pasting the description instead.");
        if (data.error === "unsupported" || data.error === "not_found") setMode("paste");
        return;
      }
      onSaved(data.description, data.url);
    } catch {
      setError("Couldn't reach the server. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <p className="text-sm text-neutral-700">No job description saved yet.</p>
      <p className="mt-1 text-xs text-neutral-500">
        {wantsPrep
          ? "Add it and your prep guide will use the skills and responsibilities from this exact job."
          : "Save it now. Postings often disappear after a role closes."}
      </p>

      {mode === "link" ? (
        <form
          className="mt-4 flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            if (link.trim()) submit({ url: link.trim() });
          }}
        >
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="Paste the job link (Greenhouse, Lever, or Ashby)"
            className="min-w-0 flex-1 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-indigo-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={busy || !link.trim()}
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {busy ? "Looking..." : "Find It"}
          </button>
        </form>
      ) : (
        <form
          className="mt-4"
          onSubmit={(e) => {
            e.preventDefault();
            submit({ text });
          }}
        >
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            placeholder="Paste the full job description here"
            className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-indigo-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={busy || text.trim().length < 20}
            className="mt-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {busy ? "Saving..." : "Save Description"}
          </button>
        </form>
      )}

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      <button
        type="button"
        onClick={() => {
          setMode(mode === "link" ? "paste" : "link");
          setError(null);
        }}
        className="mt-3 text-xs font-medium text-indigo-600 hover:text-indigo-700"
      >
        {mode === "link" ? "Or paste the description instead" : "Or use a job link instead"}
      </button>
    </div>
  );
}

function PrepGuideView({ prep, hasDescription }: { prep: NonNullable<ReturnType<typeof buildPrep>>; hasDescription: boolean }) {
  const [done, setDone] = useState<Set<number>>(new Set());

  return (
    <section id="prep">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold text-neutral-900">{prep.title}</h2>
        <span className="text-xs text-neutral-500">
          {prep.personalized ? "Built from this job description" : "General prep. Add the job description to tailor it."}
        </span>
      </div>
      <div className="mt-3 space-y-6 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5">
        <p className="text-sm leading-relaxed text-neutral-700">{prep.intro}</p>

        {prep.skills.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-neutral-500">What They&apos;re Looking For</h3>
            <ul className="mt-2 space-y-2">
              {prep.skills.map((s) => (
                <li key={s.name} className="text-sm text-neutral-700">
                  <span className="mr-2 inline-block rounded-md bg-white px-2 py-0.5 text-xs font-semibold text-neutral-900 ring-1 ring-neutral-200">
                    {s.name}
                  </span>
                  {s.practice}
                </li>
              ))}
            </ul>
          </div>
        )}

        {prep.questions.length > 0 && (
          <div>
            <div className="flex items-baseline justify-between">
              <h3 className="text-xs font-semibold text-neutral-500">Practice Questions</h3>
              <span className="text-xs tabular-nums text-neutral-400">
                {done.size} of {prep.questions.length} practiced
              </span>
            </div>
            <ul className="mt-2 space-y-2">
              {prep.questions.map((q, i) => (
                <li key={i}>
                  <label className="flex cursor-pointer gap-3 rounded-xl bg-white px-3 py-2.5 ring-1 ring-neutral-200/70">
                    <input
                      type="checkbox"
                      checked={done.has(i)}
                      onChange={() => {
                        const next = new Set(done);
                        if (next.has(i)) next.delete(i);
                        else next.add(i);
                        setDone(next);
                      }}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-indigo-600)]"
                    />
                    <span>
                      <span className={`block text-sm ${done.has(i) ? "text-neutral-400 line-through" : "text-neutral-900"}`}>{q.q}</span>
                      {q.tip && <span className="mt-0.5 block text-xs text-neutral-500">{q.tip}</span>}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        )}

        {prep.showTimer && <PracticeTimer />}

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <h3 className="text-xs font-semibold text-neutral-500">Tips</h3>
            <ul className="mt-2 list-disc space-y-1.5 pl-4 text-sm text-neutral-700 marker:text-neutral-300">
              {prep.tips.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-semibold text-neutral-500">Questions to Ask Them</h3>
            <ul className="mt-2 list-disc space-y-1.5 pl-4 text-sm text-neutral-700 marker:text-neutral-300">
              {prep.ask.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
        </div>
        {!hasDescription && (
          <p className="text-xs text-neutral-500">Add the job description below and this guide will update with questions for this exact role.</p>
        )}
      </div>
    </section>
  );
}

function PracticeTimer() {
  const TOTAL = 90;
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    if (left === null || left <= 0) return;
    const id = setTimeout(() => setLeft(left - 1), 1000);
    return () => clearTimeout(id);
  }, [left]);

  const running = left !== null && left > 0;
  const finished = left === 0;
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl bg-white px-3 py-2.5 ring-1 ring-neutral-200/70">
      <span className="text-sm text-neutral-700">Practice an answer out loud:</span>
      <span className="text-lg font-semibold tabular-nums text-neutral-900">
        {Math.floor((left ?? TOTAL) / 60)}:{String((left ?? TOTAL) % 60).padStart(2, "0")}
      </span>
      <button
        type="button"
        onClick={() => setLeft(running ? null : TOTAL)}
        className="rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white"
      >
        {running ? "Stop" : finished ? "Try Again" : "Start 90 Seconds"}
      </button>
      {finished && <span className="text-xs text-neutral-500">Time. How did it feel?</span>}
    </div>
  );
}
