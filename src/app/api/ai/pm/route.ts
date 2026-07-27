import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { askJson } from '@/lib/ai/llm';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { prompt } = await req.json();
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const systemPrompt = `You are the SkillMint PM Agent. Your job is to take a raw project idea from a client and turn it into a structured, professional gig posting.
Respond with a JSON object containing:
- title: A concise, professional title.
- description: A detailed description including scope, deliverables, and requirements.
- budget: A suggested budget as a number (USDT).
- skills: A comma-separated string of up to 5 required technical skills.`;

    const generated = await askJson<{ title: string, description: string, budget: number, skills: string }>(
      systemPrompt, 
      prompt
    );

    return NextResponse.json(generated);
  } catch (error: any) {
    console.error('PM Agent Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate gig' }, { status: 500 });
  }
}
