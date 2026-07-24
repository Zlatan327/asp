'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';

export default function ProfileSettingsClient({ socialAccounts, walletAddress, currentScore }: any) {
  const [isEvaluating, setIsEvaluating] = useState(false);
  
  const platforms = ['github', 'twitter'];
  const connectedPlatforms = socialAccounts.map((s: any) => s.platform);

  const handleReevaluate = async () => {
    setIsEvaluating(true);
    try {
      const res = await fetch('/api/profile/reevaluate', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to reevaluate profile');
      alert('AI Reevaluation complete! Your score has been updated.');
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert('Failed to trigger AI reevaluation.');
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        
        {/* Wallet connection status */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-3)', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: walletAddress ? 'var(--color-success)' : 'var(--color-error)' }} />
            <span style={{ fontWeight: 600 }}>Web3 Wallet</span>
          </div>
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
            {walletAddress ? `${walletAddress.slice(0,6)}...${walletAddress.slice(-4)}` : 'Not Connected'}
          </span>
        </div>

        {/* Social connections */}
        {platforms.map(platform => {
          const isConnected = connectedPlatforms.includes(platform);
          return (
            <div key={platform} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-3)', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: isConnected ? 'var(--color-success)' : 'var(--color-text-tertiary)' }} />
                <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{platform === 'twitter' ? 'X (Twitter)' : platform}</span>
              </div>
              
              {isConnected ? (
                <span className="badge badge-success">Connected</span>
              ) : (
                <button 
                  onClick={() => signIn(platform, { callbackUrl: '/profile' })}
                  className="btn btn-secondary" 
                  style={{ padding: 'var(--space-1) var(--space-3)', fontSize: 'var(--text-xs)' }}
                >
                  Connect
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="divider" />

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <div>
            <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 600 }}>AI Credibility Score</h3>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Current Score: <strong style={{ color: 'var(--color-accent-primary)' }}>{currentScore != null ? currentScore.toFixed(0) : 'N/A'}</strong></p>
          </div>
          <button 
            onClick={handleReevaluate} 
            disabled={isEvaluating}
            className="btn btn-primary animate-pulse-glow"
          >
            {isEvaluating ? 'Scanning Footprint...' : 'Trigger AI Reevaluation ✨'}
          </button>
        </div>
      </div>
    </div>
  );
}
