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
  'function createEscrow(address client, address freelancer, address token, uint256 totalAmount, uint256 milestoneCount) returns (address)',
  'function getEscrow(uint256 index) view returns (address)',
  'function getEscrowCount() view returns (uint256)',
  'function getEscrowsByClient(address client) view returns (address[])',
  'function getEscrowsByFreelancer(address freelancer) view returns (address[])',
  'event EscrowCreated(address indexed escrow, address indexed client, address indexed freelancer, uint256 totalAmount)',
] as const;

export const GIG_ESCROW_ABI = [
  'function fundEscrow() external',
  'function releaseMilestone(uint256 index) external',
  'function requestRelease(uint256 index) external',
  'function disputeMilestone(uint256 index) external',
  'function resolveDispute(uint256 index, address winner) external',
  'function refund() external',
  'function getStatus() view returns (uint8)',
  'function getMilestone(uint256 index) view returns (uint256 amount, uint8 status, uint256 releasedAt)',
  'function client() view returns (address)',
  'function freelancer() view returns (address)',
  'function token() view returns (address)',
  'function totalAmount() view returns (uint256)',
  'function milestoneCount() view returns (uint256)',
  'function isFunded() view returns (bool)',
  'event EscrowFunded(uint256 amount)',
  'event MilestoneReleased(uint256 indexed index, uint256 amount)',
  'event MilestoneDisputed(uint256 indexed index, address disputedBy)',
  'event DisputeResolved(uint256 indexed index, address winner, uint256 amount)',
  'event EscrowRefunded(uint256 amount)',
  'event ReleaseRequested(uint256 indexed index, address requestedBy)',
] as const;

export const REPUTATION_SBT_ABI = [
  'function mint(address to, string memory uri) external returns (uint256)',
  'function updateReputation(uint256 tokenId, string memory newUri) external',
  'function getReputation(address user) view returns (uint256 tokenId, string memory uri)',
  'function tokenURI(uint256 tokenId) view returns (string)',
  'function balanceOf(address owner) view returns (uint256)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'event ReputationMinted(address indexed user, uint256 indexed tokenId)',
  'event ReputationUpdated(uint256 indexed tokenId, string newUri)',
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
