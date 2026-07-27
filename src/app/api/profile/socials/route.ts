import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const socials = await prisma.socialAccount.findMany({
      where: { userId: session.user.id },
      select: {
        platform: true,
        handle: true,
        profileUrl: true,
        verified: true,
        lastScanned: true,
      },
      orderBy: { platform: 'asc' },
    });

    return NextResponse.json({ socials });
  } catch (error) {
    console.error('GET /api/profile/socials Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
