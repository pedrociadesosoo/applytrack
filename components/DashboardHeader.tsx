"use client";

import { useSyncExternalStore } from "react";
import type { DashboardStats } from "@/lib/stats";
import { STAGE_LABELS } from "@/lib/types";
import { useProfile } from "@/lib/use-profile";
import { pickEncouragement, type MomentKind } from "@/lib/encouragement";

// Local hour on the viewer's device (null while server-rendering).
function useHour(): number | null {
  return useSyncExternalStore(
    (cb) => {
      const id = setInterval(cb, 60_000);
      return () => clearInterval(id);
    },
    () => new Date().getHours(),
    () => null
  );
}

function greetingFor(hour: number | null) {
  if (hour === null) return "Hello";
  if (hour < 5) return "Up late";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardHeader({ stats }: { stats: DashboardStats | null }) {
  const hour = useHour();
  const profile = useProfile();
  const name = profile?.firstName;

  const moment = stats?.recentMoment ?? null;
  const kind: MomentKind = moment?.kind ?? "daily";
  const today = new Date().toISOString().slice(0, 10);
  const line = profile ? pickEncouragement(profile.encouragement, kind, `${today}:${moment?.company ?? ""}`) : null;

  const momentTitle =
    moment?.kind === "rejected"
      ? `${moment.company} said no this time. That’s not the end of your story.`
      : moment?.kind === "offer"
        ? `An offer from ${moment.company}! 🎉`
        : moment?.kind === "progress"
          ? `You moved forward with ${moment.company} (${STAGE_LABELS[moment.stage]}). Keep going!`
          : profile?.encouragement === "scripture"
            ? "Verse of the day"
            : "A little encouragement";

  return (
    <div className="animate-[fadeUp_300ms_ease-out]">
      <h1 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
        {greetingFor(hour)}
        {name ? `, ${name}` : ""}
      </h1>
      <p className="mt-1.5 text-sm text-neutral-500">
        {stats
          ? stats.total === 0
            ? "Let’s get your first application in here."
            : `${stats.open} application${stats.open === 1 ? "" : "s"} in motion${
                stats.staleCount ? ` · ${stats.staleCount} could use a follow-up` : ""
              }. You’re doing great.`
          : " "}
      </p>

      {line && (
        <figure
          className={`mt-5 max-w-2xl rounded-3xl px-5 py-4 ${
            moment?.kind === "rejected" ? "bg-indigo-50" : moment?.kind === "offer" ? "bg-[var(--tile-3)]" : "bg-white"
          } shadow-sm`}
        >
          <figcaption className="text-xs font-semibold uppercase tracking-wide text-indigo-600">{momentTitle}</figcaption>
          <blockquote className="mt-1.5 text-[15px] leading-relaxed text-neutral-800">{line.text}</blockquote>
          {line.reference && <p className="mt-1.5 text-xs font-medium text-neutral-500">— {line.reference} (WEB)</p>}
        </figure>
      )}
    </div>
  );
}
