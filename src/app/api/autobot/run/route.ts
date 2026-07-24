import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { proposalAgent } from '@/lib/ai';
import { safeParseJson } from '@/lib/json';

export const runtime = 'nodejs';

function normalizeSkillName(skill: any) {
  return String(skill?.name || skill || '').toLowerCase();
}

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        freelancerProfile: true,
        reputationScore: true,
      },
    });

    if (!user?.freelancerProfile) {
      return NextResponse.json({ error: 'Freelancer profile is required before Auto-Bot can run' }, { status: 400 });
    }

    const badges = safeParseJson<any[]>(user.reputationScore?.badges, []);
    const rented = badges.some((badge) => badge?.id === 'autobot-rented');
    const organicallyUnlocked =
      (user.reputationScore?.tasksCompleted || 0) >= 10 &&
      (user.reputationScore?.socialReliabilityScore || 0) >= 90;

    if (!rented && !organicallyUnlocked) {
      return NextResponse.json({ error: 'Auto-Bot is locked. Complete 10 gigs with 90+ SRS or rent access.' }, { status: 403 });
    }

    const profileSkills = safeParseJson<any[]>(user.freelancerProfile.skills, []);
    const profileSkillNames = new Set(profileSkills.map(normalizeSkillName).filter(Boolean));

    const openGigs = await prisma.gig.findMany({
      where: {
        status: 'OPEN',
        clientId: { not: user.id },
        proposals: {
          none: { freelancerId: user.id },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { client: true },
    });

    const candidates = openGigs
      .map((gig) => {
        const gigSkills = safeParseJson<any[]>(gig.skills, []);
        const overlap = gigSkills.filter((skill) => profileSkillNames.has(normalizeSkillName(skill)));
        const overlapScore = gigSkills.length ? overlap.length / gigSkills.length : 0.25;
        const credibilityBoost = Math.min(1, Number(user.freelancerProfile?.credibilityScore || 0) / 100);
        return { gig, score: overlapScore * 0.7 + credibilityBoost * 0.3, overlap };
      })
      .filter((candidate) => candidate.score >= 0.35)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    const submitted = [];
    for (const candidate of candidates) {
      const parsedProfile = {
        ...user.freelancerProfile,
        skills: profileSkills,
        experiences: safeParseJson(user.freelancerProfile.experiences),
        education: safeParseJson(user.freelancerProfile.education),
        badges: safeParseJson(user.freelancerProfile.badges),
      };
      const parsedGig = {
        ...candidate.gig,
        skills: safeParseJson(candidate.gig.skills),
      };

      const draft = await proposalAgent.draftProposal(parsedProfile as any, parsedGig as any);
      const proposal = await prisma.proposal.create({
        data: {
          gigId: candidate.gig.id,
          freelancerId: user.id,
          coverLetter: draft.coverLetter,
          bidAmount: draft.suggestedBid || candidate.gig.budget,
          estimatedDays: null,
          generatedByAgent: true,
          agentConfidence: draft.confidence,
          matchScore: Math.max(candidate.score, draft.confidence / 100),
        },
      });

      submitted.push({ proposalId: proposal.id, gigId: candidate.gig.id, title: candidate.gig.title });
    }

    return NextResponse.json({ success: true, submitted });
  } catch (error) {
    console.error('POST /api/autobot/run Error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status: 500 });
  }
}
