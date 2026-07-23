import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { scoutAgent } from '@/lib/ai';

export const POST = auth(async (req: any) => {
  try {
    const session = req.auth;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user's connected social accounts
    const socials = await prisma.socialAccount.findMany({
      where: { userId: session.user.id }
    });

    if (socials.length === 0) {
      return NextResponse.json({ error: 'No social accounts to evaluate' }, { status: 400 });
    }

    const rawData = {
      socials: socials.map(s => ({
        platform: s.platform,
        handle: s.handle,
        url: s.profileUrl
      }))
    };

    // Trigger AI Reevaluation
    const scoutReport = await scoutAgent.analyzeProfile(rawData);

    // Update Freelancer Profile
    await prisma.freelancerProfile.upsert({
      where: { userId: session.user.id },
      update: {
        skills: JSON.stringify(scoutReport.skills),
        experiences: JSON.stringify(scoutReport.experiences),
        education: JSON.stringify(scoutReport.education),
        credibilityScore: scoutReport.credibilityScore,
        badges: JSON.stringify(scoutReport.badges),
        scoutReport: JSON.stringify(scoutReport),
      },
      create: {
        userId: session.user.id,
        skills: JSON.stringify(scoutReport.skills),
        experiences: JSON.stringify(scoutReport.experiences),
        education: JSON.stringify(scoutReport.education),
        credibilityScore: scoutReport.credibilityScore,
        badges: JSON.stringify(scoutReport.badges),
        scoutReport: JSON.stringify(scoutReport),
      }
    });
    
    // Update Reputation Score
    await prisma.reputation.upsert({
      where: { userId: session.user.id },
      update: {
        overallScore: scoutReport.credibilityScore,
        profileScore: scoutReport.credibilityScore,
        badges: JSON.stringify(scoutReport.badges),
      },
      create: {
        userId: session.user.id,
        overallScore: scoutReport.credibilityScore,
        profileScore: scoutReport.credibilityScore,
        badges: JSON.stringify(scoutReport.badges),
      }
    });

    return NextResponse.json({ success: true, score: scoutReport.credibilityScore });
  } catch (error) {
    console.error('Reevaluate API Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
});
