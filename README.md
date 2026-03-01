# Limud - AI-Powered Adaptive Learning Platform

## Project Overview
- **Name**: Limud
- **Version**: 6.0.0
- **Goal**: Transform education with AI-powered adaptive learning, gamification, cross-platform integrations, and collaborative teacher tools
- **Stack**: Next.js 14.2 + React 18 + TypeScript + Tailwind CSS + Prisma + PostgreSQL + OpenAI
- **GitHub**: https://github.com/Fansist/Limud

## Live URLs
- **Development**: https://3000-ifjkeor7fvbg89k4c63pq-cc2fbc16.sandbox.novita.ai
- **Demo Mode**: Append `?demo=true` to any route (no login required)

---

## What's New (v6.0.0 - 2026-03-01)

### AI Lesson Planner - Fully Specialized (`/teacher/lesson-planner`)
**Completely rebuilt AI content generation** - no more generic templates:
- **Topic-specific lesson plans**: Generates detailed, standards-aligned content unique to each topic
  - Math topics: Fractions (LCD method, Recipe Rescue activity, tiered problems), Algebra (balance principle, Equation Detectives), Geometry, and more
  - Science topics: Photosynthesis (Elodea Bubble Lab, chloroplast diagrams), Biology, Physics, Chemistry
  - English: SOAPSTone analysis, RACE paragraphs, Literature Circles
  - History: HIPP source analysis, Document Stations, primary source investigation
- **Rich lesson flow**: Warm-up with real-world connections, direct instruction with step-by-step examples, guided practice with specific activities, independent practice with tiered difficulty, formative + summative assessment, closure
- **Differentiation built-in**: ELL accommodations, IEP modifications, advanced extensions, kinesthetic alternatives
- **Real standards alignment**: CCSS Math, NGSS Science, C3 History framework references
- **Worksheet finder tab**: Search education.com, Teachers Pay Teachers, K5 Learning, Common Core Sheets, Science Buddies, ReadWriteThink, PLTW

### AI Quiz Generator - Real Questions (`/teacher/quiz-generator`)
**Completely rebuilt question generation** with curriculum-aligned content:
- **Subject-specific question banks**: Math (Algebra, Geometry, Fractions, Statistics), Science (Biology, Chemistry, Physics), English (Literary Devices, Grammar, Reading Comp), History (US History, World History, Government)
- **Real questions with real answers**: Actual math equations to solve, scientific facts, literary analysis
- **Detailed explanations**: Every question includes step-by-step solution explanations
- **Skill tags**: Each question tagged with specific skill (e.g., "Linear Equations", "Cell Biology", "Literary Devices")
- **Difficulty filtering**: Questions tagged EASY/MEDIUM/HARD with appropriate filtering
- **Show/hide answers toggle**: Teachers can preview quiz with or without answer key
- **Copy to clipboard**: Export full quiz as text for printing or sharing
- **Delete quizzes**: Clean up quiz list

### Game Store - Interactive Mini-Games (`/student/games`)
**Real playable games** instead of placeholder screens:
- **Math Blaster**: 30-second timed arithmetic challenge (addition, subtraction, multiplication) with 4-option multiple choice, running score, correct/wrong feedback
- **Word Quest**: Hangman-style vocabulary game with educational hints, letter-by-letter guessing, multi-word progression, scoring based on efficiency
- **Trivia Games**: Subject-specific trivia (History, Geography, Science) with 5-question rounds, instant feedback, score tracking
- **Purchase system**: Spend XP to unlock games, play owned games, game-blocked detection from teacher
- **Game session tracking**: Play counts, ratings, top players

### Game Control - Enhanced Teacher Dashboard (`/teacher/games`)
- **Quick action cards**: Block All / Unblock All toggle, blocked count summary, game stats panel
- **Student game activity stats**: Plays per game, average scores, top players
- **Per-classroom controls**: Toggle games on/off per class period
- **Class schedule display**: Shows class times for quick reference
- **Global block mode**: Disable all games across all classes with one click

### Platform Linking - Full Integration (`/student/platforms`)
Connect and sync with 6 external learning platforms:
- **Khan Academy** - Progress, mastery, assignments
- **i-Ready** - Scores, diagnostics, growth data
- **Amplify** - Assignments, scores, curriculum progress
- **PLTW** - Projects, assessments, certificates
- **Google Classroom** - Classes, assignments, grades, roster
- **Canvas LMS** - Courses, assignments, grades, rubrics
- Connect/disconnect with username, manual sync, last-sync tracking, "Open" quick link

### Teacher Assignment Manager - Categories, Weighing & Attachments (`/teacher/assignments`)
**Major upgrade with grade management features:**
- **Assignment categories**: Homework (20%), Classwork (20%), Quizzes (25%), Tests/Exams (25%), Projects (10%), Extra Credit (bonus)
- **Adjustable grade weights**: Slider-based weight adjustment per category with real-time total validation
- **Extra credit support**: Dedicated extra credit toggle - bonus points added on top of weighted grade
- **Worksheet/file attachments**: Upload PDFs, DOCs, PPTs, images, ZIPs (up to 25MB) to any assignment
- **Link attachments**: Attach URLs (Khan Academy resources, Google Docs, educational sites) to assignments
- **Category filtering**: Filter assignment list by category (homework, classwork, quiz, test, project, extra credit)
- **Students see attachments**: Resources appear as downloadable/clickable items in student assignment view

### Student Assignments - Resource Access & Extra Credit (`/student/assignments`)
- **Teacher resources panel**: Blue highlighted section showing attached worksheets, files, and links per assignment
- **Download/open resources**: Click to download PDFs or open links in new tab
- **Extra credit filter**: Dedicated filter to see only extra credit assignments
- **Extra credit badge**: Pink badge clearly marks bonus assignments
- **Resources in submission modal**: When starting work, all teacher attachments are visible for reference
- **6 submission types**: Written, Link/URL, Audio, Video, Code, Drawing with file attachments

### Knowledge Dashboard - Hydration Fix (`/student/knowledge`)
- **Fixed hydration mismatch**: Replaced `Math.random()` in render with deterministic seeded pseudo-random using useMemo
- **HeatCalendar optimized**: Memoized week computation with useMemo to prevent recalculation
- **Radar chart**: Knowledge gap visualization across subjects
- **Study consistency heatmap**: GitHub-style 12-week activity calendar
- **Skill mastery list**: Individual skill tracking with progress bars
- **Goal countdown**: Track progress toward XP, streak, mastery, and assignment goals
- **Rank system**: Bronze → Silver → Gold → Platinum → Diamond with XP progress

---

## Complete Feature List

### Student Routes
| Route | Feature | Status |
|-------|---------|--------|
| `/student/dashboard` | Main dashboard with stats, recent assignments, streak | Working |
| `/student/assignments` | View assignments, teacher resources, submit work (6 types), extra credit | Working |
| `/student/tutor` | AI tutor chatbot with personalized responses | Working |
| `/student/knowledge` | Knowledge radar, heatmap, skills, rank system | Working |
| `/student/study-planner` | AI-powered study schedule generator | Working |
| `/student/exam-sim` | Practice exams with AI grading | Working |
| `/student/growth` | Growth analytics with charts | Working |
| `/student/rewards` | XP, coins, avatar shop | Working |
| `/student/games` | Game store with playable mini-games | Working |
| `/student/daily-challenge` | Daily streak challenges | Working |
| `/student/leaderboard` | Class and school rankings | Working |
| `/student/badges` | Achievement badges collection | Working |
| `/student/certificates` | Earned certificates gallery | Working |
| `/student/platforms` | Connect Khan Academy, iReady, Amplify, PLTW, Google Classroom, Canvas | Working |
| `/student/focus` | Focus mode with Pomodoro timer | Working |
| `/student/study-groups` | Collaborative study groups | Working |
| `/student/survey` | Learning style survey | Working |

### Teacher Routes
| Route | Feature | Status |
|-------|---------|--------|
| `/teacher/dashboard` | Teacher dashboard with class overview | Working |
| `/teacher/assignments` | Create assignments with categories, weights, attachments, extra credit | Working |
| `/teacher/grading` | AI-assisted grading | Working |
| `/teacher/quiz-generator` | AI quiz generator with real curriculum questions | Working |
| `/teacher/lesson-planner` | AI lesson planner with specialized content + worksheet finder | Working |
| `/teacher/worksheets` | Custom worksheet builder (7 question types) | Working |
| `/teacher/exchange` | Teacher Exchange community hub | Working |
| `/teacher/insights` | Student engagement heatmap | Working |
| `/teacher/intelligence` | Class intelligence dashboard | Working |
| `/teacher/analytics` | Teacher analytics | Working |
| `/teacher/reports` | AI-powered reports | Working |
| `/teacher/students` | Student management | Working |
| `/teacher/games` | Game access control with stats & quick actions | Working |

### Admin Routes
| Route | Feature | Status |
|-------|---------|--------|
| `/admin/dashboard` | District overview | Working |
| `/admin/students` | Student account management, bulk CSV import | Working |
| `/admin/schools` | School management | Working |
| `/admin/classrooms` | Classroom management | Working |
| `/admin/analytics` | District analytics | Working |
| `/admin/payments` | Billing and subscriptions | Working |

### Parent Routes
| Route | Feature | Status |
|-------|---------|--------|
| `/parent/dashboard` | Children overview | Working |
| `/parent/reports` | Progress reports per child | Working |
| `/parent/messages` | Teacher messaging | Working |
| `/parent/children` | Manage linked children | Working |

---

## Data Architecture
- **Database**: PostgreSQL with Prisma ORM (40+ models)
- **Auth**: NextAuth.js with JWT sessions
- **AI**: OpenAI API (gpt-5-mini) for tutoring, grading, quiz/lesson generation
- **File Storage**: Base64 encoded with MIME type handling (max 10MB per file)
- **Demo Mode**: Full client-side demo data with `?demo=true` query parameter

## API Routes
52+ API routes covering:
- `/api/assignments` - CRUD with categories, attachments, extra credit
- `/api/submissions` - Multi-type submissions with file uploads
- `/api/lesson-plans` - AI-powered lesson generation with real content
- `/api/quiz-generator` - AI quiz with curriculum-aligned questions
- `/api/demo` - Specialized demo content generators
- `/api/games` - Game store, purchases, play sessions, teacher controls
- `/api/platforms` - Platform linking, sync, disconnect
- `/api/grading` - AI-assisted grading with feedback
- `/api/tutor` - AI tutor with personalized responses
- `/api/files` - File upload/download management
- `/api/exchange` - Teacher Exchange community
- `/api/worksheets` - Custom worksheet builder
- And 40+ more routes for analytics, rewards, admin, etc.

## AI Content Generation System (`/src/lib/ai-generators.ts`)
Specialized content banks for demo mode:
- **Lesson Plans**: Math (Fractions, Algebra + defaults), Science (Photosynthesis + defaults), English, History - each with 8+ detailed sections
- **Quiz Questions**: 50+ real questions across Math (Algebra, Geometry, Fractions), Science (Biology), English (Literary Devices), History (US/World) with answers, explanations, and skill tags

## Tech Stack
- **Framework**: Next.js 14.2 (standalone output)
- **Runtime**: React 18.3 + TypeScript 5.7
- **Styling**: Tailwind CSS 3.4
- **Database**: PostgreSQL + Prisma 5.22
- **Auth**: NextAuth.js
- **AI**: OpenAI API (gpt-5-mini)
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **PM2**: Process management with memory limits

## Development
```bash
npm install
npx prisma db push
npm run seed
pm2 start ecosystem.config.cjs
# Access: http://localhost:3000
# Demo: http://localhost:3000?demo=true
```

## Gamification System
- XP earned from assignments, streaks, tutor sessions
- Virtual coins for game store purchases
- Rank tiers: Bronze → Silver → Gold → Platinum → Diamond
- Achievement badges (15+ types)
- Teacher-controlled game access per classroom
- Interactive mini-games (Math Blaster, Word Quest, Trivia)

## Pending / Future
- Production deployment to Cloudflare Pages
- Real-time WebSocket notifications
- Advanced AI model fine-tuning
- Student portfolio system
- Parent-teacher video conferencing
- Multi-language support

**Last Updated**: 2026-03-01
