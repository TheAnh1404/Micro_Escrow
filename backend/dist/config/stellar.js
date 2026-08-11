"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sorobanServer = exports.EVENT_POLL_INTERVAL_MS = exports.STELLAR_PACT_CONTRACT_ID = exports.SOROBAN_RPC_URL = void 0;
const stellar_sdk_1 = require("@stellar/stellar-sdk");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.SOROBAN_RPC_URL = process.env.SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org';
exports.STELLAR_PACT_CONTRACT_ID = process.env.STELLAR_PACT_CONTRACT_ID || '';
exports.EVENT_POLL_INTERVAL_MS = Number(process.env.EVENT_POLL_INTERVAL_MS || 5000);
/**
 * Khởi tạo Server instance kết nối tới Soroban RPC Node
 */
exports.sorobanServer = new stellar_sdk_1.rpc.Server(exports.SOROBAN_RPC_URL);
