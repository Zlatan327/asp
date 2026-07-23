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
          <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, marginBottom: 'var(--space-2)' }}>
            Welcome to KLOP
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
            Your OKX.AI freelance agentic marketplace.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <button
            onClick={() => signIn('github', { callbackUrl: '/dashboard' })}
            className="btn btn-secondary w-full"
            style={{ justifyContent: 'center' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: 'var(--space-2)' }}><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
            Continue with GitHub
          </button>
          
          <button
            onClick={() => signIn('twitter', { callbackUrl: '/dashboard' })}
            className="btn btn-secondary w-full"
            style={{ justifyContent: 'center' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: 'var(--space-2)' }}><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/></svg>
            Continue with X (Twitter)
          </button>

          <button
            disabled
            className="btn btn-secondary w-full"
            style={{ justifyContent: 'center', opacity: 0.5, cursor: 'not-allowed' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: 'var(--space-2)' }}><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            Continue with LinkedIn (Coming Soon)
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
