// A little original sticker buddy that sits on the encouragement card.
// Colors come from the theme so it matches blush, coffee, midnight, etc.
export default function Buddy({ mood = "happy" }: { mood?: "happy" | "comfort" }) {
  return (
    <svg
      viewBox="0 0 72 72"
      width="64"
      height="64"
      aria-hidden="true"
      className="buddy pointer-events-auto drop-shadow-[0_1px_1px_rgba(0,0,0,0.08)]"
    >
      {/* sticker outline */}
      <g stroke="var(--color-white)" strokeWidth="6" strokeLinejoin="round" fill="var(--color-white)">
        <path d="M36 6c3 4 3 8 0 11" />
        <ellipse cx="36" cy="42" rx="24" ry="21" />
      </g>
      {/* sprout */}
      <path d="M36 17c0-4 0-7 0-10" stroke="#5f9a63" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      <path d="M36 10c-6-5-12-3-12 1 5 2 9 1 12-1z" fill="#7fb77e" />
      <path d="M36 9c5-6 12-5 12-1-5 3-9 3-12 1z" fill="#93c792" />
      {/* body */}
      <ellipse cx="36" cy="42" rx="24" ry="21" fill="var(--color-white)" stroke="var(--color-indigo-200)" strokeWidth="1.5" />
      {/* cheeks */}
      <ellipse cx="22.5" cy="45" rx="4.2" ry="2.6" fill="var(--color-indigo-200)" opacity="0.9" />
      <ellipse cx="49.5" cy="45" rx="4.2" ry="2.6" fill="var(--color-indigo-200)" opacity="0.9" />
      {/* eyes */}
      {mood === "comfort" ? (
        <g stroke="var(--color-neutral-900)" strokeWidth="1.8" strokeLinecap="round" fill="none">
          <path d="M26 39.5c1.6 1.4 3.4 1.4 5 0" />
          <path d="M41 39.5c1.6 1.4 3.4 1.4 5 0" />
        </g>
      ) : (
        <g fill="var(--color-neutral-900)">
          <ellipse cx="28.5" cy="39" rx="2.1" ry="2.5" />
          <ellipse cx="43.5" cy="39" rx="2.1" ry="2.5" />
          <circle cx="29.2" cy="38.1" r="0.7" fill="var(--color-white)" />
          <circle cx="44.2" cy="38.1" r="0.7" fill="var(--color-white)" />
        </g>
      )}
      {/* smile */}
      <path d="M33.5 45.5c1.5 1.4 3.5 1.4 5 0" stroke="var(--color-neutral-900)" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      {/* little heart it's holding */}
      <path
        d="M36 60.5c-4.2-2.6-6.5-4.9-6.5-7.4 0-1.8 1.4-3.1 3.1-3.1 1.4 0 2.6.8 3.4 2 .8-1.2 2-2 3.4-2 1.7 0 3.1 1.3 3.1 3.1 0 2.5-2.3 4.8-6.5 7.4z"
        fill="var(--color-indigo-500)"
        stroke="var(--color-white)"
        strokeWidth="1.5"
      />
    </svg>
  );
}
