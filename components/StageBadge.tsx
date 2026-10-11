import { ApplicationStage, OFFER_DECISION_LABELS, STAGE_COLORS, STAGE_LABELS } from "@/lib/types";
import type { OfferDecision } from "@/lib/types";

// At the offer stage the badge also says what you decided.
const OFFER_DECISION_COLORS: Record<OfferDecision, string> = {
  pending: STAGE_COLORS.offer,
  accepted: "bg-emerald-600 text-white border-emerald-600",
  declined: "bg-neutral-100 text-neutral-600 border-neutral-300",
};

export function pillStyle(stage: ApplicationStage, decision?: OfferDecision | null) {
  return stage === "offer" ? OFFER_DECISION_COLORS[decision ?? "pending"] : STAGE_COLORS[stage];
}

export function pillLabel(stage: ApplicationStage, decision?: OfferDecision | null) {
  if (stage !== "offer") return STAGE_LABELS[stage];
  const d = decision ?? "pending";
  return `${d === "accepted" ? "✓ " : ""}Offer · ${OFFER_DECISION_LABELS[d]}`;
}

export default function StageBadge({
  stage,
  decision,
}: {
  stage: ApplicationStage;
  decision?: OfferDecision | null;
}) {
  const isOffer = stage === "offer";
  const d: OfferDecision = decision ?? "pending";
  const color = isOffer ? OFFER_DECISION_COLORS[d] : STAGE_COLORS[stage];
  const label = isOffer
    ? `${d === "accepted" ? "✓ " : ""}Offer · ${OFFER_DECISION_LABELS[d]}`
    : STAGE_LABELS[stage];

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${color}`}>
      {label}
    </span>
  );
}
