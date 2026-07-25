import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { askJson } from '@/lib/ai/llm';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { gigId, submissionUrl } = await req.json();
    if (!gigId || !submissionUrl) {
      return NextResponse.json({ error: 'gigId and submissionUrl are required' }, { status: 400 });
    }

    const gig = await prisma.gig.findUnique({
      where: { id: gigId },
      include: { tasks: true }
    });

    if (!gig) {
      return NextResponse.json({ error: 'Gig not found' }, { status: 404 });
    }

    const reviewTasks = gig.tasks.filter(t => t.status === 'REVIEW');
    const reviewTaskContext = reviewTasks.length > 0 
      ? `Tasks currently under review: ${reviewTasks.map(t => t.title).join(', ')}`
      : 'No specific tasks under review, evaluate the gig as a whole.';

    const systemPrompt = `You are the SkillMint Arbiter Agent. Your job is to review a freelancer's submitted work link against the client's gig requirements and suggest an approval decision.
Because you cannot browse the internet directly in this demo environment, you must simulate the review by evaluating if the URL looks like a valid submission (e.g. github PR, vercel app) that matches the context of the gig.
If it is a valid, high-quality URL string (like a github PR), you should approve it. If it is random gibberish or unrelated to code/design, reject it.

Respond ONLY with a JSON object containing:
- decision: "APPROVE", "REJECT", or "PARTIAL"
- confidenceScore: number (0-100)
- reasoning: A professional, concise explanation of your decision.`;

    const userPrompt = `
GIG TITLE: ${gig.title}
GIG DESCRIPTION: ${gig.description}
${reviewTaskContext}

FREELANCER SUBMISSION URL: ${submissionUrl}
`;

    const generated = await askJson<{ decision: string, confidenceScore: number, reasoning: string }>(
      systemPrompt, 
      userPrompt
    );

    // Log the agent's action
    await prisma.agentLog.create({
      data: {
        userId: session.user.id,
        agentType: 'ORCHESTRATOR', // Using Orchestrator/Arbiter
        action: 'Arbiter Review',
        input: { gigId, submissionUrl },
        output: generated
      }
    });

    return NextResponse.json(generated);
  } catch (error: any) {
    console.error('Arbiter Agent Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to review submission' }, { status: 500 });
  }
}
