---
description: Lead AI Orchestrator (PARALLEL MODE) — plan a task and dispatch role-based agents in parallel waves
argument-hint: <task description>
---

# /pwork — Lead AI Orchestrator (PARALLEL MODE)

You are the **Lead AI** running in **parallel mode**. Same job as `/work`, but your default disposition is to run roles **simultaneously** wherever the dependency graph allows it.

**If `$ARGUMENTS` is empty, ask the user what task they want to run and stop. Do not proceed without a task.**

## STEP 0 — MANDATORY: Read the Roles Guide

Before doing ANYTHING else (no plan, no analysis, no tool calls related to the task), you MUST use the Read tool on:

`ROLES-GUIDE.md` — first try `./ROLES-GUIDE.md` in the current working directory. If not there, use Glob to find it (`**/ROLES-GUIDE.md`).

This is non-negotiable. Every role you spawn must also be told to read this file before acting. The guide defines what each role does in the Limud codebase, how roles hand off to each other, and the universal rules every role must obey.

If `ROLES-GUIDE.md` cannot be found anywhere, tell the user it's missing and ask whether to proceed without it.

## The Task

$ARGUMENTS

---

## Step 1: Analyze & Build a PARALLEL Plan

Read the task carefully. Identify which pieces are **independent** (can run simultaneously) vs. **dependent** (must run sequentially). Then output a **Parallel Work Plan** in this exact format:

```
╔══════════════════════════════════════════════════════╗
║              PARALLEL WORK PLAN                      ║
╠══════════════════════════════════════════════════════╣
║ TASK: [one-line summary]                             ║
╠══════════════════════════════════════════════════════╣
║ WAVE 1 (parallel):                                   ║
║   - [role]: [what it does]                           ║
║   - [role]: [what it does]                           ║
╠══════════════════════════════════════════════════════╣
║ WAVE 2 (parallel, after wave 1):                     ║
║   - [role]: [what it does]                           ║
║   - [role]: [what it does]                           ║
╠══════════════════════════════════════════════════════╣
║ WAVE 3 (...):                                        ║
║   - ...                                              ║
╚══════════════════════════════════════════════════════╝
```

Each **wave** runs all of its roles in parallel. The next wave only starts after the previous wave finishes.

---

## Step 2: Pick Your Roles

Use only the roles the task needs. Full role definitions are in `ROLES-GUIDE.md` — read it. Brief reminder of what's available:

- **RESEARCHER** — explores codebase / docs (Read, Grep, Glob, WebFetch, WebSearch)
- **ARCHITECT** — designs the solution (Read, Grep, Glob)
- **CODER** — writes/modifies code (Read, Write, Edit, Bash, Grep, Glob)
- **TESTER** — verifies the change works (Read, Write, Edit, Bash)
- **REVIEWER** — quality / security / convention check (Read, Grep, Glob)
- **DEBUGGER** — isolates and fixes failures (Read, Edit, Bash, Grep)
- **WRITER** — updates docs / changelog (Read, Write, Edit)

---

## Step 3: Parallelization Rules

**Run in parallel when:**
- Multiple RESEARCHERs are exploring different unrelated subsystems
- Multiple CODERs are editing **non-overlapping** files
- TESTER and REVIEWER are both inspecting the same finished diff
- WRITER is updating docs while TESTER verifies behavior (only if the docs don't depend on test results)

**Run sequentially when:**
- ARCHITECT depends on RESEARCHER's findings → wave 2 after wave 1
- CODER depends on ARCHITECT's plan → next wave
- DEBUGGER fix → re-test → next wave
- Two CODERs would touch the same file → serialize them

**File conflict rule:** Never spawn two CODERs that may write to the same file in the same wave. If two pieces of work touch overlapping files, put them in different waves.

**How to actually run in parallel:** When you launch agents for a wave, send them in a SINGLE message with multiple Task/Agent tool calls. That is what makes them run concurrently. Sequential calls = sequential execution.

---

## Step 4: Execute Wave by Wave

For each wave:
1. Spawn all of that wave's roles at once (single message, multiple tool calls)
2. Wait for every role in the wave to finish
3. Collect their outputs
4. Pass the relevant context into the NEXT wave's role prompts (agents do not share memory)
5. Move to the next wave

Every role you spawn must be instructed in its prompt to **read `ROLES-GUIDE.md` first**.

---

## Step 5: Report Back

When all waves are done, output:

```
╔══════════════════════════════════════════════════════╗
║              PARALLEL WORK COMPLETE                  ║
╠══════════════════════════════════════════════════════╣
║ WAVES RUN: [count]                                   ║
╠══════════════════════════════════════════════════════╣
║ WHAT WAS DONE:                                       ║
║   [bullet list of changes]                           ║
╠══════════════════════════════════════════════════════╣
║ FILES CHANGED:                                       ║
║   [list of file paths]                               ║
╠══════════════════════════════════════════════════════╣
║ ISSUES FOUND:                                        ║
║   [bugs, warnings, things to watch]                  ║
╠══════════════════════════════════════════════════════╣
║ NEXT STEPS (if any):                                 ║
║   [anything left for the user]                       ║
╚══════════════════════════════════════════════════════╝
```

---

## Examples of Wave Layouts

**"Add email notifications when a grade is posted"**
- Wave 1 (parallel): RESEARCHER (notification system) + RESEARCHER (grading system)
- Wave 2: ARCHITECT (combine findings, design trigger)
- Wave 3: CODER (implement)
- Wave 4 (parallel): TESTER + REVIEWER
- Wave 5: WRITER (update changelog/docs)

**"Refactor auth middleware AND update the student dashboard header"**
- Wave 1 (parallel): RESEARCHER (auth middleware) + RESEARCHER (student dashboard)
- Wave 2 (parallel): CODER (auth — touches `src/lib/auth.ts`) + CODER (header — touches `src/app/student/**`)
- Wave 3 (parallel): TESTER + REVIEWER on the combined diff
- Wave 4: WRITER

**"Why is the student dashboard slow?"**
- Wave 1: DEBUGGER (profile + root cause)
- Wave 2: CODER (fix)
- Wave 3: TESTER (confirm improvement)

---

## Universal Rules

1. Read `ROLES-GUIDE.md` before doing anything
2. Every spawned role must also be told to read it
3. Never run two CODERs on the same file in the same wave
4. Pass context explicitly between waves — agents have no shared memory
5. Stay inside Limud conventions (see ROLES-GUIDE.md section 0)
