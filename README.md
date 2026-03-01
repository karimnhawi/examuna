# Examuna

Examuna is a bilingual (English/Arabic) AI exam generation platform built with Next.js 14, Supabase, and Gemini.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy env vars:
   ```bash
   cp .env.example .env.local
   ```
3. Fill these variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GEMINI_API_KEY`
4. Run development server:
   ```bash
   npm run dev
   ```

## Routes
- `/{locale}` Landing page
- `/{locale}/auth` Login/signup
- `/{locale}/dashboard`
- `/{locale}/upload`
- `/{locale}/builder`
- `/{locale}/export`

## API Routes
- `POST /api/upload`
- `POST /api/extract`
- `POST /api/generate`
- `GET /api/export-docx`

## Supabase
- Migration SQL is in `supabase/migrations/20260301130000_examuna_schema.sql`
- Create storage bucket: `test-bank-files`
- Enable Google auth provider in Supabase dashboard.

## Deploy
Deploy directly to Vercel with environment variables configured.
