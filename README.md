# Limud - Learn Together, Grow Together

## Project Overview
- **Name**: Limud
- **Goal**: All-in-one EdTech platform with AI tutoring, gamification, and personalized learning
- **Live URL**: https://3000-ifjkeor7fvbg89k4c63pq-cc2fbc16.sandbox.novita.ai

## Features

### Completed Features
- **Landing Page**: Full marketing site with animated hero, feature sections, FAQ, testimonials, social proof
- **4 Pricing Tiers**: Free (homeschool), Starter ($1,200/yr), Standard ($5,500/yr), Enterprise (custom)
- **Demo Mode**: Interactive demos for all 4 roles (Student, Teacher, Admin, Parent) - no sign-up required
- **User Registration**: Multi-step signup with role selection, email/password, homeschool support
- **Login System**: NextAuth.js with JWT sessions, credential-based authentication
- **Student Portal**: Dashboard, assignments, AI tutor chat, gamification rewards, certificates
- **Teacher Portal**: Dashboard, assignment manager, AI auto-grader, AI lesson planner, student analytics
- **Admin Portal**: District management, CSV bulk provisioning, subscription overview
- **Parent Portal**: Child progress monitoring, grades, activity feed
- **AI Tutor**: Chat-based tutoring with subject-specific responses (supports OpenAI or demo mode)
- **AI Auto-Grader**: One-click and batch grading with detailed feedback
- **AI Lesson Planner**: Generate standards-aligned lesson plans from topic/subject/grade
- **Gamification**: XP, levels, streaks, virtual coins, avatar shop, badges, certificates
- **Homeschool Support**: Free tier for homeschool families, parent-as-teacher workflow
- **Accessibility**: High contrast mode, dyslexia-friendly fonts, text size controls, screen reader support
- **LMS Integration**: Google Classroom and Canvas sync hooks (roster, assignments, grades)
- **Responsive Design**: Mobile-first with Tailwind CSS, glass-morphism effects, Framer Motion animations

### New in This Update
1. **Demo Mode** - All portals work without authentication for demos
2. **Real Account Registration** - Multi-step signup flow with role selection
3. **Homeschool Option** - Free tier for homeschool parents with auto-created student accounts
4. **AI Lesson Planner** - Teachers can generate complete lesson plans with AI
5. **Expanded Pricing** - 4 tiers: Free, Starter, Standard, Enterprise
6. **Student Certificates** - Achievement certificates for milestones
7. **Updated Navigation** - Lesson planner added to teacher nav, certificates to student nav
8. **Updated Landing Page** - New pricing grid, homeschool callout

## URLs
- **Home**: `/` - Landing page (redirects authenticated users to dashboard)
- **Demo**: `/demo` - Interactive demo selector (no auth required)
- **Login**: `/login` - Sign in page
- **Register**: `/register` - Multi-step registration
- **Student Dashboard**: `/student/dashboard` - Student home
- **Student Assignments**: `/student/assignments` - View & submit assignments
- **Student AI Tutor**: `/student/tutor` - Chat with AI tutor
- **Student Rewards**: `/student/rewards` - XP, coins, avatars, badges
- **Student Certificates**: `/student/certificates` - Achievement certificates
- **Teacher Dashboard**: `/teacher/dashboard` - Teacher home
- **Teacher Assignments**: `/teacher/assignments` - Create & manage assignments
- **Teacher Grading**: `/teacher/grading` - AI auto-grader
- **Teacher Lesson Planner**: `/teacher/lesson-planner` - AI lesson plan generator
- **Teacher Analytics**: `/teacher/analytics` - Student performance analytics
- **Admin Dashboard**: `/admin/dashboard` - District overview
- **Admin Provisioning**: `/admin/provision` - Bulk user creation (CSV)
- **Parent Dashboard**: `/parent/dashboard` - Child progress view

### API Endpoints
- `POST /api/auth/register` - Create new account
- `GET/POST /api/demo` - Demo data endpoints
- `POST /api/tutor` - AI tutor chat
- `POST /api/grade` - AI grading
- `GET/POST /api/lesson-plans` - AI lesson plan generation
- `GET/POST /api/assignments` - Assignment CRUD
- `POST /api/submissions` - Submit assignments
- `GET/POST /api/rewards` - Gamification
- `GET/PUT /api/notifications` - Notification management
- `GET/POST /api/messages` - Parent-teacher messaging
- `GET /api/analytics` - Student analytics
- `GET/PUT /api/admin/districts` - District management
- `POST /api/admin/provision` - Bulk provisioning
- `GET /api/parent` - Parent child data
- `GET/POST /api/lms` - LMS integration

## Data Architecture
- **Database**: PostgreSQL with Prisma ORM
- **Models**: User, SchoolDistrict, Course, Assignment, Submission, AITutorLog, RewardStats, Notification, LessonPlan, Certificate, Message
- **Auth**: NextAuth.js with JWT strategy
- **AI**: OpenAI GPT-4o-mini (falls back to intelligent demo responses)

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animation**: Framer Motion
- **Auth**: NextAuth.js
- **Database**: PostgreSQL + Prisma
- **AI**: OpenAI API
- **Icons**: Lucide React

## Getting Started
1. Clone the repository
2. `npm install`
3. Set up `.env` with DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL
4. `npx prisma db push` (or `npx prisma migrate dev`)
5. `npx prisma db seed` (optional)
6. `npm run dev`

## Demo Mode
Visit `/demo` to try all portals without creating an account. Demo data is realistic and showcases all features. Add `?demo=true` to any dashboard URL to enable demo mode.

## Deployment
- **Platform**: Next.js (self-hosted or Vercel)
- **Status**: Active
- **Last Updated**: 2026-02-24
