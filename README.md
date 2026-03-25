# Limud — AI-Powered Adaptive Learning Platform

## Project Overview
- **Name**: Limud (Hebrew: "learning")
- **Version**: 9.5.0
- **Mission**: Limud is built for students who learn differently. Our mission is to embrace and support diverse learning styles at every level of the experience.
- **Slogan**: "Every mind learns differently."
- **Goal**: Transform K-12 education with AI-powered tutoring, smart grading, gamification, 16+ platform integrations, and comprehensive analytics
- **Security**: Enterprise-grade FERPA + COPPA + OWASP Top 10 compliant security for children's data protection
- **Tech Stack**: Next.js 14 + TypeScript + Tailwind CSS + Prisma + NextAuth + Google Gemini + Framer Motion
- **Domain**: https://limud.co
- **GitHub**: https://github.com/Fansist/Limud
- **Hosting**: Render.com (primary), also supports cPanel/GoDaddy

---

## What's New in v9.5.0 — Feature Consolidation, Assignment Diff & Performance

### 1. Consolidated Teacher Analytics (3-in-1)

Three formerly separate teacher pages have been merged into a single **tabbed Analytics page** (`/teacher/analytics`):

| Tab | Content | Old URL |
|-----|---------|---------|
| **Overview** | Student scores, score distribution chart, at-risk students, search | `/teacher/analytics` |
| **Insights & Heatmap** | Misconception heatmap, skill gaps, performance predictions | `/teacher/insights` |
| **Learning Styles** | Student learning profiles, AI adaptations, solving methods | `/teacher/learning-insights` |
| **Assignment Diff** | Side-by-side original vs AI-adapted assignment comparison | NEW |

**Backward compatibility**: The old URLs (`/teacher/insights`, `/teacher/learning-insights`) now **redirect** to the corresponding tabs. No bookmarks will break.

### 2. Consolidated Student Analytics (2-in-1)

Two student pages merged into a single **tabbed Analytics page** (`/student/knowledge`):

| Tab | Content | Old URL |
|-----|---------|---------|
| **Knowledge Map** | Radar chart, skill mastery, study heatmap, goals, rank | `/student/knowledge` |
| **Growth & Predictions** | Mastery overview, predicted grade, skill map by category | `/student/growth` |

**Backward compatibility**: `/student/growth` redirects to `/student/knowledge?tab=growth`.

### 3. Assignment Diff View (NEW)

Teachers can now compare the **original assignment** with **AI-adapted versions** side-by-side:
- Select any adaptive-enabled assignment from the list
- Switch between adapted versions for each student
- **Side-by-side mode**: Original and adapted content rendered in parallel columns
- **Changes-only mode**: See just the AI modifications list
- Shows learning style, difficulty adjustment, and suggested method

API: `GET /api/teacher/assignment-diff` (list) and `GET /api/teacher/assignment-diff?assignmentId=X` (full diff data)

### 4. Performance Optimizations for Concurrent Users

- **Server hardening**: Graceful shutdown (SIGTERM/SIGINT), uncaught exception handling prevents crashes
- **Prisma connection pooling**: Singleton pattern with optimized logging (warn+error in dev, error-only in prod)
- **Static asset caching**: Immutable hashing for `/_next/static/`, 1-day cache for favicon
- **API no-cache**: All `/api/*` routes return `Cache-Control: no-store`
- **Parallel data loading**: Teacher analytics loads all 3 data sources in parallel (`Promise.allSettled`)
- **Memory tracking**: Health endpoint now reports heap memory usage

### 5. Update Safety (No Breaking Changes)

- **No schema changes**: v9.5 adds NO new database columns or tables — `prisma db push` is safe
- **Old URLs redirect**: All old page URLs redirect to their new consolidated locations
- **API endpoints preserved**: All existing API endpoints work exactly as before
- **How to update safely**:
  1. `git pull origin main`
  2. `npm install`
  3. `npm run build`
  4. Restart the server (or Render auto-deploys)
  5. No database migration needed

### 6. Navigation Cleanup

**Teacher sidebar** (14 → 12 items):
- Removed "Learning Styles" and "Insights & Heatmap" (consolidated into Analytics)
- "Analytics" now contains all insights, heatmaps, learning styles, and diff view

**Student sidebar** (15 → 14 items):
- Removed "Growth Analytics" (consolidated into Analytics/Knowledge)
- "Knowledge" renamed to "Analytics"

---

## Complete Render Deployment Tutorial

### Prerequisites
1. A [Render.com](https://render.com) account (free tier works)
2. A [PostgreSQL database](https://render.com/docs/databases) (Render provides free PostgreSQL)
3. A [Google Gemini API key](https://aistudio.google.com/apikey) (free tier: 15 req/min)
4. Source code pushed to GitHub

### Step 1: Create a PostgreSQL Database

1. Go to **Render Dashboard** → **New** → **PostgreSQL**
2. Name: `limud-db`
3. Region: Choose closest to your users (e.g., Ohio for US East)
4. Plan: **Free** (90-day limit) or **Starter** ($7/mo, persistent)
5. Click **Create Database**
6. Copy the **Internal Database URL** (starts with `postgresql://...`)

### Step 2: Create a Web Service

1. Go to **Render Dashboard** → **New** → **Web Service**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `limud`
   - **Region**: Same as your database
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: **Free** (spins down after 15 min idle) or **Starter** ($7/mo, always-on)

### Step 3: Set Environment Variables

In the Render web service settings, add these environment variables:

| Variable | Value | Required |
|----------|-------|----------|
| `DATABASE_URL` | `postgresql://user:pass@host:5432/dbname` (from Step 1) | Yes |
| `NEXTAUTH_SECRET` | Run `openssl rand -base64 32` to generate | Yes |
| `NEXTAUTH_URL` | `https://your-app.onrender.com` (or custom domain) | Yes |
| `GEMINI_API_KEY` | Your Google Gemini API key | Yes |
| `NODE_ENV` | `production` | Yes |
| `AI_MODEL` | `gemini-2.0-flash` (optional, this is the default) | No |
| `PII_ENCRYPTION_KEY` | `openssl rand -base64 32` (optional, falls back to NEXTAUTH_SECRET) | No |

### Step 4: Initialize the Database

After the first deploy succeeds, open the Render **Shell** tab and run:

```bash
# Push the Prisma schema to create all tables
npx prisma db push

# (Optional) Seed with demo data
npx tsx prisma/seed.ts
```

### Step 5: Set Up Custom Domain (Optional)

1. In Render → Your Service → **Settings** → **Custom Domains**
2. Add your domain (e.g., `limud.co`)
3. Add the DNS records Render provides to your domain registrar
4. Update `NEXTAUTH_URL` to your custom domain

### Step 6: Verify Deployment

```bash
# Check health
curl https://your-app.onrender.com/api/health

# Expected response:
# {"status":"ok","version":"9.5.0","platform":"Render","uptime":42.5}
```

### Updating the App

When you push changes to the `main` branch, Render automatically rebuilds and redeploys.

**Manual update:**
1. Push to GitHub: `git push origin main`
2. Render detects the push and starts a new build
3. Build runs: `npm install && npm run build`
4. Deploy runs: `npm start` (which runs `node server.js`)

**If you added new Prisma schema changes:**
1. After deploy, go to Render Shell
2. Run: `npx prisma db push`
3. The app will automatically pick up the new schema

### Troubleshooting

| Issue | Solution |
|-------|----------|
| App shows "Application Error" | Check Render logs for the error. Usually a missing env var. |
| Database connection refused | Ensure DATABASE_URL uses the **Internal** URL and same region |
| Login doesn't work | Verify NEXTAUTH_SECRET is set and NEXTAUTH_URL matches your domain |
| AI features return fallback data | Check GEMINI_API_KEY is valid. Test at https://aistudio.google.com |
| Build fails with OOM | Upgrade to Starter plan (512MB→1GB RAM). Free tier has 512MB limit. |
| App is slow after idle | Free tier spins down after 15 min. First request takes ~30s to cold start. |

### render.yaml (Alternative: Infrastructure as Code)

Place this at the project root for one-click deploy:

```yaml
services:
  - type: web
    name: limud
    runtime: node
    plan: starter
    buildCommand: npm install && npm run build
    startCommand: npm start
    healthCheckPath: /api/health
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: limud-db
          property: connectionString
      - key: NEXTAUTH_SECRET
        generateValue: true
      - key: NEXTAUTH_URL
        value: https://limud.onrender.com
      - key: GEMINI_API_KEY
        sync: false

databases:
  - name: limud-db
    plan: starter
    databaseName: limud
    user: limud
```

---

## API Endpoints (Key Routes)

### Authentication
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/[...nextauth]` | GET/POST | NextAuth.js authentication |
| `/api/auth/register` | POST | Create new account |
| `/api/auth/forgot-password` | POST | Password reset email |
| `/api/auth/reset-password` | POST | Reset password with token |

### Student APIs
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/skills` | GET | Student skill mastery data |
| `/api/rewards` | GET | Gamification stats (XP, level, streak) |
| `/api/study-next` | GET | AI-recommended next study action |
| `/api/confidence` | GET | Confidence/mastery analysis |
| `/api/tutor` | POST | AI tutor conversation |
| `/api/focus` | GET/POST | Focus mode questions |
| `/api/submissions` | GET/POST | Assignment submissions |

### Teacher APIs
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/analytics` | GET | Student performance overview |
| `/api/teacher/insights` | GET | Misconception heatmap & predictions |
| `/api/teacher/learning-insights` | GET | Student learning styles & adaptations |
| `/api/teacher/assignment-diff` | GET | Original vs adapted assignment comparison |
| `/api/adaptive` | GET/POST | Generate/retrieve adapted assignments |
| `/api/grade` | POST | AI auto-grading |
| `/api/quiz-generator` | POST | AI quiz generation |

### Admin APIs
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/provision` | POST | Bulk import students/teachers |
| `/api/security` | GET/POST | Security dashboard & audit logs |

---

## URLs
- **Production**: https://limud.co
- **GitHub**: https://github.com/Fansist/Limud
- **Health Check**: https://limud.co/api/health

## Data Architecture
- **Database**: PostgreSQL (Prisma ORM)
- **Auth**: NextAuth.js (JWT strategy, 24-hour sessions)
- **AI**: Google Gemini via @google/genai SDK
- **Storage**: Prisma + PostgreSQL

## Deployment
- **Platform**: Render.com
- **Status**: Active
- **Branch**: main
- **Tech Stack**: Next.js 14 + TypeScript + TailwindCSS + Prisma + NextAuth
- **Security Level**: Enterprise (FERPA + COPPA + OWASP Top 10)
- **Last Updated**: 2026-03-25

---

## Render Environment Variables (REQUIRED)

| Variable | Required | Description |
|---|---|---|
| `NEXTAUTH_SECRET` | Yes | Fixed secret — `openssl rand -base64 32`. NEVER use generateValue. |
| `NEXTAUTH_URL` | Yes | `https://limud.co` (or your domain) |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `GEMINI_API_KEY` | Yes | Google Gemini API key (from https://aistudio.google.com/apikey) |
| `AI_MODEL` | No | AI model override (default: `gemini-2.0-flash`) |
| `PII_ENCRYPTION_KEY` | No | Separate key for PII encryption (falls back to NEXTAUTH_SECRET) |
| `NODE_ENV` | Yes | `production` |
