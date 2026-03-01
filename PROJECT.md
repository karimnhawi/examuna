# Examuna — AI Exam Platform

## Overview
AI-powered exam generation and grading tool for teachers. Upload test banks, build exams in clicks, export to Word. Starting with IB but designed to scale beyond.

## Stack
- **Frontend:** Next.js + Tailwind CSS (RTL support for Arabic)
- **Backend:** Next.js API routes
- **Database:** Supabase (Postgres + Auth + Storage)
- **AI:** Gemini API (free — OCR, question extraction, generation, IB grading)
- **Export:** docx library for Word export
- **Hosting:** Vercel

## Core Flow
Upload test banks → AI extracts questions → Stored in DB → Generate exam → Pick/swap questions → Export to Word

## Features
- [ ] Onboarding (subject, IB level, language, grading, exam format)
- [ ] Test bank upload (PDF, images, Word docs)
- [ ] AI question extraction + tagging (topic, difficulty, IB band 1-8, cognitive level)
- [ ] Exam generator (pick criteria → get draft exam)
- [ ] Per-question actions: ✅ Keep, 🔄 Regenerate, ✏️ Edit, 🗑️ Remove
- [ ] Word (.docx) export with school header, RTL Arabic support
- [ ] PDF export
- [ ] Answer key generation
- [ ] Question usage tracking (no repeats)
- [ ] Arabic + English support (full RTL)

## Database (Supabase)
- `users` — account
- `user_settings` — onboarding preferences (subject, IB level, language, grading_scale, etc.)
- `question_bank` — extracted questions with tags
- `source_files` — uploaded test bank files
- `exams` — generated exams
- `exam_questions` — questions per exam

## Design Principles
- Grandma-proof simple — two main screens (Upload + Make Exam)
- No AI jargon visible to the user
- Works on laptop (primary device)
- Configurable for any IB subject/level

## Status
- Phase: Planning / Scaffold
- Waiting on: Sample exam from Karim's mom
