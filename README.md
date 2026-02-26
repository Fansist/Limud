# Limud - AI-Powered Adaptive Learning Platform

## Project Overview
- **Name**: Limud
- **Version**: 3.0
- **Goal**: Transform education with AI-powered adaptive learning, gamification, and personalized insights
- **Stack**: Next.js 14 + React 18 + TypeScript + Tailwind CSS + Prisma + PostgreSQL + OpenAI

## Live URLs
- **Development**: https://3000-ifjkeor7fvbg89k4c63pq-cc2fbc16.sandbox.novita.ai
- **Demo Mode**: Append `?demo=true` to any route

## Completed Features

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
| Knowledge Dashboard | `/student/knowledge` | Radar chart, heatmap calendar, rank, goal countdown, DNA insights |
| Growth Analytics | `/student/growth` | Skill mastery by category, predicted grade, struggle detection |
| AI Tutor | `/student/tutor` | Multiple personalities, subject-aware, session tracking |
| Study Planner | `/student/study-planner` | Cognitive science-based scheduling, interleaved study |
| Exam Simulator | `/student/exam-sim` | Timed exams, AI feedback, strength/weakness analysis |
| Rewards | `/student/rewards` | XP, coins, avatar shop, badges, rank tiers (Bronze→Diamond) |
| Certificates | `/student/certificates` | Achievement certificates |
| Assignments | `/student/assignments` | View, submit, track pending/graded |

### Teacher Features
| Feature | Route | Description |
|---------|-------|-------------|
| Dashboard | `/teacher/dashboard` | Class overview, at-risk alerts, quick actions |
| Intelligence Suite | `/teacher/intelligence` | Class mastery, weakest skills, engagement scores, risk AI |
| AI Grading | `/teacher/grading` | AI-powered auto-grading with feedback |
| Quiz Generator | `/teacher/quiz-generator` | AI-generated quizzes by topic |
| Lesson Planner | `/teacher/lesson-planner` | AI lesson planning assistance |
| Insights & Heatmap | `/teacher/insights` | Misconception heatmaps, student analytics |
| Analytics | `/teacher/analytics` | Detailed performance analytics |

### Parent Features
| Feature | Route | Description |
|---------|-------|-------------|
| Dashboard | `/parent/dashboard` | Child overview, performance command center |
| Growth Reports | `/parent/reports` | Weekly reports, risk alerts, growth tracking |

### API Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/study-next` | GET | AI "What Should I Study Next?" recommendations |
| `/api/confidence` | GET/POST | Confidence-based scoring, lucky guess detection |
| `/api/daily-boost` | GET/POST | 5-min boost sessions, surprise rewards |
| `/api/focus` | GET/POST | Focus session tracking, XP rewards |
| `/api/mistakes/explain` | GET/POST | "Explain My Mistake" with style variation (simple/analogy/step-by-step/visual/eli5) |
| `/api/learning-dna` | GET | Learning DNA profile (speed, retention, modality, peak hours) |
| `/api/skills` | GET/POST | Skill mastery map, SM-2 spaced repetition |
| `/api/teacher/intelligence` | GET | Class mastery, weakest skills, engagement scores, risk detection |
| `/api/teacher/auto-assign` | POST | Auto-differentiated assignments (3 tiers) |

### Core Engines (Backend)
- **Learning DNA Engine**: Speed, accuracy, retention patterns, preferred modality, peak hours, attention span, subject strengths/weaknesses
- **Cognitive Science Engine**: SM-2 spaced repetition, adaptive difficulty (70-85% sweet spot), interleaved study, burnout detection
- **Gamification Engine**: XP rewards, streaks, coins, level-ups, avatar shop, rank tiers
- **Confidence Scoring**: Tracks confidence vs accuracy, detects lucky guesses, calculates true mastery

### Mobile-First UX
- Bottom navigation bar (5 key actions, thumb-friendly)
- Floating "Ask AI" button (students)
- 44px minimum tap targets on touch devices
- Safe area inset support (notched devices)
- Lite Mode toggle (auto-enabled on low-end devices)
- Dark mode with OLED optimization
- Responsive sidebar → bottom nav transition

### Data Architecture
- **Database**: PostgreSQL via Prisma ORM
- **Models**: 40+ models including User, Course, Assignment, Submission, SkillRecord, LearningDNA, FocusSession, ConfidenceRating, DailyBoost, etc.
- **Caching**: In-memory DNA cache (5min TTL), client-side fetch cache (30s TTL)
- **AI**: OpenAI GPT for tutoring, grading, explanations (with demo fallbacks)

### Engagement System
- **Rank Tiers**: Bronze (0 XP) → Silver (500) → Gold (1500) → Platinum (3000) → Diamond (6000)
- **XP Sources**: Assignments (+25-100), AI Tutor (+15), Daily Login (+10), Streaks (+75-300)
- **Surprise Rewards**: 15% chance of XP multiplier for consistent learners
- **Mastery Animations**: Particle bursts on skill mastery milestones
- **Goal Countdown**: Visual progress toward personal goals

## Deployment
- **Platform**: Next.js on PM2
- **Status**: ✅ Active (Development Mode)
- **Last Updated**: 2026-02-26

## Next Steps
- [ ] Production build optimization (code splitting analysis)
- [ ] School Marketplace (teacher resource selling)
- [ ] Academic Social Layer (study groups, peer challenges, leaderboards)
- [ ] Push notifications integration
- [ ] AI content moderation for social features
- [ ] Collaborative whiteboard
- [ ] Reading comprehension analyzer
- [ ] Smart seating plan generator
