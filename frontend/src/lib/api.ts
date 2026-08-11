import { API_BASE_URL } from './constants';

export interface Deal {
  id: string;
  dealIdOnChain: string;
  clientAddress: string;
  freelancerAddress: string;
  tokenAddress: string;
  amount: string;
  proofUrl?: string | null;
  status: 'LOCKED' | 'SUBMITTED' | 'RELEASED';
  txHash?: string | null;
  createdAt: string;
  updatedAt: string;
  client?: { name?: string; avatarUrl?: string } | null;
  freelancer?: { name?: string; avatarUrl?: string } | null;
}

export interface SyncDealPayload {
  dealIdOnChain: string | number;
  clientAddress: string;
  freelancerAddress: string;
  tokenAddress: string;
  amount: string;
  status: 'LOCKED' | 'SUBMITTED' | 'RELEASED';
  txHash?: string;
  proofUrl?: string;
}

/**
 * Fetch danh sách tất cả các Deal theo địa chỉ ví (Client hoặc Freelancer)
 */
export async function fetchDealsByAddress(address: string): Promise<Deal[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/deals?address=${encodeURIComponent(address)}`, {
      cache: 'no-store',
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch deals: ${res.statusText}`);
    }
    const data = await res.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching deals:', error);
    return [];
  }
}

/**
 * Lấy chi tiết 1 deal theo ID
 */
export async function fetchDealById(id: string): Promise<Deal | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/deals/${encodeURIComponent(id)}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data || null;
  } catch (error) {
    console.error('Error fetching deal by ID:', error);
    return null;
  }
}

/**
 * Đồng bộ dữ liệu Deal vừa thực hiện trên On-Chain vào Backend Database
 */
export async function syncDealOnBackend(payload: SyncDealPayload): Promise<Deal | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/deals/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const errMsg = errData.error || res.statusText || 'Unknown Server Error';
      throw new Error(`Backend sync failed: ${errMsg}`);
    }

    const data = await res.json();
    return data.data || null;
  } catch (error: any) {
    console.error('Error syncing deal on backend:', error);
    throw error;
  }
}

/**
 * Đăng ký / Lưu trữ thông tin ví người dùng khi kết nối ví
 */
export async function connectUserWalletBackend(address: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/users/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data || null;
  } catch (error) {
    console.error('Error connecting user wallet backend:', error);
    return null;
  }
}
