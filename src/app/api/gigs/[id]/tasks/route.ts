import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { auth } from '@/auth';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const tasks = await prisma.task.findMany({
      where: { gigId: id },
      orderBy: { order: 'asc' }
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Fetch Tasks Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { title, description, milestoneIndex, deliverables } = await req.json();

    const gig = await prisma.gig.findUnique({ where: { id } });
    if (!gig || (gig.clientId !== session.user.id && gig.freelancerId !== session.user.id)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get max order
    const lastTask = await prisma.task.findFirst({
      where: { gigId: id },
      orderBy: { order: 'desc' }
    });

    const task = await prisma.task.create({
      data: {
        gigId: id,
        title,
        description,
        milestoneIndex,
        deliverables: JSON.stringify(deliverables || []),
        order: lastTask ? lastTask.order + 1 : 0
      }
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error('Create Task Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
