'use client';

import React from 'react';
import Link from 'next/link';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ShieldAlert, ArrowLeft, LayoutDashboard } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background text-slate-100 flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-6 relative overflow-hidden">
        {/* Glowing Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[250px] bg-gradient-to-tr from-primary/20 to-secondary/20 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-md w-full glass-card p-10 rounded-3xl border border-slate-700/80 text-center space-y-6 relative z-10 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto shadow-glow">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-mono font-bold text-primary uppercase tracking-widest">
              Error 404
            </span>
            <h1 className="text-2xl font-extrabold text-white">Page Not Found</h1>
            <p className="text-xs text-slate-400 font-light leading-relaxed">
              Trang bạn đang truy cập không tồn tại hoặc đã được di chuyển trong hệ thống dApp.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/app"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-slate-950 font-bold text-xs shadow-glow hover:opacity-95 transition-all"
            >
              <LayoutDashboard className="w-4 h-4" />
              Mở DApp Workspace
            </Link>

            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl glass-panel text-slate-300 hover:text-white font-semibold text-xs border border-slate-700 hover:bg-slate-800 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Về Trang Chủ
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
