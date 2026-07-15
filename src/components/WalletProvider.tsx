'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';

interface WalletContextType {
  address: string | null;
  chainId: number | null;
  isConnecting: boolean;
  connectWallet: () => Promise<void>;
  switchChain: () => Promise<void>;
  disconnect: () => void;
  signMessage: (message: string) => Promise<string>;
  isCorrectChain: boolean;
}

const WalletContext = createContext<WalletContextType>({} as WalletContextType);

const XLAYER_TESTNET_CHAIN_ID = 1952;
const XLAYER_TESTNET_HEX = '0x7a0';

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Auto-connect if already authorized
  useEffect(() => {
    checkConnection();

    // Listeners
    const provider = getWindowProvider();
    if (provider) {
      provider.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) setAddress(accounts[0]);
        else setAddress(null);
      });
      provider.on('chainChanged', (chainIdHex: string) => {
        setChainId(parseInt(chainIdHex, 16));
      });
    }

    // Catch OKX Wallet unhandled rejections globally so Next.js doesn't show the error overlay
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason && event.reason.code === 4900) {
        event.preventDefault(); // Suppress the Next.js overlay
      }
    };
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      if (provider && provider.removeListener) {
        provider.removeListener('accountsChanged', () => {});
        provider.removeListener('chainChanged', () => {});
      }
    };
  }, []);

  const getWindowProvider = () => {
    if (typeof window === 'undefined') return null;
    // Prefer OKX Wallet if injected
    if ((window as any).okxwallet) return (window as any).okxwallet;
    if ((window as any).ethereum) return (window as any).ethereum;
    return null;
  };

  const checkConnection = async () => {
    try {
      const provider = getWindowProvider();
      if (!provider) return;

      const accounts = await provider.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        setAddress(accounts[0]);
        const currentChain = await provider.request({ method: 'eth_chainId' });
        setChainId(parseInt(currentChain, 16));
      }
    } catch (err) {
      console.error('Failed to check connection', err);
    }
  };

  const connectWallet = async () => {
    setIsConnecting(true);
    try {
      const provider = getWindowProvider();
      if (!provider) {
        alert('Please install the OKX Wallet or MetaMask extension!');
        return;
      }

      const accounts = await provider.request({ method: 'eth_requestAccounts' });
      setAddress(accounts[0]);

      const currentChain = await provider.request({ method: 'eth_chainId' });
      const currentChainId = parseInt(currentChain, 16);
      setChainId(currentChainId);

      if (currentChainId !== XLAYER_TESTNET_CHAIN_ID) {
        await switchChain();
      }
    } catch (err: any) {
      console.error('Connection failed', err);
      if (err.code !== 4900) {
        alert(err.message || 'Failed to connect wallet');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const switchChain = async () => {
    const provider = getWindowProvider();
    if (!provider) return;

    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: XLAYER_TESTNET_HEX }]
      });
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to the wallet
      if (switchError.code === 4902) {
        try {
          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: XLAYER_TESTNET_HEX,
                chainName: 'X Layer Testnet',
                rpcUrls: ['https://testrpc.xlayer.tech/terigon'],
                nativeCurrency: {
                  name: 'OKB',
                  symbol: 'OKB',
                  decimals: 18
                },
                blockExplorerUrls: ['https://www.okx.com/explorer/xlayer-test']
              }
            ]
          });
        } catch (addError) {
          console.error('Failed to add network', addError);
        }
      } else {
        console.error('Failed to switch network', switchError);
      }
    }
  };

  const disconnect = () => {
    setAddress(null);
    setChainId(null);
  };

  const signMessage = async (message: string) => {
    const provider = getWindowProvider();
    if (!provider || !address) throw new Error('Wallet not connected');
    const ethersProvider = new ethers.BrowserProvider(provider);
    const signer = await ethersProvider.getSigner();
    return await signer.signMessage(message);
  };

  const isCorrectChain = chainId === XLAYER_TESTNET_CHAIN_ID;

  return (
    <WalletContext.Provider value={{ address, chainId, isConnecting, connectWallet, switchChain, disconnect, signMessage, isCorrectChain }}>
      {children}
      {/* Network Warning Banner */}
      {address && !isCorrectChain && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--color-error)', color: 'white', padding: 'var(--space-3)', textAlign: 'center', zIndex: 9999 }}>
          <p style={{ margin: 0, fontWeight: 600 }}>
            Wrong Network Detected! Please switch to X Layer Testnet to use ASP.
            <button onClick={switchChain} style={{ marginLeft: 'var(--space-4)', padding: 'var(--space-1) var(--space-3)', background: 'white', color: 'var(--color-error)', borderRadius: 'var(--radius-sm)', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>
              Switch Network
            </button>
          </p>
        </div>
      )}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}
