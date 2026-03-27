<p align="center">
  <strong>Limud</strong> &mdash; AI-Powered Adaptive Learning Platform
</p>

<p align="center">
  <em>"Every mind learns differently."</em>
</p>

<p align="center">
  <a href="https://limud.co">limud.co</a> &bull;
  <a href="https://github.com/Fansist/Limud">GitHub</a> &bull;
  v9.6.1
</p>

---

# Limud

**Limud** (Hebrew: "learning") is a full-stack, AI-powered adaptive learning platform built for K-12 education. It is designed from the ground up for students who learn differently — visual, auditory, kinesthetic, reading-based, and ADHD-friendly modes are all first-class citizens. Limud serves self-learners, homeschool families, individual teachers, and entire school districts through a single unified product.

The platform combines **Google Gemini AI** with **cognitive science algorithms** (SM-2 spaced repetition, adaptive difficulty targeting, learning DNA profiling) and a **comprehensive gamification system** (XP, levels, streaks, coins, badges, leaderboards, avatar shop, educational games) to create a deeply personalized and engaging learning experience.

Limud is **enterprise-grade**: FERPA-compliant, COPPA-compliant, and hardened against the OWASP Top 10. Security is not an afterthought — it is built into every layer, from AES-256-GCM field-level PII encryption to brute-force lockout, CSRF protection, rate limiting, and 7-year audit log retention.

---

## Table of Contents

1. [Company & Mission](#company--mission)
2. [Who Is Limud For?](#who-is-limud-for)
3. [Core Technology Stack](#core-technology-stack)
4. [Platform Architecture](#platform-architecture)
5. [Feature Overview](#feature-overview)
   - [AI Engine](#1-ai-engine)
   - [Adaptive Learning & Cognitive Science](#2-adaptive-learning--cognitive-science)
   - [Gamification System](#3-gamification-system)
   - [Student Portal](#4-student-portal-15-pages)
   - [Teacher Portal](#5-teacher-portal-12-pages)
   - [Admin / District Portal](#6-admin--district-portal-12-pages)
   - [Parent Portal](#7-parent-portal-3-pages)
   - [Homeschool Portal](#8-homeschool-portal-5-pages)
   - [Accessibility](#9-accessibility)
   - [Platform Integrations](#10-platform-integrations-16)
   - [Security & Compliance](#11-security--compliance)
6. [Data Architecture](#data-architecture)
7. [Complete API Reference](#complete-api-reference)
8. [All Application Pages](#all-application-pages)
9. [Subscription Tiers & Pricing](#subscription-tiers--pricing)
10. [Deployment Guide (Render)](#deployment-guide-render)
11. [Environment Variables](#environment-variables)
12. [Development Setup](#development-setup)
13. [Changelog](#changelog)
14. [Roadmap](#roadmap)
15. [Links & URLs](#links--urls)

---

## Company & Mission

**Limud Education Inc.** was founded with one core belief: **every mind learns differently**. Traditional education forces all students through a single mold — the same textbooks, the same lectures, the same tests. Students with ADHD, dyslexia, or who are simply visual or kinesthetic learners are left behind.

Limud fixes this by using AI to detect each student's unique learning style and automatically adapting every piece of content — assignments, quizzes, tutoring conversations, and study plans — to match how their brain works best.

### Mission Statement

> To embrace and support diverse learning styles at every level of the educational experience — from how students learn, to how teachers teach, to how parents stay involved.

### Core Principles

- **Adaptive, Not One-Size-Fits-All** — AI detects whether a student is visual, auditory, kinesthetic, or reading-oriented and adapts all content accordingly.
- **Engagement Through Gamification** — XP, levels, streaks, coins, badges, leaderboards, and educational games make learning genuinely fun.
- **Teacher Empowerment** — AI auto-grading, quiz generation, misconception heatmaps, and method insights free teachers to focus on teaching.
- **Parent Visibility** — Real-time dashboards, AI-powered check-ins, and growth reports keep parents informed without being intrusive.
- **Enterprise Security** — FERPA, COPPA, and OWASP compliance with field-level encryption, audit logging, and role-based access control.
- **Accessible to Everyone** — Free forever for homeschool families and self-learners. Affordable per-student pricing for schools.

---

## Who Is Limud For?

| Audience | How Limud Helps | Pricing |
|---|---|---|
| **Self-Learners** | AI adapts to your learning style, gamified progress, study planner, exam simulator | Free forever |
| **Homeschool Families** | Parent dashboard, AI check-ins, assignment management, gamification, up to 5 students | Free forever |
| **Individual Teachers** | AI grading, quiz generation, worksheet builder, student analytics | Free / Starter |
| **School Districts** | Multi-school management, CSV bulk provisioning, compliance dashboards, billing, 16+ LMS integrations | From $2/student/mo |
| **Students (K-12)** | Adaptive AI tutor, focus mode, exam simulator, educational games, rewards, leaderboards | Through school/parent |
| **Parents** | Real-time grade visibility, AI-powered safety check-ins, growth reports, goal tracking | Through school/free plan |

---

## Core Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | Next.js 14 (App Router) | Full-stack React framework with server-side rendering |
| **Language** | TypeScript (strict mode) | Type-safe development across frontend and backend |
| **Styling** | Tailwind CSS 3.4 | Utility-first CSS framework |
| **Animations** | Framer Motion 11 | Page transitions, micro-interactions, dashboard animations |
| **Database** | PostgreSQL (Prisma ORM 5.22) | Relational data with 66 models, full schema validation |
| **Authentication** | NextAuth.js 4 (JWT) | Credential-based auth with 24-hour JWT sessions |
| **AI** | Google Gemini 2.0 Flash (@google/genai) | AI tutoring, grading, quiz generation, content adaptation |
| **Icons** | Lucide React 0.468 | Consistent icon set across all portals |
| **Charts** | Recharts 2.15 | Data visualization (bar, line, radar, pie charts) |
| **State** | Zustand 5 | Lightweight global state management |
| **Validation** | Zod 3.24 | Runtime schema validation for all API inputs |
| **File Parsing** | PapaParse 5.4 | CSV import/export for bulk provisioning |
| **Toasts** | React Hot Toast 2.4 | User notifications and feedback |
| **Markdown** | React Markdown 9 | AI tutor response rendering |
| **Date** | date-fns 4.1 | Date formatting and calculations |
| **Crypto** | bcryptjs 2.4 | Password hashing (NIST SP 800-63B compliant) |
| **Hosting** | Render.com | Primary production hosting (also supports cPanel) |
| **Runtime** | Node.js 20.x (pinned) | Server runtime (pinned to avoid Prisma 7.x breaking change) |

---

## Platform Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                          │
│  Next.js App Router + Tailwind CSS + Framer Motion + Recharts   │
├─────────────────────────────────────────────────────────────────┤
│                     EDGE MIDDLEWARE (v9.4.0)                      │
│  Bot blocking, path protection, RBAC, rate limiting (200/min),   │
│  security headers (HSTS, CSP, X-Frame, CORP), request IDs       │
├─────────────────────────────────────────────────────────────────┤
│                      NEXT.JS API ROUTES                          │
│  75+ API endpoints organized by domain:                          │
│  /api/auth, /api/student, /api/teacher, /api/admin, /api/parent │
├─────────────────────────────────────────────────────────────────┤
│                        CORE ENGINES                              │
│  ┌──────────┐ ┌───────────┐ ┌──────────┐ ┌───────────────────┐ │
│  │ AI Engine│ │ Cognitive │ │ Gamific. │ │ Security Engine   │ │
│  │ (Gemini) │ │ Science   │ │ Engine   │ │ (FERPA/COPPA)     │ │
│  └──────────┘ └───────────┘ └──────────┘ └───────────────────┘ │
│  ┌──────────┐ ┌───────────┐ ┌──────────┐ ┌───────────────────┐ │
│  │ Learning │ │ Subscript.│ │ Demo     │ │ Performance       │ │
│  │ DNA      │ │ Manager   │ │ Mode     │ │ Monitor           │ │
│  └──────────┘ └───────────┘ └──────────┘ └───────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│                    DATA LAYER (Prisma ORM)                        │
│  PostgreSQL — 66 models, 9 enums, full relational integrity      │
│  Connection pooling, singleton pattern, optimized logging        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Feature Overview

### 1. AI Engine

Powered by **Google Gemini 2.0 Flash** via the `@google/genai` SDK. Configurable model (supports gemini-2.5-flash, gemini-2.5-pro, etc. via `AI_MODEL` env var). Falls back to rich demo mode when no API key is configured.

| Feature | Description |
|---|---|
| **AI Tutor** | Socratic questioning — never gives direct answers. Guides students to discover solutions. Age-appropriate language. All conversations logged for parent/teacher review. Personalized to student's survey data (hobbies, games, movies, dream job). |
| **AI Auto-Grader** | One-click rubric-based grading for essays, short answers, and projects. Returns scores, feedback, and improvement suggestions. |
| **AI Quiz Generator** | Generates curriculum-aligned quizzes with multiple choice and short answer questions. Filtered by subject, topic, and difficulty. Built-in quiz banks for Math (Algebra, Geometry, Fractions), Science, History, and more. |
| **AI Assignment Adapter** | Takes teacher-created assignments and generates personalized versions for each student based on their learning style, difficulty level, and method preference. |
| **AI Parent Check-In** | Parents can ask the AI for a summary of their child's recent academic performance, emotional engagement, study habits, and areas needing attention. |
| **AI Reports** | Automated generation of student progress reports for teachers, analyzing grades, participation, and growth trends. |
| **AI Teacher Intelligence** | Aggregated insights across all students — class-wide trends, at-risk identification, method preferences. |
| **AI Navigator** | In-app AI assistant accessible from any page, providing contextual help and guidance. |
| **AI Worksheet Search** | Search 87+ curated worksheets filtered by subject, grade level, and topic. |

**AI Safety**: The AI tutor uses a carefully crafted system prompt that enforces Socratic questioning, prohibits direct answers, uses age-appropriate language, encourages rather than discourages, and keeps responses concise. When a student's survey data is available, the prompt is enriched with their interests for relatable analogies.

### 2. Adaptive Learning & Cognitive Science

Limud's cognitive engine (`src/lib/cognitive-engine.ts`) implements research-backed learning algorithms:

| Algorithm | Implementation | Purpose |
|---|---|---|
| **SM-2 Spaced Repetition** | `calculateSM2()` function with quality scores 0-5, ease factor adjustment, interval scheduling | Optimizes long-term memory retention by spacing review sessions |
| **Adaptive Difficulty Targeting** | 5 levels (Beginner, Easy, Medium, Hard, Advanced) with 70-85% optimal success zone | Keeps students in their "zone of proximal development" |
| **Learning DNA Profiling** | `src/lib/learning-dna.ts` — cognitive speed, retention rate, learning modality, peak study hours | Builds a long-term learner profile that improves over time |
| **Modality Detection** | Analyzes video completion, reading speed, quiz-vs-project preference, tutor usage | Automatically classifies students as visual, auditory, kinesthetic, or reading learners |
| **Peak Hour Calculation** | Sliding 2-hour window analysis of session timestamps | Recommends optimal study times based on when students perform best |
| **Interleaving** | Mixed-topic practice sessions | Improves long-term transfer and reduces interference |
| **Active Recall** | Quiz-based retrieval practice | Strengthens memory through effortful retrieval |

**Caching**: The Learning DNA engine uses in-memory caching (5-minute TTL, max 500 entries) to minimize database queries during batch operations.

### 3. Gamification System

The gamification engine (`src/lib/gamification.ts`) drives student engagement through multiple reward mechanisms:

| Mechanic | Details |
|---|---|
| **Experience Points (XP)** | Assignment submit: 25 XP, Complete: 50 XP, Perfect score: 100 XP, High score (90%+): 50 XP, Tutor session: 15 XP, Daily login: 10 XP |
| **Levels** | 1 level per 250 XP. Level-up triggers a notification and coin bonus. |
| **Streaks** | Consecutive daily study days. Bonuses at 7-day (75 XP, 20 coins), 14-day (150 XP, 50 coins), and 30-day (300 XP) milestones. |
| **Virtual Coins** | Earned through gameplay. Spent in the avatar shop on cosmetic items. Assignment complete: 10 coins, Perfect: 25 coins, High: 15 coins, Level-up: 30 coins. |
| **Badges** | Achievement-based — dedicated badges page with unlockable badge categories. |
| **Leaderboard** | Student rankings by XP, visible on a dedicated leaderboard page. |
| **Certificates** | Awarded for course completion, achievement milestones. Types: `course_completion`, `achievement`, `milestone`. |
| **Daily Challenges** | Fresh challenges every day — quick quizzes, focus tasks, or skill drills. |
| **Educational Games** | Math Blaster, Word Quest, Science Puzzles, History Trivia — purchasable from the Game Store with coins. |
| **Season Pass** | Progressive seasonal rewards tracked via `SeasonPassProgress` model. |
| **Daily Boosts** | Daily login bonuses tracked per user. |

### 4. Student Portal (15 pages)

The student experience is a full-featured learning environment:

| Page | Route | Description |
|---|---|---|
| **Dashboard** | `/student/dashboard` | Welcome banner, XP/level/streak/coins display, quick-access cards (Assignments, AI Tutor, Games, Rewards), recent activity |
| **Assignments** | `/student/assignments` | View and submit assignments. Types: essay, multiple choice, short answer, project, quiz |
| **AI Tutor** | `/student/tutor` | Conversational AI tutor with Socratic questioning, Markdown rendering, conversation history |
| **Focus Mode** | `/student/focus` | Distraction-free study environment with timed questions and focus tracking |
| **Analytics** | `/student/knowledge` | Tabbed view: **Knowledge Map** (radar chart, skill mastery, study heatmap, goals, rank) and **Growth & Predictions** (mastery overview, predicted grade, skill map by category) |
| **Study Planner** | `/student/study-planner` | AI-recommended study schedule based on upcoming assignments and spaced repetition intervals |
| **Exam Simulator** | `/student/exam-sim` | Practice exams with timed conditions, question banks, immediate feedback |
| **Rewards** | `/student/rewards` | XP breakdown, level progress bar, streak calendar, coin balance, avatar shop |
| **Game Store** | `/student/games` | Browse and purchase educational games using virtual coins |
| **Daily Challenge** | `/student/daily-challenge` | Daily quiz or task for streak bonuses |
| **Leaderboard** | `/student/leaderboard` | Class/school rankings by XP |
| **Badges** | `/student/badges` | Badge collection with unlock progress |
| **Certificates** | `/student/certificates` | Downloadable certificates for completed milestones |
| **Messages** | `/student/messages` | In-app messaging with teachers and classmates |
| **My Platforms** | `/student/platforms` | Connected third-party platform integrations (Khan Academy, Google Classroom, etc.) |

Additional student pages: **Survey** (`/student/survey`) for learning style assessment, **Study Groups** (`/student/study-groups`), **Growth** (`/student/growth`, redirects to Analytics).

### 5. Teacher Portal (12 pages)

Teachers get a comprehensive toolkit for managing classrooms and understanding students:

| Page | Route | Description |
|---|---|---|
| **Dashboard** | `/teacher/dashboard` | Overview cards, recent submissions, class performance snapshot, quick actions |
| **Assignments** | `/teacher/assignments` | Create, edit, and manage assignments. Set type, difficulty, due dates. Toggle adaptive AI mode. |
| **AI Grading** | `/teacher/grading` | One-click AI grading with rubric-based scoring, feedback, and improvement suggestions |
| **Intelligence** | `/teacher/intelligence` | AI-powered class-wide insights — at-risk students, engagement patterns, teaching recommendations |
| **AI Quiz Generator** | `/teacher/quiz-generator` | Generate curriculum-aligned quizzes by subject, topic, difficulty, and question count |
| **Worksheet Builder** | `/teacher/worksheets` | Search and select from 87+ curated worksheets by subject, grade, topic |
| **Teacher Exchange** | `/teacher/exchange` | Share and discover teaching resources with other educators |
| **Analytics** | `/teacher/analytics` | 4-tab consolidated view: **Overview** (scores, distribution, at-risk), **Insights & Heatmap** (misconception heatmap, skill gaps, predictions), **Learning Styles** (student profiles, AI adaptations, solving methods), **Assignment Diff** (side-by-side original vs AI-adapted content) |
| **AI Reports** | `/teacher/reports` | Generate AI-written progress reports for individual students or entire classes |
| **My Students** | `/teacher/students` | Full student roster with performance data, learning DNA, and contact info |
| **Game Control** | `/teacher/games` | Monitor and manage which games are available to students |
| **Messages** | `/teacher/messages` | In-app messaging with students and parents |

**Backward Compatibility**: Old URLs `/teacher/insights` and `/teacher/learning-insights` redirect to the corresponding Analytics tabs.

### 6. Admin / District Portal (12 pages)

District administrators have full control over their organization:

| Page | Route | Description |
|---|---|---|
| **Dashboard** | `/admin/dashboard` | District overview — total students, teachers, schools, engagement metrics, recent announcements |
| **Employees** | `/admin/employees` | Manage teachers, staff, and district-level personnel |
| **Students** | `/admin/students` | District-wide student roster, search, filter, and manage |
| **Schools** | `/admin/schools` | Multi-school management within the district |
| **Classrooms** | `/admin/classrooms` | View and manage all classrooms across schools |
| **Announcements** | `/admin/announcements` | Create, edit, pin, and delete district-wide announcements. Full CRUD via `/api/district/announcements` |
| **Bulk Import** | `/admin/provision` | CSV upload for mass provisioning of students and teachers |
| **Analytics** | `/admin/analytics` | District-wide analytics — usage, performance trends, compliance metrics |
| **Billing** | `/admin/payments` | Subscription management, payment history, invoices |
| **Settings** | `/admin/settings` | District configuration, branding, feature toggles |
| **Audit Log** | `/admin/audit` | Complete audit trail — who accessed what, when, from where. 7-year retention per FERPA. |
| **Security** | `/admin/security` | Security dashboard — failed logins, rate limit events, threat detection, data access logs |

**District Access Levels**: The platform supports 7 levels of district administration:
- Superintendent
- Assistant Superintendent
- Curriculum Director
- Principal
- Vice Principal
- District Employee
- IT Admin

### 7. Parent Portal (3 pages)

Parents stay connected to their child's education without being overbearing:

| Page | Route | Description |
|---|---|---|
| **Dashboard** | `/parent/dashboard` | Real-time view of children's grades, assignments, streaks, recent activity |
| **Messages** | `/parent/messages` | Direct messaging with teachers |
| **Growth Reports** | `/parent/reports` | AI-powered growth summaries, trend analysis, areas of concern |

**Parent API Endpoints**: `/api/parent` (overview), `/api/parent/ai-checkin` (AI safety check-in), `/api/parent/goals` (goal tracking), `/api/parent/reports` (detailed reports).

### 8. Homeschool Portal (5 pages)

Homeschool parents get a hybrid teacher-parent experience:

| Page | Route | Description |
|---|---|---|
| **My Children** | `/parent/dashboard` | Overview of all children's progress |
| **Manage Children** | `/parent/children` | Add/remove children, configure learning profiles |
| **Assignments** | `/teacher/assignments` | Create and manage assignments (teacher capabilities) |
| **AI Grading** | `/teacher/grading` | Grade children's work with AI assistance |
| **Analytics** | `/teacher/analytics` | View children's learning analytics |

### 9. Accessibility

Limud includes a built-in accessibility panel available on all dashboard pages:

| Feature | Description |
|---|---|
| **High Contrast Mode** | Toggle high-contrast colors for visual impairment |
| **Dyslexia Font** | Switch to OpenDyslexic or similar dyslexia-friendly typeface |
| **Text Size Control** | Adjustable text size (small, medium, large, extra-large) |
| **Text-to-Speech** | Select any text and hear it read aloud, or auto-read main content |
| **WCAG Compliance** | Core pages designed to WCAG 2.1 AA standards |
| **Lite Mode** | Performance toggle that disables animations and blur effects for lower-end devices |

### 10. Platform Integrations (16+)

Limud connects with the tools schools already use:

- **Khan Academy** — Syncs progress and supplements with AI features
- **Google Classroom** — Assignment sync, grade passback
- **Canvas LMS** — LTI integration
- **IXL** — Skill practice alignment
- **Quizlet** — Flashcard and study set integration
- **Clever** — Single sign-on and roster sync
- **ClassDojo** — Behavior and parent communication
- **Nearpod** — Interactive lesson integration
- **Kahoot!** — Game-based learning
- **Edpuzzle** — Video lesson tracking
- **Seesaw** — Digital portfolio
- **Schoology** — LMS integration
- **BrainPOP** — Animated educational content
- **Desmos** — Math visualization
- **Prodigy** — Math game alignment
- **Duolingo** — Language learning progress
- And more via the Platforms page (`/student/platforms`)

### 11. Security & Compliance

The security engine (`src/lib/security.ts`, 1,000 lines) provides enterprise-grade protection:

#### Compliance

| Standard | Status | Details |
|---|---|---|
| **FERPA** | Compliant | Family Educational Rights and Privacy Act. Access control, audit logging, 7-year retention, data minimization. |
| **COPPA** | Compliant | Children's Online Privacy Protection Act. Parental consent tracking, minimal data collection, age-appropriate content. |
| **OWASP Top 10** | Mitigated | XSS prevention, SQL injection protection, CSRF tokens, input sanitization, rate limiting, security headers. |
| **NIST SP 800-63B** | Followed | Password policy: min 10 chars, max 128, uppercase + lowercase + numbers required. Breach-checking enabled. |

#### Security Features

| Feature | Configuration |
|---|---|
| **Rate Limiting** | Global: 60 req/min per IP. Auth: 5/min. Register: 3/min. API: 100/min. AI: 10/min. Upload: 5/min. PII access: 20/min. |
| **Brute-Force Protection** | Lockout after 5 failed logins. 15-minute lockout, doubling each time (escalation factor 2), max 24 hours. |
| **PII Encryption** | AES-256-GCM field-level encryption. 32-byte key, 16-byte IV and tag. |
| **CSRF Protection** | 32-byte tokens with 1-hour expiry and timing-safe validation. |
| **Session Security** | 24-hour max age, 4-hour idle timeout, max 5 concurrent sessions, secure/HttpOnly/lax cookies. |
| **Audit Logging** | 7-year retention per FERPA. Max 10,000 in-memory logs, batch flush at 1,000. |
| **Input Sanitization** | XSS, SQL injection, prototype pollution prevention. Max payload: 100KB. Max string: 10,000 chars. |
| **Security Headers** | HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, COOP, CORP. |
| **Bot Detection** | Blocks sqlmap, nikto, nmap, masscan, dirbuster, gobuster, wpscan, and 15+ other scanner user agents. |
| **Path Protection** | Blocks path traversal, null byte injection, WordPress/phpMyAdmin scanning, .env access attempts. |
| **Edge Middleware** | Runs on EVERY request. RBAC enforcement, 200 req/min global rate limit, 10 auth req/min. Custom request IDs. |
| **IP/Email Masking** | PII is masked in logs (e.g., `j***@example.com`, `192.168.***`). |

---

## Data Architecture

### Database

- **Engine**: PostgreSQL
- **ORM**: Prisma 5.22.0 (pinned to avoid Prisma 7.x breaking changes)
- **Schema Version**: v5.0
- **Total Models**: 66
- **Total Enums**: 9

### Enums

| Enum | Values |
|---|---|
| `Role` | STUDENT, TEACHER, ADMIN, PARENT |
| `AccountType` | DISTRICT, HOMESCHOOL, INDIVIDUAL, SELF_EDUCATION |
| `SubmissionStatus` | PENDING, SUBMITTED, GRADING, GRADED, RETURNED |
| `AssignmentType` | ESSAY, MULTIPLE_CHOICE, SHORT_ANSWER, PROJECT, QUIZ |
| `SubscriptionStatus` | ACTIVE, TRIAL, EXPIRED, CANCELLED |
| `SubscriptionTier` | FREE, STARTER, CUSTOM, STANDARD, PREMIUM, ENTERPRISE |
| `Difficulty` | BEGINNER, EASY, MEDIUM, HARD, ADVANCED |
| `DistrictAccessLevel` | SUPERINTENDENT, ASSISTANT_SUPERINTENDENT, CURRICULUM_DIRECTOR, PRINCIPAL, VICE_PRINCIPAL, DISTRICT_EMPLOYEE, IT_ADMIN |
| `PaymentStatus` | PENDING, COMPLETED, FAILED, REFUNDED |

### Core Models (66 total)

**Organization & Users**
- `SchoolDistrict` — Districts with subdomain, contact info, settings
- `School` — Schools within districts
- `Classroom` — Classes within schools
- `ClassroomStudent` — Student-classroom enrollment join table
- `DistrictAdmin` — District administrator assignments with access levels
- `User` — Core user model with role, account type, district, avatar, grade level, learning preferences
- `Account` — OAuth/provider account linking (NextAuth)
- `Session` — Active session tracking (NextAuth)
- `VerificationToken` — Email verification tokens

**Academics**
- `Course` — Courses offered by teachers
- `CourseTeacher` — Teacher-course assignments
- `Enrollment` — Student course enrollments
- `Assignment` — Teacher-created assignments with type, difficulty, due dates, adaptive toggle
- `Submission` — Student submissions with status workflow (Pending → Submitted → Grading → Graded → Returned)
- `AdaptedAssignment` — AI-personalized assignment variants per student
- `FileUpload` — Student/teacher file attachments

**AI & Learning**
- `AITutorLog` — Complete tutor conversation history
- `LearningDNA` — Long-term cognitive profile (speed, retention, modality, peak hours)
- `StudentSurvey` — Learning style survey responses (hobbies, games, movies, dream job)
- `SkillRecord` — Per-skill mastery tracking
- `SpacedRepItem` — SM-2 spaced repetition item scheduling
- `StudyPlanSession` — AI-generated study plan sessions
- `ExamAttempt` — Exam simulator attempts with scores
- `MistakeEntry` — Mistake replay data for targeted review
- `QuizTemplate` — Saved quiz templates
- `MicroLesson` — Short AI-generated lesson snippets
- `HomeworkScan` — Uploaded homework for AI analysis
- `ConceptMap` — Visual concept mapping data
- `VocabEntry` — Vocabulary tracking
- `WritingSubmission` — Extended writing assignments
- `MathStepAttempt` — Step-by-step math problem solving
- `ConfidenceRating` — Student self-assessment confidence scores

**Gamification**
- `RewardStats` — XP, level, streak, coins per user
- `Certificate` — Earned certificates (course completion, achievement, milestone)
- `Game` — Available educational games in the store
- `GamePurchase` — Game purchases with coins
- `GameSession` — Game play session tracking
- `Challenge` — Daily/weekly challenges
- `ChallengeParticipant` — Challenge participation and scores
- `SeasonPassProgress` — Seasonal reward tracking
- `DailyBoost` — Daily login bonus tracking
- `MarketplaceListing` — Avatar shop items

**Social & Communication**
- `Notification` — In-app notifications (assignment, grade, achievement, system, alert, challenge)
- `Message` — Direct messaging between users
- `StudyGroup` — Collaborative study groups
- `StudyGroupMember` — Study group membership
- `StudyGroupMessage` — Group chat messages
- `QuestionPost` — Student questions (Q&A forum)
- `QuestionVote` — Q&A upvoting
- `PeerTutorMatch` — Peer-to-peer tutoring matches
- `Whiteboard` — Collaborative whiteboard sessions
- `WhiteboardMember` — Whiteboard participants

**Parent & Intervention**
- `WeeklyReport` — Auto-generated weekly progress reports
- `FocusSession` — Focus mode session tracking
- `EmotionalCheckin` — Student emotional state tracking
- `InterventionPlan` — Teacher-created intervention plans for struggling students
- `ParentGoal` — Parent-set goals for children
- `GoalContract` — Student-teacher goal contracts
- `ProgressSnapshot` — Point-in-time academic snapshots

**Security & Administration**
- `SecurityAuditLog` — Complete security audit trail
- `LoginAttempt` — Login attempt tracking (success/failure, IP, user agent)
- `ParentalConsent` — COPPA consent records
- `DataAccessLog` — PII/sensitive data access logging
- `DataDeletionRequest` — GDPR/CCPA data deletion requests
- `Payment` — Subscription payment records
- `TeacherSettings` — Per-teacher configuration preferences

### Authentication

- **Provider**: NextAuth.js 4.24 with Credentials provider
- **Strategy**: JWT (no database sessions)
- **Session Duration**: 24 hours
- **Secret**: Embedded stable default (overridable via `NEXTAUTH_SECRET`)
- **Cookie**: Secure flag based on HTTPS detection, HttpOnly, SameSite=lax
- **Demo Accounts**: Built-in demo system with master demo (full access) and role-specific accounts (student, teacher, admin, parent) for the Ofer Academy demo district

---

## Complete API Reference

### Authentication (`/api/auth`)

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/auth/[...nextauth]` | GET/POST | Public | NextAuth.js handler (sign-in, sign-out, session, CSRF) |
| `/api/auth/register` | POST | Public | Create new account (email, password, name, role, account type) |
| `/api/auth/forgot-password` | POST | Public | Send password reset email |
| `/api/auth/reset-password` | POST | Public | Reset password with token |
| `/api/demo` | POST | Public | Start demo session with specified role |

### Student APIs

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/skills` | GET | Student | Skill mastery data across subjects |
| `/api/rewards` | GET | Student | Gamification stats (XP, level, streak, coins, badges) |
| `/api/study-next` | GET | Student | AI-recommended next study action |
| `/api/confidence` | GET | Student | Confidence and mastery self-assessment data |
| `/api/tutor` | POST | Student | AI tutor conversation (send message, get Socratic response) |
| `/api/focus` | GET/POST | Student | Focus mode — get questions (GET), submit answers (POST) |
| `/api/submissions` | GET/POST | Student | View submissions (GET), submit work (POST) |
| `/api/assignments` | GET | Student | View assigned work with status and due dates |
| `/api/daily-boost` | GET/POST | Student | Daily login bonus tracking |
| `/api/challenges` | GET | Student | Available daily/weekly challenges |
| `/api/games` | GET/POST | Student | Game store — browse (GET), purchase (POST) |
| `/api/study-planner` | GET/POST | Student | AI study plan generation and management |
| `/api/exam-sim` | GET/POST | Student | Exam simulator — get exam (GET), submit attempt (POST) |
| `/api/mistakes` | GET | Student | Mistake history for review |
| `/api/mistakes/explain` | POST | Student | AI explanation of specific mistakes |
| `/api/math-solver` | POST | Student | Step-by-step math problem solver |
| `/api/writing-coach` | POST | Student | AI writing feedback and coaching |
| `/api/vocab` | GET/POST | Student | Vocabulary tracking |
| `/api/concept-map` | GET/POST | Student | Visual concept map data |
| `/api/emotional-checkin` | POST | Student | Emotional state check-in |
| `/api/survey` | GET/POST | Student | Learning style survey |
| `/api/study-groups` | GET/POST | Student | Study group management |
| `/api/platforms` | GET/POST | Student | Connected platform integrations |
| `/api/notifications` | GET | Student | In-app notifications |
| `/api/messages` | GET/POST | All | Send and receive messages |
| `/api/messages/contacts` | GET | All | List message contacts |
| `/api/messages/thread` | GET | All | Message thread view |
| `/api/learning-dna` | GET | Student | Learning DNA cognitive profile |
| `/api/progress-snapshot` | GET | Student | Point-in-time academic snapshot |
| `/api/files` | POST | All | File upload |
| `/api/goal-contracts` | GET/POST | Student | Student-teacher goal contracts |
| `/api/micro-lessons` | GET | Student | Short AI-generated lessons |
| `/api/worksheet-search` | GET | Student | Search curated worksheet database |
| `/api/worksheets` | GET | Student | Get worksheets by filter |
| `/api/exchange` | GET/POST | All | Teacher exchange resource sharing |
| `/api/marketplace` | GET/POST | Student | Avatar shop marketplace |
| `/api/lms` | GET/POST | All | LMS integration data |

### Teacher APIs

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/analytics` | GET | Teacher | Student performance overview with charts |
| `/api/teacher/insights` | GET | Teacher | Misconception heatmap, skill gaps, performance predictions |
| `/api/teacher/learning-insights` | GET | Teacher | Student learning styles and AI adaptations |
| `/api/teacher/assignment-diff` | GET | Teacher | Original vs AI-adapted assignment comparison |
| `/api/teacher/method-insights` | GET | Teacher | How each student solved their work (visual, step-by-step, etc.) |
| `/api/teacher/intelligence` | GET | Teacher | AI-powered class-wide intelligence dashboard |
| `/api/teacher/auto-assign` | POST | Teacher | Auto-generate assignments with AI |
| `/api/teacher/interventions` | GET/POST | Teacher | Intervention plans for struggling students |
| `/api/teacher/reports` | GET/POST | Teacher | AI-written student progress reports |
| `/api/adaptive` | GET/POST | Teacher | Generate/retrieve adapted assignments |
| `/api/grade` | POST | Teacher | AI auto-grading endpoint |
| `/api/quiz-generator` | POST | Teacher | AI quiz generation |
| `/api/settings/weights` | GET/POST | Teacher | Grade weight configuration |

### Admin / District APIs

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/admin/provision` | POST | Admin | Bulk CSV import of students and teachers |
| `/api/admin/districts` | GET/POST | Admin | District management |
| `/api/district/announcements` | GET/POST/PUT/DELETE | Admin | Full CRUD for district announcements |
| `/api/district/schools` | GET/POST | Admin | School management within district |
| `/api/district/classrooms` | GET/POST | Admin | Classroom management |
| `/api/district/teachers` | GET | Admin | District teacher roster |
| `/api/district/students` | GET | Admin | District student roster |
| `/api/district/access` | GET/POST | Admin | District access level management |
| `/api/payments` | GET/POST | Admin | Payment and billing management |

### Parent APIs

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/parent` | GET | Parent | Children's overview data |
| `/api/parent/ai-checkin` | POST | Parent | AI-powered child safety and progress check-in |
| `/api/parent/goals` | GET/POST | Parent | Parent-set goals for children |
| `/api/parent/reports` | GET | Parent | Detailed growth reports |

### Security & System APIs

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/health` | GET | Public | Health check — status, version, platform, uptime, memory |
| `/api/security` | GET/POST | Admin | Security dashboard data |
| `/api/security/audit` | GET | Admin | Audit log query |
| `/api/security/consent` | GET/POST | Admin | COPPA parental consent management |
| `/api/security/dashboard` | GET | Admin | Security metrics dashboard |
| `/api/security/data-deletion` | POST | Admin | GDPR/CCPA data deletion requests |
| `/api/ai-navigator` | POST | All | In-app AI assistant |

---

## All Application Pages

### Public Pages (7)

| Page | Route | Description |
|---|---|---|
| Landing | `/` | Marketing landing page with features, pricing, FAQ, testimonials |
| Login | `/login` | Sign in with email/password or demo mode |
| Register | `/register` | Create account (student, teacher, admin, parent) |
| Demo | `/demo` | Interactive demo with role selection |
| Pricing | `/pricing` | Subscription tier comparison |
| Onboard | `/onboard` | District onboarding wizard |
| Forgot Password | `/forgot-password` | Password reset request |
| Reset Password | `/reset-password` | Password reset with token |

### Legal Pages (4)

| Page | Route |
|---|---|
| About | `/about` |
| Privacy Policy | `/privacy` |
| Terms of Service | `/terms` |
| Accessibility Statement | `/accessibility` |

### Other Public Pages (3)

| Page | Route |
|---|---|
| Help Center | `/help` |
| Contact | `/contact` |
| Roadmap | `/roadmap` |

### Student Pages (17), Teacher Pages (14), Admin Pages (12), Parent Pages (3)

See [Feature Overview](#feature-overview) sections above for complete page listings.

**Total Pages**: 60+

---

## Subscription Tiers & Pricing

| Tier | Price | Max Students | Key Features |
|---|---|---|---|
| **Free** | $0/forever | 5 | AI Tutor (50/mo), basic gamification, parent dashboard, AI check-ins |
| **Starter** | $4/student/mo | 50 | AI Tutor, AI Grading, gamification, game store, file uploads, rewards |
| **Custom** | Contact sales | Custom | Everything in Starter + priority support |
| **Standard** | $6/student/mo | 500 | All features + analytics, LMS integration, certificates, multi-school |
| **Premium** | $10/student/mo | 2000 | Everything in Standard + custom branding, API access, bulk import |
| **Enterprise** | Custom | Unlimited | Everything + SSO/SAML, custom AI training, data residency, 99.9% SLA, dedicated account manager |

**All paid plans**: 14-day free trial, 30-day money-back guarantee.

Feature access is enforced server-side via the subscription manager (`src/lib/subscription.ts`) with a `TIER_FEATURES` map that gates functionality per tier.

---

## Deployment Guide (Render)

### Prerequisites

1. A [Render.com](https://render.com) account (free tier works for testing)
2. A [PostgreSQL database](https://render.com/docs/databases) (Render provides free 90-day PostgreSQL, or Starter at $7/mo)
3. A [Google Gemini API key](https://aistudio.google.com/apikey) (free tier: 15 requests/min — without it, AI features run in demo mode)
4. Source code pushed to GitHub

### Step 1: Create a PostgreSQL Database

1. Go to **Render Dashboard** -> **New** -> **PostgreSQL**
2. Name: `limud-db`
3. Region: Choose closest to your users (e.g., Oregon for US West, Ohio for US East)
4. Plan: **Free** (90-day limit) or **Starter** ($7/mo, persistent)
5. Click **Create Database**
6. Copy the **Internal Database URL** (starts with `postgresql://...`)

### Step 2: Create a Web Service

1. Go to **Render Dashboard** -> **New** -> **Web Service**
2. Connect your GitHub repository (`Fansist/Limud`)
3. Configure:
   - **Name**: `limud`
   - **Region**: Same as your database
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: `rm -rf node_modules && npm install && npm run build`
   - **Start Command**: `node server.js`
   - **Plan**: **Free** (spins down after 15 min idle) or **Starter** ($7/mo, always-on)

> **Important**: If builds fail, go to **Settings** -> **Build & Deploy** and click **Clear build cache & deploy**. This prevents stale cached packages from causing issues.

### Step 3: Set Environment Variables

In the Render web service settings -> **Environment**:

| Variable | Value | Required |
|---|---|---|
| `DATABASE_URL` | `postgresql://user:pass@host:5432/dbname` (from Step 1) | **Yes** |
| `GEMINI_API_KEY` | Your Google Gemini API key | **Yes** (or AI runs in demo mode) |
| `NODE_ENV` | `production` | **Yes** |
| `NODE_VERSION` | `20.19.0` | **Recommended** (prevents Prisma 7.x issues) |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` | No (stable default embedded) |
| `NEXTAUTH_URL` | `https://your-app.onrender.com` | No (auto-derived from request) |
| `AI_MODEL` | `gemini-2.0-flash` | No (this is the default) |
| `PII_ENCRYPTION_KEY` | `openssl rand -base64 32` | No (falls back to auth secret) |

### Step 4: Initialize the Database

After the first deploy succeeds, open the Render **Shell** tab and run:

```bash
npx prisma db push          # Creates all 66 tables from schema
npx tsx prisma/seed.ts       # (Optional) Seed with demo data
```

### Step 5: Custom Domain (Optional)

1. In Render -> Your Service -> **Settings** -> **Custom Domains**
2. Add your domain (e.g., `limud.co`)
3. Add DNS records:
   - CNAME: `www.limud.co` -> `limud.onrender.com`
   - A record: `limud.co` -> (Render's IP, shown in dashboard)
4. Render provides free TLS/SSL

### Step 6: Verify Deployment

```bash
curl https://your-app.onrender.com/api/health
# Expected: {"status":"ok","version":"9.5.8","platform":"Render","uptime":42.5,...}
```

### Updating the App

Push to `main` and Render auto-deploys:

```bash
git push origin main
# Render detects push -> builds -> deploys automatically
```

If you've added new Prisma schema changes, run in Render Shell after deploy:

```bash
npx prisma db push
```

### Troubleshooting

| Issue | Solution |
|---|---|
| "Application Error" on load | Check Render logs. Usually a missing `DATABASE_URL` env var. |
| Database connection refused | Ensure DATABASE_URL uses the **Internal** URL and same region as the web service. |
| Login doesn't work | Check browser console. Auth is auto-configured. Only override `NEXTAUTH_SECRET` if using custom domain. |
| AI features return fallback data | Check `GEMINI_API_KEY` is valid. Test at https://aistudio.google.com |
| Build fails with OOM | Build uses `--max-old-space-size=512`. If still failing, upgrade to Starter plan (more RAM). |
| Build fails with Prisma error | Clear build cache: Settings -> Build & Deploy -> Clear build cache & deploy. Prisma is pinned to 5.22.0. |
| Build fails with missing modules | All build-time deps (TypeScript, Tailwind, etc.) are in `dependencies`, not `devDependencies`, since Render's `NODE_ENV=production` skips devDependencies during `npm install`. |
| App is slow after idle | Free tier spins down after 15 min. First request takes ~30s to cold start. |
| Node.js version wrong | `engines.node` is set to `20.x` in package.json. Also set `NODE_VERSION=20.19.0` in Render env vars. |

### render.yaml (Infrastructure as Code)

Place at project root for blueprint-based deployment:

```yaml
services:
  - type: web
    name: limud
    runtime: node
    region: oregon
    plan: starter
    buildCommand: rm -rf node_modules && npm install && npm run build
    startCommand: node server.js
    healthCheckPath: /api/health
    autoDeploy: true
    envVars:
      - key: NODE_ENV
        value: production
      - key: NODE_VERSION
        value: 20.19.0
      - key: DATABASE_URL
        fromDatabase:
          name: limud-db
          property: connectionString
      - key: GEMINI_API_KEY
        sync: false

databases:
  - name: limud-db
    plan: starter
    databaseName: limud
    user: limud
```

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | **Yes** | `postgresql://postgres:postgres@localhost:5432/limud` | PostgreSQL connection string |
| `GEMINI_API_KEY` | **Yes** (for AI) | `demo-mode` | Google Gemini API key. Without it, all AI features run in demo mode with pre-built content. |
| `NODE_ENV` | **Yes** | `development` | Set to `production` for deployment |
| `NODE_VERSION` | Recommended | (platform default) | Pin to `20.19.0` to prevent Prisma 7.x issues on Render |
| `NEXTAUTH_SECRET` | No | Embedded stable default | JWT signing secret. Only override if you want a custom secret. |
| `NEXTAUTH_URL` | No | Auto-derived from request | Canonical URL for NextAuth callbacks. Only set for custom domains. |
| `NEXT_PUBLIC_APP_URL` | No | `http://localhost:3000` | Public-facing URL (fallback for `NEXTAUTH_URL`) |
| `NEXT_PUBLIC_APP_NAME` | No | `Limud` | App name displayed in UI |
| `AI_MODEL` | No | `gemini-2.0-flash` | AI model identifier. Options: `gemini-2.5-flash`, `gemini-2.5-pro`, etc. |
| `PII_ENCRYPTION_KEY` | No | Falls back to `AUTH_SECRET` | AES-256-GCM encryption key for PII data |
| `GOOGLE_API_KEY` | No | — | Alternative to `GEMINI_API_KEY` |

**Zero-config design**: The app starts and runs with **no environment variables** at all. A local PostgreSQL is assumed for the database, and all AI features run in demo mode with rich pre-built content.

---

## Development Setup

### Prerequisites

- Node.js 20.x (use `nvm use 20` or install from nodejs.org)
- PostgreSQL 14+ (local or cloud)
- Git

### Quick Start

```bash
# Clone the repository
git clone https://github.com/Fansist/Limud.git
cd Limud

# Install dependencies
npm install

# Set up environment (optional — app runs without it)
cp .env.example .env
# Edit .env with your DATABASE_URL and GEMINI_API_KEY

# Push database schema
npx prisma db push

# (Optional) Seed demo data
npx tsx prisma/seed.ts

# Start development server
npm run dev
# Open http://localhost:3000
```

### Demo Mode

If you don't configure a database or API key, the app runs in **demo mode** with:
- Pre-built demo accounts (student, teacher, admin, parent) for "Ofer Academy" district
- Master demo account: `master@limud.edu` / `LimudMaster2026!` (full teacher access)
- Role-specific demo accounts use password `password123`
- Rich pre-built quiz banks (Math: Algebra, Geometry, Fractions; and more)
- Simulated analytics, rewards, and gamification data

### Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start Next.js dev server on port 3000 |
| `npm run build` | Production build (Prisma generate + Next.js build + standalone copy) |
| `npm start` | Start production server (`node server.js`) |
| `npm run lint` | ESLint check |
| `npm run db:push` | Push Prisma schema to database |
| `npm run db:seed` | Seed database with demo data |
| `npm run db:studio` | Open Prisma Studio GUI |
| `npm run db:reset` | Force-reset database and re-seed |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run health` | Check local health endpoint |

### Project Structure

```
Limud/
├── prisma/
│   ├── schema.prisma       # 66 models, 9 enums (1,645 lines)
│   └── seed.ts             # Demo data seeder
├── public/                 # Static assets
├── src/
│   ├── app/
│   │   ├── (auth)/         # Auth pages (login, register, demo, pricing, etc.)
│   │   ├── (legal)/        # Legal pages (about, privacy, terms, accessibility)
│   │   ├── admin/          # Admin portal (13 pages, incl. Link Requests)
│   │   ├── help/           # Help center
│   │   ├── parent/         # Parent portal (3 pages + children management)
│   │   ├── roadmap/        # Public roadmap
│   │   ├── student/        # Student portal (18 pages, incl. Join District)
│   │   ├── teacher/        # Teacher portal (14 pages)
│   │   ├── api/            # 80+ API routes
│   │   ├── layout.tsx      # Root layout
│   │   └── page.tsx        # Landing page router
│   ├── components/
│   │   ├── accessibility/  # AccessibilityPanel.tsx
│   │   ├── ai/             # AINavigator.tsx
│   │   ├── gamification/   # RewardComponents.tsx
│   │   ├── landing/        # LandingPage.tsx
│   │   ├── layout/         # DashboardLayout.tsx
│   │   └── Providers.tsx   # Auth + accessibility providers
│   └── lib/
│       ├── ai.ts           # Google Gemini AI service (626 lines)
│       ├── ai-generators.ts # Demo quiz banks (298 lines)
│       ├── auth.ts         # NextAuth configuration (314 lines)
│       ├── cognitive-engine.ts # SM-2, adaptive difficulty (457 lines)
│       ├── config.ts       # Centralized app config (91 lines)
│       ├── constants.ts    # Shared constants
│       ├── demo-data.ts    # Demo mode data (822 lines, 24 exports)
│       ├── gamification.ts # XP, levels, streaks, coins (206 lines)
│       ├── hooks.ts        # Custom React hooks
│       ├── learning-dna.ts # Cognitive profiling engine (329 lines)
│       ├── middleware.ts   # Custom middleware utilities (352 lines)
│       ├── performance.tsx # Performance monitoring & lite mode (353 lines)
│       ├── prisma.ts       # Prisma singleton client
│       ├── security.ts     # Security engine (1,000 lines)
│       ├── subscription.ts # Tier feature gating (55 lines)
│       └── utils.ts        # Utility functions (86 lines)
├── middleware.ts           # Next.js edge middleware (RBAC, security headers, rate limiting)
├── server.js              # Universal Node.js entry point (Render, cPanel, generic)
├── render.yaml            # Render blueprint for IaC deployment
├── next.config.js         # Next.js configuration (standalone output, security headers)
├── tailwind.config.ts     # Tailwind CSS configuration
├── tsconfig.json          # TypeScript configuration
└── package.json           # Dependencies and scripts
```

**Total source code**: ~6,764 lines across core library files, plus thousands more across 60+ pages and 75+ API routes.

---

## Changelog

### v9.6.1 (2026-03-27) — District Search Fix & District Seeding

**Bug Fixes:**

- **District Search Now Works** — Fixed critical bug where the district search API returned no results. Root cause: the `NOT` filter was checking `{ id: 'demo-district' }` but the actual ID is a cuid — the subdomain is "demo-district". Updated to filter by `subdomain` instead of `id`. Also added exclusion for `Demo School` districts by name.
- **Search Now Covers City & State** — District search now matches against name, city, and state (previously name-only), making it easier to find districts by location.
- **Browse All Districts** — Added a "Browse all available districts" button on the link-district page so students don't need to guess district names. Uses `?browse=1` query parameter.

**Seeded Districts:**

- **Limud-Academy** — Properly seeded into the database (was missing in v9.6.0). Superintendent: `Owner@limud.co` / `LimudRock2026!`, located in Tel Aviv, Israel, with PREMIUM subscription and up to 500 students.
- **25 Additional Districts** — Created a diverse set of real-looking school districts across the US for testing the student→district linking flow. Each has a superintendent account (password: `District2026!`):

| District | City | State |
|---|---|---|
| Maple Heights School District | Cleveland | Ohio |
| Sunrise Valley Academy | Scottsdale | Arizona |
| Lincoln Park Unified | Chicago | Illinois |
| Harbor View Schools | San Francisco | California |
| Cedar Ridge ISD | Austin | Texas |
| Bright Horizons Charter | Denver | Colorado |
| Riverside Prep Academy | Portland | Oregon |
| Eagle Mountain District | Boise | Idaho |
| Bayshore Learning Center | Miami | Florida |
| Northern Lights School Network | Minneapolis | Minnesota |
| Golden Gate Academy | Oakland | California |
| Prairie Wind Schools | Omaha | Nebraska |
| Summit Peak Education | Salt Lake City | Utah |
| Coastal Breeze Academy | Charleston | South Carolina |
| Blue Ridge Preparatory | Asheville | North Carolina |
| Desert Rose Unified | Phoenix | Arizona |
| Lakefront Schools | Milwaukee | Wisconsin |
| Redwood Valley Charter | Sacramento | California |
| Peachtree Academy Network | Atlanta | Georgia |
| Mountain View ISD | El Paso | Texas |
| Silver Creek Schools | Nashville | Tennessee |
| Brookfield Learning District | Boston | Massachusetts |
| Coral Springs Academy | Fort Lauderdale | Florida |
| Emerald City Schools | Seattle | Washington |
| Magnolia Park Prep | Houston | Texas |

**New Files:**

- `prisma/seed-districts.ts` — Seeding script for Limud-Academy + 25 extra districts with admin accounts

**Database Sync:**

- Ran `prisma db push` to sync schema with database (fixed `users.colorTheme` column mismatch)

---

### v9.6.0 (2026-03-27) — District Linking, Standalone Students, App Logo

**Major Features:**

- **Student-Initiated District Linking** — Students can create accounts independently and request to link to an existing school district. Search for districts by name, send a join request with an optional message and grade level, and track request status.
- **District Admin Link Request Management** — New "Link Requests" page in the admin portal. Admins can view, accept, or deny student link requests. Approved students are automatically linked to the district with full access. Includes review notes and audit logging.
- **Standalone Student Accounts** — New "Student" registration option (account type: `INDIVIDUAL`). Unlinked students get demo-like capabilities (sample assignments, rewards, AI tutor access) without being flagged as `is_demo`. They can browse all features while waiting for district approval.
- **Limud-Academy Non-Demo District** — Created `Limud-Academy` as a real, non-demo district with superintendent credentials (`Owner@limud.co` / `LimudRock2026!`). Includes default school, 4 courses, and full enterprise subscription.
- **Custom App Logo** — Designed and applied a modest app logo (book + light motif) across all branding touchpoints: landing page, login, register, and dashboard sidebar.

**Bug Fixes:**

- **Student Login Redirect Fix** — Fixed the bug where real (non-demo) students were redirected to the demo page with Lior's data after signing in. Root cause: stale `limud-demo-mode` localStorage flag from previous demo sessions was not cleared on non-demo login. Fix applied in both the login page (`doLogin()`) and the `useIsDemo` hook.
- **useIsDemo Hook Hardened** — The hook now detects authenticated non-demo users and aggressively clears stale localStorage flags, ensuring real students always see their own data.

**New Routes & Pages:**

| Route | Description |
|---|---|
| `/student/link-district` | Student UI to search districts and send link requests |
| `/admin/link-requests` | Admin UI to manage incoming student link requests |
| `/api/district-link/search` | GET — Search available districts by name |
| `/api/district-link/route` | GET/POST — Student's link requests (view/create) |
| `/api/district-link/manage` | GET/PUT — Admin management of link requests |

**Schema Changes:**

- `DistrictLinkRequest` model added to Prisma schema with fields: `studentId`, `districtId`, `message`, `status` (pending/approved/denied), `reviewedBy`, `reviewNote`, `gradeLevel`, timestamps
- Relations added to `User` (`districtLinkRequests`) and `SchoolDistrict` (`linkRequests`)

**Navigation Updates:**

- Student sidebar: Added "Join District" link (Building2 icon)
- Admin sidebar: Added "Link Requests" link (UserPlus icon) between "Students" and "Announcements"

**Registration Updates:**

- New "Student" account type option in registration wizard (blue, GraduationCap icon)
- Student standalone registration creates an `INDIVIDUAL` account with no district
- After registration, standalone students are redirected to `/student/link-district` to find their school

**AI Capabilities:**

- Full AI features (tutor, grading, quiz generation, reports, etc.) require `GEMINI_API_KEY` environment variable set to a valid Google Gemini API key
- Without the key, all AI features run in demo mode with rich pre-built content
- Master demo account (`master@limud.edu`) has full access to all AI features when the API key is configured

**Screenshots (Placeholders):**

> *District Search & Link Request UI:*
>
> ![Student Link District](https://via.placeholder.com/800x400?text=Student+Link+District+Page)
>
> *Admin Link Request Management:*
>
> ![Admin Link Requests](https://via.placeholder.com/800x400?text=Admin+Link+Requests+Page)
>
> *Standalone Student Dashboard (Unlinked):*
>
> ![Unlinked Student Dashboard](https://via.placeholder.com/800x400?text=Unlinked+Student+Dashboard)
>
> *New App Logo:*
>
> ![Limud Logo](https://via.placeholder.com/200x200?text=Limud+Logo)

---

### v9.5.8 (2026-03-26) — Comprehensive Documentation
- Complete README rewrite with full feature documentation, API reference, data architecture, and deployment guide

### v9.5.7 (2026-03-26) — Build-Time Dependencies Fix
- Moved all build-time dependencies (TypeScript, @types/*, ESLint, Prisma, tsx) from `devDependencies` to `dependencies` to fix Render production installs

### v9.5.6 (2026-03-26) — TailwindCSS Build Fix
- Moved tailwindcss, postcss, and autoprefixer from `devDependencies` to `dependencies` (Render's `NODE_ENV=production` skips devDeps)

### v9.5.5 (2026-03-26) — OOM Build Fix
- Added `NODE_OPTIONS='--max-old-space-size=512'` to build command to prevent out-of-memory kills on Render

### v9.5.4 (2026-03-25) — Webpack Alias Fix
- Added webpack `resolve.alias` mapping `@` to `src/` directory for reliable path resolution on Render

### v9.5.3 (2026-03-25) — Prisma 7.x Fix
- Pinned `npx prisma@5.22.0 generate` in build command to prevent Render's cached Prisma 7.x from breaking the schema
- Build command updated to `rm -rf node_modules && npm install && npm run build` for clean installs

### v9.5.2 (2026-03-25) — Node.js Version Pin
- Pinned Node.js to `20.x` in `package.json` engines to prevent Render from selecting Node 25.x (which installs Prisma 7.x)
- Added `NODE_VERSION=20.19.0` to `render.yaml`

### v9.5.1 (2026-03-26) — Env Var Simplification & Announcements
- Made `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, and `PII_ENCRYPTION_KEY` officially optional (safe defaults embedded)
- Created `/api/district/announcements` API route (GET, POST, PUT, DELETE)
- Updated admin announcements page to use real CRUD endpoints
- Districts can no longer create announcements (admin-only)

### v9.5.0 (2026-03-25) — Feature Consolidation
- Consolidated 3 teacher analytics pages into 1 tabbed page (Overview, Insights & Heatmap, Learning Styles, Assignment Diff)
- Consolidated 2 student analytics pages into 1 tabbed page (Knowledge Map, Growth & Predictions)
- New Assignment Diff view for comparing original vs AI-adapted assignments
- Performance optimizations: Prisma connection pooling, static asset caching, parallel data loading
- Navigation cleanup: Teacher 14->12 items, Student 15->14 items

### v9.4.3 — Teacher Learning Insights
### v9.4.0 — Edge Middleware, Google Gemini Migration
### v9.3.5 — Security Engine, Cognitive Science, Demo Mode

---

## Roadmap

Planned features and improvements:

- **Real-time Collaboration** — Live co-editing for study groups and whiteboards
- **Announcement Model** — Persist announcements to database (currently in-memory for demo)
- **SSO/SAML** — Enterprise single sign-on integration
- **Mobile App** — React Native companion app
- **Offline Mode** — Progressive Web App (PWA) with offline question banks
- **Advanced Reporting** — Exportable PDF reports for districts
- **Custom AI Training** — Fine-tuned models per district for specialized curriculum
- **Multi-Language** — Full i18n support (Hebrew, Spanish, Arabic, French)
- **Video Lessons** — AI-generated video explanations
- **Parent Mobile Notifications** — Push notifications for grades and alerts

---

## Links & URLs

| Resource | URL |
|---|---|
| **Production** | https://limud.co |
| **GitHub** | https://github.com/Fansist/Limud |
| **Health Check** | https://limud.co/api/health |
| **Demo Login** | https://limud.co/login (use demo accounts below) |

### Demo Accounts (Ofer Academy)

| Role | Email | Password |
|---|---|---|
| **Master Demo** (full access) | `master@limud.edu` | `LimudMaster2026!` |
| Student (Lior) | `lior@ofer-academy.edu` | `password123` |
| Teacher (Strachen) | `strachen@ofer-academy.edu` | `password123` |
| Admin (Erez) | `erez@ofer-academy.edu` | `password123` |
| Parent (David) | `david@ofer-academy.edu` | `password123` |

### Real Accounts (Limud-Academy)

| Role | Email | Password |
|---|---|---|
| **Superintendent** | `Owner@limud.co` | `LimudRock2026!` |

> **Note:** The Limud-Academy district is a real, non-demo district. Students can search for and request to join this district. Run `npx tsx prisma/seed.ts` to create it.

---

<p align="center">
  Built with care for educators, students, and families.<br>
  <strong>Limud Education Inc.</strong> &copy; 2026
</p>
