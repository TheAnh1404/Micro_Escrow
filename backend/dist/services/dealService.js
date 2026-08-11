"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DealService = void 0;
exports.serializeDeal = serializeDeal;
const prisma_1 = require("../config/prisma");
/**
 * Serializer helper giúp chuyển đổi BigInt trong Prisma sang String để trả về JSON an toàn.
 */
function serializeDeal(deal) {
    if (!deal)
        return null;
    return {
        ...deal,
        dealIdOnChain: deal.dealIdOnChain ? deal.dealIdOnChain.toString() : null,
    };
}
class DealService {
    /**
     * Lấy danh sách các Deal mà ví `address` đóng vai trò là Client HOẶC Freelancer.
     */
    static async getDealsByAddress(address) {
        const deals = await prisma_1.prisma.deal.findMany({
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
    static async getDealById(idOrOnChainId) {
        let deal = await prisma_1.prisma.deal.findUnique({
            where: { id: idOrOnChainId },
            include: {
                client: true,
                freelancer: true,
            },
        });
        // Nếu không tìm thấy theo UUID và tham số truyền vào là số, thử tìm theo dealIdOnChain
        if (!deal && !isNaN(Number(idOrOnChainId))) {
            deal = await prisma_1.prisma.deal.findUnique({
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
    static async syncDeal(input) {
        const dealIdOnChainBigInt = BigInt(input.dealIdOnChain);
        const customId = `mainnet_deal_${dealIdOnChainBigInt.toString()}`;
        // Tự động đảm bảo ví Client & Freelancer tồn tại trong bảng User để tránh lỗi Khóa Ngoại (Foreign Key Constraint P2003)
        if (input.clientAddress) {
            await prisma_1.prisma.user.upsert({
                where: { address: input.clientAddress },
                update: {},
                create: { address: input.clientAddress },
            });
        }
        if (input.freelancerAddress) {
            await prisma_1.prisma.user.upsert({
                where: { address: input.freelancerAddress },
                update: {},
                create: { address: input.freelancerAddress },
            });
        }
        const deal = await prisma_1.prisma.deal.upsert({
            where: {
                dealIdOnChain: dealIdOnChainBigInt,
            },
            update: {
                clientAddress: input.clientAddress,
                freelancerAddress: input.freelancerAddress,
                tokenAddress: input.tokenAddress,
                amount: input.amount,
                status: input.status,
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
                status: input.status,
                txHash: input.txHash || null,
                proofUrl: input.proofUrl || null,
            },
        });
        return serializeDeal(deal);
    }
    /**
     * Cập nhật trạng thái Deal từ Event Subscriber (Submit Work hoặc Release Payment).
     */
    static async updateStatusFromEvent(dealIdOnChain, status, proofUrl) {
        const dealIdBigInt = BigInt(dealIdOnChain);
        const existing = await prisma_1.prisma.deal.findUnique({
            where: { dealIdOnChain: dealIdBigInt },
        });
        if (!existing) {
            console.warn(`[EventSubscriber] Warning: Deal with dealIdOnChain=${dealIdBigInt} not found in DB yet.`);
            return null;
        }
        const updated = await prisma_1.prisma.deal.update({
            where: { dealIdOnChain: dealIdBigInt },
            data: {
                status,
                ...(proofUrl ? { proofUrl } : {}),
            },
        });
        return serializeDeal(updated);
    }
}
exports.DealService = DealService;
