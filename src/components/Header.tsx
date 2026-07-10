import Link from 'next/link';
import ConnectWalletButton from './ConnectWalletButton';

export default function Header() {
  return (
    <header style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between', 
      padding: 'var(--space-4) var(--space-6)',
      borderBottom: '1px solid var(--color-border-subtle)',
      background: 'rgba(10, 10, 15, 0.8)',
      backdropFilter: 'blur(12px)',
      position: 'sticky',
      top: 0,
      zIndex: 'var(--z-sticky)'
    }}>
      <Link href="/" style={{ fontSize: 'var(--text-xl)', fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--color-text-primary)' }}>
        ASP<span style={{ color: 'var(--color-accent-primary)' }}>.</span>
      </Link>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)' }}>
        <Link href="/marketplace" style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
          Marketplace
        </Link>
        <Link href="/dashboard" style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
          Dashboard
        </Link>
        <ConnectWalletButton />
      </div>
    </header>
  );
}
