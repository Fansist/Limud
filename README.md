# Limud - Adaptive AI-Powered K-12 EdTech Platform

## Live URL
**https://3000-ifjkeor7fvbg89k4c63pq-cc2fbc16.sandbox.novita.ai**

## Project Overview
- **Name**: Limud (Hebrew for "learning")
- **Goal**: Transform K-12 education with a fully adaptive AI-powered platform featuring deep skill-level tracking, real-time difficulty adjustment, cognitive science optimization, and gamified progression
- **Tech Stack**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion, NextAuth.js, Prisma ORM, PostgreSQL, OpenAI GPT-4o-mini

---

## Completed Features

### Legal & Info Pages
- `/privacy` - Full Privacy Policy (FERPA & COPPA compliant)
- `/terms` - Terms of Service
- `/about` - About Limud with feature overview
- `/contact` - Contact form with departmental info
- `/accessibility` - WCAG 2.1 AA accessibility statement

### Authentication & Roles
- Multi-step registration wizard (Student, Teacher, Parent)
- Account types: District, Homeschool, Individual
- Homeschool parents get full teacher tools
- Multiple children per parent account
- NextAuth.js with JWT sessions, bcrypt passwords

### Student Portal (`/student/*`)
| Page | Path | Description |
|------|------|-------------|
| Dashboard | `/student/dashboard` | Welcome banner, XP bar, streaks, upcoming assignments, recent grades |
| Assignments | `/student/assignments` | View/submit assignments with AI feedback |
| AI Tutor | `/student/tutor` | Socratic AI tutoring with subject presets, quick prompts |
| **Study Planner** | `/student/study-planner` | AI-generated study schedules using spaced repetition & interleaving |
| **Exam Simulator** | `/student/exam-sim` | Practice exams with AI score prediction, question review, strength/weakness analysis |
| **Growth Analytics** | `/student/growth` | Skill mastery map, predicted grades, struggle detection, due review count |
| Rewards | `/student/rewards` | XP, levels, coins, avatar shop, badges |
| Certificates | `/student/certificates` | Achievement certificates |

### Teacher Portal (`/teacher/*`)
| Page | Path | Description |
|------|------|-------------|
| Dashboard | `/teacher/dashboard` | Class overview, at-risk students |
| Assignments | `/teacher/assignments` | Create/manage assignments with rubrics |
| AI Grading | `/teacher/grading` | One-click and batch AI auto-grading |
| **AI Quiz Generator** | `/teacher/quiz-generator` | Generate quizzes/worksheets by subject, grade, difficulty with AI |
| AI Lesson Planner | `/teacher/lesson-planner` | AI-generated full lesson plans |
| **Insights & Heatmap** | `/teacher/insights` | Misconception heatmap, skill gap analysis, performance predictions |
| Analytics | `/teacher/analytics` | Student performance, risk identification |

### Parent Portal (`/parent/*`)
| Page | Path | Description |
|------|------|-------------|
| Dashboard | `/parent/dashboard` | Children overview, grades, rewards, courses |
| **Growth Reports** | `/parent/reports` | Weekly stats, risk alerts, subject averages, skill tracking, predicted grades |
| Manage Children | `/parent/children` | Add/manage children, create courses, share credentials |

### Admin Portal (`/admin/*`)
| Page | Path | Description |
|------|------|-------------|
| Dashboard | `/admin/dashboard` | District overview, subscription status |
| Provisioning | `/admin/provision` | Bulk CSV import of students/teachers |

### Demo Mode
- `/demo` - Role selector to try any portal without registration
- All dashboards work with simulated data via `?demo=true`

---

## Cognitive Science Engine (`src/lib/cognitive-engine.ts`)
- **SM-2 Spaced Repetition**: SuperMemo algorithm for optimal review scheduling
- **Adaptive Difficulty**: Targets 70-85% success rate ("desirable difficulty" zone)
- **Skill Mastery Tracking**: Weighted mastery calculation from accuracy, streak, attempts
- **Burnout/Struggle Detection**: Monitors declining scores, lost streaks, inactivity
- **Performance Prediction**: Grade prediction based on weighted moving averages + streak/study bonuses
- **Interleaving Engine**: Mixes review and new material across topics
- **Study Session Optimizer**: Auto-generates study plans based on due dates and weak skills

---

## API Endpoints

### Auth
- `POST /api/auth/register` - Register new user (supports homeschool w/ multiple children)
- `POST /api/auth/[...nextauth]` - NextAuth sign in/out

### Student APIs
- `GET/POST /api/assignments` - List/create assignments
- `POST /api/submissions` - Submit assignment work
- `POST /api/tutor` - AI tutor chat
- `GET/POST /api/skills` - Skill tracking & mastery data
- `GET/POST/PUT /api/study-planner` - AI study plan generation & session tracking
- `GET/POST/PUT /api/exam-sim` - Exam simulation engine
- `GET/PUT /api/mistakes` - Mistake replay & error diagnosis
- `GET/POST /api/rewards` - XP, coins, avatars
- `GET/POST/PUT /api/challenges` - Challenge/tournament system

### Teacher APIs
- `POST/PUT /api/grade` - AI grading (single & batch)
- `GET/POST /api/lesson-plans` - AI lesson plan generator
- `GET/POST/DELETE /api/quiz-generator` - AI quiz/worksheet generator
- `GET /api/teacher/insights` - Misconception heatmap & performance predictions
- `GET /api/analytics` - Student analytics & risk identification

### Parent APIs
- `GET /api/parent` - Children overview
- `GET /api/parent/reports` - Growth reports, predictions, risk alerts

### System APIs
- `GET/PUT /api/notifications` - Notification system
- `GET /api/demo` - Demo data endpoints

---

## Database Schema (Prisma)

### Core Models
- **User** - Multi-role (Student, Teacher, Admin, Parent) with account types
- **SchoolDistrict** - Organization with subscription management
- **Course**, **CourseTeacher**, **Enrollment** - Course management
- **Assignment**, **Submission** - Assignment workflow with AI grading

### Adaptive Learning Models (NEW)
- **SkillRecord** - Per-skill mastery tracking with SM-2 scheduling
- **SpacedRepItem** - Individual flashcard-style review items
- **StudyPlanSession** - AI-planned study sessions
- **ExamAttempt** - Practice exam history with score prediction
- **MistakeEntry** - Error diagnosis and misconception tracking
- **QuizTemplate** - Teacher AI-generated quiz storage

### Engagement Models
- **RewardStats** - XP, levels, streaks, coins, league points
- **Challenge**, **ChallengeParticipant** - Tournaments & competitions
- **WeeklyReport** - Parent growth reports
- **Certificate** - Achievement certificates
- **Notification** - Cross-role notification system

---

## UI/UX
- **Dark Mode**: Toggle via sidebar button, persists to localStorage
- **Accessibility**: High contrast mode, dyslexia font, keyboard navigation
- **Responsive**: Full mobile support with collapsible sidebar
- **Animations**: Framer Motion throughout for smooth transitions
- **Design System**: Custom Tailwind theme with primary, accent, gamification colors

---

## Setup & Development
```bash
git clone <repo>
cd webapp
npm install
# Configure .env (DATABASE_URL, NEXTAUTH_SECRET, OPENAI_API_KEY)
npx prisma db push
npm run dev
```

## Deployment
- **Platform**: Self-hosted / Vercel
- **Status**: Active
- **Last Updated**: 2026-02-25
