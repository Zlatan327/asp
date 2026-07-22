import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * Deploys the BountyPool contract and updates the deployments json.
 */

const BOUNTY_POOL_ARTIFACT_PATH = path.join(process.cwd(), "artifacts/contracts/BountyPool.sol/BountyPool.json");

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

  console.log("Deploying BountyPool on Chain ID:", chainId);

  if (!fs.existsSync(BOUNTY_POOL_ARTIFACT_PATH)) {
    throw new Error("BountyPool artifact not found. Please run `npx hardhat compile` first.");
  }

  const bountyArtifact = JSON.parse(fs.readFileSync(BOUNTY_POOL_ARTIFACT_PATH, "utf8"));

  const networkName = chainId === 1952 ? "xlayerTestnet" : chainId === 196 ? "xlayerMainnet" : "unknown";
  const deploymentsDir = path.join(process.cwd(), "deployments");
  const deploymentsPath = path.join(deploymentsDir, `${networkName}.json`);

  let deployments: any = {};
  if (fs.existsSync(deploymentsPath)) {
    deployments = JSON.parse(fs.readFileSync(deploymentsPath, "utf8"));
  } else {
    throw new Error(`Deployment file ${deploymentsPath} not found. Deploy Escrow first.`);
  }

  const usdtAddress = deployments.usdtAddress;
  if (!usdtAddress) {
    throw new Error("USDT address not found in deployments.");
  }

  // The backend verifier will be the deployer for this hackathon MVP
  console.log("Deploying BountyPool with USDT:", usdtAddress, "and Verifier:", deployer.address);
  const BountyPoolFactory = new ethers.ContractFactory(bountyArtifact.abi, bountyArtifact.bytecode, deployer);
  const bountyPool = await BountyPoolFactory.deploy(usdtAddress, deployer.address, deployer.address);
  await bountyPool.waitForDeployment();
  const bountyPoolAddress = await bountyPool.getAddress();
  console.log(`✅ BountyPool deployed at: ${bountyPoolAddress}`);

  deployments.bountyPool = bountyPoolAddress;
  fs.writeFileSync(deploymentsPath, JSON.stringify(deployments, null, 2));
  console.log("Deployment JSON updated.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
