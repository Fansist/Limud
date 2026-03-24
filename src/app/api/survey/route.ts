import { NextResponse } from 'next/server';
import { requireAuth, apiHandler } from '@/lib/middleware';
import prisma from '@/lib/prisma';

// GET /api/survey - Check if student has completed survey, return survey data
export const GET = apiHandler(async (req: Request) => {
  const user = await requireAuth();

  // v9.4.0: Allow students AND master demo to access survey
  if (user.role !== 'STUDENT' && !(user as any).isMasterDemo) {
    return NextResponse.json({ error: 'Students only' }, { status: 403 });
  }

  const targetId = user.role === 'STUDENT' ? user.id : user.id;

  const dbUser = await prisma.user.findUnique({
    where: { id: targetId },
    select: { surveyCompleted: true, learningStyleProfile: true },
  });

  const survey = await prisma.studentSurvey.findUnique({
    where: { userId: targetId },
  });

  return NextResponse.json({
    surveyCompleted: dbUser?.surveyCompleted || false,
    learningStyleProfile: dbUser?.learningStyleProfile ? JSON.parse(dbUser.learningStyleProfile) : null,
    survey: survey ? {
      favoriteSubjects: JSON.parse(survey.favoriteSubjects),
      hobbies: JSON.parse(survey.hobbies),
      favoriteBooks: survey.favoriteBooks,
      favoriteMovies: survey.favoriteMovies,
      favoriteGames: survey.favoriteGames,
      dreamJob: survey.dreamJob,
      learningStyle: survey.learningStyle,
      learningNeeds: JSON.parse(survey.learningNeeds || '[]'),
      preferredFormats: JSON.parse(survey.preferredFormats || '[]'),
      motivators: JSON.parse(survey.motivators),
      challenges: JSON.parse(survey.challenges),
      funFacts: survey.funFacts,
      ageGroup: survey.ageGroup,
    } : null,
  });
});

// POST /api/survey - Save student survey
export const POST = apiHandler(async (req: Request) => {
  const user = await requireAuth();

  // v9.4.0: Allow students AND master demo to save survey
  if (user.role !== 'STUDENT' && !(user as any).isMasterDemo) {
    return NextResponse.json({ error: 'Students only' }, { status: 403 });
  }

  const body = await req.json();
  const {
    favoriteSubjects = [],
    hobbies = [],
    favoriteBooks,
    favoriteMovies,
    favoriteGames,
    dreamJob,
    learningStyle = 'visual',
    learningNeeds = [],
    preferredFormats = [],
    motivators = [],
    challenges = [],
    funFacts,
    ageGroup,
  } = body;

  // Upsert survey
  await prisma.studentSurvey.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      favoriteSubjects: JSON.stringify(favoriteSubjects),
      hobbies: JSON.stringify(hobbies),
      favoriteBooks: favoriteBooks || null,
      favoriteMovies: favoriteMovies || null,
      favoriteGames: favoriteGames || null,
      dreamJob: dreamJob || null,
      learningStyle,
      learningNeeds: JSON.stringify(learningNeeds),
      preferredFormats: JSON.stringify(preferredFormats),
      motivators: JSON.stringify(motivators),
      challenges: JSON.stringify(challenges),
      funFacts: funFacts || null,
      ageGroup: ageGroup || null,
    },
    update: {
      favoriteSubjects: JSON.stringify(favoriteSubjects),
      hobbies: JSON.stringify(hobbies),
      favoriteBooks: favoriteBooks || null,
      favoriteMovies: favoriteMovies || null,
      favoriteGames: favoriteGames || null,
      dreamJob: dreamJob || null,
      learningStyle,
      learningNeeds: JSON.stringify(learningNeeds),
      preferredFormats: JSON.stringify(preferredFormats),
      motivators: JSON.stringify(motivators),
      challenges: JSON.stringify(challenges),
      funFacts: funFacts || null,
      ageGroup: ageGroup || null,
    },
  });

  // v9.4.0: Also update the user's learningStyleProfile for quick access
  const profileData = {
    primaryStyle: learningStyle,
    needs: learningNeeds,
    formats: preferredFormats,
    updatedAt: new Date().toISOString(),
  };

  await prisma.user.update({
    where: { id: user.id },
    data: {
      surveyCompleted: true,
      learningStyleProfile: JSON.stringify(profileData),
    },
  });

  return NextResponse.json({
    success: true,
    message: 'Survey saved! Your learning experience is now fully personalized.',
  });
});
