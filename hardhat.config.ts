import { HardhatUserConfig } from "hardhat/config";

/**
 * ASP Platform — Hardhat Configuration
 *
 * Networks:
 *   - X Layer Mainnet (chainId 196)
 *   - X Layer Testnet (chainId 1952)
 *   - Hardhat local network (default)
 *
 * Set environment variables:
 *   PRIVATE_KEY        — deployer wallet private key
 *   XLAYER_MAINNET_RPC — (optional) override mainnet RPC
 *   XLAYER_TESTNET_RPC — (optional) override testnet RPC
 */

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x" + "0".repeat(64);

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      evmVersion: "cancun",
    },
  },

  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  networks: {
    xlayerTestnet: {
      type: "http",
      url: process.env.XLAYER_TESTNET_RPC_URL || "https://testrpc.xlayer.tech",
      accounts: [PRIVATE_KEY],
      chainId: 1952,
    },
    xlayerMainnet: {
      type: "http",
      url: process.env.XLAYER_RPC_URL || "https://rpc.xlayer.tech",
      accounts: [PRIVATE_KEY],
      chainId: 196,
    },
  },
  etherscan: {
    apiKey: {
      xlayerTestnet: "abc",
      xlayerMainnet: "abc"
    },
    customChains: [
      {
        network: "xlayerTestnet",
        chainId: 1952,
        urls: {
          apiURL: "https://www.okx.com/api/v5/explorer/xlayer/testnet/api",
          browserURL: "https://www.okx.com/explorer/xlayer/testnet"
        }
      },
      {
        network: "xlayerMainnet",
        chainId: 196,
        urls: {
          apiURL: "https://www.okx.com/api/v5/explorer/xlayer/api",
          browserURL: "https://www.okx.com/explorer/xlayer"
        }
      }
    ]
  },
};

export default config;
