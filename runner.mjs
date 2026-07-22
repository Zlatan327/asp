import { spawnSync } from 'child_process';

const services = [
  {
    serviceName: "Node Health Check",
    serviceDescription: "Provides real-time uptime and readiness status for the Klop commerce agent.\n1. No inputs required (HTTP GET).",
    serviceType: "A2MCP",
    fee: "0",
    endpoint: "https://asp-inky.vercel.app/api/health"
  },
  {
    serviceName: "B2B Contract Negotiation",
    serviceDescription: "Autonomous negotiation of enterprise deals and management of Web3 escrow.\n1. Target agency domain, 2. Desired contract budget.",
    serviceType: "A2A"
  }
];

const args = [
  'agent',
  'create',
  '--role', 'asp',
  '--name', 'Klop',
  '--description', 'An autonomous B2B commerce agent that sources leads, negotiates enterprise contracts, and manages trustless Web3 escrow for global agencies.',
  '--picture', 'https://static.okx.com/cdn/web3/wallet/marketplace/headimages/agent/avatar/d60210d0-8d84-4220-9764-04e370491769.png',
  '--service', JSON.stringify(services)
];

const result = spawnSync('C:\\Users\\Admin\\.local\\bin\\onchainos.exe', args);
console.log('STDOUT:');
console.log(result.stdout?.toString());
console.log('STDERR:');
console.log(result.stderr?.toString());
