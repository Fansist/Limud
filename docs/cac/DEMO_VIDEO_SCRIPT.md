# Limud — Congressional App Challenge 2026 Demo Video Script

> **How to use this:** Paste this entire script into Claude (or your video tool) to generate the video, OR record it yourself screen-by-screen. Every scene lists the **real Limud screen** to show, the **exact words to say** (voiceover), and the **timing**. Total runtime ≈ **2:52** (CAC limit is 3:00). Capture the real screens as B-roll — the app is live on Render.
>
> **Before you record, replace `[YOUR NAME]`** (and add teammates if any). Everything else is accurate to the shipped app — don't add features that aren't shown here.

**Angle:** *The AI tutor that refuses to cheat — Socratic by design, private by law.*
**Voice:** calm, confident, real. You're a student who built this because you needed it — not a corporate ad.

---

## AT-A-GLANCE (required CAC elements — all are spoken/shown below)
- **Participant:** [YOUR NAME] — *(Scene 3)*
- **App name:** Limud — *(Scene 1 title card + Scene 3)*
- **One-sentence purpose:** *"Limud rewrites every lesson for how each individual student actually learns — and its AI tutor guides students to answers instead of handing them over."* — *(Scene 3)*
- **Target audience:** K‑12 students, their teachers and parents, and school districts — *(Scene 3)*
- **Tools / languages:** TypeScript, React, Next.js 14, Prisma + PostgreSQL, NextAuth, Tailwind CSS, Google Gemini 2.5 Flash, deployed on Render — *(Scene 3 + Scene 8)*
- **Code explained on camera:** the tutor's system prompt + the security architecture — *(Scene 8)*

---

## SCENE 1 — COLD OPEN: "refuses to cheat" (0:00 – 0:15)
**SCREEN:** The student **AI Tutor** chat (`/student/tutor`). A math problem is on screen.
**ON-SCREEN ACTION:** A student types into the tutor: **"just give me the answer to x² + 5x + 6 = 0"** and hits enter. The tutor replies (real behavior) with a *guiding question*, not the answer — e.g. *"Great problem! Before I give anything away — what two numbers multiply to 6 and add to 5? Try that and tell me what you get."*
**VOICEOVER:**
> "Watch what happens when a student asks my app to just do their homework for them."
> *(beat as the tutor responds)*
> "It won't. It's built to teach — not to cheat."

`⏱ 0:15   (cumulative 0:15)`

---

## SCENE 2 — THE PROBLEM (0:15 – 0:35)
**SCREEN:** Quick, cuts: a generic AI chatbot spitting out a full answer → a one-size-fits-all textbook page → a frustrated student. (Use simple stock/B-roll or slides.)
**VOICEOVER:**
> "Every student's brain is wired differently — but school hands everyone the same page, and the new AI tools just hand over the answer. One kills curiosity. The other kills learning. I wanted the opposite: something that meets each student where they are, and makes them *think*."

`⏱ 0:20   (cumulative 0:35)`

---

## SCENE 3 — TITLE + WHO/WHAT (0:35 – 0:51)
**SCREEN:** Limud logo/title card, then the **landing page** (`limud.co`) scrolling the hero.
**ON-SCREEN TEXT (lower third):** *"[YOUR NAME] · Limud · TypeScript · Next.js · Prisma · Google Gemini"*
**VOICEOVER:**
> "I'm [YOUR NAME], and this is **Limud**. Limud rewrites every lesson for how each individual student actually learns — and its AI tutor guides them to the answer instead of giving it away. It's for K‑12 students, their teachers and parents, and whole school districts. I built it in TypeScript with Next.js, Prisma, and Google's Gemini model."

`⏱ 0:16   (cumulative 0:51)`

---

## SCENE 4 — ADAPTIVE REWRITE ("Learning DNA") (0:51 – 1:10)
**SCREEN:** Student **dashboard** (`/student/dashboard`) showing the learner's profile/learning style, then a **material** (`/student/materials/[id]`) that has been rewritten for that student.
**ON-SCREEN ACTION:** Show the same lesson looking different for an "auditory" vs a "visual" learner (toggle or two windows).
**VOICEOVER:**
> "When a teacher posts one assignment, Limud rewrites it for every student — same facts, same standards, but in the format that fits how that kid learns. The teacher writes it once; thirty students each get their own doorway in."

`⏱ 0:19   (cumulative 1:10)`

---

## SCENE 5 — THE SOCRATIC TUTOR, UP CLOSE (1:10 – 1:32)
**SCREEN:** Back in the **AI Tutor** (`/student/tutor`). Show a short real back-and-forth where the student works toward the answer *with* the tutor.
**ON-SCREEN ACTION:** Student answers the guiding question ("2 and 3?") → tutor confirms and nudges to the next step → student reaches the solution themselves. Optionally show it referencing something personal (a hobby from the survey).
**VOICEOVER:**
> "This is the heart of it. The tutor asks, hints, and celebrates progress — and it even personalizes the examples using what each student told us they love. The student gets to the answer, but *they* do the thinking. That's the whole point."

`⏱ 0:22   (cumulative 1:32)`

---

## SCENE 6 — MORE OF THE STUDENT TOOLKIT (1:32 – 1:48)
**SCREEN:** Fast montage of real screens: **Focus Mode** (`/student/focus`), **Exam Simulator** (`/student/exam-sim`), **Spaced-Repetition Review** (`/student/review`).
**VOICEOVER:**
> "There's a distraction-free Focus Mode, a full exam simulator, and a spaced-repetition review system that schedules exactly what you're about to forget — so studying is smart, not just long."

`⏱ 0:16   (cumulative 1:48)`

---

## SCENE 7 — ONE ACTION, EVERY ROLE (teacher + parent) (1:48 – 2:10)
**SCREEN:** **Teacher AI feedback / grading** (`/teacher/ai-feedback`) auto-grading a submission → **Teacher analytics** (`/teacher/analytics`) → **Parent report** (`/parent/reports` or `/parent/dashboard`).
**VOICEOVER:**
> "It's not just for students. Teachers get AI-assisted grading and class analytics; parents get plain-English progress reports and alerts. One student action updates the student's view, the teacher's dashboard, and the parent's report at the same time — one shared brain behind all of it."

`⏱ 0:22   (cumulative 2:10)`

---

## SCENE 8 — UNDER THE HOOD: CODE + SECURITY (2:10 – 2:40)
**SCREEN:** Split or cut between the **code editor** and the app.
**ON-SCREEN ACTION:**
- Show `src/lib/ai.ts` with the highlighted line:
  `1. NEVER give direct answers. Instead, guide students through the problem-solving process with hints, questions, and encouragement.`
- Then flash the security surface: the **admin security page** (`/admin/security`) and/or the code for role-based access + encryption.
**VOICEOVER:**
> "The 'no cheating' rule isn't a filter I bolted on — it's the tutor's core instruction, right here in the code: *never give direct answers; guide with questions.*
> And because this holds real student data, I engineered it like it matters: role-based access control on every request, two-factor login, and AES‑256 encryption on personal data with FERPA-style district isolation. Socratic by design, private by law."

`⏱ 0:30   (cumulative 2:40)`

---

## SCENE 9 — IMPACT + CLOSE (2:40 – 2:52)
**SCREEN:** Return to the student dashboard, then the Limud logo with the tagline *"Every mind learns differently. Limud teaches that way."*
**VOICEOVER:**
> "Limud is over a hundred screens of a real, working platform — built by one student who was tired of choosing between learning nothing and cheating. If it can teach the way *you* learn, imagine what it does for a whole classroom. This is Limud. Thanks for watching."

`⏱ 0:12   (cumulative 2:52)`

---

### AI-USE DISCLOSURE (say a version of this on camera in Scene 8, and write it in the submission form)
> "Google's Gemini model powers the tutoring, grading, and content rewrites. Everything else — the accounts and two-factor login, the role-based permissions, the encryption, the spaced-repetition scheduling, the database, and all 100-plus screens — I designed and coded myself. AI is a component inside Limud, not the thing that built it."

### RECORDING TIPS
- Record the app at 1080p+, in a **normal (non-reduced-motion)** browser so the animations play. (Reduced-motion is fully supported and safe — it just won't show the entrance motion on camera.)
- Keep your face-cam optional; the screen recording is the star.
- Speak ~10% slower than feels natural. The timings above assume a calm pace.
- Publish to YouTube (unlisted is fine to start, then public for submission).
