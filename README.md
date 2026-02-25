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
- **User Registration**: Multi-step signup with role selection, email/password, homeschool support with multiple children
- **Login System**: NextAuth.js with JWT sessions, credential-based authentication
- **Student Portal**: Dashboard, assignments, AI tutor chat, gamification rewards, certificates
- **Teacher Portal**: Dashboard, assignment manager, AI auto-grader, AI lesson planner, student analytics
- **Admin Portal**: District management, CSV bulk provisioning, subscription overview
- **Parent Portal**: Child progress monitoring, grades, activity feed
- **Homeschool Portal**: Full teacher tools for homeschool parents (assignments, grading, lesson planner, analytics)
- **AI Tutor**: Chat-based tutoring with subject-specific responses (supports OpenAI or demo mode)
- **AI Auto-Grader**: One-click and batch grading with detailed feedback
- **AI Lesson Planner**: Generate standards-aligned lesson plans from topic/subject/grade
- **Gamification**: XP, levels, streaks, virtual coins, avatar shop, badges, certificates
- **Homeschool Support**: Free tier for homeschool families, parent-as-teacher workflow, multiple children per account
- **Accessibility**: High contrast mode, dyslexia-friendly fonts, text size controls, screen reader support
- **LMS Integration**: Google Classroom and Canvas sync hooks (roster, assignments, grades)
- **Responsive Design**: Mobile-first with Tailwind CSS, glass-morphism effects, Framer Motion animations

### New in This Update (2026-02-25)
1. **Homeschool Parent Teacher Tools** - Homeschool parents now have full access to ALL teacher tools:
   - Create & manage assignments for their children
   - AI Auto-Grading with detailed feedback
   - AI Lesson Planner to generate curriculum
   - Student analytics dashboard to track performance
2. **Multiple Children Support** - Parents can add multiple children under one account:
   - Add children during registration (multi-child form)
   - Add more children later from the "Manage Children" page
   - Each child gets their own student account with auto-generated credentials
   - All children are automatically enrolled in parent-created courses
3. **Child Management Page** (`/parent/children`) - New page for homeschool parents:
   - View all children with quick stats (level, streak, assignments completed)
   - Add new children with custom or auto-generated email/password
   - Create new courses (all children auto-enrolled)
   - Deactivate child accounts
   - Copy login credentials to share with children
4. **Fixed AI Tutor** - Tutor now works properly in both demo and authenticated modes
   - Homeschool parents can also use the tutor for preview/testing
   - Better error handling and session management
5. **Fixed AI Lesson Planner** - Now accessible to homeschool parents (PARENT role with HOMESCHOOL account)
   - Added `response_format: json_object` for more reliable OpenAI responses
6. **Fixed All API Routes** - Updated all backend routes for homeschool parent support:
   - Assignments API: Parents can create, view, and manage assignments for their district
   - Analytics API: Shows performance data for children in parent's homeschool district
   - Submissions API: Parents can view submissions from their children
   - Grade API: Parents can grade their children's submissions with AI
   - Tutor API: Parents can preview the tutor experience
   - Rewards API: Supports parent role for viewing child stats
7. **Improved Navigation** - Homeschool parents see a special sidebar with:
   - "My Children" - Dashboard with child progress
   - "Manage Children" - Add/remove children and courses
   - "Assignments" - Create/manage assignments (teacher tool)
   - "AI Grading" - Auto-grade submissions (teacher tool)
   - "AI Lesson Planner" - Generate lesson plans (teacher tool)
   - "Analytics" - Student performance analytics (teacher tool)
   - "Homeschool Mode" indicator badge in sidebar
8. **Bug Fixes**:
   - Fixed `isHomeschoolParent` flag propagation through JWT/session
   - Fixed middleware to grant teacher-level access for homeschool parents
   - Fixed analytics API division by zero for empty student lists
   - All 18 pages return HTTP 200
   - Zero console errors across all pages

## URLs
- **Home**: `/` - Landing page (redirects authenticated users to dashboard)
- **Demo**: `/demo` - Interactive demo selector (no auth required)
- **Login**: `/login` - Sign in page
- **Register**: `/register` - Multi-step registration with multiple children support
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
- **Parent Dashboard**: `/parent/dashboard` - Child progress view + homeschool quick actions
- **Manage Children**: `/parent/children` - Add/remove children, create courses (homeschool parents)

### API Endpoints
- `POST /api/auth/register` - Create new account (supports multiple children array)
- `GET/POST /api/demo` - Demo data endpoints
- `POST /api/tutor` - AI tutor chat (STUDENT + HOMESCHOOL PARENT)
- `POST /api/grade` - AI grading (TEACHER + ADMIN + HOMESCHOOL PARENT)
- `GET/POST/PUT/DELETE /api/lesson-plans` - AI lesson plan generation (TEACHER + ADMIN + HOMESCHOOL PARENT)
- `GET/POST /api/assignments` - Assignment CRUD (all roles with appropriate access)
- `GET/POST /api/submissions` - Submit/view assignments
- `GET/POST /api/rewards` - Gamification
- `GET/PUT /api/notifications` - Notification management
- `GET/POST /api/messages` - Parent-teacher messaging
- `GET /api/analytics` - Student analytics (TEACHER + ADMIN + HOMESCHOOL PARENT)
- `GET/PUT /api/admin/districts` - District management
- `POST /api/admin/provision` - Bulk provisioning
- `GET/POST /api/parent` - Parent child data + add child + create course + remove child
- `GET/POST /api/lms` - LMS integration

## Data Architecture
- **Database**: PostgreSQL with Prisma ORM
- **Models**: User, SchoolDistrict, Course, Assignment, Submission, AITutorLog, RewardStats, Notification, LessonPlan, Certificate, Message
- **Auth**: NextAuth.js with JWT strategy (includes `isHomeschoolParent` flag)
- **AI**: OpenAI GPT-4o-mini (falls back to intelligent demo responses)
- **Roles**: STUDENT, TEACHER, ADMIN, PARENT
- **Account Types**: DISTRICT, HOMESCHOOL, INDIVIDUAL
- **Homeschool Flow**: PARENT + HOMESCHOOL = full teacher access + child management

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

## Homeschool Guide
1. **Register** as a Parent with "Homeschool" account type
2. **Add children** during registration or from the "Manage Children" page
3. **Create courses** for your curriculum
4. **Create assignments** using the teacher tools
5. **Use AI Lesson Planner** to generate standards-aligned lessons
6. **Track progress** via the analytics dashboard
7. **Grade work** using the AI Auto-Grader

## Deployment
- **Platform**: Next.js (self-hosted or Vercel)
- **Status**: Active
- **Last Updated**: 2026-02-25
