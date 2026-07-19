/**
 * X Layer blockchain configuration and utilities
 */
import { XLAYER_MAINNET, XLAYER_TESTNET, type ChainConfig } from '@/types';

export function getChainConfig(): ChainConfig {
  const chainId = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '196');
  return chainId === 1952 ? XLAYER_TESTNET : XLAYER_MAINNET;
}

/**
 * ERC-20 ABI subset for USDT/USDC interactions
 */
export const ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function balanceOf(address owner) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 value) returns (bool)',
  'function transfer(address to, uint256 value) returns (bool)',
  'function transferFrom(address from, address to, uint256 value) returns (bool)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)',
] as const;

/**
 * Escrow contract ABI
 */
export const ESCROW_FACTORY_ABI = [
  'function createEscrow(address freelancer, address token, uint256 totalAmount, uint256 milestoneCount) returns (address)',
  'function getEscrowCount() view returns (uint256)',
  'function getClientEscrows(address client) view returns (address[])',
  'function getFreelancerEscrows(address freelancer) view returns (address[])',
  'event EscrowCreated(address indexed escrowAddress, address indexed client, address indexed freelancer, address token, uint256 totalAmount, uint256 milestoneCount, uint256 timestamp)',
] as const;

export const GIG_ESCROW_ABI = [
  'function fundEscrow() external',
  'function releaseMilestone(uint256 index) external',
  'function requestRelease(uint256 index) external',
  'function disputeMilestone(uint256 index) external',
  'function resolveDispute(uint256 index, address winner) external',
  'function refund() external',
  'function state() view returns (uint8)',
  'function getMilestoneCount() view returns (uint256)',
  'function getMilestone(uint256 index) view returns (tuple(uint256 amount, uint8 status, uint256 createdAt, uint256 releasedAt, uint256 disputedAt, uint256 resolvedAt))',
  'function client() view returns (address)',
  'function freelancer() view returns (address)',
  'function paymentToken() view returns (address)',
  'function totalAmount() view returns (uint256)',
  'event EscrowFunded(address indexed client, uint256 amount, uint256 timestamp)',
  'event MilestoneReleased(uint256 indexed milestoneIndex, uint256 amount, uint256 timestamp)',
  'event MilestoneDisputed(uint256 indexed milestoneIndex, address indexed disputedBy, uint256 timestamp)',
  'event DisputeResolved(uint256 indexed milestoneIndex, address indexed winner, uint256 amount, uint256 timestamp)',
  'event EscrowRefunded(address indexed client, uint256 amount, uint256 timestamp)',
  'event MilestoneReleaseRequested(uint256 indexed milestoneIndex, uint256 timestamp)',
] as const;

export const REPUTATION_SBT_ABI = [
  'function mint(address user, string uri) external returns (uint256)',
  'function updateReputation(uint256 tokenId, string newUri) external',
  'function getReputation(address user) view returns (uint256)',
  'function hasReputation(address user) view returns (bool)',
  'function tokenURI(uint256 tokenId) view returns (string)',
  'function balanceOf(address owner) view returns (uint256)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'event ReputationMinted(address indexed user, uint256 indexed tokenId, string uri, uint256 timestamp)',
  'event ReputationUpdated(uint256 indexed tokenId, string newUri, uint256 timestamp)',
] as const;

export const TEST_USDT_ABI = [
  ...ERC20_ABI,
  'function mint(address to, uint256 amount) external',
] as const;

/**
 * Format address for display
 */
export function shortenAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Format token amount from wei
 */
export function formatTokenAmount(amount: bigint, decimals = 6): string {
  const divisor = BigInt(10 ** decimals);
  const whole = amount / divisor;
  const remainder = amount % divisor;
  const decimal = remainder.toString().padStart(decimals, '0').slice(0, 2);
  return `${whole}.${decimal}`;
}

/**
 * Parse token amount to wei
 */
export function parseTokenAmount(amount: string, decimals = 6): bigint {
  const [whole, dec = ''] = amount.split('.');
  const padded = dec.padEnd(decimals, '0').slice(0, decimals);
  return BigInt(whole + padded);
}

/**
 * X Layer network parameters for wallet_addEthereumChain
 */
export function getAddChainParams(config: ChainConfig) {
  return {
    chainId: `0x${config.chainId.toString(16)}`,
    chainName: config.name,
    nativeCurrency: config.nativeCurrency,
    rpcUrls: [config.rpcUrl],
    blockExplorerUrls: [config.explorerUrl],
  };
}
