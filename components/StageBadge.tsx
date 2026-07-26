import { ApplicationStage, STAGE_COLORS, STAGE_LABELS } from "@/lib/types";

export default function StageBadge({ stage }: { stage: ApplicationStage }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STAGE_COLORS[stage]}`}
    >
      {STAGE_LABELS[stage]}
    </span>
  );
}
