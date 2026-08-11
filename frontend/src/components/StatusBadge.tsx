'use client';

import React from 'react';
import { ExternalLink, Lock, CheckCircle2, FileUp } from 'lucide-react';

interface StatusBadgeProps {
  status: 'LOCKED' | 'SUBMITTED' | 'RELEASED';
  proofUrl?: string | null;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, proofUrl }) => {
  if (status === 'LOCKED') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
        <Lock className="w-3.5 h-3.5" />
        FUNDS LOCKED
      </span>
    );
  }

  if (status === 'SUBMITTED') {
    return (
      <div className="inline-flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
          <FileUp className="w-3.5 h-3.5" />
          WORK SUBMITTED
        </span>
        {proofUrl && (
          <a
            href={proofUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 rounded-md text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 transition-colors"
            title="View Deliverable Link"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
      <CheckCircle2 className="w-3.5 h-3.5" />
      RELEASED (REFUNDED)
    </span>
  );
};
