import { NextResponse } from 'next/server';
import { requireAuth, apiHandler } from '@/lib/middleware';
import { callOpenAI, isOpenAIConfigured } from '@/lib/ai';
import prisma from '@/lib/prisma';

/**
 * AI Navigation Assistant API
 * Helps students navigate the platform, find assignments, grades, rewards, and more.
 * Uses real student data to provide contextual, helpful responses.
 */

const NAVIGATOR_SYSTEM_PROMPT = `You are Limud Navigator, an AI assistant that helps students navigate the Limud learning platform. You have access to the student's real data including assignments, grades, rewards, and platform features.

Your job is to:
1. Help students find what they're looking for on the platform
2. Summarize their assignments, grades, and progress when asked
3. Suggest pages to visit based on their needs
4. Be friendly, brief, and helpful — keep responses under 200 words
5. Use emojis sparingly to keep things engaging
6. Always provide navigation links in your responses when relevant

IMPORTANT FORMATTING RULES:
- When suggesting a page, format it as: **[Page Name](/path)** so it becomes a clickable link
- For assignments, show the title, due date, and status
- For grades, show the score and letter grade
- For rewards, show XP, level, streak, and coins
- When listing items, use numbered lists or bullet points
- Be concise — students want quick answers

AVAILABLE PAGES:
- **[Dashboard](/student/dashboard)** — Overview of everything
- **[Assignments](/student/assignments)** — View and submit assignments
- **[AI Tutor](/student/tutor)** — Get help with schoolwork
- **[Focus Mode](/student/focus)** — Distraction-free study
- **[Knowledge](/student/knowledge)** — Skills and mastery tracking
- **[Study Planner](/student/study-planner)** — Plan study sessions
- **[Exam Simulator](/student/exam-sim)** — Practice for exams
- **[Growth Analytics](/student/growth)** — Track your progress
- **[Rewards](/student/rewards)** — XP, badges, and shop
- **[Game Store](/student/games)** — Educational games
- **[Daily Challenge](/student/daily-challenge)** — Daily quiz challenges
- **[Leaderboard](/student/leaderboard)** — Compete with peers
- **[Badges](/student/badges)** — Achievement badges
- **[Certificates](/student/certificates)** — Your certificates
- **[My Platforms](/student/platforms)** — Connected platforms
- **[Messages](/student/messages)** — Send messages to teachers and parents

You are helpful, brief, and always guide the student to the right place.`;

// Fetch student context data
async function getStudentContext(userId: string) {
  const [assignments, rewards, recentGrades, notifications] = await Promise.all([
    // Get assignments with submissions
    prisma.assignment.findMany({
      where: {
        course: {
          enrollments: { some: { studentId: userId } },
        },
        isPublished: true,
      },
      include: {
        course: { select: { name: true } },
        submissions: {
          where: { studentId: userId },
          select: { status: true, score: true, maxScore: true, submittedAt: true },
        },
      },
      orderBy: { dueDate: 'asc' },
      take: 20,
    }),
    // Get reward stats
    prisma.rewardStats.findUnique({
      where: { userId },
    }),
    // Get recent graded submissions
    prisma.submission.findMany({
      where: { studentId: userId, status: 'GRADED' },
      include: {
        assignment: { select: { title: true, totalPoints: true } },
      },
      orderBy: { gradedAt: 'desc' },
      take: 10,
    }),
    // Get unread notifications count
    prisma.notification.count({
      where: { userId, isRead: false },
    }),
  ]);

  // Format context
  const now = new Date();
  const upcoming = assignments.filter(a => {
    const due = new Date(a.dueDate);
    return due >= now && (!a.submissions.length || a.submissions[0].status === 'PENDING');
  });
  const overdue = assignments.filter(a => {
    const due = new Date(a.dueDate);
    return due < now && (!a.submissions.length || a.submissions[0].status === 'PENDING');
  });
  const graded = assignments.filter(a => a.submissions.length && a.submissions[0].status === 'GRADED');

  let context = '\n\n--- STUDENT DATA (use this to answer questions) ---\n';

  // Upcoming assignments
  if (upcoming.length > 0) {
    context += `\nUPCOMING ASSIGNMENTS (${upcoming.length}):\n`;
    upcoming.forEach(a => {
      const dueDate = new Date(a.dueDate);
      const daysLeft = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      context += `- "${a.title}" (${a.course.name}) — due in ${daysLeft} day${daysLeft !== 1 ? 's' : ''} (${dueDate.toLocaleDateString()}) — ${a.totalPoints} pts\n`;
    });
  } else {
    context += '\nNo upcoming assignments — all caught up!\n';
  }

  // Overdue
  if (overdue.length > 0) {
    context += `\nOVERDUE ASSIGNMENTS (${overdue.length}):\n`;
    overdue.forEach(a => {
      context += `- "${a.title}" (${a.course.name}) — was due ${new Date(a.dueDate).toLocaleDateString()} — ${a.totalPoints} pts\n`;
    });
  }

  // Recent grades
  if (recentGrades.length > 0) {
    context += `\nRECENT GRADES (${recentGrades.length}):\n`;
    recentGrades.forEach(s => {
      const pct = s.maxScore ? Math.round(((s.score || 0) / s.maxScore) * 100) : 0;
      const letter = pct >= 93 ? 'A' : pct >= 90 ? 'A-' : pct >= 87 ? 'B+' : pct >= 83 ? 'B' : pct >= 80 ? 'B-' : pct >= 77 ? 'C+' : pct >= 73 ? 'C' : pct >= 70 ? 'C-' : pct >= 67 ? 'D+' : pct >= 60 ? 'D' : 'F';
      context += `- "${s.assignment.title}" — ${s.score}/${s.maxScore} (${pct}% = ${letter})\n`;
    });
  } else {
    context += '\nNo grades yet.\n';
  }

  // Rewards
  if (rewards) {
    context += `\nREWARDS & PROGRESS:\n`;
    context += `- Level: ${rewards.level}\n`;
    context += `- Total XP: ${rewards.totalXP.toLocaleString()}\n`;
    context += `- Current Streak: ${rewards.currentStreak} days (best: ${rewards.longestStreak})\n`;
    context += `- Coins: ${rewards.virtualCoins}\n`;
    context += `- Assignments Completed: ${rewards.assignmentsCompleted}\n`;
    context += `- Tutor Sessions: ${rewards.tutorSessionsCount}\n`;
    context += `- Perfect Scores: ${rewards.perfectScores}\n`;
  }

  context += `\nUnread Notifications: ${notifications}\n`;

  return context;
}

// Demo fallback for when no API key is configured
function getDemoNavigatorResponse(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes('assignment') || lower.includes('homework') || lower.includes('due')) {
    return `Here's a quick look at your assignments! 📚

**Upcoming:**
1. "Algebra: Quadratic Equations" (Math) — due in 2 days — 100 pts
2. "Photosynthesis Lab Report" (Science) — due in 5 days — 80 pts
3. "Essay: To Kill a Mockingbird" (English) — due in 7 days — 120 pts

Head to **[Assignments](/student/assignments)** to view all your work and submit!

💡 *Tip: The "Algebra" assignment is due soon — want me to connect you with the **[AI Tutor](/student/tutor)** for help?*`;
  }

  if (lower.includes('grade') || lower.includes('score') || lower.includes('mark') || lower.includes('how did i do')) {
    return `Here are your recent grades! 📊

1. "Civil War Essay" — **92/100 (A-)** ✨
2. "Fraction Operations Quiz" — **85/100 (B+)**
3. "Weather Patterns Lab" — **78/80 (97.5% = A+)** 🌟
4. "Vocabulary Test Ch. 5" — **88/100 (B+)**

Your average is looking great! Check **[Growth Analytics](/student/growth)** to see your progress over time, or **[Assignments](/student/assignments)** for detailed feedback.`;
  }

  if (lower.includes('reward') || lower.includes('xp') || lower.includes('level') || lower.includes('coin') || lower.includes('badge') || lower.includes('streak')) {
    return `Here's your reward summary! 🏆

- **Level:** 12
- **Total XP:** 4,850
- **Current Streak:** 7 days 🔥
- **Coins:** 320
- **Assignments Completed:** 23
- **Perfect Scores:** 5 ⭐

Visit **[Rewards](/student/rewards)** to spend coins or **[Badges](/student/badges)** to see your achievements! You can also check the **[Game Store](/student/games)** to buy games with XP.`;
  }

  if (lower.includes('help') || lower.includes('tutor') || lower.includes('stuck') || lower.includes('understand')) {
    return `Need help with schoolwork? I've got you covered! 🤓

- **[AI Tutor](/student/tutor)** — Ask any question and get step-by-step help
- **[Focus Mode](/student/focus)** — Study without distractions
- **[Exam Simulator](/student/exam-sim)** — Practice for upcoming tests
- **[Knowledge](/student/knowledge)** — See which skills you've mastered

What subject are you working on? I can point you in the right direction!`;
  }

  if (lower.includes('game') || lower.includes('play') || lower.includes('fun')) {
    return `Ready for some fun? 🎮

Check out the **[Game Store](/student/games)** — you can spend your XP on educational games! You currently have enough for a few games.

Also try the **[Daily Challenge](/student/daily-challenge)** for quick quizzes, or check the **[Leaderboard](/student/leaderboard)** to see how you rank against classmates!`;
  }

  if (lower.includes('message') || lower.includes('email') || lower.includes('teacher') || lower.includes('contact') || lower.includes('send')) {
    return `Want to send a message? ✉️

Head to **[Messages](/student/messages)** to:
- Send messages to your teachers
- Read messages from teachers and parents
- Keep track of all your conversations

You can message any teacher in your classes!`;
  }

  if (lower.includes('study') || lower.includes('plan') || lower.includes('schedule')) {
    return `Let's get organized! 📅

- **[Study Planner](/student/study-planner)** — Create a personalized study schedule
- **[Focus Mode](/student/focus)** — Pomodoro-style study sessions
- **[Knowledge](/student/knowledge)** — See what to review next

💡 *Tip: The AI can recommend what to study based on your upcoming assignments and skill gaps!*`;
  }

  // Default: overview of everything
  return `Hi there! I'm your Limud Navigator 🧭 Here's what I can help with:

📚 **[Assignments](/student/assignments)** — 3 upcoming assignments
📊 **[Growth Analytics](/student/growth)** — Track your progress
🤖 **[AI Tutor](/student/tutor)** — Get homework help
🎮 **[Game Store](/student/games)** — Earn and play!
✉️ **[Messages](/student/messages)** — Talk to teachers
🏆 **[Rewards](/student/rewards)** — Level 12, 7-day streak 🔥

Just ask me about your assignments, grades, rewards, or anything else — I'll help you find it! What would you like to know?`;
}

export const POST = apiHandler(async (req: Request) => {
  const user = await requireAuth();

  // Allow students and homeschool parents
  if (user.role !== 'STUDENT' && !(user.role === 'PARENT' && user.isHomeschoolParent)) {
    return NextResponse.json({ error: 'Only students can use the navigator' }, { status: 403 });
  }

  const { message, history } = await req.json();

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 });
  }

  // Try to get real student data
  let studentContext = '';
  try {
    studentContext = await getStudentContext(user.id);
  } catch (e) {
    console.error('Failed to fetch student context:', e);
    // Continue without context
  }

  if (isOpenAIConfigured()) {
    try {
      const messages = [
        { role: 'system', content: NAVIGATOR_SYSTEM_PROMPT + studentContext },
        ...(history || []).slice(-10), // Keep last 10 messages for context
        { role: 'user', content: message.trim() },
      ];

      const content = await callOpenAI(messages, { temperature: 0.5, maxTokens: 500 });
      return NextResponse.json({ message: content });
    } catch (e) {
      console.error('OpenAI navigator error, falling back to demo:', e);
    }
  }

  // Demo fallback
  const content = getDemoNavigatorResponse(message);
  return NextResponse.json({ message: content });
});
