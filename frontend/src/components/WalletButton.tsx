'use client';

import React, { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { Wallet, LogOut, Loader2, Coins, Droplets } from 'lucide-react';
import { formatAddress, fundTestnetWallet } from '../lib/freighter';
import { toast } from 'sonner';

export const WalletButton: React.FC = () => {
  const { address, balance, isConnected, isConnecting, connect, disconnect, refreshBalance } =
    useWallet();
  const [isFunding, setIsFunding] = useState(false);

  const handleFundFaucet = async () => {
    if (!address) return;
    setIsFunding(true);
    const toastId = toast.loading('Requesting 10,000 Testnet XLM from Friendbot Faucet...');

    try {
      await fundTestnetWallet(address);
      toast.success('Testnet XLM Funded Successfully!', {
        id: toastId,
        description: '10,000 Testnet XLM has been credited to your wallet address.',
      });
      await refreshBalance();
    } catch (error: any) {
      toast.error('Faucet Request Failed', {
        id: toastId,
        description: error.message || 'Could not reach Friendbot Faucet.',
      });
    } finally {
      setIsFunding(false);
    }
  };

  if (isConnecting) {
    return (
      <button
        disabled
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-slate-400 border border-slate-700 text-sm font-medium animate-pulse"
      >
        <Loader2 className="w-4 h-4 animate-spin text-primary" />
        Connecting...
      </button>
    );
  }

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-700/60 shadow-lg">
        {/* Faucet Friendbot Button */}
        <button
          onClick={handleFundFaucet}
          disabled={isFunding}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-primary border border-primary/30 text-xs font-semibold transition-all hover:scale-105"
          title="Bơm 10,000 XLM thử nghiệm từ Friendbot Faucet"
        >
          {isFunding ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Droplets className="w-3.5 h-3.5 text-primary" />
          )}
          <span>Get Test XLM</span>
        </button>

        {/* Balance Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/90 text-slate-200 text-xs font-semibold">
          <Coins className="w-3.5 h-3.5 text-primary" />
          <span>{balance} XLM</span>
        </div>

        {/* Address Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 text-slate-100 text-xs font-mono font-medium">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>{formatAddress(address)}</span>
        </div>

        {/* Disconnect Button */}
        <button
          onClick={disconnect}
          className="p-1.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
          title="Disconnect Wallet"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={connect}
      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-secondary text-slate-950 font-semibold text-sm shadow-glow hover:opacity-95 transition-all transform hover:-translate-y-0.5"
    >
      <Wallet className="w-4 h-4" />
      Connect Freighter
    </button>
  );
};
