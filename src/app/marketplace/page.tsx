'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Gig {
  id: string;
  title: string;
  description: string;
  budget: number;
  budgetType: string;
  currency: string;
  experienceLevel: string;
  skills: string;
  createdAt: string;
  client: { name: string; avatarUrl: string };
}

export default function MarketplacePage() {
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    budgetTypeFixed: false,
    budgetTypeHourly: false,
    expBeginner: false,
    expIntermediate: false,
    expExpert: false,
  });

  useEffect(() => {
    fetch('/api/gigs')
      .then((res) => res.json())
      .then((data) => {
        setGigs(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        alert('Failed to load marketplace gigs.');
        setLoading(false);
      });
  }, []);

  const filteredGigs = gigs.filter((gig) => {
    // Budget Type Filter
    const filterFixed = filters.budgetTypeFixed;
    const filterHourly = filters.budgetTypeHourly;
    if (filterFixed || filterHourly) {
      if (gig.budgetType === 'FIXED' && !filterFixed) return false;
      if (gig.budgetType === 'HOURLY' && !filterHourly) return false;
    }

    // Experience Filter
    const expB = filters.expBeginner;
    const expI = filters.expIntermediate;
    const expE = filters.expExpert;
    if (expB || expI || expE) {
      if (gig.experienceLevel === 'BEGINNER' && !expB) return false;
      if (gig.experienceLevel === 'INTERMEDIATE' && !expI) return false;
      if (gig.experienceLevel === 'EXPERT' && !expE) return false;
    }

    return true;
  });

  return (
    <div style={{ minHeight: '100vh', padding: 'var(--space-8)' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 'var(--space-8)' }}>
          <div>
            <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, marginBottom: 'var(--space-2)' }}>Marketplace</h1>
            <p style={{ color: 'var(--color-text-secondary)' }}>Find your next Web3 gig and apply with AI.</p>
          </div>
          <Link href="/gigs/new" className="btn btn-primary">
            Post a Gig
          </Link>
        </header>

        <div style={{ display: 'flex', gap: 'var(--space-6)' }}>
          {/* Filters Sidebar */}
          <aside style={{ width: 250, flexShrink: 0 }}>
            <div className="glass-card" style={{ padding: 'var(--space-4)' }}>
              <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>Filters</h3>
              
              <div style={{ marginBottom: 'var(--space-4)' }}>
                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>Budget Type</label>
                <div style={{ marginTop: 'var(--space-2)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
                    <input type="checkbox" checked={filters.budgetTypeFixed} onChange={e => setFilters({...filters, budgetTypeFixed: e.target.checked})} /> Fixed Price
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
                    <input type="checkbox" checked={filters.budgetTypeHourly} onChange={e => setFilters({...filters, budgetTypeHourly: e.target.checked})} /> Hourly Rate
                  </label>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>Experience</label>
                <div style={{ marginTop: 'var(--space-2)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
                    <input type="checkbox" checked={filters.expBeginner} onChange={e => setFilters({...filters, expBeginner: e.target.checked})} /> Beginner
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
                    <input type="checkbox" checked={filters.expIntermediate} onChange={e => setFilters({...filters, expIntermediate: e.target.checked})} /> Intermediate
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
                    <input type="checkbox" checked={filters.expExpert} onChange={e => setFilters({...filters, expExpert: e.target.checked})} /> Expert
                  </label>
                </div>
              </div>
            </div>
          </aside>

          {/* Gig List */}
          <main style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-tertiary)' }}>
                Loading gigs...
              </div>
            ) : filteredGigs.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-tertiary)' }}>
                No active gigs found matching your filters.
              </div>
            ) : (
              filteredGigs.map((gig) => (
                <Link key={gig.id} href={`/gigs/${gig.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="card card-interactive" style={{ padding: 'var(--space-6)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-4)' }}>
                      <div>
                        <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 'var(--space-1)' }}>{gig.title}</h2>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>
                          Posted by {gig.client?.name || 'Anonymous'} • {new Date(gig.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 'var(--text-lg)', fontWeight: 800, color: 'var(--color-accent-primary)' }}>
                          {gig.budget} {gig.currency}
                        </div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>
                          {gig.budgetType}
                        </div>
                      </div>
                    </div>

                    <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {gig.description}
                    </p>

                    <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                      <span className="badge badge-info">{gig.experienceLevel}</span>
                      {JSON.parse(gig.skills || '[]').map((skill: string) => (
                        <span key={skill} className="skill-tag">{skill}</span>
                      ))}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </main>
        </div>

      </div>
    </div>
  );
}
