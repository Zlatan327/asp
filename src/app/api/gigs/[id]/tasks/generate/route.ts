import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { auth } from '@/auth';
import { taskManagerAgent } from '@/lib/ai/agents/task-manager';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const gig = await prisma.gig.findUnique({ where: { id } });
    if (!gig || (gig.clientId !== session.user.id && gig.freelancerId !== session.user.id)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Prepare Gig object for TaskManagerAgent (parse milestones)
    const gigData: any = {
      ...gig,
      milestones: JSON.parse(gig.milestones || '[]')
    };

    const generatedTasks = await taskManagerAgent.generateTasks(gigData);

    // Get max order
    const lastTask = await prisma.task.findFirst({
      where: { gigId: id },
      orderBy: { order: 'desc' }
    });
    let orderOffset = lastTask ? lastTask.order + 1 : 0;

    // Create tasks in DB
    const creations = generatedTasks.map((t, index) => {
      return prisma.task.create({
        data: {
          gigId: id,
          title: t.title,
          description: t.description,
          milestoneIndex: t.milestoneIndex,
          deliverables: JSON.stringify(t.deliverables || []),
          order: orderOffset + index
        }
      });
    });

    const tasks = await prisma.$transaction(creations);

    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Generate Tasks Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
