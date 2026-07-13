# Limud — CAC 2026 Submission Checklist & Judge One-Pager

**Deadline:** October 26, 2026, 12:00 PM ET. **Runway from today (2026-07-12):** ~113 days.
**Angle:** *The AI tutor that refuses to cheat — Socratic by design, private by law.*

---

## How Limud maps to the official judging criteria

The 2026 rules judge apps on **three official criteria** (no fixed point values). Full rule wording + every requirement is in **[CAC_REQUIREMENTS.md](./CAC_REQUIREMENTS.md)**.

| Official criterion | Limud's case |
|---|---|
| **1. Quality of the idea** (creativity & originality) | Solves two real harms at once — one-size-fits-all lessons *and* answer-dumping AI that enables cheating. A clear, opinionated point of view serving K‑12 students, teachers, parents, and whole districts. |
| **2. Implementation of the idea** (user experience & design) | Custom design system; five role-tailored dashboards (student/teacher/parent/admin/owner); full reduced-motion accessibility; a real "shared-state" flow where one action updates every role. |
| **3. Demonstrated excellence of coding & programming** | A live, working platform — 102 screens, 126 API endpoints, 81 DB models, ~85k LOC of strict TypeScript, centralized auth/middleware, Prisma schema, and a hardened AI layer. The video explains real code on camera (the tutor's system prompt + the security model). |

> ⚠️ **Judges may request the app + source code** to verify it runs as claimed — refusing means **immediate disqualification**. Keep the live site and repo available and working through judging.

---

## Required demo-video elements — check as you record
- [ ] Participant name(s) stated — **[YOUR NAME]** *(Scene 3)*
- [ ] App name stated — **Limud** *(Scenes 1 & 3)*
- [ ] One-sentence purpose stated *(Scene 3)*
- [ ] Target audience stated — K‑12 students, teachers, parents, districts *(Scene 3)*
- [ ] Tools / languages stated — TypeScript, Next.js, Prisma, Gemini *(Scenes 3 & 8)*
- [ ] App shown actually functioning *(Scenes 1, 4–7)*
- [ ] Code explained on camera *(Scene 8 — bonus rubric points)*
- [ ] AI use disclosed *(Scene 8 + the form)*
- [ ] Video is 1–3 minutes *(script ≈ 2:52)*
- [ ] Published to YouTube/Vimeo, public

---

## Human TODO (what only you can do)
1. **Record the video** from `DEMO_VIDEO_SCRIPT.md`. Record the app in a **normal (non-reduced-motion)** browser so animations play. Use the real live site.
2. **Publish** to YouTube (unlisted → public for submission).
3. **Fill the official CAC form** using `WRITTEN_RESPONSES.md`; paste the AI-use disclosure verbatim.
4. **Confirm eligibility details** on the official CAC site (grade, district, one-entry rule, team ≤ 4).
5. *(Optional hygiene, not required):* your local `.env.render` holds real dev secrets — it's gitignored and was never committed, so there's no leak, but rotating those keys someday is good practice.

## What's already done (by me)
- ✅ Landing page + login reduced-motion blank-screen bug fixed, verified, shipped (v17.12.0)
- ✅ Security hardening pass: prompt-injection fencing, AI role-injection filter, forum authorization, owner-role drift guard, crypto-secure 2FA codes
- ✅ Deliverables written: demo-video script, written responses, technical writeup, security explainer, this checklist
