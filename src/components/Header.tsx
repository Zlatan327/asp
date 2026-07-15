import Link from 'next/link';
import ConnectWalletButton from './ConnectWalletButton';
import { auth } from '@/auth';

export default async function Header() {
  const session = await auth();

  return (
    <header style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between', 
      padding: 'var(--space-4) var(--space-6)',
      position: 'sticky',
      top: 0,
      zIndex: 'var(--z-sticky)'
    }}>
      <Link href="/" style={{ fontSize: 'var(--text-xl)', fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center' }}>
        <svg width="24" height="24" viewBox="0 0 100 100" fill="currentColor" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '8px' }}>
          <path d="M 25 25 L 40 25 C 40 10, 60 10, 60 25 L 75 25 L 75 40 C 90 40, 90 60, 75 60 L 75 75 L 60 75 C 60 60, 40 60, 40 75 L 25 75 L 25 60 C 10 60, 10 40, 25 40 Z" />
          <path d="M 35 50 Q 50 35 65 50 Q 50 65 35 50 Z" fill="var(--color-bg-primary)" />
          <circle cx="50" cy="50" r="5" fill="currentColor" />
        </svg>
        KLOP<span style={{ color: 'var(--color-accent-primary)' }}>.</span>
      </Link>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)' }}>
        {session ? (
          <>
            <Link href="/marketplace" style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
              Marketplace
            </Link>
            <Link href="/bounties" style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
              Bounty Hub
            </Link>
            <Link href="/dashboard" style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
              Dashboard
            </Link>
            <ConnectWalletButton />
          </>
        ) : (
          <Link href="/#how-it-works" className="btn btn-secondary" style={{ fontSize: 'var(--text-xs)', padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-full)' }}>
            Quick Guide
          </Link>
        )}
      </div>
    </header>
  );
}
