# Limud - Learn Together, Grow Together

An all-in-one educational platform with AI tutoring, gamified learning, and personalized feedback.

## Live Demo

**URL**: https://3000-ifjkeor7fvbg89k4c63pq-cc2fbc16.sandbox.novita.ai

### Demo Accounts
| Role | Email | Password |
|------|-------|----------|
| Student | student@limud.edu | password123 |
| Teacher | teacher@limud.edu | password123 |
| Admin | admin@limud.edu | password123 |
| Parent | parent@limud.edu | password123 |

## Features

### Student Dashboard
- **Unified Hub**: Single interface for assignments, scheduling, and resources
- **AI Companion**: Persistent AI tutor chat that guides students without giving answers
- **Gamification Engine**: XP, levels, streaks, virtual coins, unlockable avatars, badges
- **Assignment Viewer**: Submit work, view grades, read AI feedback
- **Accessibility**: WCAG-compliant high contrast, text-to-speech, dyslexia-friendly font

### Teacher Dashboard
- **Assignment Manager**: Create, distribute, manage assignments with rubrics
- **AI Auto-Grader**: One-click or batch AI grading with personalized feedback
- **Analytics Dashboard**: At-risk student identification, score distributions, streak tracking
- **Student Performance**: Visual indicators for students needing intervention

### Admin/District Dashboard
- **Subscription Management**: $5,500/year district pricing (~$1-3 per student)
- **Capacity Overview**: Student/teacher utilization tracking
- **Bulk Provisioning**: CSV upload to create student/teacher accounts
- **LMS Integration Status**: Google Classroom & Canvas readiness

### Parent Portal
- **View-Only Access**: Track child's assignment completion
- **AI Feedback Viewer**: See personalized feedback from AI grading
- **Progress Monitoring**: Grades, streak, level, badge tracking

### LMS Integration Hooks
- Google Classroom: roster sync, assignment import, grade export
- Canvas: roster sync, assignment import, grade push

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, React 18, Tailwind CSS, Framer Motion |
| Backend | Next.js API Routes, Prisma ORM |
| Database | PostgreSQL |
| Auth | NextAuth.js with JWT, Role-Based Access Control |
| AI | OpenAI API (with smart demo fallback) |
| Animations | Framer Motion (gamification effects) |

## Data Architecture

### Prisma Models
- **User**: Multi-role (STUDENT, TEACHER, ADMIN, PARENT) with parent-child linking
- **SchoolDistrict**: Subscription management, capacity limits
- **Course / Enrollment / CourseTeacher**: Full course management
- **Assignment**: Multiple types (Essay, Short Answer, Quiz, Project) with rubrics
- **Submission**: Full lifecycle (PENDING → SUBMITTED → GRADING → GRADED → RETURNED)
- **AITutorLog**: Complete conversation history per session
- **RewardStats**: XP, levels, streaks, coins, unlocked avatars/badges
- **Notification**: Real-time notification system

## API Routes

| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| POST | /api/auth/[...nextauth] | Authentication | Public |
| POST | /api/tutor | AI Tutor chat | Student |
| GET | /api/tutor | Get chat sessions | Student |
| POST | /api/grade | Grade single submission | Teacher/Admin |
| PUT | /api/grade | Batch grade submissions | Teacher/Admin |
| GET/POST | /api/assignments | List/create assignments | All roles |
| GET/POST | /api/submissions | List/submit work | Student/Teacher |
| GET/POST | /api/rewards | Get stats / purchase avatars | Student |
| GET | /api/analytics | Student performance analytics | Teacher/Admin |
| GET/PUT | /api/admin/districts | District management | Admin |
| POST | /api/admin/provision | Bulk account creation | Admin |
| GET/PUT | /api/notifications | Notification management | All roles |
| GET | /api/parent | Child progress data | Parent |
| GET/POST | /api/lms | LMS integration hooks | Teacher/Admin |

## Project Structure

```
webapp/
├── prisma/
│   ├── schema.prisma          # Complete database schema
│   └── seed.ts                # Demo data seeder
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Landing page (role-based redirect)
│   │   ├── globals.css        # Tailwind + custom styles
│   │   ├── (auth)/login/      # Login page with demo accounts
│   │   ├── student/           # Student dashboard, assignments, tutor, rewards
│   │   ├── teacher/           # Teacher dashboard, assignments, grading, analytics
│   │   ├── admin/             # Admin dashboard, provisioning
│   │   ├── parent/            # Parent portal
│   │   └── api/               # All API routes
│   ├── components/
│   │   ├── Providers.tsx      # Session + Accessibility providers
│   │   ├── layout/            # DashboardLayout (sidebar + topbar)
│   │   ├── gamification/      # XP bar, streaks, badges, avatar shop
│   │   ├── accessibility/     # High contrast, dyslexia font, TTS
│   │   └── ui/                # Shared UI components
│   ├── lib/
│   │   ├── prisma.ts          # Prisma client singleton
│   │   ├── auth.ts            # NextAuth configuration
│   │   ├── middleware.ts       # RBAC middleware + API handler
│   │   ├── ai.ts              # AI service (OpenAI + demo fallback)
│   │   ├── gamification.ts    # XP, streaks, coins, avatar logic
│   │   └── utils.ts           # Helpers, constants, avatar/badge data
│   └── types/
│       └── next-auth.d.ts     # Session type augmentation
├── ecosystem.config.cjs       # PM2 configuration
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── next.config.js
```

## Gamification System

| Action | XP | Coins |
|--------|-----|-------|
| Submit assignment | +25 | — |
| Complete assignment | +50 | +10 |
| Score 90%+ | +50 | +15 |
| Perfect score | +100 | +25 |
| Use AI Tutor | +15 | — |
| 7-day streak | +75 | +20 |
| 14-day streak | +150 | +50 |
| Level up | — | +30 |

## Deployment

**Platform**: Next.js standalone (PM2)  
**Status**: ✅ Active  
**Last Updated**: 2026-02-24

### Local Development
```bash
npm install
npx prisma db push
npx tsx prisma/seed.ts
npm run dev
```

### Production
```bash
npm run build
pm2 start ecosystem.config.cjs
```

## Accessibility (WCAG Compliance)
- High contrast mode toggle
- OpenDyslexic font option
- Adjustable text sizes (Normal / Large / XL)
- Text-to-speech for selected text
- ARIA labels on all interactive elements
- Keyboard navigable interface
- Color-independent status indicators
