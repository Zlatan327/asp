'use client';

import { useWallet } from './WalletProvider';

export default function ConnectWalletButton() {
  const { address, isConnecting, connectWallet, disconnect } = useWallet();

  const truncateAddress = (addr: string) => {
    return `\${addr.slice(0, 6)}...\${addr.slice(-4)}`;
  };

  if (address) {
    return (
      <button 
        onClick={disconnect}
        className="btn btn-secondary" 
        style={{ fontSize: 'var(--text-xs)', padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-full)' }}
      >
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-success)', display: 'inline-block', marginRight: 'var(--space-2)' }}></span>
        {truncateAddress(address)}
      </button>
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
