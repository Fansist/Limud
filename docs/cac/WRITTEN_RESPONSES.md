# Limud — Congressional App Challenge 2026 Written Responses

> Draft answers for the official submission form. Replace `[YOUR NAME]` / team details. Keep them honest — everything here is true of the shipped app.

---

### 1. App name
**Limud** — Hebrew for "learning."

### 2. What does your app do? (purpose)
Limud is a full learning platform that **rewrites every lesson for how each individual student actually learns**, and pairs it with an **AI tutor that guides students to answers instead of handing them over**. A teacher writes one assignment; Limud adapts it per student, tracks understanding with spaced-repetition review and exam simulation, and keeps teachers and parents in the loop through shared dashboards. It supports five roles — student, teacher, parent, school admin, and owner — on one shared data model.

### 3. What inspired you to create this app?
Two frustrations, one idea. First: school hands thirty different brains the exact same page, and the students who don't click with that format get labeled "behind" when they just needed a different doorway in. Second: the new wave of AI "homework helpers" does the opposite harm — it hands over finished answers, so students pass the assignment and learn nothing. I wanted the one tool that refuses both failures: it meets each student in their own format, **and** it makes them do the thinking. That became Limud's whole identity — *the AI tutor that refuses to cheat.*

### 4. What was the hardest technical problem you faced, and how did you solve it?
Right before submission, the entire public site rendered **blank below the hero**, and the **login form was invisible** — but only for some visitors. It turned out to be a subtle server-side-rendering bug: my scroll-reveal animations decided whether to hide content based on the browser's `prefers-reduced-motion` setting, checked with a hook (`useReducedMotion`). That hook returns `false` on the server (which has no browser to ask) but `true` on a reduced-motion user's device. So the server baked "invisible" into the HTML, and the client then told the animation library "the current state is the resting state" — permanently freezing the content at zero opacity, for exactly the accessibility-conscious users I most wanted to serve.

I fixed it in three parts: (1) made the animations render **identically** on server and client so there's no mismatch, (2) switched the reveals to trigger on load instead of on scroll, and (3) added a CSS safety net that **guarantees** the content is visible for reduced-motion users even if the animation never runs. I verified the fix in a real browser, confirming every section and the login form now render. It taught me that "it works on my machine" and "it works for everyone" are completely different bars — and that accessibility bugs are real bugs.

*(Alternate hard problem, if you prefer: designing the shared-state architecture where one teacher action updates the student view, the parent report, and the admin analytics at once — across 81 database models — without data leaking between school districts.)*

### 5. What did you learn?
- **Full-stack for real:** 126 API endpoints, 81 database models, and ~85,000 lines of TypeScript taught me how a large app actually holds together.
- **Security is design, not decoration:** building role-based access control, two-factor login, and encryption from the start is far easier than bolting them on.
- **AI is a component, not a magic wand:** Gemini is powerful, but the product only works because of the guardrails, prompts, and systems I built around it.
- **Ship, then harden:** I ran an adversarial security audit on my own code and fixed real vulnerabilities (prompt injection, authorization gaps) before submitting.

### 6. What would you change in version 2.0?
- **Instant session revocation:** re-check each user's role and active status on every request so a removed account loses access immediately, instead of when its token expires.
- **Stricter Content-Security-Policy** with per-request nonces to remove `unsafe-inline`.
- **More languages** (Limud is built for a diverse student body) and an **offline mode** for students without reliable internet.
- **Teacher-tunable tutor strictness** — let a teacher dial exactly how much the tutor may reveal for a given assignment.

### AI-use disclosure (required)
Google's **Gemini 2.5 Flash** powers the tutoring, auto-grading, and content rewrites. Everything else — authentication and two-factor login, role-based permissions, AES-256 encryption, the spaced-repetition scheduling, the 81-model database, and all 100-plus screens — I designed and coded myself. AI is a feature *inside* Limud; it is not what built Limud.
