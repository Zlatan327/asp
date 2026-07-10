'use client';

import { useState, useEffect, useCallback } from 'react';
import { BrowserProvider, JsonRpcSigner } from 'ethers';
import { getChainConfig, getAddChainParams } from './config';

interface WalletState {
  address: string | null;
  chainId: number | null;
  isConnecting: boolean;
  error: string | null;
}

/**
 * React hook for managing OKX Wallet / MetaMask connections
 */
export function useWallet() {
  const [state, setState] = useState<WalletState>({
    address: null,
    chainId: null,
    isConnecting: false,
    error: null,
  });
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);

  // Check if wallet is installed (OKX Wallet injects window.okxwallet)
  const getProvider = useCallback(() => {
    if (typeof window === 'undefined') return null;
    const p = (window as any).okxwallet || (window as any).ethereum;
    return p;
  }, []);

  const connect = async () => {
    setState((s) => ({ ...s, isConnecting: true, error: null }));
    const p = getProvider();
    
    if (!p) {
      setState((s) => ({ 
        ...s, 
        isConnecting: false, 
        error: 'No wallet found. Please install OKX Wallet.' 
      }));
      return;
    }

    try {
      const browserProvider = new BrowserProvider(p);
      const accounts = await browserProvider.send('eth_requestAccounts', []);
      const network = await browserProvider.getNetwork();
      
      const sig = await browserProvider.getSigner();

      setProvider(browserProvider);
      setSigner(sig);
      
      setState({
        address: accounts[0],
        chainId: Number(network.chainId),
        isConnecting: false,
        error: null,
      });

      // Ensure we are on X Layer
      const targetConfig = getChainConfig();
      if (Number(network.chainId) !== targetConfig.chainId) {
        try {
          await browserProvider.send('wallet_switchEthereumChain', [
            { chainId: `0x${targetConfig.chainId.toString(16)}` },
          ]);
        } catch (switchError: any) {
          // Unrecognized chain, add it
          if (switchError.code === 4902) {
            await browserProvider.send(
              'wallet_addEthereumChain',
              [getAddChainParams(targetConfig)]
            );
          }
        }
      }

    } catch (err: any) {
      setState((s) => ({ 
        ...s, 
        isConnecting: false, 
        error: err.message || 'Failed to connect wallet' 
      }));
    }
  };

  const disconnect = () => {
    setState({
      address: null,
      chainId: null,
      isConnecting: false,
      error: null,
    });
    setProvider(null);
    setSigner(null);
  };

  // Listen for account/chain changes
  useEffect(() => {
    const p = getProvider();
    if (!p) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) disconnect();
      else setState((s) => ({ ...s, address: accounts[0] }));
    };

    const handleChainChanged = (chainIdHex: string) => {
      setState((s) => ({ ...s, chainId: parseInt(chainIdHex, 16) }));
    };

    p.on('accountsChanged', handleAccountsChanged);
    p.on('chainChanged', handleChainChanged);

    return () => {
      p.removeListener('accountsChanged', handleAccountsChanged);
      p.removeListener('chainChanged', handleChainChanged);
    };
  }, [getProvider]);

  const signMessage = async (message: string) => {
    if (!signer) throw new Error('No signer available');
    return await signer.signMessage(message);
  };

  return {
    ...state,
    provider,
    signer,
    connect,
    disconnect,
    signMessage,
    isInstalled: !!getProvider(),
  };
}
