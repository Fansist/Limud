/**
 * AI Service for Limud
 * Supports OpenAI API with intelligent demo fallback
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
  return !!(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'demo-mode');
}

export function hasApiKey(): boolean {
  return isOpenAIConfigured();
}

export async function callOpenAI(
  promptOrMessages: string | { role: string; content: string }[],
  temperatureOrOptions?: number | { temperature?: number; maxTokens?: number },
  maxTokens?: number
): Promise<string> {
  const { default: OpenAI } = await import('openai');
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
    model: 'gpt-4o-mini',
    messages: messages as any,
    temperature: temp,
    max_tokens: tokens,
  });

  const content = response.choices[0]?.message?.content || '';
  const result = Object.assign(content, { content });
  return result;
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

export { TUTOR_SYSTEM_PROMPT, GRADER_SYSTEM_PROMPT, callOpenAI as callOpenAIRaw };
