'use client';

import { signIn } from 'next-auth/react';
import { useWallet } from '@/components/WalletProvider';
import { SiweMessage } from 'siwe';

import { useState } from 'react';
import { ethers } from 'ethers';

export default function LoginPage() {
  const { connectWallet, address, isConnecting, chainId, signMessage } = useWallet();
  const [isSigningIn, setIsSigningIn] = useState(false);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-6)', position: 'relative' }}>
      <div className="bg-orb bg-orb-violet" style={{ top: '10%', left: '20%' }} />
      <div className="bg-orb bg-orb-blue" style={{ bottom: '10%', right: '20%', animationDelay: '-5s' }} />

      <div className="glass-card" style={{ maxWidth: 440, width: '100%', padding: 'var(--space-8)' }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-6)' }}>
            <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center' }}>
              <svg width="40" height="40" viewBox="0 0 100 100" fill="currentColor" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '12px' }}>
                <path d="M 25 25 L 40 25 C 40 10, 60 10, 60 25 L 75 25 L 75 40 C 90 40, 90 60, 75 60 L 75 75 L 60 75 C 60 60, 40 60, 40 75 L 25 75 L 25 60 C 10 60, 10 40, 25 40 Z" />
                <path d="M 35 50 Q 50 35 65 50 Q 50 65 35 50 Z" fill="var(--color-bg-elevated)" />
                <circle cx="50" cy="50" r="5" fill="currentColor" />
              </svg>
              KLOP<span style={{ color: 'var(--color-accent-primary)' }}>.</span>
            </div>
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
                  console.group('SIWE Auth Flow');
                  setIsSigningIn(true);
                  console.log('Fetching nonce...');
                  const nonceRes = await fetch('/api/auth/nonce');
                  const { nonce } = await nonceRes.json();
                  console.log('Received nonce:', nonce);
                  
                  const message = new SiweMessage({
                    domain: window.location.host,
                    address: ethers.getAddress(address),
                    statement: 'Sign in to KLOP platform with your OKX Wallet.',
                    uri: window.location.origin,
                    version: '1',
                    chainId: chainId || 196,
                    nonce,
                  });
                  
                  console.log('Generated SIWE Message:', message);
                  const preparedMessage = message.prepareMessage();
                  console.log('Requesting signature...');
                  const signature = await signMessage(preparedMessage);
                  console.log('Signature received:', signature);
                  
                  console.log('Calling NextAuth signIn...');
                  const res = await signIn('siwe', {
                    message: JSON.stringify(message),
                    signature,
                    redirect: false,
                  });
                  console.log('NextAuth response:', res);
                  
                  if (res?.ok) {
                    console.log('Auth successful, redirecting...');
                    window.location.href = '/onboarding';
                  } else {
                    console.error('SignIn Error:', res?.error);
                  }
                  console.groupEnd();
                } catch (error) {
                  console.groupEnd();
                  console.error('SIWE Error:', error);
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
