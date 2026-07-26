"use client";

interface Section {
  heading: string | null;
  body: string;
}

// Lightweight heuristic parser: looks for common JD section headers
// (Responsibilities, Qualifications, About the team, etc.) on their own
// line and splits the text into readable sections. Falls back to a single
// unsectioned block if nothing recognizable is found — intentionally not
// over-engineered per spec.
const SECTION_HEADER_PATTERN =
  /^(about( the)?( team| role| company| us)?|responsibilities|what you.?ll do|qualifications|requirements|preferred qualifications|minimum qualifications|nice to have|who you are|what we.?re looking for|benefits|perks|compensation)\s*:?$/i;

function parseJobDescription(text: string): Section[] {
  const lines = text.split(/\r?\n/);
  const sections: Section[] = [];
  let current: Section = { heading: null, body: "" };

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length > 0 && trimmed.length < 60 && SECTION_HEADER_PATTERN.test(trimmed)) {
      if (current.heading || current.body.trim()) sections.push(current);
      current = { heading: trimmed.replace(/:$/, ""), body: "" };
    } else {
      current.body += line + "\n";
    }
  }
  if (current.heading || current.body.trim()) sections.push(current);

  return sections.length > 0 ? sections : [{ heading: null, body: text }];
}

export default function JDReadingView({ text }: { text: string }) {
  const sections = parseJobDescription(text);

  return (
    <div className="max-w-none">
      {sections.map((section, i) => (
        <div key={i} className="mb-5">
          {section.heading && (
            <h3 className="mb-1.5 text-sm font-semibold uppercase tracking-wide text-neutral-500">
              {section.heading}
            </h3>
          )}
          <p className="whitespace-pre-wrap text-[0.925rem] leading-relaxed text-neutral-700">
            {section.body.trim()}
          </p>
        </div>
      ))}
    </div>
  );
}
