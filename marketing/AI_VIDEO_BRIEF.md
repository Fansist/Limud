# Limud — Vertical Short-Form Ad Video · AI Production Brief

> **You are an AI being asked to produce this video.** Read this whole
> file before doing anything. Everything you need — product names,
> prices, copy, colors, scene-by-scene shot list, audio direction,
> output specs, and adapter notes for different AI families — is here.

---

## 0. TL;DR — what you're making

A **60-second vertical (9:16) ad** for **limud.co/products**, the
individual-product line of the Limud AI learning platform. Goes
straight to YouTube Shorts and TikTok. Audience: U.S. high-school and
college students.

**Hard rules:**

- Vertical 1080×1920 (9:16), H.264 + AAC, MP4 container, ≤ 25 MB.
- Total runtime **45–60 seconds** (under 3 minutes; under 60 s gets
  Shorts/TikTok preferential treatment).
- **Advertise the products only.** Do not mention districts,
  teachers, parents, the master demo, or pricing tiers like FAMILY/
  STANDARD/PREMIUM. The 8 standalone tools + the 4 bundles. That's it.
- **Show the real website.** Every product scene must contain a real
  screenshot or screen-recording of the live limud.co page for that
  product (URLs in § 5). If you cannot capture live screenshots, you
  may build pixel-faithful mockups from the TSX in this repo, but you
  must label that case clearly in your output README.
- **Anti-cheating positioning is the differentiator.** Several
  product taglines are deliberately "won't do the work for you."
  Do not soften them.

---

## 1. Output specs (non-negotiable)

| Property              | Value                                    |
|-----------------------|------------------------------------------|
| Dimensions            | 1080×1920 px                             |
| Aspect ratio          | 9:16 (vertical)                          |
| Frame rate            | 30 fps                                   |
| Video codec           | H.264, High profile, yuv420p             |
| Video bitrate         | 1.4–2.5 Mbps (CRF 20–23 if encoding via x264) |
| Audio codec           | AAC LC, 44.1 kHz, stereo, 128 kbps       |
| Container             | MP4 (`isom`/`mp42`), faststart           |
| Duration              | 45–60 s (target 55 s)                    |
| File size             | ≤ 25 MB                                  |
| Output filename       | `marketing/limud_ad_short.mp4`           |

A reference pipeline that produces this exact output is in
`scripts/build_ad_video.py`. You may extend, replace, or ignore it —
it's a working baseline, not a requirement.

---

## 2. Brand kit (pulled from the actual TSX)

### Voice

Direct, factual, slightly contrarian. Limud's tools refuse to do the
student's work. Lean into that. No "transform your learning journey"
fluff. **Active verbs, short sentences, real prices on screen.**

### Logo

`public/logo.svg` (or `public/logo.png`) — a rounded square with the
letter "L". Brand mark color: fuchsia-pink. Wordmark: "Limud" in an
extra-bold sans (Inter / SF Pro / Arial Black acceptable
substitutes).

### Type

| Use          | Font                                          | Weight     |
|--------------|-----------------------------------------------|------------|
| Headline     | Inter / SF Pro / Arial Black / Segoe UI Bold  | extra-bold |
| Body / Sub   | Inter / SF Pro / Segoe UI                     | regular    |
| Caption chip | Inter / SF Pro / Segoe UI Bold                | bold       |

### Color palette

Take from the actual `PRODUCT_GRADS` in
`src/app/products/page.tsx` (Tailwind ring strings):

| Token        | Use                | Hex 1     | Hex 2     |
|--------------|--------------------|-----------|-----------|
| `hero`       | intro / outro      | `#7C3AED` | `#EC4899` |
| `exam-study` | Exam Study Helper  | `#D946EF` | `#EC4899` |
| `practice`   | Practice Generator | `#3B82F6` | `#6366F1` |
| `math`       | Math Tutor         | `#F97316` | `#EF4444` |
| `essay`      | Essay Coach        | `#10B981` | `#14B8A6` |
| `notes`      | Notes Cleaner      | `#F59E0B` | `#EAB308` |
| `lab`        | Lab Report Reviewer| `#06B6D4` | `#0EA5E9` |
| `citation`   | Citation Finder    | `#8B5CF6` | `#A855F7` |
| `lang`       | Language Lab       | `#F43F5E` | `#EC4899` |
| `bundles`    | Bundles            | `#D946EF` | `#3B82F6` |

Use a **diagonal gradient** of each pair as the background tile for
that product's scene. White (`#FFFFFF`) for caption pills and text.
Ink (`#111827`) for text on white surfaces.

### Iconography

Use `lucide-react`-equivalent icons. Specifically:
`Sparkles, Brain, Calculator, BookOpen, FileText, Beaker, Quote,
Languages, Package, Check, Infinity, ArrowRight`.

---

## 3. Source of truth for product data

These prices and URL slugs MUST appear exactly as written. Pulled
from `src/app/products/page.tsx` (the `PRODUCTS` array, lines
68–213) and `src/lib/bundles.ts`.

### The 8 products

| # | Name                  | URL              | One-time              | Monthly | Tagline (≤ 12 words)                                                              |
|---|-----------------------|------------------|-----------------------|---------|-----------------------------------------------------------------------------------|
| 1 | Exam Study Helper     | `/study`         | $9 / exam             | $5/mo   | Drop coursework. Get textbook, comic, diagrams, cheatsheet, or flashcards.        |
| 2 | Practice Generator    | `/practice`      | $5 / topic            | $4/mo   | Quiz yourself on any topic. MCQ, fill-in, short-answer — all AI-graded.            |
| 3 | Math Tutor            | `/math-solver`   | $7 / pack of 50       | $4/mo   | Hints. Concepts. The common trap. Never the answer.                               |
| 4 | Essay Coach           | `/essay-coach`   | $7 / draft            | $5/mo   | Mirrors your structure, names what's wobbly. Will not rewrite a sentence.         |
| 5 | Notes Cleaner         | `/notes-cleaner` | $4 / lecture          | $4/mo   | Messy notes → headings + TL;DR. Never invents content.                            |
| 6 | Lab Report Reviewer   | `/lab-report`    | $6 / report           | $4/mo   | Critiques your draft. Suggests graphs. Flags missing controls.                    |
| 7 | Citation Finder       | `/citation-finder` | $4 / pack of 25     | $3/mo   | Real sources. APA, MLA, Chicago. Flags weak claims.                               |
| 8 | Language Lab          | `/language-lab`  | $12 / semester        | $5/mo   | Spanish, French, Mandarin, Arabic. Drills anchored to your textbook.              |

### The 4 bundles

| Name                | URL                                                          | One-time | Monthly | Save  | Includes                                                |
|---------------------|--------------------------------------------------------------|----------|---------|-------|---------------------------------------------------------|
| All-Access Pass     | `/products/bundle/all-access/checkout?billing=monthly`       | $79      | $15/mo  | ~45 % | Every current + future product (all 8 today)            |
| Study Bundle        | `/products/bundle/study-bundle/checkout?billing=monthly`     | $15      | $9/mo   | ~22 % | Exam Study Helper + Practice Generator + Notes Cleaner  |
| Writing Bundle      | `/products/bundle/writing-bundle/checkout?billing=monthly`   | $12      | $8/mo   | ~20 % | Essay Coach + Citation Finder + Notes Cleaner           |
| STEM Bundle         | `/products/bundle/stem-bundle/checkout?billing=monthly`      | $14      | $9/mo   | ~25 % | Math Tutor + Lab Report Reviewer + Practice Generator   |

---

## 4. Scene-by-scene shot list

12 scenes × ≈4.5 s each, with ~0.4 s crossfades. Total ≈55 s.

### Scene 1 · INTRO (4.5 s)

- **BG:** `hero` diagonal gradient (`#7C3AED → #EC4899`).
- **Top tag chip** (white pill, ink text): `LIMUD · /products`
- **Headline** (white, extra-bold, ~110 px): `8 AI tools. One for every brain.`
- **Sub** (white 90 % opacity, ~38 px): `Built for the way you actually study.`
- **Bottom URL** (white, bold, ~56 px): `limud.co/products`
- **Motion:** logo "L" tile fades in (0.0 – 0.4 s), then headline
  writes-on left-to-right (0.4 – 1.2 s), sub fades in (1.2 – 1.6 s).
- **Audio cue:** soft pad enters at –12 dB; one bright pluck on
  headline land.

### Scene 2 · EXAM STUDY HELPER (4.5 s)

- **BG:** `exam-study` (`#D946EF → #EC4899`).
- **Top chip:** `EXAM STUDY HELPER`
- **Headline:** `Drop coursework.`
- **Sub:** `Get a textbook, comic, diagrams, cheatsheet, or flashcards.`
- **Phone mockup:** real screenshot of **limud.co/study** (mobile
  view, full first viewport). See § 5 for capture instructions.
- **Bottom caption pill:** `$9 per exam · monthly from $5`
- **Motion:** phone slides in from bottom (0.0 – 0.6 s); subtle ken-
  burns zoom 1.00 → 1.04 over the scene.

### Scene 3 · PRACTICE GENERATOR (4.5 s)

- **BG:** `practice` (`#3B82F6 → #6366F1`).
- **Top chip:** `PRACTICE GENERATOR`
- **Headline:** `Drill any topic.`
- **Sub:** `MCQ, fill-in, short-answer. AI-graded with reasoning.`
- **Phone mockup:** **limud.co/practice**
- **Bottom caption:** `$5 per topic · monthly from $4`

### Scene 4 · MATH TUTOR (4.5 s)

- **BG:** `math` (`#F97316 → #EF4444`).
- **Top chip:** `MATH TUTOR`
- **Headline:** `Hints, not answers.`
- **Sub:** `Names the concept. Hands you the next move. Flags the trap.`
- **Phone mockup:** **limud.co/math-solver**
- **Bottom caption:** `$7 pack of 50 · monthly from $4`
- **Note:** lean into the anti-cheating angle. This is the
  differentiator vs. Chegg / Photomath.

### Scene 5 · ESSAY COACH (4.5 s)

- **BG:** `essay` (`#10B981 → #14B8A6`).
- **Top chip:** `ESSAY COACH`
- **Headline:** `Your draft. Your voice.`
- **Sub:** `Limud diagnoses the wobbles. Won't rewrite one sentence.`
- **Phone mockup:** **limud.co/essay-coach**
- **Bottom caption:** `$7 per draft · monthly from $5`

### Scene 6 · NOTES CLEANER (4.5 s)

- **BG:** `notes` (`#F59E0B → #EAB308`).
- **Top chip:** `NOTES CLEANER`
- **Headline:** `Messy notes → structured study.`
- **Sub:** `Decodes abbreviations. Adds headings. TL;DR. Never invents.`
- **Phone mockup:** **limud.co/notes-cleaner**
- **Bottom caption:** `$4 per lecture · monthly from $4`

### Scene 7 · LAB REPORT REVIEWER (4.5 s)

- **BG:** `lab` (`#06B6D4 → #0EA5E9`).
- **Top chip:** `LAB REPORT REVIEWER`
- **Headline:** `You write the lab report.`
- **Sub:** `Limud makes sure it lands. Rubric-aligned critique.`
- **Phone mockup:** **limud.co/lab-report**
- **Bottom caption:** `$6 per report · monthly from $4`

### Scene 8 · CITATION FINDER (4.5 s)

- **BG:** `citation` (`#8B5CF6 → #A855F7`).
- **Top chip:** `CITATION FINDER`
- **Headline:** `Real sources. Real formats.`
- **Sub:** `APA, MLA, Chicago. Flags claims that don't hold up.`
- **Phone mockup:** **limud.co/citation-finder**
- **Bottom caption:** `$4 per pack · monthly from $3`

### Scene 9 · LANGUAGE LAB (4.5 s)

- **BG:** `lang` (`#F43F5E → #EC4899`).
- **Top chip:** `LANGUAGE LAB`
- **Headline:** `Anchored to your textbook.`
- **Sub:** `Spanish, French, Mandarin, Arabic and more — at your level.`
- **Phone mockup:** **limud.co/language-lab**
- **Bottom caption:** `$12 per semester · monthly from $5`

### Scene 10 · BUNDLES (4.5 s)

- **BG:** `bundles` (`#D946EF → #3B82F6`).
- **Top chip:** `BUNDLES`
- **Headline:** `Use 3+ tools? Save up to 45%.`
- **Sub:** `All-Access · Study · Writing · STEM. Pick yours.`
- **Phone mockup:** scroll-down screen-recording of
  **limud.co/products** to the bundle grid (or a screenshot focused
  on the 4 bundle cards).
- **Bottom caption:** `One-time or monthly. Cancel anytime.`

### Scene 11 · THE CATALOG (4.5 s)

- **BG:** indigo→pink (`#6366F1 → #EC4899`).
- **Top chip:** `THE CATALOG`
- **Headline:** `All in one place.`
- **Sub:** `Pick your tool. Buy what you keep using. Try the rest.`
- **Phone mockup:** the **limud.co/products** product grid.
- **Bottom caption:** `limud.co/products`

### Scene 12 · CTA OUTRO (5.0 s)

- **BG:** `hero` reversed (`#EC4899 → #7C3AED`).
- **Top chip:** `LIMUD`
- **Headline:** `Start free. Pay only for the tools you keep.`
- **Sub:** `Visit limud.co/products today.`
- **Bottom URL** (very large): `limud.co/products`
- **Motion:** logo bounce-in at 0.2 s, URL pulse at 4.0 s.
- **Audio cue:** pad swells +2 dB; a soft chime on URL appear.

---

## 5. Live screenshot capture spec

Capture each of these URLs at **mobile viewport 540×960 with
deviceScaleFactor 2** (= 1080×1920 effective). Use a real mobile user
agent so the responsive layout collapses correctly:

```
Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X)
AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1
```

| Filename                | URL                                                                       | Wait for selector | Settle (s) |
|-------------------------|---------------------------------------------------------------------------|-------------------|------------|
| `01_landing.png`        | `https://limud.co/`                                                       | `h1`              | 4          |
| `02_products.png`       | `https://limud.co/products`                                               | `h1`              | 4          |
| `03_study.png`          | `https://limud.co/study`                                                  | `h1`              | 5          |
| `04_practice.png`       | `https://limud.co/practice`                                               | `h1`              | 5          |
| `05_math_tutor.png`     | `https://limud.co/math-solver`                                            | `h1`              | 5          |
| `06_essay_coach.png`    | `https://limud.co/essay-coach`                                            | `h1`              | 5          |
| `07_notes_cleaner.png`  | `https://limud.co/notes-cleaner`                                          | `h1`              | 5          |
| `08_lab_report.png`     | `https://limud.co/lab-report`                                             | `h1`              | 5          |
| `09_citation.png`       | `https://limud.co/citation-finder`                                        | `h1`              | 5          |
| `10_language_lab.png`   | `https://limud.co/language-lab`                                           | `h1`              | 5          |
| `11_bundles.png`        | `https://limud.co/products#bundles` (scroll to bundle section)            | `h1`              | 4          |
| `12_checkout.png`       | `https://limud.co/products/bundle/study-bundle/checkout?billing=monthly`  | `h1`              | 5          |

A reference Playwright script is at
`scripts/capture_screenshots.py`. Run it, save the PNGs to
`scripts/ad_screenshots/`, and use those as the phone-mockup contents
in scenes 2–11.

**If your environment cannot launch a real browser**, build pixel-
faithful mockups in PIL/Cairo/Skia from the TSX layouts at
`src/app/products/page.tsx` and `src/components/products/MarkdownToolPage.tsx`.
A reference mockup builder is in `scripts/build_ad_video.py` (see the
`make_*_mockup` functions). State clearly in your output that the
visuals are mockups, not live captures.

---

## 6. Phone-frame treatment for product scenes

Every product scene composites the screenshot inside a phone-style
frame so the viewer reads it as "this is a real app":

- **Outer frame:** rounded rectangle, corner radius 70 px on the
  outer edge, bezel 24 px, top notch (≈28 % of width, 24 px tall,
  rounded 14 px).
- **Frame color:** `#14141C` (near-black with a hint of cool).
- **Inner content corners:** clipped at radius 56 px (frame radius –
  14).
- **Drop shadow:** Gaussian blur radius 40, offset (0, 24), 50 %
  opacity.
- **Phone position:** centered horizontally, top edge ≈ y=560 of the
  1920-tall canvas (leaves 540 px above for headline + sub + chip,
  and 260 px below for caption + spacing).
- **Phone target height:** ≈1100 px.

A reference implementation is the `phone_frame()` helper in
`scripts/build_ad_video.py`.

---

## 7. Text overlay treatment

- **Top chip:** white pill, 24–28 px padding, ink (`#111827`) text,
  bold 28 px. Position: y=80.
- **Headline:** white, extra-bold 88–110 px (size down if 2 lines).
  Word-wrap at 960 px width; center-aligned. Position: y=180.
- **Sub:** white at 90 % opacity, regular 38 px. Word-wrap at 920
  px width; center-aligned. 2-line max. Position: ~y=400.
- **Caption pill (bottom):** white, bold 36 px, center-aligned.
  Position: y=H–80–(line_h × n).

Use the SAME treatment in every scene so the viewer learns to read
the brand pattern.

---

## 8. Transitions & motion

- **Between scenes:** 0.4 s crossfade.
- **Within each scene:** subtle ken-burns scale-in `1.00 → 1.04`
  over the scene duration on the phone mockup only. Background and
  text are static (avoid text-on-text motion fatigue).
- **Intro / outro:** logo can have a small bounce-in (scale 0.6 →
  1.0, ease-out, 400 ms).
- **No 3D card flips, no swipe-blur, no whip-pans.** Keep it clean
  — the product copy does the work, not the motion.

---

## 9. Audio direction

### Music

A soft ambient pad. Synth or sample-based both fine. Mood: focused,
calm, modern — *not* hype-EDM, *not* cinematic, *not* lo-fi-hiphop.
Think the background music in an Apple software showcase.

**Reference frequency content:** sustained chord (A minor 7 or
similar) with frequencies around 110 Hz (A2), 165 Hz (E3), 220 Hz
(A3), 262 Hz (C4), 330 Hz (E4). Slight detuning + slow LFO (~0.13 Hz)
for warmth. Volume sits around –18 dB LUFS so it never competes
with on-screen text.

A reference synthesis is the `make_ambient_pad()` function in
`scripts/build_ad_video.py`. You may swap in any royalty-free track
matching this brief; do NOT use copyrighted music.

### Voiceover

**Optional and off by default.** Most TikTok / Shorts viewers watch
on mute; the headlines do the selling. If you add VO:

- US-English, 23–28 year old, warm but matter-of-fact. No infomercial
  cadence.
- Read only the headlines (one per scene), at ≈250 wpm so it fits
  in the 4.5 s window.
- Mix VO at –6 dB above the pad. Duck the pad by –4 dB while VO
  speaks.

**VO script (if used):**

```
Eight AI tools. One for every brain.
Drop coursework, get a textbook, comic, or flashcards.
Drill any topic. AI-graded with real reasoning.
Hints. Not answers.
Your draft. Your voice — we won't rewrite a sentence.
Messy notes? Structured study, no invented facts.
We critique your lab report. You write it.
Real sources. APA, MLA, Chicago.
Languages anchored to your textbook.
Three plus tools? Save up to forty-five percent.
The full catalog at limud dot co slash products.
Start free. Pay only for the tools you keep.
```

### Captions / accessibility

Burn the headline and sub onto the video as text (already in § 4). A
separate `.srt` file is nice-to-have for YouTube/TikTok auto-caption
override; use the headlines as the cue text, one cue per scene.

---

## 10. The "advertise the products only" rule — what NOT to show

Limud has a B2B district + family side that is **not** the subject
of this ad. Do not include any of the following:

- The landing page hero copy about "second teacher in the room" —
  that's the institutional pitch.
- Pricing tiers FREE / STARTER / GROWTH / STANDARD / PREMIUM / FAMILY
  / ENTERPRISE — those are for districts and homeschools, not
  individual product buyers.
- Anything about teachers, classrooms, gradebooks, parent
  notifications, district admins, or onboarding.
- Anything from `/student/**`, `/teacher/**`, `/parent/**`,
  `/admin/**` dashboards.
- The Parent Loop, Anti-Cheating Detector, AI Navigator, Mistake
  Review, study groups, or any other in-product feature.

If you take screenshots, do it on the **logged-out** view of the
public pages listed in § 5. No login state, no avatar, no role-
specific chrome.

---

## 11. Output deliverables

Place all output under `marketing/`:

```
marketing/
├── limud_ad_short.mp4          ← the final video
├── thumbnails/
│   ├── thumb_01.png            ← 1080×1920, the most "click-worthy"
│   ├── thumb_02.png               frame from scenes 2-11 (pick 3)
│   └── thumb_03.png
├── frames/                     ← (optional) the 12 scene PNGs at
│   └── scene_00.png …             1080×1920 if produced as stills first
├── captions.srt                ← burned-in captions also as SRT
└── README.md                   ← what you produced, how, any caveats
                                  (e.g. "screenshots are mockups
                                   because env blocked browser")
```

Commit none of the binaries to git unless requested. The repo has
`marketing/` ignored at the directory level (or should — add
`marketing/**/*.mp4`, `marketing/**/*.png` to `.gitignore` if not).

---

## 12. Adapter notes for different AI families

Pick the section that matches what kind of AI you are.

### 12a. If you are a **text-to-video model** (Sora / Veo / Runway / Pika / Kling)

Render each of the 12 scenes as an **independent 4.5-second clip**,
then stitch in post. For each scene, prompt the model with the
following template:

```
Vertical 9:16, 1080x1920, 30 fps, 4.5 seconds.
Scene: <copy headline + sub from §4>
Background: solid diagonal gradient from <hex1> top-left to <hex2>
  bottom-right (no other shapes).
Foreground: a single phone-style mockup centered in the lower 2/3.
  The phone screen shows: <copy the "Phone mockup" line from §4 —
  e.g. "the limud.co/study page, mobile view, hero with the title
  'Exam Study Helper', followed by an INPUT card and a 5 FORMATS card,
  and a fuchsia 'Try it now' button at the bottom">.
Camera: locked. Subtle ken-burns zoom-in on the phone (1.00 → 1.04).
Text overlay (do not render as part of the scene if your model
  burns text poorly — supply as separate compositing layer):
  - top chip: "<chip text from §4>"
  - headline: "<headline text from §4>" (white, extra-bold, very large)
  - sub: "<sub text from §4>" (white, regular, large)
  - bottom caption: "<caption text from §4>"
Style: clean, modern, Apple-software-showcase aesthetic. No people.
No motion graphics other than the ken-burns. No cinematic film grain.
No 3D card flips. No flying particles.
```

Many text-to-video models render burned-in text poorly. If yours
does, omit the text overlays from the model prompt and add them in
a post-stitch pass with ffmpeg `drawtext` or a compositor like
moviepy.

### 12b. If you are an **AI video editor agent** (CapCut AI, Descript, InVideo, Veed)

You have B-roll plus a text track. Use the screenshots from § 5 as
the B-roll. Set the project to vertical 9:16, 1080×1920. For each of
the 12 scenes:

1. Create a new "scene" of 4.5 s.
2. Place the gradient background (use a solid-color or gradient asset
   matching §2 hex pair).
3. Place the corresponding screenshot from § 5, scaled and clipped
   to a phone-frame shape (radius 56 px, drop shadow).
4. Add headline + sub + chip + caption text layers per § 4 and § 7.
5. Add the ken-burns zoom to the screenshot layer (1.00 → 1.04).
6. Add 0.4 s crossfade to the next scene.

After all scenes are placed, render the timeline and apply the audio
pad on a separate track (§ 9). Apply LUFS normalization at –18 dB.

### 12c. If you are a **code-generating AI** (Claude, GPT, Gemini, etc.)

Generate a self-contained pipeline. The reference pipeline in this
repo uses Python + Pillow + moviepy 2.x; you may reproduce or
improve it. Required behavior:

- Reads its inputs from `scripts/ad_screenshots/*.png` (if those
  exist) OR generates pixel-faithful mockups using the TSX in
  `src/app/products/**` and `src/lib/bundles.ts`.
- Builds the 12 frames per § 4.
- Concatenates with crossfades per § 8.
- Synthesizes or imports an ambient pad per § 9.
- Encodes to `marketing/limud_ad_short.mp4` per § 1.
- Prints duration + file size on completion.

**Acceptance test:** the produced MP4 must (a) be a valid file ffprobe
recognizes, (b) have video stream 1080×1920 H.264 yuv420p 30fps,
(c) have audio stream AAC LC stereo 44.1kHz, (d) be 45–60 seconds
long, (e) have all 8 product names and all 4 bundle names visible
somewhere in the visible frame timeline.

### 12d. If you are an **AI agent with browser tools** (Computer Use, browser MCP, Playwright sub-agent)

Your job is the easiest. Capture the 12 screenshots from § 5 to
`scripts/ad_screenshots/`, then either:

- Hand the screenshots to a code-gen AI and follow § 12c, or
- Run `python3 scripts/build_ad_video.py` (this repo's reference
  pipeline) and verify the MP4 output.

If `scripts/capture_screenshots.py` already exists in this repo, run
it (`LIMUD_BASE=https://limud.co python3 scripts/capture_screenshots.py`)
— it's wired up to the URL list in § 5.

---

## 13. Quality gates before you ship

Run this checklist before you call the job done:

- [ ] File is at `marketing/limud_ad_short.mp4`
- [ ] ffprobe reports 1080×1920, H.264 yuv420p, 30 fps
- [ ] Duration is 45–60 seconds
- [ ] File size ≤ 25 MB
- [ ] All 8 product names appear on screen at least once (Exam Study
      Helper, Practice Generator, Math Tutor, Essay Coach, Notes
      Cleaner, Lab Report Reviewer, Citation Finder, Language Lab)
- [ ] All 4 bundle names appear on screen at least once (All-Access
      Pass, Study Bundle, Writing Bundle, STEM Bundle)
- [ ] No district / teacher / parent / admin imagery or copy anywhere
- [ ] No copyrighted music; pad is synthesized or royalty-free
- [ ] Outro shows `limud.co/products` at large size for ≥3 s
- [ ] Plays correctly in QuickTime, Windows Media Player, and on
      mobile (iPhone Safari + Android Chrome)
- [ ] No on-screen typos; numbers match § 3 exactly

If you can't satisfy a gate, say so in your output README. Don't ship
silently broken.

---

## 14. Versioning & ownership

- This brief is `marketing/AI_VIDEO_BRIEF.md` in the Limud repo. If
  you change the brief, bump a tiny `Brief vN` line at the top so
  downstream AIs know what they're working from.
- The reference Python pipeline (`scripts/build_ad_video.py`) and
  the live-screenshot capture (`scripts/capture_screenshots.py`) are
  the working baseline. They're not authoritative — this brief is.
- Limud is a working product at `https://limud.co`. Don't make
  claims the website doesn't make. Don't invent features. Every line
  of copy in § 4 is taken directly from the live product pages or
  from `src/lib/bundles.ts`.

— end of brief —
