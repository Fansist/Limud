/**
 * LIMUD v10.0 — Weekly Parent Digest Cron
 * POST /api/cron/weekly-digest
 * Protected by CRON_SECRET header.
 * Iterates all parents, gathers children stats, sends email.
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { weeklyParentDigest } from '@/lib/email-templates';

export async function POST(req: Request) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 503 });
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Find all active parents
    const parents = await prisma.user.findMany({
      where: { role: 'PARENT', isActive: true, isDemo: false },
      include: {
        children: {
          where: { isActive: true },
          include: {
            rewardStats: true,
            submissions: {
              where: {
                status: 'GRADED',
                gradedAt: {
                  gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                },
              },
              select: { score: true, maxScore: true },
            },
          },
        },
      },
    });

    let sent = 0;
    let skipped = 0;

    for (const parent of parents) {
      if (parent.children.length === 0) {
        skipped++;
        continue;
      }

      const childrenData = parent.children.map(child => {
        const gradedSubs = child.submissions.filter(s => s.score !== null && s.maxScore !== null);
        const avgScore = gradedSubs.length > 0
          ? Math.round(gradedSubs.reduce((a, s) => a + ((s.score! / s.maxScore!) * 100), 0) / gradedSubs.length)
          : 0;

        const highlights: string[] = [];
        if (child.rewardStats?.currentStreak && child.rewardStats.currentStreak >= 7) {
          highlights.push(`${child.rewardStats.currentStreak}-day streak! Keep it up! 🔥`);
        }
        if (avgScore >= 90) {
          highlights.push(`Averaging ${avgScore}% — excellent work!`);
        }
        if (gradedSubs.length === 0) {
          highlights.push('No graded assignments this week');
        }

        return {
          name: child.name,
          avgScore,
          streak: child.rewardStats?.currentStreak || 0,
          completedCount: gradedSubs.length,
          highlights,
        };
      });

      const html = weeklyParentDigest({
        parentName: parent.name,
        children: childrenData,
      });

      const result = await sendEmail({
        to: parent.email,
        subject: `Limud Weekly: ${childrenData.map(c => c.name).join(', ')}`,
        html,
      });

      if (result.success) sent++;
      else skipped++;
    }

    return NextResponse.json({
      success: true,
      totalParents: parents.length,
      emailsSent: sent,
      emailsSkipped: skipped,
    });
  } catch (error) {
    console.error('[Weekly Digest] Error:', error);
    return NextResponse.json({ error: 'Digest generation failed' }, { status: 500 });
  }
}
