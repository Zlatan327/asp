'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewGigPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    budget: '',
    budgetType: 'FIXED',
    experienceLevel: 'INTERMEDIATE',
    skills: '',
    estimatedDuration: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const skillsArray = formData.skills.split(',').map(s => s.trim()).filter(s => s);
      
      const res = await fetch('/api/gigs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          skills: skillsArray,
        }),
      });

      if (!res.ok) throw new Error('Failed to create gig');
      
      const gig = await res.json();
      router.push(`/gigs/${gig.id}`);
    } catch (err) {
      console.error(err);
      alert('Error creating gig');
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', padding: 'var(--space-8)' }}>
      <div className="glass-card" style={{ maxWidth: 800, margin: '0 auto', padding: 'var(--space-8)' }}>
        
        <div style={{ marginBottom: 'var(--space-8)' }}>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, marginBottom: 'var(--space-2)' }}>Post a New Gig</h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>Describe your requirements and let AI match you with the best talent.</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <div>
            <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontWeight: 600 }}>Project Title</label>
            <input 
              type="text" 
              required
              placeholder="e.g. Full-stack Web3 Developer for NFT Marketplace"
              className="input w-full"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontWeight: 600 }}>
              Description
              <span 
                className="badge badge-info" 
                style={{ marginLeft: 8, cursor: 'pointer' }}
                onClick={() => {
                  setFormData({...formData, description: "We are looking for an experienced Web3 developer to build a smart contract for our new project. The ideal candidate will have 3+ years of Solidity experience and a strong understanding of ERC-20 standards. Deliverables include the contract, unit tests, and deployment scripts."});
                }}
              >
                ✨ Use AI Assist
              </span>
            </label>
            <textarea 
              required
              rows={6}
              placeholder="Describe the scope of work, deliverables, and any specific requirements..."
              className="input w-full"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontWeight: 600 }}>Budget Type</label>
              <select 
                className="input w-full"
                value={formData.budgetType}
                onChange={(e) => setFormData({...formData, budgetType: e.target.value})}
              >
                <option value="FIXED">Fixed Price</option>
                <option value="HOURLY">Hourly Rate</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontWeight: 600 }}>Budget (USDT)</label>
              <input 
                type="number" 
                required
                min={1}
                placeholder="e.g. 1500"
                className="input w-full"
                value={formData.budget}
                onChange={(e) => setFormData({...formData, budget: e.target.value})}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontWeight: 600 }}>Experience Level</label>
              <select 
                className="input w-full"
                value={formData.experienceLevel}
                onChange={(e) => setFormData({...formData, experienceLevel: e.target.value})}
              >
                <option value="ANY">Any</option>
                <option value="BEGINNER">Beginner</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="EXPERT">Expert</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontWeight: 600 }}>Required Skills</label>
              <input 
                type="text" 
                placeholder="e.g. React, Solidity, Node.js"
                className="input w-full"
                value={formData.skills}
                onChange={(e) => setFormData({...formData, skills: e.target.value})}
              />
            </div>
          </div>

          <div style={{ marginTop: 'var(--space-4)', display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-4)' }}>
            <button type="button" className="btn btn-secondary" onClick={() => router.back()}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Posting...' : 'Post Gig'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
