import {
  getAddress,
  getNetwork,
  isConnected,
  requestAccess,
  signTransaction,
} from '@stellar/freighter-api';
import {
  Address,
  Contract,
  TransactionBuilder,
  nativeToScVal,
  rpc,
} from '@stellar/stellar-sdk';
import {
  FRIENDBOT_URL,
  HORIZON_URL,
  SOROBAN_RPC_URL,
  STELLAR_NETWORK_PASSPHRASE,
  STELLAR_PACT_CONTRACT_ID,
} from './constants';

const sorobanServer = new rpc.Server(SOROBAN_RPC_URL);

// ============================================================
// UTILITY HELPERS
// ============================================================

export async function checkFreighterInstalled(): Promise<boolean> {
  try {
    const connected = await isConnected();
    return !!connected;
  } catch {
    return false;
  }
}

export async function checkFreighterNetwork(): Promise<{ isTestnet: boolean; currentNetwork: string }> {
  try {
    const net = await getNetwork();
    const currentNetwork = net.network || 'UNKNOWN';
    const isTestnet = currentNetwork.toUpperCase().includes('TESTNET');
    return { isTestnet, currentNetwork };
  } catch {
    return { isTestnet: true, currentNetwork: 'TESTNET' };
  }
}

export async function connectFreighterWallet(): Promise<string> {
  const installed = await checkFreighterInstalled();
  if (!installed) {
    throw new Error(
      'Ví Freighter chưa được cài đặt. Vui lòng cài đặt tiện ích Freighter Wallet từ https://freighter.app'
    );
  }

  const access = await requestAccess();
  if (access.error) {
    throw new Error(access.error);
  }

  const address = await getAddress();
  if (!address.address) {
    throw new Error('Không thể truy xuất địa chỉ ví từ tiện ích Freighter.');
  }

  return address.address;
}

export async function fundTestnetWallet(address: string): Promise<boolean> {
  if (!address) throw new Error('Địa chỉ ví không hợp lệ.');
  try {
    const res = await fetch(`${FRIENDBOT_URL}?addr=${encodeURIComponent(address)}`);
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || 'Gọi Friendbot Faucet thất bại.');
    }
    return true;
  } catch (error: any) {
    throw new Error(error.message || 'Không thể bơm Testnet XLM.');
  }
}

export async function fetchXlmBalance(address: string): Promise<string> {
  if (!address) return '0.00';
  try {
    const response = await fetch(`${HORIZON_URL}/accounts/${address}`, { cache: 'no-store' });
    if (!response.ok) return '0.00';
    const accountData = await response.json();
    const nativeBalance = accountData.balances?.find((b: any) => b.asset_type === 'native');
    if (nativeBalance?.balance) {
      return parseFloat(nativeBalance.balance).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 7,
      });
    }
    return '0.00';
  } catch {
    return '0.00';
  }
}

export function formatAddress(address: string, chars = 4): string {
  if (!address) return '';
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

function isUserRejectionError(error: any): boolean {
  if (!error) return false;
  const msg = (error.message || String(error)).toLowerCase();
  return (
    msg.includes('user rejected') ||
    msg.includes('user cancelled') ||
    msg.includes('user declined') ||
    msg.includes('declined') ||
    msg.includes('rejected') ||
    msg.includes('cancel')
  );
}

// ============================================================
// XDR PARSER: Giải mã ScVal u64 từ base64 XDR trả về bởi Soroban RPC
// ============================================================

/**
 * Giải mã giá trị u64 từ XDR base64 của ScVal.
 * Format: 4 bytes type discriminant + 8 bytes u64 big-endian
 * SCV_U64 type = 5
 */
function parseU64FromXdrBase64(base64Xdr: string): string {
  try {
    const binaryStr = atob(base64Xdr);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    // Đọc 4 bytes type discriminant
    const typeDiscriminant =
      (bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3];

    // SCV_U64 = 5, SCV_I128 = 10
    if (typeDiscriminant === 5 && bytes.length >= 12) {
      // Đọc 8 bytes u64 big-endian (bytes 4-11)
      const high = ((bytes[4] << 24) | (bytes[5] << 16) | (bytes[6] << 8) | bytes[7]) >>> 0;
      const low = ((bytes[8] << 24) | (bytes[9] << 16) | (bytes[10] << 8) | bytes[11]) >>> 0;
      const value = BigInt(high) * BigInt(0x100000000) + BigInt(low);
      return value.toString();
    }

    return '0';
  } catch {
    return '0';
  }
}

/**
 * Parse deal_id từ kết quả getTransaction trả về bởi Soroban RPC.
 * Hỗ trợ cả format JSON ScVal object và base64 XDR string.
 */
function parseDealIdFromResult(txResult: any): string {
  if (!txResult) return '1';

  const rv = txResult.returnValue;
  if (!rv) return '1';

  // Format 1: JSON ScVal object (ví dụ: { "u64": "1" } hoặc { "u64": 1 })
  if (typeof rv === 'object') {
    if (rv.u64 !== undefined) return String(rv.u64);
    if (rv.i128 !== undefined) return String(rv.i128);
    if (rv.value !== undefined) return String(rv.value);

    // Thử JSON stringify rồi regex tìm số
    const json = JSON.stringify(rv);
    const match = json.match(/"(\d+)"/);
    if (match) return match[1];
  }

  // Format 2: base64 XDR string (ví dụ: "AAAABQAAAAAAAAAB" = u64(1))
  if (typeof rv === 'string') {
    // Kiểm tra xem có phải số thuần không
    if (/^\d+$/.test(rv)) return rv;
    // Parse base64 XDR
    const parsed = parseU64FromXdrBase64(rv);
    if (parsed !== '0') return parsed;
  }

  return '1';
}

// ============================================================
// SOROBAN JSON-RPC: Gửi XDR đã ký trực tiếp, tránh lỗi fromXDR
// ============================================================

/**
 * Gửi XDR đã ký trực tiếp tới Soroban RPC qua JSON-RPC (bypass TransactionBuilder.fromXDR)
 */
async function sendSignedXdrToRpc(signedXdr: string): Promise<{ hash: string; status: string }> {
  const res = await fetch(SOROBAN_RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'sendTransaction',
      params: { transaction: signedXdr },
    }),
  });

  const json = await res.json();

  if (json.error) {
    throw new Error(`Soroban RPC Error: ${json.error.message || JSON.stringify(json.error)}`);
  }

  const result = json.result;
  if (result.status === 'ERROR') {
    throw new Error(`Transaction Rejected: ${result.errorResultXdr || 'Unknown error'}`);
  }

  return { hash: result.hash, status: result.status };
}

/**
 * Chờ giao dịch được xác nhận trên Ledger qua JSON-RPC getTransaction
 */
async function waitForTransaction(txHash: string, maxAttempts = 10): Promise<any> {
  for (let i = 0; i < maxAttempts; i++) {
    const res = await fetch(SOROBAN_RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'getTransaction',
        params: { hash: txHash },
      }),
    });

    const json = await res.json();
    const result = json.result;

    if (result && result.status === 'SUCCESS') {
      return result;
    }

    if (result && result.status === 'FAILED') {
      throw new Error(`Transaction Failed on Ledger: ${txHash}`);
    }

    // Chưa tìm thấy, chờ 1 giây rồi thử lại
    await new Promise((r) => setTimeout(r, 1000));
  }

  // Hết thời gian chờ nhưng giao dịch đã được gửi thành công
  return null;
}

/**
 * Ký giao dịch qua Freighter và trả về XDR string đã ký
 */
async function signWithFreighter(preparedTx: any): Promise<string> {
  let signedResult;
  try {
    signedResult = await signTransaction(preparedTx.toXDR(), {
      networkPassphrase: STELLAR_NETWORK_PASSPHRASE,
    });
  } catch (err: any) {
    if (isUserRejectionError(err)) {
      throw new Error('User cancelled transaction');
    }
    throw err;
  }

  if ((signedResult as any).error) {
    if (isUserRejectionError((signedResult as any).error)) {
      throw new Error('User cancelled transaction');
    }
    throw new Error((signedResult as any).error);
  }

  const xdrString =
    typeof signedResult === 'string'
      ? signedResult
      : (signedResult as any).signedTxXdr || (signedResult as any).signedTx;

  if (!xdrString) {
    throw new Error('User cancelled transaction');
  }

  return xdrString;
}

// ============================================================
// CONTRACT INVOCATION FUNCTIONS
// ============================================================

/**
 * Gọi `create_deal` trên Soroban Smart Contract thật
 */
export async function callCreateDealOnChain(
  clientAddress: string,
  freelancerAddress: string,
  tokenAddress: string,
  amountStr: string
): Promise<{ dealIdOnChain: string; txHash: string }> {
  if (!STELLAR_PACT_CONTRACT_ID || STELLAR_PACT_CONTRACT_ID.includes('...')) {
    throw new Error('Chưa cấu hình Contract ID. Vui lòng cập nhật NEXT_PUBLIC_STELLAR_PACT_CONTRACT_ID.');
  }

  try {
    const contract = new Contract(STELLAR_PACT_CONTRACT_ID);
    const account = await sorobanServer.getAccount(clientAddress);

    const clientScVal = new Address(clientAddress).toScVal();
    const freelancerScVal = new Address(freelancerAddress).toScVal();
    const tokenScVal = new Address(tokenAddress).toScVal();
    const amountScVal = nativeToScVal(
      BigInt(Math.floor(parseFloat(amountStr) * 10_000_000)),
      { type: 'i128' }
    );

    const tx = new TransactionBuilder(account, {
      fee: '10000',
      networkPassphrase: STELLAR_NETWORK_PASSPHRASE,
    })
      .addOperation(
        contract.call('create_deal', clientScVal, freelancerScVal, tokenScVal, amountScVal)
      )
      .setTimeout(30)
      .build();

    // 1. Simulate transaction để lấy footprint & resource fees
    const preparedTx = await sorobanServer.prepareTransaction(tx);

    // 2. Ký qua Freighter Popup
    const signedXdr = await signWithFreighter(preparedTx);

    // 3. Gửi XDR đã ký trực tiếp qua JSON-RPC (bypass fromXDR)
    const { hash } = await sendSignedXdrToRpc(signedXdr);

    // 4. Chờ giao dịch xác nhận trên Ledger
    const txResult = await waitForTransaction(hash);

    // 5. Lấy deal_id từ kết quả trả về của Contract
    const dealIdOnChain = parseDealIdFromResult(txResult);

    return { dealIdOnChain, txHash: hash };
  } catch (error: any) {
    console.error('Lỗi giao dịch create_deal:', error);
    if (isUserRejectionError(error)) {
      throw new Error('User cancelled transaction');
    }
    throw new Error(error.message || 'Giao dịch tạo Deal thất bại.');
  }
}

/**
 * Gọi `submit_work` trên Soroban Smart Contract thật
 */
export async function callSubmitWorkOnChain(
  freelancerAddress: string,
  dealIdOnChain: string,
  proofUrl: string
): Promise<{ txHash: string }> {
  if (!STELLAR_PACT_CONTRACT_ID || STELLAR_PACT_CONTRACT_ID.includes('...')) {
    throw new Error('Chưa cấu hình Contract ID.');
  }

  try {
    const contract = new Contract(STELLAR_PACT_CONTRACT_ID);
    const account = await sorobanServer.getAccount(freelancerAddress);

    const freelancerScVal = new Address(freelancerAddress).toScVal();
    const dealIdScVal = nativeToScVal(BigInt(dealIdOnChain), { type: 'u64' });
    const proofUrlScVal = nativeToScVal(proofUrl, { type: 'string' });

    const tx = new TransactionBuilder(account, {
      fee: '10000',
      networkPassphrase: STELLAR_NETWORK_PASSPHRASE,
    })
      .addOperation(contract.call('submit_work', freelancerScVal, dealIdScVal, proofUrlScVal))
      .setTimeout(30)
      .build();

    const preparedTx = await sorobanServer.prepareTransaction(tx);
    const signedXdr = await signWithFreighter(preparedTx);
    const { hash } = await sendSignedXdrToRpc(signedXdr);

    await waitForTransaction(hash);

    return { txHash: hash };
  } catch (error: any) {
    console.error('Lỗi giao dịch submit_work:', error);
    if (isUserRejectionError(error)) {
      throw new Error('User cancelled transaction');
    }
    throw new Error(error.message || 'Giao dịch nộp bài thất bại.');
  }
}

/**
 * Gọi `release_payment` trên Soroban Smart Contract thật
 */
export async function callReleasePaymentOnChain(
  clientAddress: string,
  dealIdOnChain: string
): Promise<{ txHash: string }> {
  if (!STELLAR_PACT_CONTRACT_ID || STELLAR_PACT_CONTRACT_ID.includes('...')) {
    throw new Error('Chưa cấu hình Contract ID.');
  }

  try {
    const contract = new Contract(STELLAR_PACT_CONTRACT_ID);
    const account = await sorobanServer.getAccount(clientAddress);

    const clientScVal = new Address(clientAddress).toScVal();
    const dealIdScVal = nativeToScVal(BigInt(dealIdOnChain), { type: 'u64' });

    const tx = new TransactionBuilder(account, {
      fee: '10000',
      networkPassphrase: STELLAR_NETWORK_PASSPHRASE,
    })
      .addOperation(contract.call('release_payment', clientScVal, dealIdScVal))
      .setTimeout(30)
      .build();

    const preparedTx = await sorobanServer.prepareTransaction(tx);
    const signedXdr = await signWithFreighter(preparedTx);
    const { hash } = await sendSignedXdrToRpc(signedXdr);

    await waitForTransaction(hash);

    return { txHash: hash };
  } catch (error: any) {
    console.error('Lỗi giao dịch release_payment:', error);
    if (isUserRejectionError(error)) {
      throw new Error('User cancelled transaction');
    }
    throw new Error(error.message || 'Giao dịch giải ngân thất bại.');
  }
}
