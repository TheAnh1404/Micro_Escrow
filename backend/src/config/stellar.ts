import { rpc } from '@stellar/stellar-sdk';
import dotenv from 'dotenv';

dotenv.config();

export const SOROBAN_RPC_URL =
  process.env.SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org';

export const STELLAR_PACT_CONTRACT_ID =
  process.env.STELLAR_PACT_CONTRACT_ID || '';

export const EVENT_POLL_INTERVAL_MS = Number(
  process.env.EVENT_POLL_INTERVAL_MS || 5000
);

/**
 * Khởi tạo Server instance kết nối tới Soroban RPC Node
 */
export const sorobanServer = new rpc.Server(SOROBAN_RPC_URL);
