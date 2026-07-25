import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { ethers } from 'ethers';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const agentLog = await prisma.agentLog.findUnique({
      where: { id }
    });

    if (!agentLog) {
      return NextResponse.json({ error: 'Agent Log not found' }, { status: 404 });
    }

    if (agentLog.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if the output already has a txHash
    const output = typeof agentLog.output === 'object' && agentLog.output !== null 
      ? (agentLog.output as any) 
      : {};

    if (output.txHash) {
      return NextResponse.json({ error: 'Already published on-chain' }, { status: 400 });
    }

    // Generate Signature using Backend Wallet
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      return NextResponse.json({ error: 'Backend wallet not configured' }, { status: 500 });
    }

    const backendWallet = new ethers.Wallet(privateKey);
    const logDataStr = JSON.stringify({
      agentType: agentLog.agentType,
      action: agentLog.action,
      output: agentLog.output,
      timestamp: agentLog.createdAt.toISOString()
    });

    const messageHash = ethers.id(logDataStr); // keccak256 hash of the log
    const signature = await backendWallet.signMessage(ethers.getBytes(messageHash));

    // The frontend will submit this payload
    const payload = ethers.hexlify(ethers.toUtf8Bytes(JSON.stringify({
      logId: agentLog.id,
      hash: messageHash,
      sig: signature
    })));

    return NextResponse.json({ success: true, payload, signature, messageHash });
  } catch (error: any) {
    console.error('Agent Attest API Error:', error);
    return NextResponse.json({ error: 'Failed to generate attestation' }, { status: 500 });
  }
}

// PATCH to save the transaction hash after the user publishes it
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { txHash } = await req.json();

    if (!txHash) {
      return NextResponse.json({ error: 'txHash is required' }, { status: 400 });
    }

    const agentLog = await prisma.agentLog.findUnique({
      where: { id }
    });

    if (!agentLog || agentLog.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not found or forbidden' }, { status: 404 });
    }

    const output = typeof agentLog.output === 'object' && agentLog.output !== null 
      ? (agentLog.output as any) 
      : {};

    const updatedOutput = { ...output, txHash };

    const updatedLog = await prisma.agentLog.update({
      where: { id },
      data: { output: updatedOutput }
    });

    return NextResponse.json({ success: true, updatedLog });
  } catch (error: any) {
    console.error('Save TxHash Error:', error);
    return NextResponse.json({ error: 'Failed to save txHash' }, { status: 500 });
  }
}
