import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/auth";
import { MockZKProvider } from "@/lib/verification";
import { ethers } from "ethers";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { id: bountyId } = await params;
    const { proofData, autoClaimed = false } = await req.json();

    const bounty = await prisma.bounty.findUnique({ where: { id: bountyId } });
    if (!bounty || bounty.status !== "OPEN") {
      return NextResponse.json({ error: "Bounty not open" }, { status: 400 });
    }

    // 1. Check if user already claimed
    const existingClaim = await prisma.bountyClaim.findUnique({
      where: {
        bountyId_userId: { bountyId, userId }
      }
    });

    if (existingClaim) {
      return NextResponse.json({ error: "Already claimed" }, { status: 400 });
    }

    // 2. Verify ZK Proof using Strategy Pattern
    const verifier = new MockZKProvider();
    const isValid = await verifier.verify(proofData, bounty.targetUrl);

    if (!isValid) {
      return NextResponse.json({ error: "Verification Failed" }, { status: 400 });
    }

    // 3. Generate a backend signature for the user to claim on-chain themselves
    const txHash = null;
    let signature = "";
    try {
      const privateKey = process.env.PRIVATE_KEY;
      if (privateKey) {
        const backendWallet = new ethers.Wallet(privateKey);
        
        // EIP-191 standard signed message: keccak256(bountyId, userId)
        const messageHash = ethers.solidityPackedKeccak256(
          ["string", "string"], 
          [bountyId, userId]
        );
        signature = await backendWallet.signMessage(ethers.getBytes(messageHash));
      }
    } catch (e) {
      console.error("Signature generation failed:", e);
      return NextResponse.json({ error: "Failed to generate claim signature" }, { status: 500 });
    }

    // 4. Record the claim and update reputation
    const claim = await prisma.bountyClaim.create({
      data: {
        bountyId,
        userId,
        status: "VERIFIED",
        proofData,
        txHash,
        autoClaimed
      }
    });

    await prisma.bounty.update({
      where: { id: bountyId },
      data: { participantsCount: { increment: 1 } }
    });

    // 5. Increase Social Reliability Score and Task Count
    const rep = await prisma.reputation.findUnique({ where: { userId } });
    if (rep) {
      await prisma.reputation.update({
        where: { userId },
        data: {
          socialReliabilityScore: { increment: 2 }, // Small bump per bounty
          tasksCompleted: { increment: 1 }
        }
      });
    } else {
      await prisma.reputation.create({
        data: {
          userId,
          socialReliabilityScore: 52,
          tasksCompleted: 1
        }
      });
    }

    return NextResponse.json({ success: true, claim, signature });
  } catch (error) {
    console.error("POST /api/bounties/[id]/claim Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
