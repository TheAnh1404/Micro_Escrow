'use client';

import React, { useEffect, useState } from 'react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { StatusBadge } from '../../components/StatusBadge';
import { SubmitWorkModal } from '../../components/SubmitWorkModal';
import { useWallet } from '../../context/WalletContext';
import {
  Deal,
  fetchDealsByAddress,
  syncDealOnBackend,
} from '../../lib/api';
import { STELLAR_EXPERT_URL, STELLAR_PACT_CONTRACT_ID, SUPPORTED_TOKENS } from '../../lib/constants';
import {
  callCreateDealOnChain,
  callReleasePaymentOnChain,
  callSubmitWorkOnChain,
  checkFreighterNetwork,
  formatAddress,
} from '../../lib/freighter';
import { toast } from 'sonner';
import {
  Lock,
  UserCheck,
  Coins,
  Send,
  Loader2,
  RefreshCw,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Layers,
  ExternalLink,
  FileText,
} from 'lucide-react';

export default function DAppDashboard() {
  const { address, balance, isConnected, connect, refreshBalance } = useWallet();
  const [activeTab, setActiveTab] = useState<'CLIENT' | 'FREELANCER'>('CLIENT');
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isLoadingDeals, setIsLoadingDeals] = useState(false);

  // Form State cho Create Escrow (Client Mode)
  const [freelancerAddr, setFreelancerAddr] = useState('');
  const [selectedToken, setSelectedToken] = useState(SUPPORTED_TOKENS[0].address);
  const [amount, setAmount] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [isLocking, setIsLocking] = useState(false);

  // Modal State cho Submit Work (Freelancer Mode)
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [selectedDealForSubmit, setSelectedDealForSubmit] = useState<Deal | null>(null);

  // State cho Action Release Payment
  const [releasingDealId, setReleasingDealId] = useState<string | null>(null);

  // Load danh sách Escrows
  const loadDeals = async () => {
    if (!address) return;
    setIsLoadingDeals(true);
    try {
      const data = await fetchDealsByAddress(address);
      setDeals(data);
    } catch (error) {
      console.error('Lỗi load Deals:', error);
    } finally {
      setIsLoadingDeals(false);
    }
  };

  useEffect(() => {
    if (address) {
      loadDeals();
      // Check Freighter Network Mode
      checkFreighterNetwork().then(({ isTestnet, currentNetwork }) => {
        if (!isTestnet) {
          toast.warning('Network Mismatch Detected', {
            description: `Ví Freighter đang ở mạng "${currentNetwork}". Vui lòng chuyển sang Testnet!`,
          });
        }
      });
    } else {
      setDeals([]);
    }
  }, [address]);

  // Handler: Lock Funds (Client tạo Deal mới) - LUỒNG 8 BƯỚC CHUẨN
  const handleLockFunds = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) {
      toast.error('Ví chưa kết nối. Vui lòng kết nối ví Freighter!');
      connect();
      return;
    }

    if (!freelancerAddr.trim()) {
      toast.error('Vui lòng nhập địa chỉ ví Freelancer!');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Số tiền phải lớn hơn 0!');
      return;
    }

    // Kiểm tra Số Dư Khả Dụng (Balance Check)
    const currentBalNum = parseFloat(balance.replace(/,/g, ''));
    if (amountNum > currentBalNum) {
      toast.error('Số dư XLM không đủ!', {
        description: `Ví của bạn hiện chỉ có ${balance} XLM. Bấm nút "Get Test XLM" trên Header để lấy thêm Testnet XLM!`,
      });
      return;
    }

    setIsLocking(true);
    const toastId = toast.loading('Initiating Escrow Lock on Soroban Testnet...');

    try {
      // 1. Gọi SDK & Ký giao dịch Freighter -> Soroban Execution
      const { dealIdOnChain, txHash } = await callCreateDealOnChain(
        address,
        freelancerAddr.trim(),
        selectedToken,
        amount
      );

      toast.loading('Transaction Executed! Syncing metadata to Backend...', { id: toastId });

      // 2. Đồng bộ kết quả lên Backend Database
      let syncSuccess = false;
      try {
        await syncDealOnBackend({
          dealIdOnChain,
          clientAddress: address,
          freelancerAddress: freelancerAddr.trim(),
          tokenAddress: selectedToken,
          amount,
          status: 'LOCKED',
          txHash,
        });
        syncSuccess = true;
      } catch (syncErr) {
        console.warn('Backend sync failed, using fallback RPC data:', syncErr);
      }

      if (syncSuccess) {
        toast.success('Funds Locked Successfully!', {
          id: toastId,
          description: `Escrow Deal #${dealIdOnChain} secured on-chain. Tx: ${txHash.slice(0, 10)}...`,
        });
      } else {
        toast.info('On-Chain Transaction Successful!', {
          id: toastId,
          description: `Escrow #${dealIdOnChain} created on Soroban Testnet (Tx: ${txHash.slice(0, 10)}...).`,
        });
      }

      // Reset Form & Reload List
      setFreelancerAddr('');
      setAmount('');
      setProjectTitle('');
      refreshBalance();
      loadDeals();
    } catch (error: any) {
      if (error.message === 'User cancelled transaction') {
        toast.info('User cancelled transaction', { id: toastId });
      } else {
        toast.error('Escrow Creation Failed', {
          id: toastId,
          description: error.message || 'Transaction rejected on network.',
        });
      }
    } finally {
      setIsLocking(false);
    }
  };

  // Handler: Approve & Release Payment (Client duyệt tiền)
  const handleReleasePayment = async (deal: Deal) => {
    if (!address) return;

    setReleasingDealId(deal.id);
    const toastId = toast.loading(`Releasing Payment for Deal #${deal.dealIdOnChain}...`);

    try {
      const { txHash } = await callReleasePaymentOnChain(address, deal.dealIdOnChain);

      toast.loading('Finalizing Rent Refund and Token Transfer...', { id: toastId });

      try {
        await syncDealOnBackend({
          dealIdOnChain: deal.dealIdOnChain,
          clientAddress: deal.clientAddress,
          freelancerAddress: deal.freelancerAddress,
          tokenAddress: deal.tokenAddress,
          amount: deal.amount,
          status: 'RELEASED',
          txHash,
          proofUrl: deal.proofUrl || undefined,
        });
      } catch (syncErr) {
        console.warn('Backend sync warning:', syncErr);
      }

      toast.success('Payment Released Successfully! Rent refunded.', {
        id: toastId,
        description: `Rent refunded & ${deal.amount} XLM sent to freelancer.`,
      });

      refreshBalance();
      loadDeals();
    } catch (error: any) {
      if (error.message === 'User cancelled transaction') {
        toast.info('User cancelled transaction', { id: toastId });
      } else {
        toast.error('Release Payment Failed', {
          id: toastId,
          description: error.message || 'Transaction failed on Soroban network.',
        });
      }
    } finally {
      setReleasingDealId(null);
    }
  };

  // Handler: Submit Work (Freelancer nộp bài)
  const handleSubmitWork = async (proofUrl: string) => {
    if (!address || !selectedDealForSubmit) return;

    const deal = selectedDealForSubmit;
    const toastId = toast.loading(`Submitting Deliverable for Deal #${deal.dealIdOnChain}...`);

    try {
      const { txHash } = await callSubmitWorkOnChain(address, deal.dealIdOnChain, proofUrl);

      try {
        await syncDealOnBackend({
          dealIdOnChain: deal.dealIdOnChain,
          clientAddress: deal.clientAddress,
          freelancerAddress: deal.freelancerAddress,
          tokenAddress: deal.tokenAddress,
          amount: deal.amount,
          status: 'SUBMITTED',
          txHash,
          proofUrl,
        });
      } catch (syncErr) {
        console.warn('Backend sync warning:', syncErr);
      }

      toast.success('Work Submitted Successfully!', {
        id: toastId,
        description: `Deliverables submitted for Client approval.`,
      });

      loadDeals();
    } catch (error: any) {
      if (error.message === 'User cancelled transaction') {
        toast.info('User cancelled transaction', { id: toastId });
      } else {
        toast.error('Submission Failed', {
          id: toastId,
          description: error.message || 'Transaction rejected on network.',
        });
      }
    }
  };

  const filteredDeals = deals.filter((d) => {
    if (!address) return false;
    if (activeTab === 'CLIENT') {
      return d.clientAddress.toLowerCase() === address.toLowerCase();
    } else {
      return d.freelancerAddress.toLowerCase() === address.toLowerCase();
    }
  });

  return (
    <div className="min-h-screen bg-background text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Header & Role Mode Switcher Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-10 pb-6 border-b border-slate-800">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <Layers className="w-8 h-8 text-primary" />
              Micro-Escrow Workspace
            </h1>
            <p className="text-sm text-slate-400 font-light mt-1">
              Secured by Soroban Testnet &bull; Automated State Purge & Rent Refund.
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center p-1.5 rounded-2xl glass-panel border border-slate-700/80">
            <button
              onClick={() => setActiveTab('CLIENT')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs tracking-wider transition-all ${
                activeTab === 'CLIENT'
                  ? 'bg-gradient-to-r from-primary to-cyan-500 text-slate-950 shadow-glow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              CLIENT MODE
            </button>

            <button
              onClick={() => setActiveTab('FREELANCER')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs tracking-wider transition-all ${
                activeTab === 'FREELANCER'
                  ? 'bg-gradient-to-r from-secondary to-indigo-500 text-white shadow-glow-secondary'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              FREELANCER MODE
            </button>
          </div>
        </div>

        {/* CẢNH BÁO CHƯA KẾT NỐI VÍ */}
        {!isConnected && (
          <div className="mb-10 p-6 rounded-3xl glass-card border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Wallet Connection Required</h4>
                <p className="text-xs text-slate-400">
                  Please connect your Freighter wallet extension to manage or create escrow agreements.
                </p>
              </div>
            </div>
            <button
              onClick={connect}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-slate-950 font-bold text-sm shadow-glow shrink-0"
            >
              Connect Freighter
            </button>
          </div>
        )}

        {/* CLIENT MODE VIEW (Grid 2 Cột) */}
        {activeTab === 'CLIENT' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Cột Trái: Form "Create Escrow" */}
            <div className="lg:col-span-5">
              <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
                  <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Create New Escrow</h2>
                    <p className="text-xs text-slate-400">Lock funds into Soroban Smart Contract</p>
                  </div>
                </div>

                <form onSubmit={handleLockFunds} className="space-y-4">
                  {/* Title / Project Note */}
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-300 mb-2">
                      Project Title / Note
                    </label>
                    <div className="relative">
                      <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        placeholder="Frontend Web3 Integration Milestone"
                        value={projectTitle}
                        onChange={(e) => setProjectTitle(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  {/* Freelancer Address */}
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-300 mb-2">
                      Freelancer Wallet Address
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="GABCD... (Stellar Testnet Address)"
                      value={freelancerAddr}
                      onChange={(e) => setFreelancerAddr(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-500 text-sm font-mono focus:outline-none focus:border-primary"
                    />
                  </div>

                  {/* Token Select & Amount */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase text-slate-300 mb-2">
                        Select Asset
                      </label>
                      <select
                        value={selectedToken}
                        onChange={(e) => setSelectedToken(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white text-sm focus:outline-none focus:border-primary"
                      >
                        {SUPPORTED_TOKENS.map((t) => (
                          <option key={t.address} value={t.address}>
                            {t.icon} {t.symbol}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase text-slate-300 mb-2">
                        Amount (XLM)
                      </label>
                      <input
                        type="number"
                        step="any"
                        required
                        placeholder="100"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white text-sm focus:outline-none focus:border-primary font-mono"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLocking}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-secondary text-slate-950 font-bold text-sm shadow-glow hover:opacity-95 transition-all flex items-center justify-center gap-2 mt-4"
                  >
                    {isLocking ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Signing & Locking Funds...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Lock Funds on Soroban
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Cột Phải: "My Active Escrows" */}
            <div className="lg:col-span-7 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Coins className="w-5 h-5 text-primary" />
                  Client Escrows ({filteredDeals.length})
                </h3>
                <button
                  onClick={loadDeals}
                  disabled={isLoadingDeals}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                  title="Refresh list"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingDeals ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {filteredDeals.length === 0 ? (
                <div className="glass-card p-12 rounded-3xl border border-slate-800 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-500 flex items-center justify-center mx-auto">
                    <Lock className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-white">No Active Escrows</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Create your first milestone escrow agreement using the form on the left.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredDeals.map((deal) => (
                    <div
                      key={deal.id}
                      className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                        <div>
                          <span className="text-xs font-mono font-semibold text-primary">
                            Escrow Deal #{deal.dealIdOnChain}
                          </span>
                          <p className="text-xs text-slate-400 font-mono mt-0.5">
                            Freelancer: {formatAddress(deal.freelancerAddress)}
                          </p>
                        </div>
                        <StatusBadge status={deal.status} proofUrl={deal.proofUrl} />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs text-slate-400 block">Locked Amount</span>
                          <span className="text-2xl font-extrabold text-white">
                            {deal.amount} XLM
                          </span>
                          {deal.txHash && (
                            <a
                              href={`${STELLAR_EXPERT_URL}/tx/${deal.txHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-primary hover:underline flex items-center gap-1 mt-1 font-mono"
                            >
                              Tx: {deal.txHash.slice(0, 10)}... <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>

                        {/* Button Approve & Release (Chỉ sáng lên khi status = SUBMITTED) */}
                        {deal.status === 'SUBMITTED' ? (
                          <button
                            onClick={() => handleReleasePayment(deal)}
                            disabled={releasingDealId === deal.id}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs shadow-glow hover:opacity-95 transition-all"
                          >
                            {releasingDealId === deal.id ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Releasing...
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-4 h-4" />
                                Approve & Release Payment
                              </>
                            )}
                          </button>
                        ) : deal.status === 'LOCKED' ? (
                          <span className="text-xs text-slate-500 italic">
                            Waiting for freelancer deliverable submission...
                          </span>
                        ) : (
                          <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" /> Settled & Refunded
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* FREELANCER MODE VIEW (List View) */}
        {activeTab === 'FREELANCER' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-secondary" />
                Assigned Freelance Contracts ({filteredDeals.length})
              </h3>
              <button
                onClick={loadDeals}
                disabled={isLoadingDeals}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingDeals ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {filteredDeals.length === 0 ? (
              <div className="glass-card p-12 rounded-3xl border border-slate-800 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-500 flex items-center justify-center mx-auto">
                  <Briefcase className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-white">No Assigned Escrows</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  When a client creates an escrow specifying your wallet address, it will appear here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredDeals.map((deal) => (
                  <div
                    key={deal.id}
                    className="glass-card p-6 rounded-3xl border border-slate-800 space-y-5 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                        <span className="text-xs font-mono font-semibold text-secondary">
                          Escrow Deal #{deal.dealIdOnChain}
                        </span>
                        <StatusBadge status={deal.status} proofUrl={deal.proofUrl} />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs text-slate-400 block">Milestone Payment</span>
                          <span className="text-2xl font-extrabold text-white">
                            {deal.amount} XLM
                          </span>
                          {deal.txHash && (
                            <a
                              href={`${STELLAR_EXPERT_URL}/tx/${deal.txHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-secondary hover:underline flex items-center gap-1 mt-1 font-mono"
                            >
                              Tx: {deal.txHash.slice(0, 10)}... <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-slate-400 block">Client Address</span>
                          <span className="text-xs font-mono text-slate-200 bg-slate-800 px-2 py-1 rounded-md">
                            {formatAddress(deal.clientAddress)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Button cho Freelancer */}
                    <div className="pt-2">
                      {deal.status === 'LOCKED' ? (
                        <button
                          onClick={() => {
                            setSelectedDealForSubmit(deal);
                            setSubmitModalOpen(true);
                          }}
                          className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-secondary to-indigo-500 text-white font-bold text-xs shadow-glow-secondary hover:opacity-95 transition-all"
                        >
                          <FileCheck className="w-4 h-4" />
                          Submit Deliverable Work
                        </button>
                      ) : deal.status === 'SUBMITTED' ? (
                        <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
                          <span className="text-xs text-blue-400 font-medium">
                            Deliverable submitted. Pending Client approval & payment release.
                          </span>
                        </div>
                      ) : (
                        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                          <span className="text-xs text-emerald-400 font-semibold flex items-center justify-center gap-1">
                            <CheckCircle2 className="w-4 h-4" /> Payment Received & Released
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal Submit Work */}
      <SubmitWorkModal
        isOpen={submitModalOpen}
        onClose={() => {
          setSubmitModalOpen(false);
          setSelectedDealForSubmit(null);
        }}
        onSubmit={handleSubmitWork}
        dealId={selectedDealForSubmit?.dealIdOnChain || ''}
      />

      <Footer />
    </div>
  );
}
