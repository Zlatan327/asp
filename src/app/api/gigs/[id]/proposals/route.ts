import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { auth } from '@/auth';
import { proposalAgent } from '@/lib/ai';
import { safeParseJson } from '@/lib/json';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { useAiDraft, coverLetter, bidAmount, estimatedDays } = await req.json();
    const { id } = await params;

    const gig = await prisma.gig.findUnique({
      where: { id },
      include: { client: true },
    });

    if (!gig) {
      return NextResponse.json({ error: 'Gig not found' }, { status: 404 });
    }

    let finalCoverLetter = coverLetter;
    let matchScore = 0;

    // Use AI Proposal Agent to draft the cover letter
    if (useAiDraft) {
      const freelancer = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { freelancerProfile: true },
      });

      if (!freelancer || !freelancer.freelancerProfile) {
        return NextResponse.json({ error: 'Freelancer profile missing' }, { status: 400 });
      }

      const parsedProfile = {
        ...freelancer.freelancerProfile,
        skills: safeParseJson(freelancer.freelancerProfile.skills),
        experiences: safeParseJson(freelancer.freelancerProfile.experiences),
        education: safeParseJson(freelancer.freelancerProfile.education),
        badges: safeParseJson(freelancer.freelancerProfile.badges),
      } as any;

      const parsedGig = {
        ...gig,
        skills: safeParseJson(gig.skills),
      } as any;

      const draftResult = await proposalAgent.draftProposal(parsedProfile, parsedGig);
      
      finalCoverLetter = draftResult.coverLetter;
      matchScore = draftResult.confidence / 100; // Store as 0.0 - 1.0
    }

    const proposal = await prisma.proposal.create({
      data: {
        gigId: gig.id,
        freelancerId: session.user.id,
        coverLetter: finalCoverLetter || "No cover letter provided.",
        bidAmount: bidAmount != null && bidAmount !== "" ? parseFloat(bidAmount) : gig.budget,
        estimatedDays: estimatedDays != null && estimatedDays !== "" ? parseInt(estimatedDays) : null,
        generatedByAgent: useAiDraft === true,
        matchScore: matchScore > 0 ? matchScore : null,
      },
    });

    return NextResponse.json(proposal, { status: 201 });
  } catch (error) {
    console.error('Error submitting proposal:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
