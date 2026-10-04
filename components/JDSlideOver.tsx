"use client";

import { useEffect } from "react";
import Link from "next/link";
import type { Application } from "@/lib/types";
import { formatDate } from "@/lib/format";
import StageBadge from "@/components/StageBadge";
import JDReadingView from "@/components/JDReadingView";

export default function JDSlideOver({
  application,
  onClose,
}: {
  application: Application | null;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  if (!application) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-neutral-900/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative flex h-full w-full max-w-lg flex-col overflow-y-auto bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-neutral-100 px-6 py-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
              {application.company}
            </p>
            <h2 className="mt-0.5 text-lg font-semibold text-neutral-900">
              {application.role_title}
            </h2>
            <div className="mt-2 flex items-center gap-2">
              <StageBadge stage={application.current_stage} decision={application.offer_decision} />
              <span className="text-xs text-neutral-400">
                Applied {formatDate(application.application_date)}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 px-6 py-5">
          {application.job_description ? (
            <JDReadingView text={application.job_description} />
          ) : (
            <p className="text-sm text-neutral-400">No job description saved for this application.</p>
          )}
        </div>

        <div className="border-t border-neutral-100 px-6 py-4">
          <Link
            href={`/applications/${application.id}`}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            Open full record →
          </Link>
        </div>
      </div>
    </div>
  );
}
