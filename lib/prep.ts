import type { ApplicationStage } from "@/lib/types";

// Builds an interview prep guide from the job description and the stage the
// application is at. No AI and no cost: it reads the posting for skills and
// responsibilities and turns them into practice questions. It works without
// a description too, it's just more general.

export const PREP_STAGES: ApplicationStage[] = [
  "oa",
  "hirevue",
  "phone_screen",
  "behavioral",
  "technical_interview",
  "onsite",
];

export interface PrepQuestion {
  q: string;
  tip?: string;
}

export interface PrepSkill {
  name: string;
  practice: string;
}

export interface PrepGuide {
  stage: ApplicationStage;
  title: string;
  intro: string;
  personalized: boolean;
  skills: PrepSkill[];
  questions: PrepQuestion[];
  tips: string[];
  ask: string[];
  showTimer: boolean;
}

const SKILLS: { name: string; re: RegExp; practice: string }[] = [
  { name: "SQL", re: /\bsql\b|postgres|mysql|bigquery|snowflake/i, practice: "Write a query that joins two tables and groups results, like weekly sign-ups by school." },
  { name: "Python", re: /\bpython\b|pandas|numpy/i, practice: "Clean a small messy dataset in pandas and explain each step out loud." },
  { name: "Excel", re: /\bexcel\b|spreadsheet|vlookup|pivot/i, practice: "Build a pivot table and explain what it shows. Know VLOOKUP or XLOOKUP." },
  { name: "Data visualization", re: /tableau|power bi|looker|dashboard|visuali[sz]/i, practice: "Pick one chart you've made and explain why you chose that chart type." },
  { name: "Statistics", re: /statistic|regression|hypothesis|a\/b test|experiment/i, practice: "Explain an A/B test simply: what you'd measure and how you'd know it worked." },
  { name: "Machine learning", re: /machine learning|\bml\b|model(s|ing)?\b|scikit|tensorflow|pytorch/i, practice: "Walk through one model you've built: the data, the choice of model, and how you measured it." },
  { name: "Java", re: /\bjava\b(?!script)/i, practice: "Explain classes vs. interfaces and solve one array or string problem in Java." },
  { name: "JavaScript / React", re: /javascript|typescript|react|node\.?js|front.?end/i, practice: "Explain how state works in React and walk through a component you built." },
  { name: "Data structures & algorithms", re: /data structures|algorithm|leetcode|coding challenge|problem.solving/i, practice: "Do two medium problems on arrays and hash maps. Say your approach before coding." },
  { name: "APIs", re: /\bapis?\b|\brest(ful)?\b|endpoint/i, practice: "Explain what an API is to a non-technical person, then describe one you've used." },
  { name: "Cloud", re: /\baws\b|azure|gcp|google cloud|cloud/i, practice: "Know the basics of one cloud service you've used and why you used it." },
  { name: "Git", re: /\bgit\b|github|version control/i, practice: "Explain branches, pull requests and how you resolve a merge conflict." },
  { name: "Product thinking", re: /product spec|roadmap|prioriti[sz]|user research|user interview|product sense|feature/i, practice: "Pick an app you use daily: who is it for, what's one problem, and what would you build?" },
  { name: "Agile", re: /agile|scrum|sprint|jira/i, practice: "Describe how a sprint works and your role in one." },
  { name: "Communication", re: /communicat|present|stakeholder|cross.functional|collaborat/i, practice: "Practice explaining one of your projects in 60 seconds to someone outside tech." },
  { name: "Finance basics", re: /financ|accounting|banking|credit|payments|fintech|valuation/i, practice: "Be ready to explain a recent fintech or banking trend and why it matters to this company." },
  { name: "Healthcare context", re: /health|patient|clinical|hipaa|medical/i, practice: "Know why privacy matters with health data and one way data can improve patient care." },
];

const ACTION_VERBS = new Set(
  "write run track build analyze analyse work partner collaborate design develop support lead manage create conduct help own define drive present communicate research test maintain implement identify prepare assist coordinate monitor improve ship deliver use gather translate evaluate perform draft automate clean model forecast report document organize plan launch measure".split(" ")
);

function bulletLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => /^([-•*▪◦]|\d+[.)])\s+/.test(l))
    .map((l) => l.replace(/^([-•*▪◦]|\d+[.)])\s+/, "").replace(/[.;]\s*$/, "").trim())
    .filter((l) => l.length > 8 && l.length < 160);
}

function toBehavioral(line: string): string | null {
  const words = line.split(/\s+/);
  let verb = words[0].toLowerCase().replace(/[^a-z]/g, "");
  if (!ACTION_VERBS.has(verb) && verb.endsWith("s") && ACTION_VERBS.has(verb.slice(0, -1))) verb = verb.slice(0, -1);
  if (!ACTION_VERBS.has(verb)) return null;
  // "Builds and evaluates models" -> "build and evaluate models"
  const rest = words
    .slice(1)
    .join(" ")
    .replace(/\b(and|or) (\w+)s\b/gi, (m, joiner: string, base: string) =>
      ACTION_VERBS.has(base.toLowerCase()) ? `${joiner} ${base}` : m
    );
  return `Tell me about a time you had to ${verb} ${rest}.`.replace(/\s+\./, ".");
}

function roleType(title: string): "product" | "data" | "software" | "business" | "general" {
  const t = title.toLowerCase();
  if (/product|\bpm\b|\bapm\b/.test(t)) return "product";
  if (/data|analytics|machine learning|\bml\b|quant/.test(t)) return "data";
  if (/software|engineer|developer|swe/.test(t)) return "software";
  if (/analyst|business|operations|consult|finance|fintech/.test(t)) return "business";
  return "general";
}

const ROLE_QUESTION: Record<ReturnType<typeof roleType>, PrepQuestion> = {
  product: { q: "How would you improve a product you use every day?", tip: "Pick a real user, one real problem, one fix, and how you'd measure it." },
  data: { q: "Walk me through how you'd handle a messy dataset.", tip: "Missing values, duplicates, outliers. Then how you'd check your result." },
  software: { q: "Walk me through a project you're proud of. What was the hardest bug?", tip: "Explain what you built, one decision you made, and what you'd do differently." },
  business: { q: "Tell me about a time you used data to make a recommendation.", tip: "Say what the data showed, what you recommended, and what happened." },
  general: { q: "What's a project you're proud of, and what was your part in it?", tip: "Be specific about what you did, not just the team." },
};

export function buildPrep(opts: {
  stage: ApplicationStage;
  company: string;
  role: string;
  jobDescription: string | null;
}): PrepGuide | null {
  const { stage, company, role } = opts;
  if (!PREP_STAGES.includes(stage)) return null;
  const jd = opts.jobDescription?.trim() || "";
  const personalized = jd.length > 40;

  const skills = personalized ? SKILLS.filter((s) => s.re.test(jd)).slice(0, 6).map(({ name, practice }) => ({ name, practice })) : [];
  const fromJd = personalized
    ? bulletLines(jd).map(toBehavioral).filter((q): q is string => !!q).slice(0, 4).map((q) => ({ q, tip: "Use STAR: the Situation, your Task, the Action you took, and the Result." }))
    : [];
  const type = roleType(role);
  const why: PrepQuestion[] = [
    { q: `Why ${company}?`, tip: personalized ? "Connect one thing from the job description to something you care about." : "Mention one specific thing about the company, not just its size." },
    { q: "Why this role?", tip: "Tie it to what you've done and what you want to learn next." },
  ];
  const common: PrepQuestion[] = [
    { q: "Tell me about yourself.", tip: "60 seconds: where you are now, one or two experiences that fit this role, and why you're here." },
  ];

  const ask: string[] = [
    "What does a great first month look like for an intern on this team?",
    "What's a project a past intern worked on that you were excited about?",
  ];
  if (skills.some((s) => ["SQL", "Python", "Data visualization", "Statistics"].includes(s.name))) {
    ask.push("What data tools does the team use day to day?");
  }
  if (/engineer|designer|cross.functional/i.test(jd)) ask.push("How does this team work with engineers and designers?");
  ask.push("What are the next steps after this interview?");

  let title = "";
  let intro = "";
  let questions: PrepQuestion[] = [];
  let tips: string[] = [];
  let showTimer = false;

  switch (stage) {
    case "oa":
      title = "Online Assessment Prep";
      intro = "Online assessments are usually timed coding, math, or logic questions on a site like HackerRank or CodeSignal.";
      questions = [];
      tips = [
        "Check the deadline in the invite email and block off a quiet hour.",
        "Do a few timed practice problems first so the format isn't new.",
        "Read every question before starting, and do the easiest one first.",
        "Test edge cases: empty input, one item, very large numbers.",
      ];
      break;
    case "hirevue":
      title = "Video Interview Prep";
      intro = "You'll record answers to questions on screen, usually with about 30 seconds to think and 1 to 3 minutes to answer.";
      questions = [...common, ...why, ...fromJd.slice(0, 2), ROLE_QUESTION[type]];
      tips = [
        "Look at the camera, not your own face on screen.",
        "Use the thinking time to pick one story and outline it in STAR.",
        "Aim for about 90 seconds per answer.",
        "Find good lighting and a plain background, and test your mic.",
        "Practice one answer with the practice timer, then try recording it on your phone.",
      ];
      showTimer = true;
      break;
    case "phone_screen":
      title = "Phone Screen Prep";
      intro = "This is usually a 20 to 30 minute call with a recruiter to check your interest, background, and availability.";
      questions = [...common, ...why, { q: "What are you looking for in an internship?" }, { q: "When are you available to start, and are you open to relocating?", tip: "Know your dates and your answer before the call." }, ...fromJd.slice(0, 1)];
      tips = [
        "Have your resume and this job description open during the call.",
        "Write down the recruiter's name so you can thank them after.",
        "Smile while you talk. It really does come through on the phone.",
      ];
      break;
    case "behavioral":
      title = "Behavioral Interview Prep";
      intro = "They'll ask about real situations you've been in. Answer each one with a specific story.";
      questions = [
        ...fromJd,
        { q: "Tell me about a time you disagreed with a teammate.", tip: "Show you listened, found common ground, and kept the work moving." },
        { q: "Tell me about a time you failed or made a mistake.", tip: "Own it, say what you learned, and what you do differently now." },
        { q: "Tell me about a time you led something without being the leader." },
        ...why.slice(0, 1),
      ];
      tips = [
        "Prepare 4 to 5 stories you can reuse: a challenge, a failure, a team project, leadership, and something you're proud of.",
        "Use STAR for every answer and spend the most time on the Action.",
        "End each story with a result, a number if you have one.",
      ];
      break;
    case "technical_interview":
      title = "Technical Interview Prep";
      intro = "Expect problems or questions on the skills in the job description. They care about how you think as much as the answer.";
      questions = [ROLE_QUESTION[type], { q: "Walk me through a technical project on your resume.", tip: "What it did, the tools you used, and one hard problem you solved." }, ...fromJd.slice(0, 1)];
      tips = [
        "Think out loud. Silence makes it hard for them to help you.",
        "Ask clarifying questions before you start solving.",
        "Start with a simple solution, then improve it.",
      ];
      break;
    case "onsite":
      title = "Final Round Prep";
      intro = "The final round is usually several interviews in a row: behavioral, technical, and a conversation with the team.";
      questions = [...common, ...why, ...fromJd.slice(0, 3), ROLE_QUESTION[type]];
      tips = [
        "Prepare a different question to ask each interviewer.",
        "Bring water and take a breath between interviews. Each one is a fresh start.",
        "Send a short thank-you email to each person within a day.",
      ];
      break;
  }

  return { stage, title, intro, personalized, skills, questions, tips, ask, showTimer };
}
