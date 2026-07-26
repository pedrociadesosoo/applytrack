# ApplyTrack

**A job-search analytics platform, not a spreadsheet.** ApplyTrack treats the job hunt like a funnel: every application is an event stream (`applied → OA → phone screen → interview → offer/reject/ghost`), and the product's job is to keep that funnel accurate with as little manual upkeep as possible — eventually by reading the signal that's already sitting in your inbox.

---

## The problem

Tracking applications in a spreadsheet breaks down fast once volume goes up: status goes stale the moment you forget to update a row, job postings vanish from the internet the day a role closes (so there's no record of what you actually applied to or what it asked for), and there's no way to answer questions like *"am I converting better on referrals or cold applications?"* or *"where in the pipeline do I actually stall out?"* without doing the analysis by hand.

**Target user:** a student or early-career candidate running a high-volume search (10s–100s of live applications at once) who wants pipeline visibility without manually re-entering the same status update they already got in an email.

**What "done" looks like:** open the dashboard, immediately see what needs attention today, and trust that the stage shown for each application reflects reality — because it was either entered once at apply-time or picked up automatically from Gmail, not hand-maintained.

---

## Product decisions worth calling out

A few choices that shaped the build, and the reasoning behind them:

- **Human-in-the-loop over full automation.** Email classification (Phase 3) will misfire sometimes — a rejection email that's actually a newsletter, a "your application was received" that's really an OA invite. Rather than auto-writing stage changes, flagged emails land in a review queue ("Claude thinks this means X — confirm or correct"). Slower than full automation, but it's the difference between a tool you trust and one you have to double-check.
- **The job description is the source of truth, archived at apply-time.** Postings disappear once a role closes or fills, which means the JD is often the *only* record of what a role actually asked for. It's saved permanently on the application record rather than linked out to, and it's full-text searchable (`search_vector` in the schema) so "every role that mentioned SQL" is a real query, not a manual scan.
- **Permissive RLS now, tightened later — documented, not hidden.** Phase 1 ships before auth does, so `supabase/schema.sql` has row-level security *enabled* but with an intentionally open policy, commented inline as temporary and scoped to flip to `auth.uid() = user_id` once Google OAuth lands in Phase 3. Technical debt that isn't written down is the kind that bites later.
- **Stage changes are logged automatically, not just stored.** Updating `current_stage` on an application fires a Postgres trigger that appends to `application_events` — so the stage-history timeline (and later, time-in-stage analytics) comes for free instead of depending on the UI remembering to write two rows instead of one.

---

## Feature set

| Area | What it does |
|---|---|
| **Application CRUD** | Add/edit/delete applications with company, role, source, stage, next action, resume/cover-letter version, and recruiter contact. |
| **JD archive** | Full job description saved permanently per application; auto-parsed into sections (Responsibilities / Qualifications / About) when the source text has detectable headers; full-text searchable across every saved posting; quick-view slide-over from the dashboard card. |
| **Dashboard & stats** | Response rate, interview conversion rate, and a stale-application count computed live from the current data — the start of the analytics layer, not a static readme claim. |
| **Gmail auto-tracking** *(Phase 3)* | Read-only Gmail sync + Claude-based classification of application-related emails into stage changes, with a confirm/correct review queue. |
| **AI follow-up assistant** *(Phase 4)* | Daily "what needs attention" panel, drafted (never auto-sent) follow-up emails, and a pre-interview prep brief generated from the saved JD. |
| **Creative extras** *(Phase 5)* | Stage-progression timeline visualization, auto-fetched company logos, a private 1–5 confidence rating per interview stage, shareable "companies I've interviewed with" page. |

---

## Architecture

```
Next.js (App Router, TS)
  ├─ app/                    UI routes (dashboard, application detail/new/edit)
  ├─ app/api/applications/   REST-style API routes (server-side Supabase client)
  ├─ lib/applications.ts     Data access layer — the only place that talks to Postgres
  ├─ lib/supabase/           Browser + server Supabase clients
  └─ components/             Presentational + form components

Supabase (Postgres)
  ├─ applications            One row per application; job_description archived here
  ├─ application_events      Append-only stage history, auto-populated via trigger
  └─ search_vector            Generated tsvector column, GIN-indexed for JD search
```

**Data model (Phase 1):**

```
applications (1) ───< application_events (many)
  id, company, role_title, application_date, source,
  current_stage, next_action[_date], job_description,
  job_post_url, resume_version_used, cover_letter_used,
  contact_name/email, confidence_rating, search_vector

application_events
  id, application_id (fk), stage, event_date,
  source_email_id (nullable — set by Phase 3 Gmail sync), notes
```

---

## Roadmap

Built in phases deliberately, each one shippable and demoable on its own before the next depends on it:

1. **Data model + CRUD** *(this repo, current state)* — get the funnel representable end-to-end before automating anything.
2. **Dashboard views** — kanban + calendar/timeline on top of the same data, no schema changes required.
3. **Gmail auto-tracking** — the highest-leverage feature, deliberately sequenced *after* the data model is proven so classification has a stable target to write into.
4. **AI follow-up assistant** — needs (2) and (3) in place to have both pipeline state and email signal to reason over.
5. **Creative extras** — nice-to-haves that don't block the core loop.

---

## Tech stack

- **Frontend:** Next.js 16 (App Router), TypeScript, Tailwind CSS 4
- **Backend:** Next.js API routes
- **Database:** Supabase (Postgres), full-text search via generated `tsvector` column
- **Planned:** Google OAuth + Gmail API (`gmail.readonly`), Claude API for email classification and the follow-up assistant

---

## Getting started

1. **Create a Supabase project** at [supabase.com](https://supabase.com), then in the SQL editor run `supabase/schema.sql` from this repo to create the tables, triggers, and indexes.
2. **Copy environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   Fill in `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` from Project Settings → API in your Supabase dashboard.
3. **Install and run:**
   ```bash
   npm install
   npm run dev
   ```
4. Open `http://localhost:3000` and add your first application.

Phase 3 (Gmail sync) will additionally require a Google Cloud project with the Gmail API enabled and an OAuth consent screen kept in "Testing" mode (no verification needed for personal use) — not required to run Phase 1.

---

## Status

Phase 1 is complete: schema, CRUD UI, JD archive with reading view and full-text search, and a live-computed stats strip. Phases 2–5 are scoped above and tracked as the next milestones.
