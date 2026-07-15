import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  try {
    const user = await prisma.user.findFirst();
    if (!user) return NextResponse.json({ error: 'No user' });

    const res = await prisma.clientProfile.upsert({
      where: { userId: user.id },
      update: { companyName: 'horse' },
      create: { userId: user.id, companyName: 'horse' }
    });

    return NextResponse.json({ success: true, res });
  } catch (error: any) {
    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}
