# Examuna — AI Exam Platform

## Overview
AI-powered exam generation tool for teachers. Upload past exams/materials, set curriculum criteria, and the AI generates new exam questions tailored to the teacher's style. Export to Word. Built for a Lebanese teacher converting between Lebanese and IB MYP curricula.

**Domain:** examuna.com ("our exam" in Arabic — امتحاننا)

## Stack
- **Frontend:** Next.js 14 (App Router) + Tailwind CSS + shadcn/ui
- **Backend:** Next.js API routes
- **Database:** Supabase (Postgres + Auth + Storage)
- **AI:** Google Gemini 3 Flash (`@google/genai` SDK) with Google Search grounding
- **File Processing:** mammoth (DOCX text extraction), Gemini multimodal (PDF/image)
- **Export:** docx library for Word export
- **Hosting:** Vercel
- **i18n:** English + Arabic (RTL support via next-intl + middleware)

## Live URLs
- **Production:** https://examuna.com
- **Vercel:** https://examuna.vercel.app
- **GitHub:** https://github.com/karimnhawi/examuna

## Infrastructure

### Supabase
- **Project URL:** https://zyxrcyrpynhsvogbqnee.supabase.co
- **Region:** us-west-2
- **Pooler:** postgresql://postgres.zyxrcyrpynhsvogbqnee:[PASSWORD]@aws-0-us-west-2.pooler.supabase.com:6543/postgres
- **Account:** examuna@outlook.com (credentials in Bitwarden "supabase.com")
- **Storage Bucket:** `test-bank-files` (stores uploaded exams, rubrics, textbook pages)
- **DB Tables:** users, user_settings, source_files, question_bank, exams, exam_questions
- **Migrations:**
  - `supabase/migrations/20260301130000_examuna_schema.sql` — initial schema (6 tables with RLS)
  - `supabase/migrations/20260301140000_auto_create_public_user.sql` — trigger to auto-create public.users on auth signup + backfill
- **Auth:** Email + password (Google OAuth and OTP removed for simplicity)

### Vercel
- **Project:** karim-hawis-projects/examuna
- **Token:** in Bitwarden "vercel.com"
- **Env vars set:** NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY

### DNS (GoDaddy)
- **Registrar:** GoDaddy
- **A Record:** @ → 76.76.21.21 (Vercel)
- **CNAME:** www → cname.vercel-dns.com

### Credentials (all in Bitwarden under ettheaibot@gmail.com)
- `supabase.com` — login, DB password, project URL, anon key, service role key, pooler
- `vercel.com` — API token
- `developer.godaddy.com` — API key/secret (blocked — needs 10+ domains)

## Environment Variables (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=https://zyxrcyrpynhsvogbqnee.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...(in Bitwarden)
SUPABASE_SERVICE_ROLE_KEY=eyJ...(in Bitwarden)
GEMINI_API_KEY=AIzaSy...(in Bitwarden)
```

## App Structure
```
examuna/
├── src/
│   ├── app/
│   │   ├── [locale]/              # i18n routes (en/ar)
│   │   │   ├── page.tsx           # Landing page (public)
│   │   │   ├── auth/              # Login/signup page
│   │   │   │   └── callback/      # Auth callback handler
│   │   │   └── dashboard/         # Single-page app with URL-based views (?view=wizard|exams|questions)
│   │   └── api/
│   │       ├── exams/             # CRUD for exams (GET, POST, DELETE)
│   │       ├── export-docx/       # Word document export
│   │       ├── extract/           # AI question extraction from files
│   │       ├── generate/          # AI exam generation with full criteria
│   │       └── upload/            # File upload to Supabase Storage
│   ├── components/
│   │   ├── layout/
│   │   │   └── navbar.tsx         # Top nav (i18n via nav.* keys, single sign-in CTA)
│   │   ├── wizard/                # 5-step exam creation wizard
│   │   │   ├── exam-wizard.tsx    # Wizard container + state management
│   │   │   ├── step-setup.tsx     # Step 1: Curriculum, grade, subject, IB criteria
│   │   │   ├── step-topics.tsx    # Step 2: Topics with chapters + weights
│   │   │   ├── step-materials.tsx # Step 3: Upload reference materials
│   │   │   ├── step-generate.tsx  # Step 4: Generate + review questions
│   │   │   └── step-export.tsx    # Step 5: Export to Word + save
│   │   ├── dashboard/
│   │   │   ├── exam-list.tsx      # Past exams list (export, inline delete confirm)
│   │   │   └── question-bank.tsx  # Question bank browser (expandable, filter by topic/difficulty)
│   │   └── ui/                    # shadcn/ui primitives (button, card, input, etc.)
│   ├── lib/
│   │   ├── gemini.ts              # Gemini client (GoogleGenAI SDK, gemini-3-flash)
│   │   ├── supabase-browser.ts    # Client-side Supabase client
│   │   ├── supabase-server.ts     # Server-side Supabase client (cookies)
│   │   ├── supabase-admin.ts      # Admin Supabase client (service role key)
│   │   └── utils.ts               # cn() utility
│   ├── i18n/
│   │   └── messages/
│   │       ├── en.json            # English translations (landing, dashboard, wizard)
│   │       └── ar.json            # Arabic translations
│   └── middleware.ts              # i18n routing + auth protection for /dashboard
├── supabase/
│   └── migrations/                # SQL schema + triggers
├── public/                        # Static assets
├── .env.local                     # Local env (gitignored)
└── .env.example                   # Template
```

## Core Flow

### Single-Page Wizard (primary UX)
1. **Setup** — Choose curriculum (Lebanese/IB MYP/IB DP/American/British/Custom), grade, subject, language, IB criteria (A-D with level ranges 1-8)
2. **Topics** — Add topics with chapter references and optional weight percentages
3. **Materials** — Upload reference files (past exams, rubrics, textbook pages) or reuse previously uploaded ones
4. **Generate** — AI creates questions based on all criteria; per-question regenerate/edit/remove; add more questions
5. **Export** — Download as Word (.docx), save exam to database

### Dashboard (after first exam)
Single-page dashboard with URL-based routing (`?view=wizard|exams|questions`) — browser Back/Forward works:
- **Hero card** — fully clickable, navigates to wizard
- **Stat cards** — clickable (Questions → question bank, Exams → exam list, Files → wizard)
- **Quick links** — My Exams, Question Bank (2 cards)
- **Recent exams** — clickable rows navigate to exam list
- **Empty state** — welcome card shown when all stats are 0

## AI Features

### Question Generation (`POST /api/generate`)
- Accepts full criteria: curriculum, grade, subject, language, IB criteria, topics with weights, reference file IDs
- **Google Search grounding** — AI looks up real curriculum standards and subject content online
- **Deduplication** — fetches up to 200 past exam questions + 100 most-used bank questions, injects as "do not repeat" list
- **Style learning** — analyzes 30 most recent teacher questions for avg marks, difficulty distribution, cognitive level patterns, sends 10 samples as style examples
- **Conversion mode** — reads source exam questions and adapts to target curriculum format
- **Fallbacks** — template questions if Gemini fails
- Legacy mode for simple subject + difficulty requests

### Question Extraction (`POST /api/extract`)
- Downloads actual files from Supabase Storage via admin client
- **DOCX** — extracts text via mammoth, sends to Gemini
- **PDF** — sends to Gemini multimodally (base64 inline data)
- **Images** (JPG/PNG/WebP) — sends to Gemini multimodally
- Extracted questions saved to `question_bank` with topic, difficulty, IB band, cognitive level, marks, answer key

### AI Model
- **Model:** Gemini 3 Flash (`gemini-3-flash`)
- **SDK:** `@google/genai` (new Google GenAI SDK)
- **Cost:** ~$0.01 per exam generation (including search grounding)
- **Why Gemini 3 Flash:** Best cost/quality ratio, native Google Search grounding, strong Arabic support, multimodal (PDF/image), 1M token context

## Database Schema

### Tables
- **users** — synced from auth.users via trigger (id, email, full_name)
- **user_settings** — per-user preferences (subject, IB level, language, grading scale, exam format)
- **source_files** — uploaded file metadata (file_name, file_path, mime_type, status)
- **question_bank** — extracted/generated questions (question_text, answer_key, topic, difficulty, ib_band, cognitive_level, marks, language, usage_count)
- **exams** — saved exams (title, subject, language, duration_minutes, total_marks, status)
- **exam_questions** — questions in an exam (exam_id, question_id, custom_question_text, position, marks, action_state)

### Key Relationships
- `exams.user_id` → `users.id` (foreign key — requires public.users row)
- `question_bank.user_id` → `users.id`
- `question_bank.source_file_id` → `source_files.id`
- `exam_questions.exam_id` → `exams.id`
- `exam_questions.question_id` → `question_bank.id` (nullable — AI-generated questions use custom_question_text instead)

### Auto-sync Trigger
`handle_new_user()` trigger on `auth.users` INSERT automatically creates a `public.users` row, ensuring foreign key constraints are satisfied when saving exams.

## What's Done
- [x] Full Next.js 14 scaffold (App Router, all pages + API routes)
- [x] Tailwind + shadcn/ui setup
- [x] i18n (EN/AR) with RTL support + middleware
- [x] Supabase client setup + auth helpers (browser, server, admin)
- [x] DB schema + migrations (6 tables with RLS + auto-sync trigger)
- [x] GitHub repo pushed (karimnhawi/examuna)
- [x] Supabase project created + migrations applied
- [x] Vercel deployment (builds + deploys successfully)
- [x] DNS configured (A record + CNAME) — examuna.com live
- [x] Environment variables set on Vercel (including SUPABASE_SERVICE_ROLE_KEY)
- [x] Auth simplified to email + password (removed Google OAuth + OTP)
- [x] Single-page wizard flow (5 steps: setup → topics → materials → generate → export)
- [x] Dashboard with URL-based routing, clickable cards, empty state for new users
- [x] AI generation with full curriculum criteria, IB criteria, topic weights
- [x] Google Search grounding for real curriculum standards lookup
- [x] AI deduplication (no repeat questions across exams)
- [x] AI style learning (matches teacher's question patterns)
- [x] Curriculum conversion mode (e.g., Lebanese → IB MYP)
- [x] Actual file content extraction (DOCX via mammoth, PDF/images via Gemini multimodal)
- [x] Word (.docx) export
- [x] Landing page with dynamic CTA (dashboard if logged in, auth if not)
- [x] Supabase Storage bucket (`test-bank-files`) for file uploads
- [x] public.users auto-sync trigger + backfill of existing auth users
- [x] Upgraded to Gemini 3 Flash with new `@google/genai` SDK
- [x] Full UX overhaul: clickable cards, URL routing, mobile fixes
- [x] Navbar cleanup (single sign-in CTA, i18n via nav.* keys)
- [x] ExamList: text labels on buttons, inline delete confirmation, exam-title filenames
- [x] QuestionBank: expandable text, stable filters, question count header
- [x] Wizard: always-visible mobile actions, confirm before regenerate-all, Add Question loading
- [x] IB level range auto-clamping, removed dead convert mode checkbox
- [x] Deleted orphaned /builder, /export, /upload routes

## What's Next
- [ ] Test full end-to-end flow (upload Lebanese exam → extract → generate IB MYP equivalent → export)
- [ ] Improve Word export formatting (IB header, criteria tags, mark scheme section)
- [ ] Add drag-to-reorder questions in Step 4
- [ ] Question bank management (edit, archive, search)
- [ ] Exam duplication (clone a past exam as starting point)
- [ ] Answer key / rubric generation as separate export
- [ ] Landing page polish (testimonials, screenshots, demo)
- [ ] Error handling improvements (better user-facing messages)

## Dev Commands
```bash
npm run dev                        # Local dev server (http://localhost:3000)
node node_modules/next/dist/bin/next build   # Production build (npx not in PATH on this machine)
git push origin main               # Push to GitHub (auto-deploys to Vercel)
```

## Git History
```
6fabb15 Full UX overhaul: clickable cards, URL routing, mobile fixes, cleanup
4606571 Retry Vercel deployment (2)
0f4ac88 Add generation usage logging and set maxDuration on API routes
2880bdd Upgrade AI prompt with real pedagogical guidance for teacher-quality questions
f49b5d4 Fix foreign key error and extract actual content from uploaded files
b3bd16f Redirect landing page CTA to dashboard when already logged in
7ba6b68 Add single-page wizard, upgrade to Gemini 3 Flash with search grounding
2a27143 Simplify auth to email + password (remove Google OAuth and OTP)
c379169 Overhaul UI, auth, security, and wire up full exam pipeline
460ee0b Initial commit - Examuna project setup
```
