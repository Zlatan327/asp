import Link from 'next/link';
import { auth } from '@/auth';
import Navigation from './Navigation';

export default async function Header() {
  const session = await auth();

  return (
    <header className="site-header" style={{
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between', 
      padding: 'var(--space-4) var(--space-6)',
      position: 'sticky',
      top: 0,
      zIndex: 'var(--z-sticky)'
    }}>
      <Link href="/" style={{ fontSize: 'var(--text-xl)', fontWeight: 900, letterSpacing: '0', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        <svg width="24" height="24" viewBox="0 0 100 100" fill="currentColor" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '8px' }}>
          <path d="M 25 25 L 40 25 C 40 10, 60 10, 60 25 L 75 25 L 75 40 C 90 40, 90 60, 75 60 L 75 75 L 60 75 C 60 60, 40 60, 40 75 L 25 75 L 25 60 C 10 60, 10 40, 25 40 Z" />
          <path d="M 35 50 Q 50 35 65 50 Q 50 65 35 50 Z" fill="var(--color-bg-primary)" />
          <circle cx="50" cy="50" r="5" fill="currentColor" />
        </svg>
        KLOP<span style={{ color: 'var(--color-accent-primary)' }}>.</span>
      </Link>
      
      <Navigation session={session} />
    </header>
  );
}
