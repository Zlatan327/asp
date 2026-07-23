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
            onClick={() => signIn('discord', { callbackUrl: '/dashboard' })}
            className="btn btn-secondary w-full"
            style={{ justifyContent: 'center' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: 'var(--space-2)' }}><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
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
