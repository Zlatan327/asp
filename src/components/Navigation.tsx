"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Sparkles, Menu, X } from 'lucide-react';
import ConnectWalletButton from './ConnectWalletButton';

export default function Navigation({ session }: { session: any }) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  return (
    <>
      {/* Desktop Navigation */}
      <div className="site-nav site-nav-desktop" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)' }}>
        {session ? (
          <>
            <Link href="/okxai" style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
              OKX.AI
            </Link>
            <Link href="/marketplace" style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
              Marketplace
            </Link>
            <Link href="/bounties" style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
              Bounty Hub
            </Link>
            <Link href="/agent-dashboard" style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-accent-primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Sparkles size={14} /> Agents
            </Link>
            <Link href="/dashboard" style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
              Dashboard
            </Link>
            <ConnectWalletButton />
          </>
        ) : (
          <>
            <Link href="/okxai" style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
              OKX.AI
            </Link>
            <Link href="/#how-it-works" className="btn btn-secondary" style={{ fontSize: 'var(--text-xs)', padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-full)' }}>
              Quick Guide
            </Link>
          </>
        )}
      </div>

      {/* Mobile Menu Toggle */}
      <button className="mobile-nav-toggle" onClick={toggleMenu} aria-label="Toggle navigation menu">
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="site-nav-mobile">
          {session ? (
            <>
              <Link href="/okxai" onClick={closeMenu} style={{ padding: 'var(--space-2) 0', fontSize: 'var(--text-base)', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
                OKX.AI
              </Link>
              <Link href="/marketplace" onClick={closeMenu} style={{ padding: 'var(--space-2) 0', fontSize: 'var(--text-base)', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
                Marketplace
              </Link>
              <Link href="/bounties" onClick={closeMenu} style={{ padding: 'var(--space-2) 0', fontSize: 'var(--text-base)', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
                Bounty Hub
              </Link>
              <Link href="/agent-dashboard" onClick={closeMenu} style={{ padding: 'var(--space-2) 0', fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--color-accent-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sparkles size={16} /> Agents
              </Link>
              <Link href="/dashboard" onClick={closeMenu} style={{ padding: 'var(--space-2) 0', fontSize: 'var(--text-base)', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
                Dashboard
              </Link>
              <div style={{ paddingTop: 'var(--space-2)' }}>
                <ConnectWalletButton />
              </div>
            </>
          ) : (
            <>
              <Link href="/okxai" onClick={closeMenu} style={{ padding: 'var(--space-2) 0', fontSize: 'var(--text-base)', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
                OKX.AI
              </Link>
              <Link href="/#how-it-works" onClick={closeMenu} className="btn btn-secondary" style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', textAlign: 'center', marginTop: 'var(--space-2)' }}>
                Quick Guide
              </Link>
            </>
          )}
        </div>
      )}
    </>
  );
}
