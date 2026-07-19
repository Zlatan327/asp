'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { ethers } from 'ethers';

type InjectedWalletProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: 'accountsChanged' | 'chainChanged', listener: (...args: unknown[]) => void) => void;
  removeListener?: (event: 'accountsChanged' | 'chainChanged', listener: (...args: unknown[]) => void) => void;
};

type WalletWindow = Window & {
  okxwallet?: InjectedWalletProvider;
  ethereum?: InjectedWalletProvider;
};

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

  const getWindowProvider = useCallback((): InjectedWalletProvider | null => {
    if (typeof window === 'undefined') return null;
    const walletWindow = window as WalletWindow;

    // Prefer OKX Wallet if injected
    if (walletWindow.okxwallet) return walletWindow.okxwallet;
    if (walletWindow.ethereum) return walletWindow.ethereum;
    return null;
  }, []);

  const checkConnection = useCallback(async () => {
    try {
      if (typeof window !== 'undefined' && localStorage.getItem('userDisconnected') === 'true') {
        return;
      }
      
      const provider = getWindowProvider();
      if (!provider) return;

      const accounts = await provider.request({ method: 'eth_accounts' }) as string[];
      if (accounts.length > 0) {
        setAddress(accounts[0]);
        const currentChain = await provider.request({ method: 'eth_chainId' }) as string;
        setChainId(parseInt(currentChain, 16));
      }
    } catch (err) {
      console.error('Failed to check connection', err);
    }
  }, [getWindowProvider]);

  // Auto-connect if already authorized
  useEffect(() => {
    checkConnection();

    const provider = getWindowProvider();
    const handleAccountsChanged = (accounts: unknown) => {
      const nextAccounts = Array.isArray(accounts) ? accounts : [];
      setAddress(typeof nextAccounts[0] === 'string' ? nextAccounts[0] : null);
    };
    const handleChainChanged = (chainIdHex: unknown) => {
      if (typeof chainIdHex === 'string') {
        setChainId(parseInt(chainIdHex, 16));
      }
    };

    provider?.on?.('accountsChanged', handleAccountsChanged);
    provider?.on?.('chainChanged', handleChainChanged);

    // Catch OKX Wallet unhandled rejections globally so Next.js doesn't show the error overlay
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason && typeof event.reason === 'object' && 'code' in event.reason && event.reason.code === 4900) {
        event.preventDefault(); // Suppress the Next.js overlay
      }
    };
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      provider?.removeListener?.('accountsChanged', handleAccountsChanged);
      provider?.removeListener?.('chainChanged', handleChainChanged);
    };
  }, [checkConnection, getWindowProvider]);

  const connectWallet = async () => {
    setIsConnecting(true);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('userDisconnected');
    }
    try {
      const provider = getWindowProvider();
      if (!provider) {
        alert('Please install the OKX Wallet or MetaMask extension!');
        return;
      }

      try {
        // Force the wallet to show the account selection popup
        await provider.request({
          method: 'wallet_requestPermissions',
          params: [{ eth_accounts: {} }]
        });
      } catch (err: any) {
        // If user rejects the permission request, stop connecting
        if (err.code === 4001) return;
        // Some older wallets might not support this RPC method, ignore and proceed
      }

      const accounts = await provider.request({ method: 'eth_requestAccounts' }) as string[];
      setAddress(accounts[0]);

      const currentChain = await provider.request({ method: 'eth_chainId' }) as string;
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
    if (typeof window !== 'undefined') {
      localStorage.setItem('userDisconnected', 'true');
    }
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
