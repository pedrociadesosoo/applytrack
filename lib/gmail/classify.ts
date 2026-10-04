import type { ApplicationStage } from "@/lib/types";

// Rule-based classifier for application-related emails. Deliberately
// conservative: anything ambiguous comes back with confidence "low" and
// lands in the review queue instead of changing data on its own. A Claude
// classifier can later replace the low-confidence path without touching
// the rest of the sync.

export interface EmailForClassification {
  from: string; // raw From header, e.g. `"Stripe Recruiting" <no-reply@stripe.com>`
  subject: string;
  body: string; // plain text
}

export type SignalKind = "applied" | "stage" | "unrelated";

export interface Classification {
  kind: SignalKind;
  stage: ApplicationStage | null;
  company: string | null;
  role: string | null;
  confidence: "high" | "low";
  reason: string;
}

interface Rule {
  stage: ApplicationStage;
  kind: "applied" | "stage";
  label: string;
  patterns: RegExp[];
  alwaysLow?: boolean; // matched, but too vague to act on without review
}

const NOISE_SUBJECT = [
  /job alert/i,
  /jobs? (?:you may be|you might be) interested/i,
  /recommended (?:jobs|for you)/i,
  /new jobs? (?:for|matching|similar)/i,
  /\bnewsletter\b/i,
  /\bwebinar\b/i,
  /is hiring\b/i,
  /people (?:are )?viewing/i,
  /apply (?:now|today)\b/i,
];
const NOISE_FROM = [/jobalerts?-noreply@linkedin\.com/i, /noreply@glassdoor\.com/i, /alert@indeed\.com/i];

const OFFER: RegExp[] = [
  /pleased to (?:extend|offer you)/i,
  /offer of employment/i,
  /(?:extend|extending) (?:to you |you )?an? (?:formal |internship |job )?offer/i,
  /your offer letter/i,
  /congratulations[^.]{0,80}\boffer\b/i,
];

const REJECTED: RegExp[] = [
  /not (?:be )?moving forward with (?:your|you)/i,
  /(?:decided|chosen|elected) to (?:move forward|proceed|continue|pursue) with (?:other|another) (?:candidates?|applicants?)/i,
  /(?:decided|chosen) (?:not to|to not) (?:move forward|proceed|advance)/i,
  /will not be (?:moving forward|proceeding|advancing)/i,
  /(?:won't|will not) be (?:able to )?(?:move|moving) forward/i,
  /no longer (?:being )?considered/i,
  /position has (?:been filled|closed)/i,
  /regret to inform/i,
  /not (?:been )?selected (?:to move forward|for (?:this|the|an?) )/i,
  /unable to (?:move forward|offer you)/i,
  /pursue (?:other|another) candidates?/i,
  /other candidates whose (?:qualifications|experience|background)/i,
];

// Order matters: first matching rule wins.
const HIREVUE: RegExp[] = [
  /\bhire ?vue\b/i,
  /video interview/i,
  /(?:pre-?recorded|recorded|one-way|on-demand|asynchronous) (?:video )?interview/i,
  /\bmodern ?hire\b/i,
  /\bspark ?hire\b/i,
];

const STAGE_RULES: Rule[] = [
  {
    // One-way recorded video interviews. Invites, reminders, and
    // "you've completed it" emails all map here; the forward-only rule
    // turns the repeats into no-ops.
    stage: "hirevue",
    kind: "stage",
    label: "HireVue / video interview",
    patterns: HIREVUE,
  },
  {
    stage: "oa",
    kind: "stage",
    label: "assessment invite",
    patterns: [
      /online assessment/i,
      /coding (?:assessment|challenge|test)/i,
      /technical assessment/i,
      /take[- ]home (?:assessment|assignment|challenge|project)/i,
      /\bhackerrank\b/i,
      /\bcodesignal\b/i,
      /\bcodility\b/i,
      /assessment invitation/i,
      /(?:please|invited to|invitation to) complete (?:the|your|an?|our) (?:[\w-]+ ){0,2}assessment/i,
    ],
  },
  {
    stage: "onsite",
    kind: "stage",
    label: "onsite / final round",
    patterns: [/super ?day/i, /on-?site interview/i, /\bonsite\b/i, /final (?:round|interview)/i, /panel interview/i],
  },
  {
    stage: "technical_interview",
    kind: "stage",
    label: "technical interview",
    patterns: [/technical interview/i, /coding interview/i, /technical (?:round|screen)/i],
  },
  { stage: "behavioral", kind: "stage", label: "behavioral interview", patterns: [/behavioral interview/i] },
  {
    stage: "phone_screen",
    kind: "stage",
    label: "phone screen",
    patterns: [
      /phone (?:screen|interview)/i,
      /recruiter (?:call|screen|chat|conversation)/i,
      /(?:initial|introductory|intro) (?:call|chat|conversation|interview|phone)/i,
    ],
  },
  {
    stage: "phone_screen",
    kind: "stage",
    label: "interview invite (round unclear)",
    alwaysLow: true,
    patterns: [
      /schedule (?:an?|your|a time for (?:an?|your)) (?:[\w-]+ )?interview/i,
      /invit(?:e|ing) you to (?:an? |our )?(?:[\w-]+ )?interview/i,
      /interview (?:invitation|request)/i,
      /(?:move|moving) (?:you )?(?:forward )?to the next (?:round|step|stage)/i,
      /next steps? in (?:the|our) (?:interview|hiring|recruiting) process/i,
      /availability for an? (?:[\w-]+ )?interview/i,
    ],
  },
  {
    stage: "applied",
    kind: "applied",
    label: "application confirmation",
    patterns: [
      /thank(?:s| you) for (?:applying|your application|submitting your application)/i,
      /received your application/i,
      /application (?:has been |was )?(?:received|submitted)/i,
      /your application was sent to/i,
      /application confirmation/i,
      /thank(?:s| you) for your interest in (?:joining|working|the|our|a career)/i,
    ],
  },
];

// Senders that say nothing about which company the email is from.
const GENERIC_DOMAINS = [
  "greenhouse.io", "greenhouse-mail.io", "lever.co", "myworkday.com", "myworkdayjobs.com",
  "workday.com", "ashbyhq.com", "smartrecruiters.com", "icims.com", "jobvite.com", "taleo.net",
  "successfactors.com", "hackerrank.com", "hackerrankforwork.com", "codesignal.com", "hirevue.com",
  "codility.com", "linkedin.com", "indeed.com", "joinhandshake.com", "handshake.com", "gmail.com",
  "googlemail.com", "outlook.com", "hotmail.com", "yahoo.com", "icloud.com", "oraclecloud.com",
  "eightfold.ai", "avature.net", "paradox.ai", "gem.com", "rippling.com", "bamboohr.com",
  "workable.com", "breezy.hr", "recruitee.com", "teamtailor.com", "pinpointhq.com", "goodtime.io",
  "calendly.com", "modernhire.com", "karat.io", "dover.com", "jazzhr.com", "applytojob.com", "yello.co", "sparkhire.com",
];
const GENERIC_NAMES = /^(greenhouse|workday|lever|linkedin|ashby|indeed|handshake|hackerrank|codesignal|hirevue|icims|jobvite|smartrecruiters|taleo|careers?|recruiting|talent|jobs|hr|no-?reply|notifications?)$/i;

const ROLE_WORDS =
  /intern|engineer|analyst|developer|manager|associate|scientist|designer|product|data|software|research|program|consultant|co-?op|fellow|specialist|coordinator|representative|assistant|apprentice|technician|architect|strategist|operations/i;

export function classifyEmail(email: EmailForClassification): Classification {
  const subject = email.subject.trim();
  const body = email.body.slice(0, 6000);
  const text = `${subject}\n${body}`;
  const company = extractCompany(email);
  const role = extractRole(subject, body, company);
  const base = { company, role };

  if (NOISE_FROM.some((r) => r.test(email.from)) || NOISE_SUBJECT.some((r) => r.test(subject))) {
    return { ...base, kind: "unrelated", stage: null, confidence: "high", reason: "job alert / marketing" };
  }

  // Outcomes override everything: rejection emails often open with
  // "Thank you for applying", and their subjects can look like confirmations.
  if (REJECTED.some((r) => r.test(text))) {
    return { ...base, kind: "stage", stage: "rejected", confidence: company ? "high" : "low", reason: "rejection language" };
  }
  if (OFFER.some((r) => r.test(text))) {
    return { ...base, kind: "stage", stage: "offer", confidence: company ? "high" : "low", reason: "offer language" };
  }

  // Sent by a video-interview platform: that's the stage, whatever the wording.
  if (/(?:hirevue|modernhire|sparkhire)\.com/i.test(parseFrom(email.from).domain)) {
    return { ...base, kind: "stage", stage: "hirevue", confidence: company ? "high" : "low", reason: "HireVue / video interview (sender)" };
  }

  // The subject is the most reliable signal, so check it on its own first.
  const subjectRule = STAGE_RULES.find((rule) => rule.patterns.some((p) => p.test(subject)));
  if (subjectRule) {
    return {
      ...base,
      kind: subjectRule.kind,
      stage: subjectRule.stage,
      confidence: company && !subjectRule.alwaysLow ? "high" : "low",
      reason: `${subjectRule.label} (subject)`,
    };
  }

  // Body-only matches are fuzzier: confirmation emails often mention a
  // future assessment or interview, so a body that ALSO reads like a
  // confirmation is sent to review rather than trusted.
  const bodyRule = STAGE_RULES.find((rule) => rule.patterns.some((p) => p.test(body)));
  if (bodyRule) {
    const appliedRule = STAGE_RULES[STAGE_RULES.length - 1];
    const alsoConfirmation =
      bodyRule.kind === "stage" && appliedRule.patterns.some((p) => p.test(body));
    const conditional = /if (?:you are |you're )?selected|may be (?:asked|invited|contacted)|will (?:reach out|contact you|be in touch)/i.test(body);
    if (alsoConfirmation && (bodyRule.alwaysLow || conditional)) {
      return {
        ...base,
        kind: "applied",
        stage: "applied",
        confidence: company ? "high" : "low",
        reason: "application confirmation (body; later steps mentioned conditionally)",
      };
    }
    return {
      ...base,
      kind: bodyRule.kind,
      stage: bodyRule.stage,
      confidence: company && !bodyRule.alwaysLow && !alsoConfirmation ? "high" : "low",
      reason: `${bodyRule.label} (body${alsoConfirmation ? ", also reads like a confirmation" : ""})`,
    };
  }

  if (/\bunfortunately\b/i.test(body) && /application|candidacy|position|role/i.test(text)) {
    return { ...base, kind: "stage", stage: "rejected", confidence: "low", reason: "possible rejection" };
  }

  return { ...base, kind: "unrelated", stage: null, confidence: "high", reason: "no application signal" };
}

// ---------------------------------------------------------------------------
// Company / role extraction (best effort; the review queue lets you fix it)
// ---------------------------------------------------------------------------

export function parseFrom(from: string) {
  const m = from.match(/^\s*"?([^"<]*?)"?\s*<([^>]+)>/);
  const name = (m ? m[1] : "").trim();
  const address = (m ? m[2] : from).trim().toLowerCase();
  const [local = "", domain = ""] = address.split("@");
  return { name, address, local, domain };
}

function isGenericDomain(domain: string) {
  return GENERIC_DOMAINS.some((g) => domain === g || domain.endsWith(`.${g}`));
}

const SUBJECT_COMPANY: RegExp[] = [
  /your application was sent to (.+)$/i,
  /thank(?:s| you) for (?:applying|your application|your interest)(?: to| in| with| at)? (.+?)\s*(?:[!.|]|$| - | – )/i,
  /your application (?:to|with|at|for) (.+?)\s*(?:[!.|]|$| - | – )/i,
  /^(.+?)\s+(?:has\s+)?invit(?:es|ed) you\b/i,
  /^([^-–|:]{2,40}?)\s+[-–|:]\s+\S/,
  /^(?:application|interview|assessment|next steps|update)[^-–|:]*\s[-–|:]\s+(.+)$/i,
  / at ([A-Z][\w&.'’ ]{1,40}?)\s*(?:[!.,|]|$| - | – )/,
];

function cleanCompany(raw: string | undefined | null): string | null {
  if (!raw) return null;
  let s = raw.trim();
  const at = s.toLowerCase().lastIndexOf(" at ");
  if (at !== -1) s = s.slice(at + 4);
  s = s
    .replace(/^(?:the|joining|working (?:at|with))\s+/i, "")
    .replace(/[!.,:;|]+$/, "")
    .replace(/,?\s+(?:inc|llc|ltd|corp|corporation)\.?$/i, "")
    .trim();
  if (s.length < 2 || s.length > 40) return null;
  if (/\b(?:application|applying|position|role|your|thank|interview|assessment|confirmation|update|team|opportunit)/i.test(s)) {
    return null;
  }
  if (ROLE_WORDS.test(s) && s.split(/\s+/).length > 2) return null; // looks like a job title
  return s;
}

function titleCase(s: string) {
  return s.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// Abbreviations and squashed domain names -> how you'd write the company.
// Keeps "Bofa" (campuscareers.bofa.com) and "Bank of America" (HireVue) on
// one application.
const COMPANY_ALIASES: Record<string, string> = {
  bofa: "Bank of America", bankofamerica: "Bank of America", baml: "Bank of America",
  jpmc: "JPMorgan Chase", jpmorgan: "JPMorgan Chase", jpmorganchase: "JPMorgan Chase", chase: "JPMorgan Chase",
  gs: "Goldman Sachs", goldmansachs: "Goldman Sachs",
  ms: "Morgan Stanley", morganstanley: "Morgan Stanley",
  fticonsulting: "FTI Consulting", fti: "FTI Consulting",
  capitalone: "Capital One", wellsfargo: "Wells Fargo", wf: "Wells Fargo",
  amex: "American Express", americanexpress: "American Express", aexp: "American Express",
  pwc: "PwC", ey: "EY", kpmg: "KPMG", ibm: "IBM", citi: "Citi", citigroup: "Citi",
  bny: "BNY", bnymellon: "BNY", statestreet: "State Street", blackrock: "BlackRock",
  smbc: "SMBC", mufg: "MUFG", rbc: "RBC", td: "TD", bmo: "BMO", ubs: "UBS",
};

export function canonicalCompany(name: string): string {
  return COMPANY_ALIASES[name.toLowerCase().replace(/[^a-z0-9]/g, "")] ?? name;
}

export function extractCompany(email: EmailForClassification): string | null {
  const raw = extractCompanyRaw(email);
  return raw ? canonicalCompany(raw) : null;
}

function extractCompanyRaw(email: EmailForClassification): string | null {
  for (const pattern of SUBJECT_COMPANY) {
    const company = cleanCompany(email.subject.match(pattern)?.[1]);
    if (company) return company;
  }

  const { name, local, domain } = parseFrom(email.from);

  const companyDomain = domain && !isGenericDomain(domain);
  const domainLabel = companyDomain ? domain.split(".").slice(-2, -1)[0] ?? "" : "";

  // Display name, minus recruiting boilerplate ("Stripe University Recruiting").
  const fromName = name
    .replace(/\s+via\s+.+$/i, "")
    .replace(/^[A-Z][a-z]+(?: [A-Z][a-z]+)? from\s+/, "")
    .replace(/\b(?:university|campus|early careers?|global|programs?|recruiting|recruitment|careers?|talent(?: acquisition)?|hiring(?: team)?|jobs|hr|team|no-?reply|notifications?)\b/gi, "")
    .replace(/[@|·•-]+\s*$/, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  const nameCompany = fromName && !GENERIC_NAMES.test(fromName) ? cleanCompany(fromName) : null;

  if (nameCompany && nameCompany.split(/\s+/).length <= 4) {
    // On a company's own domain, only trust the display name if it agrees
    // with the domain — otherwise it's probably a recruiter's personal name.
    const squashed = nameCompany.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!companyDomain || squashed.includes(domainLabel) || domainLabel.includes(squashed)) {
      return nameCompany;
    }
  }

  // Workday sends from <company>@myworkday.com.
  if (/myworkday(?:jobs)?\.com$/.test(domain) && local && !/^(?:no-?reply|donotreply)$/.test(local)) {
    return titleCase(local);
  }

  // Company's own domain: careers.stripe.com -> Stripe.
  if (domain && !isGenericDomain(domain)) {
    const parts = domain.split(".");
    const label = parts.length >= 2 ? parts[parts.length - 2] : parts[0];
    if (label && label.length > 1) return titleCase(label);
  }

  return null;
}

const ROLE_PATTERNS: RegExp[] = [
  /for the (?:position of )?(.{3,80}?) (?:position|role|opening|internship|job)\b/i,
  /(?:position|role) of (.{3,80}?)(?:[.,!\n]| at )/i,
  /application (?:for|to) (?:the |our )?(.{3,80}?)(?: position| role)?(?: at |[.,!\n(]| - | – |$)/i,
  /applying for (?:the |our )?(.{3,80}?)(?: position| role)?(?: at |[.,!\n(]| - | – )/i,
  /^(.{3,80}?)\s+(?:[-–|])\s+/,
];

export function extractRole(subject: string, body: string, company: string | null): string | null {
  for (const source of [subject, body.slice(0, 2000)]) {
    for (const pattern of ROLE_PATTERNS) {
      const raw = source.match(pattern)?.[1]?.trim().replace(/^(?:a|an|the)\s+/i, "");
      if (!raw || !ROLE_WORDS.test(raw)) continue;
      if (/\b(?:your|application|thank)\b/i.test(raw)) continue;
      if (company && raw.toLowerCase() === company.toLowerCase()) continue;
      return raw.replace(/\s+/g, " ");
    }
  }
  return null;
}
