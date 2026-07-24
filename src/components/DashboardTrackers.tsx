'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function DashboardTrackers({ gigsPosted, gigsWorked, isClient, isFreelancer }: any) {
  const [showHistory, setShowHistory] = useState(false);

  // Helper to filter gigs
  const isHistory = (status: string) => status === 'COMPLETED' || status === 'CANCELLED';
  
  const clientActive = gigsPosted?.filter((g: any) => !isHistory(g.status)) || [];
  const clientHistory = gigsPosted?.filter((g: any) => isHistory(g.status)) || [];
  
  const freelancerActive = gigsWorked?.filter((g: any) => !isHistory(g.status)) || [];
  const freelancerHistory = gigsWorked?.filter((g: any) => isHistory(g.status)) || [];

  const hasHistory = clientHistory.length > 0 || freelancerHistory.length > 0;

  return (
    <div style={{ gridColumn: '1 / -1', marginTop: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
      
      {/* Client Tracker */}
      {isClient && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
            <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>My Posted Gigs</h2>
            <Link href="/gigs/new" className="btn btn-primary" style={{ padding: 'var(--space-2) var(--space-4)', fontSize: 'var(--text-xs)' }}>
              + Post New
            </Link>
          </div>
          
          {clientActive.length === 0 ? (
            <p style={{ color: 'var(--color-text-tertiary)', textAlign: 'center', padding: 'var(--space-4) 0' }}>No active posted gigs.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {clientActive.map((gig: any) => (
                <div key={gig.id} style={{ border: '1px solid var(--color-border-subtle)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg-elevated)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
                  <div>
                    <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 600 }}>{gig.title}</h3>
                    <div style={{ marginTop: 'var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', display: 'flex', gap: 'var(--space-4)', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span className={`badge ${gig.status === 'OPEN' ? 'badge-info' : 'badge-warning'}`}>{gig.status}</span>
                      <span>Budget: {gig.budget.toString()} {gig.currency}</span>
                      {gig.status === 'OPEN' && (
                        <span style={{ color: 'var(--color-accent-primary)', fontWeight: 600, background: 'rgba(255, 42, 42, 0.1)', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>
                          ✨ {gig.proposals?.length || 0} AI Matches
                        </span>
                      )}
                    </div>
                  </div>
                  <Link href={`/gigs/${gig.id}`} className="btn btn-secondary" style={{ padding: 'var(--space-2) var(--space-4)', fontSize: 'var(--text-xs)' }}>
                    {gig.status === 'OPEN' ? 'View AI Matches' : 'Manage Escrow'}
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Freelancer Tracker */}
      {isFreelancer && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
            <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>My Freelance Work</h2>
            <Link href="/marketplace" className="btn btn-secondary" style={{ padding: 'var(--space-2) var(--space-4)', fontSize: 'var(--text-xs)' }}>
              Find Work
            </Link>
          </div>
          
          {freelancerActive.length === 0 ? (
            <p style={{ color: 'var(--color-text-tertiary)', textAlign: 'center', padding: 'var(--space-4) 0' }}>No active freelance gigs.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {freelancerActive.map((gig: any) => (
                <div key={gig.id} style={{ border: '1px solid var(--color-border-subtle)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg-elevated)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
                  <div>
                    <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 600 }}>{gig.title}</h3>
                    <div style={{ marginTop: 'var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', display: 'flex', gap: 'var(--space-4)', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span className={`badge ${gig.status === 'IN_PROGRESS' ? 'badge-warning' : 'badge-info'}`}>{gig.status}</span>
                      <span>Earn: {gig.budget.toString()} {gig.currency}</span>
                    </div>
                  </div>
                  <Link href={`/gigs/${gig.id}`} className="btn btn-primary" style={{ padding: 'var(--space-2) var(--space-4)', fontSize: 'var(--text-xs)' }}>
                    View Workspace
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* History Toggle (Progressive UI) */}
      {hasHistory && (
        <div style={{ textAlign: 'center', marginTop: 'var(--space-4)' }}>
          <button 
            onClick={() => setShowHistory(!showHistory)} 
            style={{ background: 'none', border: 'none', color: 'var(--color-text-tertiary)', fontSize: 'var(--text-sm)', cursor: 'pointer', textDecoration: 'underline', transition: 'color 0.2s' }}
            onMouseOver={(e) => e.currentTarget.style.color = 'var(--color-text-primary)'}
            onMouseOut={(e) => e.currentTarget.style.color = 'var(--color-text-tertiary)'}
          >
            {showHistory ? 'Hide Past Gigs' : 'View Past Gigs History'}
          </button>
        </div>
      )}

      {/* History Sections */}
      {showHistory && hasHistory && (
        <div className="card animate-fade-in-down" style={{ opacity: 0.8 }}>
          <h2 style={{ fontSize: 'var(--text-md)', fontWeight: 600, marginBottom: 'var(--space-4)', color: 'var(--color-text-secondary)' }}>Gig History</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {[...clientHistory, ...freelancerHistory].map((gig: any) => (
              <div key={gig.id} style={{ border: '1px solid var(--color-border-subtle)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{gig.title}</h3>
                  <span className={`badge ${gig.status === 'COMPLETED' ? 'badge-success' : 'badge-error'}`} style={{ marginTop: 4, fontSize: '10px' }}>{gig.status}</span>
                </div>
                <Link href={`/gigs/${gig.id}`} style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--text-xs)' }}>
                  View Details →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
      
    </div>
  );
}
