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

## What's New in v8.9 — Simplified Landing Page, AI Parent Check-ins, Expanded Services & Bug Audit

### Landing Page Simplification
- **Completely rewritten** landing page — removed heavy animations (floating particles, parallax hero, scroll-triggered counters), condensed from 1087 lines to ~400 lines
- **Removed**: Sticky CTA bar, animated number counters, floating particle effects, platform logo grid, comparison table, "replaces" visual, integrations section, "How It Works" section
- **Kept/Simplified**: Clean hero with dashboard preview, quick value props, feature grid (12 features), balanced competitor comparison cards, "Who it's for" cards, pricing (3 plans instead of 6), FAQ (6 questions), final CTA, clean footer
- **Faster load time**, less JavaScript, simpler DOM structure
- **Added AI features prominently**: "Parent Portal + AI", "AI Safety Monitor" highlighted in features

### AI Parent Check-in Feature (NEW)
- **New API**: `POST /api/parent/ai-checkin` — Generates an AI-powered report on a child's academic wellbeing
- **Data analyzed**: Last 14 days of grades, tutor usage, study sessions, skills, streaks, XP
- **Report covers**: Academic summary, engagement level, strengths, areas needing attention, emotional indicators, actionable recommendations
- **Fallback mode**: Generates structured reports even without OpenAI API key
- **GET endpoint**: Returns children with quick stats for the check-in UI
- **Frontend**: Beautiful modal with stats bar, markdown rendering, and data source attribution

### Expanded Parent Services
- **AI Check-in button** on each child card in parent dashboard — one click to generate a comprehensive AI report
- **More quick actions**: Growth Reports, Messages, and Analytics links added alongside existing assignment/grading tools
- **Works for both** homeschool parents and regular parents (homeschool parents see teacher tools + parent tools)
- **Demo mode** generates sample check-in reports for testing

### Expanded Admin Services
- **System Health status cards**: System Status, Compliance, AI Features — all showing real-time operational status
- **New quick actions**: Compliance Reports, AI Usage Monitor added alongside existing admin tools
- **12 admin actions** total (up from 10): Employee Directory, Students, Schools, Classrooms, Announcements, Bulk Provisioning, Analytics, Billing, Settings, Audit Log, Compliance Reports, AI Usage Monitor
- **Division by zero fix** in capacity overview when maxStudents/maxTeachers is 0

### Comprehensive Bug Fixes
1. **Notification ownership check** — `PUT /api/notifications` now verifies the notification belongs to the authenticated user before marking as read (previously any user could mark any notification as read by ID)
2. **Grade route ADMIN authorization** — `POST /api/grade` now checks that ADMIN users can only grade submissions within their own district (previously ADMIN could grade any submission in any district)
3. **Batch grade authorization** — `PUT /api/grade` now checks per-submission authorization in batch grading (previously skipped all auth checks)
4. **Analytics empty courseIds** — `GET /api/analytics` now returns empty results early when no courseIds are found (previously queried with `{ in: [] }` which could cause unexpected results)
5. **Submissions ADMIN access** — `GET /api/submissions` now handles ADMIN role properly (previously fell through to 403 Forbidden because ADMIN was not in `hasTeacherAccess()`)
6. **Parent goals PUT role check** — `PUT /api/parent/goals` now verifies the user is a PARENT (previously any authenticated user could update parent goals)
7. **Division by zero protection** — Fixed unsafe `s.maxScore!` divisions in parent reports API (4 instances); now uses `(s.maxScore || 100)` to prevent NaN
8. **JSON.parse crash protection** — Fixed `JSON.parse(unlockedBadges)` in parent route that could crash if the field was null or malformed; now wrapped in try/catch with `[]` fallback

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

## Demo Accounts
| Email | Password | Role |
|-------|----------|------|
| `student@limud.edu` | `password123` | Student |
| `teacher@limud.edu` | `password123` | Teacher |
| `admin@limud.edu` | `password123` | Admin |
| `parent@limud.edu` | `password123` | Parent |
| `master@limud.edu` | `LimudMaster2026!` | Master |

---

## Version History

### v8.9 (March 17, 2026) - Simplified Landing, AI Check-ins, Bug Audit
- Simplified landing page (removed particles, counters, heavy animations)
- AI parent check-in feature (API + frontend modal)
- Expanded parent/admin dashboards with more services
- 8 bug fixes across notifications, grading, analytics, submissions, goals

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
