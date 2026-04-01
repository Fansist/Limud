<p align="center">
  <strong>Limud</strong> &mdash; AI-Powered Adaptive Learning Platform
</p>

<p align="center">
  <em>"Every mind learns differently."</em>
</p>

<p align="center">
  <a href="https://limud.co">limud.co</a> &bull;
  <a href="https://github.com/Fansist/Limud">GitHub</a> &bull;
  v9.9.0
</p>

---

# Limud

**Limud** (Hebrew: "learning") is a full-stack, AI-powered adaptive learning platform built for K-12 education. It is designed from the ground up for students who learn differently — visual, auditory, kinesthetic, reading-based, and ADHD-friendly modes are all first-class citizens. Limud serves self-learners, homeschool families, individual teachers, and entire school districts through a single unified product.

The platform combines **Google Gemini AI** with **cognitive science algorithms** (SM-2 spaced repetition, adaptive difficulty targeting, learning DNA profiling) and **adaptive learning tools** (focus mode, study planner, exam simulator, AI lesson planner) to create a deeply personalized and engaging learning experience.

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
   - [Student Portal](#3-student-portal)
   - [Teacher Portal](#4-teacher-portal)
   - [Admin / District Portal](#5-admin--district-portal-12-pages)
   - [Parent Portal](#6-parent-portal-3-pages)
   - [Homeschool Portal](#7-homeschool-portal-5-pages)
   - [Accessibility](#8-accessibility)
   - [Platform Integrations](#9-platform-integrations-16)
   - [Security & Compliance](#10-security--compliance)
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
- **Engagement Through Progress** — Growth analytics, study streaks, certificates, and adaptive challenges keep students motivated.
- **Teacher Empowerment** — AI auto-grading, quiz generation, misconception heatmaps, and method insights free teachers to focus on teaching.
- **Parent Visibility** — Real-time dashboards, AI-powered check-ins, and growth reports keep parents informed without being intrusive.
- **Enterprise Security** — FERPA, COPPA, and OWASP compliance with field-level encryption, audit logging, and role-based access control.
- **Accessible to Everyone** — Free forever for homeschool families and self-learners. Affordable per-student pricing for schools.

---

## Who Is Limud For?

| Audience | How Limud Helps | Pricing |
|---|---|---|
| **Self-Learners** | AI adapts to your learning style, progress tracking, study planner, exam simulator | Free forever |
| **Homeschool Families** | Parent dashboard, AI check-ins, assignment management, adaptive learning, up to 5 students | Free forever |
| **Individual Teachers** | AI grading, quiz generation, worksheet builder, student analytics | Free / Starter |
| **School Districts** | Multi-school management, CSV bulk provisioning, compliance dashboards, billing, 16+ LMS integrations | From $2/student/mo |
| **Students (K-12)** | Adaptive AI tutor, focus mode, exam simulator, study planner, growth analytics | Through school/parent |
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
│  │ AI Engine│ │ Cognitive │ │ Adaptive │ │ Security Engine   │ │
│  │ (Gemini) │ │ Science   │ │ Learning │ │ (FERPA/COPPA)     │ │
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

### 3. Student Portal

The student experience is a full-featured learning environment:

| Page | Route | Description |
|---|---|---|
| **Dashboard** | `/student/dashboard` | Welcome banner, progress overview, quick-access cards (Assignments, AI Tutor, Study Planner), recent activity |
| **Assignments** | `/student/assignments` | View and submit assignments. Types: essay, multiple choice, short answer, project, quiz |
| **AI Tutor** | `/student/tutor` | Conversational AI tutor with Socratic questioning, Markdown rendering, conversation history |
| **Focus Mode** | `/student/focus` | Distraction-free study environment with timed questions and focus tracking |
| **Analytics** | `/student/knowledge` | Tabbed view: **Knowledge Map** (radar chart, skill mastery, study heatmap, goals, rank) and **Growth & Predictions** (mastery overview, predicted grade, skill map by category) |
| **Study Planner** | `/student/study-planner` | AI-recommended study schedule based on upcoming assignments and spaced repetition intervals |
| **Exam Simulator** | `/student/exam-sim` | Practice exams with timed conditions, question banks, immediate feedback |
| **Messages** | `/student/messages` | In-app messaging with teachers and classmates |
| **My Platforms** | `/student/platforms` | Connected third-party platform integrations (Khan Academy, Google Classroom, etc.) |

Additional student pages: **Survey** (`/student/survey`) for learning style assessment with v9.7 scenario-based discovery, **My Classrooms** (`/student/classrooms`) for classroom finder with assignment preview and learning method chooser, **Study Groups** (`/student/study-groups`), **Growth** (`/student/growth`, redirects to Analytics).

### 4. Teacher Portal

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
| **Messages** | `/teacher/messages` | In-app messaging with students and parents |
| **Quick Setup** | `/teacher/onboarding` | 3-step onboarding wizard: Subjects → Classes → AI Preferences (v9.7) |
| **AI Builder** | `/teacher/ai-builder` | Upload content → AI generates differentiated assignments for every learning style (v9.7) |
| **AI Feedback** | `/teacher/ai-feedback` | AI-generated structured feedback for student submissions with bulk processing (v9.7) |

**Backward Compatibility**: Old URLs `/teacher/insights` and `/teacher/learning-insights` redirect to the corresponding Analytics tabs.

### 5. Admin / District Portal (12 pages)

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

### 6. Parent Portal (3 pages)

Parents stay connected to their child's education without being overbearing:

| Page | Route | Description |
|---|---|---|
| **Dashboard** | `/parent/dashboard` | Real-time view of children's grades, assignments, recent activity |
| **Messages** | `/parent/messages` | Direct messaging with teachers |
| **Growth Reports** | `/parent/reports` | AI-powered growth summaries, trend analysis, areas of concern |

**Parent API Endpoints**: `/api/parent` (overview), `/api/parent/ai-checkin` (AI safety check-in), `/api/parent/goals` (goal tracking), `/api/parent/reports` (detailed reports).

### 7. Homeschool Portal (5 pages)

Homeschool parents get a hybrid teacher-parent experience:

| Page | Route | Description |
|---|---|---|
| **My Children** | `/parent/dashboard` | Overview of all children's progress |
| **Manage Children** | `/parent/children` | Add/remove children, configure learning profiles |
| **Assignments** | `/teacher/assignments` | Create and manage assignments (teacher capabilities) |
| **AI Grading** | `/teacher/grading` | Grade children's work with AI assistance |
| **Analytics** | `/teacher/analytics` | View children's learning analytics |

### 8. Accessibility

Limud includes a built-in accessibility panel available on all dashboard pages:

| Feature | Description |
|---|---|
| **High Contrast Mode** | Toggle high-contrast colors for visual impairment |
| **Dyslexia Font** | Switch to OpenDyslexic or similar dyslexia-friendly typeface |
| **Text Size Control** | Adjustable text size (small, medium, large, extra-large) |
| **Text-to-Speech** | Select any text and hear it read aloud, or auto-read main content |
| **WCAG Compliance** | Core pages designed to WCAG 2.1 AA standards |
| **Lite Mode** | Performance toggle that disables animations and blur effects for lower-end devices |

### 9. Platform Integrations (16+)

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

### 10. Security & Compliance

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

**Gamification (legacy — database models retained for data integrity)**
- `RewardStats` — Legacy XP, level, streak, coins per user (no longer displayed in UI)
- `Certificate` — Earned certificates (course completion, achievement, milestone)
- `Game`, `GamePurchase`, `GameSession` — Legacy game store models
- `Challenge`, `ChallengeParticipant` — Legacy challenge models
- `SeasonPassProgress`, `DailyBoost`, `MarketplaceListing` — Legacy reward models

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
| `/api/rewards` | GET | Student | Legacy gamification stats (retained for API compatibility) |
| `/api/study-next` | GET | Student | AI-recommended next study action |
| `/api/confidence` | GET | Student | Confidence and mastery self-assessment data |
| `/api/tutor` | POST | Student | AI tutor conversation (send message, get Socratic response) |
| `/api/focus` | GET/POST | Student | Focus mode — get questions (GET), submit answers (POST) |
| `/api/submissions` | GET/POST | Student | View submissions (GET), submit work (POST) |
| `/api/assignments` | GET | Student | View assigned work with status and due dates |
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
| **Free** | $0/forever | 5 | AI Tutor (50/mo), adaptive learning, parent dashboard, AI check-ins |
| **Starter** | $4/student/mo | 50 | AI Tutor, AI Grading, full adaptive learning, file uploads |
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
| `AI_MODEL` | `gemini-2.5-flash` | No (this is the default since v9.7.6) |
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
# Expected: {"status":"ok","version":"9.7.6","platform":"Render","uptime":42.5,...}
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
| `AI_MODEL` | No | `gemini-2.5-flash` | AI model identifier (v9.7.6 default). Options: `gemini-2.0-flash`, `gemini-2.5-flash`, `gemini-2.5-pro`, etc. |
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
- Simulated analytics and learning data

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

## Deploying to Render — Complete Guide

This is a step-by-step guide to deploy Limud on **Render.com**. You should not need to generate anything yourself except API keys — every other value is provided below or auto-detected.

---

### Prerequisites

| What | Where to get it |
|---|---|
| A free **Render** account | [render.com](https://render.com) — sign up with GitHub |
| A **GitHub** repository with the Limud code pushed | Already done — `https://github.com/Fansist/Limud` |
| A **Google Gemini API key** (free) | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) — click "Create API Key", copy it |

That's it. Render provides the PostgreSQL database and everything else is either embedded or auto-detected.

---

### Step 1 — Create the PostgreSQL Database

1. Log in to [dashboard.render.com](https://dashboard.render.com)
2. Click **New +** → **PostgreSQL**
3. Fill in:

| Field | Value |
|---|---|
| Name | `limud-db` |
| Database | `limud` |
| User | `limud` |
| Region | Pick the one closest to your users (e.g., `Oregon (US West)`) |
| PostgreSQL Version | `16` |
| Instance Type | **Free** (for testing) or **Starter $7/mo** (for production) |

4. Click **Create Database**
5. Wait for it to spin up (1-2 minutes), then go to the database's **Info** tab
6. Find **Internal Database URL** — it looks like:
   ```
   postgresql://limud:XXXXXXXXXXXX@dpg-xxxxxxxxxxxxx-a/limud
   ```
7. **Copy this URL.** You will paste it as `DATABASE_URL` in Step 2.

> **Important:** Use the **Internal Database URL** (not External) — it's faster and free of egress charges when both the database and web service are in the same Render region.

---

### Step 2 — Create the Web Service

1. Click **New +** → **Web Service**
2. Connect your GitHub repo: `Fansist/Limud`
3. Fill in the settings:

| Field | Value |
|---|---|
| Name | `limud` (or whatever you want — this becomes `limud.onrender.com`) |
| Region | **Same region** as your database |
| Branch | `main` |
| Root Directory | *(leave blank)* |
| Runtime | **Node** |
| Build Command | `npm install && npx prisma generate && npx prisma db push --skip-generate --accept-data-loss && npm run build` |
| Start Command | `node server.js` |
| Instance Type | **Free** (for testing) or **Starter $7/mo** (for production) |
| Node Version | Go to **Environment** tab → add key `NODE_VERSION` = `20` |

> **Why this Build Command?** It installs dependencies, generates the Prisma client, pushes the schema to the database (creates all tables), and builds the Next.js standalone output.

---

### Step 3 — Set Environment Variables

Go to the web service's **Environment** tab → **Add Environment Variable** for each row below.

#### Required Variables (3)

| Key | Value | Where to find it |
|---|---|---|
| `DATABASE_URL` | `postgresql://limud:XXXX@dpg-xxxxx-a/limud` | Render dashboard → your PostgreSQL database → **Info** tab → **Internal Database URL**. Copy the full URL. |
| `NEXTAUTH_SECRET` | `limud-stable-secret-v9-ofer-academy-2026-Xk7mQ3pZwR4vJ8nB` | **Use this exact value.** This is the embedded secret used by the app. If you change it, all existing sessions will be invalidated. You can generate your own with `openssl rand -base64 32` but then you must use the same value everywhere. |
| `NEXTAUTH_URL` | `https://limud.onrender.com` | Replace `limud` with whatever **Name** you chose in Step 2. This is your Render public URL. Format: `https://<your-service-name>.onrender.com`. **⚠️ MUST include `https://` — bare hostnames like `limud.onrender.com` will cause a build crash (Invalid URL).** |

#### Recommended Variables (3)

| Key | Value | Where to find it |
|---|---|---|
| `GEMINI_API_KEY` | `AIzaSy...your-key` | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) → Create API Key → copy. **This is the only key you need to generate.** Without it, AI features (tutor, grading, quiz generation, feedback engine) run in demo mode with mock responses. |
| `NODE_VERSION` | `20` | Just type `20`. Render uses this to select the Node.js version. The app requires Node 20.x. |
| `NODE_OPTIONS` | `--max-old-space-size=512` | Just type this value. Prevents out-of-memory crashes during build on free-tier instances (512 MB RAM). |

#### Optional Variables (5) — only set these if you need to override defaults

| Key | Default (embedded) | When to set it |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Same as `NEXTAUTH_URL` | Only if you're using a custom domain (e.g., `https://limud.co`). Set it to your custom domain URL. |
| `NEXT_PUBLIC_APP_NAME` | `Limud` | Only if you want to white-label the app with a different name. |
| `AI_MODEL` | `gemini-2.5-flash` | Only if you want to use a different Gemini model. Options: `gemini-2.0-flash` (fast, cheapest), `gemini-2.5-flash` (great quality, default since v9.7.6), `gemini-2.5-pro` (best, slowest). |
| `PII_ENCRYPTION_KEY` | Falls back to `NEXTAUTH_SECRET` | Only if you want a separate key for AES-256-GCM PII field encryption. Must be a long random string. |
| `GOOGLE_API_KEY` | Not set | Alternative to `GEMINI_API_KEY`. If both are set, `GEMINI_API_KEY` takes priority. They do the same thing. |

#### Auto-Detected Variables (do NOT set these)

| Key | Set by | Notes |
|---|---|---|
| `RENDER` | Render (automatically) | The app detects this to know it's running on Render. You will see `[Limud] Platform: Render` in the logs. |
| `PORT` | Render (automatically, always `10000`) | Render assigns the port. The `server.js` reads it automatically. Never set this manually. |
| `NODE_ENV` | Render (automatically, `production`) | Render sets this for all web services. |

---

### Step 4 — Deploy

1. After adding all environment variables, click **Manual Deploy** → **Deploy latest commit** (or just push to `main` and Render auto-deploys).
2. Watch the build logs. A successful build looks like:

```
==> Building...
[Limud] Prisma Client generated
[Limud] Database schema pushed
Route (app)                                Size
┌ ƒ /                                      ...
├ ƒ /login                                 ...
├ ƒ /student/dashboard                     ...
...
==> Build successful
==> Deploying...
==> Starting service with 'node server.js'
[Limud v9.7.1] Platform: Render
[Limud] Node.js v20.x.x
[Limud] Standalone build: YES
[Limud] PORT: 10000
```

3. First deploy takes **3-5 minutes** (npm install + prisma + next build). Subsequent deploys take **2-3 minutes**.

---

### Step 5 — Seed the Database (First Deploy Only)

After the first successful deploy, you need to seed the database with the initial district and admin account.

**Option A — Use the public seed endpoint (easiest):**

Open your browser and visit:
```
https://limud.onrender.com/api/district-link/seed
```

This creates:
- **Ofer Academy** district (and 5 other demo districts)
- **Admin account:** `owner@limud.co` / `LimudRock2026!`

**Option B — Use the Render Shell:**

1. Go to your web service → **Shell** tab
2. Run:
   ```bash
   npx tsx prisma/seed.ts
   ```

This creates:
- **Limud-Academy** district (enterprise tier)
- **Superintendent account:** `owner@limud.co` / `LimudRock2026!`

---

### Step 6 — Verify

Test these URLs (replace `limud` with your service name):

| URL | Expected |
|---|---|
| `https://limud.onrender.com/api/health` | `{"status":"ok","version":"9.7.6","platform":"Render",...}` |
| `https://limud.onrender.com/login` | Login page loads with Limud branding |
| `https://limud.onrender.com/demo` | Demo mode selector (Student, Teacher, Admin, Parent) |
| `https://limud.onrender.com/register` | Registration page |

Log in with:
- **Admin:** `owner@limud.co` / `LimudRock2026!`
- **Master Demo (all roles):** `master@limud.edu` / `LimudMaster2026!`
- **Demo accounts** (no password needed — use buttons on login page)

---

### Custom Domain (Optional)

1. In Render dashboard → your web service → **Settings** → **Custom Domains**
2. Add your domain (e.g., `limud.co`)
3. Render gives you a CNAME record — add it to your DNS provider
4. Update your environment variables:
   - `NEXTAUTH_URL` = `https://limud.co`
   - `NEXT_PUBLIC_APP_URL` = `https://limud.co`
5. Render auto-provisions an SSL certificate

---

### Troubleshooting

| Problem | Solution |
|---|---|
| **Build fails with OOM** | Add `NODE_OPTIONS` = `--max-old-space-size=512` to environment variables. If still failing, upgrade to Starter plan ($7/mo, 1 GB RAM). |
| **"Invalid prisma client"** | Make sure `DATABASE_URL` is set correctly in environment variables. It must start with `postgresql://`. |
| **Login redirects in a loop** | Check that `NEXTAUTH_URL` exactly matches your Render URL (including `https://`). No trailing slash. |
| **AI features return mock data** | Set `GEMINI_API_KEY` in environment variables. Get a free key from [aistudio.google.com/apikey](https://aistudio.google.com/apikey). |
| **"CSRF token mismatch"** | This happens when `NEXTAUTH_URL` doesn't match the actual URL. Fix it in environment variables. |
| **Free plan spins down after 15 min** | Normal — Render free tier spins down after inactivity. First request takes ~30s to wake up. Upgrade to Starter ($7/mo) for always-on. |
| **Database connection refused** | Make sure you're using the **Internal** Database URL (not External) and the database is in the **same region** as your web service. |
| **Styles/CSS look broken** | Clear browser cache. The standalone build copies static assets; if an old deployment cached them, they may be stale. |

---

### Environment Variables Summary (Copy-Paste Ready)

```env
# ══════════════════════════════════════════════════════
# Render Dashboard → Web Service → Environment
# ══════════════════════════════════════════════════════

# REQUIRED — paste your Render Internal Database URL
DATABASE_URL=postgresql://limud:YOUR_PASSWORD@dpg-XXXX-a/limud

# REQUIRED — the embedded JWT secret (use this exact value)
NEXTAUTH_SECRET=limud-stable-secret-v9-ofer-academy-2026-Xk7mQ3pZwR4vJ8nB

# REQUIRED — your Render public URL (no trailing slash)
NEXTAUTH_URL=https://YOUR-SERVICE-NAME.onrender.com

# RECOMMENDED — get from https://aistudio.google.com/apikey
GEMINI_API_KEY=AIzaSy...your-key-here

# RECOMMENDED — Node.js version
NODE_VERSION=20

# RECOMMENDED — prevent OOM on free tier
NODE_OPTIONS=--max-old-space-size=512
```

---

### Architecture on Render

```
┌─────────────────────────────────────────────────┐
│  Render Web Service (Node.js 20)                │
│  ┌───────────────────────────────────────────┐  │
│  │  server.js (entry point)                  │  │
│  │  → Detects RENDER env var                 │  │
│  │  → Reads PORT=10000 automatically         │  │
│  │  → Loads .next/standalone/server.js       │  │
│  │  → Serves Next.js app                     │  │
│  ├───────────────────────────────────────────┤  │
│  │  Next.js 14 (standalone output)           │  │
│  │  ├── Pages (React SSR)                    │  │
│  │  ├── API Routes (/api/*)                  │  │
│  │  ├── Edge Middleware (auth, security)      │  │
│  │  └── Static Assets (/public/*)            │  │
│  ├───────────────────────────────────────────┤  │
│  │  Prisma ORM → PostgreSQL                  │  │
│  │  NextAuth.js (JWT sessions)               │  │
│  │  Google Gemini AI (@google/genai)         │  │
│  └───────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────┘
                       │ Internal Network
┌──────────────────────▼──────────────────────────┐
│  Render PostgreSQL Database                      │
│  ├── 60+ tables (users, districts, assignments)  │
│  ├── FERPA audit logs (7-year retention)         │
│  └── COPPA parental consent records              │
└─────────────────────────────────────────────────┘
```

---

## Changelog

### v11.0.0 (2026-04-01) — "The Depth Update"

#### Dashboard Interactivity Fixes (Phase 1)
- **Clickable assignment rows**: Each assignment in "Recent Assignments" now links to its grading page with the assignment pre-selected
- **Clickable student rows**: Each student in "Students Needing Attention" now links to the Intelligence Dashboard with student context
- **Clickable stat cards**: Total Students → My Students page, At-Risk → Intelligence Dashboard, Class Average → Analytics, Pending Grading → Grading page
- **"View all" and "Intelligence" links**: Already functional (verified), navigate to assignments list and intelligence dashboard respectively

#### Classroom Settings (formerly Quick Setup)
- **One-time wizard guard**: Teachers who have completed Quick Setup can no longer re-run the wizard
- **Settings mode**: After first setup, the page becomes "Classroom Settings" — a single-page editor where teachers can update subjects, classes, grade level, and AI preferences at any time
- **Saved state persistence**: All onboarding choices (subjects, grade range, AI preferences) are saved and restored when revisiting settings
- **Nav renamed**: Sidebar item changed from "Quick Setup" to "Classroom Settings" with a gear icon

#### Depth & Drill-Down Enhancements (Phase 2)

##### Teacher Intelligence
- **Expandable student rows**: Clicking a student row in the "All Students" tab now reveals an expanded detail panel with 4 stat cards (Average Score, Engagement, Streak, Study Time), AI Insights text, and action links (Full Profile, Learning Style, Generate Plan)
- **Clickable summary cards**: Total Students → Students tab, At Risk → Risk tab, etc. — summary cards now navigate to relevant tabs on click
- **Action deep-links**: Each expanded row links to /teacher/students, /teacher/analytics (Learning Style tab), and can trigger AI Intervention plan generation

##### Teacher Analytics (Overview)
- **Student profile deep-links**: Student profile overlay now includes action buttons linking to Full Profile (/teacher/students), AI Intelligence (/teacher/intelligence), and Grade Work (/teacher/grading)

##### Student Knowledge / Analytics
- **Expandable skill mastery**: Each skill in the "Skill Mastery" section is now clickable, revealing practice session count, last practiced date, streak, AI study tips, and quick-links to "Practice with AI Tutor" and "Focus Session"
- **Expandable goal countdown**: Each goal in "Goal Countdown" expands to show an AI tip and a contextual action button (Study Now, Practice, Quick Session, View Assignments) linking to the appropriate page

##### Parent Reports / Growth Reports
- **Expandable recent activity**: Each assignment in "Recent Activity" now expands on click, showing letter grade, points breakdown, subject, and an AI-generated insight about the child's performance
- **Expandable subject performance**: Subject bars in "By Subject" are now clickable, revealing individual assignment scores within each subject
- **AnimatePresence transitions**: Smooth expand/collapse animations on all drill-down panels

#### Version Bump
- Version bumped to 11.0.0 across all 7 config locations (package.json, config.ts, middleware.ts, server.js, health route, ai-status route, demo-state.ts)
- Admin Dashboard version comment updated to v11.0.0

---

### v10.0.0 (2026-03-31) — "The Full Stack" Major Release

#### CI/CD & Infrastructure
- GitHub Actions workflow: lint → type-check → test → build on every push/PR
- SKIP_DB_PUSH env var for CI builds
- New env vars: RESEND_API_KEY, CRON_SECRET
- Added `jspdf` and `resend` to server-side external packages

#### SEO
- XML sitemap (9 public pages)
- Schema.org JSON-LD: Organization, WebApplication
- OpenGraph + Twitter Card meta tags enhanced
- robots.txt updated with sitemap reference to limud.co

#### Announcement Persistence
- Announcements stored in PostgreSQL via new Announcement Prisma model (was in-memory)
- Admin CRUD: create, edit, delete, set expiry, target by role
- Cross-role broadcast triggers notifications to all matching users
- Demo fallback for non-DB mode

#### PDF Report Export
- Branded PDF reports: student summary, per-course breakdown, grades, AI feedback
- Export from Teacher Students, Parent Dashboard, Admin Students pages
- FERPA-compliant footer and metadata
- jsPDF server-side generation with download trigger

#### Email Notifications
- Resend integration for transactional email
- Templates: welcome, grade posted, assignment due reminder, weekly parent digest
- Cron endpoint for weekly parent digest (/api/cron/weekly-digest)
- Graceful no-op when RESEND_API_KEY is not set

#### Discussion Forums
- Per-course threaded discussion boards (new ForumPost Prisma model)
- Teacher moderation: pin, resolve, delete
- Reply threading with indentation
- Accessible from Student (Learning > Discussions) and Teacher (Classroom > Forums) navigation

#### Internationalization (i18n)
- Cookie-based locale detection with 3 languages
- English (en), Hebrew (he), Spanish (es) — full message files
- RTL layout support for Hebrew (html dir="rtl")
- Language switcher in dashboard header (globe dropdown)
- Scope: landing page, login, register, 4 dashboards, navigation, common UI

#### Performance
- Core Web Vitals tracking: LCP, FID, CLS, INP — auto-reported via PerformanceObserver
- Metrics sent to /api/analytics via sendBeacon
- LazySection + LazyMotion components for below-fold content
- Dynamic import optimization for heavy dependencies

#### Notification System Enhanced
- PATCH endpoint for bulk mark-as-read (individual IDs or all)
- POST endpoint for programmatic notification creation (teacher/admin)
- Email integration: grade posted → student email via Resend
- Announcement create → notification broadcast to district users

### v9.9.0 (2026-03-30) — "The Four Pillars" Blueprint Update

#### What Changed

**Major UI/UX overhaul implementing the "Four Pillars" product blueprint.** Every portal now tells a cohesive story aligned to the company mission: *Eliminate the one-size-fits-all classroom using cognitive science & generative AI.*

#### Landing Page — "The Four Pillars"
- Complete rewrite with mission-driven hero: "Eliminate the one-size-fits-all classroom"
- Four Pillars narrative: Student (Sylvester), Teacher (Mrs. Osher), Admin (Supt. Ofer), Parent (David Betzalel)
- Core Engine section: The Brain (Gemini 2.5 Flash), The Science (SM-2, Learning DNA), The Security (AES-256-GCM)
- Self-Reinforcing Loop value proposition + "Works alongside tools you love" comparison section
- Streamlined pricing: Free / Standard $6 / Enterprise
- Interactive mini-dashboard preview showing Sylvester's student view

#### Student Dashboard — "The Sylvester Experience"
- XP, daily streak, and level restored in welcome banner (Blueprint: "Instant Gratification")
- Learning DNA badge displayed (e.g., "Auditory Learner")
- Quick actions: Adaptive Assignments, Socratic AI Tutor, Focus Mode, Growth Analytics
- Stats strip: Total Assignments, Completed, Avg Score, Level

#### Teacher Dashboard — "The Mrs. Osher Experience"
- New gradient welcome banner with classroom stats (Students, Class Avg, To Grade)
- At-risk student alert banner linking to Intelligence Dashboard
- Core workflow cards: Upload & Adapt → AI Quiz Generator → One-Click Auto-Grade → Intelligence Dashboard
- Secondary actions: AI Lesson Planner, My Students, Performance Analytics, Worksheet Finder

#### Admin Dashboard — "The Superintendent Ofer Command Center"
- Renamed to "Command Center" with dark-gradient hero KPI banner
- Blueprint KPIs front-and-center: Active Students, Teachers, Annual Cost, Per Student/Year
- Compliance widget with colored left-border indicators (System Status, FERPA/COPPA/WCAG, AI Features)
- Trending Today live metrics + Alerts & Insights feed
- Quick actions: Announcements (cross-role broadcasts), Bulk Import (CSV), Compliance Reports

#### Parent Dashboard — "The David Betzalel Experience"
- AI Check-In promoted to hero action: prominent white button with shadow on gradient banner
- Homeschool Teacher Tools section: Create Assignment, AI Quiz Gen, 87+ Worksheets, AI Auto-Grade (all free)
- Demo check-in report now includes Study Habits section
- Cleaner stat grid: XP Earned, Best Streak, Tutor Chats, Completed assignments
- Rose-to-violet gradient on child hero cards

#### Version Bump
- All 7 config files updated: package.json, config.ts, middleware.ts, server.js, health/route.ts, ai-status/route.ts, demo-state.ts

---

### v9.8.0 (2026-03-30) — Remove Gamification System

#### What Changed

**Complete removal of the gamification system from the entire platform.** All XP, levels, streaks, coins, badges, leaderboards, daily challenges, game store, and avatar shop UI elements have been stripped from every page, API route, navigation menu, and landing page. The platform now focuses purely on academic progress and adaptive learning.

**Why:** Gamification features (XP, coins, leaderboards) were creating distractions from core learning objectives and adding unnecessary complexity. The platform's value lies in its AI-powered adaptive learning, not game mechanics.

#### What Was Removed

| Category | Removed Items |
|---|---|
| **Student Pages** | Rewards, Game Store, Daily Challenge, Leaderboard, Badges, Certificates pages |
| **Teacher Pages** | Game Control page |
| **Components** | `src/components/gamification/RewardComponents.tsx` (XPBar, StreakDisplay, CoinDisplay, StatsGrid, BadgeGrid) |
| **Library** | `src/lib/gamification.ts` (XP awards, streak tracking, level-up logic) |
| **Navigation** | Removed all gamification nav entries from student and teacher sidebars |
| **Landing Page** | Removed "Gamification" feature card, "Educational Games" references, game/reward mentions from pricing and FAQ |
| **API Routes** | Removed gamification calls from `/api/tutor`, `/api/submissions`, `/api/grade`; cleaned `/api/ai-navigator` reward/game handlers |
| **Subscription Tiers** | Removed 'basic-gamification', 'gamification', 'game-store', 'rewards' from tier feature lists |
| **Admin Settings** | Removed gamificationEnabled, leaderboardEnabled, dailyChallengeEnabled, gameStoreEnabled feature toggles from UI labels |
| **Metadata** | Removed "gamification" from site keywords and meta descriptions |

#### What Was Kept

- **Database models** (RewardStats, Game, Challenge, etc.) are retained in the Prisma schema for data integrity — no destructive migration
- **DEMO_REWARD_STATS** in `demo-data.ts` retained as inert data (no UI renders it)
- **Certificates** page retained as it serves an academic purpose (course completion certificates)

#### Teacher Students Page Reworked

The teacher's "My Students" page (`/teacher/students`) was updated to replace gamification metrics:
- **Removed**: Total XP, Streak, Level displays
- **Added**: Average Score, Assignments Completed, Focus Time metrics
- Student detail overlay now shows academic-focused stats instead of XP/streak/level

#### Files Changed (30+)

| File | Change |
|---|---|
| `src/components/gamification/` | **Deleted** entire directory |
| `src/app/student/certificates/` | **Deleted** (page removed) |
| `src/lib/gamification.ts` | **Deleted** |
| `src/components/landing/LandingPage.tsx` | Removed gamification feature card, game references, updated pricing/FAQ |
| `src/components/layout/DashboardLayout.tsx` | Removed gamification nav entries |
| `src/lib/subscription.ts` | Removed gamification feature identifiers from all tiers |
| `src/app/api/tutor/route.ts` | Removed onTutorSession/updateStreak calls |
| `src/app/api/submissions/route.ts` | Removed updateStreak import and call |
| `src/app/api/grade/route.ts` | Removed onAssignmentGraded import and call |
| `src/app/api/ai-navigator/route.ts` | Replaced reward/game handlers with progress/study handlers |
| `src/app/api/demo/route.ts` | Cleaned gamification-related demo responses |
| `src/app/teacher/students/page.tsx` | Replaced XP/streak/level with academic metrics |
| `src/app/admin/settings/page.tsx` | Removed gamification feature toggle labels |
| `src/app/layout.tsx` | Removed "gamification" from meta keywords |
| `src/app/(legal)/about/page.tsx` | Removed gamification references |
| `src/app/(auth)/login/page.tsx` | Updated tagline (removed "gamified rewards") |
| `src/app/(auth)/onboard/page.tsx` | Removed gamification plan descriptions |
| `src/app/(auth)/pricing/page.tsx` | Removed gamification pricing features |
| Version bumped in 8 config files | 9.7.11 -> 9.8.0 |

### v9.7.11 (2026-03-29) — Add AI Lesson Planner

#### What's New

A full **AI Lesson Planner** for teachers — generate complete, standards-aligned lesson plans in seconds.

**Features:**
1. **Configure wizard** — pick subject (12 options), grade level (K-12 + AP/IB), topic, class duration (30-90 min), lesson format (6 styles: Direct Instruction, Inquiry-Based, Workshop Model, Flipped Classroom, Collaborative, Project-Based), and Bloom's Taxonomy focus level.
2. **AI generation** — produces a complete lesson plan with:
   - Learning objectives (editable, add/remove inline)
   - Standards alignment (auto-generated CCSS references)
   - Essential question & key vocabulary
   - **Timed lesson flow** — 5 sections (Warm-Up, Introduction, Main Activity, Independent Practice, Closure) each with minute-level timing, teacher actions, student actions, materials, and tips
   - Visual **timeline bar** showing time allocation across sections
   - Formative & summative assessment strategies
   - **3-tier differentiation** (struggling / on-level / advanced)
   - Homework assignment
   - Materials checklist (with checkboxes)
   - Post-lesson teacher reflection prompts
3. **Save / Load** — save plans to local storage, load them back, delete old ones
4. **Copy / Print** — copy full plan as formatted text, or print directly from browser
5. **Course integration** — links to courses created in Quick Setup (v9.7.9)
6. **Expandable sections** — click any lesson section to see detailed teacher & student action steps

**Navigation:**
- Added to **AI Tools** section in teacher sidebar (first item, with CalendarDays icon)
- Added as a **quick action card** on the Teacher Dashboard (4-column grid)

#### Files Changed

| File | Change |
|------|--------|
| `src/app/teacher/lesson-planner/page.tsx` | **New** — 530+ line full AI Lesson Planner page |
| `src/components/layout/DashboardLayout.tsx` | Added Lesson Planner to teacher sidebar nav (AI Tools section) |
| `src/app/teacher/dashboard/page.tsx` | Added Lesson Planner quick action card, expanded grid to 4 columns |
| Version bumped in 10 config files | 9.7.9 → 9.7.11 |

### v9.7.9 (2026-03-28) — Fix Quick Setup: Custom Courses Not Persisting

#### Root Cause

When a teacher completed the **Quick Setup (onboarding) wizard** and created custom courses/classes, the data was sent to `/api/teacher/onboarding` which doesn't exist. The API call silently failed, the wizard redirected to the dashboard with a "Preview mode" toast, and **all created courses were lost**. Every page (Assignments, Games, Classrooms) then fell back to the 4 hardcoded demo courses (Biology 101, Algebra II, English Literature, World History).

#### Fix

1. **Added `customCourses` and `customClassrooms` to shared demo state** (`demo-state.ts`): New fields in the localStorage-persisted `DemoState` object, with `saveOnboardingCourses()`, `getDemoCourses()`, and `getDemoClassrooms()` functions.

2. **Updated onboarding wizard** (`teacher/onboarding/page.tsx`): `handleFinish()` now builds proper `DemoCourse[]` and `DemoClassroom[]` objects from the wizard inputs and saves them to shared demo state before redirecting. Toast now confirms "Setup complete! N courses created."

3. **Updated all pages that display courses/classrooms**:
   - `teacher/assignments` — course dropdown now uses `getDemoCourses()` (shows onboarding courses + built-in defaults)
   - `teacher/games` — game control classrooms merged from `getDemoClassrooms()`
   - `admin/classrooms` — classroom management includes onboarding-created classrooms
   - `student/classrooms` — My Classrooms page includes onboarding-created classrooms

4. **Deduplication**: `getDemoCourses()` and `getDemoClassrooms()` deduplicate by ID so custom courses override matching built-in ones. Custom courses appear first in lists.

#### Files Changed

| File | Change |
|------|--------|
| `src/lib/demo-state.ts` | Added `DemoCourse`, `DemoClassroom` interfaces; `customCourses`/`customClassrooms` fields; `saveOnboardingCourses()`, `getDemoCourses()`, `getDemoClassrooms()` functions |
| `src/app/teacher/onboarding/page.tsx` | `handleFinish()` builds course/classroom objects and saves to demo state |
| `src/app/teacher/assignments/page.tsx` | Replaced `DEMO_COURSES` with `getDemoCourses()` for course dropdown |
| `src/app/teacher/games/page.tsx` | Replaced local `DEMO_CLASSROOMS` with `getDemoClassrooms()` merge |
| `src/app/admin/classrooms/page.tsx` | Replaced local `DEMO_CLASSROOMS` with `getDemoClassrooms()` merge |
| `src/app/student/classrooms/page.tsx` | Replaced local `DEMO_CLASSROOMS` with `getDemoClassrooms()` merge |
| Version bumped in 10 config files | 9.7.8 → 9.7.9 |

### v9.7.8 (2026-03-28) — Fix Auto-Differentiated Assignments: Toast Spam & Grammar Bugs

#### Bugs Fixed

1. **Toast spam on "Generate All"**: Clicking "Generate Auto-Differentiated Assignments for All" fired 5 simultaneous individual toasts (one per topic), stacking and obscuring the entire Weakest Skills section. Now fires a **single summary toast** (e.g., "Auto-differentiated assignments created for 5 topics across 7 students").

2. **Grammar: "1 students"**: Three toasts and the Weakest Skills labels showed "1 students" instead of "1 student". Added `pluralize()` helper that handles singular/plural correctly throughout the page.

3. **Button not disabled after click**: The "Generate All" button had no loading/disabled state, allowing duplicate clicks and duplicate assignment creation. Now shows:
   - Default: "Generate Auto-Differentiated Assignments for All"
   - Loading: spinner + "Generating Assignments..." (disabled)
   - Done: checkmark + "Assignments Created" (green, disabled)

4. **"X students struggling" label**: The Weakest Skills cards showed "1 students struggling" — now correctly shows "1 student struggling".

#### Files Changed (12)

| File | Change |
|------|--------|
| `src/app/teacher/intelligence/page.tsx` | Added `pluralize()` helper, `handleBulkAutoAssign()` with single summary toast, `bulkAssigning`/`bulkCompleted` states, disabled button states, fixed all pluralization |
| Version bumped in 10 config files | 9.7.7 → 9.7.8 |

### v9.7.7 (2026-03-28) — Fix Master Demo: Empty Student Lists Across All Roles

#### Root Cause

The `useIsDemo()` hook explicitly returned `false` for Master Demo users (the `master@limud.edu` account). This was an intentional design from v9.3.5 — the idea was that Master Demo would use its own `isMasterDemo` session flag and pages would handle it separately.

**However**, out of 40+ pages across all roles, only 6 pages actually checked `isMasterDemo`:
- `teacher/dashboard`, `teacher/analytics`, `teacher/students`
- `student/dashboard`, `admin/dashboard`, `parent/dashboard`

All other pages — teacher/grading, teacher/messages, teacher/reports, admin/employees, admin/students, parent/messages, parent/reports, and 25+ more — only checked `isDemo`, which returned `false` for Master Demo. This caused them to call real database APIs that failed with no database, resulting in **empty student lists, empty classrooms, missing messages, and blank analytics** across the entire Master Demo experience.

#### Fix

1. **`useIsDemo()` now returns `true` for Master Demo users** — all pages automatically use demo data
2. **`useNeedsDemoParam()` hook added** — prevents Master Demo from adding `?demo=true` to URLs (which would trigger the generic demo banner in DashboardLayout)
3. **Removed broken `isMasterDemo` checks** from 6 dashboard pages (redundant now)
4. **DashboardLayout unchanged** — it has its own independent demo state management and still correctly shows the Master Demo role switcher (not the generic demo banner)

#### Files Changed (17)

| File | Change |
|------|--------|
| `src/lib/hooks.ts` | `useIsDemo()` returns true for isMasterDemo; added `useNeedsDemoParam()` |
| `src/app/teacher/dashboard/page.tsx` | Removed broken isMasterDemo check; use `needsDemoParam` |
| `src/app/student/dashboard/page.tsx` | Removed broken isMasterDemo check; use `needsDemoParam` |
| `src/app/admin/dashboard/page.tsx` | Removed broken isMasterDemo check; use `needsDemoParam` |
| `src/app/parent/dashboard/page.tsx` | Removed broken isMasterDemo check |
| `src/app/teacher/analytics/page.tsx` | Removed broken isMasterDemo check; use `needsDemoParam` |
| `src/app/teacher/students/page.tsx` | Simplified — removed explicit isMasterDemo check |
| `src/app/student/survey/page.tsx` | Simplified role guard |
| `src/app/student/messages/page.tsx` | Use `needsDemoParam` |
| `src/app/student/classrooms/page.tsx` | Use `needsDemoParam` |
| `src/lib/config.ts` | Version → 9.7.7 |
| `package.json` | Version → 9.7.7 |
| `server.js` | Version → 9.7.7 |
| `src/middleware.ts` | Version → 9.7.7 |
| `src/app/api/health/route.ts` | Version → 9.7.7 |
| `src/app/api/ai-status/route.ts` | Version → 9.7.7 |
| `src/lib/demo-state.ts` | STATE_VERSION → 9.7.7 |

#### Impact

**Before v9.7.7**: Master Demo users saw empty student lists, blank analytics, missing messages, and no data on 30+ pages.

**After v9.7.7**: All 40+ pages across Student, Teacher, Admin, and Parent roles display full demo data (Lior, Eitan, Noam — Ofer Academy students) when accessed via Master Demo.

### v9.7.6 (2026-03-28) — Upgrade to Gemini 2.5 Flash (Paid Tier 1)

#### What Changed

The AI backend has been upgraded from `gemini-2.0-flash` (free) to `gemini-2.5-flash` (paid tier 1). This ensures all AI features — quiz generation, tutoring, grading, feedback, adaptive assignments, exam simulation, AI navigator, parent check-ins, curriculum analysis, and writing feedback — use the higher-quality model with paid API key guarantees.

#### Changes

1. **Default model updated globally** — All 11 AI-consuming routes now default to `gemini-2.5-flash`:
   - `src/lib/ai.ts` — Core `callGemini()` function and `getAIStatus()` helper
   - `src/lib/config.ts` — `AI_MODEL` constant
   - `src/app/api/worksheet-search/route.ts` — Direct Gemini API call (was hardcoded to `gemini-2.0-flash`)
2. **Error handling improved for paid tier** — Rate limit (429) errors now include "paid tier 1" context in error messages for faster debugging
3. **Environment config updated** — `.env`, `.env.example` comments reflect `gemini-2.5-flash` as the new default
4. **server.js hardened** — Added explicit comment that production env vars always take priority over `.env` file values (`.env` GEMINI_API_KEY="demo-mode" will NOT override the Render Dashboard value)
5. **Version bumped to 9.7.6** — config.ts, middleware.ts, server.js, health route, package.json, ai-status route, demo-state.ts

#### AI Routes Using Gemini 2.5 Flash

| Route | Feature | Fallback |
|---|---|---|
| `/api/tutor` | AI Tutor (personalized chat) | Demo topic-based responses |
| `/api/grade` | AI Auto-Grader | Heuristic-based scoring |
| `/api/quiz-generator` | Quiz Generation | Template question bank |
| `/api/exam-sim` | Exam Simulation | Static question set |
| `/api/ai-navigator` | Platform Navigator | Pattern-matched responses |
| `/api/adaptive` | Assignment Adaptation | Basic style-flagged version |
| `/api/teacher/ai-builder` | Assignment Builder | Empty fallback |
| `/api/teacher/ai-feedback` | Submission Feedback | Heuristic-based feedback |
| `/api/teacher/reports` | Student/Curriculum Reports | Template reports |
| `/api/parent/ai-checkin` | Parent Check-In Reports | Template reports |
| `/api/worksheet-search` | Worksheet Discovery | Google fallback only |

#### Render Environment

Set in Render Dashboard → **Environment**:
```
GEMINI_API_KEY=your-paid-api-key
AI_MODEL=gemini-2.5-flash    # (optional — this is now the default)
```

#### Verification

1. Deploy to Render
2. Visit `/api/ai-status?test=true` → should show `testResult: "success"`, `model: "gemini-2.5-flash"`
3. Generate a quiz → toast should say "Quiz generated with AI-powered questions!"
4. Check Render logs for `[GEMINI] Calling gemini-2.5-flash with valid API key...`

### v9.7.5 (2026-03-28) — Master Demo Overhaul: Fully Connected Cross-Role Experience

#### What Changed

The Master Demo (master@limud.edu) now provides a fully interconnected, realistic demonstration where all roles share the same data universe. Previously, the teacher portal showed placeholder students (Alex Rivera, Sophia Chen) and had no connection to the student portal data, making it impossible to demonstrate the full workflow.

#### Key Fixes

1. **Cross-Role Shared State** — New `demo-state.ts` module uses localStorage to share data between teacher, student, admin, and parent portals. When a teacher creates an assignment, the student can see and submit it. When admin creates an announcement, all roles see it.

2. **Ofer Academy Consistency** — All demo pages now use the canonical Ofer Academy cast:
   - **Students**: Lior Betzalel (10th), Eitan Balan (9th), Noam Elgarisi (10th)
   - **Teacher**: Gregory Strachen
   - **Admin**: Erez Ofer (Superintendent)
   - **Parent**: David Betzalel (Lior's parent)
   - Removed all placeholder names (Alex Rivera, Sophia Chen, Dr. Sarah Chen, Michael Torres, etc.)

3. **Teacher Students Page** — Now shows the three Ofer Academy students with real data (XP, streaks, grades, learning styles, courses, risk levels) derived from the canonical `demo-data.ts`.

4. **Teacher Messages** — Conversations are now with actual demo students (Lior, Eitan, Noam), parent (David Betzalel), and admin (Erez Ofer) instead of generic placeholders.

5. **Student Messages** — Student sees messages from their actual teachers (Gregory Strachen, Rachel Kim), parent (David Betzalel), and admin (Erez Ofer).

6. **Parent Messages** — Parent (David Betzalel) sees messages from Lior's teachers, Lior himself, and the district admin.

7. **Teacher Grading** — Fixed student name display bug where `sub.student?.name` was undefined (submissions use `studentName` field).

8. **Teacher Intelligence** — AI-powered class insights now show Ofer Academy students instead of generic placeholders.

9. **Teacher Reports** — AI report generator lists the three Ofer Academy students.

10. **Student Leaderboard** — Features Ofer Academy students at the top with correct XP/level data.

11. **Student Certificates** — Uses student's actual name (Lior Betzalel) instead of placeholder.

12. **Admin Announcements** — Authors are now Erez Ofer/Gregory Strachen instead of Michael Torres/Dr. Sarah Chen. Announcements created by admin are visible to other roles via shared state.

#### Files Changed (20+)
- `src/lib/demo-state.ts` (NEW) — Cross-role shared state manager
- `src/app/teacher/students/page.tsx` — Rebuilt with Ofer Academy data
- `src/app/teacher/messages/page.tsx` — Ofer Academy contacts
- `src/app/teacher/grading/page.tsx` — Fixed studentName display
- `src/app/teacher/assignments/page.tsx` — Shared state integration
- `src/app/teacher/reports/page.tsx` — Ofer Academy students
- `src/app/teacher/intelligence/page.tsx` — Ofer Academy students
- `src/app/student/assignments/page.tsx` — Shared state integration
- `src/app/student/dashboard/page.tsx` — Shared state integration
- `src/app/student/messages/page.tsx` — Ofer Academy contacts
- `src/app/student/leaderboard/page.tsx` — Ofer Academy students
- `src/app/student/certificates/page.tsx` — Correct name
- `src/app/admin/announcements/page.tsx` — Ofer Academy authors + shared state
- `src/app/parent/messages/page.tsx` — Ofer Academy contacts
- Version bumped in: config.ts, middleware.ts, server.js, health route, package.json

### v9.7.4 (2026-03-28) — Fix AI Always Using Template Despite Valid Key

#### Root Cause
Despite v9.7.3 hardening, AI features continued falling back to template/demo mode even with a valid GEMINI_API_KEY. Multiple compounding issues:

1. **`callGemini()` used `'demo-mode'` as fallback API key** — Line 213: `const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || 'demo-mode'`. When `hasApiKey()` returned true (because the env var existed), `callGemini()` would be called, but if for any reason the env var wasn't accessible at call time (e.g., `.env` file shadowing), it fell back to `'demo-mode'` which triggered a 400 `API_KEY_INVALID` error from Google.
2. **Silent JSON extraction failures** — When `callGemini()` succeeded, `extractJSON()` sometimes returned `null` on valid responses with markdown fencing. The code silently fell through to template without logging, and `aiError` stayed `null`.
3. **Insufficient `maxTokens`** — Quiz generation used `maxTokens: 4000` which could truncate large quiz responses, producing malformed JSON that failed parsing.
4. **Error code mismatch** — The Gemini API returns `400` (not `401`/`403`) for invalid API keys, but the error handler only checked for `401` and `403`.
5. **No validation in `extractJSON`** — The function extracted a substring between `[` and `]` but never verified it was valid JSON, so corrupted extractions were passed to `JSON.parse()` which threw.

#### Fixes (13 files changed)
1. **`callGemini()` no longer uses 'demo-mode' fallback** — Now uses empty string and throws immediately if key is missing/invalid. No bad keys ever reach Google's API.
2. **`callGemini()` validates key before calling** — Runs the same `INVALID_KEY_PATTERNS` check and throws a clear error instead of making a doomed API call.
3. **`extractJSON()` hardened** — Now tries direct `JSON.parse()` first, validates extracted substrings, fixes trailing commas, and logs diagnostic info on failure.
4. **Error handler catches `400`/`INVALID_ARGUMENT`** — Matches the actual Gemini API error codes.
5. **All AI routes log explicitly** — Every call to `callGemini()` now logs `[FEATURE] Calling Gemini...` before and `[FEATURE] SUCCESS: N chars` after. Failures log the exact error message.
6. **Quiz generator tracks ALL failure modes** — `aiError` is set for: extractJSON returning null, non-array response, empty array, validation failures, and parse errors. No more silent fallbacks.
7. **Increased `maxTokens`** — Quiz generator: 4000→8000. AI Builder: 4000→8000. Feedback: 1500→2000. Exam sim: 2048→4000. Adaptive: 2048→4000.
8. **New `callGeminiSafe()` wrapper** — Returns `{ ok: true, data }` or `{ ok: false, error }` for callers that prefer result objects.
9. **`/api/ai-status` enhanced** — Now returns key prefix, key length, key source, and supports `?test=true` to make a live API test call.
10. **Toast shows actual error** — Quiz generator toast now displays the specific AI error instead of generic "template bank" message.
11. **Exam simulator uses `extractJSON()`** — Previously did raw `JSON.parse(response || '[]')` which always failed on markdown-wrapped responses.

#### Verification (on Render)
1. Set `GEMINI_API_KEY` in Render Dashboard → redeploy
2. Visit `/api/ai-status?test=true` — should show `testResult: "success"`
3. Generate quiz → toast should say "Quiz generated with AI-powered questions!"
4. Check Render logs for `[GEMINI] Calling gemini-2.5-flash with valid API key...`

#### Files Changed
- `src/lib/ai.ts` — Core fixes: removed demo-mode fallback, added key validation, hardened extractJSON, added callGeminiSafe, added logging to all AI functions
- `src/app/api/quiz-generator/route.ts` — Comprehensive error tracking, increased maxTokens
- `src/app/api/teacher/ai-builder/route.ts` — Added error tracking and logging
- `src/app/api/teacher/ai-feedback/route.ts` — Added logging, increased maxTokens
- `src/app/api/exam-sim/route.ts` — Use extractJSON instead of raw JSON.parse
- `src/app/api/adaptive/route.ts` — Increased maxTokens, added logging
- `src/app/api/ai-navigator/route.ts` — Added logging
- `src/app/api/parent/ai-checkin/route.ts` — Added logging
- `src/app/api/ai-status/route.ts` — Enhanced with diagnostics and test mode
- `src/app/teacher/quiz-generator/page.tsx` — Toast shows actual AI error
- Version bumps: config.ts, middleware.ts, server.js, health route, package.json

### v9.7.3 (2026-03-28) — AI Pipeline Hardening: Eliminate Silent Demo-Mode Fallbacks
4. **Quiz Generator route rewritten** — Dynamic Prisma import (never crashes on DB unavailable), returns `aiStatus` and `aiError` in all responses, gracefully handles DB-save failures.
5. **Quiz Generator page AI indicator** — Shows green dot "AI Active (gemini-2.5-flash)" or amber dot "AI Offline — Using Template Bank" next to the page header. Toast messages now differentiate between AI-generated and template-bank quizzes.
6. **AI Builder & Feedback APIs** — Now return `aiStatus` in responses for frontend transparency.
7. **New `/api/ai-status` endpoint** — Authenticated endpoint that returns AI configuration status for any page to check.
8. **Standalone `.env` fixed** — `.env` now has `GEMINI_API_KEY="demo-mode"` which is correctly rejected by `isGeminiConfigured()`. On Render, the real API key from environment variables overrides this.

#### How to Verify AI Is Working
1. Set `GEMINI_API_KEY` in Render environment variables to your real Google Gemini API key
2. Redeploy (push to main or manual deploy)
3. Log in as master demo (`master@limud.edu` / `LimudMaster2026!`)
4. Go to `/teacher/quiz-generator` — header should show green "AI Active"
5. Generate a quiz — toast should say "Quiz generated with AI-powered questions!"
6. If you see amber "AI Offline" or "template bank" toast, check Render logs for `[GEMINI]` errors

#### Files Changed (10)
- `src/lib/ai.ts` — Hardened `isGeminiConfigured()`, `callGemini()` error handling, new `getAIStatus()`
- `src/app/api/quiz-generator/route.ts` — Dynamic Prisma import, `aiStatus`/`aiError` in responses
- `src/app/api/teacher/ai-builder/route.ts` — Added `getAIStatus` to response
- `src/app/api/teacher/ai-feedback/route.ts` — Added `getAIStatus` to response
- `src/app/api/ai-status/route.ts` — **NEW** AI status check endpoint
- `src/app/teacher/quiz-generator/page.tsx` — AI status indicator, improved toast messages
- Version bumped in: config.ts, middleware.ts, server.js, health/route.ts, package.json

### v9.7.2 (2026-03-28) — AI Features: Real Gemini Integration & Master Demo Fixes

#### Root Cause
AI features (Tutor, AI Builder, AI Feedback Engine, Quiz Generator) were stuck in demo mode for all users including the Master Demo account. Three separate issues:

1. **AI Builder & Feedback Engine** were UI-only prototypes — they simulated AI with `setTimeout()` + hardcoded responses but never called any API endpoint
2. **Tutor API** blocked the Master Demo account (role: TEACHER) with a 403 "Only students can use the tutor" error, causing the frontend to fall back to `/api/demo` static responses
3. **`requireRole()` middleware** didn't check `isMasterDemo`, so any API with role restrictions blocked the Master Demo

#### Fixes
1. **New `/api/teacher/ai-builder` endpoint** — Real Gemini-powered assignment differentiation. Takes teacher content + config, returns learning-style-adapted assignments (visual, auditory, kinesthetic, reading). Falls back to template generation when no API key.
2. **New `/api/teacher/ai-feedback` endpoint** — Real Gemini-powered student feedback generation. Single + bulk modes. Produces structured feedback (score, strengths, improvements, detailed feedback, encouragement). Falls back to heuristic scoring when no API key.
3. **AI Builder page** now calls `/api/teacher/ai-builder` first, falls back to local demo generator only if API fails
4. **AI Feedback page** now calls `/api/teacher/ai-feedback` (single & bulk), falls back to local generator only if API fails
5. **Tutor API** now allows `isMasterDemo` users (bypasses STUDENT role check)
6. **`requireRole()` middleware** now gives Master Demo unrestricted access to all role-gated endpoints
7. **`hasTeacherAccess()` helper** now includes Master Demo

#### How AI Mode Is Determined
- If `GEMINI_API_KEY` is set (and not `demo-mode`) → **Real AI responses** from Google Gemini
- If no API key → **Demo/template responses** (heuristic scoring, template assignments, static tutor chat)
- The Master Demo account now correctly reaches the real AI path in all features

#### Files Changed (8)
- `src/app/api/teacher/ai-builder/route.ts` — **NEW** real Gemini AI endpoint
- `src/app/api/teacher/ai-feedback/route.ts` — **NEW** real Gemini AI endpoint
- `src/app/teacher/ai-builder/page.tsx` — Wired to real API
- `src/app/teacher/ai-feedback/page.tsx` — Wired to real API (single + bulk)
- `src/app/api/tutor/route.ts` — Master Demo role bypass
- `src/lib/middleware.ts` — `requireRole()` + `hasTeacherAccess()` Master Demo support
- Version bumped in: config.ts, middleware.ts, server.js, health/route.ts, package.json

### v9.7.1 (2026-03-28) — Bug Fixes: Navigation, Survey Steps & Assignment Flow

#### Bug Fixes
1. **Learning Method Chooser** — Selecting a learning method and confirming now navigates to the assignment page (`/student/assignments?id=...&method=...`) instead of only showing a toast notification. Previously, students would see "Starting with X method!" but stay on the same screen.
2. **Survey Step Navigation** — Fixed multiple broken step transitions in the Student Learning Survey:
   - Step 2 previously rendered *both* "Favorite Subjects" and "Hobbies" sections simultaneously (duplicate `step === 2` checks)
   - Subjects "Next" button was pointing to `setStep(2)` (itself) instead of the next step
   - Learning Needs "Back" button pointed to itself (`setStep(4)`)
   - Learning Needs "Next" skipped from step 4 to step 6, missing step 5 entirely
   - Consolidated Subjects + Hobbies + Dream Job into a single "Interests" step
   - Survey now flows: Discover → Interests → How You Learn → Your Needs → Fun Stuff (5 steps instead of broken 6)
3. **Sidebar Navigation** — Fixed broken `NAV_ITEMS` reference that was replaced by `GROUPED_NAV` in v9.7.0. The sidebar now renders grouped sections with labeled categories (Learning, Rewards & Social, Account, AI Tools, Classroom, People, Organization, etc.) for a cleaner, more organized navigation experience.

#### UX Improvements
4. **Grouped Sidebar Sections** — Navigation items are now organized into collapsible labeled groups:
   - **Student:** Dashboard + Classrooms + Tutor | Learning (Assignments, Focus, Study Planner, Exam Sim, Analytics) | Rewards & Social | Account
   - **Teacher:** Dashboard + Quick Setup | Assignments | AI Tools (Grading, Feedback, Quiz Gen, Reports, Intelligence) | Classroom (Students, Analytics, Worksheets, Exchange, Games, Messages)
   - **Admin:** Dashboard | People | Organization | Insights & Settings
5. **Reduced visual clutter** — Sidebar items use slightly tighter spacing (`py-2.5` instead of `py-3`) for better density with grouped sections.

**Files changed:** 4 files (DashboardLayout.tsx, classrooms/page.tsx, survey/page.tsx, version files).

### v9.7.0 (2026-03-28) — User Journey Overhaul: Student, Teacher & Admin UX

**Based on:** Limud user-journey research (PDF analysis of 3 personas: Student, Teacher, Administrator).
Every feature below addresses a specific pain point or opportunity identified in the user-journey maps.

#### Student Features
1. **Remember Me** — Login page saves email when "Remember my email" checkbox is checked. Addresses: *"What is my password? Forgot my password."*
2. **Learning-Style Discovery** — New Step 0 in the Student Survey with interactive scenario-based questions (not boring checkboxes). Students discover their style through situations. Addresses: *"Unclear learning-style questions."*
3. **My Classrooms** (`/student/classrooms`) — Color-coded classroom grid with subject icons, upcoming assignments, teacher names, room numbers, and "due soon" badges. Addresses: *"Can't find the classroom."*
4. **Smart Assignment Finder** — Each classroom card shows upcoming assignments sorted by urgency. Click to expand full assignment list with due dates and point values. Addresses: *"Won't find the assignment."*
5. **Learning Method Chooser** — When starting an assignment, students pick their preferred method (Visual, Listen & Discuss, Do & Build, Read & Write, Play & Explore, Step by Step) with a confirmation dialog. Addresses: *"Choose wrong method by accident."*

#### Teacher Features
6. **Quick Setup Wizard** (`/teacher/onboarding`) — 3-step onboarding: Select Subjects → Set Up Classes → Configure AI Preferences. Completes in under 2 minutes. Addresses: *"Making a new account is so tedious and long."*
7. **Teacher Onboarding API** (`POST /api/teacher/onboarding`) — Persists onboarding data and marks `onboardingComplete = true`.
8. **AI Assignment Builder** (`/teacher/ai-builder`) — Upload or paste lesson content → select subject, grade, learning styles → AI generates differentiated assignments for Visual, Auditory, Kinesthetic, and Reading/Writing learners. Includes difficulty variations (Simplified, Standard, Advanced). Addresses: *"How to create lessons that work for everyone."*
9. **AI Feedback Engine** (`/teacher/ai-feedback`) — AI analyzes student submissions and generates structured feedback: score, strengths, areas for growth, and an editable personalized message. Supports bulk "Auto-Grade All" for entire classes. Addresses: *"I have so many students to give feedback to."*

#### Administrator Features
10. **Trending Dashboard** — New section on admin dashboard with real-time metrics (Active Students Today, Assignments Submitted, AI Tutor Sessions, Avg Score, Teacher Logins, Parent Check-ins) and curated Alerts & Insights (at-risk students, engagement dips, AI usage trends, onboarding completions). Addresses: *"Information overload"* with opportunity: *"Trending info summary."*

#### UX Improvements
11. **Back Button / Role Switcher** — Login page now shows "Wrong role? Start over" link. Register page step 1 has a prominent back arrow to /login. Addresses: *"User accidentally selects student role"* with opportunity: *"Add a back button."*
12. **Updated Sidebar Navigation** — Teacher nav now includes Quick Setup, AI Builder, and AI Feedback links.

**Files changed:** 14 files, ~2000 lines added.

### v9.6.7 (2026-03-28) — Fix: District owner accounts now auto-created

**Issue:** After v9.6.6 seeded districts, users still couldn't log in as district owners
(e.g., `owner@limud.co` / `LimudRock2026!`) because the auto-seed only created
`SchoolDistrict` records — no `User` accounts were created.

**Root cause:** The auto-seed in v9.6.5/6 called `prisma.schoolDistrict.create()` but
never called `prisma.user.create()` for the superintendent accounts.

**Fix:**
- Auto-seed now creates BOTH district records AND superintendent `User` accounts
  with bcrypt-hashed passwords, `role: ADMIN`, `accountType: DISTRICT`
- Also creates `DistrictAdmin` records with `SUPERINTENDENT` access level
- For existing deployments where districts already exist but users don't,
  the API detects missing users and creates them on first browse request
- New dedicated `/api/district-link/seed` endpoint for manual seed triggering
- Seed endpoint is public (added to middleware `PUBLIC_API_PATHS`)

**Credentials:**
- Limud-Academy: `owner@limud.co` / `LimudRock2026!`
- All other districts: `<contactEmail>` / `District2026!`

**Verified:** All 26 district owner logins tested successfully locally.

---

### v9.6.6 (2026-03-28) — Fix: Production had 6 districts but ALL filtered out

**Root cause found via v9.6.5 diagnostics:**
```
_diag: { steps: ["prisma:ok", "count:6", "filtered:0"] }
```
Production DB had 6 districts but ALL were demo/homeschool/self-edu → filtered to 0.
Auto-seed checked **total count** (6 > 0) and skipped. Page showed 0 districts forever.

**Fix:** Auto-seed now checks **searchable count** (after filter), not total count.
When searchable=0 but total=6, it seeds 26 new non-demo districts alongside existing ones.

Also: if everything fails, API returns 26 hardcoded districts (never empty).

---

### v9.6.5 (2026-03-28) — Bulletproof District Search for Production

**Problem:** Production at limud.co (Render) returned `{ districts: [] }` even with v9.6.3 deployed. The auto-seed was silently failing and errors were swallowed, leaving the page permanently empty.

**Root cause:** Multiple production issues compounded:
1. Schema not synced — `prisma db push` was never run on production after v9.6 schema changes
2. Auto-seed errors were caught but only logged to server logs (invisible to frontend)
3. No fallback — if DB queries failed, the page showed nothing

**Fixes:**
1. **Build script now runs `prisma db push`** — schema auto-syncs on every Render deploy
2. **Triple fallback strategy**: filtered query → unfiltered query → raw SQL → hardcoded districts
3. **Always returns districts** — even if the entire DB is broken, returns 26 hardcoded districts
4. **Diagnostic trail** — every API response includes `_diag` with step-by-step trace of what happened
5. **Visible errors** — seed failures, query failures, and Prisma errors all surface in the response
6. **Version 9.6.5 pushed to GitHub** — Render auto-deploys from main branch

**Changed files:**
- `src/app/api/district-link/search/route.ts` — Complete rewrite with triple fallback + diagnostics
- `src/app/student/link-district/page.tsx` — Read `_diag` field, show diagnostics on errors
- `package.json` — Build script now includes `prisma db push`
- Version bump to 9.6.5 across all files
- **Pushed to GitHub** → Render auto-deploys

---

### v9.6.4 (2026-03-28) — Auto-Seed Districts & Production Fix

**Problem:** On fresh deployments (e.g., Render production), the database had no seeded districts. The search API returned an empty `{ districts: [] }` and the page showed "No districts available yet" with no way to recover.

**Root cause:** The seed script only ran locally (`npx tsx prisma/seed-districts.ts`) and was never executed on production. The v9.6.3 auto-seed existed but only triggered on `browse` requests and lacked diagnostics.

**Fixes:**
1. **Auto-seed on ALL requests** — The `/api/district-link/search` endpoint now checks for empty districts on every request (not just browse), creating 26 districts automatically if none exist.
2. **Diagnostic info** — API returns `diagnostics` object with version, seed status, DB state, and timing when `?debug=1` is appended.
3. **Smart retry logic** — Page retries up to 3 times with progressive delays (1.5s, 3s, 4.5s) if 0 districts returned, giving the auto-seed time to complete.
4. **Actionable empty state** — Instead of "No districts available yet", shows "Setting up districts..." with a "Load Districts Now" button.
5. **Loading phase indicator** — Shows "Fetching districts...", "Processing response...", "Seeding database..." during load.
6. **Error diagnostics panel** — Expandable debug info on error states for troubleshooting.

**Changed files:**
- `src/app/api/district-link/search/route.ts` — Auto-seed on all requests, detailed diagnostics, better error reporting
- `src/app/student/link-district/page.tsx` — Smart retry, loading phases, actionable empty state, debug panel
- Version bump to 9.6.4 across all files

---

### v9.6.3 (2026-03-27) — Server Fix & Public District Search

**Problem:** Students reported the district search page "does nothing" — no districts loaded, search didn't work, and browse button was unresponsive.

**Root Causes Found & Fixed:**

1. **`next start` vs standalone conflict** — PM2 was running `next start` but the build uses `output: 'standalone'`, causing intermittent API route failures. Fixed PM2 to use `server.js` which auto-detects and uses the standalone server correctly. Startup time improved from ~700ms to ~120ms.

2. **District search required authentication** — The `/api/district-link/search` endpoint required a valid session, but the middleware's auth flow could fail silently on the client. Made district search a **public endpoint** — students can now browse districts even before logging in.

3. **Rate limiter too aggressive** — Edge rate limit was 200 req/min global and 10 auth req/min. During testing, users would hit 429 errors quickly. Increased to 500 req/min global and 30 auth req/min.

4. **Client-side improvements** — Districts now load on page mount (not on auth), auto-retry on failure, visible error states, and the search input filters instantly from the pre-loaded list.

**District Accounts** (all seeded in v9.6.1, 30 total):
- **Limud-Academy** — `Owner@limud.co` / `LimudRock2026!` (Tel Aviv, Israel)
- **25 US districts** — each with admin: `<contactEmail>` / `District2026!`
- Original districts: Test District Alpha, Custom School District, Pine Valley Academy, PUSD

---

### v9.6.2 (2026-03-27) — District Search UX Overhaul

**Problem:** Students could not find any districts when searching, and the "Browse all" button did not work.

**Root Cause & Fix:** Completely rewrote the student link-district page to eliminate all failure modes:

- **Auto-loads all districts on page mount** — No button clicks or search queries required. All 30 districts appear immediately when the page loads.
- **Client-side instant filtering** — Typing in the search box filters the already-loaded district list instantly (no API call or debounce delay needed for local filtering).
- **API fallback** — If client-side filtering yields no results, falls back to a server-side API search.
- **Visible error states** — If the API call fails (auth error, network error, etc.), a red error banner with the exact error message and a "Retry" button is shown. No more silent failures.
- **Console logging** — Logs district load count and any errors to browser console for debugging.
- **Loading state** — Shows a "Loading districts…" spinner while the initial fetch is in progress.
- **Total count badge** — Shows "30 total" next to the heading.
- **Scrollable list** — Max-height 400px with overflow scroll for long lists.
- **Refresh button** — Allows manual re-fetch of the district list.

---

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

> Based on an independent product audit (March 2026). Items are prioritized by user impact and mapped against what Limud already ships today. Versions are tentative targets, not commitments.

### Audit vs. Current State — Gap Matrix

| Audit Recommendation | Limud v9.9.0 Status | Gap? |
|---|---|---|
| Adaptive AI tutor | ✅ Gemini 2.5 Flash Socratic tutor | — |
| Student progress dashboards | ✅ Knowledge, Growth, Analytics pages | — |
| Teacher gradebook / auto-grading | ✅ AI auto-grader with editable feedback | — |
| Quiz generation | ✅ Curriculum-aligned AI quiz generator | — |
| Gamification (XP, streaks, levels) | ✅ Restored in v9.9.0 | — |
| Learning style adaptation | ✅ Learning DNA profiler + adaptive assignments | — |
| RBAC (role-based access) | ✅ 5-role middleware (Student/Teacher/Admin/Parent/Homeschool) | — |
| AES-256-GCM encryption | ✅ Field-level PII encryption in security.ts | — |
| FERPA / COPPA compliance | ✅ Built into every layer, audit logs, 7-year retention | — |
| WCAG AA accessibility | ✅ Keyboard nav, contrast, semantic HTML, focus traps | — |
| PWA / Offline basics | ✅ manifest.json + sw.js already present | — |
| SEO: robots.txt | ✅ Present in public/ | — |
| MFA for admins | ✅ Referenced in admin settings | — |
| CI/CD pipeline | ❌ No GitHub Actions workflow | **Gap** |
| Automated testing (70–90%) | ❌ No test files found | **Gap** |
| XML sitemap | ❌ Not present | **Gap** |
| Schema.org structured data | ❌ Not implemented | **Gap** |
| Notification / reminder system | ⚠️ Partial (grading notifs only) | **Partial** |
| Full i18n (Hebrew, Spanish, Arabic) | ❌ English only | **Gap** |
| Mobile app | ❌ Web only | **Gap** |
| Content library (video lessons, worksheets DB) | ⚠️ 87+ worksheets; no video lessons | **Partial** |
| Discussion forums / social learning | ⚠️ Messages exist; no forums | **Partial** |
| Advanced reporting (PDF export) | ❌ Screen-only reports | **Gap** |
| SSO / SAML | ❌ Not implemented | **Gap** |
| Persistent announcements (DB) | ❌ In-memory for demo | **Gap** |

---

### Phase 1 — v9.10 "Foundation Hardening" (0–4 weeks)

**Theme:** Testing, CI/CD, SEO, Performance — the audit's short-term quick wins.

| # | Feature | Priority | Effort |
|---|---|---|---|
| 1.1 | **CI/CD Pipeline** — GitHub Actions: lint → type-check → build → deploy-preview on PR | 🔴 Critical | M |
| 1.2 | **Testing Foundation** — Jest + React Testing Library setup; unit tests for API routes (`/api/health`, `/api/survey`, `/api/assignments`, `/api/grade`); target 30% coverage as v1 | 🔴 Critical | L |
| 1.3 | **XML Sitemap** — Auto-generated sitemap.xml for all public pages (`/`, `/about`, `/pricing`, `/help`, `/login`, `/register`) | 🟡 High | S |
| 1.4 | **Schema.org Structured Data** — `Course`, `FAQ`, `Organization` JSON-LD on landing page and help page | 🟡 High | S |
| 1.5 | **Performance Audit** — Measure LCP (target <2.5s); lazy-load below-fold images; optimize Framer Motion bundle | 🟡 High | M |
| 1.6 | **Announcement Persistence** — Store announcements in DB (Prisma model) instead of in-memory; admin CRUD API | 🟢 Medium | M |
| 1.7 | **Notification Bell** — In-app notification dropdown for students/teachers (new grades, new assignments, announcements) | 🟢 Medium | L |

**KPIs:** Build passes on every PR; test coverage ≥ 30%; LCP < 2.5s on landing; sitemap indexed by Google.

---

### Phase 2 — v9.11 "Content & Engagement" (4–8 weeks)

**Theme:** Richer content, social features, and the audit's medium-term engagement gaps.

| # | Feature | Priority | Effort |
|---|---|---|---|
| 2.1 | **Video Lesson Player** — Embeddable video component in assignments; YouTube/Vimeo embed + AI-generated transcript | 🔴 Critical | L |
| 2.2 | **Interactive Exercise Builder** — Drag-and-drop, fill-in-the-blank, matching, and hotspot question types beyond MCQ/essay | 🟡 High | XL |
| 2.3 | **Discussion Forums** — Per-course discussion boards with teacher moderation; threaded replies | 🟡 High | L |
| 2.4 | **PDF Report Export** — Teacher and admin can export student progress, class averages, and growth charts as branded PDF | 🟡 High | M |
| 2.5 | **Email Notifications** — SendGrid/Resend integration: assignment due reminders (24h before), grade posted alerts, weekly parent digest | 🟢 Medium | M |
| 2.6 | **Content Library Expansion** — Curated lesson templates per subject (Math, Science, ELA, History for grades 3–12); teachers can fork and customize | 🟢 Medium | XL |
| 2.7 | **Raise Test Coverage to 60%** — Integration tests for full flows: login → create assignment → submit → auto-grade → view report | 🟢 Medium | L |

**KPIs:** ≥3 video-enabled assignments in demo; forum adoption >20% of active teachers; PDF export used by ≥1 district; test coverage ≥ 60%.

---

### Phase 3 — v9.12 "Enterprise & Scale" (8–16 weeks)

**Theme:** SSO, i18n, mobile — the audit's long-term and enterprise requirements.

| # | Feature | Priority | Effort |
|---|---|---|---|
| 3.1 | **SSO / SAML** — Enterprise single sign-on via SAML 2.0 (Azure AD, Google Workspace, Clever); auto-provisioning | 🔴 Critical | XL |
| 3.2 | **Internationalization (i18n)** — Extract all strings to JSON locale files; ship Hebrew (he) + Spanish (es) first; RTL layout support for Hebrew/Arabic | 🔴 Critical | XL |
| 3.3 | **Mobile PWA Improvements** — Offline question bank cache; push notifications via Web Push API; "Add to Home Screen" prompt | 🟡 High | L |
| 3.4 | **Advanced Analytics Dashboard** — Admin: DAU/WAU/MAU charts, funnel (sign-up → active → paid), NPS survey widget; export to CSV | 🟡 High | L |
| 3.5 | **GDPR Compliance Module** — Data export (Article 20), right to deletion (Article 17), cookie consent banner, DPO contact page | 🟡 High | M |
| 3.6 | **Docker & Terraform** — Containerized deployment; infrastructure-as-code for AWS/GCP; staging environment auto-provisioned on PR | 🟢 Medium | L |
| 3.7 | **Raise Test Coverage to 80%** — E2E tests with Playwright for critical paths: onboarding survey, assignment submission, AI tutor conversation, demo login | 🟢 Medium | L |

**KPIs:** ≥1 district using SSO in pilot; Hebrew + Spanish live; DAU/MAU > 30%; GDPR audit passed; test coverage ≥ 80%.

---

### Phase 4 — v10.0 "Next Generation" (16–24 weeks)

**Theme:** AI evolution, VR/AR, and the audit's moonshot long-term items.

| # | Feature | Priority | Effort |
|---|---|---|---|
| 4.1 | **Emotional AI Layer** — Sentiment detection in tutor conversations; adaptive tone when student is frustrated or disengaged | 🟡 High | XL |
| 4.2 | **React Native Mobile App** — Native iOS/Android companion with offline sync, push notifications, biometric login | 🟡 High | XXL |
| 4.3 | **AI-Generated Video Lessons** — Gemini generates narrated explainer videos from lesson content; text-to-speech + slide generation | 🟢 Medium | XL |
| 4.4 | **VR/AR Lesson Modules** — WebXR-based interactive science labs and historical explorations | 🟢 Medium | XXL |
| 4.5 | **Custom AI Training per District** — Fine-tuned models on district-specific curriculum; custom rubrics encoded into the grading engine | 🟢 Medium | XL |
| 4.6 | **Marketplace / Exchange** — Teachers sell/share lesson plans; peer-reviewed content with ratings | 🟢 Medium | L |
| 4.7 | **Annual Security Audit** — Third-party penetration test; SOC 2 Type II certification; publish transparency report | 🔴 Critical | L |

**KPIs:** NPS > 50; mobile app >1,000 installs in first quarter; ≥1 VR module live; SOC 2 report published.

---

### Effort Legend

| Code | Meaning |
|---|---|
| **S** | Small — 1–2 days |
| **M** | Medium — 3–5 days |
| **L** | Large — 1–2 weeks |
| **XL** | Extra Large — 2–4 weeks |
| **XXL** | Huge — 4+ weeks |

### Business Model Validation (from audit)

The audit recommends validating the pricing model (~$5,500/school/year, ~$1–3/student). Current Limud tiers:
- **Free**: $0, up to 5 students (homeschool/self-learners)
- **Standard**: $6/student/month (~$72/student/year)
- **Enterprise**: Custom pricing with SSO/SLA

**Action item for Phase 2:** Conduct pricing sensitivity surveys with 5+ pilot districts to validate the $6/student/month standard tier against competitor benchmarks (Khan Academy free, DreamBox $15–25/student/year).

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
