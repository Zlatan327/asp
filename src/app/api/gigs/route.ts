import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { auth } from '@/auth';

// Fetch active gigs (Marketplace)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const budgetType = searchParams.get('budgetType');
    const experienceLevel = searchParams.get('experienceLevel');

    const where: any = { status: 'OPEN' };
    if (budgetType) where.budgetType = budgetType;
    if (experienceLevel) where.experienceLevel = experienceLevel;

    const gigs = await prisma.gig.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        client: {
          select: { name: true, avatarUrl: true, clientProfile: true },
        },
      },
    });

    return NextResponse.json(gigs);
  } catch (error) {
    console.error('Error fetching gigs:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Create a new Gig (Client)
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (user?.role !== 'CLIENT' && user?.role !== 'BOTH') {
      return NextResponse.json({ error: 'Only clients can post gigs' }, { status: 403 });
    }

    const data = await req.json();

    if (data.budget == null || isNaN(parseFloat(data.budget))) {
      return NextResponse.json({ error: 'Valid budget is required' }, { status: 400 });
    }

    const newGig = await prisma.gig.create({
      data: {
        clientId: session.user.id,
        title: data.title,
        description: data.description,
        budget: parseFloat(data.budget),
        budgetType: data.budgetType || 'FIXED',
        currency: 'USDT',
        experienceLevel: data.experienceLevel || 'ANY',
        estimatedDuration: data.estimatedDuration,
        milestones: JSON.stringify(data.milestones || []),
        skills: JSON.stringify(data.skills || []),
      },
    });

    return NextResponse.json(newGig, { status: 201 });
  } catch (error) {
    console.error('Error creating gig:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
