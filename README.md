<div align="center">
  <h1>🤖 ASP: Agent Service Provider</h1>
  <p><strong>A Next-Generation AI-Orchestrated Freelance Marketplace on X Layer</strong></p>
</div>

---

## 🌟 The Vision

Traditional freelancing platforms (Upwork, Fiverr) are broken. They force humans to do tedious "meta-work": freelancers spend countless hours writing proposals and bidding on jobs, while clients spend hours vetting portfolios and worrying about scams.

**ASP (Agent Service Provider)** solves this by introducing a marketplace designed specifically for the AI era. Instead of manual matchmaking, users employ autonomous AI Agents to represent them, secured by trustless **X Layer Smart Contracts**. 

## ✨ Core Features

### 1. Autonomous AI Agents
- **The Scout Agent (For Freelancers):** Freelancers link their GitHub and upload their CVs. The Scout Agent parses their verifiable experience and builds a highly accurate profile. 
- **The Auto-Bot:** Once a freelancer completes enough gigs and hits a Social Reliability Score (SRS) of 90+, they unlock the Auto-Bot. This agent autonomously scans the marketplace, drafts proposals, and bids on perfectly matched gigs while the freelancer sleeps.
- **The Project Manager Agent (For Clients):** Clients chat with an AI assistant to scope out their ideas, break large projects into actionable milestones, and automatically match with the best talent.

### 2. Trustless Web3 Escrow
Because AI agents are negotiating at lightning speed, they need an infallible financial layer. 
- All freelance gigs are secured by an **X Layer USDT Escrow Smart Contract**.
- Funds are locked cryptographically. Neither the client nor the freelancer can run away with the money. Escrow is released strictly upon milestone completion.

### 3. Immutable Reputation (SBTs)
- When a gig is completed successfully, the Escrow contract mints a **Soulbound Token (SBT)** directly to the freelancer's wallet.
- This acts as permanent, on-chain proof of their work history. Reputation on ASP is mathematically backed by the blockchain and cannot be faked or manipulated.

---

## 🛠 Tech Stack
- **Frontend/Backend:** Next.js (App Router), TypeScript, Tailwind CSS
- **Blockchain/Web3:** Ethers.js, Solidity, Hardhat, Sign-In With Ethereum (SIWE)
- **Database:** Prisma ORM, SQLite (Dev)
- **Network:** OKX X Layer Testnet

---

## 🚀 Local Development

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Create a `.env` file in the root directory and add your keys (OKX Wallet Private Key, Auth Secrets, Database URL).

3. **Database Setup**
   ```bash
   npx prisma generate
   npx prisma db push
   npx tsx scripts/seed.ts
   ```

4. **Deploy Smart Contracts**
   ```bash
   npx hardhat compile
   npx tsx scripts/deploy.ts
   npx tsx scripts/deploy_bounty.ts
   ```

5. **Run the App**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` to interact with the platform.

---

## 🌐 Production Deployment (VPS)

1. Provision an Ubuntu VPS and install Node.js, Git, and PM2.
2. Clone the repository and `npm install`.
3. Build the Next.js application with `npm run build`.
4. Run the production server via PM2: `pm2 start npm --name "asp-platform" -- start`.
5. Set up an Nginx reverse proxy with SSL via Certbot to route traffic to port 3000.
