'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '../context/WalletContext';
import { Footer } from '../components/Footer';
import {
  ShieldCheck,
  Zap,
  DollarSign,
  Lock,
  FileUp,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  ChevronRight,
  ExternalLink,
  Wallet,
  Loader2,
} from 'lucide-react';

export default function LandingPage() {
  const { isConnected, isConnecting, connect } = useWallet();
  const router = useRouter();

  // Auto-redirect to DApp when wallet is connected
  useEffect(() => {
    if (isConnected) {
      router.replace('/app');
    }
  }, [isConnected, router]);

  return (
    <div className="min-h-screen bg-background text-slate-100 flex flex-col selection:bg-primary/20 selection:text-primary">
      {/* ============ MINIMAL LANDING NAVBAR ============ */}
      <header className="sticky top-0 z-50 w-full glass-panel border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-secondary p-0.5 shadow-glow">
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
          </div>

          {/* Single CTA Button */}
          <button
            onClick={connect}
            disabled={isConnecting}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary to-secondary text-slate-950 font-semibold text-sm shadow-glow hover:opacity-95 transition-all transform hover:-translate-y-0.5 disabled:opacity-60"
          >
            {isConnecting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Wallet className="w-4 h-4" />
                Connect Wallet
              </>
            )}
          </button>
        </div>
      </header>

      {/* ============ HERO SECTION ============ */}
      <section className="relative pt-16 pb-24 overflow-hidden">
        {/* Background Glowing Gradients */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-primary/20 to-secondary/20 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Copy Column */}
            <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel border border-primary/30 text-primary text-xs font-semibold tracking-wide">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Next-Gen Micro-Escrow Protocol on Stellar Soroban</span>
              </div>

              <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.15]">
                Fast, Low-Cost{' '}
                <span className="bg-gradient-to-r from-primary via-cyan-300 to-secondary bg-clip-text text-transparent">
                  Micro-Escrow
                </span>{' '}
                for the Global Freelance Economy.
              </h1>

              <p className="text-lg text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-light">
                StellarPact locks milestone payments into sub-second Soroban Smart Contracts.
                Zero platform commissions, instant settlement, and automatic Ledger Rent Refund.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <button
                  onClick={connect}
                  disabled={isConnecting}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-primary to-secondary text-slate-950 font-bold text-base shadow-glow hover:opacity-95 transition-all transform hover:-translate-y-0.5 disabled:opacity-60"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Connecting Wallet...
                    </>
                  ) : (
                    <>
                      <Wallet className="w-5 h-5" />
                      Connect Wallet to Start
                    </>
                  )}
                </button>

                <a
                  href="https://soroban.stellar.org/docs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl glass-panel text-slate-200 hover:text-white font-semibold text-base border border-slate-700/80 hover:bg-slate-800/80 transition-all"
                >
                  Explore Docs
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Right Visual — 3D Glassmorphism Escrow Card */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md glass-card p-6 rounded-3xl border border-slate-700/60 shadow-2xl space-y-6 transform hover:scale-[1.02] transition-transform">
                {/* Header Badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                      <ShieldCheck className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Escrow Agreement #8402</h4>
                      <p className="text-xs text-slate-400">Full-Stack Frontend Integration</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    LOCKED
                  </span>
                </div>

                {/* Amount Visual */}
                <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Secured Amount
                  </span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-3xl font-extrabold text-white">1,500.00 XLM</span>
                    <span className="text-sm font-medium text-emerald-400">~$180.00 USD</span>
                  </div>
                </div>

                {/* Parties Details */}
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center py-2 border-b border-slate-800">
                    <span className="text-slate-400">Client Address</span>
                    <span className="font-mono text-slate-200 bg-slate-800 px-2 py-1 rounded-md">
                      GBX3...82FA
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-800">
                    <span className="text-slate-400">Freelancer Address</span>
                    <span className="font-mono text-slate-200 bg-slate-800 px-2 py-1 rounded-md">
                      GD82...91KC
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-400">Execution Speed</span>
                    <span className="text-primary font-semibold flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5" /> 3.2 seconds
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ STAT BAR SECTION ============ */}
      <section className="py-12 border-y border-slate-800 bg-slate-950/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-slate-800">
            <div className="pt-4 md:pt-0 space-y-2">
              <div className="flex items-center justify-center gap-2 text-primary font-extrabold text-3xl sm:text-4xl">
                <Zap className="w-7 h-7" />
                ~3 Seconds
              </div>
              <p className="text-xs uppercase tracking-wider text-slate-400 font-medium">
                Finality Settlement Speed
              </p>
            </div>

            <div className="pt-4 md:pt-0 space-y-2">
              <div className="flex items-center justify-center gap-2 text-secondary font-extrabold text-3xl sm:text-4xl">
                <DollarSign className="w-7 h-7" />
                &lt; $0.00001
              </div>
              <p className="text-xs uppercase tracking-wider text-slate-400 font-medium">
                Average Transaction Fee
              </p>
            </div>

            <div className="pt-4 md:pt-0 space-y-2">
              <div className="flex items-center justify-center gap-2 text-emerald-400 font-extrabold text-3xl sm:text-4xl">
                <ShieldCheck className="w-7 h-7" />
                100% Soroban
              </div>
              <p className="text-xs uppercase tracking-wider text-slate-400 font-medium">
                On-Chain Verification & Rent Refund
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ HOW IT WORKS SECTION ============ */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white">
            How StellarPact Works
          </h2>
          <p className="text-slate-400 text-base max-w-2xl mx-auto font-light">
            Trustless 3-step escrow process for freelancers and clients worldwide.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Step 1 */}
          <div className="glass-card p-8 rounded-3xl border border-slate-800 space-y-6 relative overflow-hidden group">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center font-extrabold text-xl">
              <Lock className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-white">1. Lock Milestone Funds</h3>
            <p className="text-sm text-slate-400 leading-relaxed font-light">
              Client deposits XLM or USDC into the Soroban Smart Contract with designated freelancer address.
            </p>
          </div>

          {/* Step 2 */}
          <div className="glass-card p-8 rounded-3xl border border-slate-800 space-y-6 relative overflow-hidden group">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center font-extrabold text-xl">
              <FileUp className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-white">2. Deliver Work & Proof</h3>
            <p className="text-sm text-slate-400 leading-relaxed font-light">
              Freelancer completes work and submits deliverable proof link (GitHub, Figma, IPFS) on-chain.
            </p>
          </div>

          {/* Step 3 */}
          <div className="glass-card p-8 rounded-3xl border border-slate-800 space-y-6 relative overflow-hidden group">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-extrabold text-xl">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-white">3. Approve & Auto Refund</h3>
            <p className="text-sm text-slate-400 leading-relaxed font-light">
              Client approves release. Contract pays freelancer instantly and purges state for Rent Refund.
            </p>
          </div>
        </div>
      </section>

      {/* ============ CTA FOOTER BANNER ============ */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="glass-card p-12 rounded-3xl border border-primary/30 text-center space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            Ready to secure your freelance agreements?
          </h2>
          <p className="text-slate-300 text-sm max-w-xl mx-auto">
            Connect your Freighter wallet now to start creating micro-escrows on Soroban Testnet.
          </p>
          <div className="pt-2">
            <button
              onClick={connect}
              disabled={isConnecting}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-primary to-secondary text-slate-950 font-bold text-base shadow-glow hover:opacity-95 transition-all disabled:opacity-60"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Wallet className="w-5 h-5" />
                  Connect Wallet to Start
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
