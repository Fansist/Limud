# Limud - AI-Powered Adaptive Learning Platform

## Project Overview
- **Name**: Limud
- **Version**: 4.0
- **Goal**: Transform education with AI-powered adaptive learning, gamification, and personalized insights
- **Stack**: Next.js 14 + React 18 + TypeScript + Tailwind CSS + Prisma + PostgreSQL + OpenAI

## Live URLs
- **Development**: https://3000-ifjkeor7fvbg89k4c63pq-cc2fbc16.sandbox.novita.ai
- **Demo Mode**: Append `?demo=true` to any route
- **Onboarding/Payment**: `/onboard` (public, no auth needed)

## Completed Features (v4)

### Performance & Optimization
- SWC minification, aggressive caching (static: immutable/31536000s)
- Service Worker for offline caching (stale-while-revalidate + background sync)
- PWA manifest (install-to-homescreen ready)
- Font preloading + DNS prefetch for Google Fonts, OpenAI API
- Device-tier detection (high/medium/low) with auto Lite Mode
- Memoized skeleton components, IntersectionObserver lazy loading
- Client-side fetch cache (30s TTL) for API responses
- OLED-optimized dark mode, 60fps animations
- `optimizePackageImports` for lucide-react, framer-motion, recharts, date-fns

### Student Features
| Feature | Route | Description |
|---------|-------|-------------|
| Dashboard | `/student/dashboard` | XP bar, streak, coins, due-today alerts, quick actions |
| Focus Mode | `/student/focus` | Distraction-free timer, ambient sounds, swipe questions |
| Knowledge | `/student/knowledge` | Skill mastery, radar chart, heatmap, goal countdown, study-next |
| Assignments | `/student/assignments` | View, submit text + file uploads, AI feedback |
| AI Tutor | `/student/tutor` | Chat with AI tutor (OpenAI or demo fallback) |
| Study Planner | `/student/study-planner` | AI-recommended study sessions |
| Exam Simulator | `/student/exam-sim` | Practice exams with scoring |
| Growth | `/student/growth` | Progress analytics and grade predictions |
| Rewards | `/student/rewards` | XP, coins, avatar shop, badges |
| **Game Store** | `/student/games` | **NEW: Buy games with XP, play educational games** |
| Certificates | `/student/certificates` | Achievement certificates |

### Teacher Features
| Feature | Route | Description |
|---------|-------|-------------|
| Dashboard | `/teacher/dashboard` | Class overview, at-risk students, pending grading |
| Assignments | `/teacher/assignments` | Create, manage, view submissions with file downloads |
| AI Grading | `/teacher/grading` | AI auto-grade + batch grade + file attachment view |
| Intelligence | `/teacher/intelligence` | Class mastery, weakest skills, engagement, risk alerts |
| Quiz Generator | `/teacher/quiz-generator` | AI-powered quiz/worksheet creation |
| Lesson Planner | `/teacher/lesson-planner` | AI lesson plan generation |
| Insights | `/teacher/insights` | Heatmap & analytics |
| Analytics | `/teacher/analytics` | Detailed performance analytics |
| **Game Control** | `/teacher/games` | **NEW: Toggle game access per classroom** |

### Admin/District Features (v4 NEW)
| Feature | Route | Description |
|---------|-------|-------------|
| Dashboard | `/admin/dashboard` | District overview, capacity, quick actions |
| **Student Accounts** | `/admin/students` | **NEW: Create students with full personal info, auto-create 2 parent accounts, sibling linking** |
| **Schools** | `/admin/schools` | **NEW: Create/manage schools, transfer users between schools** |
| **Classrooms** | `/admin/classrooms` | **NEW: Create classes, assign students, toggle game access** |
| Bulk Import | `/admin/provision` | CSV bulk import for students & teachers |
| **Billing** | `/admin/payments` | **NEW: Plan management, payment history, upgrades** |

### Payment & Onboarding (v4 NEW)
| Feature | Route | Description |
|---------|-------|-------------|
| **District Onboarding** | `/onboard` | **NEW: 4-step flow - Plan selection, district info, admin account, payment** |
| **Pricing Tiers** | - | Starter ($5/student), Standard ($8), Premium ($12), Enterprise ($15) |
| **Auto District Setup** | - | Creates district, superintendent account, applies subscription |

### District Multi-Level Access (v4 NEW)
| Access Level | Permissions |
|---|---|
| **Superintendent** | Full access: accounts, schools, billing, data, classes |
| **Assistant Superintendent** | All except billing |
| **Curriculum Director** | View data, manage classes |
| **Principal** | Create accounts, manage classes |
| **Vice Principal** | Manage classes only |
| **District Employee** | View-only access |
| **IT Admin** | Create accounts, manage schools, view data |

### Gamification System
- XP rewards for assignments (25-100 XP), tutor sessions (15 XP), streaks (75-300 XP)
- Virtual coins for purchases (avatars, themes)
- **Game Store**: Students spend XP to buy educational games
- **Teacher Game Control**: Disable games per classroom during class time
- **District Game Control**: Admin can disable games district-wide
- 5 rank tiers: Bronze, Silver, Gold, Platinum, Diamond
- Mastery animations, surprise rewards, avatar evolution

### File Upload System (v4 NEW)
- Students upload PDF, DOC, DOCX, PPT, images, ZIP (max 10MB each)
- Multiple files per submission
- Teachers view and download student attachments
- Base64 storage with proper MIME type handling

### AI Components
| AI Feature | Status | Description |
|---|---|---|
| AI Tutor | Working | Socratic tutoring with OpenAI fallback to demo |
| AI Grading | Working | Auto-grade submissions with rubric analysis |
| Quiz Generator | Working | AI-generated quizzes with subject/grade targeting |
| Math Solver | Working | Step-by-step validation with error detection |
| Writing Coach | Working | Essay analysis with readability scoring |
| Explain My Mistake | Working | 5 explanation styles for past errors |
| Study Next | Working | AI-recommended next study action |
| Learning DNA | Working | Speed, retention, modality, peak hours tracking |
| Confidence Scoring | Working | Lucky-guess detection + true mastery calculation |

## API Routes Summary
Total: 52+ API routes across 8 domains

### New v4 API Routes
- `GET/POST/PUT /api/games` - Game store, purchases, teacher control
- `GET/POST/DELETE /api/files` - File upload/download system
- `GET/POST /api/payments` - Payment processing & onboarding
- `GET/POST/PUT/DELETE /api/district/students` - Student CRUD with auto-parents
- `GET/POST /api/district/teachers` - Teacher account management
- `GET/POST/PUT/DELETE /api/district/schools` - School management
- `GET/POST/PUT/DELETE /api/district/classrooms` - Classroom management
- `GET/POST/PUT /api/district/access` - Multi-level access control

## Data Architecture
- **Database**: PostgreSQL with Prisma ORM
- **Models**: 40+ Prisma models
- **Key v4 additions**: School, Classroom, ClassroomStudent, DistrictAdmin, Payment, Game, GamePurchase, GameSession, FileUpload
- **Auth**: NextAuth.js with JWT + credentials provider
- **AI**: OpenAI gpt-4o-mini with graceful demo fallback

## Tech Stack
- Next.js 14 (App Router, RSC)
- React 18 + TypeScript 5
- Tailwind CSS 3 + Framer Motion
- Prisma + PostgreSQL
- NextAuth.js 4
- OpenAI API (gpt-4o-mini)
- PM2 for process management

## Last Updated: 2026-02-26
