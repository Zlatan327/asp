# ASP — VPS Deployment Guide

This guide covers deploying the ASP platform on a Linux VPS (Ubuntu/Debian).

---

## Prerequisites

- **Node.js 18+** and **npm**
- **Git**
- A domain name (optional, but recommended)

---

## Step 1: Clone & Install

```bash
git clone <repo-url> asp
cd asp
npm install
```

## Step 2: Environment Variables

```bash
cp .env.example .env
nano .env
```

Fill in the required values:
- `NEXTAUTH_SECRET` — Generate with: `openssl rand -base64 32`
- `NEXTAUTH_URL` — Your server URL (e.g. `https://yourdomain.com`)
- `OPENAI_API_KEY` — Your OpenAI API key
- `PRIVATE_KEY` — Deployer wallet private key (only needed for contract redeployment)

The smart contract addresses are already pre-filled for X Layer Testnet.

## Step 3: Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Create the SQLite database & apply schema
npx prisma db push
```

## Step 4: Build the App

```bash
npm run build
```

## Step 5: Run with PM2 (Recommended)

```bash
# Install PM2 globally
npm install -g pm2

# Start the app
pm2 start npm --name "asp" -- start

# Auto-restart on reboot
pm2 startup
pm2 save
```

The app will be available on port **3000** by default.

## Step 6: Reverse Proxy (Nginx)

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Then enable HTTPS with certbot:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

## Step 7: Verify

Visit `https://yourdomain.com` and confirm:
- Landing page loads with animations
- "Connect Wallet" button works
- Login via SIWE or GitHub/Discord works
- Creating a gig works
- Marketplace shows gigs

---

## Quick Commands

| Action | Command |
|---|---|
| Start | `pm2 start asp` |
| Stop | `pm2 stop asp` |
| Restart | `pm2 restart asp` |
| Logs | `pm2 logs asp` |
| Rebuild | `npm run build; pm2 restart asp` |
