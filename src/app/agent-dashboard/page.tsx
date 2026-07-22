import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import Link from 'next/link';
import { Bot, Activity, CheckCircle2, ShieldCheck, Sparkles, MessageSquare } from 'lucide-react';

export default async function AgentDashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      freelancerProfile: true,
      clientProfile: true,
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
        <div>
          <div className="badge badge-primary" style={{ marginBottom: 'var(--space-3)' }}>
            <Sparkles size={14} />
            AI Orchestration
          </div>
          <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 800 }}>
            Agent Dashboard
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-2)' }}>
            Monitor and configure your AI proxies working on X Layer.
          </p>
        </div>
      </header>

      <div className="grid grid-3" style={{ gap: 'var(--space-6)' }}>
        
        {/* Agent 1: Scout */}
        <div className="glass-card" style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <div style={{ padding: 'var(--space-2)', background: 'rgba(0, 255, 128, 0.1)', borderRadius: 'var(--radius-md)', color: 'var(--color-success)' }}>
                <ShieldCheck size={24} />
              </div>
              <div>
                <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>Scout Agent</h2>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-success)', display: 'inline-block' }}></span>
                  Active
                </span>
              </div>
            </div>
          </div>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-6)', flex: 1 }}>
            Continuously monitors your GitHub/X activity to extract new skills and update your verifiable reputation.
          </p>
          <div style={{ padding: 'var(--space-3)', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-1)' }}>Last Action</div>
            <div style={{ fontSize: 'var(--text-sm)' }}>Synced 2 new skills from GitHub</div>
          </div>
        </div>

        {/* Agent 2: Project Manager */}
        {isClient ? (
          <div className="glass-card" style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', border: '1px solid var(--color-accent-primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <div style={{ padding: 'var(--space-2)', background: 'rgba(255, 42, 42, 0.1)', borderRadius: 'var(--radius-md)', color: 'var(--color-accent-primary)' }}>
                  <Bot size={24} />
                </div>
                <div>
                  <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>PM Agent</h2>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-text-tertiary)', display: 'inline-block' }}></span>
                    Idle
                  </span>
                </div>
              </div>
            </div>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-6)', flex: 1 }}>
              Turns your raw project ideas into structured gigs, breaking them down into milestones, required skills, and acceptance criteria.
            </p>
            <Link href="/gigs/new" className="btn btn-primary" style={{ width: '100%', textAlign: 'center' }}>
              Draft New Gig
            </Link>
          </div>
        ) : (
          <div className="glass-card" style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <div style={{ padding: 'var(--space-2)', background: 'rgba(255, 42, 42, 0.1)', borderRadius: 'var(--radius-md)', color: 'var(--color-accent-primary)' }}>
                  <Activity size={24} />
                </div>
                <div>
                  <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>Auto-Bidder</h2>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-success)', display: 'inline-block' }}></span>
                    Listening
                  </span>
                </div>
              </div>
            </div>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-6)', flex: 1 }}>
              Listens to the marketplace for gigs matching your profile and auto-drafts tailored proposals.
            </p>
            <div style={{ padding: 'var(--space-3)', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-1)' }}>Settings</div>
              <div style={{ fontSize: 'var(--text-sm)', display: 'flex', justifyContent: 'space-between' }}>
                <span>Min. Budget</span>
                <strong>500 USDT</strong>
              </div>
            </div>
          </div>
        )}

        {/* Agent 3: Escrow / Dispute */}
        <div className="glass-card" style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', opacity: 0.7 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <div style={{ padding: 'var(--space-2)', background: 'rgba(255, 255, 255, 0.05)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-secondary)' }}>
                <MessageSquare size={24} />
              </div>
              <div>
                <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>Arbiter Agent</h2>
                <span className="badge badge-secondary" style={{ fontSize: '0.65rem' }}>Coming Soon</span>
              </div>
            </div>
          </div>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-6)', flex: 1 }}>
            Automatically reviews PRs and GitHub activity against milestone criteria to suggest proportional dispute resolutions on-chain.
          </p>
          <button className="btn btn-secondary" disabled style={{ width: '100%' }}>
            Locked
          </button>
        </div>

      </div>

      {/* Recent Activity Log */}
      <div className="card" style={{ marginTop: 'var(--space-8)', padding: 'var(--space-6)' }}>
        <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-6)' }}>Agent Activity Log</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-4)', paddingBottom: 'var(--space-4)', borderBottom: '1px solid var(--color-border-subtle)' }}>
            <CheckCircle2 color="var(--color-success)" size={20} style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <p style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>Scout Agent evaluated your profile</p>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginTop: 'var(--space-1)' }}>
                Extracted skills and updated X Layer Reputation SBT.
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-4)', opacity: 0.6 }}>
            <Bot color="var(--color-text-tertiary)" size={20} style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <p style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>System Initialized</p>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginTop: 'var(--space-1)' }}>
                Agents provisioned and ready for orchestrations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
