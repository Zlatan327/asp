'use client';

import { signIn } from 'next-auth/react';
import { useWallet } from '@/components/WalletProvider';
import { SiweMessage } from 'siwe';

import { useState } from 'react';

export default function LoginPage() {
  const { connectWallet, address, isConnecting, chainId, signMessage } = useWallet();
  const [isSigningIn, setIsSigningIn] = useState(false);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-6)', position: 'relative' }}>
      <div className="bg-orb bg-orb-violet" style={{ top: '10%', left: '20%' }} />
      <div className="bg-orb bg-orb-blue" style={{ bottom: '10%', right: '20%', animationDelay: '-5s' }} />

      <div className="glass-card" style={{ maxWidth: 440, width: '100%', padding: 'var(--space-8)' }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-accent-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: 'var(--text-lg)',
              color: 'var(--color-text-inverse)',
              margin: '0 auto var(--space-4)',
            }}
          >
            ASP
          </div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, marginBottom: 'var(--space-2)' }}>
            Welcome to FreelanceAI
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
            Connect to start earning or hiring on OKX.AI
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <button
            onClick={() => signIn('github', { callbackUrl: '/onboarding' })}
            className="btn btn-secondary w-full"
            style={{ justifyContent: 'center' }}
          >
            <span style={{ marginRight: 'var(--space-2)' }}>🐙</span>
            Continue with GitHub
          </button>
          
          <button
            onClick={() => signIn('twitter', { callbackUrl: '/onboarding' })}
            className="btn btn-secondary w-full"
            style={{ justifyContent: 'center' }}
          >
            <span style={{ marginRight: 'var(--space-2)' }}>𝕏</span>
            Continue with X (Twitter)
          </button>

          <button
            onClick={() => signIn('discord', { callbackUrl: '/onboarding' })}
            className="btn btn-secondary w-full"
            style={{ justifyContent: 'center' }}
          >
            <span style={{ marginRight: 'var(--space-2)' }}>💬</span>
            Continue with Discord
          </button>

          <div className="divider" style={{ margin: 'var(--space-2) 0', color: 'var(--color-text-tertiary)', fontSize: 'var(--text-xs)' }}>
            OR CONNECT WALLET
          </div>

          <button
            onClick={async () => {
              if (!address) {
                await connectWallet();
              } else {
                try {
                  setIsSigningIn(true);
                  const nonceRes = await fetch('/api/auth/nonce');
                  const { nonce } = await nonceRes.json();
                  
                  const message = new SiweMessage({
                    domain: window.location.host,
                    address,
                    statement: 'Sign in to ASP platform with your OKX Wallet.',
                    uri: window.location.origin,
                    version: '1',
                    chainId: chainId || 196,
                    nonce,
                  });
                  
                  const preparedMessage = message.prepareMessage();
                  const signature = await signMessage(preparedMessage);
                  
                  await signIn('siwe', {
                    message: JSON.stringify(message),
                    signature,
                    callbackUrl: '/onboarding',
                  });
                } catch (error) {
                  console.error('SIWE Error:', error);
                  alert('Failed to sign in with wallet.');
                } finally {
                  setIsSigningIn(false);
                }
              }
            }}
            disabled={isConnecting || isSigningIn}
            className="btn btn-primary w-full"
            style={{ justifyContent: 'center' }}
          >
            <span style={{ marginRight: 'var(--space-2)' }}>👛</span>
            {isConnecting ? 'Connecting...' : isSigningIn ? 'Signing in...' : address ? 'Sign Message to Login' : 'Connect OKX Wallet'}
          </button>

          {address && (
            <p style={{ textAlign: 'center', fontSize: 'var(--text-xs)', color: 'var(--color-success)', marginTop: 'var(--space-2)' }}>
              Connected: {address.slice(0, 6)}...{address.slice(-4)}
            </p>
          )}
        </div>

        <p style={{ textAlign: 'center', fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginTop: 'var(--space-8)' }}>
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
