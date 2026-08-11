import { scValToNative, xdr } from '@stellar/stellar-sdk';
import {
  EVENT_POLL_INTERVAL_MS,
  STELLAR_PACT_CONTRACT_ID,
  sorobanServer,
} from '../config/stellar';
import { DealService } from './dealService';

export class EventSubscriberService {
  private isRunning: boolean = false;
  private lastScannedLedger: number = 0;
  private timer: NodeJS.Timeout | null = null;

  /**
   * Kiểm tra tính hợp lệ của Stellar/Soroban Contract ID.
   * Contract ID chuẩn bắt đầu bằng chữ 'C' và có độ dài 56 ký tự.
   */
  private isValidContractId(contractId: string): boolean {
    if (!contractId || contractId.includes('...')) {
      return false;
    }
    return contractId.startsWith('C') && contractId.length === 56;
  }

  /**
   * Khởi động dịch vụ Polling Lắng nghe Event từ Soroban RPC
   */
  public async start() {
    if (!this.isValidContractId(STELLAR_PACT_CONTRACT_ID)) {
      console.warn(
        `⚠️ [EventSubscriber] STELLAR_PACT_CONTRACT_ID ("${STELLAR_PACT_CONTRACT_ID}") chưa được cấu hình hợp lệ trong file .env.`
      );
      console.warn(
        '💡 [EventSubscriber] Vui lòng cập nhật STELLAR_PACT_CONTRACT_ID (địa chỉ Contract 56 ký tự bắt đầu bằng "C") để bật tính năng tự động lắng nghe Event.'
      );
      return;
    }

    try {
      // Lấy Ledger hiện tại làm điểm bắt đầu polling
      const latestLedgerRes = await sorobanServer.getLatestLedger();
      this.lastScannedLedger = latestLedgerRes.sequence;
      console.log(
        `🚀 [EventSubscriber] Bắt đầu lắng nghe sự kiện từ Contract: ${STELLAR_PACT_CONTRACT_ID} (Ledger bắt đầu: ${this.lastScannedLedger})`
      );

      this.isRunning = true;
      this.pollEvents();
    } catch (error) {
      console.error(
        '❌ [EventSubscriber] Lỗi khởi tạo Soroban RPC Event Subscriber:',
        error
      );
    }
  }

  /**
   * Quét các sự kiện mới từ Soroban RPC Node
   */
  private async pollEvents() {
    if (!this.isRunning) return;

    try {
      const eventsResponse = await sorobanServer.getEvents({
        startLedger: this.lastScannedLedger,
        filters: [
          {
            type: 'contract',
            contractIds: [STELLAR_PACT_CONTRACT_ID],
          },
        ],
      });

      if (eventsResponse.events && eventsResponse.events.length > 0) {
        for (const event of eventsResponse.events) {
          await this.processEvent(event);
          if (event.ledger > this.lastScannedLedger) {
            this.lastScannedLedger = event.ledger + 1;
          }
        }
      }
    } catch (error: any) {
      console.error(
        '⚠️ [EventSubscriber] Lỗi trong quá trình polling events:',
        error.message || error
      );
    } finally {
      if (this.isRunning) {
        this.timer = setTimeout(
          () => this.pollEvents(),
          EVENT_POLL_INTERVAL_MS
        );
      }
    }
  }

  /**
   * Phân tích và xử lý từng Event thu thập được
   */
  private async processEvent(event: any) {
    try {
      const rawTopics = event.topic || [];
      if (rawTopics.length < 2) return;

      const topicName =
        typeof rawTopics[0] === 'string'
          ? rawTopics[0]
          : scValToNative(xdr.ScVal.fromXDR(rawTopics[0], 'base64'));

      const dealIdOnChain =
        typeof rawTopics[1] === 'number' || typeof rawTopics[1] === 'bigint'
          ? rawTopics[1]
          : scValToNative(xdr.ScVal.fromXDR(rawTopics[1], 'base64'));

      const eventValue = event.value
        ? scValToNative(
            typeof event.value === 'string'
              ? xdr.ScVal.fromXDR(event.value, 'base64')
              : event.value
          )
        : null;

      console.log(
        `📩 [EventSubscriber] Nhận event [${topicName}] cho Deal ID: ${dealIdOnChain}`
      );

      if (topicName === 'submit') {
        const proofUrl =
          typeof eventValue === 'string' ? eventValue : String(eventValue || '');
        await DealService.updateStatusFromEvent(
          dealIdOnChain,
          'SUBMITTED',
          proofUrl
        );
        console.log(
          `✅ [EventSubscriber] Đã cập nhật SUBMITTED cho Deal #${dealIdOnChain} (Proof: ${proofUrl})`
        );
      } else if (topicName === 'release') {
        await DealService.updateStatusFromEvent(dealIdOnChain, 'RELEASED');
        console.log(
          `🎉 [EventSubscriber] Đã cập nhật RELEASED cho Deal #${dealIdOnChain}`
        );
      }
    } catch (err) {
      console.error('❌ [EventSubscriber] Lỗi parse event payload:', err);
    }
  }

  /**
   * Dừng dịch vụ Event Subscriber
   */
  public stop() {
    this.isRunning = false;
    if (this.timer) {
      clearTimeout(this.timer);
    }
    console.log('🛑 [EventSubscriber] Đã dừng lắng nghe sự kiện.');
  }
}

export const eventSubscriber = new EventSubscriberService();
