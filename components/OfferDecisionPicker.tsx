"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { OfferDecision } from "@/lib/types";
import { OFFER_DECISION_LABELS } from "@/lib/types";

const STYLES: Record<OfferDecision, string> = {
  pending: "border-emerald-300 bg-emerald-50 text-emerald-800",
  accepted: "border-emerald-600 bg-emerald-600 text-white",
  declined: "border-neutral-400 bg-neutral-100 text-neutral-700",
};

// One-click "what did you do with this offer?" on the application page.
export default function OfferDecisionPicker({
  applicationId,
  initial,
}: {
  applicationId: string;
  initial: OfferDecision | null;
}) {
  const router = useRouter();
  const [value, setValue] = useState<OfferDecision>(initial ?? "pending");
  const [saving, setSaving] = useState(false);

  async function choose(next: OfferDecision) {
    if (next === value) return;
    const prev = value;
    setValue(next);
    setSaving(true);
    const res = await fetch(`/api/applications/${applicationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ offer_decision: next }),
    });
    setSaving(false);
    if (!res.ok) setValue(prev);
    else router.refresh();
  }

  return (
    <div className="flex gap-1.5">
      {(Object.keys(OFFER_DECISION_LABELS) as OfferDecision[]).map((d) => (
        <button
          key={d}
          disabled={saving}
          onClick={() => choose(d)}
          className={`flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition ${
            value === d ? STYLES[d] : "border-neutral-200 text-neutral-500 hover:bg-neutral-50"
          }`}
        >
          {d === "accepted" && value === d ? "✓ " : ""}
          {OFFER_DECISION_LABELS[d]}
        </button>
      ))}
    </div>
  );
}
