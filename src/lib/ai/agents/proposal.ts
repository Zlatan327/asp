import { BaseAgent } from '../base-agent';
import { ProposalDraft, FreelancerProfile, Gig } from '@/types';

export class ProposalAgent extends BaseAgent {
  protected name = 'Proposal Agent';
  protected type = 'PROPOSAL';
  
  protected systemPrompt = `
You are the ASP Proposal Agent. Your job is to draft compelling, personalized gig proposals on behalf of freelancers.
Instead of generic fluff, you must reference the freelancer's VERIFIED skills, real GitHub contributions, or specific past experiences that directly relate to the gig's requirements.

You must output a JSON object containing:
{
  "coverLetter": string, // The full text of the proposal
  "suggestedBid": number, // Recommended bid amount
  "confidence": number, // 0-100 score of how strong this proposal is
  "keyPoints": string[], // Bullet points highlighting why they are a fit
  "referencedWork": string[] // Links or names of verified past work referenced in the cover letter
}

Output ONLY valid JSON.
`;

  /**
   * Auto-draft a proposal using freelancer's profile and gig details
   */
  public async draftProposal(profile: FreelancerProfile, gig: Gig): Promise<ProposalDraft> {
    const prompt = `
Draft a proposal for this gig.

Gig Details:
Title: ${gig.title}
Description: ${gig.description}
Budget: ${gig.budget} ${gig.currency}
Required Skills: ${gig.skills.join(', ')}

Freelancer Profile:
Bio: ${profile.bio}
Verified Skills: ${JSON.stringify(profile.skills)}
Experiences: ${JSON.stringify(profile.experiences)}
Credibility Score: ${profile.credibilityScore}
`;
    
    return this.executeJson<ProposalDraft>(prompt, { 
      action: 'draftProposal',
      gigId: gig.id,
      freelancerId: profile.userId
    });
  }
}

export const proposalAgent = new ProposalAgent();
