# Limud - AI-Powered Adaptive Learning Platform

## Project Overview
- **Name**: Limud (Hebrew: "learning")
- **Version**: 8.8
- **Goal**: Transform K-12 education with AI-powered tutoring, smart grading, gamification, 16+ platform integrations, and comprehensive analytics
- **Tech Stack**: Next.js 14 + TypeScript + Tailwind CSS + Prisma + NextAuth + OpenAI + Framer Motion
- **Domain**: https://limud.co
- **GitHub**: https://github.com/Fansist/Limud
- **Hosting**: Render.com (primary), also supports cPanel/GoDaddy

---

## Complete Render Deployment Guide (Step-by-Step)

Follow these steps in order to get Limud fully deployed with your custom domain:

### Step 1: Prerequisites
- A GitHub account with the Limud repository (https://github.com/Fansist/Limud)
- A Render account (https://render.com — free to create)
- A PostgreSQL database (Render offers one, or use Neon/Supabase)
- Your domain registrar login (for limud.co DNS settings)

### Step 2: Create a PostgreSQL Database
**Option A: Render PostgreSQL** (simplest)
1. Go to https://dashboard.render.com
2. Click **New** → **PostgreSQL**
3. Name: `limud-db`
4. Database: `limud`
5. User: `limud_user`
6. Region: **Oregon** (or your preferred region)
7. Plan: **Starter ($7/mo)** or **Free** (for testing, expires after 90 days)
8. Click **Create Database**
9. Wait for it to spin up, then copy the **Internal Database URL** (starts with `postgres://`)

**Option B: Neon (free tier)**
1. Go to https://neon.tech → Sign up → Create project
2. Copy the connection string (starts with `postgresql://`)

**Option C: Supabase (free tier)**
1. Go to https://supabase.com → Create project
2. Go to Settings → Database → Connection string (URI)
3. Copy the connection string

### Step 3: Create the Render Web Service
1. Go to https://dashboard.render.com
2. Click **New** → **Web Service**
3. Connect your GitHub account if not already connected
4. Select the repository: **Fansist/Limud**
5. Configure the service:

| Setting | Value |
|---------|-------|
| **Name** | `limud` |
| **Region** | Oregon (or match your DB region) |
| **Branch** | `main` |
| **Runtime** | Node |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `node server.js` |
| **Plan** | Starter ($7/mo) or higher |

6. Click **Advanced** and add these **Environment Variables**:

| Variable | Value | Required |
|----------|-------|----------|
| `DATABASE_URL` | Your PostgreSQL connection string from Step 2 | YES |
| `NEXTAUTH_SECRET` | Run `openssl rand -base64 32` and paste the result | YES |
| `NEXTAUTH_URL` | `https://limud.co` (or `https://limud.onrender.com` initially) | YES |
| `OPENAI_API_KEY` | Your OpenAI API key (or leave blank for demo mode) | Optional |
| `OPENAI_BASE_URL` | `https://api.openai.com/v1` (or your proxy URL) | Optional |
| `NODE_ENV` | `production` | YES |
| `NODE_VERSION` | `20.11.0` | YES |
| `NEXT_PUBLIC_APP_NAME` | `Limud` | YES |
| `NEXT_PUBLIC_APP_URL` | `https://limud.co` | YES |

7. Click **Create Web Service**
8. Wait for the build to complete (takes ~3-5 minutes on first deploy)

### Step 4: Initialize the Database
After your first deploy succeeds, you need to push the database schema:

**Option A: Use Render Shell**
1. Go to your service in Render Dashboard
2. Click **Shell** tab
3. Run: `npx prisma db push`
4. (Optional) Run: `npx prisma db seed` to seed demo data

**Option B: Run locally**
1. Set your `DATABASE_URL` environment variable locally to the Render PostgreSQL connection string
2. Run: `npx prisma db push`

### Step 5: Verify Deployment
1. Visit `https://limud.onrender.com` — you should see the landing page
2. Visit `https://limud.onrender.com/api/health` — should return JSON with status "ok"
3. Try the demo login at `/login` with demo accounts:
   - Student: `student@limud.edu` / `password123`
   - Teacher: `teacher@limud.edu` / `password123`
   - Admin: `admin@limud.edu` / `password123`
   - Master: `master@limud.edu` / `LimudMaster2026!`

### Step 6: Set Up Custom Domain (limud.co)
1. In Render Dashboard → Your Service → **Settings** → **Custom Domains**
2. Click **Add Custom Domain**
3. Add `limud.co` — Render will show you the required DNS records
4. Add `www.limud.co` — Render will show CNAME instructions

5. Go to your **domain registrar** (wherever you bought limud.co) and configure DNS:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| **A** | `@` (or `limud.co`) | Render's IP address (shown in dashboard) | 300 |
| **CNAME** | `www` | `limud.onrender.com` | 300 |

6. Wait for DNS propagation (5 minutes to 48 hours, usually under 30 minutes)
7. Render will **automatically provision free SSL/TLS certificates** once DNS is verified
8. Update your environment variables:
   - Set `NEXTAUTH_URL` to `https://limud.co`
   - Set `NEXT_PUBLIC_APP_URL` to `https://limud.co`

### Step 7: Enable Auto-Deploy
Render auto-deploys are enabled by default. Every push to the `main` branch will trigger a new deployment. You can also:
- **Manual deploy**: Render Dashboard → Your Service → **Manual Deploy** → Deploy latest commit
- **Disable auto-deploy**: Settings → Build & Deploy → Auto-Deploy → Off

---

## What's New in v8.8 — Bug Fixes, Landing Page Refresh & Render Stability

### Critical Bug Fixes
- **Registration API fixed**: District Administrator (ADMIN) accounts can now be created. Previously, the registration API only accepted STUDENT, TEACHER, and PARENT roles — ADMIN was rejected with "Invalid role"
- **District creation for admins**: When an ADMIN registers, a district is automatically created with proper limits and a DistrictAdmin record is set up with full SUPERINTENDENT permissions
- **Parent rewards view fixed**: Parents can now view their children's reward stats (XP, coins, badges). Previously, a no-op bug caused parents to always see empty stats. Parents can also switch between children with `?childId=` parameter
- **Games rate action fixed**: The "rate" action in the games API was trying to read the request body twice (stream already consumed). All body parsing is now done once
- **Improved error handling**: All API routes now gracefully handle database connection errors (P1001), duplicate records (P2002), missing records (P2025), and connection refused errors with user-friendly messages

### Landing Page Refresh
- **Balanced competitor comparison**: The comparison section now honestly acknowledges what competitors do well (Khan Academy's content library, Google Classroom's Google Workspace integration, ClassDojo's parent communication, etc.) while highlighting where Limud adds value
- **Fairer competitor callout cards**: Each card shows "What they do well" alongside "Where Limud adds value" instead of only showing weaknesses
- **Updated pricing comparison**: Replaced irrelevant competitors (Coursera, Babbel) with relevant K-12 tools (IXL, Prodigy) and added strength notes for each
- **Less aggressive feature descriptions**: Removed "Replaces X" tags in favor of neutral labels ("AI-Powered", "Multi-Subject", "Engagement", etc.)
- **Updated FAQ**: Questions now respect competitor strengths while explaining how Limud complements them
- **Version bumped to v8.8** across navbar, footer, server.js, health endpoint, and package.json

### Render Deployment Stability
- Version 8.7.1: Removed Cloudflare-only dependencies, pinned Prisma to 5.22.0
- Version 8.7.2: Fixed start command for standalone mode, PORT binding, NEXTAUTH_SECRET fallback
- Version 8.8: All bug fixes above, improved middleware error handling

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
| Study Groups | `/student/study-groups` | Collaborative study spaces |
| Messages | `/student/messages` | Internal messaging system |

### Teacher Features
| Feature | Path | Description |
|---------|------|-------------|
| Dashboard | `/teacher/dashboard` | Overview, class stats, pending items |
| Assignment Manager | `/teacher/assignments` | Create with categories, weights, attachments |
| AI Grading | `/teacher/grading` | One-click rubric-based auto-grading |
| Intelligence | `/teacher/intelligence` | Student behavior insights |
| AI Insights | `/teacher/insights` | AI-powered class insights |
| AI Quiz Generator | `/teacher/quiz-generator` | Curriculum-aligned quiz creation |
| AI Lesson Planner | `/teacher/lesson-planner` | Complete lesson plans (11 sections) |
| Game Control | `/teacher/games` | Per-class game access toggle + stats |
| Teacher Exchange | `/teacher/exchange` | Share resources with other teachers |
| Worksheets | `/teacher/worksheets` | Worksheet library and builder |
| Reports | `/teacher/reports` | Class and student reports |
| Students | `/teacher/students` | Student management and profiles |
| Analytics | `/teacher/analytics` | At-risk identification and trends |
| Messages | `/teacher/messages` | Internal messaging system |

### Admin Features
| Feature | Path | Description |
|---------|------|-------------|
| Dashboard | `/admin/dashboard` | District overview, subscription, quick actions |
| Employees | `/admin/employees` | Staff directory, search, filter, CSV export |
| Students | `/admin/students` | District student management |
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
| Children | `/parent/children` | Individual child profiles |
| Reports | `/parent/reports` | Detailed progress reports |
| Messages | `/parent/messages` | Parent-teacher communication |

---

## Data Architecture
- **Database**: PostgreSQL via Prisma ORM (5.22.0)
- **Auth**: NextAuth.js with credentials provider + demo accounts
- **AI**: OpenAI GPT for tutoring, grading, lesson planning, quiz generation
- **State**: React state + Zustand for global state
- **Demo Mode**: Full-featured demo mode via `?demo=true` URL parameter

## API Endpoints

### Core APIs
| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/health` | GET | Health check (version, uptime, platform) |
| `/api/auth/register` | POST | Account registration (Student, Teacher, Parent, Admin) |
| `/api/auth/forgot-password` | POST | Password reset request |
| `/api/auth/reset-password` | POST | Password reset |
| `/api/assignments` | GET, POST | Assignment CRUD |
| `/api/submissions` | GET, POST | Submit and view student work |
| `/api/lesson-plans` | GET, POST, PUT, DELETE | Lesson plan management |
| `/api/quiz-generator` | GET, POST | Quiz generation |
| `/api/platforms` | GET, POST, PUT, DELETE | Platform linking |
| `/api/games` | GET, POST, PUT | Game store and controls |
| `/api/rewards` | GET, POST | Reward system (supports `?childId=` for parents) |
| `/api/tutor` | POST | AI tutor conversations |
| `/api/grade` | POST | AI auto-grading |
| `/api/messages` | GET, POST | Internal messaging |
| `/api/district/*` | Various | District management APIs |
| `/api/admin/provision` | POST | Bulk user provisioning |
| `/api/analytics` | GET | Analytics data |

---

## Account Types

### Registration Paths
1. **Homeschool Family** (Free)
   - Creates a PARENT account with HOMESCHOOL type
   - Auto-creates a district, child student accounts, and enrollments
   - Full access to AI tutor, lesson planner, rewards, and parent dashboard

2. **District Administrator** (Paid plans from $2/student/mo)
   - Creates an ADMIN account with DISTRICT type
   - Auto-creates a district with proper limits
   - Creates a DistrictAdmin record with SUPERINTENDENT permissions
   - Redirects to pricing page to choose a plan
   - Can then create schools, teachers, students, and manage the district

### Demo Accounts (no database required)
| Email | Password | Role |
|-------|----------|------|
| `student@limud.edu` | `password123` | Student |
| `teacher@limud.edu` | `password123` | Teacher |
| `admin@limud.edu` | `password123` | Admin |
| `parent@limud.edu` | `password123` | Parent |
| `master@limud.edu` | `LimudMaster2026!` | Master (all roles) |

---

## Version History

### v8.8 (March 15, 2026) - Bug Fixes & Landing Page Refresh
- Fixed ADMIN registration, parent rewards, games rate action
- Balanced competitor comparison on landing page
- Improved DB error handling across all API routes

### v8.7.2 (March 13, 2026) - Render Build Fixes
- Fixed start command for standalone mode
- Fixed PORT binding for Render
- Added NEXTAUTH_SECRET auto-generation

### v8.7.1 (March 13, 2026) - Dependency Fixes
- Removed Cloudflare-only dependencies
- Pinned Prisma to 5.22.0
- Added .npmrc with legacy-peer-deps

### v8.7 (March 12, 2026) - District Admin Suite & Render Deployment
- Employee Directory, Enhanced Classrooms, Settings, Announcements, Audit Log
- Render deployment support (render.yaml, health check, server.js)

### v8.6 - AI Navigation Assistant & Internal Messaging
### v8.5.1 - Complete standalone index.html
### v8.4.1 - cPanel/GoDaddy deployment support
### v8.4 - Account model overhaul & content cleanup
### v8.3 - Product Roadmap page
### v8.2 - Pricing Overhaul & Custom Plan Builder
### v8.1 - Professional Polish & Brand Consistency
### v8.0 - Landing Page & Platform Integrations

---

## Local Development

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Start dev server (port 3000)
npm run dev

# Production build + start
npm run build
node server.js

# Database commands
npx prisma db push      # Push schema to DB
npx prisma db seed      # Seed demo data
npx prisma studio       # Visual DB browser
```

## Deployment Status
- **Platform**: Render.com
- **Status**: Active
- **Domain**: limud.co
- **Tech Stack**: Next.js 14 + TypeScript + Tailwind CSS + Prisma 5.22.0
- **Last Updated**: March 15, 2026
