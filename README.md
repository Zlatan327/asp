# ASP — Agent Service Provider

> AI-Powered Freelance Marketplace on X Layer | OKX AI Genesis Hackathon 2026

ASP is a next-generation freelance platform that combines **AI agent orchestration** with **Web3 smart contract escrow** and **on-chain Soulbound Token (SBT) reputation**. Built on the **X Layer blockchain** for the OKX AI Genesis Hackathon.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🤖 **AI Agent Orchestration** | Multi-agent system (Scout, Proposal, TaskManager, Reputation, Orchestrator) that automates the entire freelancing workflow |
| ⛓️ **Smart Contract Escrow** | Funds are locked in a trustless EscrowFactory contract on X Layer — milestone-based releases |
| 🛡️ **Soulbound Reputation (SBT)** | Non-transferable ERC-721 tokens that represent verifiable, on-chain freelancer reputation scores |
| 🔐 **OKX Wallet Native** | Prioritizes `window.okxwallet` injection with automatic X Layer chain switching |
| 🎯 **AI Proposal Generator** | Freelancers click one button and the ProposalAgent drafts a tailored, persuasive pitch |
| 📋 **AI Task Breakdown** | Once hired, the TaskManagerAgent auto-generates a Kanban board of granular tasks |

---

## 🏗️ Tech Stack

- **Framework:** Next.js 16 (App Router, React 19, TypeScript)
- **Database:** Prisma ORM + SQLite (swap to Postgres for production)
- **AI:** OpenAI GPT-4o (configurable LLM provider)
- **Blockchain:** Solidity 0.8.24, Hardhat, ethers.js v6
- **Smart Contracts:** EscrowFactory, GigEscrow, ReputationSBT (deployed on X Layer Testnet)
- **Auth:** NextAuth.js with SIWE (Sign-In with Ethereum) + GitHub/Discord OAuth
- **Styling:** Vanilla CSS design system with glassmorphism, gradients, and micro-animations

---

## 📦 Project Structure

```
asp/
├── contracts/           # Solidity smart contracts
│   ├── Escrow.sol       # EscrowFactory + GigEscrow
│   ├── ReputationSBT.sol# Soulbound Token (non-transferable ERC-721)
│   └── TestUSDT.sol     # Mock USDT for testnet
├── scripts/
│   └── deploy.ts        # Hardhat deployment script
├── deployments/         # Deployed contract addresses (JSON)
├── prisma/
│   └── schema.prisma    # Database schema
├── src/
│   ├── app/             # Next.js App Router pages & API routes
│   │   ├── api/         # REST API (gigs, tasks, proposals, auth, escrow)
│   │   ├── dashboard/   # User dashboard
│   │   ├── freelancers/ # Public freelancer profiles
│   │   ├── gigs/        # Gig detail, workspace, Kanban board
│   │   ├── marketplace/ # Browse & search gigs
│   │   └── onboarding/  # User onboarding flow
│   ├── components/      # Reusable UI components
│   │   ├── landing/     # Hero, Features, HowItWorks sections
│   │   ├── ConnectWalletButton.tsx
│   │   ├── EscrowPanel.tsx
│   │   ├── Header.tsx
│   │   └── WalletProvider.tsx
│   └── lib/
│       ├── ai/          # AI agent framework
│       │   ├── agents/  # Scout, Proposal, TaskManager, Reputation, Orchestrator
│       │   ├── base-agent.ts
│       │   └── llm.ts   # LLM abstraction layer
│       ├── blockchain/  # Smart contract wrappers (ethers.js)
│       └── db/          # Prisma client
└── hardhat.config.ts    # X Layer testnet/mainnet config
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm
- A Web3 wallet (OKX Wallet or MetaMask)

### Installation

```bash
# Clone the repo
git clone <repo-url>
cd asp

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Then fill in your API keys (OPENAI_API_KEY, NEXTAUTH_SECRET, etc.)

# Generate Prisma client & run migrations
npx prisma generate
npx prisma db push

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Smart Contract Deployment (Optional)

```bash
# Compile contracts
npx hardhat compile

# Deploy to X Layer Testnet
npx tsx scripts/deploy.ts
```

---

## 🔗 Deployed Contracts (X Layer Testnet)

| Contract | Address |
|---|---|
| EscrowFactory | `0xCf0e0613Bf02374b2B3B72525749B16e0Bee3C1f` |
| ReputationSBT | `0x70EE13351431E8983783BCB7205745E564Bf4aB3` |
| TestUSDT | `0x5cfbAe8B83556d78B8BC8D8D74dE15A6Be5EEAb3` |

---

## 🔄 User Flow

```
1. User signs in (SIWE / GitHub / Discord)
2. Onboarding → Select role (Client or Freelancer)
3. Client posts a gig → ScoutAgent recommends matches
4. Freelancer applies → ProposalAgent drafts a tailored pitch
5. Client hires → Escrow contract locks funds on X Layer
6. TaskManagerAgent breaks project into Kanban tasks
7. Freelancer completes work → Client approves milestones
8. Funds released → ReputationAgent calculates score → SBT minted on-chain
```

---

## 🧠 AI Agents

| Agent | Purpose |
|---|---|
| **ScoutAgent** | Parses freelancer profiles (CV, GitHub) into structured skill data |
| **MatchAgent** | Scores freelancer-to-gig compatibility using semantic similarity |
| **ProposalAgent** | Auto-generates personalized, persuasive proposals |
| **TaskManagerAgent** | Breaks accepted gigs into granular, actionable tasks |
| **ReputationAgent** | Calculates weighted reputation scores post-gig |
| **OrchestratorAgent** | Central router that dispatches events to specialized agents |

---

## 🏆 Built For

**OKX AI Genesis Hackathon 2026**

- Built on X Layer (Chain ID: 1952 testnet / 196 mainnet)
- Native OKX Wallet support (`window.okxwallet`)
- Smart contract escrow for trustless payments
- Soulbound Tokens for verifiable reputation

---

## 📄 License

MIT
