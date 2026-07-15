'use client';

import { useWallet } from './WalletProvider';
import { signOut } from 'next-auth/react';

export default function ConnectWalletButton() {
  const { address, isConnecting, connectWallet, disconnect } = useWallet();

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (address) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        <div 
          style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-xs)', padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-full)', background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)' }}
        >
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-success)', display: 'inline-block' }}></span>
          <span style={{ fontFamily: 'monospace' }}>{truncateAddress(address)}</span>
        </div>
        <button 
          onClick={() => {
            disconnect();
            signOut({ callbackUrl: '/' });
          }}
          className="btn btn-secondary" 
          style={{ fontSize: 'var(--text-xs)', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-full)' }}
          title="Disconnect Wallet"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button 
      onClick={connectWallet}
      disabled={isConnecting}
      className="btn btn-primary"
      style={{ fontSize: 'var(--text-xs)', padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-full)' }}
    >
      {isConnecting ? 'Connecting...' : 'Connect Wallet'}
    </button>
  );
}
