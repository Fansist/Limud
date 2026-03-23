/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  LIMUD v9.3.4 — AI Service                                               ║
 * ║  OpenAI-compatible API with robust error handling & demo fallback      ║
 * ║                                                                        ║
 * ║  v9.3.4 fixes:                                                           ║
 * ║  • Detects proxy credit-exhaustion / non-JSON responses                ║
 * ║  • Removes response_format: json_object (not always supported)         ║
 * ║  • Robust JSON extraction from markdown-fenced or prefixed responses   ║
 * ║  • All env vars have embedded defaults — works with zero config        ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

const TUTOR_SYSTEM_PROMPT = `You are Limud AI, a friendly and encouraging educational tutor for K-12 students. Follow these guidelines strictly:

1. NEVER give direct answers. Instead, guide students through the problem-solving process with hints, questions, and encouragement.
2. Use age-appropriate language. For younger students, use simpler words and fun analogies.
3. Break complex topics into smaller, digestible pieces.
4. Celebrate effort and progress, not just correct answers.
5. If a student is frustrated, acknowledge their feelings and offer a different approach.
6. Use emojis sparingly to keep the conversation engaging.
7. Always relate concepts to real-world examples when possible.
8. If a student asks about something inappropriate or off-topic, gently redirect them back to learning.
9. Keep responses concise (2-4 paragraphs max) unless the topic requires more detail.
10. End responses with a thought-provoking question or next step to keep the student engaged.

You are patient, supportive, and genuinely excited about helping students learn.`;

/**
 * Build a personalized system prompt that incorporates the student's survey data.
 * This makes the AI tutor use analogies from their favorite games, movies, hobbies, etc.
 */
export function buildPersonalizedPrompt(survey: {
  favoriteSubjects?: string[];
  hobbies?: string[];
  favoriteBooks?: string | null;
  favoriteMovies?: string | null;
  favoriteGames?: string | null;
  dreamJob?: string | null;
  learningStyle?: string;
  motivators?: string[];
  challenges?: string[];
  funFacts?: string | null;
} | null, subject?: string): string {
  let prompt = TUTOR_SYSTEM_PROMPT;

  if (survey) {
    prompt += '\n\n--- STUDENT PERSONALIZATION ---';
    prompt += '\nIMPORTANT: Use the following information about this student to make your explanations more engaging and relatable. Reference their interests naturally when creating analogies or examples.';

    if (survey.hobbies?.length) {
      prompt += `\n\nStudent hobbies: ${survey.hobbies.join(', ')}. Use these as analogy sources when explaining concepts. For example, if they like soccer, compare math operations to passes and goals.`;
    }
    if (survey.favoriteGames) {
      prompt += `\n\nFavorite video games: ${survey.favoriteGames}. Reference game mechanics (levels, XP, crafting, strategy) to explain concepts when relevant.`;
    }
    if (survey.favoriteMovies) {
      prompt += `\n\nFavorite movies/TV: ${survey.favoriteMovies}. Use characters and plotlines from these as relatable examples.`;
    }
    if (survey.favoriteBooks) {
      prompt += `\n\nFavorite books: ${survey.favoriteBooks}. Reference these stories when making comparisons or analogies.`;
    }
    if (survey.dreamJob) {
      prompt += `\n\nDream job: ${survey.dreamJob}. When possible, connect what they're learning to skills needed for this career.`;
    }
    if (survey.learningStyle) {
      const styleGuide: Record<string, string> = {
        visual: 'This student learns best visually. Use descriptions of diagrams, charts, and visual metaphors. Say things like "Picture this..." or "Imagine a diagram where..."',
        auditory: 'This student learns best by listening and discussing. Use conversational tone, ask them to "talk through" their thinking, and use rhythm/pattern-based explanations.',
        kinesthetic: 'This student learns best hands-on. Suggest experiments, physical activities, and real-world applications. Frame things as "Try this..." or "What if you built..."',
        reading: 'This student learns best through reading and writing. Provide well-structured written explanations, suggest note-taking strategies, and use text-based examples.',
      };
      prompt += `\n\nLearning style: ${styleGuide[survey.learningStyle] || survey.learningStyle}`;
    }
    if (survey.challenges?.length) {
      prompt += `\n\nSubjects they find challenging: ${survey.challenges.join(', ')}. Be extra patient and encouraging with these topics. Break things into even smaller steps.`;
    }
    if (survey.motivators?.length) {
      prompt += `\n\nWhat motivates them: ${survey.motivators.join(', ')}. Frame progress in terms of these motivators.`;
    }
    if (survey.funFacts) {
      prompt += `\n\nFun fact about them: ${survey.funFacts}. Occasionally reference this to build rapport.`;
    }
  }

  if (subject) {
    prompt += `\n\nThe student is currently studying: ${subject}`;
  }

  return prompt;
}

const GRADER_SYSTEM_PROMPT = `You are an expert educational grading assistant. Your job is to evaluate student submissions fairly and provide constructive, encouraging feedback. Follow these guidelines:

1. Evaluate against the provided rubric criteria.
2. Be specific about what the student did well.
3. Provide actionable suggestions for improvement.
4. Use encouraging language - focus on growth, not deficiency.
5. Assign a numerical score based on the rubric.
6. Format your response as JSON with the following structure:
{
  "score": <number>,
  "maxScore": <number>,
  "feedback": "<detailed personalized feedback>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<improvement 1>", "<improvement 2>"],
  "encouragement": "<brief encouraging closing message>"
}`;

export function isOpenAIConfigured(): boolean {
  const key = process.env.OPENAI_API_KEY || '';
  return !!(key && key !== 'demo-mode');
}

export function hasApiKey(): boolean {
  return isOpenAIConfigured();
}

/**
 * Detects proxy-level errors returned as 200 OK with plain text body.
 * Examples: "Your Genspark credits have been exhausted…"
 */
function isProxyErrorResponse(text: string): boolean {
  if (!text || text.length > 10_000) return false;
  const lower = text.toLowerCase();
  return (
    lower.includes('credits have been exhausted') ||
    lower.includes('rate limit') ||
    lower.includes('quota exceeded') ||
    lower.includes('insufficient_quota') ||
    lower.includes('billing') ||
    lower.includes('please visit') && lower.includes('pricing')
  );
}

/**
 * Extract JSON from a string that may be wrapped in markdown fences,
 * have leading/trailing text, or contain multiple JSON objects.
 */
export function extractJSON(raw: string): string | null {
  if (!raw) return null;
  let s = raw.trim();

  // Strip markdown code fences
  s = s.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();

  // Find the first { and last } for object, or first [ and last ] for array
  const firstBrace = s.indexOf('{');
  const firstBracket = s.indexOf('[');
  let start = -1;
  let end = -1;

  if (firstBrace >= 0 && (firstBracket < 0 || firstBrace < firstBracket)) {
    start = firstBrace;
    end = s.lastIndexOf('}');
  } else if (firstBracket >= 0) {
    start = firstBracket;
    end = s.lastIndexOf(']');
  }

  if (start >= 0 && end > start) {
    return s.substring(start, end + 1);
  }
  return null;
}

export async function callOpenAI(
  promptOrMessages: string | { role: string; content: string }[],
  temperatureOrOptions?: number | { temperature?: number; maxTokens?: number },
  maxTokens?: number
): Promise<string> {
  const { default: OpenAI } = await import('openai');
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'demo-mode',
    baseURL: process.env.OPENAI_BASE_URL || undefined,
  });

  let messages: { role: string; content: string }[];
  let temp: number;
  let tokens: number;

  if (typeof promptOrMessages === 'string') {
    messages = [{ role: 'user', content: promptOrMessages }];
    temp = typeof temperatureOrOptions === 'number' ? temperatureOrOptions : 0.7;
    tokens = maxTokens ?? 1024;
  } else {
    messages = promptOrMessages;
    const opts = typeof temperatureOrOptions === 'object' ? temperatureOrOptions : {};
    temp = typeof temperatureOrOptions === 'number' ? temperatureOrOptions : (opts.temperature ?? 0.7);
    tokens = maxTokens ?? (typeof temperatureOrOptions === 'object' ? temperatureOrOptions.maxTokens ?? 1024 : 1024);
  }

  const response = await openai.chat.completions.create({
    model: 'gpt-5-mini',
    messages: messages as any,
    temperature: temp,
    max_tokens: tokens,
    // NOTE: Do NOT use response_format: json_object — not all proxies support it
  });

  const content = response.choices[0]?.message?.content || '';

  // v9.3.4: Detect proxy error responses disguised as successful completions
  if (isProxyErrorResponse(content)) {
    throw new Error(`AI proxy error: ${content.substring(0, 200)}`);
  }

  return content;
}

// Smart demo responses for when no API key is configured
function getDemoTutorResponse(message: string, survey?: any): string {
  const lower = message.toLowerCase();

  // Build personalized intro based on survey data
  let personalTouch = '';
  if (survey) {
    if (survey.favoriteGames && lower.includes('math')) {
      personalTouch = `Since you love ${survey.favoriteGames}, think of this like leveling up in a game - each step gets you closer to the answer! `;
    } else if (survey.hobbies?.includes('sports')) {
      personalTouch = 'Think of this like a game plan - we need to figure out each play step by step! ';
    } else if (survey.hobbies?.includes('gaming')) {
      personalTouch = 'This is like a quest in your favorite game - let\'s figure out the puzzle together! ';
    } else if (survey.dreamJob) {
      personalTouch = `Fun fact: ${survey.dreamJob}s use skills like this every day! `;
    }
  }

  if (lower.includes('math') || lower.includes('equation') || lower.includes('solve') || lower.includes('number')) {
    return `${personalTouch}Great question about math! Let me help you think through this step by step.

The key to solving math problems is to break them down into smaller pieces. Instead of looking at the whole problem at once, let's focus on one part at a time.

**Here's a hint**: Think about what operation would help you isolate what you're looking for. What do you already know, and what are you trying to find?

Can you tell me what specific part is giving you trouble? I'd love to walk through it together!`;
  }

  if (lower.includes('science') || lower.includes('photosynthesis') || lower.includes('cell') || lower.includes('ecosystem')) {
    return `What a fascinating science topic! 🔬 Let me help you explore this.

Science is all about understanding how the world works. The best way to learn is to connect new ideas to things you already know.

💡 **Think about it this way**: Everything in nature is connected. Can you think of a real-world example that relates to what you're studying?

What specific part would you like to dive deeper into? I'm here to help you discover the answers! 🌟`;
  }

  if (lower.includes('essay') || lower.includes('write') || lower.includes('book') || lower.includes('read')) {
    return `Let's work on your writing together! 📝 Great writers are made through practice.

The secret to a strong essay is organization. Think of your writing like building a house - you need a solid foundation (your thesis), strong walls (your supporting paragraphs), and a roof to tie it all together (your conclusion).

💡 **Try this approach**: Start by jotting down 3 main ideas you want to cover. Don't worry about perfect sentences yet - just get your thoughts flowing!

What's the main point you're trying to make? Let's build from there! ✨`;
  }

  return `That's a really thoughtful question! 💡 I love your curiosity.

Let me help you think through this. The best way to understand something deeply is to:
1. **Break it down** - What are the key parts of your question?
2. **Connect it** - How does this relate to what you already know?
3. **Apply it** - Can you think of a real-world example?

🎯 **Here's what I suggest**: Start with what you understand, and we'll build from there. Sometimes the things that seem confusing become clear when we look at them from a different angle.

What part would you like to explore first? I'm right here to help! ✨`;
}

function getDemoGradeResponse(content: string, rubric: string | null, maxScore: number): string {
  const contentLength = content.length;
  const hasDetail = contentLength > 200;
  const hasExplanation = content.toLowerCase().includes('because') || content.toLowerCase().includes('step');

  let score: number;
  if (hasDetail && hasExplanation) {
    score = Math.round(maxScore * (0.82 + Math.random() * 0.15));
  } else if (hasDetail || hasExplanation) {
    score = Math.round(maxScore * (0.65 + Math.random() * 0.15));
  } else {
    score = Math.round(maxScore * (0.40 + Math.random() * 0.20));
  }

  return JSON.stringify({
    score,
    maxScore,
    feedback: `Your submission shows ${hasDetail ? 'good attention to detail' : 'room for more detailed responses'}. ${hasExplanation ? 'I appreciate that you explained your reasoning!' : 'Try to include more explanation of your thought process next time.'} Overall, you're making great progress and I can see you're putting in effort.`,
    strengths: [
      hasDetail ? 'Provided thorough detail in your response' : 'Submitted your work on time',
      hasExplanation ? 'Showed clear step-by-step reasoning' : 'Demonstrated understanding of the basics',
    ],
    improvements: [
      !hasDetail ? 'Try to include more specific details and examples' : 'Consider adding even more real-world connections',
      !hasExplanation ? 'Walk through your reasoning step by step' : 'Try to cite specific evidence from the material',
    ],
    encouragement: "Keep up the great work! Every assignment is a chance to grow, and I can see you're on the right track. 🌟",
  });
}

export async function chatWithTutor(
  messages: { role: string; content: string }[],
  subject?: string,
  surveyData?: any
): Promise<{ content: string; tokensUsed: number }> {
  if (isOpenAIConfigured()) {
    try {
      const systemPrompt = buildPersonalizedPrompt(surveyData || null, subject);
      const fullMessages = [
        { role: 'system', content: systemPrompt },
        ...messages,
      ];
      const content = await callOpenAI(fullMessages, { temperature: 0.7, maxTokens: 800 });
      return { content, tokensUsed: content.split(' ').length * 2 };
    } catch (e) {
      console.error('OpenAI tutor error, falling back to demo:', e);
    }
  }

  // Demo mode - personalized fallback
  const lastUserMessage = messages.filter(m => m.role === 'user').pop();
  const content = getDemoTutorResponse(lastUserMessage?.content || '', surveyData);
  return { content, tokensUsed: 0 };
}

export async function gradeSubmission(
  studentContent: string,
  assignmentDescription: string,
  rubric: string | null,
  maxScore: number
): Promise<{
  score: number;
  maxScore: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  encouragement: string;
}> {
  if (isOpenAIConfigured()) {
    try {
      const messages = [
        { role: 'system', content: GRADER_SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Assignment: ${assignmentDescription}\n\nRubric: ${rubric || 'Use standard academic grading criteria'}\n\nMax Score: ${maxScore}\n\nStudent Submission:\n${studentContent}`,
        },
      ];
      const result = await callOpenAI(messages, { temperature: 0.3, maxTokens: 1024 });
      try {
        return JSON.parse(result);
      } catch {
        return {
          score: Math.round(maxScore * 0.75),
          maxScore,
          feedback: result,
          strengths: ['Submitted the assignment'],
          improvements: ['Continue practicing'],
          encouragement: 'Keep learning!',
        };
      }
    } catch (e) {
      console.error('OpenAI grading error, falling back to demo:', e);
    }
  }

  // Demo mode
  const result = getDemoGradeResponse(studentContent, rubric, maxScore);
  return JSON.parse(result);
}

export { TUTOR_SYSTEM_PROMPT, GRADER_SYSTEM_PROMPT, callOpenAI as callOpenAIRaw, extractJSON as extractJSONFromAI };

// ─── TEACHER AI FEATURES ────────────────────────────────────────────────────

const REPORT_SYSTEM_PROMPT = `You are an expert educational analyst. Generate comprehensive, data-driven student progress reports for teachers. Your reports should be:

1. Professional and well-structured
2. Data-backed with specific metrics
3. Include actionable recommendations
4. Highlight both strengths and areas for growth
5. Be suitable for sharing with parents/guardians

Format your response as JSON:
{
  "summary": "Overall summary paragraph",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "areasForGrowth": ["area 1", "area 2"],
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"],
  "parentNote": "Brief note suitable for parent communication",
  "gradeProjection": "Projected end-of-term grade with reasoning",
  "behavioralNotes": "Notes on engagement, participation, effort",
  "nextSteps": ["step 1", "step 2"]
}`;

const CURRICULUM_ANALYSIS_PROMPT = `You are an expert curriculum analyst. Analyze student performance data across skills and provide:

1. Skill gap analysis with specific remediation strategies
2. Curriculum pacing recommendations
3. Differentiation suggestions for high/low performers
4. Cross-curricular connection opportunities
5. Assessment strategy recommendations

Return JSON:
{
  "skillAnalysis": [{"skill":"...","status":"mastered|progressing|struggling","recommendation":"..."}],
  "pacingRecommendation": "...",
  "differentiationStrategies": {"advanced":"...","onLevel":"...","struggling":"..."},
  "assessmentRecommendations": ["..."],
  "crossCurricularConnections": ["..."]
}`;

const WRITING_FEEDBACK_PROMPT = `You are an expert writing coach for K-12 education. Provide detailed, constructive feedback on student writing that:

1. Identifies specific grammar and mechanics issues
2. Evaluates organization and structure
3. Assesses voice and tone appropriateness
4. Checks argument strength and evidence use
5. Provides revision suggestions with examples

Return JSON:
{
  "overallScore": <0-100>,
  "categories": {
    "mechanics": {"score":<0-100>,"feedback":"...","examples":["..."]},
    "organization": {"score":<0-100>,"feedback":"...","examples":["..."]},
    "voice": {"score":<0-100>,"feedback":"...","examples":["..."]},
    "content": {"score":<0-100>,"feedback":"...","examples":["..."]},
    "creativity": {"score":<0-100>,"feedback":"...","examples":["..."]}
  },
  "strengths": ["..."],
  "revisionSuggestions": ["..."],
  "encouragement": "..."
}`;

/**
 * Generate AI-powered student progress report
 */
export async function generateStudentReport(
  studentData: {
    name: string;
    grade: string;
    subjects: { name: string; avgScore: number; trend: string; skills: string[] }[];
    attendance: number;
    engagement: number;
    streak: number;
    recentScores: number[];
  }
): Promise<any> {
  if (isOpenAIConfigured()) {
    try {
      const messages = [
        { role: 'system', content: REPORT_SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Generate a progress report for:\n\nStudent: ${studentData.name} (Grade ${studentData.grade})\n\nSubject Performance:\n${studentData.subjects.map(s => `- ${s.name}: ${s.avgScore}% avg (${s.trend}), Skills: ${s.skills.join(', ')}`).join('\n')}\n\nEngagement: ${studentData.engagement}%\nStreak: ${studentData.streak} days\nRecent Scores: ${studentData.recentScores.join(', ')}%`,
        },
      ];
      const result = await callOpenAI(messages, { temperature: 0.5, maxTokens: 1500 });
      try { return JSON.parse(result); } catch { /* fallthrough */ }
    } catch (e) { console.error('Report generation error:', e); }
  }

  // Demo fallback
  const avgScore = studentData.subjects.length > 0
    ? Math.round(studentData.subjects.reduce((a, b) => a + b.avgScore, 0) / studentData.subjects.length) : 75;
  const isStrong = avgScore >= 80;

  return {
    summary: `${studentData.name} has shown ${isStrong ? 'excellent' : 'steady'} progress this reporting period with an overall average of ${avgScore}%. ${isStrong ? 'They consistently demonstrate strong understanding and engagement.' : 'There are some areas that would benefit from additional focus and practice.'}`,
    strengths: [
      isStrong ? 'Consistently high performance across subjects' : 'Shows determination and effort',
      `${studentData.streak > 3 ? 'Excellent learning consistency with a ' + studentData.streak + '-day streak' : 'Regular participation in learning activities'}`,
      'Demonstrates growth mindset in challenging topics',
    ],
    areasForGrowth: studentData.subjects.filter(s => s.avgScore < 70).map(s => `${s.name}: Focus on ${s.skills[0] || 'core concepts'}`).slice(0, 3),
    recommendations: [
      'Continue using the AI tutor for personalized practice',
      avgScore < 70 ? 'Schedule additional review sessions for struggling subjects' : 'Challenge with advanced problems to maintain engagement',
      'Encourage peer collaboration through study groups',
    ],
    parentNote: `${studentData.name} is making ${isStrong ? 'great' : 'good'} progress. Please encourage consistent daily practice to maintain momentum.`,
    gradeProjection: `Based on current trends, projected end-of-term grade: ${avgScore >= 90 ? 'A' : avgScore >= 80 ? 'B+' : avgScore >= 70 ? 'B-' : avgScore >= 60 ? 'C' : 'C-'}`,
    behavioralNotes: `Engagement score: ${studentData.engagement}%. ${studentData.engagement >= 70 ? 'Actively participates and shows strong interest in learning.' : 'Could benefit from more interactive and engaging activities.'}`,
    nextSteps: [
      'Review spaced repetition recommendations',
      'Complete upcoming assignments before due dates',
    ],
  };
}

/**
 * AI-powered curriculum analysis for a class
 */
export async function analyzeCurriculum(
  classData: {
    subject: string;
    gradeLevel: string;
    skills: { name: string; avgMastery: number; studentCount: number }[];
    overallAvg: number;
  }
): Promise<any> {
  if (isOpenAIConfigured()) {
    try {
      const messages = [
        { role: 'system', content: CURRICULUM_ANALYSIS_PROMPT },
        {
          role: 'user',
          content: `Analyze curriculum for ${classData.gradeLevel} grade ${classData.subject}.\n\nOverall class average: ${classData.overallAvg}%\n\nSkill mastery:\n${classData.skills.map(s => `- ${s.name}: ${s.avgMastery}% avg (${s.studentCount} students)`).join('\n')}`,
        },
      ];
      const result = await callOpenAI(messages, { temperature: 0.4, maxTokens: 1500 });
      try { return JSON.parse(result); } catch { /* fallthrough */ }
    } catch (e) { console.error('Curriculum analysis error:', e); }
  }

  // Demo fallback
  return {
    skillAnalysis: classData.skills.map(s => ({
      skill: s.name,
      status: s.avgMastery >= 75 ? 'mastered' : s.avgMastery >= 50 ? 'progressing' : 'struggling',
      recommendation: s.avgMastery < 50
        ? `Dedicate additional class time to ${s.name}. Consider small group instruction.`
        : s.avgMastery < 75
        ? `Continue current instruction with added practice opportunities for ${s.name}.`
        : `${s.name} is well-understood. Consider extension activities.`,
    })),
    pacingRecommendation: classData.overallAvg < 65
      ? 'Consider slowing pace and revisiting foundational concepts before advancing.'
      : 'Current pacing is appropriate. Maintain balance between review and new material.',
    differentiationStrategies: {
      advanced: 'Provide enrichment problems, peer tutoring opportunities, and independent research projects.',
      onLevel: 'Continue with standard instruction, add collaborative learning activities.',
      struggling: 'Provide scaffolded worksheets, visual aids, and additional one-on-one support.',
    },
    assessmentRecommendations: [
      'Use formative checks every 15 minutes during instruction',
      'Implement exit tickets to gauge daily understanding',
      'Create tiered assessments for different ability levels',
    ],
    crossCurricularConnections: [
      `Connect ${classData.subject} concepts to real-world applications`,
      'Integrate writing activities to deepen understanding',
      'Use technology tools for interactive practice',
    ],
  };
}

/**
 * AI-powered writing feedback for student submissions
 */
export async function analyzeWriting(
  content: string,
  gradeLevel: string,
  assignmentType: string
): Promise<any> {
  if (isOpenAIConfigured()) {
    try {
      const messages = [
        { role: 'system', content: WRITING_FEEDBACK_PROMPT },
        {
          role: 'user',
          content: `Grade Level: ${gradeLevel}\nAssignment Type: ${assignmentType}\n\nStudent Writing:\n${content}`,
        },
      ];
      const result = await callOpenAI(messages, { temperature: 0.3, maxTokens: 1500 });
      try { return JSON.parse(result); } catch { /* fallthrough */ }
    } catch (e) { console.error('Writing analysis error:', e); }
  }

  // Demo fallback
  const wordCount = content.split(/\s+/).length;
  const hasStructure = content.includes('\n\n') || content.length > 500;
  const score = Math.min(95, Math.round(50 + (wordCount / 10) + (hasStructure ? 15 : 0)));

  return {
    overallScore: score,
    categories: {
      mechanics: { score: score + 5, feedback: 'Good use of grammar and punctuation overall.', examples: [] },
      organization: { score: hasStructure ? score + 10 : score - 10, feedback: hasStructure ? 'Well-organized with clear structure.' : 'Consider adding more paragraph breaks.', examples: [] },
      voice: { score: score, feedback: 'Writing voice is developing nicely.', examples: [] },
      content: { score: score - 5, feedback: 'Content addresses the prompt. Could benefit from more specific examples.', examples: [] },
      creativity: { score: score + 3, feedback: 'Shows creative thinking in approach.', examples: [] },
    },
    strengths: ['Addresses the assignment prompt', 'Shows understanding of the topic'],
    revisionSuggestions: ['Add more specific examples to support your points', 'Consider varying sentence structure for better flow'],
    encouragement: 'Great effort! Your writing is improving with each assignment. Keep practicing!',
  };
}

