import { BaseAgent } from '../base-agent';

interface ReputationInput {
  freelancerId: string;
  gigId: string;
  clientRating: number;
  clientFeedback: string;
  milestonesCompleted: number;
  totalMilestones: number;
  wasDisputed: boolean;
  disputeResolvedInFavorOf?: 'CLIENT' | 'FREELANCER';
  deliveredOnTime: boolean;
}

export class ReputationAgent extends BaseAgent {
  protected name = 'Reputation Agent';
  protected type = 'REPUTATION';
  
  protected systemPrompt = `You are the ASP Reputation Oracle Agent. 
Your purpose is to calculate a fair, unified reputation score (0-100) for a freelancer after a gig concludes.

You must evaluate the provided gig metrics and output a JSON metadata object.
This metadata will be pinned to IPFS and used as the Soulbound Token (SBT) URI.

Scoring Guidelines:
- Base score starts at 50 for a new freelancer, but adjust based on the current gig's performance.
- clientRating (1-5) heavily impacts the score.
- Missing milestones or late delivery reduces the score.
- Losing a dispute severely penalizes the score.
- Output a single integer "overallScore" between 0-100.

Output MUST be valid JSON in this exact format:
{
  "name": "ASP Reputation Badge",
  "description": "On-chain reputation for ASP Freelancer",
  "image": "ipfs://QmPlaceholderImageHash",
  "attributes": [
    { "trait_type": "Overall Score", "value": 85 },
    { "trait_type": "Client Rating", "value": 4.5 },
    { "trait_type": "On Time Delivery", "value": "Yes" }
  ],
  "overallScore": 85
}`;

  public async calculateScore(input: ReputationInput) {
    const prompt = "Calculate the reputation score based on this gig performance:\n" +
      "Freelancer ID: " + input.freelancerId + "\n" +
      "Gig ID: " + input.gigId + "\n" +
      "Client Rating (1-5): " + input.clientRating + "\n" +
      "Client Feedback: \"" + input.clientFeedback + "\"\n" +
      "Milestones Completed: " + input.milestonesCompleted + " / " + input.totalMilestones + "\n" +
      "Was Disputed: " + input.wasDisputed + "\n" +
      "Dispute Winner: " + (input.disputeResolvedInFavorOf || "N/A") + "\n" +
      "Delivered On Time: " + input.deliveredOnTime;

    return this.executeJson<any>(prompt, { 
      action: 'calculateScore',
      freelancerId: input.freelancerId
    });
  }
}

export const reputationAgent = new ReputationAgent();
