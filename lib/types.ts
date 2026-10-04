export type ApplicationStage =
  | "applied"
  | "oa"
  | "hirevue"
  | "phone_screen"
  | "behavioral"
  | "technical_interview"
  | "onsite"
  | "offer"
  | "rejected"
  | "ghosted"
  | "withdrawn";

export type ApplicationSource =
  | "referral"
  | "cold_apply"
  | "career_fair"
  | "linkedin"
  | "company_site"
  | "recruiter_outreach"
  | "other";

export const STAGE_ORDER: ApplicationStage[] = [
  "applied",
  "oa",
  "hirevue",
  "phone_screen",
  "behavioral",
  "technical_interview",
  "onsite",
  "offer",
  "rejected",
  "ghosted",
  "withdrawn",
];

export const STAGE_LABELS: Record<ApplicationStage, string> = {
  applied: "Applied",
  oa: "OA",
  hirevue: "HireVue",
  phone_screen: "Phone Screen",
  behavioral: "Behavioral",
  technical_interview: "Technical Interview",
  onsite: "Onsite / Panel",
  offer: "Offer",
  rejected: "Rejected",
  ghosted: "Ghosted",
  withdrawn: "Withdrawn",
};

// Tailwind class fragments, kept centralized so stage color logic lives in one place.
export const STAGE_COLORS: Record<ApplicationStage, string> = {
  applied: "bg-slate-100 text-slate-700 border-slate-200",
  oa: "bg-amber-100 text-amber-800 border-amber-200",
  hirevue: "bg-teal-100 text-teal-800 border-teal-200",
  phone_screen: "bg-sky-100 text-sky-800 border-sky-200",
  behavioral: "bg-violet-100 text-violet-800 border-violet-200",
  technical_interview: "bg-indigo-100 text-indigo-800 border-indigo-200",
  onsite: "bg-purple-100 text-purple-800 border-purple-200",
  offer: "bg-emerald-100 text-emerald-800 border-emerald-200",
  rejected: "bg-rose-100 text-rose-700 border-rose-200",
  ghosted: "bg-neutral-200 text-neutral-600 border-neutral-300",
  withdrawn: "bg-neutral-100 text-neutral-500 border-neutral-200",
};

export const SOURCE_LABELS: Record<ApplicationSource, string> = {
  referral: "Referral",
  cold_apply: "Cold Apply",
  career_fair: "Career Fair",
  linkedin: "LinkedIn",
  company_site: "Company Site",
  recruiter_outreach: "Recruiter Outreach",
  other: "Other",
};

export type OfferDecision = "pending" | "accepted" | "declined";

export const OFFER_DECISION_LABELS: Record<OfferDecision, string> = {
  pending: "Deciding",
  accepted: "Accepted",
  declined: "Declined",
};

export interface Application {
  id: string;
  user_id: string | null;
  company: string;
  role_title: string;
  application_date: string; // date
  source: ApplicationSource;
  current_stage: ApplicationStage;
  next_action: string | null;
  next_action_date: string | null;
  job_description: string | null;
  job_post_url: string | null;
  resume_version_used: string | null;
  cover_letter_used: string | null;
  contact_name: string | null;
  contact_email: string | null;
  confidence_rating: number | null;
  offer_decision: OfferDecision | null; // only meaningful at the "offer" stage
  created_at: string;
  updated_at: string;
}

export interface ApplicationEvent {
  id: string;
  application_id: string;
  stage: ApplicationStage;
  event_date: string;
  source_email_id: string | null;
  notes: string | null;
  created_at: string;
}

export type ApplicationInput = Omit<
  Application,
  "id" | "user_id" | "created_at" | "updated_at"
>;


export interface EmailSignal {
  id: string;
  gmail_message_id: string;
  from_header: string | null;
  subject: string | null;
  snippet: string | null;
  received_at: string;
  kind: "applied" | "stage" | "unrelated";
  suggested_stage: ApplicationStage | null;
  company_guess: string | null;
  role_guess: string | null;
  confidence: "high" | "low";
  reason: string | null;
  status: string;
  application_id: string | null;
}
