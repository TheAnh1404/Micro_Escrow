'use client';

import React from 'react';
import { ShieldCheck, Github, Globe } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-slate-800 bg-slate-950/80 backdrop-blur-lg py-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-secondary p-0.5">
            <div className="w-full h-full bg-slate-950 rounded-[6px] flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-primary" />
            </div>
          </div>
          <span className="text-sm font-semibold text-slate-300">
            StellarPact Escrow Protocol &copy; 2026
          </span>
        </div>

        <p className="text-xs text-slate-500 text-center">
          Powered by Soroban Smart Contracts on Stellar Testnet &bull; Rent Refund Optimized &bull; Non-Custodial
        </p>

        <div className="flex items-center gap-4 text-slate-400">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg hover:text-primary hover:bg-slate-800 transition-colors"
          >
            <Github className="w-4 h-4" />
          </a>
          <a
            href="https://stellar.org"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg hover:text-primary hover:bg-slate-800 transition-colors"
          >
            <Globe className="w-4 h-4" />
          </a>
        </div>
      </div>
    </footer>
  );
};
