# Limud - AI-Powered Adaptive Learning Platform

## Project Overview
- **Name**: Limud
- **Version**: 5.0.0
- **Goal**: Transform education with AI-powered adaptive learning, gamification, cross-platform integrations, and collaborative teacher tools
- **Stack**: Next.js 14.2 + React 18 + TypeScript + Tailwind CSS + Prisma + PostgreSQL + OpenAI
- **GitHub**: https://github.com/Fansist/Limud

## Live URLs
- **Development**: https://3000-ifjkeor7fvbg89k4c63pq-cc2fbc16.sandbox.novita.ai
- **Demo Mode**: Append `?demo=true` to any route (no login required)

## What's New (v5.0.0 - 2026-03-01)

### Platform Integrations (`/student/platforms`)
Connect and sync with external learning platforms:
- **Amplify** - Curriculum & assessment (assignments, scores, curriculum-progress)
- **i-Ready** - Adaptive diagnostics (scores, diagnostics, growth-data)
- **Khan Academy** - Free education (progress, mastery, assignments)
- **PLTW (Project Lead The Way)** - STEM programs (projects, assessments, certificates)
- **Google Classroom** - LMS (classes, assignments, grades, roster)
- **Canvas LMS** - Course management (courses, assignments, grades, rubrics)
- Connect, disconnect, manual sync, last-sync tracking per platform

### Enhanced Submission Types (`/student/assignments`)
Students can submit work in 6 formats:
- **Written** - Text-based answers with character count
- **Link / URL** - Google Docs, Slides, YouTube, GitHub links
- **Audio** - MP3, WAV, M4A recordings (up to 50MB)
- **Video** - MP4, MOV, WebM uploads (up to 100MB)
- **Code** - Monospace code editor with syntax highlighting
- **Drawing** - PNG, JPG, SVG, PDF artwork (up to 25MB)
- Plus file attachments: PDF, DOC, PPT, images, ZIP (10MB each)

### AI Lesson Planner with Worksheet Search (`/teacher/lesson-planner`)
Two tabs: **Lesson Plans** and **Find Worksheets**
- AI-generated standards-aligned lesson plans with full flow (warm-up through closure)
- Online worksheet search across education.com, Teachers Pay Teachers, K5 Learning, Common Core Sheets, Science Buddies, ReadWriteThink, PLTW
- Filter by subject, grade, topic; see ratings, download counts, free/premium status
- Save favorites, copy to clipboard

### Custom Worksheet Builder (`/teacher/worksheets`) **NEW**
Full worksheet creation tool:
- **7 question types**: Multiple Choice, True/False, Short Answer, Fill in the Blank, Matching, Essay/Long Answer, Numeric
- **AI Question Generator** - Enter a topic, select count, AI generates varied questions
- Reorder questions (up/down), duplicate, delete
- Per-question point values with auto-totaling
- Answer keys for auto-gradeable question types
- Export/copy formatted text to clipboard
- Share directly to Teacher Exchange
- Edit saved worksheets

### Teacher Exchange - Cross-District Hub (`/teacher/exchange`) **NEW**
Community marketplace for teachers across all districts:
- **Browse Resources** - Search worksheets, lesson plans, activities, assessments, presentations, projects, games
  - Filter by subject, grade level, resource type
  - Sort by Popular, Top Rated, or Newest
  - Like, save/bookmark, download resources
  - See author name, district, ratings, download counts, tags
- **Post Requests** - Ask the community for specific resources
  - e.g. "Looking for Amplify Science Unit 3 supplementals" or "Khan Academy aligned practice sets"
  - Tag with topics and platforms (Amplify, i-Ready, PLTW, Khan Academy)
  - Track response count, mark as fulfilled
- **Share Resources** - Upload your own materials
  - Categorize by type, subject, grade
  - Add descriptions and tags for discoverability
  - File upload support (PDF, DOC, PPT, images)
- **My Uploads** - Track your shared resources and their engagement
- Stats dashboard: total resources, contributing teachers, districts, downloads

### Performance Optimizations (v5.0.0)
- **Production mode server** (`next start`) - 5x less memory than dev mode (~120MB vs ~600MB+)
- **Standalone output** - Self-contained deployment with minimal dependencies
- **Shared constants** - Deduplicated SUBJECTS, GRADE_LEVELS, DURATIONS across all teacher pages
- **Unused import cleanup** - Removed 80+ unused lucide-react icon imports across 32 files
- **Enhanced tree-shaking** - Server-only packages (openai, bcryptjs) excluded from client bundles
- **Expanded optimizePackageImports** - Added react-hot-toast, react-markdown, zod
- **PM2 memory management** - Auto-restart at 400MB, proper heap limits
- **Aggressive caching headers** - Immutable static assets, no-store API routes

## All Features

### Student Portal
| Feature | Route | Description |
|---------|-------|-------------|
| Dashboard | `/student/dashboard` | XP bar, streak, coins, due-today alerts, quick actions |
| Assignments | `/student/assignments` | Submit via text, link, audio, video, code, drawing + file uploads |
| AI Tutor | `/student/tutor` | Chat with AI tutor (OpenAI or demo fallback) |
| Focus Mode | `/student/focus` | Distraction-free timer, ambient sounds, swipe questions |
| Knowledge | `/student/knowledge` | Skill mastery, radar chart, heatmap, goal countdown |
| Study Planner | `/student/study-planner` | AI-recommended study sessions |
| Exam Simulator | `/student/exam-sim` | Practice exams with AI scoring |
| Growth | `/student/growth` | Progress analytics and grade predictions |
| Rewards | `/student/rewards` | XP, coins, avatar shop |
| Game Store | `/student/games` | Buy educational games with XP |
| Daily Challenge | `/student/daily-challenge` | Daily learning challenges |
| Leaderboard | `/student/leaderboard` | Compete with classmates |
| Badges | `/student/badges` | Achievement badges collection |
| Certificates | `/student/certificates` | Downloadable certificates |
| **My Platforms** | `/student/platforms` | **Connect Amplify, i-Ready, Khan Academy, PLTW, Classroom, Canvas** |
| Study Groups | `/student/study-groups` | Collaborative study sessions |

### Teacher Portal
| Feature | Route | Description |
|---------|-------|-------------|
| Dashboard | `/teacher/dashboard` | Class overview, at-risk students, pending grading |
| Assignments | `/teacher/assignments` | Create, manage, view submissions with file downloads |
| AI Grading | `/teacher/grading` | Auto-grade + batch grade + file attachment view |
| Intelligence | `/teacher/intelligence` | Class mastery, weakest skills, engagement, risk alerts |
| Quiz Generator | `/teacher/quiz-generator` | AI-powered quiz creation |
| Lesson Planner | `/teacher/lesson-planner` | AI lesson plans + online worksheet search |
| **Worksheet Builder** | `/teacher/worksheets` | **Custom worksheets with 7 question types + AI generation** |
| **Teacher Exchange** | `/teacher/exchange` | **Cross-district resource sharing, requests, community** |
| Insights | `/teacher/insights` | Heatmap & analytics |
| Analytics | `/teacher/analytics` | Detailed performance analytics |
| Reports | `/teacher/reports` | AI-generated student reports |
| Students | `/teacher/students` | Student management |
| Game Control | `/teacher/games` | Toggle game access per classroom |

### Admin Portal
| Feature | Route | Description |
|---------|-------|-------------|
| Dashboard | `/admin/dashboard` | District overview, capacity, quick actions |
| Students | `/admin/students` | Create students + auto-create parent accounts |
| Schools | `/admin/schools` | Manage schools, transfer users |
| Classrooms | `/admin/classrooms` | Create classes, assign students, toggle games |
| Bulk Import | `/admin/provision` | CSV bulk import for students & teachers |
| Analytics | `/admin/analytics` | District-wide analytics |
| Billing | `/admin/payments` | Plan management, payment history |

### Parent Portal
| Feature | Route | Description |
|---------|-------|-------------|
| Dashboard | `/parent/dashboard` | Children's progress overview |
| Children | `/parent/children` | Manage linked children |
| Reports | `/parent/reports` | Growth reports |
| Messages | `/parent/messages` | Teacher communication |

## API Routes
55+ API routes including:
- `/api/worksheets` - CRUD for custom worksheets + AI question generation
- `/api/exchange` - Browse, upload, request resources across districts
- `/api/platforms` - Connect/sync external platforms
- `/api/submissions` - Multi-type submission handling
- `/api/lesson-plans` - AI lesson plan generation + worksheet search
- `/api/grade` - AI grading (single + batch)
- `/api/tutor` - AI tutor chat
- `/api/quiz-generator` - AI quiz generation
- `/api/games` - Game store + teacher control
- `/api/files` - File upload/download
- `/api/payments` - Payment processing
- `/api/district/*` - District management (students, teachers, schools, classrooms)

## Data Architecture
- **Database**: PostgreSQL with Prisma ORM (40+ models)
- **Auth**: NextAuth.js with JWT + credentials provider
- **AI**: OpenAI gpt-4o-mini with configurable base URL and demo fallback
- **Storage**: Base64 file storage with MIME type handling

## Environment Variables
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/limud"
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-secret-key"
OPENAI_API_KEY="your-openai-key"
OPENAI_BASE_URL="https://api.openai.com/v1"
```

## Development
```bash
npm install
npx prisma db push
npx tsx prisma/seed.ts
npm run build
pm2 start ecosystem.config.cjs
# Production server at http://localhost:3000
# Demo: http://localhost:3000/demo
```

## Tech Stack
- Next.js 14.2.21 (App Router, RSC, Standalone output)
- React 18.3.1 + TypeScript 5.7
- Tailwind CSS 3.4 + Framer Motion 11
- Prisma 5.22 + PostgreSQL
- NextAuth.js 4.24
- OpenAI API (gpt-4o-mini)
- PM2 for process management
- PWA-ready with Service Worker

## Last Updated: 2026-03-01
