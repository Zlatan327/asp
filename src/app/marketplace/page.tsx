'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { safeParseJson } from '@/lib/json';

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
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-12)', borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: 'var(--space-8)' }}>
          <div>
            <h1 style={{ fontSize: 'var(--text-4xl)', fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 'var(--space-2)' }}>Marketplace</h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-lg)' }}>Find your next gig.</p>
          </div>
          <Link href="/gigs/new" className="btn btn-primary btn-lg" style={{ borderRadius: 'var(--radius-md)' }}>
            Post a Gig
          </Link>
        </header>

        <div style={{ display: 'flex', gap: 'var(--space-12)' }}>
          {/* Filters Sidebar */}
          <aside style={{ width: 240, flexShrink: 0 }}>
            <div style={{ position: 'sticky', top: '100px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
                <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-primary)' }}>Filters</h3>
                {(filters.budgetTypeFixed || filters.budgetTypeHourly || filters.expBeginner || filters.expIntermediate || filters.expExpert) && (
                  <button 
                    onClick={() => setFilters({ budgetTypeFixed: false, budgetTypeHourly: false, expBeginner: false, expIntermediate: false, expExpert: false })}
                    style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', textDecoration: 'underline' }}
                  >
                    Clear
                  </button>
                )}
              </div>
              
              <div style={{ marginBottom: 'var(--space-8)' }}>
                <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 500, color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-4)' }}>Budget Type</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', fontSize: 'var(--text-sm)', cursor: 'pointer' }}>
                    <input type="checkbox" checked={filters.budgetTypeFixed} onChange={e => setFilters({...filters, budgetTypeFixed: e.target.checked})} style={{ width: 16, height: 16, accentColor: '#ffffff' }} /> 
                    <span style={{ color: filters.budgetTypeFixed ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}>Fixed Price</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', fontSize: 'var(--text-sm)', cursor: 'pointer' }}>
                    <input type="checkbox" checked={filters.budgetTypeHourly} onChange={e => setFilters({...filters, budgetTypeHourly: e.target.checked})} style={{ width: 16, height: 16, accentColor: '#ffffff' }} /> 
                    <span style={{ color: filters.budgetTypeHourly ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}>Hourly Rate</span>
                  </label>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 500, color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-4)' }}>Experience Level</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', fontSize: 'var(--text-sm)', cursor: 'pointer' }}>
                    <input type="checkbox" checked={filters.expBeginner} onChange={e => setFilters({...filters, expBeginner: e.target.checked})} style={{ width: 16, height: 16, accentColor: '#ffffff' }} /> 
                    <span style={{ color: filters.expBeginner ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}>Beginner</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', fontSize: 'var(--text-sm)', cursor: 'pointer' }}>
                    <input type="checkbox" checked={filters.expIntermediate} onChange={e => setFilters({...filters, expIntermediate: e.target.checked})} style={{ width: 16, height: 16, accentColor: '#ffffff' }} /> 
                    <span style={{ color: filters.expIntermediate ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}>Intermediate</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', fontSize: 'var(--text-sm)', cursor: 'pointer' }}>
                    <input type="checkbox" checked={filters.expExpert} onChange={e => setFilters({...filters, expExpert: e.target.checked})} style={{ width: 16, height: 16, accentColor: '#ffffff' }} /> 
                    <span style={{ color: filters.expExpert ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}>Expert</span>
                  </label>
                </div>
              </div>
            </div>
          </aside>

          {/* Gig List */}
          <main style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {loading ? (
              <div style={{ padding: 'var(--space-8)', color: 'var(--color-text-tertiary)' }}>
                Loading...
              </div>
            ) : filteredGigs.length === 0 ? (
              <div style={{ padding: 'var(--space-8)', color: 'var(--color-text-tertiary)', border: '1px dashed var(--color-border-subtle)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
                No active gigs found matching your filters.
              </div>
            ) : (
              filteredGigs.map((gig) => (
                <Link key={gig.id} href={`/gigs/${gig.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                  <div className="card" style={{ padding: 'var(--space-6)', display: 'flex', gap: 'var(--space-6)', transition: 'background 0.2s', background: 'var(--color-bg-card)', borderRadius: 'var(--radius-md)' }} onMouseOver={e => e.currentTarget.style.background = 'var(--color-bg-card-hover)'} onMouseOut={e => e.currentTarget.style.background = 'var(--color-bg-card)'}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
                        <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 500 }}>{gig.title}</h2>
                        <span style={{ fontSize: 'var(--text-xs)', padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-secondary)' }}>{gig.experienceLevel}</span>
                      </div>
                      <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.6 }}>
                        {gig.description}
                      </p>
                      <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                        {safeParseJson(gig.skills, []).map((skill: string) => (
                          <span key={skill} style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>#{skill}</span>
                        ))}
                      </div>
                    </div>
                    
                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: '120px' }}>
                      <div>
                        <div style={{ fontSize: 'var(--text-lg)', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                          {gig.budget} {gig.currency}
                        </div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>
                          {gig.budgetType === 'FIXED' ? 'Fixed Price' : 'Hourly'}
                        </div>
                      </div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>
                        {new Date(gig.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </div>
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
