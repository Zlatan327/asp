import { spawnSync } from 'child_process';

const baseUrl = (
  process.env.SKILLMINT_API_BASE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXTAUTH_URL ||
  'https://skillmint.xyz'
).replace(/\/$/, '');

const services = [
  {
    serviceName: "SkillMint Health Check",
    serviceDescription: "Provides real-time uptime and readiness status for the SkillMint freelancer marketplace agent.\n1. No inputs required (HTTP GET).",
    serviceType: "A2MCP",
    fee: "0",
    endpoint: `${baseUrl}/api/health`
  },
  {
    serviceName: "SkillMint Scout Parse",
    serviceDescription: "Parses a CV or public freelancer footprint and returns a structured Scout Agent credibility profile.\n1. Send JSON, text, or multipart form data with cv/cvText/socials/socialScans.",
    serviceType: "A2MCP",
    fee: "0",
    endpoint: `${baseUrl}/api/v1/scout/parse`
  },
  {
    serviceName: "SkillMint Gig Drafting",
    serviceDescription: "Turns a client's project brief into a clean freelance gig draft with milestones, budget guidance, and required skills.\n1. Project title or idea, 2. Desired budget and timeline.",
    serviceType: "A2A"
  }
];

const args = [
  'agent',
  'create',
  '--role', 'asp',
  '--name', 'SkillMint',
  '--description', 'An autonomous freelancer marketplace agent that verifies skills, drafts gigs, matches talent, and supports trust-minimized escrow workflows.',
  '--picture', 'https://static.okx.com/cdn/web3/wallet/marketplace/headimages/agent/avatar/d60210d0-8d84-4220-9764-04e370491769.png',
  '--service', JSON.stringify(services)
];

const result = spawnSync('C:\\Users\\Admin\\.local\\bin\\onchainos.exe', args);
console.log('STDOUT:');
console.log(result.stdout?.toString());
console.log('STDERR:');
console.log(result.stderr?.toString());
