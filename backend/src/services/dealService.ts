import { DealStatus } from '@prisma/client';
import { prisma } from '../config/prisma';

export interface SyncDealInput {
  dealIdOnChain: number | string | bigint;
  clientAddress: string;
  freelancerAddress: string;
  tokenAddress: string;
  amount: string;
  status: 'LOCKED' | 'SUBMITTED' | 'RELEASED';
  txHash?: string;
  proofUrl?: string;
}

/**
 * Serializer helper giúp chuyển đổi BigInt trong Prisma sang String để trả về JSON an toàn.
 */
export function serializeDeal(deal: any) {
  if (!deal) return null;
  return {
    ...deal,
    dealIdOnChain: deal.dealIdOnChain ? deal.dealIdOnChain.toString() : null,
  };
}

export class DealService {
  /**
   * Lấy danh sách các Deal mà ví `address` đóng vai trò là Client HOẶC Freelancer.
   */
  static async getDealsByAddress(address: string) {
    const deals = await prisma.deal.findMany({
      where: {
        OR: [
          { clientAddress: { equals: address, mode: 'insensitive' } },
          { freelancerAddress: { equals: address, mode: 'insensitive' } },
        ],
      },
      include: {
        client: true,
        freelancer: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return deals.map(serializeDeal);
  }

  /**
   * Lấy thông tin chi tiết của 1 deal dựa vào `id` UUID hoặc `dealIdOnChain`.
   */
  static async getDealById(idOrOnChainId: string) {
    let deal = await prisma.deal.findUnique({
      where: { id: idOrOnChainId },
      include: {
        client: true,
        freelancer: true,
      },
    });

    // Nếu không tìm thấy theo UUID và tham số truyền vào là số, thử tìm theo dealIdOnChain
    if (!deal && !isNaN(Number(idOrOnChainId))) {
      deal = await prisma.deal.findUnique({
        where: { dealIdOnChain: BigInt(idOrOnChainId) },
        include: {
          client: true,
          freelancer: true,
        },
      });
    }

    return serializeDeal(deal);
  }

  /**
   * Tạo mới hoặc cập nhật thông tin Deal từ Frontend sau khi giao dịch thành công.
   */
  static async syncDeal(input: SyncDealInput) {
    const dealIdOnChainBigInt = BigInt(input.dealIdOnChain);
    const customId = `mainnet_deal_${dealIdOnChainBigInt.toString()}`;

    // Tự động đảm bảo ví Client & Freelancer tồn tại trong bảng User để tránh lỗi Khóa Ngoại (Foreign Key Constraint P2003)
    if (input.clientAddress) {
      await prisma.user.upsert({
        where: { address: input.clientAddress },
        update: {},
        create: { address: input.clientAddress },
      });
    }

    if (input.freelancerAddress) {
      await prisma.user.upsert({
        where: { address: input.freelancerAddress },
        update: {},
        create: { address: input.freelancerAddress },
      });
    }

    const deal = await prisma.deal.upsert({
      where: {
        dealIdOnChain: dealIdOnChainBigInt,
      },
      update: {
        clientAddress: input.clientAddress,
        freelancerAddress: input.freelancerAddress,
        tokenAddress: input.tokenAddress,
        amount: input.amount,
        status: input.status as DealStatus,
        txHash: input.txHash || undefined,
        proofUrl: input.proofUrl || undefined,
      },
      create: {
        id: customId,
        dealIdOnChain: dealIdOnChainBigInt,
        clientAddress: input.clientAddress,
        freelancerAddress: input.freelancerAddress,
        tokenAddress: input.tokenAddress,
        amount: input.amount,
        status: input.status as DealStatus,
        txHash: input.txHash || null,
        proofUrl: input.proofUrl || null,
      },
    });

    return serializeDeal(deal);
  }

  /**
   * Cập nhật trạng thái Deal từ Event Subscriber (Submit Work hoặc Release Payment).
   */
  static async updateStatusFromEvent(
    dealIdOnChain: bigint | number,
    status: DealStatus,
    proofUrl?: string
  ) {
    const dealIdBigInt = BigInt(dealIdOnChain);

    const existing = await prisma.deal.findUnique({
      where: { dealIdOnChain: dealIdBigInt },
    });

    if (!existing) {
      console.warn(
        `[EventSubscriber] Warning: Deal with dealIdOnChain=${dealIdBigInt} not found in DB yet.`
      );
      return null;
    }

    const updated = await prisma.deal.update({
      where: { dealIdOnChain: dealIdBigInt },
      data: {
        status,
        ...(proofUrl ? { proofUrl } : {}),
      },
    });

    return serializeDeal(updated);
  }
}
