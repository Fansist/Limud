<p align="center">
  <img src="public/logo.svg" alt="Limud" width="96" />
</p>

<p align="center">
  <strong>Limud</strong> · <em>Every Mind Learns Differently.</em>
</p>

<p align="center">
  An AI-powered adaptive learning platform for U.S. K–12.
  Built so the kid in row three who learns by drawing,
  the kid who needs to argue with the material,
  and the kid who needs to slow down — all get taught the way they actually learn.
</p>

<p align="center">
  Built for districts and families. Same engine, same outcomes, every tier.
</p>

<p align="center">
  <code>v14.7.0 · Update 3.7 · Deferred-list cleanup: pagination, loading, error wraps, log polish</code>
</p>

---

## What Limud is

Most classrooms teach one way. Most students don't learn that way.

NAEP 2024: only **33%** of 8th graders are proficient in reading, **26%** in math.
12th-grade math hit a **historic low (22%)**. Gallup 2024: **52%** of K–12 teachers
report burnout, up from 44%. The system isn't failing because teachers are bad —
it's failing because there is exactly one teacher per ~28 different minds.

Limud is the second teacher in the room. It notices which student didn't get it,
figures out *why*, and re-teaches it the way that specific student needs — using
the things that specific student actually cares about.

---

## The big idea: Two uploads, not one

This is what makes Limud different from every other ed-tech tool.
When a teacher posts a unit, they upload **two separate things**:

| | What it is | Same for every student? |
|---|---|---|
| **Assignment** | The graded artifact — questions, rubric, due date | **Yes.** Fairness in evaluation is non-negotiable. |
| **Material** | The teaching content — the chapter, the explanation, the lecture | **No.** The AI rewrites it per student based on learning style + interests. |

### Concrete example

Teacher uploads a dry textbook chapter on *the French Revolution*. Same upload, three students:

- **Maya** — visual learner, loves Marvel comics → renders as a panel-by-panel **comic-book script** with characters, dialogue, sound effects, and the same key dates (1789 Bastille, 1793 Terror, 1799 Napoleon) embedded in the panels.
- **Diego** — auditory learner, loves rap → renders as a **lyrical breakdown** with rhyming stanzas. Every key figure and event appears in the lyrics, not as footnotes.
- **Priya** — kinesthetic learner, loves cooking → renders as a **hands-on step-by-step** "kitchen revolution" — Estates-General, Bastille, Terror — mapped to steps in a recipe.

Same facts. Same dates. Same final assignment. Three different ways in.

The point is not gimmicky decoration — it's that **engagement is the prerequisite for learning, and engagement is personal.**

---

## The engine: Detect → Personalize → Intervene

Everything in Limud serves this three-step loop.

1. **Detect** — every interaction (assignment, quiz, exam-sim, tutor chat,
   time-on-task, where they re-read, where they gave up) feeds a per-student
   knowledge graph. Each topic has a mastery score with a confidence interval.
   We also detect *how* the student fails: conceptual gap, careless error,
   prerequisite missing, reading barrier, anxiety, disengagement.

2. **Personalize** — the per-student Material rewrite is the headline output,
   but personalization runs through every surface: pacing, modality, depth,
   tone, scaffolding, examples, and the AI tutor's analogy library.

3. **Intervene** — when the model is confident a student is falling behind,
   it acts: AI tutor opens proactively, teacher gets a flag in their dashboard,
   parent gets a weekly summary, the student gets a tailored mini-lesson.
   No student silently drowns.

---

## What it feels like to use

### As a student
Calm. Personal. The material doesn't look like the boring textbook everyone
else has — it looks like something made for them, because it was. Wins are
visible. Slumps are met with help, not shame. The AI tutor talks like a patient
older sibling, not a textbook.

### As a teacher
A pair of extra hands. Upload the unit once and the AI handles 28 different
versions of the reading. The dashboard surfaces the 3 students who need them
today instead of a wall of 28 names. AI drafts feedback they edit. Grading
stays uniform — the teacher's authority over what counts as mastery is intact.

### As a parent
Transparent. They see what's happening without having to interrogate their kid
at dinner. Concerns surface before the report card, not after. They can read
the same personalized version their kid is reading, so help-with-homework
actually works.

### As a district admin
Every classroom rolled up into one view. Equity gaps surface. Curriculum
fidelity is auditable — the original Material and every personalized render
are recorded.

---

## Pages by role

### Student
- **/student/dashboard** — today's focus, what to work on next
- **/student/coursework** — *new in 3.2* — unified hub: Materials and Assignments tabs side-by-side
- **/student/materials** — *new in 3.0* — every chapter, rewritten in your style
- **/student/materials/[id]** — the personalized reader (comic / story / rap / etc.)
- **/student/assignments** — graded work, uniform across the class
- **/student/classrooms** — your classes
- **/student/grades** — per-course breakdown with trend
- **/student/exam-sim** — timed practice with AI-generated questions
- **/student/tutor** — Socratic AI tutor (your interests baked in)
- **/student/knowledge** — mastery heatmap by topic and time
- **/student/growth** — over-time trajectory
- **/student/review** — spaced-repetition review queue
- **/student/focus** — distraction-free study mode
- **/student/study-planner**, **/study-groups**, **/forums**, **/messages**, **/survey**

### Teacher
- **/teacher/dashboard** — class-wide intelligence, students who need attention today
- **/teacher/coursework** — *new in 3.2* — unified hub: Materials + Assignments in one place, with the running count of how many personalized renders the AI has produced across the class
- **/teacher/materials** — *new in 3.0* — upload teaching content, AI rewrites per student
- **/teacher/materials/[id]** — *new in 3.2* — viewer that shows the original chapter side-by-side with every personalized render across the class. Click any student to read exactly what they saw — the comic-script, the rap, the step-by-step, whatever the AI built for them
- **/teacher/assignments** — uniform graded artifacts
- **/teacher/ai-builder** — AI-drafted differentiated assignment variants
- **/teacher/ai-feedback** — AI grades + feedback (single + bulk)
- **/teacher/quiz-generator**, **/lesson-planner**, **/worksheets**
- **/teacher/grading**, **/students**, **/classrooms**, **/analytics**, **/intelligence**
- **/teacher/insights**, **/learning-insights** — class- and per-student adaptive views
- **/teacher/exchange** — peer-shared resources
- **/teacher/forums**, **/messages**, **/onboarding**, **/reports**

### Parent
- **/parent/dashboard** — every child at a glance
- **/parent/children** — per-child deep-dive (grades, materials, flags)
- **/parent/reports** — weekly digest
- **/parent/messages**

### Admin / District
- **/admin/dashboard** — district-wide rollups
- **/admin/students**, **/employees**, **/classrooms**, **/schools**
- **/admin/analytics**, **/audit**, **/security**, **/settings**
- **/admin/announcements**, **/payments**, **/provision**, **/link-requests**

### Public
- **/** — landing
- **/login**, **/register**, **/onboard**, **/demo**, **/forgot-password**, **/reset-password**
- **/pricing**, **/help**, **/roadmap**
- **/about**, **/contact**, **/privacy**, **/terms**, **/accessibility**

---

## The visual language

Calm, modern, education-grade. Friendly, not gamey.

- **Primary** — Tailwind blue (`#2563eb`). Optional green theme override (`html.theme-green`) for districts that prefer emerald.
- **Accent** — Fuchsia (`#c026d3`). Used sparingly, almost always paired with primary in a gradient for hero text and the FAB.
- **Type** — Inter (300–900). Accessibility fallback: OpenDyslexic (`body.dyslexia-font`).
- **Shape** — `rounded-2xl` for cards, `rounded-xl` for buttons and inputs, `rounded-full` for badges and pills.
- **Surfaces** — White cards with `shadow-sm` (hover `shadow-md`). Mesh gradients on hero/empty surfaces. No glassmorphism on every panel.
- **Motion** — Framer Motion. Short and purposeful — `fade-in`, `slide-up`, `scale-in`. Nothing wobbles unless celebrating a real win.
- **Accessibility** — built-in: dark mode (`html.dark`), high-contrast mode (`body.high-contrast`), dyslexia-font mode, 44px minimum touch targets on coarse pointers, focus rings on every interactive surface, `scroll-margin-top` so anchors don't hide behind the navbar.

The visual brief lives in `tailwind.config.js` and `src/app/globals.css` as the source of truth — copy them verbatim if you build a new surface.

---

## Who Limud is for

Limud has two first-class audiences. Neither is the lead. Neither is an
afterthought. Same engine, same AI, same outcomes — the difference is
capacity, controls, and integrations.

- **Districts** — multi-school deployments with SSO/SAML, district-wide
  analytics, custom AI training, FERPA/COPPA-grade audit logging, bulk
  provisioning, and dedicated account management. Per-seat pricing
  scales from a single school ($2/student/month annual) up through
  statewide deployments. Schools and co-ops are on the same paid track,
  with smaller seat counts.

- **Families** — parents of K–12 kids running a single parent account
  with up to 5 children, free. The kids can be in a regular district
  school, homeschooled, or learning independently — Limud doesn't
  treat any of those as primary. Optional **Family Teaching Mode**
  unlocks the full teacher toolkit (assignment authoring, AI grading,
  materials upload, AI Check-In) on the same parent account, for
  parents who teach at home full-time or supplementally.

The free Family tier is **not a homeschool-only or solo-learner
product**. It's a real product, in production, that families with kids
in any school setting can use. The paid District/School tiers are
**not "free with extra controls"** — they're the actual commercial
heart of the business, with capabilities (SSO, district analytics,
custom AI training, dedicated support) that families don't need.

Read those again. We mean both.

## Local development & demo mode

Every feature in Limud works *without a database* via demo mode — useful
for local development, screenshots, and prospect walkthroughs but **not the
front door of the product**. The user-facing demo CTAs were retired in
v3.1; demo accounts are still reachable by signing in directly with
`erez.ofer4@gmail.com` or by appending `?demo=true` to any URL during local
development. Demo seed data lives in `src/lib/demo-data.ts`. Cross-role
state lives in `localStorage` via `src/lib/demo-state.ts`.

`FORCE_DEMO=true` in the environment forces demo for every account — used
as a safety net during live presentations or when an AI key isn't
available.

---

## How AI is wired

All AI calls go through one file: `src/lib/ai.ts`. Routes never call Gemini
directly. Public exports include:

- `personalizeMaterial(input)` — *new in 3.0, extended in 3.3* — the
  two-upload engine. Picks format from learning style + interests, builds
  the prompt, calls Gemini, returns `{ content, format, interestsUsed,
  aiGenerated, aiError? }`. **For comic-book format, also generates
  real panel illustrations** via Gemini's image model and inlines them as
  markdown images in the returned content.
- `generateImage(prompt, opts?)` — *new in 3.3* — single-shot image
  generation via Gemini's image-capable model
  (`gemini-2.5-flash-image-preview` by default; override with
  `GEMINI_IMAGE_MODEL`). Returns a base64 data URL or `{ error }`.
- `enrichComicWithImages(script, title)` — *new in 3.3* — parses a comic
  script for `PANEL N` blocks, generates an illustration per panel
  (parallel, concurrency-limited), injects them as markdown images above
  each panel heading. Capped at `LIMUD_COMIC_IMAGE_LIMIT` panels (default
  6). Set `LIMUD_COMIC_IMAGES=false` to disable entirely.
- `chatWithTutor(messages, subject?, surveyData?)` — Socratic tutor with
  per-student personalization built in.
- `gradeSubmission(content, description, rubric, maxScore)` — AI grading,
  with prompt-injection guard.
- `generateStudentReport(studentData)`, `analyzeCurriculum(classData)`,
  `analyzeWriting(content, gradeLevel, type)`.

Resilience is built in:

- **Model fallback chain** — `gemini-2.5-flash` → `2.0-flash` → `1.5-flash`
  → `flash-latest`. The first model your API key supports is memoized for
  the rest of the session. Older keys keep working.
- **Error classification** — `model_not_available` retries the next model;
  `auth`, `quota`, `safety`, `billing` fail loud and surface to operators
  via `/api/ai-status`.
- **Visible failures** — every AI function returns `aiGenerated` and
  `aiError`. The UI shows an "AI offline" badge instead of silently
  swapping in fake content. **No student is ever told they got an AI
  answer when they didn't.**
- **Personalized cache** — `PersonalizedMaterial` rows cache the AI
  rewrite per `(material, student)` pair. Re-reads are instant; we don't
  re-spend tokens on every page view.

---

## Gamification — dormant in 3.1

Earlier versions surfaced XP, levels, daily streaks, virtual coins,
badges, and a Game Store. As of **v14.1.0 (Update 3.1)** all of that is
**removed from the user-facing experience.** The reasoning is that
points-style gamification is decoupled from real learning, can punish
students with broken streaks, and clutters the calm, parent-trustable
surface Limud is meant to be.

The underlying `RewardStats` Prisma model is preserved for historical
data continuity, but no UI reads it. A **clean infrastructure module**
lives at `src/lib/gamification/` (types, pure policies, dormant service
stub) ready for a future, recognition-first rebuild — see
[`src/lib/gamification/README.md`](./src/lib/gamification/README.md) for
the design principles. Nothing in `src/app/**` imports from it today.

---

## Non-negotiables

- **FERPA-compliant.** Student data never trains third-party models.
- **Uniform assessment.** Personalization happens on the *teaching* side, never on the *grading* side. Every kid is measured against the same bar.
- **The teacher remains the authority.** Limud assists; it does not replace.
- **Production presents as a real product, not a demo.** Demo mode exists for prospects and local development, but the public surface (landing, pricing, login, README) leads with the real product.
- **Demo mode still works for prospects** without a database — every feature has a demo path.
- **Districts and families are both first-class.** Limud is for districts AND families — neither is the lead. Avoid copy that puts one ahead of the other ("family-first," "district-led," "scales up to districts"). Same product, same engine, same outcomes. Pricing scales with size.
- **AI failures are visible.** We never silently fall back to fake content and pretend it was real.
- **README stays current.** Every meaningful update revises this file in the same commit. Skip the README only for trivial bug fixes that don't change product behavior.
- **No `any`. No `@ts-ignore`. No `prisma migrate`** (Limud uses `prisma db push`).
- **All AI calls go through `src/lib/ai.ts`.**

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | **Next.js 14** (App Router) |
| Language | **TypeScript** (strict) |
| Database | **PostgreSQL** via **Prisma 5.22** |
| Auth | **NextAuth.js** (JWT) |
| AI | **Google Gemini** via `@google/genai` (paid) — model fallback chain |
| Styling | **Tailwind 3.4** + custom design tokens (`tailwind.config.js`) |
| Animation | **Framer Motion 11** |
| Icons | **lucide-react** (only) |
| Charts | **Recharts** |
| Notifications | **react-hot-toast** |
| Email | **Resend** |
| PDF | **jsPDF** |
| State | **Zustand** + React Server Components |
| Validation | **Zod** |

---

## Project layout (the parts that matter)

```
src/
├── app/
│   ├── (auth)/          # login, register, onboard, demo
│   ├── (legal)/         # about, contact, privacy, terms, accessibility
│   ├── student/         # 17 student pages incl. /materials & /materials/[id]
│   ├── teacher/         # 20 teacher pages incl. /materials
│   ├── parent/          # 4 parent pages
│   ├── admin/           # 13 admin pages
│   └── api/
│       ├── student/materials/         # NEW: list + personalized GET
│       ├── teacher/materials/         # NEW: CRUD
│       └── …~88 routes total
├── components/
│   ├── layout/DashboardLayout.tsx     # role-aware shell
│   └── …
├── lib/
│   ├── ai.ts            # the only place that talks to Gemini
│   ├── auth.ts          # NextAuth config + master-demo gates
│   ├── db.ts            # Prisma client
│   ├── demo-data.ts     # static demo seeds (incl. DEMO_MATERIALS)
│   ├── demo-state.ts    # localStorage cross-role state
│   ├── hooks.ts         # useIsDemo, useNeedsDemoParam
│   ├── middleware.ts    # role gates, auth guards
│   └── constants.ts     # SUBJECTS, GRADE_LEVELS
└── prisma/
    └── schema.prisma    # 71 models (Material + PersonalizedMaterial new in 3.0)
```

---

## Contributing

Engineering process is documented in `ROLES-GUIDE.md`. Every meaningful
change goes through the `/work` or `/pwork` orchestrator with explicit roles
(RESEARCHER → ARCHITECT → CODER → TESTER → REVIEWER → WRITER). The slash
commands are project-level — they live in `.claude/commands/` and travel
with the repo.

Operator instructions (deployment to Render / cPanel, environment variables,
CI hooks, database operations) live in **`LIMUD-DEVELOPER-GUIDE.txt`**.
History of every release lives in **`CHANGELOG.md`** — read those before
proposing infra changes.

---

## License

Proprietary. All rights reserved.

---

<p align="center">
  <em>If a student isn't learning, it's not the student's fault.</em><br/>
  <em>It's our job to find the doorway in.</em>
</p>
