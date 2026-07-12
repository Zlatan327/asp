import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/auth";
import { MockZKProvider } from "@/lib/verification";
import { ethers } from "ethers";
import BountyPoolArtifact from "../../../../../../artifacts/contracts/BountyPool.sol/BountyPool.json";

// In production, load this securely from env.
const BOUNTY_POOL_ADDRESS = "0x6d4E3c53F602706f56CE6CDBd280D9b44Ef4Cb33";

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

    // 3. Trigger Smart Contract Payout from backend
    let txHash = "mock_tx_hash";
    try {
      const rpcUrl = process.env.XLAYER_TESTNET_RPC || "https://testrpc.xlayer.tech/terigon";
      const privateKey = process.env.PRIVATE_KEY;
      if (privateKey) {
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const backendWallet = new ethers.Wallet(privateKey, provider);
        const bountyContract = new ethers.Contract(BOUNTY_POOL_ADDRESS, BountyPoolArtifact.abi, backendWallet);

        // Get user wallet
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (user && user.walletAddress) {
          const tx = await bountyContract.distributeReward(bountyId, user.walletAddress);
          const receipt = await tx.wait();
          txHash = receipt.hash;
        }
      }
    } catch (e) {
      console.error("Smart contract execution failed:", e);
      // For hackathon MVP, if gas fails we still record the DB claim
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

    return NextResponse.json({ success: true, claim });
  } catch (error) {
    console.error("POST /api/bounties/[id]/claim Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
