"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import type { DashboardStats, RecentMoment } from "@/lib/stats";
import { STAGE_LABELS } from "@/lib/types";
import { useProfile } from "@/lib/use-profile";
import { pickEncouragement, type Encouragement } from "@/lib/encouragement";

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

function titleFor(m: RecentMoment) {
  if (m.kind === "rejected") return `${m.company} said no this time. That’s not the end of your story.`;
  if (m.kind === "offer") return `An offer from ${m.company}!`;
  return `You moved forward with ${m.company} (${STAGE_LABELS[m.stage]}). Keep going!`;
}

interface Slide {
  key: string;
  title: string;
  tone: "comfort" | "celebrate" | "daily";
  line: Encouragement;
}

export default function DashboardHeader({ stats }: { stats: DashboardStats | null }) {
  const hour = useHour();
  const profile = useProfile();
  const name = profile?.firstName;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const slides: Slide[] = [];
  if (profile && profile.encouragement !== "off") {
    const moments = stats?.recentMoments ?? [];
    moments.forEach((m, i) => {
      const line = pickEncouragement(profile.encouragement, m.kind, `${today}:${m.company}`, i);
      if (line) {
        slides.push({
          key: `${m.company}-${m.kind}`,
          title: titleFor(m),
          tone: m.kind === "rejected" ? "comfort" : m.kind === "offer" ? "celebrate" : "daily",
          line,
        });
      }
    });
    if (!slides.length) {
      const line = pickEncouragement(profile.encouragement, "daily", today);
      if (line) {
        slides.push({
          key: "daily",
          title: profile.encouragement === "scripture" ? "Verse of the Day" : "A Little Encouragement",
          tone: "daily",
          line,
        });
      }
    }
  }
  const count = slides.length;

  // Several things happened recently (say, a phone screen and a rejection):
  // rotate through each, with its own verse. Pauses while hovered.
  useEffect(() => {
    if (count < 2 || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % count), 9000);
    return () => clearInterval(id);
  }, [count, paused]);

  const slide = count ? slides[index % count] : null;

  return (
    <div>
      <h1 className="text-3xl font-semibold text-neutral-900 sm:text-4xl">
        {greetingFor(hour)}
        {name ? `, ${name}` : ""}
      </h1>
      <p className="mt-1.5 text-sm text-neutral-500">
        {stats
          ? stats.total === 0
            ? "Add your first application, or sync Gmail to find them for you."
            : `${stats.open} open application${stats.open === 1 ? "" : "s"}${
                stats.staleCount ? `, ${stats.staleCount} waiting on a follow-up` : ""
              }.`
          : " "}
      </p>

      {slide && (
        <figure
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          aria-live="polite"
          className={`mt-5 max-w-2xl rounded-2xl border px-5 py-4 ${
            slide.tone === "comfort"
              ? "border-indigo-100 bg-indigo-50"
              : slide.tone === "celebrate"
                ? "border-transparent bg-[var(--tile-3)]"
                : "border-neutral-200/80 bg-white"
          }`}
        >
          <figcaption className="flex items-start justify-between gap-3 text-sm font-semibold text-neutral-900">
            <span>{slide.title}</span>
            {count > 1 && (
              <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-neutral-500">
                <button
                  onClick={() => setIndex((i) => (i - 1 + count) % count)}
                  className="rounded-full px-1.5 hover:bg-neutral-900/5"
                  aria-label="Previous"
                >
                  ‹
                </button>
                <span className="tabular-nums">
                  {(index % count) + 1} of {count}
                </span>
                <button
                  onClick={() => setIndex((i) => (i + 1) % count)}
                  className="rounded-full px-1.5 hover:bg-neutral-900/5"
                  aria-label="Next"
                >
                  ›
                </button>
              </span>
            )}
          </figcaption>
          <blockquote className="mt-1.5 text-[15px] leading-relaxed text-neutral-700">{slide.line.text}</blockquote>
          {slide.line.reference && <p className="mt-1.5 text-xs text-neutral-500">{slide.line.reference} (WEB)</p>}
        </figure>
      )}
    </div>
  );
}
