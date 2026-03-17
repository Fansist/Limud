# Limud - AI-Powered Adaptive Learning Platform

## Project Overview
- **Name**: Limud (Hebrew: "learning")
- **Version**: 8.9
- **Goal**: Transform K-12 education with AI-powered tutoring, smart grading, gamification, 16+ platform integrations, and comprehensive analytics
- **Tech Stack**: Next.js 14 + TypeScript + Tailwind CSS + Prisma + NextAuth + OpenAI + Framer Motion
- **Domain**: https://limud.co
- **GitHub**: https://github.com/Fansist/Limud
- **Hosting**: Render.com (primary), also supports cPanel/GoDaddy

---

## What's New in v8.9 — Named Demo System, AI Integration, Connected District

### Fully Connected Demo System (Ofer Academy)
- **District**: Ofer Academy — Premium subscription, AI enabled
- **Admin**: Erez Ofer (`erez@ofer-academy.edu`) — Superintendent access, full district control
- **Teacher**: Gregory Strachen (`strachen@ofer-academy.edu`) — Teaches Biology 101, Algebra II, English Literature
- **Students**: 
  - Lior Betzalel (`lior@ofer-academy.edu`) — 10th grade, top performer, 18-day streak
  - Eitan Balan (`eitan@ofer-academy.edu`) — 9th grade, medium risk, needs Math support
  - Noam Elgarisi (`noam@ofer-academy.edu`) — 10th grade, highest XP, 26-day streak
- **Parent**: David Betzalel (`david@ofer-academy.edu`) — Lior's parent, with AI check-in
- **All linked**: Students enrolled in teacher's courses, all in same district, parent sees child's data
- **Password for all**: `password123`
- Legacy accounts (`student@limud.edu`, etc.) still work — they redirect to the new demo identities

### AI Integration (GenSpark Proxy)
- OpenAI API key works through GenSpark's LLM proxy (`gpt-5-mini`)
- AI Tutor, AI Grading, AI Lesson Planner, AI Quiz Generator — all functional
- AI Parent Check-in generates real reports when API key is configured
- Graceful fallback to structured templates when AI is unavailable

### Landing Page Simplification (v8.9.0)
- **Completely rewritten** landing page — removed heavy animations (floating particles, parallax hero, scroll-triggered counters), condensed from 1087 lines to ~400 lines
- **Faster load time**, less JavaScript, simpler DOM structure
- **Added AI features prominently**: "Parent Portal + AI", "AI Safety Monitor" highlighted in features

### New Demo Page
- Complete redesign of `/demo` page with role-grouped account cards
- One-click login via NextAuth (no manual email/password entry)
- Shows district context banner, credentials with copy buttons
- Direct login as any of the 6+ demo accounts

### Comprehensive Bug Fixes (11 total)
1. **Notification ownership check** — `PUT /api/notifications` now verifies notification belongs to user
2. **Grade route ADMIN authorization** — `POST /api/grade` checks district membership
3. **Batch grade authorization** — `PUT /api/grade` now validates per-submission
4. **Analytics empty courseIds** — Returns early when no courseIds found
5. **Submissions ADMIN access** — Handles ADMIN role properly
6. **Parent goals PUT role check** — Verifies PARENT role
7. **Division by zero protection** — Fixed `s.maxScore!` divisions (parent reports, skills, teacher insights, teacher reports — 8+ instances)
8. **JSON.parse crash protection** — Rewards API `unlockedAvatars` / `unlockedBadges` (5 instances) wrapped in safeJsonParse with `[]` fallback
9. **Parent route JSON.parse** — Already had try/catch but verified safe
10. **Skills route division safety** — `s.maxScore || 1` protection
11. **Teacher reports division safety** — `s.maxScore || 1` protection

---

## Complete Render Deployment Guide (Step-by-Step)

### Step 1: Prerequisites
- GitHub account with the Limud repo (https://github.com/Fansist/Limud)
- Render account (https://render.com)
- PostgreSQL database (Render, Neon, or Supabase)
- Domain registrar login for limud.co DNS

### Step 2: Create PostgreSQL Database
**Option A: Render** — New → PostgreSQL → Name: limud-db, Plan: Starter ($7/mo)
**Option B: Neon** — https://neon.tech (free tier)
**Option C: Supabase** — https://supabase.com (free tier)

### Step 3: Create Render Web Service
1. New → Web Service → Connect GitHub → Select Fansist/Limud
2. Settings: Name=limud, Region=Oregon, Branch=main, Runtime=Node
3. Build: `npm install && npm run build` | Start: `node server.js`
4. Environment Variables:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `https://limud.co` |
| `NODE_ENV` | `production` |
| `NODE_VERSION` | `20.11.0` |
| `NEXT_PUBLIC_APP_URL` | `https://limud.co` |
| `NEXT_PUBLIC_APP_NAME` | `Limud` |
| `OPENAI_API_KEY` | (optional — demo mode works without it) |

### Step 4: Initialize Database
```bash
npx prisma db push
```

### Step 5: Verify
- `https://limud.co` — Landing page
- `https://limud.co/api/health` — Health check JSON
- `https://limud.co/login` — Demo accounts

### Step 6: Custom Domain (limud.co)
- A record: `limud.co` → Render IP
- CNAME: `www.limud.co` → `limud.onrender.com`
- SSL auto-provisioned by Render

---

## Features by Role

### Student (16 features)
Dashboard, Assignments, AI Tutor, Focus Mode, Knowledge Analytics, Study Planner, Exam Simulator, Growth, Rewards, Games, Daily Challenge, Leaderboard, Badges, Certificates, Platforms, Study Groups, Messages

### Teacher (14 features)
Dashboard, Assignments, AI Grading, Intelligence, AI Insights, AI Quiz Generator, AI Lesson Planner, Game Control, Teacher Exchange, Worksheets, Reports, Students, Analytics, Messages

### Admin (12 features)
Dashboard, Employees, Students, Schools, Classrooms, Announcements, Bulk Provisioning, Analytics, Billing, Settings, Audit Log, Compliance Reports, AI Usage Monitor

### Parent (6 features)
Dashboard with AI Check-in, Children Management, Growth Reports, Messages, Goal Tracking, Analytics

---

## API Endpoints (66 routes)
| Endpoint | Description |
|----------|-------------|
| `/api/health` | Health check |
| `/api/auth/register` | Registration (Parent/Admin) |
| `/api/parent/ai-checkin` | **NEW** AI-powered child check-in |
| `/api/parent` | Children data + add/remove child |
| `/api/parent/reports` | Growth reports |
| `/api/parent/goals` | Goal tracking |
| `/api/tutor` | AI tutor |
| `/api/grade` | AI auto-grading |
| `/api/assignments` | Assignment CRUD |
| `/api/submissions` | Submissions |
| `/api/games` | Game store |
| `/api/rewards` | Reward system |
| `/api/analytics` | Analytics |
| `/api/notifications` | Notifications |
| _...and 52 more_ | |

---

## Demo Accounts (Ofer Academy)
| Name | Email | Password | Role | Notes |
|------|-------|----------|------|-------|
| Lior Betzalel | `lior@ofer-academy.edu` | `password123` | Student | 10th grade, top performer |
| Eitan Balan | `eitan@ofer-academy.edu` | `password123` | Student | 9th grade, needs Math help |
| Noam Elgarisi | `noam@ofer-academy.edu` | `password123` | Student | 10th grade, highest XP |
| Gregory Strachen | `strachen@ofer-academy.edu` | `password123` | Teacher | Bio, Algebra, English |
| Erez Ofer | `erez@ofer-academy.edu` | `password123` | Admin | Superintendent access |
| David Betzalel | `david@ofer-academy.edu` | `password123` | Parent | Lior's parent |
| Master Demo | `master@limud.edu` | `LimudMaster2026!` | All roles | Full cross-role access |

Legacy accounts (`student@limud.edu`, `teacher@limud.edu`, etc.) still work with `password123`.

---

## Version History

### v8.9 (March 17, 2026) - Named Demo System, AI Integration, 11 Bug Fixes
- Fully connected demo: Ofer Academy (Erez Ofer, Gregory Strachen, Lior/Eitan/Noam, David Betzalel)
- AI working via GenSpark proxy (gpt-5-mini) — Tutor, Grading, Lessons, Check-ins
- Simplified landing page (1087 -> 400 lines)
- Redesigned /demo page with one-click login
- 11 bug fixes across auth, grading, analytics, rewards, reports

### v8.8 (March 15, 2026) - Bug Fixes & Landing Page Refresh
- Fixed ADMIN registration, parent rewards, games rate action
- Balanced competitor comparison on landing page

### v8.7.x (March 12-13, 2026) - Render Deployment
- District Admin Suite, deployment support, build fixes

---

## Local Development
```bash
npm install && npx prisma generate && npm run dev
# Production: npm run build && node server.js
# DB: npx prisma db push / npx prisma studio
```

## Deployment Status
- **Platform**: Render.com
- **Status**: Active
- **Domain**: limud.co
- **Last Updated**: March 17, 2026
