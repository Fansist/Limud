# Limud - AI-Powered Adaptive Learning Platform

## Project Overview
- **Name**: Limud (Hebrew: "learning")
- **Version**: 7.1.0
- **Goal**: Transform K-12 education with AI-powered tutoring, smart grading, gamification, 16+ platform integrations, and comprehensive analytics
- **Tech Stack**: Next.js 14 + TypeScript + Tailwind CSS + Prisma + NextAuth + OpenAI + Framer Motion
- **GitHub**: https://github.com/Fansist/Limud
- **Development URL**: https://3000-ifjkeor7fvbg89k4c63pq-cc2fbc16.sandbox.novita.ai

## What's New in v7.1.0 - Professional Polish & Consistency Update

### UI/UX Professional Polish
- **Global CSS system overhaul**: Standardized component classes (`.page-header`, `.page-title`, `.page-subtitle`, `.section-header`, `.empty-state`, `.tab-group`, `.filter-pill`, `.btn-danger`)
- **Consistent page headers**: All pages now use unified `page-header`/`page-title`/`page-subtitle` patterns with gradient icon badges
- **Unified empty states**: All empty states follow `.empty-state` pattern with icon, title, and description
- **Tab and filter consistency**: Tab groups and filter pills standardized across all pages
- **Print stylesheet**: Added `@media print` styles for lesson plans, quizzes, and assignments
- **Better card system**: Refined shadow, hover states, and border styles for professional appearance

### AI Lesson Planner - Major Overhaul
- **Specialized lesson generation**: AI generates fully fleshed, detailed lesson plans - not just titled templates
- **Color-coded lesson flow sections**: Warm-Up, Direct Instruction, Guided Practice, Independent Practice, Assessment, Closure - each with distinct left-border color, icon, and timing descriptor
- **Rich objective display**: Blue-themed section with checkmark icons for each learning objective
- **Standards alignment box**: Green-themed section showing Common Core / NGSS alignment
- **Materials list**: Amber-themed section with pill-style material tags
- **Differentiation strategies**: Purple-themed section for ELL, IEP, Advanced, and kinesthetic learners
- **Homework section**: Orange-themed section with full homework descriptions
- **Generation preview**: Modal shows exactly what sections will be generated (11 sections listed)
- **Better topic guidance**: Hint text encourages specific topics for better results
- **Print & delete actions**: Added print and delete buttons per lesson plan
- **Professional card expansion**: Smooth animated expansion with proper section hierarchy

### AI Quiz Generator - Enhanced
- **Labeled form fields**: Each dropdown/input has a descriptive label for clarity
- **Student-version copy**: Button to copy quiz without answers for student distribution
- **Quiz header stats**: Shows grade level, difficulty badge, question count in organized header
- **Question type indicators**: Shows "Multiple Choice" or "Short Answer" badge per question
- **Answer/explanation styling**: Green/blue themed answer and explanation boxes with borders
- **Footer stats**: Shows MC vs SA count and creation date
- **Better quiz list**: Improved sidebar with favorite stars, difficulty badges, and delete buttons

### Game Control - Enhanced
- **4-column stat grid**: Block All, Classes Blocked, Total Students, Game Stats
- **Subject color coding**: Classroom cards show subject abbreviation with color-coded icon
- **Blocked classroom styling**: Red tint on cards for blocked classrooms
- **Game stats with trends**: Each game shows play count, avg score, top player, and trend percentage
- **Better toggle layout**: Larger status badges with clear Blocked/Allowed labels

### Global Styling Improvements
- **Button system**: Added `.btn-danger` class
- **Lesson flow CSS**: Added `.lesson-flow-section` class for consistent lesson plan rendering
- **Form labels**: Consistent `text-xs font-medium text-gray-500` label styling
- **Card borders**: Refined border colors for different states (active, error, success)
- **Backdrop blur on modals**: All modals now use `backdrop-blur-sm` for professional overlay effect

### Previous Features (Maintained from v7.0.0)
- **16+ Platform Integrations**: Khan Academy, i-Ready, Amplify, PLTW, Google Classroom, Canvas, Schoology, Clever, IXL, Quizlet, Newsela, Desmos, Kahoot!, BrainPOP, Edpuzzle, Nearpod
- **Assignment Manager**: Categories with grade weighting, extra credit, file/link attachments
- **Game Store**: 6 games with playable mini-games (Math Blaster, Word Quest, Trivia)
- **Knowledge Page**: Skill radar, study heatmap, rank system, goal tracking
- **All role dashboards**: Student, Teacher, Admin, Parent, Homeschool

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
| My Platforms | `/student/platforms` | 16+ platform connections with search, filter, sync |

### Teacher Features
| Feature | Path | Description |
|---------|------|-------------|
| Dashboard | `/teacher/dashboard` | Overview, class stats, pending items |
| Assignment Manager | `/teacher/assignments` | Create with categories, weights, attachments, extra credit |
| AI Grading | `/teacher/grading` | One-click rubric-based auto-grading |
| Intelligence | `/teacher/intelligence` | Student behavior insights |
| AI Quiz Generator | `/teacher/quiz-generator` | Curriculum-aligned quiz creation with student-version export |
| AI Lesson Planner | `/teacher/lesson-planner` | Complete lesson plans with 11 sections + worksheet finder |
| Game Control | `/teacher/games` | Per-class game access toggle + stats + trends |
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

## AI Lesson Plan Structure
Each generated lesson plan includes these fully detailed sections:
1. **Learning Objectives** - 3+ specific, measurable objectives
2. **Standards Alignment** - Common Core, NGSS, or subject-specific standards
3. **Materials Needed** - Complete materials list with specifics
4. **Warm-Up** (5 min) - Engaging hook activity with discussion prompts
5. **Direct Instruction** (10-15 min) - Step-by-step teaching script with examples
6. **Guided Practice** (10-15 min) - Collaborative activities with teacher facilitation
7. **Independent Practice** (10-15 min) - Tiered problem sets (approaching/on grade/advanced)
8. **Assessment** - Exit ticket with rubric and scoring criteria
9. **Closure** (5 min) - Reflection activity and preview of next lesson
10. **Differentiation** - Strategies for ELL, IEP, Advanced, and kinesthetic learners
11. **Homework** - Extension activities with real-world connections

## API Endpoints

### Demo API (`/api/demo`)
- `GET ?type=student-assignments|student-rewards|teacher-assignments|teacher-analytics|admin-districts|parent-children|notifications|lesson-plans|messages|user`
- `POST type=generate-lesson-plan` - AI lesson plan generation (specialized per subject/topic)
- `POST type=generate-quiz` - AI quiz generation (specialized per subject/topic)
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
- **Development URL**: https://3000-ifjkeor7fvbg89k4c63pq-cc2fbc16.sandbox.novita.ai
- **Last Updated**: March 2, 2026
- **Build**: `npx next build` (all pages compile successfully)
- **Dev Server**: `pm2 start ecosystem.config.cjs` on port 3000

## Version History

### v7.1.0 (March 2, 2026) - Professional Polish & Consistency
- Global CSS system overhaul with standardized component classes
- AI Lesson Planner major overhaul with color-coded lesson flow sections
- AI Quiz Generator enhanced with labeled fields, student-version export
- Game Control enhanced with 4-column stats, subject colors, trends
- Print stylesheet for lesson plans and quizzes
- Unified page headers, empty states, tabs, and filters across all pages

### v7.0.0 (March 1, 2026) - Platform Expansion & Landing Page Redesign
- Added 10 new educational platform integrations (total: 16+)
- Complete platform linking with search, filter, sync status, auto-sync toggle
- Landing page redesign with integrations section, updated features grid, pricing
- Fixed 27 double-semicolon syntax errors across codebase
- Removed 541MB core dump file

### v6.0.0 (March 1, 2026) - Major Feature Overhaul
- Specialized AI lesson plan generation
- Specialized AI quiz generation with real curriculum content
- Interactive game store with playable mini-games
- Game control with per-class toggles and stats
- Assignment categories with grade weighting
- Extra credit assignment support
- File and link attachments for assignments

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
3. **Generate lesson plans** with the AI Lesson Planner - get complete, standards-aligned plans with 11 detailed sections
4. **Generate quizzes** with the AI Quiz Generator - get curriculum-aligned questions with explanations
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
