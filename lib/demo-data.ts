import type { Application, ApplicationEvent, ApplicationSource, ApplicationStage, EmailSignal, OfferDecision } from "@/lib/types";

// Sample data for demo mode. Every company is made up. Dates are relative
// to today so the demo always looks current.

type Step = [stage: ApplicationStage, daysAgo: number, note?: string];

interface Spec {
  company: string;
  role: string;
  source: ApplicationSource;
  steps: Step[];
  decision?: OfferDecision;
  contact?: string;
  jd?: string;
}

const SPECS: Spec[] = [
  {
    company: "Brightline Labs",
    role: "Product Management Intern, Summer 2027",
    source: "referral",
    steps: [["applied", 48], ["oa", 40, "Detected from email: \"Brightline Labs – Online Assessment\""], ["phone_screen", 30], ["onsite", 15, "Final round with the product team"], ["offer", 4, "Detected from email: \"Your offer from Brightline Labs\""]],
    decision: "pending",
    contact: "recruiting@brightlinelabs.example",
    jd: "About the role\nWork with engineers and designers to ship features used by thousands of students.\n\nResponsibilities\n- Write clear product specs\n- Run user interviews\n- Track metrics with SQL\n\nQualifications\n- Pursuing a degree in CS, IS, or a related field\n- Curious, organized, and a strong communicator",
  },
  {
    company: "Juniper Health",
    role: "Data Analyst Intern, Summer 2027",
    source: "company_site",
    steps: [["applied", 25], ["phone_screen", 1, "Detected from email: \"Juniper Health – Phone Screen Scheduling\""]],
    contact: "talent@juniperhealth.example",
  },
  {
    company: "Lumen Learning Co",
    role: "Associate PM Intern, Summer 2027",
    source: "linkedin",
    steps: [["applied", 30], ["oa", 26], ["technical_interview", 12]],
  },
  {
    company: "Cobalt Pay",
    role: "Software Engineering Intern, Summer 2027",
    source: "career_fair",
    steps: [["applied", 22], ["oa", 6, "Detected from email: \"Cobalt Pay invites you to complete a coding assessment\""]],
  },
  {
    company: "Harbor & Finch",
    role: "Business Analyst Intern, Summer 2027",
    source: "company_site",
    steps: [["applied", 40], ["hirevue", 8, "Detected from email: \"Harbor & Finch: Video Interview Invitation\""]],
  },
  {
    company: "Meridian Analytics",
    role: "Data Science Intern, Summer 2027",
    source: "referral",
    steps: [["applied", 35], ["oa", 30], ["behavioral", 9]],
    contact: "campus@meridiananalytics.example",
  },
  {
    company: "Riverstone Credit Union",
    role: "Fintech Analyst Intern, Summer 2027",
    source: "career_fair",
    steps: [["applied", 27], ["phone_screen", 19], ["technical_interview", 11]],
    contact: "careers@riverstonecu.example",
  },
  {
    company: "Northwind Bank",
    role: "Technology Analyst Intern, Summer 2027",
    source: "company_site",
    steps: [["applied", 45], ["hirevue", 38], ["rejected", 20, "Detected from email: \"Northwind Bank: Application Update\""]],
  },
  {
    company: "Pinecrest Capital",
    role: "Quant Analyst Intern, Summer 2027",
    source: "linkedin",
    steps: [["applied", 33], ["oa", 28], ["rejected", 14]],
  },
  {
    company: "Willow Health",
    role: "Health Data Intern, Summer 2027",
    source: "cold_apply",
    steps: [["applied", 21], ["rejected", 15]],
  },
  {
    company: "Tidewater Insurance",
    role: "Operations Analyst",
    source: "cold_apply",
    steps: [["applied", 72], ["ghosted", 12, "Auto-ghosted: no reply 60 days after applying"]],
  },
  {
    company: "Sparrow Health",
    role: "Product Intern, Summer 2027",
    source: "linkedin",
    steps: [["applied", 18]],
    contact: "recruiting@sparrowhealth.example",
  },
  {
    company: "Kestrel Robotics",
    role: "Software Engineer Intern, Summer 2027",
    source: "company_site",
    steps: [["applied", 16]],
  },
  { company: "Orchard Ed", role: "Program Manager Intern, Summer 2027", source: "referral", steps: [["applied", 12]] },
  { company: "Atlas Freight", role: "Data Engineering Intern, Summer 2027", source: "linkedin", steps: [["applied", 9]] },
  { company: "Nimbus Cloud", role: "Product Operations Intern, Summer 2027", source: "company_site", steps: [["applied", 6]] },
  { company: "Saffron Studio", role: "UX Research Intern, Summer 2027", source: "cold_apply", steps: [["applied", 4]] },
  { company: "Quill Learning", role: "Associate Product Manager", source: "linkedin", steps: [["applied", 3]] },
];

const DAY = 24 * 60 * 60 * 1000;

function at(daysAgo: number, now: number) {
  return new Date(now - daysAgo * DAY + 15 * 60 * 60 * 1000 - (now % DAY)).toISOString();
}

export function demoData(now = Date.now()) {
  const apps: Application[] = [];
  const events: ApplicationEvent[] = [];

  SPECS.forEach((spec, i) => {
    const id = `demo-${String(i + 1).padStart(2, "0")}`;
    const appEvents: ApplicationEvent[] = spec.steps.map(([stage, daysAgo, note], j) => ({
      id: `${id}-e${j}`,
      application_id: id,
      stage,
      event_date: at(daysAgo, now),
      source_email_id: null,
      notes: note ?? (j === 0 ? "Application created" : null),
      created_at: at(daysAgo, now),
    }));
    events.push(...appEvents);
    const last = spec.steps[spec.steps.length - 1];
    apps.push({
      id,
      user_id: null,
      company: spec.company,
      role_title: spec.role,
      application_date: at(spec.steps[0][1], now).slice(0, 10),
      source: spec.source,
      current_stage: last[0],
      next_action: null,
      next_action_date: null,
      job_description: spec.jd ?? null,
      job_post_url: null,
      resume_version_used: "Resume v3",
      cover_letter_used: null,
      contact_name: null,
      contact_email: spec.contact ?? null,
      confidence_rating: null,
      offer_decision: spec.decision ?? null,
      application_events: appEvents.map(({ stage, event_date, notes }) => ({ stage, event_date, notes })),
      created_at: at(spec.steps[0][1], now),
      updated_at: at(last[1], now),
    });
  });

  apps.sort((a, b) => b.updated_at.localeCompare(a.updated_at));

  const signals: EmailSignal[] = [
    {
      id: "demo-sig-1",
      gmail_message_id: "demo-msg-1",
      from_header: "Talent Team <talent@orchard-ed.example>",
      subject: "Next steps with Orchard Ed",
      snippet: "Hi! We'd love to learn more about you. Could you share your availability for an interview next week?",
      received_at: at(0, now),
      kind: "stage",
      suggested_stage: "phone_screen",
      company_guess: "Orchard Ed",
      role_guess: null,
      confidence: "low",
      reason: "interview invite (round unclear) (body)",
      status: "pending_review",
      application_id: null,
    },
    {
      id: "demo-sig-2",
      gmail_message_id: "demo-msg-2",
      from_header: "no-reply@greenhouse-mail.example",
      subject: "Thank you for applying!",
      snippet: "We've received your application and our team will review it shortly.",
      received_at: at(1, now),
      kind: "applied",
      suggested_stage: "applied",
      company_guess: null,
      role_guess: null,
      confidence: "low",
      reason: "application confirmation, but the company isn't clear",
      status: "pending_review",
      application_id: null,
    },
  ];

  return { apps, events, signals };
}
