---
description: Onboard the AI into a specific role from ROLES-GUIDE.md and read the project files
argument-hint: <ROLE_NAME> (e.g. CODER, TESTER, RESEARCHER, ARCHITECT, REVIEWER, DEBUGGER, WRITER)
---

# /onboard — Role Onboarding

You are being onboarded into a specific role for this codebase. The role is:

**$ARGUMENTS**

If `$ARGUMENTS` is empty, ask the user which role to onboard into and STOP. Valid roles: RESEARCHER, ARCHITECT, CODER, TESTER, REVIEWER, DEBUGGER, WRITER, COO.

---

## STEP 1 — Read the Roles Guide (MANDATORY)

Use the Read tool on `ROLES-GUIDE.md`:
1. First try `./ROLES-GUIDE.md` in the current working directory
2. If not found, use Glob `**/ROLES-GUIDE.md` to locate it

Read the **entire** file. Do not skim. Do not stop at section 0.

If the guide cannot be found, STOP and tell the user.

---

## STEP 2 — Internalize Your Role

Find the section in `ROLES-GUIDE.md` for the role: **$ARGUMENTS**

Then read every other role's section as well — you need to know who hands off to you and who you hand off to. The interaction map (section 9) is required reading.

---

## STEP 3 — Read the Project Files

Now read **everything relevant** in the project so you have full context. Use this order:

1. **Project overview docs** — Read ALL of:
   - `README.md`
   - `CHANGELOG.md`
   - `LIMUD-DEVELOPER-GUIDE.txt` (if it exists)
   - Any other `*.md` files in the project root

2. **Project structure** — Use Glob to map the codebase:
   - `**/*.{ts,tsx,js,jsx}` for source files
   - `prisma/schema.prisma` for the data model
   - `package.json` for dependencies and scripts

3. **Role-specific deep reads** — Based on your role (**$ARGUMENTS**), read the files that role typically touches according to `ROLES-GUIDE.md`. For example:
   - CODER → read `src/lib/auth.ts`, `src/lib/db.ts`, `src/lib/ai.ts`, sample pages and API routes
   - TESTER → read existing test files, `package.json` test scripts
   - REVIEWER → read `src/lib/auth.ts`, middleware, a sample of API routes
   - RESEARCHER → broad sweep across `src/app/api/**` and `src/lib/**`
   - ARCHITECT → `prisma/schema.prisma`, `src/lib/**`, route structure
   - DEBUGGER → `src/lib/**`, error handling patterns
   - WRITER → `README.md`, `CHANGELOG.md`, `LIMUD-DEVELOPER-GUIDE.txt`

Read files **in full** when they are short. For long files, read enough to understand structure and conventions.

---

## STEP 4 — Confirm Onboarding

When done, output an **Onboarding Report** in this exact format:

```
╔══════════════════════════════════════════════════════╗
║                ONBOARDING COMPLETE                   ║
╠══════════════════════════════════════════════════════╣
║ ROLE: $ARGUMENTS                                     ║
╠══════════════════════════════════════════════════════╣
║ MY MISSION:                                          ║
║   [one-line summary of what this role does]          ║
╠══════════════════════════════════════════════════════╣
║ I HAND OFF TO:                                       ║
║   [list of roles you pass work to]                   ║
╠══════════════════════════════════════════════════════╣
║ I RECEIVE FROM:                                      ║
║   [list of roles that pass work to you]              ║
╠══════════════════════════════════════════════════════╣
║ FILES READ:                                          ║
║   [count + list of key files you read]               ║
╠══════════════════════════════════════════════════════╣
║ KEY CONVENTIONS I MUST FOLLOW:                       ║
║   [bullet list of project conventions]               ║
╠══════════════════════════════════════════════════════╣
║ PITFALLS I WILL AVOID:                               ║
║   [bullet list from my role's pitfalls section]      ║
╠══════════════════════════════════════════════════════╣
║ READY FOR: [first task description]                  ║
╚══════════════════════════════════════════════════════╝
```

Then ask the user: **"I'm onboarded as $ARGUMENTS. What do you want me to do?"**

---

## Rules

1. Do NOT skip Step 1 — the guide is the source of truth
2. Do NOT pretend to read files you didn't actually Read
3. Stay strictly inside your role from this point forward — don't do other roles' jobs
4. If the user gives you a task that belongs to a different role, say so and recommend `/work` or `/pwork` instead
