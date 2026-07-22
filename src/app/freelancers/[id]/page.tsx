import { prisma } from '@/lib/db/prisma';
import { safeParseJson } from '@/lib/json';

export default async function FreelancerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const freelancer = await prisma.user.findUnique({
    where: { id },
    include: {
      freelancerProfile: true,
      reputationScore: true,
      gigsWorked: {
        where: { status: 'COMPLETED' },
        include: { client: true }
      }
    }
  });

  if (!freelancer || !freelancer.freelancerProfile) {
    return <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>Freelancer not found.</div>;
  }

  const profile = freelancer.freelancerProfile;
  const reputation = freelancer.reputationScore;
  const skills = safeParseJson(profile.skills, []);

  return (
    <div style={{ minHeight: '100vh', padding: 'var(--space-8)' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--space-8)' }}>
        
        {/* Left Column: Avatar & Reputation SBT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <div className="glass-card" style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
            <div style={{ 
              width: 120, height: 120, borderRadius: '50%', background: 'var(--color-accent-gradient)', 
              margin: '0 auto var(--space-4)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 'var(--text-4xl)', fontWeight: 800, color: 'white'
            }}>
              {freelancer.name?.[0] || 'F'}
            </div>
            <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800 }}>{freelancer.name}</h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-2)' }}>
              {profile.headline || 'Freelance Professional'}
            </p>
          </div>

          <div className="card" style={{ padding: 'var(--space-6)', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>On-Chain Trust</h2>
              <div style={{ padding: '2px 8px', background: 'rgba(255,255,255,0.1)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)' }}>SBT</div>
            </div>
            
            <div style={{ textAlign: 'center', padding: 'var(--space-4) 0' }}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Reputation Score</div>
              <div style={{ fontSize: 'var(--text-5xl)', fontWeight: 900, color: 'var(--color-accent-primary)', marginTop: 'var(--space-2)', textShadow: '0 0 20px rgba(var(--color-accent-primary-rgb), 0.3)' }}>
                {reputation?.overallScore ? reputation.overallScore.toFixed(0) : '50'}
              </div>
            </div>

            <div style={{ marginTop: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                <span>Gigs Completed</span>
                <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{freelancer.gigsWorked.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Status</span>
                <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>Available</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Bio & Portfolio */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <div className="glass-card" style={{ padding: 'var(--space-8)' }}>
            <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>About</h2>
            <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
              {profile.bio || 'This freelancer hasn\'t written a bio yet.'}
            </p>
            
            <div style={{ marginTop: 'var(--space-6)' }}>
              <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-3)', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>Skills</h3>
              <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                {skills.length > 0 ? skills.map((s: string) => (
                  <span key={s} className="skill-tag">{s}</span>
                )) : <span style={{ color: 'var(--color-text-secondary)' }}>No skills listed.</span>}
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 'var(--space-8)' }}>
            <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>Completed Work</h2>
            
            {freelancer.gigsWorked.length === 0 ? (
              <p style={{ color: 'var(--color-text-secondary)' }}>No completed gigs yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {freelancer.gigsWorked.map(gig => (
                  <div key={gig.id} style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-4)' }}>
                    <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 600, marginBottom: 'var(--space-1)' }}>{gig.title}</h3>
                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                      Client: {gig.client.name} • Earned: {gig.budget.toString()} {gig.currency}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
