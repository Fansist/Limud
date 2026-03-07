# Limud - AI-Powered Adaptive Learning Platform

## Project Overview
- **Name**: Limud (Hebrew: "learning")
- **Version**: 8.3
- **Goal**: Transform K-12 education with AI-powered tutoring, smart grading, gamification, 16+ platform integrations, and comprehensive analytics — designed to beat every competitor in the market
- **Tech Stack**: Next.js 14 + TypeScript + Tailwind CSS + Prisma + NextAuth + OpenAI + Framer Motion
- **GitHub**: https://github.com/Fansist/Limud
- **Development URL**: https://3000-ifjkeor7fvbg89k4c63pq-cc2fbc16.sandbox.novita.ai

## What's New in v8.3 — Product Roadmap Page

### NEW: /roadmap Page
- **Comprehensive product roadmap** with 4 tabs: Planned Updates, In Progress, Recently Shipped, Future Vision
- **23 roadmap items** across 10 categories covering near-term and long-term features
- **Interactive features**: Search, category filtering, expandable detail cards with implementation specifics
- **Visual timeline**: Q1 2026 through 2028+ with item counts per quarter
- **Stats dashboard**: At-a-glance counts for In Progress, Planned, Shipped, and Exploring items
- **Status badges**: Each feature shows status (Shipped/In Progress/Planned/Exploring) and impact level (High/Medium/Low)
- **Mission statement**: Addressing the mental health crisis — "No generation has been lonelier, more anxious, and more unhappy than the teenagers who have grown up with social media"
- **Roadmap link added** to landing page footer navigation

### Planned Features Highlights (from the roadmap):
- **Near-term (Q2-Q3 2026)**: AI Differentiated Instruction, Peer Tutoring Marketplace, Adaptive Quiz Engine, Classroom Observation AI, Multi-Language Support (12+ languages), Native Mobile Apps (iOS/Android), Advanced District Analytics
- **Mid-term (Q4 2026)**: Teacher PD Hub, Student Mental Health & SEL Check-Ins, Curriculum Standards Auditor, Multiplayer Educational Games
- **Long-term (2027+)**: AI Teaching Assistant (Autonomous Agent), AR/VR Learning Experiences, AI-Generated Video Content, Blockchain Credentials, AI Emotional Intelligence Tutor, Music & Arts Integration
- **Far future (2028+)**: Community Knowledge Graph, Physical-Digital Bridge (OCR), Cross-District Student Mobility, Open Curriculum Marketplace

## What's New in v8.2 — Pricing Overhaul, Custom Plan Builder & Bug Fixes

### Pricing Overhaul (6 Tiers with Detailed Limitations)
- **Expanded from 4 to 6 pricing tiers**: Free, Starter, Growth, Standard, Premium, Enterprise
- **Every tier now has explicit limitations**: Student/teacher/school caps, AI usage limits, storage limits, integration counts, analytics access, support level
- **Monthly + Annual billing toggle** with 25% annual discount clearly shown
- **Full feature comparison table**: 50+ features across 9 categories (Capacity, AI Features, Gamification, Teaching Tools, Integrations, Analytics, Administration, Compliance, Support) — expandable/collapsible by category
- **Consistent pricing across all pages**: Pricing page, landing page, onboard page, and help/FAQ page all show the same 6-tier structure

### NEW: Interactive Custom Plan Builder
- **Mix-and-match pricing calculator** with real-time cost estimation
- **9 customizable sliders** for granular control:
  - **Capacity**: Students (10-5,000), Teachers (2-500), Schools (1-50), Storage (500MB-500GB)
  - **AI Features**: AI Tutor sessions (50-10,000/mo), AI Auto-Grader (0-5,000/mo), AI Lesson Plans (5-2,000/mo), AI Quiz Generator (3-1,000/mo), AI Writing Coach (0-1,000/mo)
- **8 analytics toggles**: Student Progress, Parent Dashboard (free), Advanced Teacher Analytics (+$15/mo), Knowledge Heatmaps (+$20/mo), District Reporting (+$30/mo), Export Reports (+$10/mo), Predictive Analytics (+$50/mo), AI Reports & Insights (+$25/mo)
- **8 add-on features**: Google Classroom Sync (+$20/mo), Canvas/Schoology (+$30/mo), SSO/SAML (+$50/mo), Custom Branding (+$40/mo), Bulk CSV (+$15/mo), Priority Support (+$25/mo), Phone Support (+$50/mo), SOC 2 Type II (+$75/mo)
- **Donut chart** visualizing cost breakdown (Capacity vs AI Features vs Analytics vs Add-ons)
- **Sticky summary panel** showing monthly/annual pricing, cost per student, and closest standard plan
- **4 quick presets**: Small School, Growing District, Large District, Max Everything
- **Tier markers on sliders** showing where each standard plan falls

### Updated Onboard Page
- **Removed deprecated CUSTOM tier** — onboard now uses the 6 standard tiers (Free, Starter, Growth, Standard, Premium, Enterprise)
- **Clean plan selection grid** without legacy custom slider logic

### Updated Help/FAQ
- **Pricing answer updated** to reflect all 6 tiers with correct pricing

### Bug Fixes & Feature Implementations
- **NEW**: `/api/settings/weights` API route for teacher assignment category weights
- **FIXED**: Student survey page now works in demo mode with built-in questions
- **FIXED**: Teacher grading page demo mode improvements
- **FIXED**: Student games page edge cases

### Previous v8.1 Changes (Retained)
- Unified brand header across all auth pages
- Full SEO meta tags (OG, Twitter cards, page-level titles)
- Forgot-password URL fix, footer link cleanup
- manifest.json brand color and metadata updates

## What's New in v8.0 — Competitor-Killer Landing Page (Based on 30-App Analysis)

### Competitive Intelligence Landing Page
Analyzed 30 top education apps (Duolingo, Khan Academy, Udemy, Coursera, Quizlet, Google Classroom, ClassDojo, Nearpod, Prodigy, ChatGPT, etc.) and redesigned the landing page to systematically address every competitor's weakness.

### NEW: Competitor Comparison Table
- Full feature comparison grid: **Limud vs Khan Academy vs Google Classroom vs Quizlet vs ClassDojo vs Nearpod**
- 14 feature rows with green checkmarks (Limud), amber partial marks, and red X marks (competitors)
- Limud shows green checks for ALL 14 features — no other competitor comes close

### NEW: "vs. Competitor" Weakness Callouts
- **vs. Khan Academy**: Self-directed, no AI grading, no gamification, no parent dashboards
- **vs. Google Classroom**: Basic grading, no AI features, no gamification, no analytics
- **vs. Quizlet/ClassDojo/Nearpod**: Each solves one problem; Limud replaces all three

### NEW: Competitor Pricing Comparison
- Shows Coursera ($49-79/mo), Babbel ($299 lifetime), ABCmouse ($13/mo), Nearpod (custom) — vs Limud $0 free forever

### ENHANCED: "Replaces X" Feature Tags
Every feature card now explicitly states which competitor it replaces:
- AI Tutor → "Replaces ChatGPT" (Socratic method, not answer-giving)
- AI Quiz Generator → "Replaces Quizlet" (AI-verified, not user-generated)
- Gamification → "Replaces ClassDojo" (works for all K-12, not just elementary)
- Educational Games → "Replaces Prodigy" (covers ALL subjects, not just math)
- Assignment Manager → "Replaces Google Classroom" (AI grading + categories)
- Parent Portal → "Replaces Remind" (full dashboard, not just messaging)

### ENHANCED: Conversion Elements
- Hero: "Why pay for 6 apps when one does it all?" with explicit competitor name drops
- Testimonials include "Switched from: Khan + IXL + ClassDojo" callouts
- FAQ answers directly compare Limud vs specific competitors
- 16 platform logos (up from 12) — added Clever, Desmos, Edpuzzle, Newsela
- All demo links correctly point to /login (fixed /demo 404)

### Bug Fixes (Retained from v7.5)
- **Prisma Foreign Key Error (P2003)**: Gracefully returns AI content even if DB save fails
- **AI Lesson Plan Reliability**: response_format: json_object, max_tokens: 4000
- **Worksheet Count**: 87+ curated worksheets across 10 subjects

## What's New in v7.4 - Cross-Platform Assignments, Worksheet Finder Fix & Master Demo

### Worksheet Finder - Completely Fixed
- **Root cause fixed**: Search now uses fuzzy word-splitting matching instead of exact substring matching. Searching "fractions" now correctly finds "Fraction Operations Practice" via tag matching.
- **Tag-based search**: Every worksheet now has keyword tags (e.g., `['fractions', 'math', 'operations']`) for much better discoverability
- **Multi-word search**: Query "math equations" matches worksheets containing BOTH words anywhere in title, description, subject, or tags
- **Expanded library**: 18 worksheets (up from 12) covering Math, Science, English, History, and Computer Science across grades 3rd-10th
- **Always works**: Search runs purely client-side against local data — no API dependency, works with or without demo mode

### Cross-Platform Assignments
- **Assign from any website**: New "From Platform" tab in Create Assignment modal lets teachers paste any URL to assign as homework
- **Pre-built platform activities**: 10 ready-to-assign activities from Khan Academy, IXL, Newsela, Edpuzzle, Quizlet, Desmos, BrainPOP, Google Classroom, and Kahoot!
- **Custom URL support**: Teachers can paste any educational website URL (worksheets, articles, videos, practice problems) and assign it directly
- **Platform link**: Direct link to Connections page from the assignment modal for connecting more platforms
- **External assignment type**: New "EXTERNAL" assignment type for platform-sourced work

### Master Demo Account
- **Email**: `master@limud.edu`
- **Full access**: Single account with access to ALL roles (Student, Teacher, Admin, Parent)
- **Role switcher**: Sidebar displays a 4-button role switcher when logged in as Master Demo — click to navigate to any role's dashboard
- **Login page**: Master Demo button prominently displayed on login page with gold styling
- **isMasterDemo flag**: Stored in JWT session, detected by DashboardLayout for cross-role navigation

### Landing Page Updates (v7.4)
- Updated hero text: "Teach smarter. Learn better."
- New "What's New in v7.4" section highlighting cross-platform assignments, worksheet finder, and master demo
- Added "Cross-Platform Assignments" feature card
- Added "Worksheet Finder" feature card
- Added "Assign from any website" trust badge
- Updated feature descriptions to reflect v7.4 capabilities

### Previous v7.3 Features (Retained)
- Fixed 7 pages with double DashboardLayout rendering
- Added Suspense wrappers to 18 route layouts
- Fixed useIsDemo hook race condition
- Teacher-editable category weights with slider, auto-balance, save/reset

### Previous v7.1.1 Features (Retained)
- **Worksheet Search Fixed**: Correctly returns results with any filter combination
- **Grade-Level Filtering**: Applied correctly in demo mode
- **Expanded Worksheet Library**: 12 demo worksheets covering more subjects and grade levels
- **Science Puzzle Lab & Typing Champions Mini-Games**: Fully playable in Game Store
- **Game Control Global Block Sync**: Block All toggle correctly reflects classroom states
- **Demo Lesson Plan Subjects**: Now correctly show "Science" matching the app taxonomy

### Previous v7.1.0 Features (Retained)

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
- **Game Store**: 6 games with playable mini-games (Math Blaster, Word Quest, Science Puzzle Lab, Typing Champions, History Trivia, Geography Explorer)
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
| Assignment Manager | `/teacher/assignments` | Create with categories, editable weights, save/reset, auto-balance, attachments, extra credit |
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
- **Last Updated**: March 7, 2026
- **Build**: `npx next build` (all pages compile successfully, zero errors)
- **Dev Server**: `pm2 start ecosystem.config.cjs` on port 3000
- **Test Results**: 41+ routes return HTTP 200, zero console errors, zero PM2 error logs

## Version History

### v8.3 (March 7, 2026) - Product Roadmap Page
- **NEW**: /roadmap page with 4 tabs (Planned Updates, In Progress, Recently Shipped, Future Vision)
- **NEW**: 23 roadmap items across 10 categories with search, filtering, and expandable details
- **NEW**: Visual timeline (Q1 2026-2028+), stats dashboard, status/impact badges
- **NEW**: Mission statement addressing teen mental health crisis and social media
- **UPDATED**: Landing page footer with Roadmap link
- **VERSION**: Bumped to 8.3.0

### v8.2 (March 6, 2026) - Pricing Overhaul, Custom Plan Builder & Bug Fixes
- **NEW**: 6-tier pricing structure (Free, Starter, Growth, Standard, Premium, Enterprise) with detailed limitations
- **NEW**: Interactive Custom Plan Builder with 9 sliders (students, teachers, schools, storage, AI tutor, AI grader, lesson plans, quiz gen, writing coach)
- **NEW**: 8 analytics toggles and 8 add-on features for custom plan customization
- **NEW**: Donut chart cost breakdown, sticky summary panel, 4 quick presets, tier markers
- **NEW**: `/api/settings/weights` route for teacher assignment weights
- **FIXED**: Student survey demo mode, teacher grading demo improvements, game page edge cases
- **UPDATED**: Consistent pricing across pricing page, landing page, onboard page, and help/FAQ
- **REMOVED**: Deprecated CUSTOM tier from onboard page
- **VERSION**: Bumped to 8.2.0

### v8.1 (March 5, 2026) - Professional Polish & Brand Consistency
- **POLISHED**: Unified brand header across all auth pages (BookOpen icon, backdrop-blur navbar)
- **ADDED**: Full SEO meta tags — OG, Twitter cards, page-level titles for all routes
- **FIXED**: Forgot-password hardcoded localhost URL — now uses request origin
- **FIXED**: Footer placeholder links (Blog/Careers) replaced with real links (Help Center/Pricing)
- **CLEANED**: Removed unused imports and duplicate footer links
- **UPGRADED**: manifest.json with proper brand color, categories, and orientation

### v8.0 (March 4, 2026) - Competitor-Killer Landing Page
- **NEW**: Full competitor comparison table (Limud vs Khan Academy, Google Classroom, Quizlet, ClassDojo, Nearpod)
- **NEW**: "vs. Competitor" weakness callout cards for Khan, Google Classroom, and Quizlet/ClassDojo/Nearpod
- **NEW**: Competitor pricing comparison (Coursera, Babbel, ABCmouse, Nearpod vs Limud free)
- **ENHANCED**: Feature cards show "Replaces X" tags for each competitor replaced
- **ENHANCED**: Hero, testimonials, FAQ, and CTAs all reference specific competitors
- **ENHANCED**: 16 platform logos (added Clever, Desmos, Edpuzzle, Newsela)
- **FIXED**: All demo links point to /login (no more /demo 404)
- **VERSION**: Bumped to 8.0.0

### v7.5 (March 3, 2026) - Conversion-Optimized Landing Page & Bug Fixes
- Landing page rewrite with Problem/Solution hero, Before/After pain points, "Replaces Your Stack" visual
- Sticky CTA bar, multiple CTAs, money-back guarantee badge
- Fixed Prisma FK error P2003, AI lesson plan reliability, worksheet count

### v7.4 (March 3, 2026) - Cross-Platform Assignments, Worksheet Finder & Master Demo
- **Fixed**: Worksheet finder never finding results (exact substring matching replaced with fuzzy word+tag search)
- **Added**: 18 worksheets with keyword tags (up from 12)
- **Added**: Cross-platform assignments - assign from any website URL in Assignment Manager
- **Added**: 10 pre-built platform activities (Khan Academy, IXL, Newsela, Edpuzzle, Quizlet, etc.)
- **Added**: Master Demo account (master@limud.edu) with full access to all roles
- **Added**: Role switcher in sidebar for Master Demo account
- **Added**: Landing page "What's New in v7.4" section
- **Updated**: Hero text, feature cards, trust badges on landing page
- **Updated**: Assignment Manager with "External Platform" type and custom URL support

### v7.3 (March 3, 2026) - Page Duplication Fix & Editable Weights
- **Fixed**: 7 pages rendering double DashboardLayout (complete page duplication)
- **Fixed**: 18 route layouts missing Suspense boundaries for useSearchParams
- **Fixed**: useIsDemo hook race condition causing flash-of-empty-state on page load
- **Added**: Teacher-editable category weights with slider + numeric input, auto-balance, save/reset, visual weight bar
- **Added**: Weight validation (must equal 100%), dirty state tracking, unsaved changes warning
- **Polish**: All 40+ pages now have proper Suspense boundaries and consistent loading spinners

### v7.1.1 (March 2, 2026) - Bug Fix & Mini-Game Expansion
- **Fixed**: Worksheet search never returning results (overly strict validation)
- **Fixed**: Grade-level filter not applied in demo worksheet search
- **Fixed**: Demo lesson plans showing "Biology" instead of "Science" (subject taxonomy mismatch)
- **Fixed**: Science Puzzle Lab & Typing Champions showing "coming soon" instead of playable games
- **Fixed**: Game Control "Block All" toggle desyncing from individual classroom states
- **Added**: Science Puzzle Lab mini-game (6-question science trivia with explanations)
- **Added**: Typing Champions mini-game (3-round typing race with WPM & accuracy)
- **Added**: 4 new demo worksheets (12 total) covering more subjects and grade levels
- **Added**: "Browse All Worksheets" button, "No results" state, "Clear filters" link
- All 6 Game Store games now fully playable

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
