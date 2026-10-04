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
- **The event log is the source of truth, enforced in the database.** Every stage change is a row in `application_events`, and Postgres triggers keep `current_stage` in sync in both directions: a manual edit or kanban drag logs an event, and inserting an event (which is how Gmail sync writes, with `source_email_id` attached) moves the application. Each change is one atomic write, and events that arrive out of order (e.g. a backfill of old emails) never move an application backwards.
- **Funnel stats use the full history, not the current stage.** An application rejected after an onsite still counts as an interview. The `application_progress` view computes "ever got a response" / "ever reached an interview" per application, and stats always cover the whole search rather than whatever the search box matches.

---

## Feature set

| Area | What it does |
|---|---|
| **Application CRUD** | Add/edit/delete applications with company, role, source, stage, next action, resume/cover-letter version, and recruiter contact. |
| **JD archive** | Full job description saved permanently per application; auto-parsed into sections (Responsibilities / Qualifications / About) when the source text has detectable headers; full-text searchable across every saved posting; quick-view slide-over from the dashboard card. |
| **Dashboard & stats** | Response rate, interview conversion rate, and a stale-application count computed live from the current data — the start of the analytics layer, not a static readme claim. |
| **Gmail auto-tracking** *(Phase 3)* | Read-only Gmail sync that makes manual entry the exception: "thanks for applying" confirmations create the application automatically, and later emails (OA invites, interview scheduling, rejections) move it through the pipeline. Claude-based classification, with low-confidence calls landing in a confirm/correct review queue. |
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

1. **Data model + CRUD** *(done)* — get the funnel representable end-to-end before automating anything.
2. **Dashboard views** *(done)* — cards, kanban (drag-and-drop, with a select fallback on mobile), table, and calendar on top of the same data; view and filters persist across reloads.
3. **Gmail auto-tracking** *(next)* — the highest-leverage feature, deliberately sequenced *after* the data model is proven so classification has a stable target to write into.
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

1. **Create a Supabase project** at [supabase.com](https://supabase.com), then in the SQL editor run `supabase/schema.sql`, followed by `supabase/migrations/002_event_driven_stages.sql`, to create the tables, triggers, indexes, and stats view. (Already ran `schema.sql` earlier? Just run `002` — it's safe to re-run.)
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

Phases 1–2 are complete: schema with an event-driven stage history, CRUD UI, JD archive with reading view and full-text search, history-based funnel stats, and four dashboard views. Phase 3 (Gmail auto-tracking, plus Google sign-in and per-user RLS) is next.
