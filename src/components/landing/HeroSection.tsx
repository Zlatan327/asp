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
        </div>

        {/* Floating UI Elements Demo */}
        <div className="animate-fade-in delay-5" style={{ marginTop: 'var(--space-16)', display: 'flex', justifyContent: 'center', gap: 'var(--space-6)' }}>
          <div className="glass-card animate-bounce" style={{ padding: 'var(--space-4)', width: 250, textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
              <div className="avatar avatar-sm" style={{ background: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>✓</div>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>Smart Escrow</span>
            </div>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>1000 USDT locked securely on X Layer.</p>
          </div>

          <div className="glass-card animate-bounce" style={{ padding: 'var(--space-4)', width: 250, textAlign: 'left', animationDelay: '0.5s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
              <div className="avatar avatar-sm" style={{ background: 'var(--color-accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>★</div>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>Reputation SBT</span>
            </div>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Score updated to 98/100.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
