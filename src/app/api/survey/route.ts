import { NextResponse } from 'next/server';
import { requireAuth, apiHandler } from '@/lib/middleware';
import prisma from '@/lib/prisma';

// GET /api/survey - Check if student has completed survey, return survey data
export const GET = apiHandler(async (req: Request) => {
  const user = await requireAuth();

  if (user.role !== 'STUDENT') {
    return NextResponse.json({ error: 'Students only' }, { status: 403 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { surveyCompleted: true },
  });

  const survey = await prisma.studentSurvey.findUnique({
    where: { userId: user.id },
  });

  return NextResponse.json({
    surveyCompleted: dbUser?.surveyCompleted || false,
    survey: survey ? {
      favoriteSubjects: JSON.parse(survey.favoriteSubjects),
      hobbies: JSON.parse(survey.hobbies),
      favoriteBooks: survey.favoriteBooks,
      favoriteMovies: survey.favoriteMovies,
      favoriteGames: survey.favoriteGames,
      dreamJob: survey.dreamJob,
      learningStyle: survey.learningStyle,
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

  if (user.role !== 'STUDENT') {
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
      motivators: JSON.stringify(motivators),
      challenges: JSON.stringify(challenges),
      funFacts: funFacts || null,
      ageGroup: ageGroup || null,
    },
  });

  // Mark survey as completed
  await prisma.user.update({
    where: { id: user.id },
    data: { surveyCompleted: true },
  });

  return NextResponse.json({ success: true, message: 'Survey saved! Your AI tutor will now personalize responses just for you.' });
});
