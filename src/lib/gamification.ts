/**
 * Gamification Engine for Limud
 * Handles XP, levels, streaks, coins, and reward calculations
 */
import prisma from '@/lib/prisma';

const XP_REWARDS = {
  ASSIGNMENT_SUBMIT: 25,
  ASSIGNMENT_COMPLETE: 50,
  PERFECT_SCORE: 100,
  HIGH_SCORE: 50, // 90%+
  TUTOR_SESSION: 15,
  DAILY_LOGIN: 10,
  STREAK_BONUS_7: 75,
  STREAK_BONUS_14: 150,
  STREAK_BONUS_30: 300,
};

const COIN_REWARDS = {
  ASSIGNMENT_COMPLETE: 10,
  PERFECT_SCORE: 25,
  HIGH_SCORE: 15,
  STREAK_BONUS_7: 20,
  STREAK_BONUS_14: 50,
  LEVEL_UP: 30,
};

export async function awardXP(userId: string, amount: number, reason: string): Promise<{
  xpGained: number;
  newTotalXP: number;
  levelUp: boolean;
  newLevel: number;
}> {
  const stats = await prisma.rewardStats.upsert({
    where: { userId },
    create: { userId, totalXP: amount },
    update: { totalXP: { increment: amount } },
  });

  const oldLevel = Math.floor((stats.totalXP - amount) / 250) + 1;
  const newLevel = Math.floor(stats.totalXP / 250) + 1;
  const levelUp = newLevel > oldLevel;

  if (levelUp) {
    await prisma.rewardStats.update({
      where: { userId },
      data: {
        level: newLevel,
        virtualCoins: { increment: COIN_REWARDS.LEVEL_UP },
      },
    });

    await prisma.notification.create({
      data: {
        userId,
        title: `🎉 Level Up! You're now Level ${newLevel}!`,
        message: `Congratulations! You earned ${COIN_REWARDS.LEVEL_UP} bonus coins!`,
        type: 'achievement',
      },
    });
  }

  return {
    xpGained: amount,
    newTotalXP: stats.totalXP,
    levelUp,
    newLevel,
  };
}

export async function updateStreak(userId: string): Promise<{
  currentStreak: number;
  isNewDay: boolean;
  streakBonus: number;
}> {
  const stats = await prisma.rewardStats.findUnique({ where: { userId } });
  if (!stats) {
    await prisma.rewardStats.create({ data: { userId } });
    return { currentStreak: 1, isNewDay: true, streakBonus: 0 };
  }

  const now = new Date();
  const lastActive = new Date(stats.lastActiveDate);
  const diffHours = (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60);

  if (diffHours < 20) {
    // Same day or very recent
    return { currentStreak: stats.currentStreak, isNewDay: false, streakBonus: 0 };
  }

  let newStreak: number;
  let streakBonus = 0;

  if (diffHours < 48) {
    // Next day - extend streak
    newStreak = stats.currentStreak + 1;

    if (newStreak === 7) {
      streakBonus = XP_REWARDS.STREAK_BONUS_7;
    } else if (newStreak === 14) {
      streakBonus = XP_REWARDS.STREAK_BONUS_14;
    } else if (newStreak === 30) {
      streakBonus = XP_REWARDS.STREAK_BONUS_30;
    }
  } else {
    // Streak broken
    newStreak = 1;
  }

  const longestStreak = Math.max(stats.longestStreak, newStreak);

  await prisma.rewardStats.update({
    where: { userId },
    data: {
      currentStreak: newStreak,
      longestStreak,
      lastActiveDate: now,
    },
  });

  if (streakBonus > 0) {
    await awardXP(userId, streakBonus, `${newStreak}-day streak bonus`);
    const coinBonus = newStreak === 7 ? COIN_REWARDS.STREAK_BONUS_7 : COIN_REWARDS.STREAK_BONUS_14;
    await prisma.rewardStats.update({
      where: { userId },
      data: { virtualCoins: { increment: coinBonus } },
    });
  }

  return { currentStreak: newStreak, isNewDay: true, streakBonus };
}

export async function onAssignmentGraded(
  userId: string,
  score: number,
  maxScore: number
): Promise<void> {
  const pct = (score / maxScore) * 100;

  // Base completion reward
  await awardXP(userId, XP_REWARDS.ASSIGNMENT_COMPLETE, 'Assignment completed');
  await prisma.rewardStats.update({
    where: { userId },
    data: {
      assignmentsCompleted: { increment: 1 },
      virtualCoins: { increment: COIN_REWARDS.ASSIGNMENT_COMPLETE },
    },
  });

  // Bonus for high scores
  if (pct === 100) {
    await awardXP(userId, XP_REWARDS.PERFECT_SCORE, 'Perfect score!');
    await prisma.rewardStats.update({
      where: { userId },
      data: { virtualCoins: { increment: COIN_REWARDS.PERFECT_SCORE } },
    });
  } else if (pct >= 90) {
    await awardXP(userId, XP_REWARDS.HIGH_SCORE, 'High score (90%+)');
    await prisma.rewardStats.update({
      where: { userId },
      data: { virtualCoins: { increment: COIN_REWARDS.HIGH_SCORE } },
    });
  }
}

export async function onTutorSession(userId: string): Promise<void> {
  await awardXP(userId, XP_REWARDS.TUTOR_SESSION, 'AI Tutor session');
  await prisma.rewardStats.update({
    where: { userId },
    data: { tutorSessionsCount: { increment: 1 } },
  });
}

export async function purchaseAvatar(
  userId: string,
  avatarId: string,
  cost: number
): Promise<{ success: boolean; message: string }> {
  const stats = await prisma.rewardStats.findUnique({ where: { userId } });
  if (!stats) return { success: false, message: 'User not found' };

  if (stats.virtualCoins < cost) {
    return { success: false, message: 'Not enough coins' };
  }

  const unlocked: string[] = JSON.parse(stats.unlockedAvatars);
  if (unlocked.includes(avatarId)) {
    return { success: false, message: 'Avatar already unlocked' };
  }

  unlocked.push(avatarId);
  await prisma.rewardStats.update({
    where: { userId },
    data: {
      virtualCoins: { decrement: cost },
      unlockedAvatars: JSON.stringify(unlocked),
    },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { selectedAvatar: avatarId },
  });

  return { success: true, message: `Unlocked ${avatarId}!` };
}
