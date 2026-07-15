import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { auth } from '@/auth';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { proposalId } = await req.json();
    const { id } = await params;

    const gig = await prisma.gig.findUnique({
      where: { id },
      include: { client: true },
    });

    if (!gig) return NextResponse.json({ error: 'Gig not found' }, { status: 404 });
    if (gig.clientId !== session.user.id) return NextResponse.json({ error: 'Only the client can accept a proposal' }, { status: 403 });
    if (gig.status !== 'OPEN') return NextResponse.json({ error: 'Gig is not open' }, { status: 400 });

    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId }
    });

    if (!proposal || proposal.gigId !== id) {
      return NextResponse.json({ error: 'Invalid proposal' }, { status: 400 });
    }

    // 1. Accept the proposal
    // 2. Set gig to PENDING_FUNDS and assign freelancer (budget locked in)
    await prisma.$transaction([
      prisma.proposal.update({
        where: { id: proposalId },
        data: { status: 'ACCEPTED' }
      }),
      prisma.gig.update({
        where: { id },
        data: {
          status: 'PENDING_FUNDS',
          freelancerId: proposal.freelancerId,
          budget: proposal.bidAmount, // Lock in the agreed bid amount
          estimatedDuration: proposal.estimatedDays ? `${proposal.estimatedDays} days` : gig.estimatedDuration
        }
      })
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Accept Proposal API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
