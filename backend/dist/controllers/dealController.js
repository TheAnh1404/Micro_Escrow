"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DealController = void 0;
const zod_1 = require("zod");
const dealService_1 = require("../services/dealService");
// Zod Schema cho dữ liệu đầu vào của POST /api/deals/sync
const syncDealSchema = zod_1.z.object({
    dealIdOnChain: zod_1.z.union([zod_1.z.number(), zod_1.z.string()]),
    clientAddress: zod_1.z.string().min(1, 'clientAddress không được để trống'),
    freelancerAddress: zod_1.z.string().min(1, 'freelancerAddress không được để trống'),
    tokenAddress: zod_1.z.string().min(1, 'tokenAddress không được để trống'),
    amount: zod_1.z.string().min(1, 'amount không được để trống'),
    status: zod_1.z.enum(['LOCKED', 'SUBMITTED', 'RELEASED']),
    txHash: zod_1.z.string().optional(),
    proofUrl: zod_1.z.string().optional(),
});
class DealController {
    /**
     * GET /api/deals?address={wallet_address}
     * Lấy danh sách tất cả các Deal mà địa chỉ ví đóng vai trò Client HOẶC Freelancer.
     */
    static async getDealsByAddress(req, res, next) {
        try {
            const address = req.query.address;
            if (!address || address.trim() === '') {
                res.status(400).json({
                    success: false,
                    error: 'Vui lòng cung cấp tham số query address ví hợp lệ.',
                });
                return;
            }
            const deals = await dealService_1.DealService.getDealsByAddress(address.trim());
            res.status(200).json({
                success: true,
                count: deals.length,
                data: deals,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/deals/:id
     * Lấy thông tin chi tiết của 1 Deal (theo UUID id hoặc dealIdOnChain).
     */
    static async getDealById(req, res, next) {
        try {
            const id = req.params.id;
            if (!id) {
                res.status(400).json({
                    success: false,
                    error: 'Thiếu ID hợp đồng.',
                });
                return;
            }
            const deal = await dealService_1.DealService.getDealById(id);
            if (!deal) {
                res.status(404).json({
                    success: false,
                    error: `Không tìm thấy Deal với ID: ${id}`,
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: deal,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * POST /api/deals/sync
     * Đồng bộ dữ liệu Deal từ Frontend sau khi một giao dịch Soroban hoạn thành thành công.
     */
    static async syncDeal(req, res, next) {
        try {
            // Validate dữ liệu đầu vào bằng Zod
            const parseResult = syncDealSchema.safeParse(req.body);
            if (!parseResult.success) {
                res.status(400).json({
                    success: false,
                    error: 'Dữ liệu đầu vào không hợp lệ.',
                    details: parseResult.error.format(),
                });
                return;
            }
            const syncedDeal = await dealService_1.DealService.syncDeal(parseResult.data);
            res.status(200).json({
                success: true,
                message: 'Đồng bộ Deal thành công.',
                data: syncedDeal,
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.DealController = DealController;
