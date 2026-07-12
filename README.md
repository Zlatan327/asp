# Agent Service Provider (ASP) Platform

Welcome to the **Agent Service Provider (ASP)** platform! This is a next-generation Web3 freelance and micro-bounty ecosystem built entirely on the **X Layer Testnet** and powered by **OKX.AI**.

## Our Distinct Advantage 🚀
You might be wondering: *What is our edge over the multiple creator agencies that have been popping up on X (Twitter) since 2025?*

Traditional creator agencies rely heavily on manual verification, human middlemen, and trust-based payments. We eliminate all of this using Web3 and AI:

1. **Zero-Knowledge (ZK) Proof Verification**: Instead of trusting a screenshot to verify if someone actually liked a tweet or joined a Discord, we use a decentralized ZK-oracle (like zkPass or TLSNotary). Users generate a cryptographic proof locally that they completed the social action, without exposing their underlying session cookies. 
2. **The Auto-Bounty Bot**: Our killer feature. Users who build their on-chain reputation by manually completing 10+ tasks and maintaining a Social Reliability Score (SRS) above 90% unlock our **Auto-Bounty Bot**. This AI agent autonomously claims and completes social micro-bounties on their behalf, allowing high-trust users to earn passive income. No traditional agency can offer this!
3. **Trustless Escrow**: All high-ticket freelance gigs are secured by automated, trustless USDT escrow smart contracts on X Layer.
4. **AI Task Decomposition**: Clients don't need to micromanage. Our integrated GPT-4o agents break down complex gigs into manageable Kanban tasks.

## Key Features

- **Web3 Authentication**: Sign-In with Ethereum (SIWE) using OKX Wallet.
- **AI Agent Integration**: Autonomous Task Manager, Scout, and Reputation agents.
- **Freelance Gig Marketplace**: Post and apply for high-value tech gigs.
- **Social Micro-Bounties**: Earn USDT for performing verifiable social actions (Likes, Retweets, Discord engagement).
- **On-Chain Reputation**: Soulbound Tokens (SBT) track a user's credibility and Social Reliability Score (SRS).

---

## Local Development (Testing on your PC)

To test the application locally on your PC:

1. Ensure you have Node.js installed.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory (make sure your OpenAI API key and JWT secret are set).
4. Generate the Prisma database client and push the schema:
   ```bash
   npx prisma generate
   npx prisma db push
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```
6. Open your browser and navigate to `http://localhost:3000`.

---

## VPS Deployment Guide (For Production)

When you are ready to move this project from your local PC to a live Virtual Private Server (VPS), follow these step-by-step instructions to conclude the deployment:

### Step 1: VPS Setup & Prerequisites
1. **Provision a VPS**: Rent a VPS (e.g., DigitalOcean Droplet, AWS EC2, or Hetzner) running Ubuntu 22.04 or 24.04.
2. **SSH into your VPS**: `ssh root@your_vps_ip`
3. **Install Node.js & npm**: Use NVM (Node Version Manager) to install Node.js (v18 or v20).
4. **Install Git & PM2**: 
   ```bash
   sudo apt update && sudo apt install git -y
   npm install -g pm2
   ```

### Step 2: Clone and Configure
1. **Clone the Repository**:
   ```bash
   git clone https://github.com/Zlatan327/asp.git
   cd asp
   ```
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Setup Environment Variables**:
   Create a `.env` file on the VPS:
   ```bash
   nano .env
   ```
   Add your production variables (e.g., `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL=https://yourdomain.com`, `OPENAI_API_KEY`).

### Step 3: Database & Build
1. **Sync Database**:
   ```bash
   npx prisma generate
   npx prisma db push
   ```
2. **Build the Next.js App**:
   ```bash
   npm run build
   ```

### Step 4: Run with PM2
To keep the application running in the background even when you close the terminal, use PM2:
```bash
pm2 start npm --name "asp-platform" -- start
pm2 save
pm2 startup
```

### Step 5: Reverse Proxy with Nginx & SSL
1. **Install Nginx**:
   ```bash
   sudo apt install nginx -y
   ```
2. **Configure Nginx**:
   Set up a reverse proxy to route port 80/443 traffic to your Next.js app running on port 3000.
3. **Secure with SSL (Certbot)**:
   ```bash
   sudo apt install certbot python3-certbot-nginx -y
   sudo certbot --nginx -d yourdomain.com
   ```

Your platform is now live, secure, and ready for users!
