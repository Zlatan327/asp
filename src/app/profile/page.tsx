import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import ProfileSettingsClient from './ProfileSettingsClient';

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      socialAccounts: true,
      reputationScore: true,
      freelancerProfile: true,
    },
  });

  if (!user) {
    redirect('/login');
  }

  return (
    <div style={{ minHeight: '100vh', padding: 'var(--space-8)' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, marginBottom: 'var(--space-6)' }}>Profile & Verification</h1>
        
        <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
          <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>Connected Accounts</h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-6)' }}>
            Connect your developer and social footprints. The more verifiable data you provide, the higher your AI Credibility Score will be.
          </p>
          
          <ProfileSettingsClient 
            socialAccounts={user.socialAccounts} 
            walletAddress={user.walletAddress}
            currentScore={user.reputationScore?.overallScore}
          />
        </div>

      </div>
    </div>
  );
}
