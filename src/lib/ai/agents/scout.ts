import { BaseAgent } from '../base-agent';
import { Badge, ScoutReport, SkillAssessment } from '@/types';

function topLanguages(rawData: Record<string, any>) {
  const languages: Record<string, number> = {};
  const scans = Array.isArray(rawData.socialScans) ? rawData.socialScans : [];

  for (const scan of scans) {
    const scanLanguages = scan?.metrics?.languages || scan?.evidence?.languages || {};
    for (const [language, value] of Object.entries(scanLanguages)) {
      languages[language] = (languages[language] || 0) + Number(value || 0);
    }
  }

  return Object.entries(languages)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name]) => name);
}

function inferSkills(rawData: Record<string, any>): SkillAssessment[] {
  const cvText = String(rawData.cvText || rawData.cv?.text || '').toLowerCase();
  const languageSkills = topLanguages(rawData).map((name) => ({
    name,
    category: 'Programming',
    confidence: 82,
    sources: ['github'],
  }));

  const keywordMap: Array<[string, string, string[]]> = [
    ['React', 'Frontend', ['react']],
    ['Next.js', 'Frontend', ['next.js', 'nextjs']],
    ['TypeScript', 'Programming', ['typescript']],
    ['JavaScript', 'Programming', ['javascript']],
    ['Node.js', 'Backend', ['node.js', 'nodejs']],
    ['Solidity', 'Blockchain', ['solidity']],
    ['Smart Contract Security', 'Blockchain', ['smart contract', 'audit']],
    ['Product Design', 'Design', ['figma', 'product design', 'ui/ux']],
    ['AI Integration', 'AI', ['llm', 'openai', 'gemini', 'ai agent']],
  ];

  const keywordSkills = keywordMap
    .filter(([, , keywords]) => keywords.some((keyword) => cvText.includes(keyword)))
    .map(([name, category]) => ({
      name,
      category,
      confidence: 70,
      sources: ['cv'],
    }));

  const merged = new Map<string, SkillAssessment>();
  for (const skill of [...languageSkills, ...keywordSkills]) {
    const existing = merged.get(skill.name);
    if (existing) {
      existing.confidence = Math.min(98, Math.max(existing.confidence, skill.confidence) + 8);
      existing.sources = Array.from(new Set([...existing.sources, ...skill.sources]));
    } else {
      merged.set(skill.name, skill);
    }
  }

  return Array.from(merged.values()).slice(0, 12);
}

function sourceSummary(rawData: Record<string, any>): ScoutReport['sources'] {
  const scans = Array.isArray(rawData.socialScans) ? rawData.socialScans : [];
  const github = scans.find((scan) => scan?.platform === 'GITHUB');
  const twitter = scans.find((scan) => scan?.platform === 'TWITTER' || scan?.platform === 'X');

  return {
    cv: rawData.cv
      ? { parsed: Boolean(rawData.cv.parsed), sections: Array.isArray(rawData.cv.sections) ? rawData.cv.sections : [] }
      : undefined,
    github: github
      ? {
          repos: Number(github.metrics?.repos || 0),
          stars: Number(github.metrics?.stars || 0),
          contributions: Number(github.metrics?.contributions || 0),
          languages: github.metrics?.languages || {},
        }
      : undefined,
    twitter: twitter
      ? {
          tweets: Number(twitter.metrics?.tweets || 0),
          techSignals: Array.isArray(twitter.metrics?.techSignals) ? twitter.metrics.techSignals : [],
          engagementScore: Number(twitter.metrics?.engagementScore || 0),
        }
      : undefined,
  };
}

function makeBadge(id: string, name: string, description: string): Badge {
  return {
    id,
    name,
    icon: 'shield',
    description,
    earnedAt: new Date().toISOString(),
    category: 'verification',
  };
}

function fallbackScoutReport(rawData: Record<string, any>, reason?: string): ScoutReport {
  const skills = inferSkills(rawData);
  const scans = Array.isArray(rawData.socialScans) ? rawData.socialScans : [];
  const verifiedSources = scans.filter((scan) => scan?.ok).length;
  const cvParsed = Boolean(rawData.cv?.parsed || rawData.cvText);
  const baseScore = Math.min(95, 25 + skills.length * 5 + verifiedSources * 15 + (cvParsed ? 15 : 0));

  return {
    skills,
    experiences: [],
    education: [],
    badges: [
      ...(verifiedSources ? [makeBadge('connected-footprint', 'Connected Footprint', 'At least one connected account returned verifiable evidence.')] : []),
      ...(cvParsed ? [makeBadge('cv-parsed', 'CV Parsed', 'A CV was parsed and included in the Scout evaluation.')] : []),
    ],
    credibilityScore: skills.length || verifiedSources || cvParsed ? baseScore : 0,
    narrative: reason
      ? `Scout generated a fallback profile because the LLM response was unavailable: ${reason}`
      : 'Scout generated this profile from parsed CV text and connected-account evidence.',
    sources: sourceSummary(rawData),
    generatedAt: new Date().toISOString(),
  };
}

function normalizeReport(rawData: Record<string, any>, report: Partial<ScoutReport>): ScoutReport {
  const fallback = fallbackScoutReport(rawData);
  const skills = Array.isArray(report.skills) && report.skills.length ? report.skills : fallback.skills;
  const badges = Array.isArray(report.badges) ? report.badges : fallback.badges;
  const score = Number(report.credibilityScore);

  return {
    skills,
    experiences: Array.isArray(report.experiences) ? report.experiences : [],
    education: Array.isArray(report.education) ? report.education : [],
    badges,
    credibilityScore: Number.isFinite(score) ? Math.max(0, Math.min(100, score)) : fallback.credibilityScore,
    narrative: typeof report.narrative === 'string' && report.narrative.trim() ? report.narrative : fallback.narrative,
    sources: report.sources || fallback.sources,
    generatedAt: new Date().toISOString(),
  };
}

export class ScoutAgent extends BaseAgent {
  protected name = 'Scout Agent';
  protected type = 'SCOUT';
  
  protected systemPrompt = `
You are the SkillMint Scout Agent. Your job is to analyze a freelancer's raw public footprint (GitHub repos, Twitter posts, Discord roles, or CV) and synthesize a comprehensive, verified credibility profile.
You must output a highly detailed JSON object conforming to the ScoutReport interface.

Guidelines:
1. Verify claims by cross-referencing input data (e.g. if CV claims React but GitHub shows no React repos, lower confidence).
2. Assign confidence scores (0-100) to each skill.
3. Identify 3 to 5 key strengths (short phrases) that highlight what the freelancer excels at.
4. Identify relevant experiences and categorize them.
5. Calculate an overall credibilityScore (0-100) based on the richness and consistency of the footprint.
6. Provide a short, persuasive narrative summarizing the freelancer's actual verifiable capabilities.

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
    
    try {
      const result = await this.executeJson<ScoutReport>(prompt, {
        action: 'analyzeProfile',
        dataSources: Object.keys(rawData)
      });

      return normalizeReport(rawData, result);
    } catch (error) {
      return fallbackScoutReport(rawData, error instanceof Error ? error.message : 'Unknown Scout failure');
    }
  }
}

export const scoutAgent = new ScoutAgent();
