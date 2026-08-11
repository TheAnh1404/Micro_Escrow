'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { WalletButton } from './WalletButton';
import { ShieldCheck, LayoutDashboard, Home, ExternalLink } from 'lucide-react';
import { STELLAR_EXPERT_URL, STELLAR_PACT_CONTRACT_ID } from '../lib/constants';

export const Navbar: React.FC = () => {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full glass-panel border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-secondary p-0.5 shadow-glow group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-primary" />
            </div>
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              StellarPact
            </span>
            <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Soroban Testnet
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link
            href="/"
            className={`inline-flex items-center gap-2 transition-colors ${
              pathname === '/' ? 'text-primary font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Home className="w-4 h-4" />
            Home
          </Link>

          <Link
            href="/app"
            className={`inline-flex items-center gap-2 transition-colors ${
              pathname === '/app' ? 'text-primary font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            DApp Dashboard
          </Link>

          {STELLAR_PACT_CONTRACT_ID && (
            <a
              href={`${STELLAR_EXPERT_URL}/contract/${STELLAR_PACT_CONTRACT_ID}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition-colors"
            >
              Contract
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}

          <a
            href="https://soroban.stellar.org/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition-colors"
          >
            Docs
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </nav>

        {/* Wallet Connection */}
        <div className="flex items-center gap-3">
          <WalletButton />
        </div>
      </div>
    </header>
  );
};
