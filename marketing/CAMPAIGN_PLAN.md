# Limud — Individual Products Campaign Plan
**Version:** v17.0.0 · **Drafted:** 2026-05-19 · **Owner:** Marketing

> Operational marketing plan for the **individual-product line** at
> `limud.co/products`. This document covers the 13 standalone tools and
> 4 bundles that an independent K–12 learner can buy directly. It does
> **NOT** cover the district, school, teacher, parent, or admin
> surfaces — those are a separate B2B funnel with a separate plan.

---

## Table of contents

1. Audience
2. Brand positioning and the anti-cheating moat
3. The 13 products and 4 bundles — the actual catalog
4. Messaging pillars
5. Channel strategy
   - 5.1 YouTube Shorts and TikTok
   - 5.2 Reddit
   - 5.3 Twitter / X
   - 5.4 Google search (SEO)
   - 5.5 Discord partnerships
6. Eight-week content calendar
7. Pricing levers
8. Budget tiers — shoestring, scale, blitz
9. Metrics that matter
10. What we deliberately do NOT advertise
11. Reference assets and where they live

---

## 1. Audience

The individual-product line exists for **one buyer**: a learner (or a
learner's parent paying on their behalf) who needs help with a specific
piece of school work. Not a class. Not a district. One person, one
problem, one tool.

### Primary segments (in priority order)

1. **AP-track high schoolers (grades 9–12).** They're the easiest to
   reach (concentrated on r/APStudents, AP Discord servers, study
   TikTok), they have real exam pressure, they have payment ability
   (own card, prepaid card, parent's card with permission), and their
   needs map cleanly to specific products: Exam Postmortem after a
   practice test, Essay Coach for the AP English DBQ, Lab Report
   Reviewer for AP Bio/Chem.

2. **Independent K–12 learners, grades 6–12.** Kids in a regular school
   who want help that isn't tutoring. The honors student who wants the
   B+ to be an A. The kid who's been told "you're behind" and doesn't
   want a tutor. Limud's lower-stakes price points ($3–$9) make it a
   reasonable spend on a single assignment.

3. **Homeschool students and their parents.** Already self-directed,
   already comfortable buying education tools, already evaluate on
   academic merit rather than UX gloss. Strong fit for the All-Access
   Pass — they're not buying one tool for one exam, they're staffing a
   year of work.

4. **High-school students in language classes, coding electives, and
   research-paper courses.** Language Lab, Code Companion, and
   Citation Finder are durable enough that a learner returns
   throughout a semester.

### Secondary segments

- **Early-college undergrads** in lower-division writing, math, and
  intro science courses. Same tools, slightly older user.
- **Parents of younger learners (grades 6–9)** buying on behalf of
  the kid. They'll evaluate against tutoring cost ($60–$120/hr) — our
  $5–$15/mo bundle wins the math comparison.

### Who we are NOT chasing in this campaign

- Teachers. Limud has teacher-side tools, but they live on a
  different funnel and a different price.
- Districts and schools. Same — different funnel, different sales
  motion (annual contracts, RFP-driven).
- Parents who want "AI to do my kid's homework." We turn them away
  on the landing page, on purpose.

---

## 2. Brand positioning and the anti-cheating moat

### One sentence

**Limud doesn't do your homework. Every tool helps you study, never writes for you.**

### Why this is the moat

Every other AI study tool on the market (Chegg, CourseHero, Photomath,
Quillbot, the consumer LLMs themselves) has the same problem: students
use them to *replace* the work. Teachers know it. Parents know it.
College admissions offices know it. The students themselves know it,
and the ones who care about actually learning feel a quiet shame about
it.

Limud is the only product line where the **product itself refuses to
cheat**:

- **Math Tutor** gives hints and names the trap. It will not write the
  solution.
- **Essay Coach** diagnoses your draft's wobble. It will not rewrite a
  sentence.
- **Lab Report Reviewer** critiques against the rubric. You write the
  report.
- **Code Companion** explains your error and asks Socratic questions.
  It does not paste in the fix.
- **Citation Finder** suggests real sources. It does not write the
  essay around them.
- **Notes Cleaner** uses only the words you wrote down. It does not
  invent facts the lecture didn't cover.
- **Exam Postmortem** clusters your wrong answers by *root cause*, not
  by topic — so you study the habit, not the symptom.

That refusal is a feature, and it's the entire campaign's wedge. We
sell to the half of the market that doesn't want to cheat. Everyone
else has the rest.

### The tagline shortlist

- **"We don't do your homework. We make you better at it."** (Primary)
- **"Hints, not answers."** (Math, Code, Lab — STEM verticals)
- **"Your draft. Your voice."** (Essay Coach — writing verticals)
- **"Pay only for the exam you're studying for."** (Pricing-led)
- **"13 tools. Pick one. Pick a bundle. Pay once or monthly."** (Catalog-led)

---

## 3. The 13 products and 4 bundles — the actual catalog

For copy reference. Prices and URLs are pulled live from
`src/lib/products-catalog.ts` and `src/lib/bundles.ts` and MUST NOT
drift from the live site.

### The 13 standalone tools

| Tool | Page | One-time | Monthly | The anti-cheating angle |
|---|---|---|---|---|
| Exam Study Helper | `/study` | $9 / exam | $5/mo | Rewrites coursework in 5 formats — you still take the exam |
| Practice Generator | `/practice` | $5 / topic | $4/mo | AI-graded with reasoning — you answer the questions |
| Math Tutor | `/math-solver` | $7 / pack of 50 | $4/mo | Hints, concepts, the trap — never the answer |
| Essay Coach | `/essay-coach` | $7 / draft | $5/mo | Mirrors structure, won't rewrite one sentence |
| Notes Cleaner | `/notes-cleaner` | $4 / lecture | $4/mo | Uses only your words — never invents |
| Lab Report Reviewer | `/lab-report` | $6 / report | $4/mo | Rubric-aligned critique — you write the report |
| Citation Finder | `/citation-finder` | $4 / pack of 25 | $3/mo | Real sources — won't write the essay around them |
| Language Lab | `/language-lab` | $12 / semester | $5/mo | Drills anchored to your textbook |
| Flashcard Forge | `/flashcard-forge` | $5 / deck | $4/mo | Spaced repetition from your source — never invents terms |
| Presentation Prep | `/presentation-prep` | $6 / deck | $4/mo | Talking-point cues, not a script |
| Code Companion | `/code-companion` | $8 / pack of 30 | $5/mo | Explains errors, asks questions, never writes the fix |
| Reading Decoder | `/reading-decoder` | $5 / article | $4/mo | Thesis tree, won't summarize so you can submit it |
| Exam Postmortem | `/exam-postmortem` | $4 / exam | $3/mo | Clusters by habit, not by topic |

### The 4 bundles

| Bundle | One-time | Monthly | Save | Includes |
|---|---|---|---|---|
| **All-Access Pass** | $79 | $15/mo | ~45% | All 13 tools |
| Study Bundle | $15 | $9/mo | ~22% | Exam Study Helper + Practice Generator + Notes Cleaner |
| Writing Bundle | $12 | $8/mo | ~20% | Essay Coach + Citation Finder + Notes Cleaner |
| STEM Bundle | $14 | $9/mo | ~25% | Math Tutor + Lab Report Reviewer + Practice Generator |

---

## 4. Messaging pillars

Every ad, post, email, and landing-page block ladders to one of these
three pillars. Don't write copy that doesn't fit one.

### Pillar 1 — Anti-cheating ("We don't do your homework")

- Hero copy on every tool's landing page reinforces the refusal.
- This is the pillar that gets the share, the screenshot, and the
  retweet. It's our most differentiated stance.
- Always concrete: "Math Tutor won't write the equation. It tells you
  which concept you're missing and which trap students fall into here."

### Pillar 2 — Pay-as-you-need ("Pay only for the exam you're studying for")

- $3–$9 one-time price points let a learner buy *one* tool for *one*
  assignment. No subscription anxiety. No 7-day trial fine print.
- Monthly bundles ($8–$15) for the repeat customer.
- All-Access Pass ($79 one-time or $15/mo) for the all-in student.
- This pillar is the conversion pillar. The anti-cheating pillar gets
  the eyeballs; this one closes the sale.

### Pillar 3 — Specific to the moment ("13 tools, pick yours")

- We don't sell "an AI learning platform." We sell the Exam Study
  Helper to the kid who has a chemistry final on Monday. We sell the
  Essay Coach to the kid who has an AP Lang DBQ due Friday.
- Every channel post should name a specific tool and a specific
  moment of use.

---

## 5. Channel strategy

Five channels, ranked by expected CAC efficiency for our audience.
Organic first. Paid second. Influencer last (and only at the blitz
tier).

### 5.1 YouTube Shorts and TikTok

**Why these first.** Our audience lives on Shorts and TikTok. The
existing 55-second vertical ad at `marketing/limud_ad_short.mp4` is
ready to post. The InVideo workflow at `marketing/InVideo_Script.md`
documents the script and editor steps for follow-ups, and the full
production brief at `marketing/AI_VIDEO_BRIEF.md` covers the brand
kit, scene-by-scene shot list, and AI-adapter notes.

**Cadence.** 2 posts per week per platform for 8 weeks = 32 posts
total. Mix:

- 1 product-spotlight per week (the 13 tools cycle through twice over
  8 weeks; the most demand-heavy ones — Exam Postmortem, Essay Coach,
  Math Tutor — get a second slot)
- 1 "anti-cheating angle" or "moment of use" per week (e.g. "POV:
  three days before AP Bio, you have a Lab Report Reviewer")

**Format guardrails.**

- Vertical 1080×1920, 30 fps, MP4 H.264, ≤25 MB.
- 30–55 seconds. Anything over 60s loses Shorts preferential treatment.
- Burn captions in. Most viewers watch on mute.
- Hook in the first 2 seconds. "Stressed about your next exam?" works.
- End frame must show `limud.co/products` URL for ≥3 seconds.

**Repurpose plan.** Each 55-second ad has 12 scenes. We cut each scene
into a 4.5-second standalone clip and post those as second-cycle
content in weeks 5–8. Same brand kit, cheaper to produce, holds the
feed warm.

**The anti-cheating bait.** Once per week, post a comparison-style
clip: "Here's what Chegg would do with your essay. Here's what Essay
Coach does." Use mocked screens (no actual competitor footage). This
is the most-shared format we have.

### 5.2 Reddit

**Why.** Our audience uses Reddit to ask "is X worth it" before they
buy anything. We need to show up there as a real founder, not as a
spam account.

**Subreddits, ranked by fit.**

1. **r/APStudents** — 280k+ members. Heavy traffic in April-May
   (exams) and August-October (course start). Highest-fit.
2. **r/GetStudying** — study-method-curious users. Best fit for
   Exam Postmortem and Notes Cleaner content.
3. **r/highschool** — broader. Good for general brand build, not
   product-specific posts.
4. **r/homeschool** — best fit for the All-Access Pass pitch. Be
   transparent that we're a vendor; r/homeschool moderators are
   strict but fair if disclosed.
5. **r/learnprogramming** — for Code Companion. The subreddit hates
   "I built an AI tutor for X" spam. We earn the right to mention
   Code Companion by participating substantively first.
6. **r/ChemistryHelp**, **r/PhysicsHelp**, **r/learnmath**,
   **r/HomeworkHelp** — vertical-specific, smaller, but conversion
   density is high. Show up only when relevant.

**Strategy.**

- The founder posts under a real account with karma. NOT a brand
  account. NOT a coupon-spam account. NEVER from a freshly created
  account.
- Comment first, post later. Spend the first two weeks just helping
  people on r/APStudents and r/GetStudying. Mention Limud only when
  it's the right answer to their actual question.
- When posting, mark it `[I built this]` or `[Founder]` per the
  subreddit's rules. Be transparent about being the vendor.
- Offer free codes to verified students who DM. r/APStudents and
  r/GetStudying mods will not block this if it's clearly low-key
  and disclosed.
- **Never** post a "Top 10 AI study tools" list with Limud at #1.
  Reddit detects this pattern and bans the account.

### 5.3 Twitter / X

**Why.** Twitter is where high-school and college students screenshot
study moments and where edu-Twitter has a small, dense, engaged
audience.

**Strategy.**

- Founder-led account. Real name, real photo, real voice. Limud's
  brand handle exists as a secondary amplifier.
- Post 4–6x per week. Mix of:
  - **Study-technique threads** that mention specific Limud tools
    organically. Example: a 6-tweet thread on misconception mapping
    that names Exam Postmortem in tweet 4.
  - **Founder-build-in-public posts** — "shipped per-product checkout
    today, here's the screen." Edu-Twitter loves the inside view.
  - **Anti-cheating takes** — short, opinionated. "Math Tutor refuses
    to write the equation. Yes, on purpose. Here's why a refusal is
    a feature."
- Reply to AP-prep and study-method threads with substantive answers.
  Mention Limud only when the question matches a tool.

**What not to do on Twitter.**

- No "we're launching!" megaphone posts. The bar for product
  launches on edu-Twitter is `it shipped two weeks ago and people
  are already using it`.
- No buying followers. We'd rather have 800 real followers than 12k
  bot ones.
- No automated cross-posts from LinkedIn. Twitter knows the smell.

### 5.4 Google search (SEO)

**Why.** SEO is the slowest channel to spin up and the cheapest one
once it's running. Long-tail intent queries convert at 3–10x the rate
of social.

**Strategy.** Each of the 13 product detail pages gets:

- A specific page-title tag tuned to a long-tail keyword.
- An H1 that matches the page-title tag (within 4 words).
- A meta-description optimized for click-through (140–155 chars).
- A first paragraph that uses the long-tail keyword in the first 60
  characters.
- Schema.org `Product` markup with price, rating, and availability.

#### Three long-tail keywords per product (suggested)

| Product | Long-tail keyword 1 | Long-tail keyword 2 | Long-tail keyword 3 |
|---|---|---|---|
| Exam Study Helper | "ap exam study helper" | "study guide generator from textbook" | "make a comic from my chemistry chapter" |
| Practice Generator | "ap practice questions generator" | "multiple choice generator with explanations" | "quiz me on any topic ai" |
| Math Tutor | "math tutor that gives hints not answers" | "calculus help without giving away the answer" | "ai math tutor socratic" |
| Essay Coach | "essay coach that gives feedback without rewriting" | "ai feedback on essay structure" | "ap lang essay review without rewriting" |
| Notes Cleaner | "clean up lecture notes ai" | "decode my chem notes" | "lecture notes to tldr" |
| Lab Report Reviewer | "ap bio lab report checker" | "lab report rubric review" | "lab report missing controls checker" |
| Citation Finder | "real source finder apa mla chicago" | "ai citation finder peer reviewed" | "find sources to back up my essay" |
| Language Lab | "spanish drills anchored to textbook" | "ap spanish practice from my chapter" | "language learning from your textbook" |
| Flashcard Forge | "make flashcards from a chapter" | "anki deck generator from pdf" | "spaced repetition deck from slides" |
| Presentation Prep | "presentation outline talking points" | "slide skeleton generator with talking points" | "ai presentation prep without script" |
| Code Companion | "explain compiler error socratic" | "python error explainer for students" | "ai coding help that doesn't paste the fix" |
| Reading Decoder | "thesis map from dense article" | "decode academic article ai" | "central thesis extractor reading" |
| Exam Postmortem | "wrong answer pattern analysis" | "mistake pattern finder exam" | "why do i keep making the same mistake on exams" |

**Content marketing arm.** Beyond product pages, publish 1 blog post
per week on the Limud blog covering:
- Study-method explainers ("Why misconception mapping beats topic-by-topic review")
- Anti-cheating positioning posts ("AI that refuses: why our tools say no")
- Per-product deep dives ("How Essay Coach diagnoses a wobbly thesis")

Each post anchors a long-tail keyword and links to one specific
product page.

### 5.5 Discord partnerships

**Why.** Study Discord servers have the densest concentration of our
exact audience, and they trust their server admin's recommendations
more than any ad we'd run.

**Targets.**

- **Khan Academy community Discord** (~200k members)
- **r/APStudents Discord** (~30k members, run by the subreddit)
- **AP Cram Discord** (~10k members, exam-week focused)
- **r/learnprogramming Discord** (~50k members) — for Code Companion
- **Polyglots / Language Learning Discord** (~80k members) — for Language Lab
- **Mathematics Discord** — for Math Tutor
- **Homeschool Discord servers** — fragmented but additive

**Tactics.**

1. Offer the admin team free All-Access codes (lifetime). Cost to us:
   $0 marginal. Value to them: real.
2. Offer server members a special code: `DISCORD30` for 30% off any
   one-time purchase, valid 30 days. Track redemptions per-server so
   we know which servers are real channels.
3. Sponsor exam-week study events. AP Cram's "AP Bio cram weekend"
   gets a Limud-branded Exam Study Helper free-day, and the
   server gets a flat $250–$500 fee.
4. Give the admin team a private feedback channel back to us. They
   tell us when something's broken, we ship a fix the same week.
   This buys long-term goodwill that no ad spend can.

**Hard rules.**

- Disclose every partnership in the server. No stealth marketing.
- Never pay an admin to delete negative posts about Limud.
- If a server admin asks us to leave, we leave the same day.

---

## 6. Eight-week content calendar

Each week has a theme, three sample post hooks per platform, the
specific product featured, and the CTA. Cadence per platform:

- YouTube Shorts: 2 posts/wk
- TikTok: 2 posts/wk (same cuts as Shorts, separate captions)
- Reddit: 2-3 substantive comments/wk + 1 founder post every 2 wks
- Twitter/X: 4-6 posts/wk
- Blog: 1 post/wk

### Week 1 — "Stop cheating yourself"

- **Theme:** Anti-AI-cheating positioning. The wedge.
- **Featured product:** Math Tutor (the most photogenic refusal).
- **CTA:** `limud.co/math-solver`

Sample hooks:

- **Shorts/TikTok:** "Watch what happens when I ask Limud's Math Tutor to just give me the answer." (Demo of the refusal + the hint.)
- **Reddit (r/APStudents):** Founder post — "I built an AI tutor that won't do your homework. AMA." (Disclose, answer for 48 hours, then move on.)
- **Twitter:** Thread — "Why Math Tutor refuses to write the equation, and what it does instead." (6 tweets, named tweet 4 links the product.)
- **Blog:** "The case for AI that refuses."

### Week 2 — Subject-specific deep dive: writing

- **Theme:** Writing-vertical week. Essay Coach + Citation Finder + Notes Cleaner.
- **Featured product:** Essay Coach (with Writing Bundle as upsell).
- **CTA:** `limud.co/essay-coach` (with secondary CTA to `/products/bundle/writing-bundle/checkout?billing=monthly`)

Sample hooks:

- **Shorts/TikTok:** "POV: your AP Lang DBQ is due Friday and you don't want it rewritten for you." (Demo of Essay Coach's structural feedback.)
- **Reddit (r/APStudents):** Comment on an existing "how do I get better at the DBQ" thread, mention Essay Coach as one of the answers.
- **Twitter:** "Here's what 'won't rewrite a single sentence' looks like in practice." (Screenshot thread, 4 tweets.)
- **Blog:** "Why I tell students not to use AI to rewrite their essays — and what to do instead."

### Week 3 — Testimonials / pre-launch case studies

- **Theme:** Real-user stories. We use the first 20 paying customers as the case-study seeds.
- **Featured product:** Mix — the case study determines the tool.
- **CTA:** `limud.co/products` (catalog-level)

Sample hooks:

- **Shorts/TikTok:** "Limud's Exam Postmortem found a pattern in my AP Bio wrong answers I never would've caught." (Read-aloud screenshot, no live human required.)
- **Reddit (r/APStudents):** Sticky-style post — "Comment with what you used to study for [exam] and what worked." (Limud surfaces in real comments, organically.)
- **Twitter:** Quote-tweet the customer testimonial with one-sentence context.
- **Blog:** "From a B in AP Bio to an A: a case study with Limud's Exam Postmortem." (Permission required.)

### Week 4 — STEM bundle week

- **Theme:** Math Tutor + Lab Report Reviewer + Practice Generator. STEM heavy.
- **Featured product:** STEM Bundle.
- **CTA:** `/products/bundle/stem-bundle/checkout?billing=monthly`

Sample hooks:

- **Shorts/TikTok:** "Three tools, one bundle, $9 a month. STEM students rejoice."
- **Reddit (r/ChemistryHelp, r/PhysicsHelp):** Substantive answers first. Then a separate post: "I built a bundle for STEM students that refuses to give you the answer."
- **Twitter:** "The STEM Bundle is what I would have wanted in AP Chem. Math hints. Lab report critique. Practice questions with reasoning."
- **Blog:** "What 'doesn't write the answer' looks like across three STEM subjects."

### Week 5 — Subject-specific deep dive: coding

- **Theme:** Code Companion. Carve out the developer-curious student audience.
- **Featured product:** Code Companion.
- **CTA:** `limud.co/code-companion`

Sample hooks:

- **Shorts/TikTok:** "Your Python error in plain English. No, it won't paste in the fix." (Screen recording of a real traceback walkthrough.)
- **Reddit (r/learnprogramming):** Founder post (only after 4 weeks of substantive participation) — "I built a Socratic coding tutor for students. It won't write your assignment."
- **Twitter:** "Code Companion explains the stack trace. You write the fix. That's the whole product."
- **Blog:** "Why code-completion tools are bad for learning, and what to use instead."

### Week 6 — Language Lab month-cycle hook

- **Theme:** Language Lab. Best fit for textbook-anchored drills.
- **Featured product:** Language Lab.
- **CTA:** `limud.co/language-lab`

Sample hooks:

- **Shorts/TikTok:** "Most language apps teach you 'I like cats.' Language Lab anchors to your AP Spanish textbook, chapter 7."
- **Reddit (r/Spanish, r/French, r/ChineseLanguage):** Substantive answer to a "how do I prep for [exam]" thread.
- **Twitter:** Thread — "Why generic language apps fail high-schoolers, and what to do instead."
- **Blog:** "Language Lab drills, anchored to your textbook — here's why that matters."

### Week 7 — Exam-prep season push

- **Theme:** Two weeks before AP exams (timed to early May for that audience). Maximum-intensity push.
- **Featured product:** Exam Study Helper + Practice Generator + Exam Postmortem (the exam-prep triad).
- **CTA:** Study Bundle.

Sample hooks:

- **Shorts/TikTok:** "Two weeks to AP Bio. Here's the 13-day plan with Exam Study Helper, Practice Generator, and Exam Postmortem."
- **Reddit (r/APStudents):** A real, detailed AP cramming post, with Limud tools referenced in the middle, not at the top.
- **Twitter:** Daily countdown posts ("12 days to AP Bio. Today: use Practice Generator on the 5 most common topics.")
- **Blog:** "The 13-day AP study plan, mapped to Limud's exam-prep tools."

### Week 8 — All-Access Pass close

- **Theme:** The wrap. All-Access Pass for repeat customers.
- **Featured product:** All-Access Pass.
- **CTA:** `/products/bundle/all-access/checkout?billing=monthly` (highlight one-time $79 as the better deal for committed students).

Sample hooks:

- **Shorts/TikTok:** "$79 once or $15 a month. 13 tools. Pick whichever doesn't make your wallet hurt."
- **Reddit (r/homeschool):** Founder post — "All-Access for $79 one-time, lifetime access to 13 study tools. Built for students; no district sales call required."
- **Twitter:** Thread — "Here's why we priced All-Access at $79 one-time."
- **Blog:** "Why we built a one-time price instead of subscription-only."

---

## 7. Pricing levers

The pricing is the campaign. Don't fight it.

### Lever 1: $3–$9 one-time purchase as entry point

Most ad spend should drive to a **single tool, single use** purchase.
$3 (Citation Finder pack at low end), $4 (Exam Postmortem, Notes
Cleaner, Practice Generator at the low end), through $9 (Exam Study
Helper at the high end). These prices are below the "should I think
about this" threshold for most parents and many students with their
own card. Conversion rate at this price is the campaign's leading
metric.

### Lever 2: $8–$15 monthly bundle for the repeat customer

If a learner bought a one-time tool and came back twice, they're a
bundle candidate. Email triggers (covered in Section 9) bump them to
the bundle that contains their original tool. Writing Bundle for
Essay Coach buyers, STEM Bundle for Math Tutor buyers, Study Bundle
for Exam Study Helper buyers.

### Lever 3: $79 one-time All-Access Pass

The all-in student — the AP-track senior, the homeschooler with a
full year ahead — gets shown the All-Access Pass on every product
page. The $79 one-time price is a deliberate anti-subscription
pitch: "Buy it once, use it forever, no recurring charge."

### Lever 4: $15/mo All-Access Pass

For the customer who can't drop $79 today, the monthly option holds
the door open. Targeted at parents who want to test before committing.

### Coupon strategy

- **DISCORD30** — 30% off any one-time purchase, Discord-channel only.
- **AP15** — $15 off All-Access Pass during AP season (April-May).
- **NEVER public coupons.** No "code WELCOME10 for 10% off your first
  order" — that's a discount-shopper signal that erodes margin. Limud
  is priced at the floor already.

### Free trial policy

**No free trial on individual products.** Every tool has a free
preview surface (the marketing page) and the prices are low enough
that a one-time buy IS the trial. A 7-day free trial would invite
churn-on-trial, abuse, and friction at the auth wall. The All-Access
Pass at $15/mo is the closest thing to a trial.

---

## 8. Budget tiers — shoestring, scale, blitz

Three tiers. Pick the one that matches the founder's actual runway.

### Shoestring — $0 to $500/month

100% organic. No paid social. No influencer fees.

**Spend breakdown:**

- $0–$100/mo on stock music licenses for Shorts (optional; the
  reference pipeline synthesizes a royalty-free pad).
- $0–$200/mo on AI image generation for thumbnails and Shorts B-roll.
- $0–$200/mo on Reddit ads — but only the small-spend, sub-targeted
  variety (not banner buys).
- All other channels: founder time only.

**Expected output:** 30–50 posts/month across Shorts/TikTok/Twitter,
2–4 Reddit posts, 1 blog post per week, 2–3 Discord partnerships
spun up.

**Expected CAC:** $3–$12 per signup, $20–$60 per paying customer.
Conversion is slow (4–8 weeks before the channels compound).

### Scale — $2,000 to $5,000/month

Organic plus targeted paid social. Targets the audience tightly.

**Spend breakdown:**

- $800–$1,500/mo on TikTok and Shorts paid promotion of the
  best-performing organic posts (promote the top 20% by engagement).
- $400–$800/mo on Reddit ads, targeted at r/APStudents,
  r/GetStudying, r/homeschool.
- $300–$700/mo on Google Ads on the long-tail keywords from §5.4 —
  bid only on intent ("essay coach that doesn't rewrite," not "essay
  help").
- $200–$500/mo on production tooling, music, AI assets.
- $300–$500/mo on Discord partnerships (sponsorship fees for the
  larger servers).

**Expected output:** 60–100 posts/month, 3–5 paid campaign variants
running concurrently, 1 partnership per week.

**Expected CAC:** $8–$25 per signup, $40–$120 per paying customer.

### Blitz — $10,000+/month

Add influencer partnerships and YouTube long-form sponsorship.

**Spend breakdown:**

- $4,000–$8,000/mo on **edu-influencer partnerships** — micro-influencers
  in the 50k–500k subscriber range on YouTube (study-vlog channels,
  AP-prep channels, homeschool channels). Single-post fees in this
  tier run $500–$3,000. We want 3–5 partnerships per month.
- $2,000–$4,000/mo on paid social.
- $1,500–$3,000/mo on Google Ads (bid on the long-tail keywords plus
  some competitor terms).
- $1,000–$2,000/mo on a part-time community manager who actually
  lives on r/APStudents and the Discord servers.

**Expected output:** 100+ posts/month, 5+ live influencer campaigns,
2+ Discord exam-week sponsorships.

**Expected CAC:** $15–$40 per signup, $60–$180 per paying customer.

### What we do NOT spend on at any tier

- Facebook / Instagram ads. Our audience (12-18) is on TikTok, not
  Instagram, and Facebook is irrelevant to teen acquisition.
- LinkedIn. That's the B2B funnel.
- Trade shows, conferences. Same.
- Brand sponsorships at the high-school-football-level. Wrong
  audience density, wrong unit economics.

---

## 9. Metrics that matter

The campaign's success is measured by **paying customers per dollar
spent**, full stop. Everything else is leading indicators.

### Leading indicators (track weekly)

| Metric | Source | Target (Scale tier) |
|---|---|---|
| Click-through rate on Shorts ad | TikTok / YouTube Studio | ≥ 1.2% |
| Bounce rate on `/products` | analytics | ≤ 55% |
| Time on `/products` page | analytics | ≥ 1m 20s |
| Sign-up conversion from `/products` | analytics + auth log | ≥ 4% |
| Free-to-paid conversion (signup to first purchase) | DB query on `ProductSubscription` and `BundleSubscription` | ≥ 8% within 14 days |
| Per-product purchase frequency | DB query | ≥ 1.2 purchases per buyer in first 30 days |

### Lagging indicators (track monthly)

| Metric | Source | Target |
|---|---|---|
| Monthly Recurring Revenue (MRR) | OWNER finances dashboard | Track trend, not target |
| Customer Acquisition Cost (CAC) per channel | spend ÷ paid customers | $40–$80 |
| Lifetime Value (LTV) | DB query on subscription duration | ≥ 3× CAC |
| Net Promoter Score (NPS) | quarterly email survey to paying customers | ≥ 35 |

### Per-channel CAC tracking

Every link in every ad/post/email carries a UTM tag. The CAC view is
joined to the user's first-touch UTM. Channel ranking by efficiency
gets reviewed monthly; underperforming channels get cut at the next
budget cycle.

UTM convention:

```
?utm_source=tiktok&utm_medium=organic&utm_campaign=anti_cheating_w1&utm_content=math_tutor_refuse
```

### Email triggers

The signup → paid funnel uses lightweight email triggers:

- **Trigger 1:** Signup, no purchase in 3 days → email with the most
  popular one-time product ($4-$5 entry).
- **Trigger 2:** First purchase → email with the bundle that contains
  that product, comparing single-tool monthly cost vs. bundle.
- **Trigger 3:** Two purchases in 30 days → email with the
  All-Access Pass ($79 one-time vs. their current spending pattern).
- **Trigger 4:** No usage in 21 days → re-engagement email featuring
  a different tool than the one they bought.

Emails go through Resend (the same email provider already wired in
for the OWNER 2FA flow). Templates live in `src/lib/email-templates.ts`.

---

## 10. What we deliberately do NOT advertise

This is a hard rule. The student-facing campaign is for **students
and parents-of-students paying for their own kid's learning**. The
B2B side of Limud — districts, schools, teachers, parents-as-account-
holders for whole classes — has a separate funnel, separate pricing,
separate sales motion. Mixing them muddies both.

### Off-limits in this campaign

- **District features.** SSO, district analytics, custom AI training,
  bulk provisioning — none of it appears in any campaign asset.
- **Teacher dashboards.** Teacher-side AI grading, assignment
  authoring, materials upload, AI Check-In, AI Builder — none of it.
- **Parent reports.** Weekly digests, multi-child dashboards, the
  Parent Loop, child progress alerts — none of it.
- **Admin tools.** Anything under `/admin/**`.
- **The Family tier.** "Free for up to 5 children" is a district/family
  side feature. It's true and useful, but it's a different audience.
  Mixing it into a teen-targeted Shorts ad confuses both segments.
- **The OWNER role.** Internal-only. Never marketed.
- **Pricing tiers FREE / STARTER / GROWTH / STANDARD / PREMIUM /
  ENTERPRISE.** These are the district-side tiers, not products.

### Why this matters

A teen on TikTok seeing an ad that talks about "teacher dashboards"
won't connect to the message. A district admin seeing an ad that
talks about "$4 per exam" won't think Limud is enterprise-grade.
Each audience needs its own copy. This document covers one of them.

If the brand needs a B2B-side campaign plan, that's a separate file —
suggested name: `marketing/CAMPAIGN_PLAN_DISTRICTS.md`. Don't put it
here.

---

## 11. Reference assets and where they live

| Asset | Path | Used for |
|---|---|---|
| 55-second vertical ad (current) | `marketing/limud_ad_short.mp4` | YouTube Shorts, TikTok |
| InVideo script + editor steps | `marketing/InVideo_Script.md` | Producing the ad in InVideo AI |
| Full AI production brief | `marketing/AI_VIDEO_BRIEF.md` | Brand kit, scene-by-scene, AI-adapter notes |
| Live products page | `src/app/products/page.tsx` | Source of truth for product list |
| Products catalog (data only) | `src/lib/products-catalog.ts` | Source of truth for prices |
| Bundles catalog | `src/lib/bundles.ts` | Source of truth for bundles |
| Email templates | `src/lib/email-templates.ts` | Email-trigger copy |
| OWNER finances dashboard | `src/app/owner/finances/page.tsx` | Revenue, MRR, per-product breakdown |

When the live site's prices, products, or bundles drift from this
document, the live site wins. Update this file in the same commit.

---

*End of document. Updates go in `CHANGELOG.md`; this file gets
revised when channels, audiences, or messaging shift.*
