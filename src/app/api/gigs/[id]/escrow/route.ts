import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { auth } from '@/auth';
import { ethers } from 'ethers';
import { ERC20_ABI, GIG_ESCROW_ABI } from '@/lib/blockchain/config';

export const runtime = 'nodejs';

function getRpcUrl() {
  return process.env.XLAYER_RPC_URL || process.env.NEXT_PUBLIC_XLAYER_RPC_URL || process.env.NEXT_PUBLIC_RPC_URL;
}

function parseTokenAmount(amount: any) {
  return ethers.parseEther(String(amount));
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { escrowAddress } = await req.json();
    const { id } = await params;

    const gig = await prisma.gig.findUnique({
      where: { id },
      include: {
        client: true,
        freelancer: true,
      },
    });

    if (!gig) return NextResponse.json({ error: 'Gig not found' }, { status: 404 });
    if (gig.clientId !== session.user.id) return NextResponse.json({ error: 'Only the client can set the escrow address' }, { status: 403 });
    if (!ethers.isAddress(escrowAddress)) return NextResponse.json({ error: 'Invalid escrow address' }, { status: 400 });

    const rpcUrl = getRpcUrl();
    const allowUnverifiedSync = process.env.ALLOW_UNVERIFIED_ESCROW_SYNC === 'true';
    let verification: any = {
      verified: false,
      warning: 'On-chain verification was not run.',
    };

    if (!rpcUrl && !allowUnverifiedSync) {
      return NextResponse.json(
        { error: 'Escrow verification RPC is not configured. Set XLAYER_RPC_URL or enable ALLOW_UNVERIFIED_ESCROW_SYNC for demos only.' },
        { status: 500 },
      );
    }

    if (rpcUrl) {
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const escrow = new ethers.Contract(escrowAddress, GIG_ESCROW_ABI, provider);

      const [chain, contractClient, contractFreelancer, token, totalAmount, state, milestoneCount] = await Promise.all([
        provider.getNetwork(),
        escrow.client(),
        escrow.freelancer(),
        escrow.paymentToken(),
        escrow.totalAmount(),
        escrow.state(),
        escrow.getMilestoneCount(),
      ]);

      const expectedAmount = parseTokenAmount(gig.budget);
      const tokenContract = new ethers.Contract(token, ERC20_ABI, provider);
      const escrowBalance = await tokenContract.balanceOf(escrowAddress);

      const clientWallet = gig.client.walletAddress;
      const freelancerWallet = gig.freelancer?.walletAddress;

      if (clientWallet && contractClient.toLowerCase() !== clientWallet.toLowerCase()) {
        return NextResponse.json({ error: 'Escrow client does not match the gig client wallet' }, { status: 400 });
      }

      if (freelancerWallet && contractFreelancer.toLowerCase() !== freelancerWallet.toLowerCase()) {
        return NextResponse.json({ error: 'Escrow freelancer does not match the hired freelancer wallet' }, { status: 400 });
      }

      if (totalAmount < expectedAmount) {
        return NextResponse.json({ error: 'Escrow total amount is lower than the agreed gig budget' }, { status: 400 });
      }

      if (escrowBalance < expectedAmount || Number(state) < 1) {
        return NextResponse.json({ error: 'Escrow contract is not funded on-chain yet' }, { status: 400 });
      }

      verification = {
        verified: true,
        chainId: Number(chain.chainId),
        tokenAddress: token,
        totalAmount: totalAmount.toString(),
        escrowBalance: escrowBalance.toString(),
        state: Number(state),
        milestoneCount: Number(milestoneCount),
      };
    } else if (allowUnverifiedSync) {
      verification = {
        verified: false,
        warning: 'Escrow was accepted without RPC verification because ALLOW_UNVERIFIED_ESCROW_SYNC=true.',
      };
    }

    await prisma.$transaction(async (tx) => {
      await tx.gig.update({
        where: { id },
        data: {
          status: 'IN_PROGRESS',
          escrowContractAddress: escrowAddress,
          escrowFunded: verification.verified || allowUnverifiedSync,
        }
      });

      await tx.escrow.upsert({
        where: { gigId: id },
        update: {
          contractAddress: escrowAddress,
          chainId: verification.chainId || parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '196'),
          tokenAddress: verification.tokenAddress,
          totalAmount: gig.budget,
          status: verification.verified ? 'FUNDED' : 'CREATED',
          milestoneDetails: verification as any,
        },
        create: {
          gigId: id,
          contractAddress: escrowAddress,
          chainId: verification.chainId || parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '196'),
          tokenAddress: verification.tokenAddress,
          totalAmount: gig.budget,
          status: verification.verified ? 'FUNDED' : 'CREATED',
          milestoneDetails: verification as any,
        },
      });
    });

    return NextResponse.json({ success: true, verification });
  } catch (error) {
    console.error('Escrow Sync API Error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status: 500 });
  }
}
