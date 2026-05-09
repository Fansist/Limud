# Limud — Competitive Brief

**Date:** 2026-04-27
**Decision context:** Pre-launch competitive positioning ahead of Fall 2026 design-partner pilot. Inputs to slide deck (slides 15–20) and Year-1 product roadmap.
**Authoring role:** Lead AI orchestrator + 5× researcherOnline agents (vendor pricing pages, Crunchbase, EdSurge, EdWeek Market Brief, Common Sense Education, Trustpilot, G2/Capterra, primary press releases).
**Limud scope reminder:** U.S. public grades 6–12 only. Four roles: STUDENT · TEACHER · PARENT · ADMIN.

---

## 1. Executive Summary

- **Three direct categories** of competitor exist today: (a) student-facing adaptive platforms (Khan, IXL, DreamBox, ALEKS) at $5–35/student/yr; (b) teacher-facing AI assistants (MagicSchool, Brisk, Curipod, Eduaide) at ~$70–100/teacher/yr; and (c) **adjacent free-tier giants** (Google Gemini for Education, Microsoft Copilot Education, PowerSchool PowerBuddy) bundled into infrastructure 70%+ of U.S. K-12 already runs.
- **No vendor today serves all four roles in one product.** Limud's clearest defensible moat is the four-role surface, plus modality adaptation (visual/auditory/kinesthetic) that no competitor claims explicitly. Transparent per-student pricing ($4 blended) is a tertiary differentiator.
- **The strategic risk is not Khanmigo or MagicSchool — it is Google + Microsoft + PowerSchool.** Their bundled AI tutoring is "good enough" for districts that already pay for Classroom, Teams, or Schoology. Limud's window is the 18-month gap between now and when those bundles cover modality + parent-loop functionality. After that, generic positioning loses.

---

## 2. Competitive Landscape Map (4 tiers)

### Direct competitors (student-facing, K-12 adaptive)
| Vendor | Subjects | $/student/yr | Last raise / status |
|---|---|---|---|
| Khan Academy / Khanmigo | All, math-strongest | $35 (district tier) | Nonprofit; 700K+ students using Khanmigo |
| IXL Learning | Math / ELA / sci / SS | $5–10 | Bootstrapped private; 17M students, 1M teachers |
| DreamBox Learning | Math K-8 + reading | $20–25 | Acquired by Discovery Education 2023 |
| ALEKS (McGraw Hill) | Math K-12 + college | Quote only | Owned by McGraw Hill (public) |

### Indirect competitors (teacher-facing AI assistants)
| Vendor | Focus | $/teacher/yr | Last raise |
|---|---|---|---|
| MagicSchool AI | 60+ teacher tools | Free / $99.96 plus / Custom | **$45M Series B** (Bain Capital, Jan 2025); 6M teachers |
| Brisk Teaching | Teacher AI assistant | Free / $99.99 pro / Custom | **$15M Series A** (Bessemer, Mar 2025); 600K teachers / 30K districts |
| Curipod | AI lesson engagement | Free / $90 / school $3,999+ | $4.6M seed (Edovate / Reach / Sondo) |
| Eduaide.AI | Teacher AI quizzes | Free / $71.88 / Custom | **No VC funding** |

### Adjacent threats (free / bundled big-tech)
| Vendor | 2025-26 AI move | K-12 pricing | Risk to Limud |
|---|---|---|---|
| **Google Classroom + Gemini** | Gemini 2.5 Pro w/ LearnLM in Classroom; Gems; standards tagging | Free base + $15–24/mo Pro | **HIGH** — 6M educators trained; Miami-Dade adopting |
| **Microsoft Copilot Education** | Copilot Chat (age 13+) + Teach module; lesson plan + assessment | A1 free / A3 $18 user/mo | **HIGH** — Bundled with Teams in ~70% U.S. schools |
| **PowerSchool PowerBuddy** | Adaptive AI in Schoology LMS; Socratic mode; auto-assessment | Bundled with Schoology | **HIGH** — 50M students; zero-friction activation |
| OpenAI ChatGPT for Teachers | ChatGPT Edu + Workspace agents | Free for verified U.S. K-12 teachers through Jun 2027 | MED |
| Anthropic Claude for Education | Claude Learning Mode; K-12 via partners (MagicSchool) | Not yet K-12-priced | MED — partnership signal |
| Canvas IgniteAI (Instructure) | Rubric / discussion / grading AI | Free advanced through Jun 2026 (US) | MED — workflow overlap |
| Quizlet Q-Chat / Magic Notes | Socratic flashcards + auto-summary | $7.99/mo / $35.99/yr | LOW–MED |
| Duolingo Math | Game AI tutor, K-12 math only | Free / Max via consumer | LOW |

### Substitute solutions (the "do nothing" competitors)
- Privately hired tutors at $50–100/hr (the John persona's parents can't afford this — see slide 10).
- Generic ChatGPT / Claude / Gemini direct-to-student (no FERPA, no rostering, no parent visibility).
- Pen-and-paper differentiated instruction (the status quo for ~70% of U.S. classrooms per RAND 2017).

---

## 3. Per-Competitor Deep Dive

### 3.1 Khan Academy / Khanmigo
- **Position claim:** "Free, world-class education for anyone, anywhere." Khanmigo positioned as Socratic AI tutor.
- **Strength:** Brand trust; 180M+ registered learners; nonprofit halo; Khanmigo guides students rather than answering — Common Sense Media 4-star rating; published 2024 efficacy result of g=0.36 for ≥30 min/wk users (n=350K).
- **Weakness:** Math-heavy library; humanities Khanmigo described as "reading from a textbook"; equation entry clunky; not a parent-loop product (parent visibility is limited).
- **Customer voice (G2 / Common Sense, 2025):** *"Strong scaffolding for math, but humanities still feels like it's reading from a textbook."*
- **Why it matters for Limud:** Khanmigo is the credibility bar — the deck must claim no more than they do (g=0.36, not Bloom's 2σ). Limud differentiates on parent loop + modality + non-math subject coverage.

### 3.2 IXL Learning
- **Position claim:** "Personalized learning across math, ELA, science, social studies." Practice + analytics.
- **Strength:** Comprehensive K-12 coverage; deep skill taxonomy; published district pricing ($5–10/student); high installed base in U.S. schools.
- **Weakness:** SmartScore is widely loathed — Trustpilot 1.1/5, hundreds of reviews; punitive scoring (-3 to -9 points per wrong answer) demotivates; treated more as a compliance tool than learning aid.
- **Customer voice (Trustpilot parent, 2025):** *"More a source of stress than education — students sent to guidance counseling over SmartScore."*
- **Why it matters for Limud:** IXL's negative engagement signal is the single largest opening in K-12 adaptive. Limud must explicitly NOT be IXL — intrinsic motivation, mastery framing, no public scoring drama.

### 3.3 DreamBox Learning
- **Position claim:** "Adaptive math + reading for K-8."
- **Strength:** Tight K-5 fit; Discovery Education distribution post-acquisition; 6M+ students.
- **Weakness:** **Age-cliff at 6th grade** — graphics and game mechanics designed for younger users alienate middle schoolers; older students abandon; instruction-input UX harsh on ambiguous answers.
- **Customer voice (Common Sense parent review, 2024):** *"DreamBox for middle school — kids get tired of it after a few years; graphics designed for younger students."*
- **Why it matters for Limud:** Limud explicitly skips elementary. DreamBox's age-cliff confirms grades 6-12 needs different design. Don't compete on K-5.

### 3.4 MagicSchool AI
- **Position claim:** "AI assistant for teachers — lesson planning, grading, IEPs, feedback."
- **Strength:** 6M+ educators (largest reach in teacher AI); 60+ tools; freemium; **$45M Series B (Bain Capital, Jan 2025)**; reportedly 14% rise in student participation in adopting schools.
- **Weakness:** Hallucinations on math content; teachers must manually fact-check every output; no student-facing product (parent and student loop absent); content quality varies by subject.
- **Customer voice (G2 / Common Sense teacher, 2024-25):** *"Saves me 7-10 hrs/week, but I have to fact-check every output — especially math."*
- **Why it matters for Limud:** MagicSchool's 6M-teacher footprint is the playbook for PLG. Limud must decide whether to compete head-on (free teacher tier with adaptive student layer) or position complementarily.

### 3.5 Brisk Teaching
- **Position claim:** Teacher AI assistant inside Google Workspace.
- **Strength:** Tight Workspace integration; **$15M Series A (Bessemer, Mar 2025)**; 600K teachers, 30K districts via teacher-led adoption.
- **Weakness:** Chrome / Edge only — no mobile / iPad support; teachers in BYOD or iPad-heavy districts excluded; instructional accuracy varies by subject; teacher-only (no parent or student layer).
- **Customer voice:** *"Great for Google Classroom users; useless on iPad."* (paraphrased Common Sense reviews)
- **Why it matters for Limud:** Brisk's Workspace footprint is Limud's top integration target — Workspace SSO + drive integration on Year-1 roadmap.

### 3.6 Adjacent — Google Classroom + Gemini for Education
- **2026 move:** Gemini 2.5 Pro with LearnLM integrated into Classroom; "Gems" custom assistants; learning-standards tagging; native audio/video. 6M educators trained globally.
- **Pricing:** Free base; Google AI Pro for Education $15–24/user/mo.
- **Why HIGH risk:** When a district already pays for Workspace for Education, the marginal AI tutoring cost is $0. Limud's $4/student blends below this only if the district sees feature value beyond Gemini.

### 3.7 Adjacent — Microsoft Copilot for Education
- **2026 move:** Copilot Chat (age 13+) live; Teach module for lesson planning + differentiation + assessment (Dec 2025+); Copilot for M365 add-on $18/user/mo academic.
- **Why HIGH risk:** ~70% of U.S. K-12 has a Teams / Office Education footprint. A district enabling Copilot at $18/seat covers most of MagicSchool's territory plus AI tutoring. Limud must ensure Microsoft's AI does not have a parent loop (currently it does not).

### 3.8 Adjacent — PowerSchool PowerBuddy
- **2026 move:** PowerBuddy AI bundled with Schoology LMS — Socratic Mode, mastery-based pathways, auto-assessment. 50M students on PowerSchool. Reported 71% of K-12 systems "see high value in AI early-warning."
- **Why HIGHEST risk:** PowerSchool is the dominant K-12 SIS (student information system). A district running PowerSchool gets PowerBuddy turned on as part of standard renewal. Switching away costs *nothing* but inertia.

---

## 4. Feature Comparison Matrix

Rating scale: **Strong** · **Adequate** · **Weak** · **Absent**.

| Capability | Limud | Khan/Khanmigo | IXL | DreamBox | ALEKS | MagicSchool | Brisk | Google+Gemini | MS Copilot | PowerBuddy |
|---|---|---|---|---|---|---|---|---|---|---|
| **Adaptive student practice** | Strong | Strong (math) / Adequate (ELA) | Strong | Strong (K-8) | Strong (math) | Absent | Absent | Adequate | Adequate | Strong |
| **AI tutor (Socratic)** | Strong | Strong | Absent | Absent | Absent | Absent | Absent | Adequate | Adequate | Strong |
| **Modality adaptation (V/A/K)** | Strong | Absent | Absent | Weak | Absent | Weak (gen content) | Weak | Absent | Absent | Absent |
| **Auto-grading + feedback** | Strong | Strong | Strong | Strong | Strong | Strong | Strong | Adequate | Adequate | Adequate |
| **Lesson plan generation** | Adequate | Absent | Absent | Absent | Absent | Strong | Strong | Strong | Strong | Adequate |
| **Parent portal** | Strong | Limited | Strong | Limited | Absent | Absent | Absent | Absent | Absent | Adequate |
| **Admin / FERPA console** | Strong | Adequate | Strong | Adequate | Adequate | Adequate | Adequate | Strong | Strong | Strong |
| **Free teacher tier** | Planned | Strong (consumer) | Absent | Absent | Absent | Strong | Strong | Strong | Strong | N/A |
| **LMS integration** | Adequate (planned) | Strong (Khanmigo→LMS) | Strong | Strong | Strong | Strong | Strong (Workspace) | Native | Native (Teams) | Native (Schoology) |
| **Pricing transparency** | Strong | Strong (consumer) | Strong | Adequate | Weak (quote-only) | Adequate (teacher) | Adequate | Adequate | Adequate | Bundled |

**Honest read:** Limud claims Strong on capabilities it has NOT yet shipped to paying users. Until pilot data exists (Fall 2026), every Strong is a product-thesis claim, not a measured outcome. The matrix is a *positioning* document, not a *performance* document.

---

## 5. Positioning Analysis

### 5.1 Stated positioning (level 1 — category)
- **Khanmigo:** "Free AI tutor for every student."
- **IXL:** "Personalized learning at every grade level."
- **DreamBox:** "Intelligent adaptive K-8 math + reading."
- **MagicSchool:** "AI for educators."
- **Brisk:** "AI for teachers, in Google Workspace."
- **PowerBuddy:** "AI inside the LMS your district already runs."
- **Limud (proposed):** "Every mind learns differently — one product, four roles, K-12 adaptive."

### 5.2 Message architecture (level 2-4)
| Vendor | Differentiator | Value prop | Top proof point |
|---|---|---|---|
| Khanmigo | "Free + Socratic" | "Every student gets a 1:1 tutor" | g=0.36 efficacy (2024) |
| IXL | "Comprehensive coverage" | "Master every standard" | 17M students, 1M teachers |
| DreamBox | "Adaptive K-8" | "Math fluency from K-8" | Discovery acquisition |
| MagicSchool | "60+ tools, free for teachers" | "Get hours back" | 6M teachers; $45M Bain |
| Brisk | "Inside your Chrome tab" | "Zero-friction teacher AI" | $15M Bessemer; 30K districts |
| PowerBuddy | "Already in your LMS" | "Zero new contract" | 50M students on PowerSchool |
| **Limud** | **"Four roles, modality adapt, $4"** | **"Same lesson, per-student form, parent visibility"** | **(claim, not yet measured)** |

### 5.3 Positioning gaps Limud can claim
- **Parent loop in an AI-native product** (Khanmigo Limited; MagicSchool/Brisk Absent; only IXL has a true parent portal but no AI tutor).
- **Modality adaptation as a marketed feature** (no competitor explicitly claims V/A/K rendering).
- **Transparent district pricing** at the budget tier (every adaptive comp is $5+ or quote-only).

### 5.4 Positioning gaps Limud should NOT claim
- "Most accurate AI" — every gen-AI product hallucinates; making this claim invites scrutiny we cannot win.
- "Replaces teachers" — politically toxic; every teacher-union response would be hostile.
- "Bloom's 2-sigma" — debunked; meta-analyses cluster at d=0.79.

---

## 6. Customer Voice (sentiment that matters)

| Vendor | Top user love | Top user complaint |
|---|---|---|
| Khanmigo | Socratic scaffolding | Subjects beyond math feel shallow |
| IXL | Skill coverage | SmartScore "stress, not learning" |
| DreamBox | Engaging K-5 graphics | Age-cliff at middle school |
| MagicSchool | Time saved (7-10 hrs/wk) | Hallucinations require manual QA |
| Brisk | Workspace integration | No iPad / mobile |
| PowerBuddy | Already in LMS | Generic; not adolescent-tuned |

**Cross-vendor pattern (the real opening):** *Nobody* in this list combines (a) trustworthy AI content out of the box AND (b) non-punitive engagement design AND (c) coverage of grades 6-12 specifically (vs. K-5 or universal K-12).

---

## 7. SWOT — Limud

### Strengths
- Four-role surface no competitor has shipped.
- Modality adaptation as a defensible product claim.
- Transparent budget-tier pricing in a market of "call sales."
- Pre-launch — no legacy code or contracts to defend.

### Weaknesses
- Pre-launch — zero efficacy data. Every claim is a thesis.
- No district relationships yet (3 design partners is the entire 2026 GTM).
- Six builders. We cannot match MagicSchool's release cadence.
- Hebrew-language / Judaica was a possible specialty; deck currently does not lean on it.

### Opportunities
- Free-tier squeeze fatigue: districts saturated on Google + MS + PowerSchool may want a "specialist" alternative.
- Parent-loop demand is rising post-pandemic but unmet by AI-native products.
- Teacher-led PLG is a proven channel (MagicSchool reached 6M this way).
- Title I + IDEA funding preserved post-ESSER (FY26 $18.5B / $15.2B) — buying capacity is intact.

### Threats
- **Highest:** Google + Microsoft + PowerSchool free tier eats "good enough" tutoring by 2027.
- MagicSchool / Brisk add a parent layer (commodity differentiator).
- Anthropic ships a K-12 standalone (currently MED — only via partners).
- ESSER expiration cooling district buying through Q2 2026.
- 6-11 month sales cycle (37% of districts) crushes CAC if pilots don't convert.

---

## 8. Strategic Implications (the "so what")

### 8.1 Build (differentiate)
1. **Parent loop as a marketing-led feature.** Weekly digest, at-risk alerts, FERPA-aligned. No competitor has this AI-native.
2. **Modality switch in the assignment view.** Visual / auditory / kinesthetic toggle on every lesson. Make it visible in the demo, not buried.
3. **Confidence-scored AI output.** Every AI-generated content piece carries a confidence band. This addresses the universal "manual QA tax" complaint.
4. **Transparent published pricing.** $3 / $5 / $8 on the marketing site. Every competitor hiding pricing is a referral channel for us.

### 8.2 Achieve parity (must-have to be considered)
- Lesson-plan generation that reads as well as MagicSchool's.
- Workspace + Schoology + Canvas integration on the Year-1 roadmap.
- Free teacher tier sufficient for PLG.
- Sub-day auto-grading turnaround.

### 8.3 Monitor (set quarterly review)
- PowerBuddy roadmap (highest-probability disruptor).
- Gemini for Education K-12-specific feature ships.
- Microsoft Copilot Teach module pricing post-Dec 2025 negotiations.
- Anthropic K-12 standalone product launch.

### 8.4 Don't compete (explicit)
- K-5 elementary — DreamBox, ABCmouse own it.
- Math-only practice — ALEKS, Duolingo Math, Khanmigo's strongest leg.
- Pure flashcards / cramming — Quizlet.
- Higher ed — Canvas, OpenAI, Anthropic.

---

## 9. Open Questions / Watchlist

1. Does PowerBuddy ship a parent-facing module before our Fall 2026 pilot wraps? (highest-risk monitoring item)
2. Will Microsoft bundle Copilot Teach into the K-12 A1 free tier? (would compress our window by ~6 months)
3. Will Anthropic release a K-12 standalone product before our Series A target? (would invalidate the "AI specialist" position)
4. Does MagicSchool launch a student-facing layer with their $45M Series B capital? (would reduce our 4-role moat to 3)
5. What is the actual win rate of teacher-led PLG → district contract? (we cite MagicSchool 6M as the proof point — convert rate is the unknown)

---

## 10. Update cadence

This brief should be refreshed quarterly. Researcher hand-off table:

| Section | Source class | Refresh trigger |
|---|---|---|
| Direct + Indirect competitor matrix | Vendor pricing pages | Quarterly + on competitor press release |
| Adjacent threats | Big-tech blogs, product pages | Quarterly |
| Customer voice | G2, Capterra, Reddit, Trustpilot | Semi-annual |
| Funding map | Crunchbase, EdSurge, vendor PR | Monthly during fundraising windows |
| Positioning | Vendor homepages | Quarterly |
| Strategic implications | Internal — product + GTM owners | Quarterly review meeting |

---

*All vendor figures and quotes verified as of 2026-04-27. Source URLs in slide-15, slide-16, slide-18, slide-19 citation lines; full URL list in `scripts/build_limud_deck.py` docstring.*
