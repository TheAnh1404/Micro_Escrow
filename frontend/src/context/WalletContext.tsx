'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { connectUserWalletBackend } from '../lib/api';
import {
  checkFreighterInstalled,
  connectFreighterWallet,
  fetchXlmBalance,
} from '../lib/freighter';

interface WalletContextType {
  address: string | null;
  balance: string;
  isConnected: boolean;
  isConnecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  refreshBalance: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType>({
  address: null,
  balance: '0.00',
  isConnected: false,
  isConnecting: false,
  connect: async () => {},
  disconnect: () => {},
  refreshBalance: async () => {},
});

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>('0.00');
  const [isConnecting, setIsConnecting] = useState<boolean>(false);

  // Restore saved wallet state on load
  useEffect(() => {
    const savedAddr = localStorage.getItem('stellarpact_wallet_address');
    if (savedAddr) {
      setAddress(savedAddr);
      fetchXlmBalance(savedAddr).then(setBalance);
    }
  }, []);

  const connect = async () => {
    setIsConnecting(true);
    const toastId = toast.loading('Connecting Freighter Wallet...');

    try {
      const isInstalled = await checkFreighterInstalled();
      if (!isInstalled) {
        toast.error('Freighter Extension Not Installed', {
          id: toastId,
          description: 'Please install Freighter wallet extension from freighter.app to continue.',
        });
        setIsConnecting(false);
        return;
      }

      const walletAddress = await connectFreighterWallet();
      setAddress(walletAddress);
      localStorage.setItem('stellarpact_wallet_address', walletAddress);

      // Sync wallet address to Backend database
      await connectUserWalletBackend(walletAddress);

      // Fetch balance
      const bal = await fetchXlmBalance(walletAddress);
      setBalance(bal);

      toast.success('Wallet Connected Successfully', {
        id: toastId,
        description: `Connected: ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`,
      });
    } catch (error: any) {
      toast.error('Connection Failed', {
        id: toastId,
        description: error.message || 'User rejected wallet connection.',
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    setAddress(null);
    setBalance('0.00');
    localStorage.removeItem('stellarpact_wallet_address');
    toast.info('Disconnected from Wallet');
  };

  const refreshBalance = async () => {
    if (address) {
      const bal = await fetchXlmBalance(address);
      setBalance(bal);
    }
  };

  return (
    <WalletContext.Provider
      value={{
        address,
        balance,
        isConnected: !!address,
        isConnecting,
        connect,
        disconnect,
        refreshBalance,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);
