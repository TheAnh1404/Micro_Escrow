'use client';

import React, { useState } from 'react';
import { X, FileUp, Link as LinkIcon, Loader2 } from 'lucide-react';

interface SubmitWorkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (proofUrl: string) => Promise<void>;
  dealId: string;
}

export const SubmitWorkModal: React.FC<SubmitWorkModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  dealId,
}) => {
  const [proofUrl, setProofUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofUrl.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(proofUrl.trim());
      setProofUrl('');
      onClose();
    } catch (error) {
      // Handled in parent
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md p-6 rounded-3xl glass-card border border-slate-700 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-200 rounded-full hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-2xl bg-secondary/10 text-secondary border border-secondary/20">
            <FileUp className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Submit Work Deliverables</h3>
            <p className="text-xs text-slate-400">Escrow Deal #{dealId}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-300 mb-2">
              Deliverable URL (GitHub / Figma / IPFS)
            </label>
            <div className="relative">
              <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="url"
                required
                placeholder="https://github.com/your-username/project-repo"
                value={proofUrl}
                onChange={(e) => setProofUrl(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary text-sm"
              />
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Provide a verifiable link containing your completed project code, designs, or proof of work.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-slate-200 text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !proofUrl.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-secondary to-primary text-slate-950 font-semibold text-sm shadow-glow-secondary disabled:opacity-50 transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting to Soroban...
                </>
              ) : (
                'Submit Deliverable'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
