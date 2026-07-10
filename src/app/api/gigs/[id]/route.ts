import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const gig = await prisma.gig.findUnique({
      where: { id },
      include: {
        client: {
          select: { name: true, avatarUrl: true, clientProfile: true },
        },
        proposals: {
          include: {
            freelancer: {
              select: { name: true, avatarUrl: true, freelancerProfile: true, reputationScore: true },
            },
          },
        },
      },
    });

    if (!gig) {
      return NextResponse.json({ error: 'Gig not found' }, { status: 404 });
    }

    return NextResponse.json(gig);
  } catch (error) {
    console.error('Error fetching gig:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
