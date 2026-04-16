import { NextResponse } from 'next/server';
import { requireAuth, requireRole, apiHandler } from '@/lib/middleware';
import prisma from '@/lib/prisma';

// GET /api/games - List available games + check purchase status
export const GET = apiHandler(async (req: Request) => {
  const user = await requireAuth();
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const purchased = searchParams.get('purchased'); // "true" = only purchased

  const where: Record<string, unknown> = { isActive: true };
  if (category) where.category = category;

  const games = await prisma.game.findMany({
    where,
    orderBy: { playCount: 'desc' },
    take: 50,
  });

  // Get user's purchased games
  const userPurchases = await prisma.gamePurchase.findMany({
    where: { userId: user.id },
    select: { gameId: true },
  });
  const purchasedIds = new Set(userPurchases.map(p => p.gameId));

  // Check if games are disabled during class time for this student
  let gamesBlocked = false;
  let blockReason = '';

  if (user.role === 'STUDENT') {
    // Check district-level setting
    if (user.districtId) {
      const district = await prisma.schoolDistrict.findUnique({
        where: { id: user.districtId },
        select: { gamesEnabled: true },
      });
      if (district && !district.gamesEnabled) {
        gamesBlocked = true;
        blockReason = 'Games are disabled by your school district.';
      }
    }

    // Check classroom-level setting (if student is in any classroom with games disabled)
    if (!gamesBlocked) {
      const classroomEnrollments = await prisma.classroomStudent.findMany({
        where: { studentId: user.id },
        include: { classroom: { select: { gamesDisabledDuringClass: true, name: true } } },
      });
      const blockedClass = classroomEnrollments.find(e => e.classroom.gamesDisabledDuringClass);
      if (blockedClass) {
        gamesBlocked = true;
        blockReason = `Games are disabled during class (${blockedClass.classroom.name}).`;
      }
    }
  }

  // Get reward stats for XP display
  const stats = user.role === 'STUDENT' ? await prisma.rewardStats.findUnique({
    where: { userId: user.id },
    select: { totalXP: true, virtualCoins: true },
  }) : null;

  const enrichedGames = games
    .filter(g => purchased === 'true' ? purchasedIds.has(g.id) : true)
    .map(g => ({
      ...g,
      purchased: purchasedIds.has(g.id),
    }));

  return NextResponse.json({
    games: enrichedGames,
    gamesBlocked,
    blockReason,
    totalXP: stats?.totalXP ?? 0,
    virtualCoins: stats?.virtualCoins ?? 0,
  });
});

// POST /api/games - Purchase a game with XP or play a game
export const POST = apiHandler(async (req: Request) => {
  const user = await requireAuth();

  if (user.role !== 'STUDENT') {
    return NextResponse.json({ error: 'Only students can purchase and play games' }, { status: 403 });
  }

  // BUG FIX: Parse body once - req.json() can only be called once (stream is consumed)
  const body = await req.json();
  const { action, gameId, score, timeSpentSec, rating } = body;

  if (!gameId) {
    return NextResponse.json({ error: 'gameId is required' }, { status: 400 });
  }

  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game || !game.isActive) {
    return NextResponse.json({ error: 'Game not found' }, { status: 404 });
  }

  // Check if games are blocked
  if (user.districtId) {
    const district = await prisma.schoolDistrict.findUnique({
      where: { id: user.districtId },
      select: { gamesEnabled: true },
    });
    if (district && !district.gamesEnabled) {
      return NextResponse.json({ error: 'Games are disabled by your school district' }, { status: 403 });
    }
  }

  const classroomEnrollments = await prisma.classroomStudent.findMany({
    where: { studentId: user.id },
    include: { classroom: { select: { gamesDisabledDuringClass: true } } },
  });
  if (classroomEnrollments.some(e => e.classroom.gamesDisabledDuringClass)) {
    return NextResponse.json({ error: 'Games are disabled during class time' }, { status: 403 });
  }

  if (action === 'purchase') {
    // Check if already purchased
    const existing = await prisma.gamePurchase.findUnique({
      where: { userId_gameId: { userId: user.id, gameId } },
    });
    if (existing) {
      return NextResponse.json({ error: 'Game already purchased' }, { status: 400 });
    }

    // Check XP balance
    const stats = await prisma.rewardStats.findUnique({ where: { userId: user.id } });
    if (!stats || stats.totalXP < game.xpCost) {
      return NextResponse.json({
        error: `Not enough XP. Need ${game.xpCost} XP, you have ${stats?.totalXP ?? 0} XP.`,
      }, { status: 400 });
    }

    // Deduct XP and create purchase
    await prisma.$transaction([
      prisma.rewardStats.update({
        where: { userId: user.id },
        data: { totalXP: { decrement: game.xpCost } },
      }),
      prisma.gamePurchase.create({
        data: { userId: user.id, gameId, xpSpent: game.xpCost },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: `Purchased "${game.title}" for ${game.xpCost} XP!`,
      game,
    });
  }

  if (action === 'play') {
    // Must own the game
    const purchase = await prisma.gamePurchase.findUnique({
      where: { userId_gameId: { userId: user.id, gameId } },
    });
    if (!purchase) {
      return NextResponse.json({ error: 'You have not purchased this game' }, { status: 403 });
    }

    // Record play session
    const session = await prisma.gameSession.create({
      data: {
        userId: user.id,
        gameId,
        score: score ?? 0,
        timeSpentSec: timeSpentSec ?? 0,
        completed: true,
      },
    });

    // Increment play count
    await prisma.game.update({
      where: { id: gameId },
      data: { playCount: { increment: 1 } },
    });

    return NextResponse.json({ success: true, session });
  }

  if (action === 'rate') {
    // BUG FIX: rating is already destructured from the single body parse above
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be 1-5' }, { status: 400 });
    }
    const newCount = game.ratingCount + 1;
    const newRating = ((game.avgRating * game.ratingCount) + rating) / newCount;
    await prisma.game.update({
      where: { id: gameId },
      data: { avgRating: Math.round(newRating * 10) / 10, ratingCount: newCount },
    });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Invalid action. Use purchase, play, or rate.' }, { status: 400 });
});

// PUT /api/games - Teacher: toggle game access for classroom
export const PUT = apiHandler(async (req: Request) => {
  const user = await requireRole('TEACHER', 'ADMIN');
  const { classroomId, gamesDisabled, districtWide } = await req.json();

  // District-wide toggle (admin only)
  if (districtWide !== undefined && user.role === 'ADMIN' && user.districtId) {
    await prisma.schoolDistrict.update({
      where: { id: user.districtId },
      data: { gamesEnabled: !districtWide },
    });
    return NextResponse.json({
      success: true,
      message: districtWide ? 'Games disabled district-wide' : 'Games enabled district-wide',
    });
  }

  // Classroom-level toggle (teacher)
  if (!classroomId) {
    return NextResponse.json({ error: 'classroomId required' }, { status: 400 });
  }

  const classroom = await prisma.classroom.findUnique({ where: { id: classroomId } });
  if (!classroom) {
    return NextResponse.json({ error: 'Classroom not found' }, { status: 404 });
  }

  // Verify teacher has access
  if (user.role === 'TEACHER' && classroom.teacherId !== user.id) {
    return NextResponse.json({ error: 'Not authorized for this classroom' }, { status: 403 });
  }

  await prisma.classroom.update({
    where: { id: classroomId },
    data: { gamesDisabledDuringClass: gamesDisabled ?? true },
  });

  return NextResponse.json({
    success: true,
    message: gamesDisabled ? 'Games disabled for this classroom' : 'Games enabled for this classroom',
  });
});
