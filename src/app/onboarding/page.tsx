'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';

export default function OnboardingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [role, setRole] = useState<'FREELANCER' | 'CLIENT' | null>(null);
  const [loading, setLoading] = useState(false);
  const [cvFile, setCvFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('role', role || 'FREELANCER');
      if (cvFile) formData.append('cv', cvFile);

      const res = await fetch('/api/onboarding', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Onboarding failed');

      router.push('/dashboard');
    } catch (err) {
      console.error(err);
      alert('Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-6)' }}>
      <div className="glass-card" style={{ maxWidth: 600, width: '100%', padding: 'var(--space-8)' }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
          <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, marginBottom: 'var(--space-2)' }}>
            Complete Your Profile
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
            Let the Scout Agent build your verified credibility footprint.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <div>
            <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontWeight: 600 }}>I want to...</label>
            <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
              <div
                onClick={() => setRole('FREELANCER')}
                className={`card card-interactive ${role === 'FREELANCER' ? 'bg-primary' : ''}`}
                style={{ flex: 1, textAlign: 'center', cursor: 'pointer', border: role === 'FREELANCER' ? '2px solid var(--color-accent-primary)' : '' }}
              >
                <div style={{ fontSize: '2rem', marginBottom: 'var(--space-2)' }}>💻</div>
                <div style={{ fontWeight: 600 }}>Work as Freelancer</div>
              </div>
              <div
                onClick={() => setRole('CLIENT')}
                className={`card card-interactive ${role === 'CLIENT' ? 'bg-primary' : ''}`}
                style={{ flex: 1, textAlign: 'center', cursor: 'pointer', border: role === 'CLIENT' ? '2px solid var(--color-accent-primary)' : '' }}
              >
                <div style={{ fontSize: '2rem', marginBottom: 'var(--space-2)' }}>🏢</div>
                <div style={{ fontWeight: 600 }}>Hire Talent</div>
              </div>
            </div>
          </div>

          {role === 'FREELANCER' && (
            <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="alert alert-info">
                <strong>🤖 Agent Assist:</strong> Upload your CV or link your GitHub/X. The Scout Agent will automatically extract your skills, parse your experience, and generate your profile.
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontWeight: 600 }}>Upload CV (PDF)</label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setCvFile(e.target.files?.[0] || null)}
                  className="input"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontWeight: 600 }}>Social Connections</label>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => signIn('github', { callbackUrl: '/onboarding' })}>GitHub</button>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => signIn('twitter', { callbackUrl: '/onboarding' })}>X</button>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => signIn('discord', { callbackUrl: '/onboarding' })}>Discord</button>
                </div>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginTop: 'var(--space-2)' }}>
                  Connections are verified via OAuth.
                </p>
              </div>
            </div>
          )}

          {role === 'CLIENT' && (
            <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
               <div>
                <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontWeight: 600 }}>Company Name</label>
                <input
                  type="text"
                  placeholder="e.g. Acme Corp"
                  className="input"
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={!role || loading}
            className="btn btn-primary btn-lg w-full"
            style={{ marginTop: 'var(--space-4)' }}
          >
            {loading ? 'Processing via Agent...' : 'Complete Onboarding'}
          </button>
        </form>
      </div>
    </div>
  );
}
