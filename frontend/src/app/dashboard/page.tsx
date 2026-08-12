'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '../../context/WalletContext';

/**
 * Route alias `/dashboard` -> redirect to `/app` if connected, otherwise to `/`
 */
export default function DashboardAlias() {
  const router = useRouter();
  const { isConnected } = useWallet();

  useEffect(() => {
    const savedAddr = localStorage.getItem('stellarpact_wallet_address');
    if (isConnected || savedAddr) {
      router.replace('/app');
    } else {
      router.replace('/');
    }
  }, [isConnected, router]);

  return null;
}
