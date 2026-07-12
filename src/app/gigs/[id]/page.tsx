'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import EscrowPanel from '@/components/EscrowPanel';

export default function GigDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const router = useRouter();
  const { data: session } = useSession();
  const [gig, setGig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState<string | null>(null);
  
  // Proposal State
  const [submitting, setSubmitting] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [bidAmount, setBidAmount] = useState('');
  const [estimatedDays, setEstimatedDays] = useState('');
  const [useAiDraft, setUseAiDraft] = useState(false);

  useEffect(() => {
    fetch(`/api/gigs/${unwrappedParams.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setGig(data);
        setBidAmount(data.budget.toString());
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        alert('Failed to load gig details.');
        setLoading(false);
      });
  }, [unwrappedParams.id]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch(`/api/gigs/${gig.id}/proposals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coverLetter,
          bidAmount,
          estimatedDays,
          useAiDraft
        })
      });

      if (!res.ok) throw new Error('Failed to submit proposal');
      
      alert('Proposal submitted successfully!');
      router.push('/dashboard');
    } catch (error) {
      console.error(error);
      alert('Failed to submit proposal. Make sure you have a complete Freelancer profile.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAccept = async (proposalId: string) => {
    if (!confirm('Are you sure you want to hire this freelancer?')) return;
    try {
      setIsAccepting(proposalId);
      const res = await fetch(`/api/gigs/${gig.id}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposalId })
      });
      if (!res.ok) throw new Error('Failed to accept proposal');
      alert('Freelancer hired successfully!');
      window.location.reload();
    } catch (err: any) {
      console.error(err);
      alert(err.message);
    } finally {
      setIsAccepting(null);
    }
  };

  if (loading) return <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>Loading Gig Details...</div>;
  if (!gig) return <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>Gig not found.</div>;

  const isClient = session?.user?.id === gig.clientId;
  const hasApplied = gig.proposals?.some((p: any) => p.freelancerId === session?.user?.id);

  return (
    <div style={{ minHeight: '100vh', padding: 'var(--space-8)' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', gap: 'var(--space-8)', alignItems: 'flex-start' }}>
        
        {/* Main Gig Details */}
        <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <div className="glass-card" style={{ padding: 'var(--space-8)' }}>
            <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, marginBottom: 'var(--space-4)' }}>{gig.title}</h1>
            
            <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-6)', flexWrap: 'wrap' }}>
              <span className="badge badge-info">{gig.experienceLevel} Experience</span>
              {JSON.parse(gig.skills || '[]').map((s: string) => (
                 <span key={s} className="skill-tag">{s}</span>
              ))}
            </div>

            <div style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-base)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
              {gig.description}
            </div>
          </div>

          {/* If the current user is the client, show proposals */}
          {isClient && (
            <div className="card" style={{ padding: 'var(--space-6)' }}>
              <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>Proposals ({gig.proposals?.length || 0})</h2>
              {gig.proposals?.length === 0 ? (
                <p style={{ color: 'var(--color-text-tertiary)' }}>No proposals yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  {gig.proposals.map((p: any) => (
                    <div key={p.id} style={{ border: '1px solid var(--color-border)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                        <div style={{ fontWeight: 600 }}>{p.freelancer?.name}</div>
                        <div style={{ fontWeight: 700, color: 'var(--color-accent-primary)' }}>{p.bidAmount} USDT in {p.estimatedDays} days</div>
                      </div>
                      {p.matchScore && (
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-success)', marginBottom: 'var(--space-2)' }}>
                          ✨ AI Match Score: {(p.matchScore * 100).toFixed(0)}%
                        </div>
                      )}
                      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>{p.coverLetter}</p>
                      
                      {gig.status === 'OPEN' && p.status === 'PENDING' && (
                        <button 
                          className="btn btn-primary" 
                          style={{ marginTop: 'var(--space-4)', padding: 'var(--space-2) var(--space-4)', fontSize: 'var(--text-xs)' }}
                          onClick={() => handleAccept(p.id)}
                          disabled={isAccepting === p.id}
                        >
                          {isAccepting === p.id ? 'Hiring...' : 'Hire Freelancer'}
                        </button>
                      )}
                      {p.status === 'ACCEPTED' && (
                        <div style={{ marginTop: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-success)', fontWeight: 600 }}>
                          ✓ Hired
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar Info & Apply Action */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <div className="glass-card" style={{ padding: 'var(--space-6)' }}>
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>Budget</div>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--color-accent-primary)' }}>
                {gig.budget} {gig.currency} <span style={{ fontSize: 'var(--text-sm)', fontWeight: 400 }}>{gig.budgetType === 'HOURLY' ? '/ hr' : ''}</span>
              </div>
            </div>

            <div style={{ marginBottom: 'var(--space-6)' }}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>Client</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--color-accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {gig.client?.name?.[0] || 'C'}
                </div>
                <div style={{ fontWeight: 600 }}>{gig.client?.name}</div>
              </div>
            </div>

            {/* Escrow Panel & Workspace Link for In Progress / Accepted gigs */}
            {(gig.status === 'IN_PROGRESS' || gig.status === 'COMPLETED') && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <button className="btn btn-secondary w-full" onClick={() => router.push(`/gigs/${gig.id}/workspace`)}>
                  Go to Active Workspace →
                </button>
                <EscrowPanel 
                  gig={gig} 
                  isClient={isClient} 
                  onEscrowCreated={() => window.location.reload()} 
                />
              </div>
            )}

            {/* Application Flow */}
            {!isClient && gig.status === 'OPEN' && (
              hasApplied ? (
                <button className="btn btn-secondary w-full" disabled>You've Applied</button>
              ) : (
                <form onSubmit={handleApply} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  <div className="divider" />
                  
                  <div>
                    <label style={{ display: 'block', marginBottom: 'var(--space-1)', fontWeight: 600, fontSize: 'var(--text-sm)' }}>Your Bid (USDT)</label>
                    <input type="number" required min={1} className="input w-full" value={bidAmount} onChange={e => setBidAmount(e.target.value)} />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: 'var(--space-1)', fontWeight: 600, fontSize: 'var(--text-sm)' }}>Est. Days</label>
                    <input type="number" required min={1} className="input w-full" value={estimatedDays} onChange={e => setEstimatedDays(e.target.value)} />
                  </div>

                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)', fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                      <input type="checkbox" checked={useAiDraft} onChange={e => setUseAiDraft(e.target.checked)} />
                      ✨ Auto-Draft Proposal with AI
                    </label>
                    
                    {!useAiDraft && (
                      <textarea 
                        required 
                        rows={4} 
                        placeholder="Write your cover letter..."
                        className="input w-full"
                        value={coverLetter}
                        onChange={e => setCoverLetter(e.target.value)}
                      />
                    )}
                  </div>

                  <button type="submit" className="btn btn-primary w-full" disabled={submitting}>
                    {submitting ? 'Submitting...' : (useAiDraft ? 'Draft & Apply' : 'Submit Proposal')}
                  </button>
                </form>
              )
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
