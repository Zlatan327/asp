import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { askJson } from '@/lib/ai/llm';

export const runtime = 'nodejs';

type GigDraft = {
  title: string;
  description: string;
  budget: number;
  budgetType: 'FIXED' | 'HOURLY';
  experienceLevel: 'ANY' | 'BEGINNER' | 'INTERMEDIATE' | 'EXPERT';
  skills: string[];
  estimatedDuration: string;
  milestones: Array<{ title: string; description: string; amount: number }>;
};

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { idea } = await req.json();
    const input = String(idea || '').trim();
    if (input.length < 10) {
      return NextResponse.json({ error: 'Describe the project idea in at least 10 characters' }, { status: 400 });
    }

    const draft = await askJson<GigDraft>(
      `You are the SkillMint PM Agent. Convert a client's raw project idea into a clear freelance gig.
Return JSON with title, description, budget, budgetType, experienceLevel, skills, estimatedDuration, and milestones.
Use USDT budget numbers. Keep the scope practical for a hackathon marketplace.`,
      `Client project idea:\n${input}`,
      { temperature: 0.4 },
    );

    return NextResponse.json({
      title: draft.title,
      description: draft.description,
      budget: Number(draft.budget || 150),
      budgetType: draft.budgetType || 'FIXED',
      experienceLevel: draft.experienceLevel || 'INTERMEDIATE',
      skills: Array.isArray(draft.skills) ? draft.skills : [],
      estimatedDuration: draft.estimatedDuration || '7 days',
      milestones: Array.isArray(draft.milestones) ? draft.milestones : [],
    });
  } catch (error) {
    console.error('POST /api/gigs/draft Error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status: 500 });
  }
}
