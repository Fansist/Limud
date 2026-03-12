# Limud - AI-Powered Adaptive Learning Platform

## Project Overview
- **Name**: Limud (Hebrew: "learning")
- **Version**: 8.7
- **Goal**: Transform K-12 education with AI-powered tutoring, smart grading, gamification, 16+ platform integrations, and comprehensive analytics
- **Tech Stack**: Next.js 14 + TypeScript + Tailwind CSS + Prisma + NextAuth + OpenAI + Framer Motion
- **Domain**: https://limud.co
- **GitHub**: https://github.com/Fansist/Limud
- **Hosting**: Render.com (primary), also supports cPanel/GoDaddy and Cloudflare Pages

---

## Deployment to Render (Primary)

### Quick Start
1. **Push to GitHub** — Render auto-deploys from the `main` branch
2. **Create a Render Web Service** at https://render.com
3. **Connect your GitHub repo** (Fansist/Limud)
4. Render reads `render.yaml` and configures everything automatically

### Manual Setup (if not using Blueprint)
| Setting | Value |
|---------|-------|
| **Runtime** | Node |
| **Build Command** | `npm install && npx prisma generate && npm run build` |
| **Start Command** | `node server.js` |
| **Health Check** | `/api/health` |
| **Node Version** | 20.x (set via `NODE_VERSION` env var) |

### Environment Variables (set in Render Dashboard)
| Variable | Value | Notes |
|----------|-------|-------|
| `DATABASE_URL` | `postgresql://...` | Render PostgreSQL or external (Neon, Supabase) |
| `NEXTAUTH_URL` | `https://limud.co` | Your production domain |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` | Generate a random secret |
| `OPENAI_API_KEY` | `sk-...` | Or `demo-mode` for demo features |
| `OPENAI_BASE_URL` | `https://api.openai.com/v1` | Default OpenAI endpoint |
| `NODE_ENV` | `production` | Set automatically by render.yaml |
| `NEXT_PUBLIC_APP_URL` | `https://limud.co` | Public-facing URL |
| `NEXT_PUBLIC_APP_NAME` | `Limud` | App display name |

### Custom Domain: limud.co
After deploying to Render:
1. Go to **Render Dashboard** → Your Service → **Settings** → **Custom Domains**
2. Add `limud.co` and `www.limud.co`
3. Configure DNS at your domain registrar:
   - **A Record**: `limud.co` → Render's IP (shown in dashboard)
   - **CNAME Record**: `www.limud.co` → `limud.onrender.com`
4. Render automatically provisions **free TLS/SSL** certificates

### Database Setup
**Option A: Render PostgreSQL** (recommended for simplicity)
- Create a PostgreSQL database in Render dashboard
- `DATABASE_URL` is auto-injected into your web service

**Option B: External PostgreSQL** (Neon, Supabase, Railway)
- Create a free PostgreSQL database at neon.tech or supabase.com
- Copy the connection string to `DATABASE_URL` in Render env vars

After setting `DATABASE_URL`, run schema migration:
```bash
npx prisma db push
npx prisma db seed  # optional: seed demo data
```

---

## Other Deployment Options

### cPanel / GoDaddy
```bash
npm run build:standalone
# Upload .next/standalone/ to your hosting
```
See `DEPLOY-CPANEL.md` for detailed instructions.

### Cloudflare Pages
```bash
npm run deploy
```

### Local Development
```bash
npm run dev          # Next.js dev server on port 3000
npm run start        # Production mode
npm run start:render # Same as production (node server.js)
```

---

## What's New in v8.7 — District Admin Suite & Render Deployment

### District Admin Suite
- **Employee Directory** (`/admin/employees`): View/search/filter/sort all staff, expandable detail cards, CSV export, 10 demo employees
- **Enhanced Classroom Management** (`/admin/classrooms`): Schedule picker, curriculum/objectives, difficulty levels, color-coded cards, capacity bars, AI/Games/Challenge toggles, grid/list view
- **District Settings** (`/admin/settings`): 6 tabs (General, Academic, Security, Features, Notifications, Branding), configure school year, grading policies, toggle 11 platform features, FERPA/COPPA/WCAG compliance
- **Announcements** (`/admin/announcements`): Publish district messages with audience targeting, priority levels, pinning, expiration, read-receipt tracking
- **Audit Log** (`/admin/audit`): Track admin actions across 8 categories, severity colors, search/filter/export CSV

### Render Deployment Support
- **`render.yaml`**: Render Blueprint with build/start commands, env vars, custom domain config for limud.co
- **`server.js`**: Universal entry point with platform detection (Render/cPanel/generic), health check endpoint
- **`/api/health`**: Health check route for Render monitoring
- **Updated `package.json`**: Added `build:render`, `start:render`, `health` scripts, `engines` field
- **Updated `.env.example`**: Render-specific guidance and limud.co domain references
- **Updated `next.config.js`**: HSTS header, limud.co image domains

### Navigation Updates
- Admin sidebar: 11 items (Dashboard, Employees, Students, Schools, Classrooms, Announcements, Bulk Import, Analytics, Billing, Settings, Audit Log)
- Admin mobile nav: Home, Staff, Classes, Stats, Settings
- Dashboard quick-action cards: 11 total

---

## Features by Role

### Student Features
| Feature | Path | Description |
|---------|------|-------------|
| Dashboard | `/student/dashboard` | Welcome screen, stats, quick actions |
| Assignments | `/student/assignments` | View assignments with attachments, submit work |
| AI Tutor | `/student/tutor` | Socratic questioning AI assistant |
| Focus Mode | `/student/focus` | Distraction-free study timer |
| Knowledge | `/student/knowledge` | Skill radar, study heatmap, rank system |
| Study Planner | `/student/study-planner` | Schedule and plan study sessions |
| Exam Simulator | `/student/exam-sim` | Practice test environment |
| Growth Analytics | `/student/growth` | Progress tracking over time |
| Rewards | `/student/rewards` | XP, levels, streaks, coin shop |
| Game Store | `/student/games` | Purchase and play educational games |
| Daily Challenge | `/student/daily-challenge` | Streak-maintaining quick exercises |
| Leaderboard | `/student/leaderboard` | Class and school rankings |
| Badges | `/student/badges` | Achievement badge collection |
| Certificates | `/student/certificates` | Progress certificates |
| My Platforms | `/student/platforms` | 16+ platform connections |

### Teacher Features
| Feature | Path | Description |
|---------|------|-------------|
| Dashboard | `/teacher/dashboard` | Overview, class stats, pending items |
| Assignment Manager | `/teacher/assignments` | Create with categories, weights, attachments |
| AI Grading | `/teacher/grading` | One-click rubric-based auto-grading |
| Intelligence | `/teacher/intelligence` | Student behavior insights |
| AI Quiz Generator | `/teacher/quiz-generator` | Curriculum-aligned quiz creation |
| AI Lesson Planner | `/teacher/lesson-planner` | Complete lesson plans (11 sections) |
| Game Control | `/teacher/games` | Per-class game access toggle + stats |
| Teacher Exchange | `/teacher/exchange` | Share resources with other teachers |
| Worksheets | `/teacher/worksheets` | Worksheet library and builder |
| Reports | `/teacher/reports` | Class and student reports |
| Students | `/teacher/students` | Student management and profiles |
| Analytics | `/teacher/analytics` | At-risk identification and trends |

### Admin Features
| Feature | Path | Description |
|---------|------|-------------|
| Dashboard | `/admin/dashboard` | District overview, subscription, quick actions |
| Employees | `/admin/employees` | Staff directory, search, filter, CSV export |
| Students | `/admin/students` | District student management, auto-parent creation |
| Schools | `/admin/schools` | School management |
| Classrooms | `/admin/classrooms` | Enhanced classroom management with scheduling |
| Announcements | `/admin/announcements` | District-wide announcements with targeting |
| Bulk Import | `/admin/provision` | CSV bulk user provisioning |
| Analytics | `/admin/analytics` | District-wide analytics and reporting |
| Billing | `/admin/payments` | Subscription and payment management |
| Settings | `/admin/settings` | District configuration (6 tabs) |
| Audit Log | `/admin/audit` | Admin action tracking and compliance |

### Parent Features
| Feature | Path | Description |
|---------|------|-------------|
| Dashboard | `/parent/dashboard` | Children overview, grades, progress |
| Reports | `/parent/reports` | Detailed progress reports |
| Messages | `/parent/messages` | Parent-teacher communication |

---

## Data Architecture
- **Database**: PostgreSQL via Prisma ORM
- **Auth**: NextAuth.js with credentials + OAuth providers
- **AI**: OpenAI GPT for tutoring, grading, lesson planning, quiz generation
- **State**: React state + Zustand for global state
- **Demo Mode**: Full-featured demo mode via `?demo=true` URL parameter

## API Endpoints

### Health & System
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check (version, uptime, platform) |

### Core APIs
| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/assignments` | GET, POST | Assignment CRUD |
| `/api/submissions` | POST | Submit student work |
| `/api/lesson-plans` | GET, POST, PUT, DELETE | Lesson plan management |
| `/api/quiz-generator` | GET, POST | Quiz generation |
| `/api/platforms` | GET, POST, PUT, DELETE | Platform linking |
| `/api/games` | GET, POST, PUT | Game store and controls |
| `/api/rewards` | GET, POST | Reward system |
| `/api/tutor` | POST | AI tutor conversations |
| `/api/grade` | POST | AI auto-grading |
| `/api/district/students` | GET, POST | District student management |
| `/api/district/schools` | GET, POST | District school management |
| `/api/district/classrooms` | GET, POST, PUT | District classroom management |
| `/api/district/employees` | GET, POST | District employee management |
| `/api/analytics` | GET | Analytics data |
| `/api/admin/provision` | POST | Bulk user provisioning |

---

## Version History (Recent)

### v8.7 (March 12, 2026) - District Admin Suite & Render Deployment
- Employee Directory, Enhanced Classrooms, Settings, Announcements, Audit Log
- Render deployment support (render.yaml, health check, server.js updates)
- Custom domain limud.co configuration
- 12 files changed, +2,209 lines

### v8.6 (March 11, 2026) - AI Navigation Assistant & Internal Messaging
### v8.5.1 - Complete standalone index.html
### v8.4.1 - cPanel / GoDaddy deployment support
### v8.4 - Account model overhaul & content cleanup
### v8.3 - Product Roadmap page
### v8.2 - Pricing Overhaul & Custom Plan Builder
### v8.1 - Professional Polish & Brand Consistency
### v8.0 - Competitor-Killer Landing Page
### v7.x - Platform integrations, Game Store, Assignment Manager, AI features

---

## User Guide

### Quick Demo
Visit any page with `?demo=true` to explore features without an account:
- Student: `/student/dashboard?demo=true`
- Teacher: `/teacher/dashboard?demo=true`
- Admin: `/admin/dashboard?demo=true`
- Parent: `/parent/dashboard?demo=true`

### Master Demo Account
- **Email**: `master@limud.edu`
- **Password**: `LimudMaster2026!`
- Full access to all roles with role switcher in sidebar
