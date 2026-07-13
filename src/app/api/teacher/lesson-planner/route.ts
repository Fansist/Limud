/**
 * AI Lesson Planner API — v17.2
 *
 * POST: Generate a full, standards-aligned lesson plan with real Gemini AI.
 *
 * Mirrors the auth / rate-limit / demo-fallback pattern of ai-builder and
 * quiz-generator: it attempts real AI generation, and on any failure (or when
 * no API key is configured) returns a graceful, fully-formed *template* lesson
 * plan together with an `aiError` describing why AI was unavailable. The
 * response is always 200 with a complete `lessonPlan` so the client renders a
 * usable plan either way.
 *
 * Response shape matches what src/app/teacher/lesson-planner/page.tsx expects:
 *   { lessonPlan, aiGenerated, aiError, aiStatus }
 * The page uses `data.lessonPlan` when the request is 2xx and reads
 * `data.aiGenerated` to choose the success toast.
 */
import { NextResponse } from 'next/server';
import { requireAuth, apiHandler, hasTeacherAccess } from '@/lib/middleware';
import { callGemini, hasApiKey, extractJSON, getAIStatus } from '@/lib/ai';
import { log } from '@/lib/log';

export const maxDuration = 60;

// ── Types (server-side mirror of the client LessonPlan shape) ────────────────

interface LessonSection {
  title: string;
  duration: number;
  description: string;
  teacherActions: string[];
  studentActions: string[];
  materials: string[];
  tips?: string;
}

interface LessonPlan {
  id: string;
  title: string;
  subject: string;
  gradeLevel: string;
  topic: string;
  duration: number;
  format: string;
  objectives: string[];
  standards: string[];
  essentialQuestion: string;
  vocabulary: string[];
  sections: LessonSection[];
  assessment: { formative: string[]; summative: string };
  differentiation: { struggling: string; onLevel: string; advanced: string };
  homework: string;
  reflectionPrompts: string[];
  materials: string[];
  bloomsLevel: string;
  generatedAt: string;
}

// ── Reference data (labels/verbs used for the prompt + template fallback) ────
// Keys mirror the ids the client page stores on the plan (subject/format/
// bloomsLevel), so the page's `SUBJECTS.find(s => s.id === plan.subject)`
// style lookups keep working.

const SUBJECT_LABELS: Record<string, string> = {
  math: 'Mathematics', science: 'Science', biology: 'Biology', chemistry: 'Chemistry',
  physics: 'Physics', english: 'English / ELA', history: 'History', geography: 'Geography',
  cs: 'Computer Science', art: 'Art', music: 'Music', foreign: 'Foreign Language',
};

const FORMAT_LABELS: Record<string, string> = {
  direct: 'Direct Instruction', inquiry: 'Inquiry-Based', workshop: 'Workshop Model',
  flipped: 'Flipped Classroom', collaborative: 'Collaborative', project: 'Project-Based',
};

const BLOOMS: Record<string, { label: string; verbs: string[] }> = {
  remember: { label: 'Remember', verbs: ['define', 'list', 'recall'] },
  understand: { label: 'Understand', verbs: ['explain', 'summarize', 'describe'] },
  apply: { label: 'Apply', verbs: ['solve', 'demonstrate', 'use'] },
  analyze: { label: 'Analyze', verbs: ['compare', 'contrast', 'examine'] },
  evaluate: { label: 'Evaluate', verbs: ['justify', 'critique', 'assess'] },
  create: { label: 'Create', verbs: ['design', 'construct', 'produce'] },
};

const VOCAB_BY_SUBJECT: Record<string, string[]> = {
  math: ['variable', 'equation', 'coefficient', 'function', 'domain', 'range'],
  science: ['hypothesis', 'variable', 'control group', 'data', 'conclusion', 'observation'],
  biology: ['cell', 'organism', 'photosynthesis', 'mitosis', 'DNA', 'ecosystem'],
  chemistry: ['element', 'compound', 'molecule', 'reaction', 'catalyst', 'bond'],
  physics: ['force', 'velocity', 'acceleration', 'energy', 'momentum', 'wave'],
  english: ['thesis', 'evidence', 'analysis', 'rhetoric', 'narrative', 'syntax'],
  history: ['primary source', 'civilization', 'revolution', 'constitution', 'imperialism', 'democracy'],
  geography: ['latitude', 'longitude', 'climate', 'erosion', 'population', 'migration'],
  cs: ['algorithm', 'variable', 'loop', 'function', 'debugging', 'data structure'],
  art: ['composition', 'perspective', 'medium', 'contrast', 'texture', 'form'],
  music: ['tempo', 'rhythm', 'melody', 'harmony', 'dynamics', 'timbre'],
  foreign: ['conjugation', 'noun', 'adjective', 'syntax', 'idiom', 'pronunciation'],
};

const ALLOWED_DURATIONS = [30, 45, 50, 60, 90];

function coerceDuration(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return 50;
  // Clamp to a sensible class-period range; keep whole minutes.
  return Math.min(180, Math.max(15, Math.round(n)));
}

// ── AI prompt ────────────────────────────────────────────────────────────────

const PLANNER_SYSTEM_PROMPT = `You are an expert K-12 instructional designer. You create complete, standards-aligned lesson plans that a teacher can run as-is.

Given a subject, grade level, topic, class duration, teaching format, and target Bloom's level, produce ONE lesson plan.

Respond with ONLY a single JSON object (no markdown fences, no commentary). Use exactly this shape:
{
  "title": "Concise lesson title",
  "objectives": ["Students will be able to ...", "..."],
  "standards": ["CCSS or subject-appropriate standard code — short description", "..."],
  "essentialQuestion": "One open-ended driving question.",
  "vocabulary": ["term1", "term2", "..."],
  "sections": [
    {
      "title": "Warm-Up / Bell Ringer",
      "duration": 5,
      "description": "What happens in this segment.",
      "teacherActions": ["...", "..."],
      "studentActions": ["...", "..."],
      "materials": ["...", "..."],
      "tips": "Optional short tip."
    }
  ],
  "assessment": { "formative": ["...", "..."], "summative": "One sentence describing summative assessment." },
  "differentiation": { "struggling": "...", "onLevel": "...", "advanced": "..." },
  "homework": "One short homework description.",
  "reflectionPrompts": ["...", "..."],
  "materials": ["...", "..."]
}

RULES:
- Provide 4-6 timed sections. The section "duration" values MUST sum to the total class duration.
- 3-4 learning objectives, each phrased "Students will be able to ..." and aligned to the requested Bloom's level.
- Tailor everything to the requested teaching format and grade level.
- Keep language classroom-ready and specific to the topic.`;

// ── Template fallback ────────────────────────────────────────────────────────
// A complete, fully-formed plan used when AI is unavailable or fails. Every
// array the client renders is populated so the page never crashes.

function buildTemplateLessonPlan(params: {
  subject: string;
  gradeLevel: string;
  topic: string;
  duration: number;
  format: string;
  bloomsLevel: string;
}): LessonPlan {
  const { subject, gradeLevel, topic, duration, format, bloomsLevel } = params;
  const subjectLabel = SUBJECT_LABELS[subject] || subject;
  const formatLabel = FORMAT_LABELS[format] || 'Standard';
  const blooms = BLOOMS[bloomsLevel] || BLOOMS.apply;
  const topicTitle = topic.trim() || `${subjectLabel} Fundamentals`;
  const topicLower = topicTitle.toLowerCase();

  // Distribute time across sections based on the total duration.
  const warmUp = Math.max(5, Math.round(duration * 0.1));
  const intro = Math.round(duration * 0.15);
  const mainActivity = Math.round(duration * 0.4);
  const practice = Math.round(duration * 0.2);
  const wrapUp = Math.max(1, duration - warmUp - intro - mainActivity - practice);

  const sections: LessonSection[] = [
    {
      title: 'Warm-Up / Bell Ringer',
      duration: warmUp,
      description: `A quick ${warmUp}-minute opener that activates prior knowledge about ${topicLower}.`,
      teacherActions: ['Display the bell ringer prompt', 'Circulate and check for understanding', 'Call on 2-3 students to share'],
      studentActions: ['Answer the prompt in notebooks', 'Share with an elbow partner', 'Volunteer a response'],
      materials: ['Bell ringer slide/prompt', 'Student notebooks'],
      tips: 'Use this time to take attendance while students work.',
    },
    {
      title: format === 'inquiry' ? 'Inquiry Launch' : format === 'workshop' ? 'Mini-Lesson' : 'Introduction / Direct Instruction',
      duration: intro,
      description: `Introduce ${topicLower} with clear explanations, visuals, and worked examples.`,
      teacherActions: [`Present key vocabulary for ${topicLower}`, 'Model the concept with a think-aloud', 'Check for understanding', 'Address common misconceptions'],
      studentActions: ['Take structured notes on a graphic organizer', 'Ask clarifying questions', 'Complete a guided example'],
      materials: ['Presentation slides', 'Graphic organizer handout', 'Whiteboard/markers'],
    },
    {
      title: format === 'collaborative' ? 'Group Exploration' : format === 'inquiry' ? 'Investigation & Discovery' : format === 'project' ? 'Project Work Session' : 'Main Activity / Guided Practice',
      duration: mainActivity,
      description: `Students apply ${topicLower} through hands-on practice with decreasing scaffolding.`,
      teacherActions: ['Monitor progress and give targeted feedback', 'Pull small groups for reteaching', 'Ask probing questions', 'Track participation'],
      studentActions: [format === 'collaborative' ? 'Collaborate with group members' : 'Work through practice tasks', `Apply ${blooms.label.toLowerCase()}-level thinking`, 'Record observations and solutions'],
      materials: ['Activity worksheet', 'Manipulatives/supplies', 'Timer display'],
      tips: format === 'collaborative' ? 'Assign clear roles: facilitator, recorder, reporter, timekeeper.' : 'Set a visible timer to help students pace themselves.',
    },
    {
      title: 'Independent Practice / Application',
      duration: practice,
      description: `Students independently demonstrate mastery of ${topicLower}.`,
      teacherActions: ['Circulate for individual conferencing', 'Provide differentiated support', "Note common errors for tomorrow's warm-up"],
      studentActions: ['Complete independent practice', 'Self-check with the provided key', 'Begin homework if finished early'],
      materials: ['Independent practice worksheet', 'Answer key for self-check'],
    },
    {
      title: 'Closure / Exit Ticket',
      duration: wrapUp,
      description: `Summarize learning and assess understanding of ${topicLower} with an exit ticket.`,
      teacherActions: ['Facilitate a "what did we learn?" discussion', 'Distribute and collect exit tickets', "Preview tomorrow's lesson"],
      studentActions: ['Complete the 3-question exit ticket', 'Share one takeaway with a partner', 'Pack up and prepare to transition'],
      materials: ['Exit ticket (printed or digital)', 'Collection bin'],
      tips: "Use exit ticket data to inform tomorrow's warm-up and grouping.",
    },
  ];

  return {
    id: `lp-${Date.now()}`,
    title: `${topicTitle} — ${formatLabel} Lesson`,
    subject,
    gradeLevel,
    topic: topicTitle,
    duration,
    format,
    objectives: [
      `Students will be able to ${blooms.verbs[0]} the key concepts of ${topicLower} (${blooms.label})`,
      `Students will be able to ${blooms.verbs[1] || 'demonstrate'} their understanding through ${format === 'collaborative' ? 'group work' : format === 'inquiry' ? 'investigation' : 'guided practice'}`,
      `Students will ${blooms.verbs[2] || 'apply'} ${topicLower} concepts to real-world scenarios`,
    ],
    standards: [
      `${subjectLabel.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4)}.${gradeLevel.replace(/[^0-9]/g, '') || '6'}.1 — Core content standard for ${topicLower}`,
      `${subjectLabel.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4)}.${gradeLevel.replace(/[^0-9]/g, '') || '6'}.2 — Application and critical thinking`,
    ],
    essentialQuestion: `How does understanding ${topicLower} help us make sense of the world around us?`,
    vocabulary: VOCAB_BY_SUBJECT[subject] || ['concept', 'principle', 'theory', 'application', 'analysis', 'synthesis'],
    sections,
    assessment: {
      formative: ['Thumbs up/down checks during instruction', 'Circulate and observe during guided practice', 'Exit ticket (3 quick-check questions)'],
      summative: `Unit assessment will include ${topicLower} concepts (scheduled for end of unit).`,
    },
    differentiation: {
      struggling: 'Provide sentence starters, graphic organizers, and paired support. Allow extended time and use manipulatives for concrete understanding.',
      onLevel: 'Follow the standard lesson flow with opportunities for peer discussion and self-pacing through practice activities.',
      advanced: 'Offer enrichment problems, challenge extensions, or peer-tutoring roles. Encourage creative application of concepts.',
    },
    homework: `Complete the "${topicTitle} Practice" worksheet (problems 1-10). Estimated time: 15-20 minutes. Due next class.`,
    reflectionPrompts: [
      "What went well in today's lesson?",
      'Which students need additional support?',
      'What would I change for next time?',
      'Did the pacing work? Too fast/slow?',
    ],
    materials: [
      'Presentation slides / interactive whiteboard',
      'Student notebooks / graphic organizers',
      'Practice worksheets (differentiated versions)',
      'Exit ticket slips',
      'Timer / clock display',
    ],
    bloomsLevel,
    generatedAt: new Date().toISOString(),
  };
}

// ── AI output normalization ──────────────────────────────────────────────────
// Overlay validated AI fields onto the template skeleton. Anything the model
// omits or returns malformed keeps the template value, guaranteeing a complete
// plan the client can render without runtime errors. Identity fields
// (subject/gradeLevel/format/bloomsLevel/duration/id) are always taken from the
// request so the page's id-based lookups keep working.

function str(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function strArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  const cleaned = value.filter((v): v is string => typeof v === 'string' && v.trim().length > 0).map(v => v.trim());
  return cleaned.length > 0 ? cleaned : null;
}

function normalizeSections(value: unknown, fallback: LessonSection[]): LessonSection[] {
  if (!Array.isArray(value)) return fallback;
  const sections = value
    .map((raw): LessonSection | null => {
      if (!raw || typeof raw !== 'object') return null;
      const r = raw as Record<string, unknown>;
      const title = str(r.title);
      const description = str(r.description);
      if (!title || !description) return null;
      const durationNum = typeof r.duration === 'number' ? r.duration : Number(r.duration);
      return {
        title,
        duration: Number.isFinite(durationNum) && durationNum > 0 ? Math.round(durationNum) : 5,
        description,
        teacherActions: strArray(r.teacherActions) || [],
        studentActions: strArray(r.studentActions) || [],
        materials: strArray(r.materials) || [],
        ...(str(r.tips) ? { tips: str(r.tips) as string } : {}),
      };
    })
    .filter((s): s is LessonSection => s !== null);
  return sections.length > 0 ? sections : fallback;
}

function mergeAiPlan(template: LessonPlan, raw: Record<string, unknown>): LessonPlan {
  const assessmentRaw = (raw.assessment && typeof raw.assessment === 'object') ? raw.assessment as Record<string, unknown> : {};
  const diffRaw = (raw.differentiation && typeof raw.differentiation === 'object') ? raw.differentiation as Record<string, unknown> : {};

  return {
    // Identity / config fields always come from the request-derived template.
    id: template.id,
    subject: template.subject,
    gradeLevel: template.gradeLevel,
    duration: template.duration,
    format: template.format,
    bloomsLevel: template.bloomsLevel,
    generatedAt: template.generatedAt,
    // Content fields prefer valid AI output, else fall back to the template.
    title: str(raw.title) || template.title,
    topic: str(raw.topic) || template.topic,
    objectives: strArray(raw.objectives) || template.objectives,
    standards: strArray(raw.standards) || template.standards,
    essentialQuestion: str(raw.essentialQuestion) || template.essentialQuestion,
    vocabulary: strArray(raw.vocabulary) || template.vocabulary,
    sections: normalizeSections(raw.sections, template.sections),
    assessment: {
      formative: strArray(assessmentRaw.formative) || template.assessment.formative,
      summative: str(assessmentRaw.summative) || template.assessment.summative,
    },
    differentiation: {
      struggling: str(diffRaw.struggling) || template.differentiation.struggling,
      onLevel: str(diffRaw.onLevel) || template.differentiation.onLevel,
      advanced: str(diffRaw.advanced) || template.differentiation.advanced,
    },
    homework: str(raw.homework) || template.homework,
    reflectionPrompts: strArray(raw.reflectionPrompts) || template.reflectionPrompts,
    materials: strArray(raw.materials) || template.materials,
  };
}

// ── Route handler ────────────────────────────────────────────────────────────

export const POST = apiHandler(async (req: Request) => {
  const user = await requireAuth();
  if (!hasTeacherAccess(user) && user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Teachers and admins only' }, { status: 403 });
  }

  const body = await req.json();
  const {
    subject,
    gradeLevel,
    topic,
    duration,
    format = 'direct',
    bloomsLevel = 'apply',
    customNotes = '',
  } = body || {};

  if (!subject || !gradeLevel || typeof topic !== 'string' || topic.trim().length < 3) {
    return NextResponse.json(
      { error: 'Subject, grade level, and a topic (min 3 characters) are required' },
      { status: 400 }
    );
  }

  const safeDuration = coerceDuration(duration);
  const safeFormat = typeof format === 'string' && format.trim() ? format : 'direct';
  const safeBlooms = typeof bloomsLevel === 'string' && bloomsLevel.trim() ? bloomsLevel : 'apply';

  // Complete template plan — used as-is on fallback, or as the merge skeleton
  // when AI succeeds.
  const template = buildTemplateLessonPlan({
    subject,
    gradeLevel,
    topic,
    duration: safeDuration,
    format: safeFormat,
    bloomsLevel: safeBlooms,
  });

  let lessonPlan: LessonPlan = template;
  let aiGenerated = false;
  let aiError: string | null = null;

  // ── Attempt real AI generation ──
  if (hasApiKey()) {
    const subjectLabel = SUBJECT_LABELS[subject] || String(subject);
    const formatLabel = FORMAT_LABELS[safeFormat] || 'Standard';
    const blooms = BLOOMS[safeBlooms] || BLOOMS.apply;

    const userPrompt = [
      'Create a complete lesson plan for:',
      `Subject: ${subjectLabel}`,
      `Grade Level: ${gradeLevel}`,
      `Topic: ${topic.trim()}`,
      `Class Duration: ${safeDuration} minutes (section durations must sum to this)`,
      `Teaching Format: ${formatLabel}`,
      `Target Bloom's Level: ${blooms.label} (verbs: ${blooms.verbs.join(', ')})`,
      customNotes && typeof customNotes === 'string' ? `\nAdditional Teacher Notes: ${String(customNotes).substring(0, 1500)}` : '',
      '',
      'Return ONLY the JSON object described in the system prompt. No markdown, no extra text.',
    ].filter(Boolean).join('\n');

    const messages = [
      { role: 'system', content: PLANNER_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ];

    try {
      log.debug('LESSON-PLANNER', `Calling Gemini for "${topic.trim()}" (${subjectLabel}, ${gradeLevel}, ${safeDuration}min)...`);
      const response = await callGemini(messages, { temperature: 0.7, maxTokens: 8000 });
      log.debug('LESSON-PLANNER', `Gemini response length: ${response.length} chars`);

      const jsonStr = extractJSON(response);
      if (!jsonStr) {
        aiError = 'AI responded but JSON extraction failed';
        console.error('[LESSON-PLANNER] extractJSON returned null. Preview:', response.substring(0, 300));
      } else {
        const parsed = JSON.parse(jsonStr);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          lessonPlan = mergeAiPlan(template, parsed as Record<string, unknown>);
          aiGenerated = true;
          log.debug('LESSON-PLANNER', `SUCCESS: AI-generated plan with ${lessonPlan.sections.length} sections`);
        } else {
          aiError = 'AI returned JSON but it was not an object';
          console.error('[LESSON-PLANNER] Parsed JSON is not an object:', Array.isArray(parsed) ? 'array' : typeof parsed);
        }
      }
    } catch (err) {
      aiError = (err as Error).message;
      console.error('[LESSON-PLANNER] AI generation failed:', aiError);
    }
  } else {
    aiError = getAIStatus().reason || 'No API key configured';
  }

  if (!aiGenerated) {
    log.debug('LESSON-PLANNER', `Using template fallback. Reason: ${aiError || 'unknown'}`);
  }

  return NextResponse.json({
    lessonPlan,
    aiGenerated,
    aiError,
    aiStatus: getAIStatus(),
  });
}, { rateLimit: 'ai' });
