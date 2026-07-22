import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import Link from 'next/link';
import { safeParseJson } from '@/lib/json';

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  // Ensure user is in DB and onboarded
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      freelancerProfile: true,
      clientProfile: true,
      reputationScore: true,
      gigsWorked: true,
      gigsPosted: true,
    },
  });

  if (!user?.onboardedAt) {
    redirect('/onboarding');
  }

  const isFreelancer = user.role === 'FREELANCER' || user.role === 'BOTH';
  const isClient = user.role === 'CLIENT' || user.role === 'BOTH';

  return (
    <div style={{ minHeight: '100vh', padding: 'var(--space-8)' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-8)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 'var(--radius-full)',
              background: 'var(--color-accent-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-text-inverse)',
              fontWeight: 800,
            }}
          >
            {user.name?.[0] || 'U'}
          </div>
          <div>
            <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 700 }}>
              Welcome back, {user.name}
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
              {user.walletAddress 
                ? `Connected: ${user.walletAddress.slice(0,6)}...${user.walletAddress.slice(-4)}` 
                : 'No wallet connected'}
            </p>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
          <Link href="/marketplace" className="btn btn-secondary">
            Browse Gigs
          </Link>
          {isClient && (
            <Link href="/gigs/new" className="btn btn-primary">
              Post a Gig
            </Link>
          )}
        </div>
      </header>

      <div className="grid grid-3" style={{ gap: 'var(--space-6)' }}>
        
        {/* Freelancer Panel */}
        {isFreelancer && user.freelancerProfile && (
          <div className="glass-card" style={{ padding: 'var(--space-6)', gridColumn: 'span 2' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>Freelancer Profile</h2>
              <span className="badge badge-success">Verified by AI Scout</span>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-8)', marginBottom: 'var(--space-6)' }}>
              <div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', marginBottom: 'var(--space-1)' }}>Credibility Score</div>
                <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, color: 'var(--color-accent-primary)' }}>
                  {user.reputationScore?.overallScore != null ? user.reputationScore.overallScore.toFixed(0) : 0}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', marginBottom: 'var(--space-1)' }}>Total Earned</div>
                <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, color: 'var(--color-success)' }}>
                  ${user.freelancerProfile.totalEarned != null ? user.freelancerProfile.totalEarned.toFixed(0) : 0}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', marginBottom: 'var(--space-1)' }}>Completed Gigs</div>
                <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 800 }}>
                  {user.freelancerProfile.completedGigs}
                </div>
              </div>
            </div>

            <div>
              <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-3)' }}>Verified Skills</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                {safeParseJson<any[]>(user.freelancerProfile.skills as any, []).map((skill: any) => (
                  <span key={skill.name} className="skill-tag">
                    {skill.name} <span style={{ opacity: 0.5, marginLeft: 4 }}>{skill.confidence}%</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Client Panel */}
        {isClient && user.clientProfile && (
          <div className="glass-card" style={{ padding: 'var(--space-6)' }}>
             <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-6)' }}>Client Overview</h2>
             
             <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', marginBottom: 'var(--space-1)' }}>Total Spent</div>
                <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800 }}>
                  ${user.clientProfile.totalSpent != null ? user.clientProfile.totalSpent.toString() : '0'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', marginBottom: 'var(--space-1)' }}>Active Gigs</div>
                <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800 }}>
                  {user.gigsPosted.filter(g => g.status === 'IN_PROGRESS').length}
                </div>
              </div>
             </div>
          </div>
        )}

        {/* Active Gigs Section */}
        <div className="card" style={{ gridColumn: '1 / -1', padding: 'var(--space-6)', marginTop: 'var(--space-4)' }}>
          <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-6)' }}>Active Gigs</h2>
          
          {user.gigsWorked.length === 0 && user.gigsPosted.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-8) 0', color: 'var(--color-text-tertiary)' }}>
              <p>No active gigs found.</p>
              <Link href="/marketplace" style={{ color: 'var(--color-accent-primary)', marginTop: 'var(--space-2)', display: 'inline-block' }}>Explore Marketplace →</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {[...user.gigsWorked, ...user.gigsPosted]
                .filter(g => g.status === 'IN_PROGRESS' || g.status === 'OPEN')
                .map(gig => (
                  <Link href={`/gigs/${gig.id}`} key={gig.id} style={{ display: 'block', padding: 'var(--space-4)', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-md)', background: 'var(--color-background-elevated)', textDecoration: 'none', color: 'inherit' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 600 }}>{gig.title}</h3>
                      <span className={`badge ${gig.status === 'OPEN' ? 'badge-info' : 'badge-warning'}`}>{gig.status}</span>
                    </div>
                    <div style={{ marginTop: 'var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                      Budget: {gig.budget.toString()} USDT
                    </div>
                  </Link>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
