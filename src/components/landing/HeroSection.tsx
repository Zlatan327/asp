'use client';

import Link from 'next/link';

export default function HeroSection() {
  return (
    <section className="section section-lg relative overflow-hidden" style={{ minHeight: '90vh', display: 'flex', alignItems: 'center' }}>
      {/* Background Orbs */}
      <div className="bg-orb bg-orb-violet" style={{ top: '10%', left: '20%', width: 500, height: 500 }}></div>
      <div className="bg-orb bg-orb-blue" style={{ bottom: '10%', right: '10%', width: 600, height: 600 }}></div>

      <div className="container relative z-10 text-center">
        <div className="animate-fade-in-down" style={{ marginBottom: 'var(--space-6)', display: 'flex', justifyContent: 'center' }}>
          <svg width="100" height="100" viewBox="0 0 100 100" fill="currentColor" xmlns="http://www.w3.org/2000/svg" style={{ color: 'var(--color-text-primary)' }}>
            <path d="M 25 25 L 40 25 C 40 10, 60 10, 60 25 L 75 25 L 75 40 C 90 40, 90 60, 75 60 L 75 75 L 60 75 C 60 60, 40 60, 40 75 L 25 75 L 25 60 C 10 60, 10 40, 25 40 Z" />
            <path d="M 35 50 Q 50 35 65 50 Q 50 65 35 50 Z" fill="var(--color-bg-primary)" />
            <circle cx="50" cy="50" r="5" fill="currentColor" />
          </svg>
        </div>

        <h1 className="animate-fade-in-up delay-1" style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)', fontWeight: 900, lineHeight: 1.1, marginBottom: 'var(--space-6)', letterSpacing: '-0.03em' }}>
          The Future of Work is <br />
          <span className="text-gradient">Agent-Driven & Web3-Native</span>
        </h1>

        <p className="animate-fade-in-up delay-2" style={{ fontSize: 'var(--text-xl)', color: 'var(--color-text-secondary)', maxWidth: 700, margin: '0 auto var(--space-8)', lineHeight: 1.6 }}>
          KLOP connects elite indie tech talent with ambitious clients using intelligent AI orchestration, smart contract escrow, and immutable on-chain reputation.
        </p>

        <div className="animate-fade-in-up delay-3" style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/login" className="btn btn-primary btn-lg">
            Get Started
          </Link>
          <Link href="/okxai" className="btn btn-secondary btn-lg">
            OKX.AI Submission
          </Link>
        </div>

        {/* Floating UI Elements Demo */}
        <div className="animate-fade-in delay-5" style={{ marginTop: 'var(--space-16)', display: 'flex', justifyContent: 'center', gap: 'var(--space-8)', flexWrap: 'wrap' }}>
          
          {/* Stunning Smart Escrow Card */}
          <div className="glass-card animate-bounce" style={{ padding: 'var(--space-5)', width: 280, textAlign: 'left', border: '1px solid var(--color-accent-primary)', boxShadow: '0 0 20px rgba(255, 42, 42, 0.15)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '2px', background: 'var(--color-accent-gradient)' }}></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
              <div style={{ background: 'rgba(255, 42, 42, 0.1)', padding: '8px', borderRadius: 'var(--radius-md)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>
              <div>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 800, color: 'var(--color-text-primary)', display: 'block' }}>Trustless Escrow</span>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-success)', fontWeight: 600 }}>Secured on X Layer</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)' }}>
              <span style={{ fontSize: 'var(--text-2xl)', fontWeight: 900, color: 'var(--color-text-primary)' }}>Zero</span>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Counterparty Risk</span>
            </div>
          </div>

          {/* Stunning Reputation Card */}
          <div className="glass-card animate-bounce" style={{ padding: 'var(--space-5)', width: 280, textAlign: 'left', animationDelay: '0.5s', border: '1px solid var(--color-accent-secondary)', boxShadow: '0 0 20px rgba(255, 107, 107, 0.15)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '2px', background: 'var(--color-accent-gradient)' }}></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
              <div style={{ background: 'rgba(255, 107, 107, 0.1)', padding: '8px', borderRadius: 'var(--radius-md)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
              </div>
              <div>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 800, color: 'var(--color-text-primary)', display: 'block' }}>Immutable SBT</span>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-accent-secondary)', fontWeight: 600 }}>On-Chain Identity</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)' }}>
              <span style={{ fontSize: 'var(--text-2xl)', fontWeight: 900, color: 'var(--color-text-primary)' }}>100%</span>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Verifiable Identity</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
