import { BaseAgent } from '../base-agent';
import { ScoutReport } from '@/types';

export class ScoutAgent extends BaseAgent {
  protected name = 'Scout Agent';
  protected type = 'SCOUT';
  
  protected systemPrompt = `
You are the ASP Scout Agent. Your job is to analyze a freelancer's raw public footprint (GitHub repos, Twitter posts, Discord roles, or CV) and synthesize a comprehensive, verified credibility profile.
You must output a highly detailed JSON object conforming to the ScoutReport interface.

Guidelines:
1. Verify claims by cross-referencing input data (e.g. if CV claims React but GitHub shows no React repos, lower confidence).
2. Assign confidence scores (0-100) to each skill.
3. Identify relevant experiences and categorize them.
4. Calculate an overall credibilityScore (0-100) based on the richness and consistency of the footprint.
5. Provide a short, persuasive narrative summarizing the freelancer's actual verifiable capabilities.

Output ONLY valid JSON matching the ScoutReport TypeScript interface exactly. Do not include markdown formatting or comments in the JSON.
`;

  /**
   * Analyze raw data and generate a structured scout profile
   */
  public async analyzeProfile(rawData: Record<string, any>): Promise<ScoutReport> {
    // Truncate to avoid context window overflow (roughly 20,000 chars)
    const rawDataString = JSON.stringify(rawData);
    const safeDataString = rawDataString.length > 20000 
      ? rawDataString.substring(0, 20000) + '... [TRUNCATED]' 
      : rawDataString;

    const prompt = `
Analyze the following raw data extracted from a user's CV and connected social accounts.
Generate a comprehensive, verified credibility profile.

Raw Data:
${safeDataString}
`;
    
    const result = await this.executeJson<ScoutReport>(prompt, { 
      action: 'analyzeProfile',
      dataSources: Object.keys(rawData)
    });

    // Add generatedAt timestamp
    return {
      ...result,
      generatedAt: new Date().toISOString()
    };
  }
}

export const scoutAgent = new ScoutAgent();
