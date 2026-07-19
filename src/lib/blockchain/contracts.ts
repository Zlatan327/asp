import { ethers } from "ethers";
import {
  ESCROW_FACTORY_ABI,
  GIG_ESCROW_ABI,
  REPUTATION_SBT_ABI,
  TEST_USDT_ABI,
} from "./config";

// We use the environment variables, but for client-side we need to expose them via NEXT_PUBLIC_
// Since these are server-only by default in .env, we should hardcode testnet fallbacks for development
// or expose them properly. For now, we will use the deployed testnet addresses directly if env vars are missing.

export const ESCROW_FACTORY_ADDRESS = process.env.NEXT_PUBLIC_ESCROW_FACTORY_ADDRESS || "0xCf0e0613Bf02374b2B3B72525749B16e0Bee3C1f";
export const REPUTATION_SBT_ADDRESS = process.env.NEXT_PUBLIC_REPUTATION_SBT_ADDRESS || "0x70EE13351431E8983783BCB7205745E564Bf4aB3";
export const USDT_ADDRESS = process.env.NEXT_PUBLIC_USDT_ADDRESS || "0x5cfbAe8B83556d78B8BC8D8D74dE15A6Be5EEAb3";

/**
 * Helper to get a BrowserProvider from window.okxwallet or window.ethereum
 */
export async function getProvider() {
  if (typeof window === "undefined") {
    throw new Error("Must be called in browser context");
  }

  let injectedProvider: any = null;
  if ((window as any).okxwallet) {
    injectedProvider = (window as any).okxwallet;
  } else if ((window as any).ethereum) {
    injectedProvider = (window as any).ethereum;
  }

  if (!injectedProvider) {
    throw new Error("No Web3 wallet found. Please install the OKX Wallet extension.");
  }

  // Check if chain is correct (testnet 1952 / 0x7a0)
  const chainId = await injectedProvider.request({ method: 'eth_chainId' });
  if (parseInt(chainId, 16) !== 1952) {
    throw new Error("Wrong network! Please switch to X Layer Testnet before transacting.");
  }

  return new ethers.BrowserProvider(injectedProvider);
}

/**
 * Escrow interactions
 */
export const EscrowService = {
  // Client: Create a new escrow for a gig
  async createEscrow(freelancerAddress: string, amount: string, milestones: number) {
    const provider = await getProvider();
    const signer = await provider.getSigner();
    
    const factory = new ethers.Contract(ESCROW_FACTORY_ADDRESS, ESCROW_FACTORY_ABI, signer);
    
    // amount should be converted to wei (assume USDT has 18 decimals in our mock)
    const amountWei = ethers.parseEther(amount);
    
    const tx = await factory.createEscrow(freelancerAddress, USDT_ADDRESS, amountWei, milestones);
    const receipt = await tx.wait();
    
    // Find the EscrowCreated event to extract the child escrow address
    const event = receipt?.logs.find((log: ethers.EventLog | ethers.Log) => "fragment" in log && log.fragment?.name === "EscrowCreated");
    if (event && event.args) {
      return event.args[0]; // escrowAddress
    }
    
    // Fallback if event parsing fails (should query the factory for the latest client escrow)
    const clientEscrows = await factory.getClientEscrows(await signer.getAddress());
    return clientEscrows[clientEscrows.length - 1];
  },

  // Client: Fund an existing escrow
  async fundEscrow(escrowAddress: string, amount: string) {
    const provider = await getProvider();
    const signer = await provider.getSigner();
    
    // 1. Approve USDT
    const usdt = new ethers.Contract(USDT_ADDRESS, TEST_USDT_ABI, signer);
    const amountWei = ethers.parseEther(amount);
    
    const approveTx = await usdt.approve(escrowAddress, amountWei);
    await approveTx.wait();
    
    // 2. Fund
    const escrow = new ethers.Contract(escrowAddress, GIG_ESCROW_ABI, signer);
    const fundTx = await escrow.fundEscrow();
    await fundTx.wait();
    
    return true;
  },

  // Client: Release a milestone
  async releaseMilestone(escrowAddress: string, milestoneIndex: number) {
    const provider = await getProvider();
    const signer = await provider.getSigner();
    
    const escrow = new ethers.Contract(escrowAddress, GIG_ESCROW_ABI, signer);
    const tx = await escrow.releaseMilestone(milestoneIndex);
    await tx.wait();
    
    return true;
  },

  // Freelancer: Request release
  async requestRelease(escrowAddress: string, milestoneIndex: number) {
    const provider = await getProvider();
    const signer = await provider.getSigner();
    
    const escrow = new ethers.Contract(escrowAddress, GIG_ESCROW_ABI, signer);
    const tx = await escrow.requestRelease(milestoneIndex);
    await tx.wait();
    
    return true;
  },

  // Dev Testing: Mint Test USDT to wallet
  async mintTestUSDT(amount: string = "1000") {
    const provider = await getProvider();
    const signer = await provider.getSigner();
    
    const usdt = new ethers.Contract(USDT_ADDRESS, TEST_USDT_ABI, signer);
    const amountWei = ethers.parseEther(amount);
    
    const tx = await usdt.mint(signer.address, amountWei);
    await tx.wait();
    
    return true;
  },

  // Reputation SBT
  async checkHasReputationSBT(userAddress: string) {
    const provider = await getProvider();
    const sbt = new ethers.Contract(REPUTATION_SBT_ADDRESS, REPUTATION_SBT_ABI, provider);
    return await sbt.hasReputation(userAddress);
  },

  async mintReputationSBT(userAddress: string, tokenURI: string) {
    const provider = await getProvider();
    const signer = await provider.getSigner();
    const sbt = new ethers.Contract(REPUTATION_SBT_ADDRESS, REPUTATION_SBT_ABI, signer);
    
    const tx = await sbt.mint(userAddress, tokenURI);
    await tx.wait();
    return true;
  },

  async updateReputationSBT(userAddress: string, tokenURI: string) {
    const provider = await getProvider();
    const signer = await provider.getSigner();
    const sbt = new ethers.Contract(REPUTATION_SBT_ADDRESS, REPUTATION_SBT_ABI, signer);
    
    const tokenId = await sbt.getReputation(userAddress);
    const tx = await sbt.updateReputation(tokenId, tokenURI);
    await tx.wait();
    return true;
  }
};
