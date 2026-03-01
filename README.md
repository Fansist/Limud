# Limud - AI-Powered Adaptive Learning Platform

## Project Overview
- **Name**: Limud (Hebrew: "learning")
- **Version**: 7.0.0
- **Goal**: Transform K-12 education with AI-powered tutoring, smart grading, gamification, 16+ platform integrations, and comprehensive analytics
- **Tech Stack**: Next.js 14 + TypeScript + Tailwind CSS + Prisma + NextAuth + OpenAI + Framer Motion
- **GitHub**: https://github.com/Fansist/Limud

## What's New in v7.0.0

### Platform Linking - Major Expansion (16+ Platforms)
- **Added 10 new platforms**: Schoology, Clever, IXL Learning, Quizlet, Newsela, Desmos, Kahoot!, BrainPOP, Edpuzzle, Nearpod
- **Existing 6 platforms**: Khan Academy, i-Ready, Amplify, PLTW, Google Classroom, Canvas LMS
- **Complete linking feature**: Connect, disconnect, sync, auto-sync toggle, sync status tracking, item count
- **Search & filter**: Search by name/description, filter by 14 categories (Learning, LMS, Assessment, STEM, etc.)
- **Detailed sync status**: Active/error/syncing states, last sync timestamp, items synced count
- **Security**: Encrypted credentials notice, privacy assurance, one-click disconnect
- **Platform detail expansion**: View all features and syncable data types for each platform
- **Stats dashboard**: Connected count, auto-syncing count, total items synced

### Landing Page / Home Screen - Complete Redesign
- **New integrations section**: Showcases all 16+ connected platforms with animated logos
- **Updated hero section**: Highlights "16+ integrations" badge, shows platform integration preview in dashboard mockup
- **New feature grid**: 12 feature cards covering all capabilities (AI Tutor, Lesson Planner, Quiz Generator, Auto-Grader, Gamification, Games, Platform Links, Assignment Manager, Knowledge Analytics, Game Control, Parent Portal, Admin Dashboard)
- **Updated social proof**: Now shows 16+ integrations as a stat
- **Updated pricing**: Plans now mention platform link limits (3, 10, All 16+, Unlimited)
- **Updated FAQ**: New question about which platforms are supported
- **Updated testimonials**: References i-Ready and Amplify syncing
- **Updated "How It Works"**: Step 2 now covers platform connections

### Bug Fixes & Optimization
- **Fixed 27 double-semicolon syntax errors** across all TSX files (import statements had `;;` instead of `;`)
- **Removed 541MB core dump file** that was bloating the repository
- **Knowledge page**: Already fixed hydration issues with deterministic pseudo-random for heatmap data (from v6.0)
- **All pages verified**: 15+ pages returning HTTP 200 including landing, all role dashboards, and feature pages

### Previously Implemented (v6.0 - Maintained)
- **AI Lesson Planner**: Generates specialized, detailed lesson plans with real objectives, standards, materials, warm-up, instruction, practice, assessment, closure, differentiation, and homework
- **AI Quiz Generator**: Creates curriculum-aligned quizzes with real questions, correct answers, and explanations per subject/topic
- **Game Store**: 6 games with real playable mini-games (Math Blaster, Word Quest, Trivia)
- **Game Control**: Per-class toggle, global block/unblock, game stats dashboard
- **Assignment Manager**: Categories with grade weighting (Homework 20%, Classwork 20%, Quizzes 25%, Tests 25%, Projects 10%), extra credit support, file upload (25MB), link attachments, multi-format submissions
- **Student Assignments**: Worksheet/link viewing, multi-format submissions (text, code, link, audio, video, drawing), AI feedback display

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
| My Platforms | `/student/platforms` | **16+ platform connections** with search, filter, sync |

### Teacher Features
| Feature | Path | Description |
|---------|------|-------------|
| Dashboard | `/teacher/dashboard` | Overview, class stats, pending items |
| Assignment Manager | `/teacher/assignments` | Create with categories, weights, attachments, extra credit |
| AI Grading | `/teacher/grading` | One-click rubric-based auto-grading |
| Intelligence | `/teacher/intelligence` | Student behavior insights |
| AI Quiz Generator | `/teacher/quiz-generator` | Curriculum-aligned quiz creation |
| AI Lesson Planner | `/teacher/lesson-planner` | Complete lesson plans + worksheet finder |
| Game Control | `/teacher/games` | Per-class game access toggle + stats |
| Teacher Exchange | `/teacher/exchange` | Share resources with other teachers |
| Worksheets | `/teacher/worksheets` | Worksheet library and builder |
| Reports | `/teacher/reports` | Class and student reports |
| Students | `/teacher/students` | Student management and profiles |
| Analytics | `/teacher/analytics` | At-risk identification and trends |

### Admin Features
| Feature | Path | Description |
|---------|------|-------------|
| Dashboard | `/admin/dashboard` | District overview, stats, subscription |
| Schools | `/admin/schools` | School management |
| Classrooms | `/admin/classrooms` | Classroom management |
| Students | `/admin/students` | District student management |
| Analytics | `/admin/analytics` | District-wide analytics |

### Parent Features
| Feature | Path | Description |
|---------|------|-------------|
| Dashboard | `/parent/dashboard` | Children overview, grades, progress |
| Reports | `/parent/reports` | Detailed progress reports |
| Messages | `/parent/messages` | Parent-teacher communication |

## Platform Integrations (16+)

| Platform | Category | Syncable Data |
|----------|----------|---------------|
| Khan Academy | Learning | Progress, mastery, assignments, exercise data |
| i-Ready | Assessment | Diagnostic scores, growth data, lesson progress, time on task |
| Amplify | Curriculum | Assignments, assessment scores, curriculum progress, reading levels |
| PLTW | STEM | Projects, assessments, certificates, portfolio items |
| Google Classroom | LMS | Classes, assignments, grades, roster, announcements |
| Canvas LMS | LMS | Courses, assignments, grades, rubrics, modules |
| Schoology | LMS | Courses, grades, assignments, attendance |
| Clever | SSO | Roster, app usage, login data |
| IXL Learning | Practice | Skill scores, practice data, diagnostics, time spent |
| Quizlet | Study Tools | Study sets, progress, scores, class data |
| Newsela | Reading | Reading levels, quiz scores, articles read, annotations |
| Desmos | Math Tools | Activity progress, responses, graphs saved |
| Kahoot! | Gamified | Quiz scores, participation data, reports |
| BrainPOP | Learning | Video progress, quiz scores, assignments |
| Edpuzzle | Video Learning | Video progress, responses, completion data |
| Nearpod | Interactive | Lesson progress, responses, assessments |

## Assignment System

### Categories & Weights
| Category | Default Weight | Color |
|----------|---------------|-------|
| Homework | 20% | Blue |
| Classwork | 20% | Green |
| Quizzes | 25% | Amber |
| Tests/Exams | 25% | Red |
| Projects | 10% | Purple |
| Extra Credit | Bonus (adds to total) | Pink |

### Attachment Support
- **File uploads**: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, TXT, CSV, images, ZIP (max 25MB)
- **Links**: Any URL with optional custom title
- **Worksheets**: Searchable from education.com, TeachersPayTeachers, K5 Learning, etc.
- Students can view all attachments directly from their assignment view

## API Endpoints

### Demo API (`/api/demo`)
- `GET ?type=student-assignments|student-rewards|teacher-assignments|teacher-analytics|admin-districts|parent-children|notifications|lesson-plans|messages|user`
- `POST type=generate-lesson-plan` - AI lesson plan generation
- `POST type=generate-quiz` - AI quiz generation
- `POST type=tutor-chat` - AI tutor conversation
- `POST type=grade-submission` - AI grading

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

## Data Architecture
- **Database**: PostgreSQL via Prisma ORM
- **Auth**: NextAuth.js with credentials + OAuth providers
- **AI**: OpenAI GPT for tutoring, grading, lesson planning, quiz generation
- **Storage**: Prisma for all relational data
- **State**: React state + Zustand for global state
- **Demo Mode**: Full-featured demo mode via `?demo=true` URL parameter

## Deployment
- **Platform**: Vercel / Cloudflare Pages compatible
- **Status**: Active
- **Last Updated**: March 1, 2026
- **Build**: `npx next build` (all 15+ pages compile successfully)
- **Dev Server**: `pm2 start ecosystem.config.cjs` on port 3000

## Version History

### v7.0.0 (March 1, 2026) - Platform Expansion & Landing Page Redesign
- Added 10 new educational platform integrations (total: 16+)
- Complete platform linking with search, filter, sync status, auto-sync toggle
- Landing page redesign with integrations section, updated features grid, pricing
- Fixed 27 double-semicolon syntax errors across codebase
- Removed 541MB core dump file
- All pages verified working (HTTP 200)

### v6.0.0 (March 1, 2026) - Major Feature Overhaul
- Specialized AI lesson plan generation (not generic templates)
- Specialized AI quiz generation with real curriculum content
- Interactive game store with playable mini-games
- Game control with per-class toggles and stats
- Assignment categories with grade weighting
- Extra credit assignment support
- File and link attachments for assignments
- Knowledge page hydration fix

### v5.0.0 - Full Optimization
- Performance optimization across all pages
- Reduced bundle sizes
- Improved loading states

### v4.0.0 - Worksheet Builder & Teacher Exchange
- Worksheet builder and template library
- Teacher resource exchange platform
- Enhanced submission types

### Earlier Versions
- Core platform with student, teacher, admin, parent dashboards
- AI tutor with Socratic questioning
- Gamification engine (XP, levels, streaks, coins)
- Accessibility suite (dyslexia font, high contrast, TTS)
- FERPA & COPPA compliance framework

## User Guide

### For Teachers
1. Visit any teacher page with `?demo=true` to explore features
2. **Create assignments** with the Assignment Manager - set categories, weights, and attach files/links
3. **Generate lesson plans** with the AI Lesson Planner - get complete, standards-aligned plans
4. **Generate quizzes** with the AI Quiz Generator - get curriculum-aligned questions
5. **Control games** per-class during instruction time

### For Students
1. Visit any student page with `?demo=true` to explore features
2. **Connect platforms** like Khan Academy, i-Ready, Google Classroom to sync progress
3. **Use AI Tutor** for homework help with Socratic guidance
4. **Play educational games** purchased from the Game Store
5. **Track progress** on the Knowledge dashboard with skill radar and study heatmap

### For Administrators
1. Visit `/admin/dashboard?demo=true` for the admin overview
2. Manage schools, classrooms, and students
3. Monitor district-wide analytics

### For Parents
1. Visit `/parent/dashboard?demo=true` for the parent view
2. Track children's grades, progress, and reward activity
3. Communicate with teachers via messaging
