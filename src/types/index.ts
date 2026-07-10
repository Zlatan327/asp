// ─── User & Auth Types ───────────────────────────────────

export type UserRole = 'FREELANCER' | 'CLIENT' | 'BOTH';
export type UserTier = 'FREE' | 'PRO' | 'ENTERPRISE';
export type SocialPlatform = 'GITHUB' | 'TWITTER' | 'DISCORD';

export interface User {
  id: string;
  walletAddress?: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
  role: UserRole;
  tier: UserTier;
  onboardedAt?: string;
  createdAt: string;
}

// ─── Profile Types ───────────────────────────────────────

export interface Experience {
  company: string;
  role: string;
  duration: string;
  startDate?: string;
  endDate?: string;
  highlights: string[];
  verified: boolean;
  source: 'cv' | 'github' | 'twitter' | 'discord' | 'manual';
}

export interface Education {
  institution: string;
  degree: string;
  field: string;
  year: string;
}

export interface SkillAssessment {
  name: string;
  category: string;
  confidence: number; // 0-100
  sources: string[];  // which platforms verified it
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  earnedAt: string;
  category: 'achievement' | 'verification' | 'milestone' | 'community';
}

export interface FreelancerProfile {
  id: string;
  userId: string;
  headline?: string;
  bio?: string;
  skills: SkillAssessment[];
  experiences: Experience[];
  education: Education[];
  cvFileUrl?: string;
  credibilityScore: number;
  badges: Badge[];
  hourlyRate?: number;
  availability: 'AVAILABLE' | 'BUSY' | 'UNAVAILABLE';
  completedGigs: number;
  totalEarned: number;
}

export interface ClientProfile {
  id: string;
  userId: string;
  companyName?: string;
  industry?: string;
  description?: string;
  website?: string;
  totalSpent: number;
  gigsPosted: number;
}

// ─── Gig Types ───────────────────────────────────────────

export type GigStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';
export type BudgetType = 'FIXED' | 'HOURLY';
export type ExperienceLevel = 'BEGINNER' | 'INTERMEDIATE' | 'EXPERT' | 'ANY';

export interface Milestone {
  index: number;
  title: string;
  description: string;
  amount: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'SUBMITTED' | 'APPROVED' | 'DISPUTED';
  dueDate?: string;
}

export interface Gig {
  id: string;
  clientId: string;
  freelancerId?: string;
  title: string;
  description: string;
  skills: string[];
  budget: number;
  budgetType: BudgetType;
  currency: string;
  status: GigStatus;
  deadline?: string;
  milestones: Milestone[];
  escrowContractAddress?: string;
  escrowFunded: boolean;
  category?: string;
  experienceLevel: ExperienceLevel;
  estimatedDuration?: string;
  matchScore?: number;
  createdAt: string;
  updatedAt: string;
  // Joined data
  client?: User;
  freelancer?: User;
  proposalCount?: number;
}

// ─── Proposal Types ──────────────────────────────────────

export type ProposalStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';

export interface Proposal {
  id: string;
  gigId: string;
  freelancerId: string;
  coverLetter: string;
  bidAmount: number;
  estimatedDays?: number;
  generatedByAgent: boolean;
  agentConfidence?: number;
  matchScore?: number;
  status: ProposalStatus;
  createdAt: string;
  // Joined data
  freelancer?: User & { freelancerProfile?: FreelancerProfile };
  gig?: Gig;
}

// ─── Task Types ──────────────────────────────────────────

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';

export interface GigTask {
  id: string;
  gigId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  milestoneIndex?: number;
  deliverables: string[];
  dueDate?: string;
  order: number;
}

// ─── Escrow Types ────────────────────────────────────────

export type EscrowStatus = 'PENDING' | 'FUNDED' | 'PARTIALLY_RELEASED' | 'COMPLETED' | 'DISPUTED' | 'REFUNDED';

export interface EscrowInfo {
  id: string;
  gigId: string;
  contractAddress?: string;
  chainId: number;
  tokenAddress?: string;
  totalAmount: number;
  releasedAmount: number;
  status: EscrowStatus;
  milestoneDetails: MilestoneEscrow[];
  txHash?: string;
}

export interface MilestoneEscrow {
  index: number;
  amount: number;
  status: 'LOCKED' | 'RELEASED' | 'DISPUTED' | 'REFUNDED';
  releaseTxHash?: string;
}

// ─── Reputation Types ────────────────────────────────────

export interface Reputation {
  id: string;
  userId: string;
  overallScore: number;
  profileScore: number;
  socialScore: number;
  completionScore: number;
  ratingScore: number;
  deliveryScore: number;
  disputeScore: number;
  badges: Badge[];
  onChainTokenId?: string;
  onChainSynced: boolean;
  history: ScoreSnapshot[];
}

export interface ScoreSnapshot {
  score: number;
  date: string;
  reason: string;
}

// ─── Agent Types ─────────────────────────────────────────

export type AgentType = 'SCOUT' | 'MATCHER' | 'PROPOSAL' | 'TASK_MANAGER' | 'REPUTATION' | 'ORCHESTRATOR';

export interface ScoutReport {
  skills: SkillAssessment[];
  experiences: Experience[];
  education: Education[];
  badges: Badge[];
  credibilityScore: number;
  narrative: string;
  sources: {
    cv?: { parsed: boolean; sections: string[] };
    github?: { repos: number; stars: number; contributions: number; languages: Record<string, number> };
    twitter?: { tweets: number; techSignals: string[]; engagementScore: number };
    discord?: { servers: string[]; roles: string[] };
  };
  generatedAt: string;
}

export interface MatchResult {
  gigId?: string;
  freelancerId?: string;
  score: number;
  reasons: string[];
  skillOverlap: string[];
  missingSkills: string[];
}

export interface ProposalDraft {
  coverLetter: string;
  suggestedBid: number;
  confidence: number;
  keyPoints: string[];
  referencedWork: string[];
}

// ─── API Response Types ──────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ─── Blockchain Types ────────────────────────────────────

export interface ChainConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  explorerUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  contracts: {
    escrowFactory?: string;
    reputationSBT?: string;
    usdt?: string;
    usdc?: string;
  };
}

export const XLAYER_MAINNET: ChainConfig = {
  chainId: 196,
  name: 'X Layer Mainnet',
  rpcUrl: 'https://rpc.xlayer.tech',
  explorerUrl: 'https://www.okx.com/web3/explorer/xlayer',
  nativeCurrency: {
    name: 'OKB',
    symbol: 'OKB',
    decimals: 18,
  },
  contracts: {
    usdt: '0x1E4a5963aBFD975d8c9021ce480b42188849D41d',
    usdc: '0x74b7f16337b8972027f6196a17a631ac6de26d22',
  },
};

export const XLAYER_TESTNET: ChainConfig = {
  chainId: 1952,
  name: 'X Layer Testnet',
  rpcUrl: 'https://testrpc.xlayer.tech/terigon',
  explorerUrl: 'https://www.okx.com/web3/explorer/xlayer-test',
  nativeCurrency: {
    name: 'OKB',
    symbol: 'OKB',
    decimals: 18,
  },
  contracts: {},
};
