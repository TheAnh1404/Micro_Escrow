export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export const SOROBAN_RPC_URL =
  process.env.NEXT_PUBLIC_SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org';

export const HORIZON_URL =
  process.env.NEXT_PUBLIC_HORIZON_URL || 'https://horizon-testnet.stellar.org';

export const FRIENDBOT_URL =
  process.env.NEXT_PUBLIC_FRIENDBOT_URL || 'https://friendbot.stellar.org';

export const STELLAR_NETWORK_PASSPHRASE =
  process.env.NEXT_PUBLIC_STELLAR_PASSPHRASE || 'Test SDF Network ; September 2015';

export const STELLAR_PACT_CONTRACT_ID =
  process.env.NEXT_PUBLIC_STELLAR_PACT_CONTRACT_ID || '';

export const STELLAR_EXPERT_URL = 'https://stellar.expert/explorer/testnet';

export const SUPPORTED_TOKENS = [
  {
    symbol: 'XLM',
    name: 'Stellar Lumens (Native Testnet)',
    address: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
    decimals: 7,
    icon: '✨',
  },
];
