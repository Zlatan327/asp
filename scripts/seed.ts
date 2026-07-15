import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding local database...');

  // 1. Create a Freelancer User
  const freelancer = await prisma.user.create({
    data: {
      walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
      name: 'Alice (Freelancer)',
      email: 'alice@example.com',
      role: 'FREELANCER',
      freelancerProfile: {
        create: {
          headline: 'Full Stack Web3 Developer',
          bio: 'I build smart contracts and Next.js apps.',
          hourlyRate: 50,
          skills: JSON.stringify(['Solidity', 'React', 'Next.js']),
        }
      },
      reputationScore: {
        create: {
          overallScore: 95,
          socialReliabilityScore: 98,
          tasksCompleted: 15, // Unlocks Auto-Bounty Bot
        }
      }
    }
  });

  // 2. Create a Client User
  const client = await prisma.user.create({
    data: {
      walletAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
      name: 'Bob (Client)',
      email: 'bob@example.com',
      role: 'CLIENT',
      clientProfile: {
        create: {
          companyName: 'Web3 Startup',
          description: 'Building the future of decentralized finance.'
        }
      }
    }
  });

  // 3. Create Gigs
  const gig1 = await prisma.gig.create({
    data: {
      clientId: client.id,
      title: 'Build an Escrow Smart Contract',
      description: 'Need a secure escrow contract written in Solidity. Must include tests.',
      budget: 1000,
      currency: 'USDT',
      status: 'OPEN',
      category: 'Smart Contracts',
      experienceLevel: 'EXPERT',
      skills: JSON.stringify(['Solidity', 'Hardhat', 'Security']),
    }
  });

  const gig2 = await prisma.gig.create({
    data: {
      clientId: client.id,
      title: 'Design Landing Page UI',
      description: 'Need a sleek dark-mode landing page designed in Figma.',
      budget: 300,
      currency: 'USDT',
      status: 'OPEN',
      category: 'Design',
      experienceLevel: 'INTERMEDIATE',
      skills: JSON.stringify(['Figma', 'UI/UX']),
    }
  });

  // 4. Create an active Gig with accepted proposal (PENDING_FUNDS)
  const gig3 = await prisma.gig.create({
    data: {
      clientId: client.id,
      freelancerId: freelancer.id, // Assigned to Alice
      title: 'Fullstack Next.js DApp integration',
      description: 'Integrate the smart contracts into our Next.js frontend.',
      budget: 800,
      currency: 'USDT',
      status: 'PENDING_FUNDS', // Waiting for Escrow
      category: 'Web Development',
      experienceLevel: 'INTERMEDIATE',
      skills: JSON.stringify(['React', 'ethers.js', 'Next.js']),
    }
  });

  // Create the accepted proposal for gig3
  await prisma.proposal.create({
    data: {
      gigId: gig3.id,
      freelancerId: freelancer.id,
      coverLetter: 'I have extensive experience with Next.js and ethers.js integrations.',
      bidAmount: 800,
      estimatedDays: 7,
      status: 'ACCEPTED'
    }
  });

  console.log('✅ Database seeded successfully!');
  console.log(`- Freelancer: ${freelancer.name}`);
  console.log(`- Client: ${client.name}`);
  console.log(`- Open Gigs: 2`);
  console.log(`- Pending Escrow Gigs: 1`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
