# Limud — Technical Writeup (for CAC judges: Code Quality + Function)

## What it is
Limud is a production, multi-role EdTech platform (deployed live on Render) that adapts lessons per student and runs a Socratic AI tutor. It is not a prototype — it is a large, working codebase.

## Scale (measured, not estimated)
| Metric | Count |
|---|---|
| Page routes (screens) | **102** |
| API route handlers | **126** |
| Database models (Prisma) | **81** |
| Lines of TypeScript / TSX | **~85,400** |
| User roles | **5** (student, teacher, parent, admin, owner) |

## Architecture
- **Framework:** Next.js 14 (App Router, React Server + Client Components), TypeScript in strict mode.
- **Data:** Prisma ORM over PostgreSQL; 81 models covering users, districts, courses, enrollments, assignments, submissions, tutor logs, spaced-repetition state, subscriptions, audit logs, and more.
- **Auth:** NextAuth (JWT sessions) with a custom credentials flow, bcrypt password hashing, brute-force lockout, and an email-based two-factor challenge for the owner role.
- **AI:** Google Gemini 2.5 Flash, wrapped in a hardened service layer (`src/lib/ai.ts`) with demo-mode fallback so the app never hard-crashes when the AI is unavailable.
- **UI:** Tailwind CSS with a custom design system (layered elevation, motion tokens, reduced-motion support).
- **Deploy:** Render, with a hardened build that runs database migrations and provisions the owner account on every deploy.

### The "shared-state" design
One data model backs all five roles. When a teacher grades a submission, the same event surfaces in the student's dashboard, the parent's report, and the admin's analytics — no duplicated sources of truth. Multi-tenancy is enforced by **district isolation**: queries are scoped so School District A can never read District B's data (FERPA-aligned).

### How the "Socratic tutor" is enforced in code
The anti-cheat behavior isn't a content filter bolted on top — it's the tutor's core system prompt in `src/lib/ai.ts`:

> *"You are Limud AI… 1. NEVER give direct answers. Instead, guide students through the problem-solving process with hints, questions, and encouragement."*

The tutor endpoint (`/api/tutor`) authenticates the user, checks a paid-product entitlement, personalizes the prompt from the student's onboarding survey (learning style, interests), stores the conversation, and calls Gemini with that system prompt — all with best-effort database fallbacks so a DB hiccup degrades gracefully instead of crashing.

## AI-use disclosure (honest split)
**What the AI (Gemini) does:**
- Generates Socratic tutor replies
- Drafts teacher feedback / auto-grading suggestions
- Rewrites lesson material per learning style
- Powers standalone study tools (math solver, essay coach, flashcards, etc.)

**What we engineered ourselves (not AI):**
- Authentication, JWT sessions, two-factor login, brute-force lockout
- Role-based access-control middleware on every API route
- AES-256-GCM field-level encryption for personal data (key independent of the auth secret)
- SM-2 spaced-repetition scheduling algorithm
- The entitlement / subscription / billing system
- The 81-model relational data schema and all 126 API endpoints
- All 102 screens, the design system, and the reduced-motion accessibility layer

**Conclusion:** AI is one component among many. The platform's structure, security, and correctness are hand-built engineering.

## Code quality practices
- TypeScript strict mode across the codebase.
- Centralized middleware (`apiHandler`, `requireAuth`) so every endpoint shares auth, rate limiting, and error handling.
- Input fencing/sanitization for anything that reaches an AI prompt (defense against prompt injection).
- An adversarial self-audit pass before submission that found and fixed real issues (see `SECURITY_EXPLAINER.md`).
