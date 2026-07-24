import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { safeParseJson } from '@/lib/json';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { txHash, mode } = await req.json();
    if (!txHash || typeof txHash !== 'string') {
      return NextResponse.json({ error: 'Rental payment transaction hash is required' }, { status: 400 });
    }

    if (mode === 'demo' && process.env.ENABLE_DEMO_AUTOBOT_RENTAL !== 'true') {
      return NextResponse.json({ error: 'Demo Auto-Bot rental is disabled' }, { status: 403 });
    }

    const badge = {
      id: 'autobot-rented',
      name: 'Auto-Bot Rental Active',
      icon: 'bot',
      description: mode === 'demo' ? 'Demo Auto-Bot rental enabled.' : 'Auto-Bot rental activated by USDT payment.',
      earnedAt: new Date().toISOString(),
      category: 'achievement',
      txHash,
      mode: mode === 'demo' ? 'demo' : 'paid',
    };

    const current = await prisma.reputation.findUnique({ where: { userId: session.user.id } });
    const badges = safeParseJson<any[]>(current?.badges, []);
    const nextBadges = [...badges.filter((item) => item?.id !== badge.id), badge];

    await prisma.reputation.upsert({
      where: { userId: session.user.id },
      update: { badges: nextBadges },
      create: {
        userId: session.user.id,
        badges: nextBadges,
      },
    });

    return NextResponse.json({ success: true, badge });
  } catch (error) {
    console.error('POST /api/autobot/rent Error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status: 500 });
  }
}
