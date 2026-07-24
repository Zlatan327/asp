import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { scoutAgent } from '@/lib/ai';
import { scanAndPersistSocialAccounts } from '@/lib/social/scan';

export const runtime = 'nodejs';

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

    const socialScans = await scanAndPersistSocialAccounts(session.user.id);
    const existingProfile = await prisma.freelancerProfile.findUnique({
      where: { userId: session.user.id },
    });

    const rawData = {
      socials: socials.map(s => ({
        platform: s.platform,
        handle: s.handle,
        url: s.profileUrl
      })),
      socialScans,
      previousScoutReport: existingProfile?.scoutReport,
    };

    // Trigger AI Reevaluation
    const scoutReport = await scoutAgent.analyzeProfile(rawData);

    // Update Freelancer Profile
    await prisma.freelancerProfile.upsert({
      where: { userId: session.user.id },
      update: {
        skills: scoutReport.skills as any,
        experiences: scoutReport.experiences as any,
        education: scoutReport.education as any,
        credibilityScore: scoutReport.credibilityScore,
        badges: scoutReport.badges as any,
        scoutReport: scoutReport as any,
      },
      create: {
        userId: session.user.id,
        skills: scoutReport.skills as any,
        experiences: scoutReport.experiences as any,
        education: scoutReport.education as any,
        credibilityScore: scoutReport.credibilityScore,
        badges: scoutReport.badges as any,
        scoutReport: scoutReport as any,
      }
    });
    
    // Update Reputation Score
    await prisma.reputation.upsert({
      where: { userId: session.user.id },
      update: {
        overallScore: scoutReport.credibilityScore,
        profileScore: scoutReport.credibilityScore,
        socialScore: socialScans.some(scan => scan.ok) ? Math.min(100, 50 + socialScans.filter(scan => scan.ok).length * 20) : 0,
        badges: scoutReport.badges as any,
      },
      create: {
        userId: session.user.id,
        overallScore: scoutReport.credibilityScore,
        profileScore: scoutReport.credibilityScore,
        socialScore: socialScans.some(scan => scan.ok) ? Math.min(100, 50 + socialScans.filter(scan => scan.ok).length * 20) : 0,
        badges: scoutReport.badges as any,
      }
    });

    return NextResponse.json({
      success: true,
      score: scoutReport.credibilityScore,
      socialScans: socialScans.map(scan => ({
        platform: scan.platform,
        ok: scan.ok,
        warnings: scan.warnings,
      })),
    });
  } catch (error) {
    console.error('Reevaluate API Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
});
