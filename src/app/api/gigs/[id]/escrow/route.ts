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

    // Architectural Security Fix: In production, verify the deposit on-chain here using an RPC provider.
    // e.g., const provider = new ethers.JsonRpcProvider(...);
    // const contract = new ethers.Contract(escrowAddress, ABI, provider);
    // const balance = await contract.escrowBalance();
    // if (balance < gig.budget) throw new Error("Underfunded");

    await prisma.gig.update({
      where: { id },
      data: {
        status: 'IN_PROGRESS', // Move from PENDING_FUNDS to IN_PROGRESS
        escrowContractAddress: escrowAddress,
        escrowFunded: true
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Escrow Sync API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
