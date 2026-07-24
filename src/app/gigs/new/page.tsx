'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewGigPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [formData, setFormData] = useState<any>({
    title: '',
    description: '',
    budget: '',
    budgetType: 'FIXED',
    experienceLevel: 'INTERMEDIATE',
    skills: '',
    estimatedDuration: '',
    milestones: [],
  });

  const handleAiAssist = async () => {
    const idea = [formData.title, formData.description, formData.skills].filter(Boolean).join('\n');
    setDrafting(true);
    try {
      const res = await fetch('/api/gigs/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea: idea || 'Build a Web3 product feature with clear milestones and escrow-ready deliverables.' }),
      });
      const draft = await res.json();
      if (!res.ok) throw new Error(draft.error || 'Failed to draft gig');

      setFormData({
        title: draft.title || formData.title,
        description: draft.description || formData.description,
        budget: String(draft.budget || formData.budget || ''),
        budgetType: draft.budgetType || formData.budgetType,
        experienceLevel: draft.experienceLevel || formData.experienceLevel,
        skills: Array.isArray(draft.skills) ? draft.skills.join(', ') : formData.skills,
        estimatedDuration: draft.estimatedDuration || formData.estimatedDuration,
        milestones: draft.milestones || [],
      });
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : 'AI Assist failed');
    } finally {
      setDrafting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const skillsArray = String(formData.skills).split(',').map((s: string) => s.trim()).filter((s: string) => s);
      
      const res = await fetch('/api/gigs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          skills: skillsArray,
          milestones: formData.milestones,
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
                onClick={handleAiAssist}
              >
                {drafting ? 'Drafting...' : '✨ Use AI Assist'}
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

          {formData.milestones?.length > 0 && (
            <div>
              <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontWeight: 600 }}>AI Milestones</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {formData.milestones.map((milestone: any, index: number) => (
                  <div key={`${milestone.title}-${index}`} style={{ padding: 'var(--space-3)', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.03)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-3)', marginBottom: 'var(--space-1)' }}>
                      <strong>{milestone.title}</strong>
                      <span style={{ color: 'var(--color-accent-primary)', fontWeight: 700 }}>{milestone.amount || 0} USDT</span>
                    </div>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>{milestone.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

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
