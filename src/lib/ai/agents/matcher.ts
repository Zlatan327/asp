import { BaseAgent } from '../base-agent';
import { MatchResult, FreelancerProfile, Gig } from '@/types';

export class MatcherAgent extends BaseAgent {
  protected name = 'Matcher Agent';
  protected type = 'MATCHER';
  
  protected systemPrompt = `
You are the ASP Matcher Agent. Your job is to determine the exact fit between a Freelancer's verified profile and a Gig's requirements.
You look beyond simple keyword matching and analyze semantic fit, seniority, budget constraints, and verified credibility.

You must output a JSON object containing:
{
  "score": number, // 0-100 overall fit score
  "reasons": string[], // List of reasons why this is or isn't a good fit
  "skillOverlap": string[], // Verified skills that match the gig
  "missingSkills": string[] // Required skills the freelancer lacks
}

Output ONLY valid JSON.
`;

  /**
   * Evaluate the fit between a freelancer and a gig
   */
  public async evaluateMatch(profile: FreelancerProfile, gig: Gig): Promise<MatchResult> {
    const prompt = `
Evaluate the fit between this Gig and this Freelancer.

Gig Details:
Title: ${gig.title}
Description: ${gig.description}
Budget: ${gig.budget} ${gig.currency} (${gig.budgetType})
Required Skills: ${gig.skills.join(', ')}
Experience Level: ${gig.experienceLevel}

Freelancer Profile:
Headline: ${profile.headline}
Bio: ${profile.bio}
Credibility Score: ${profile.credibilityScore}
Verified Skills: ${JSON.stringify(profile.skills.map(s => s.name + " (Conf: " + s.confidence + "%)"))}
Experiences: ${JSON.stringify(profile.experiences.map(e => e.role + " at " + e.company + " (" + e.duration + ")"))}
`;
    
    const result = await this.executeJson<MatchResult>(prompt, { 
      action: 'evaluateMatch',
      gigId: gig.id,
      freelancerId: profile.userId
    });

    return {
      ...result,
      gigId: gig.id,
      freelancerId: profile.userId
    };
  }

  /**
   * Batch evaluate multiple freelancers against a gig (returns sorted by score)
   */
  public async rankCandidates(gig: Gig, profiles: FreelancerProfile[]): Promise<MatchResult[]> {
    const matches = await Promise.all(
      profiles.map(p => this.evaluateMatch(p, gig))
    );
    
    return matches.sort((a, b) => b.score - a.score);
  }
}

export const matcherAgent = new MatcherAgent();
