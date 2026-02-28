# Limud - AI-Powered Adaptive Learning Platform

## Project Overview
- **Name**: Limud
- **Version**: 4.1.2
- **Goal**: Transform education with AI-powered adaptive learning, gamification, and personalized insights
- **Stack**: Next.js 14.2 + React 18 + TypeScript + Tailwind CSS + Prisma + PostgreSQL + OpenAI
- **GitHub**: https://github.com/Fansist/Limud

## Live URLs
- **Development**: https://3000-ifjkeor7fvbg89k4c63pq-cc2fbc16.sandbox.novita.ai
- **Demo Mode**: Append `?demo=true` to any route
- **Onboarding/Payment**: `/onboard` (public, no auth needed)

## Recent Changes (v4.1.2 - 2026-02-28)

### Landing Page Button Fixes
1. **Fixed: Hydration mismatch breaking all buttons on landing page**
   - **Root cause**: `FloatingParticles` component used `Math.random()` during render, producing different values on server vs client. This caused React hydration to fail, which broke event handler attachment for all interactive elements (buttons, links, accordion, scroll-to-top).
   - **Fix**: Deferred random value generation to a `useEffect` (client-only), preventing SSR/client mismatch.

2. **Fixed: Navigation anchor links not scrolling to sections**
   - **Root cause**: Standard `<a href="#section">` links may not smooth-scroll reliably in Next.js SPA context.
   - **Fix**: Added explicit `scrollToSection()` handler using `scrollIntoView({ behavior: 'smooth' })` for all nav links (desktop, mobile, hero CTA, footer CTA).

3. **Fixed: Sections hidden behind fixed navbar when scrolling to anchor**
   - **Fix**: Added `scroll-margin-top: 80px` to all `[id]` elements in `globals.css` and enabled `scroll-behavior: smooth` on `:root`.

### Previous Fixes (v4.1.1)
1. **Fixed: Runtime TypeError "Cannot read properties of undefined (reading 'call')"**
   - **Root cause**: Next.js 15.5.2 was paired with React 18.3.1 (incompatible - Next.js 15 requires React 19)
   - **Fix**: Downgraded to Next.js 14.2.21 which is fully compatible with React 18
   - Updated `next.config.js` for Next.js 14 compatibility (`serverComponentsExternalPackages` in `experimental`)

2. **Fixed: Service Worker "Response body is already used" error**
   - **Root cause**: `sw.js` was consuming response body then trying to clone it
   - **Fix**: Clone request before fetch, wrap `response.clone()` in try-catch, bumped cache to `limud-v3`

3. **Fixed: Quiz Generator "[object Object] is not valid JSON" error**
   - **Root cause**: API returned `questions` as already-parsed array, client called `JSON.parse()` on it
   - **Fix**: Added `safeParseQuestions()` helper that handles both string and array formats

4. **Fixed: Favicon 500 errors**
   - **Root cause**: Duplicate `favicon.ico` in both `public/` and `src/app/` caused conflict
   - **Fix**: Removed `src/app/favicon.ico`, keeping only `public/favicon.ico`

5. **Fixed: Missing Suspense boundaries for `useSearchParams()`**
   - Added `layout.tsx` with `<Suspense>` wrappers for 16+ pages missing them

6. **Fixed: `callOpenAI` Object.assign hack**
   - Removed fragile `Object.assign(content, { content })` pattern, now returns plain string

7. **Fixed: `next.config.js` deprecated `images.domains`**
   - Replaced with `images.remotePatterns` for proper configuration

8. **AI Model updated**: Using `gpt-4o-mini` with configurable `OPENAI_BASE_URL` support

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
| Game Store | `/student/games` | Buy games with XP, play educational games |
| Certificates | `/student/certificates` | Achievement certificates |

### Teacher Features
| Feature | Route | Status | Description |
|---------|-------|--------|-------------|
| Dashboard | `/teacher/dashboard` | ✅ Working | Class overview, at-risk students, pending grading |
| Assignments | `/teacher/assignments` | ✅ Working | Create, manage, view submissions with file downloads |
| AI Grading | `/teacher/grading` | ✅ Working | AI auto-grade + batch grade + file attachment view |
| Intelligence | `/teacher/intelligence` | ✅ Working | Class mastery, weakest skills, engagement, risk alerts |
| Quiz Generator | `/teacher/quiz-generator` | ✅ Working | AI-powered quiz/worksheet creation |
| Lesson Planner | `/teacher/lesson-planner` | ✅ Working | AI lesson plan generation |
| Insights | `/teacher/insights` | ✅ Working | Heatmap & analytics |
| Analytics | `/teacher/analytics` | ✅ Working | Detailed performance analytics |
| Reports | `/teacher/reports` | ✅ Working | Student report generation |
| Students | `/teacher/students` | ✅ Working | Student management |
| Game Control | `/teacher/games` | ✅ Working | Toggle game access per classroom |

### Admin/District Features
| Feature | Route | Description |
|---------|-------|-------------|
| Dashboard | `/admin/dashboard` | District overview, capacity, quick actions |
| Student Accounts | `/admin/students` | Create students with full personal info, auto-create 2 parent accounts |
| Schools | `/admin/schools` | Create/manage schools, transfer users between schools |
| Classrooms | `/admin/classrooms` | Create classes, assign students, toggle game access |
| Bulk Import | `/admin/provision` | CSV bulk import for students & teachers |
| Billing | `/admin/payments` | Plan management, payment history, upgrades |

### Payment & Onboarding
| Feature | Route | Description |
|---------|-------|-------------|
| District Onboarding | `/onboard` | 4-step flow - Plan selection, district info, admin account, payment |
| Pricing Tiers | - | Starter ($5/student), Standard ($8), Premium ($12), Enterprise ($15) |

### Gamification System
- XP rewards for assignments (25-100 XP), tutor sessions (15 XP), streaks (75-300 XP)
- Virtual coins for purchases (avatars, themes)
- Game Store: Students spend XP to buy educational games
- Teacher Game Control: Disable games per classroom during class time
- 5 rank tiers: Bronze, Silver, Gold, Platinum, Diamond

### File Upload System
- Students upload PDF, DOC, DOCX, PPT, images, ZIP (max 10MB each)
- Multiple files per submission
- Teachers view and download student attachments
- Base64 storage with proper MIME type handling

### AI Components
| AI Feature | Status | Description |
|---|---|---|
| AI Tutor | ✅ Working | Socratic tutoring with OpenAI fallback to demo |
| AI Grading | ✅ Working | Auto-grade submissions with rubric analysis |
| Quiz Generator | ✅ Working | AI-generated quizzes with subject/grade targeting |
| Lesson Planner | ✅ Working | AI lesson plan generation with standards alignment |
| Math Solver | ✅ Working | Step-by-step validation with error detection |
| Writing Coach | ✅ Working | Essay analysis with readability scoring |
| Explain My Mistake | ✅ Working | 5 explanation styles for past errors |
| Study Next | ✅ Working | AI-recommended next study action |

## API Routes Summary
Total: 52+ API routes across 8 domains

### Key API Routes
- `GET/POST/PUT /api/games` - Game store, purchases, teacher control
- `GET/POST/DELETE /api/files` - File upload/download system
- `GET/POST /api/payments` - Payment processing & onboarding
- `GET/POST/PUT/DELETE /api/district/students` - Student CRUD with auto-parents
- `GET/POST /api/district/teachers` - Teacher account management
- `GET/POST/PUT/DELETE /api/district/schools` - School management
- `GET/POST/PUT/DELETE /api/district/classrooms` - Classroom management
- `GET/POST/PUT /api/district/access` - Multi-level access control
- `POST /api/grade` - AI grading (single + batch)
- `GET/POST/DELETE /api/quiz-generator` - AI quiz generation
- `GET/POST/PUT/DELETE /api/lesson-plans` - AI lesson planning
- `POST /api/tutor` - AI tutor chat

## Data Architecture
- **Database**: PostgreSQL with Prisma ORM
- **Models**: 40+ Prisma models
- **Auth**: NextAuth.js with JWT + credentials provider
- **AI**: OpenAI gpt-4o-mini with configurable base URL and graceful demo fallback

## Environment Variables
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/limud"
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-secret-key"
OPENAI_API_KEY="your-openai-key"
OPENAI_BASE_URL="https://api.openai.com/v1"  # Optional: custom OpenAI-compatible endpoint
```

## Tech Stack
- Next.js 14.2.21 (App Router, RSC)
- React 18.3.1 + TypeScript 5
- Tailwind CSS 3 + Framer Motion
- Prisma + PostgreSQL
- NextAuth.js 4
- OpenAI API (gpt-4o-mini)
- PM2 for process management

## Development
```bash
# Install dependencies
npm install

# Set up database
npx prisma db push
npx tsx prisma/seed.ts

# Start dev server
pm2 start ecosystem.config.cjs

# Access at http://localhost:3000
# Demo mode: http://localhost:3000/teacher/dashboard?demo=true
```

## Pending / Not Yet Implemented
- Forgot password feature
- Student/Admin AI features (currently only teacher AI is fixed)
- Production build optimization (build exceeds sandbox memory/time limits)
- Cloudflare Pages deployment configuration

## Last Updated: 2026-02-28
