import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * ASP Platform — Standalone Deployment Script
 *
 * Deploys:
 *   1. EscrowFactory — factory for creating per-gig escrow contracts
 *   2. ReputationSBT — soulbound token for on-chain reputation
 *
 * Usage:
 *   npx tsx scripts/deploy.ts
 */

interface DeploymentAddresses {
  network: string;
  chainId: number;
  deployer: string;
  escrowFactory: string;
  reputationSBT: string;
  usdtAddress: string;
  deployedAt: string;
  blockNumber: number;
}

// Ensure you run `npx hardhat compile` first!
const ESCROW_FACTORY_ARTIFACT_PATH = path.join(process.cwd(), "artifacts/contracts/Escrow.sol/EscrowFactory.json");
const REPUTATION_SBT_ARTIFACT_PATH = path.join(process.cwd(), "artifacts/contracts/ReputationSBT.sol/ReputationSBT.json");
const TEST_USDT_ARTIFACT_PATH = path.join(process.cwd(), "artifacts/contracts/mock/TestUSDT.sol/TestUSDT.json");

async function main() {
  const rpcUrl = process.env.XLAYER_TESTNET_RPC || "https://testrpc.xlayer.tech/terigon";
  const privateKey = process.env.PRIVATE_KEY;

  if (!privateKey) {
    throw new Error("PRIVATE_KEY must be set in .env");
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const deployer = new ethers.Wallet(privateKey, provider);
  const network = await provider.getNetwork();
  const chainId = Number(network.chainId);

  console.log("═══════════════════════════════════════════════════");
  console.log("  ASP Platform — Contract Deployment");
  console.log("═══════════════════════════════════════════════════");
  console.log(`  RPC:       ${rpcUrl}`);
  console.log(`  ChainID:   ${chainId}`);
  console.log(`  Deployer:  ${deployer.address}`);

  const balance = await provider.getBalance(deployer.address);
  console.log(`  Balance:   ${ethers.formatEther(balance)} ETH`);
  console.log("═══════════════════════════════════════════════════\n");

  if (!fs.existsSync(ESCROW_FACTORY_ARTIFACT_PATH) || !fs.existsSync(REPUTATION_SBT_ARTIFACT_PATH) || !fs.existsSync(TEST_USDT_ARTIFACT_PATH)) {
    throw new Error("Artifacts not found. Please run `npx hardhat compile` first.");
  }

  const escrowArtifact = JSON.parse(fs.readFileSync(ESCROW_FACTORY_ARTIFACT_PATH, "utf8"));
  const reputationArtifact = JSON.parse(fs.readFileSync(REPUTATION_SBT_ARTIFACT_PATH, "utf8"));
  const usdtArtifact = JSON.parse(fs.readFileSync(TEST_USDT_ARTIFACT_PATH, "utf8"));

  // ── 0. Deploy TestUSDT (if on testnet) ───────────────
  let usdtAddress = "0x1E4a5963aBFD975d8c9021ce480b42188849D41d"; // Default X Layer Mainnet USDT
  if (chainId === 1952 || chainId === 31337) {
    console.log("Deploying TestUSDT...");
    const TestUSDT = new ethers.ContractFactory(usdtArtifact.abi, usdtArtifact.bytecode, deployer);
    const testUSDT = await TestUSDT.deploy();
    await testUSDT.waitForDeployment();
    usdtAddress = await testUSDT.getAddress();
    console.log(`  ✅ TestUSDT deployed at: \${usdtAddress}`);
  }

  // ── 1. Deploy EscrowFactory ──────────────────────────
  console.log("Deploying EscrowFactory...");
  const EscrowFactory = new ethers.ContractFactory(escrowArtifact.abi, escrowArtifact.bytecode, deployer);
  const escrowFactory = await EscrowFactory.deploy(deployer.address);
  await escrowFactory.waitForDeployment();
  const escrowFactoryAddress = await escrowFactory.getAddress();
  console.log(`  ✅ EscrowFactory deployed at: ${escrowFactoryAddress}`);

  // ── 2. Deploy ReputationSBT ──────────────────────────
  console.log("\nDeploying ReputationSBT...");
  const ReputationSBT = new ethers.ContractFactory(reputationArtifact.abi, reputationArtifact.bytecode, deployer);
  const reputationSBT = await ReputationSBT.deploy(deployer.address);
  await reputationSBT.waitForDeployment();
  const reputationSBTAddress = await reputationSBT.getAddress();
  console.log(`  ✅ ReputationSBT deployed at: ${reputationSBTAddress}`);

  // ── 3. Save deployment addresses ─────────────────────
  const deployment: DeploymentAddresses = {
    network: chainId === 1952 ? "xlayerTestnet" : chainId === 196 ? "xlayerMainnet" : "unknown",
    chainId,
    deployer: deployer.address,
    escrowFactory: escrowFactoryAddress,
    reputationSBT: reputationSBTAddress,
    usdtAddress: usdtAddress,
    deployedAt: new Date().toISOString(),
    blockNumber: await provider.getBlockNumber(),
  };

  const deploymentsDir = path.join(process.cwd(), "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const outputPath = path.join(deploymentsDir, `${deployment.network}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(deployment, null, 2));

  console.log(`\n  📁 Deployment addresses saved to: ${outputPath}`);
  console.log("\n═══════════════════════════════════════════════════");
  console.log("  Deployment complete!");
  console.log("═══════════════════════════════════════════════════\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
