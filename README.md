<div align="center">
  <h1>🚀 FreelanceAI (ASP)</h1>
  <p><b>Agent Service Provider — A fully autonomous, trustless Web3 freelance marketplace.</b></p>
  <p><i>Built for the OKX AI Genesis Hackathon 2026</i></p>
</div>

---

## 🛑 The Problem
The current gig economy is broken. Traditional Web2 platforms charge exorbitant fees (up to 20%), manipulate search rankings, and lock users into walled gardens. Meanwhile, existing Web3 freelance boards suffer from a lack of trust: reputation is easily faked, clients refuse to pay upfront, and freelancers constantly get scammed out of their hard-earned money. On top of that, managing a project—from drafting proposals to breaking down milestones—is entirely manual and exhausting.

## 💡 The Solution: FreelanceAI
**FreelanceAI (ASP)** is a paradigm shift. We merge **Multi-Agent AI** with the security of the **X Layer Blockchain** to create a zero-friction, zero-trust marketplace where AI does the heavy lifting, and smart contracts guarantee fair play.

Instead of a traditional platform, ASP acts as a swarm of specialized AI Agents that orchestrate the entire freelance lifecycle:
1. **No more writing cover letters:** AI automatically drafts tailored proposals based on your parsed CV.
2. **No more managing tasks manually:** AI breaks down giant gigs into actionable Kanban boards.
3. **No more payment anxiety:** Funds are cryptographically locked in an X Layer Escrow smart contract.
4. **No more fake reviews:** Upon completion, AI evaluates your performance and mints a permanent **Soulbound Token (SBT)** to the X Layer blockchain, representing your immutable, on-chain reputation.

---

## ✨ Core Pillars & Features

### 🧠 1. The Autonomous AI Workforce
ASP isn't just an interface; it's an intelligent orchestrator powered by a custom LLM layer:
* **ScoutAgent:** Automatically parses a freelancer's uploaded CV and GitHub into verified skill vectors.
* **ProposalAgent:** Generates highly persuasive, context-aware pitch drafts with a single click, saving hours of application time.
* **TaskManagerAgent:** Analyzes gig requirements and auto-generates granular, milestone-based Kanban boards.
* **ReputationAgent:** Acts as an impartial judge post-gig, analyzing client feedback, delivery times, and dispute history to calculate a fair score.

### ⛓️ 2. Zero-Trust Escrow on X Layer
We leverage the EVM-compatible speed and low fees of the **X Layer Testnet**. 
When a client hires a freelancer, the funds (USDT) are deposited into our `GigEscrow` smart contract. Funds are released milestone-by-milestone only when both parties agree the work is done, completely eliminating non-payment scams.

### 🏆 3. Soulbound Reputation (SBT)
Reputation should belong to the worker, not the platform. ASP mints non-transferable ERC-721 Soulbound Tokens representing a freelancer's real-world reliability, verified skills, and job history. Because it's on-chain, this reputation is portable across the entire Web3 ecosystem.

### 👛 4. Native OKX Wallet Integration
Built from the ground up for the OKX ecosystem, ASP prioritizes `window.okxwallet` injection. It features intelligent auto-chain switching, prompting users to seamlessly connect to the X Layer Testnet with a single click if they are on the wrong network.

---

## 🏗️ Technical Architecture

- **Frontend & Backend:** Next.js 16 (App Router, React 19, TypeScript), Vanilla CSS Glassmorphism
- **AI Integration:** OpenAI GPT-4o architecture via custom robust agent classes.
- **Smart Contracts:** Solidity 0.8.24, Hardhat, Ethers.js v6
- **Database:** Prisma ORM (SQLite / Postgres ready)
- **Web3 Auth:** SIWE (Sign-In with Ethereum) + NextAuth.js

### 📦 Project Structure
```text
asp/
├── contracts/           # Smart Contracts: EscrowFactory, GigEscrow, ReputationSBT
├── src/
│   ├── app/             # App Router: Marketplace, Dashboard, Gig Workspace, API routes
│   ├── components/      # Global UI: WalletProvider, EscrowPanel, Kanban
│   └── lib/
│       ├── ai/          # AI Agent Framework (BaseAgent, Scout, Match, Task, etc.)
│       └── blockchain/  # Ethers.js smart contract adapters
└── hardhat.config.ts    # X Layer network configuration
```

---

## 🚀 Quick Start & Local Setup

### Prerequisites
- Node.js 18+
- OKX Wallet or MetaMask browser extension

### Installation
```bash
# 1. Clone the repository
git clone https://github.com/Zlatan327/asp.git
cd asp

# 2. Install dependencies
npm install

# 3. Configure Environment
cp .env.example .env
# Important: Fill in OPENAI_API_KEY and NEXTAUTH_SECRET in your .env file!

# 4. Initialize the Database
npx prisma generate
npx prisma db push

# 5. Start the Application
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) and connect your wallet!

---

## 🔗 Deployed Contracts (X Layer Testnet)
Our smart contracts are verified and deployed on X Layer Testnet (Chain ID: 1952):
| Contract | Address |
|---|---|
| **EscrowFactory** | `0xCf0e0613Bf02374b2B3B72525749B16e0Bee3C1f` |
| **ReputationSBT** | `0x70EE13351431E8983783BCB7205745E564Bf4aB3` |
| **TestUSDT** | `0x5cfbAe8B83556d78B8BC8D8D74dE15A6Be5EEAb3` |

---

<div align="center">
  <p><b>Built with ❤️ for the OKX AI Genesis Hackathon</b></p>
</div>
