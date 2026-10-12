// An original little teddy that peeks over the top edge of the
// encouragement card, paws resting on it. Fixed warm colors so it looks
// the same (soft, never dark) in every theme, including leopard.
const FUR = "#a8774f";
const FUR_EDGE = "#8a5d3b";
const LIGHT = "#ecd3b8";
const INK = "#3d2a22";
const BLUSH = "#f0a3b3";

export default function Buddy({ mood = "happy" }: { mood?: "happy" | "comfort" }) {
  return (
    <svg viewBox="0 0 96 72" width="96" height="72" aria-hidden="true" className="buddy">
      {/* ears */}
      <circle cx="27" cy="15" r="9.5" fill={FUR} stroke={FUR_EDGE} strokeWidth="1.2" />
      <circle cx="69" cy="15" r="9.5" fill={FUR} stroke={FUR_EDGE} strokeWidth="1.2" />
      <circle cx="27" cy="15.5" r="5" fill={LIGHT} />
      <circle cx="69" cy="15.5" r="5" fill={LIGHT} />
      {/* head */}
      <ellipse cx="48" cy="35" rx="25" ry="22" fill={FUR} stroke={FUR_EDGE} strokeWidth="1.2" />
      {/* eyes */}
      {mood === "comfort" ? (
        <g stroke={INK} strokeWidth="1.8" strokeLinecap="round" fill="none">
          <path d="M35.5 32c1.6 1.5 3.6 1.5 5.2 0" />
          <path d="M55.3 32c1.6 1.5 3.6 1.5 5.2 0" />
        </g>
      ) : (
        <g fill={INK}>
          <circle cx="38" cy="31.5" r="2.6" />
          <circle cx="58" cy="31.5" r="2.6" />
          <circle cx="38.9" cy="30.6" r="0.8" fill="#fff" />
          <circle cx="58.9" cy="30.6" r="0.8" fill="#fff" />
        </g>
      )}
      {/* cheeks */}
      <ellipse cx="31.5" cy="40" rx="4" ry="2.4" fill={BLUSH} opacity="0.75" />
      <ellipse cx="64.5" cy="40" rx="4" ry="2.4" fill={BLUSH} opacity="0.75" />
      {/* snout */}
      <ellipse cx="48" cy="41" rx="8.5" ry="6.2" fill={LIGHT} />
      <ellipse cx="48" cy="38.6" rx="2.9" ry="2.1" fill={INK} />
      <path d="M45 42.3c1 1.3 2.2 1.3 3 0 .8 1.3 2 1.3 3 0" stroke={INK} strokeWidth="1.3" strokeLinecap="round" fill="none" />
      {/* paws resting on the card edge */}
      <g fill={FUR} stroke={FUR_EDGE} strokeWidth="1.2">
        <ellipse cx="31" cy="63" rx="12.5" ry="7.5" />
        <ellipse cx="65" cy="63" rx="12.5" ry="7.5" />
      </g>
      <g stroke={FUR_EDGE} strokeWidth="1.1" strokeLinecap="round">
        <path d="M27 60.5v3.5M31 59.8v4M35 60.5v3.5" />
        <path d="M61 60.5v3.5M65 59.8v4M69 60.5v3.5" />
      </g>
    </svg>
  );
}
