import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { auth } from '@/auth';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string, taskId: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, taskId } = await params;
    const { status, deliverables } = await req.json();

    const gig = await prisma.gig.findUnique({ where: { id } });
    if (!gig || (gig.clientId !== session.user.id && gig.freelancerId !== session.user.id)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (deliverables) updateData.deliverables = JSON.stringify(deliverables);

    const task = await prisma.task.update({
      where: { id: taskId, gigId: id },
      data: updateData
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error('Update Task Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string, taskId: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, taskId } = await params;

    const gig = await prisma.gig.findUnique({ where: { id } });
    if (!gig || (gig.clientId !== session.user.id && gig.freelancerId !== session.user.id)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await prisma.task.delete({
      where: { id: taskId, gigId: id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete Task Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
