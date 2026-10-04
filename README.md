# ApplyTrack

**A job application tracker that updates itself from your Gmail.**

I was applying to a lot of internships and my spreadsheet kept falling behind. I'd get an OA invite or a rejection email and forget to update the row. So I built ApplyTrack. It reads my job emails, adds new applications on its own, and moves each one through the stages (applied → OA → HireVue → interviews → offer or rejection). I just open the dashboard and see where everything stands.

---

## What it does

- **Gmail sync.** Click "Sync Gmail" and it scans your inbox for job emails. A "thanks for applying" email creates a new application. OA invites, HireVue invites, interview emails, offers, and rejections move the right application to the right stage.
- **Review queue.** If the app isn't sure about an email, it doesn't guess. It puts the email in a review list where you can fix the company, role, or stage and confirm it, or dismiss it.
- **Dashboard you can click into.**
  - **Response rate:** click it to see a breakdown of where every application stands (offer, in process, rejected, went quiet, no response) and how many ever got an OA, HireVue, interview, offer, or rejection.
  - **Needs follow-up:** applications with no news in 10+ days, longest wait first, with buttons to email the recruiter, set a reminder, or mark it ghosted.
  - **Where things stand:** your pipeline from Applied to Offer. Click a stage to only see those applications.
- **Auto-ghosting.** If a role says "Summer 2027" and it's June 1, 2027 with no outcome, it moves to Ghosted on its own. Roles without a season get ghosted after 60 days with no reply. Now I can actually see which companies ghost.
- **Job description archive.** You can save the full job posting with each application, since postings disappear once a role closes. It's searchable, so "SQL" shows every role that asked for SQL.
- **Four views:** cards, kanban (drag cards between stages), table, and calendar.
- **Search** that just shows company, role, and status.

---

## The PM side: decisions I made and why

**1. Ask instead of guess.**
Email is messy. A confirmation email might say "if selected, you'll get an online assessment," which isn't an OA invite. If the app guessed wrong it would quietly mess up my data, and then I wouldn't trust any of it. So clear emails get handled automatically and unclear ones go to the review queue. It's a little slower, but I trust what I see.

**2. Start free, add AI later.**
I could have used an AI model to read every email, but that costs money on every sync. I started with keyword and sender rules (free) and sent anything unclear to the review queue. AI can be added later for just the unclear emails, without changing the rest of the app.

**3. Applications only move forward.**
Companies send reminder emails. A "reminder: finish your OA" email shouldn't move me back to OA after I've already had a phone screen. So emails can only move an application forward. If an email would move one backwards, I decide.

**4. Use my own data to find what was missing.**
After my first real sync I checked what got sorted wrong. Video interviews (HireVue and similar) were getting labeled as OAs, phone screens, and even onsites. So I added **HireVue** as its own stage, and the next sync sorted all of them correctly. Same thing with company names: "Bofa" and "Bank of America" were showing up as two different companies, so I added a list of common short names.

**5. "Ghosted" should mean something.**
Most trackers make you decide when something is ghosted. I made it a rule based on the role's season, plus a 60-day rule for everything else, so ghosting is consistent and I can compare companies fairly. If you move something out of Ghosted yourself, the app respects that and doesn't ghost it again.

**6. Clear definitions for the numbers.**
- **Response rate** = applications where the company replied in any way (OA, HireVue, interview, offer, or rejection). A rejection still counts as a reply.
- **Interview conversion** = applications that reached a live interview (phone screen or later). OAs and HireVues don't count, since you're not talking to a person.
- **Needs follow-up** = open applications with no news in 10+ days and no reminder already set.

---

## The data side

**Every stage change is saved, not just the current stage.**
The main tables are `applications` (one row per application) and `application_events` (every stage change with a date). Database triggers keep them in sync. If you drag a card on the kanban, an event gets logged. If the Gmail sync adds an event, the application's stage updates. This history is what makes the stats honest. For example, an application that got rejected after an onsite still counts as reaching an interview.

**Emails get sorted with rules I tested.**
The email sorter (`lib/gmail/classify.ts`) checks for rejections and offers first, then looks at the subject line, then the body. It figures out the company from the subject, the sender name, or the sender's email domain. I tested it on 15 sample emails covering confirmations, OAs, interviews, offers, rejections, and job alerts, then tuned it on real emails from my own inbox.

**Old emails fill in history.**
The first sync goes back to August 1 and reads emails oldest first. Older emails get added to an application's history without changing its current stage, and each email is only ever counted once.

**Privacy.**
The app only gets read-only Gmail access. Each user can only see their own data. That's enforced in the database with row-level security, not just in the app.

---

## How it's built

```
Next.js app (TypeScript, Tailwind)
  ├─ app/                    pages: dashboard, review queue, application details
  ├─ app/api/                API routes: applications, stats, Gmail sync, review
  ├─ lib/gmail/              Gmail client, email sorter, sync logic
  ├─ lib/stats.ts            how the dashboard numbers are calculated
  ├─ lib/ghosting.ts         auto-ghost rules
  └─ components/             dashboard pieces (pipeline, charts, panels)

Supabase (Postgres)
  ├─ applications            one row per application
  ├─ application_events      every stage change, with dates
  ├─ email_signals           every email the sync looked at, and what it decided
  └─ google_credentials      Gmail access tokens (server-only)
```

**Tech stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, Supabase (Postgres + Auth), Google OAuth, Gmail API.

---

## Run your own copy

Want to use it for your own search? Here's how to set it up. It's free, and takes about 20 minutes.

**You'll need:** [Node.js](https://nodejs.org) (v20 or newer), a free [Supabase](https://supabase.com) account, and a Google account.

**1. Get the code**
```bash
git clone https://github.com/pedrociadesosoo/applytrack.git
cd applytrack
npm install
cp .env.example .env.local
```

**2. Set up the database**
Create a Supabase project. In its **SQL Editor**, run these files from the `supabase/` folder in this order:
1. `schema.sql`
2. `migrations/002_event_driven_stages.sql`
3. `migrations/003_per_user_access.sql`
4. `migrations/004_gmail_sync.sql`
5. `migrations/005_hirevue_stage.sql` (run this one by itself)
6. `migrations/006_progress_view_hirevue.sql`

Then copy your **Project URL**, **anon key**, and **service_role key** (Project Settings → API) into `.env.local`.

**3. Set up Google sign-in and Gmail**
In the [Google Cloud Console](https://console.cloud.google.com) (no billing needed):
1. Create a project and turn on the **Gmail API**.
2. Set up the **OAuth consent screen**: External, leave it in Testing, add your Gmail as a **test user**, and add the `gmail.readonly` scope.
3. Create an **OAuth client ID** (Web application) with this redirect URI: `https://<your-project-ref>.supabase.co/auth/v1/callback`
4. In Supabase → Authentication → Providers → **Google**, turn it on and paste in the Client ID and Secret.
5. In Supabase → Authentication → URL Configuration, set the Site URL to `http://localhost:3000` and add `http://localhost:3000/auth/callback` as a redirect URL.
6. Add the same Client ID and Secret to `.env.local` as `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.

**4. Run it**
```bash
npm run dev
```
Open http://localhost:3000 and sign in with Google. On the permission screen, **tick the box that lets ApplyTrack view your email**. Then click **Sync Gmail**.

**Good to know**
- While the Google app is in Testing mode, Google makes you reconnect Gmail every 7 days. If the sync says access expired, just sign out and back in.
- In Testing mode, only accounts on the test-user list can sign in. To let a friend use your copy, add their Gmail as a test user.

---

## What's next

- [ ] Use AI to sort only the emails the rules aren't sure about
- [ ] Deploy it online so friends can use it without setting anything up
- [ ] Merge duplicate applications in one click
- [ ] AI-drafted follow-up emails (drafted only, never sent automatically)
- [ ] Time-in-stage stats (how long companies take at each step)
- [ ] Interview prep notes generated from the saved job description

---

## How I built it

I built ApplyTrack with help from **[Claude](https://claude.ai)**, Anthropic's AI assistant, as my coding partner. I decided what the app should do and made the product calls: what counts as a response, when something is ghosted, adding a HireVue stage, and having a review queue instead of auto-guessing. I also tested everything on my real inbox and pointed out what was wrong or confusing. Claude helped me write and debug the code, set up the database and Gmail connection, and test the email sorter.

Working this way taught me a lot about being specific about what you want, checking AI output against real data, and pushing back when something didn't feel right. Those are skills I think matter a lot for building AI products.

---

Built by **Pedrocia (Seddy) De-Sosoo** · Computer Science + MIS @ RIT
