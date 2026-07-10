import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { auth } from '@/auth';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { escrowAddress } = await req.json();
    const { id } = await params;

    const gig = await prisma.gig.findUnique({ where: { id } });

    if (!gig) return NextResponse.json({ error: 'Gig not found' }, { status: 404 });
    if (gig.clientId !== session.user.id) return NextResponse.json({ error: 'Only the client can set the escrow address' }, { status: 403 });

    await prisma.gig.update({
      where: { id },
      data: {
        escrowContractAddress: escrowAddress,
        escrowFunded: true // For simplicity, we assume if they deployed & funded it, it's funded. In reality, indexer listens to events.
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Escrow Sync API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
