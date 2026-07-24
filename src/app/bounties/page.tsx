import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { redirect } from "next/navigation";
import BountyClient from "./BountyClient";
import { safeParseJson } from "@/lib/json";

export default async function BountiesPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { reputationScore: true, socialAccounts: true },
  });

  const bounties = await prisma.bounty.findMany({
    where: { status: "OPEN" },
    orderBy: { createdAt: "desc" },
    include: {
      client: { select: { name: true, avatarUrl: true } },
    },
  });

  // Calculate if user unlocks bot
  const tasksCompleted = user?.reputationScore?.tasksCompleted || 0;
  const srs = user?.reputationScore?.socialReliabilityScore || 50;
  const botUnlocked = tasksCompleted >= 10 && srs >= 90;
  const reputationBadges = safeParseJson<any[]>(user?.reputationScore?.badges, []);
  const rentedBot = reputationBadges.some((badge) => badge?.id === "autobot-rented");

  // Check social connections
  const hasTwitter = user?.socialAccounts?.some((s) => s.platform === "TWITTER") || false;
  const hasDiscord = user?.socialAccounts?.some((s) => s.platform === "DISCORD") || false;

  return (
    <BountyClient 
      initialBounties={bounties} 
      userId={session.user.id} 
      botUnlocked={botUnlocked} 
      rentedBot={rentedBot}
      srs={srs} 
      tasksCompleted={tasksCompleted}
      hasTwitter={hasTwitter}
      hasDiscord={hasDiscord}
    />
  );
}
