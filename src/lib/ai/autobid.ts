import { prisma } from '@/lib/db/prisma';
import { askJson } from '@/lib/ai/llm';

export async function runAutoBidderForGig(gigId: string) {
  try {
    const gig = await prisma.gig.findUnique({ where: { id: gigId } });
    if (!gig) return;

    // Find freelancers who haven't applied yet, have a scoutReport, and are available
    // For demo purposes, we fetch any freelancer with a scoutReport.
    const freelancers = await prisma.freelancerProfile.findMany({
      where: {
        scoutReport: { not: null },
        user: {
          proposals: { none: { gigId } }
        }
      },
      include: { user: true }
    });

    for (const freelancer of freelancers) {
      if (!freelancer.scoutReport) continue;
      
      const scoutReport = typeof freelancer.scoutReport === 'string' 
        ? JSON.parse(freelancer.scoutReport) 
        : freelancer.scoutReport;

      const systemPrompt = `You are the SkillMint Auto-Bidder agent representing a freelancer. 
Your job is to analyze the Gig requirements and the Freelancer's Scout Report to determine if they are a good match.
If they are a strong match (confidence > 80), generate a professional, concise cover letter and a suggested bid.
If they are not a good match, set isMatch to false.

Respond ONLY in JSON format:
{
  "isMatch": boolean,
  "confidence": number (0-100),
  "coverLetter": string (if isMatch is true),
  "suggestedBid": number (USDT, if isMatch is true)
}`;

      const userPrompt = `
GIG DETAILS:
Title: ${gig.title}
Description: ${gig.description}
Budget: ${gig.budget} ${gig.currency}
Skills Required: ${gig.skills}

FREELANCER SCOUT REPORT:
${JSON.stringify(scoutReport)}
`;

      const aiResponse = await askJson<{ isMatch: boolean, confidence: number, coverLetter?: string, suggestedBid?: number }>(
        systemPrompt, 
        userPrompt
      );

      if (aiResponse.isMatch && aiResponse.confidence >= 80 && aiResponse.coverLetter && aiResponse.suggestedBid) {
        // Create proposal
        await prisma.proposal.create({
          data: {
            gigId,
            freelancerId: freelancer.userId,
            coverLetter: aiResponse.coverLetter,
            bidAmount: aiResponse.suggestedBid,
            generatedByAgent: true,
            agentConfidence: aiResponse.confidence,
            matchScore: aiResponse.confidence
          }
        });

        // Log agent action
        await prisma.agentLog.create({
          data: {
            userId: freelancer.userId,
            agentType: 'PROPOSAL',
            action: 'Auto-Submitted Proposal',
            input: { gigId, gigTitle: gig.title },
            output: { confidence: aiResponse.confidence, bid: aiResponse.suggestedBid }
          }
        });
      }
    }
  } catch (err) {
    console.error('AutoBidder failed for gig', gigId, err);
  }
}
