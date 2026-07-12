import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/auth";

export async function GET(req: Request) {
  try {
    const bounties = await prisma.bounty.findMany({
      where: { status: "OPEN" },
      orderBy: { createdAt: "desc" },
      include: {
        client: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });
    return NextResponse.json(bounties);
  } catch (error) {
    console.error("GET /api/bounties Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, description, platform, action, targetUrl, targetAccount, poolAmount, rewardAmount, maxParticipants } = await req.json();

    const bounty = await prisma.bounty.create({
      data: {
        clientId: session.user.id,
        title,
        description,
        platform,
        action,
        targetUrl,
        targetAccount,
        poolAmount: parseFloat(poolAmount),
        rewardAmount: parseFloat(rewardAmount),
        maxParticipants: parseInt(maxParticipants),
      },
    });

    return NextResponse.json(bounty);
  } catch (error) {
    console.error("POST /api/bounties Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
