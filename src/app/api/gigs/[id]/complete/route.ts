import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { auth } from '@/auth';
import { reputationAgent } from '@/lib/ai/agents/reputation';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { clientRating, clientFeedback } = await req.json();

    const gig = await prisma.gig.findUnique({
      where: { id },
      include: { tasks: true }
    });

    if (!gig || gig.clientId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    if (!gig.freelancerId) {
      return NextResponse.json({ error: 'No freelancer assigned' }, { status: 400 });
    }

    // Mark gig as completed
    await prisma.gig.update({
      where: { id },
      data: { status: 'COMPLETED' }
    });

    // Invoke Reputation Agent
    const metadata = await reputationAgent.calculateScore({
      freelancerId: gig.freelancerId,
      gigId: gig.id,
      clientRating: clientRating || 5,
      clientFeedback: clientFeedback || 'Great work!',
      milestonesCompleted: gig.tasks.filter(t => t.status === 'DONE').length,
      totalMilestones: gig.tasks.length,
      wasDisputed: false,
      deliveredOnTime: true
    });

    // Convert metadata to a data URI for the SBT (since we don't have an IPFS uploader wired up)
    const tokenURI = "data:application/json;base64," + Buffer.from(JSON.stringify(metadata)).toString('base64');

    // Save score to DB
    await prisma.reputation.upsert({
      where: { userId: gig.freelancerId },
      create: {
        userId: gig.freelancerId,
        overallScore: metadata.overallScore,
        history: JSON.stringify([metadata])
      },
      update: {
        overallScore: metadata.overallScore
      }
    });

    return NextResponse.json({
      success: true,
      tokenURI,
      overallScore: metadata.overallScore
    });
  } catch (error) {
    console.error('Gig Complete API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
