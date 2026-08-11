import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { DealService } from '../services/dealService';

// Zod Schema cho dữ liệu đầu vào của POST /api/deals/sync
const syncDealSchema = z.object({
  dealIdOnChain: z.union([z.number(), z.string()]),
  clientAddress: z.string().min(1, 'clientAddress không được để trống'),
  freelancerAddress: z.string().min(1, 'freelancerAddress không được để trống'),
  tokenAddress: z.string().min(1, 'tokenAddress không được để trống'),
  amount: z.string().min(1, 'amount không được để trống'),
  status: z.enum(['LOCKED', 'SUBMITTED', 'RELEASED']),
  txHash: z.string().optional(),
  proofUrl: z.string().optional(),
});

export class DealController {
  /**
   * GET /api/deals?address={wallet_address}
   * Lấy danh sách tất cả các Deal mà địa chỉ ví đóng vai trò Client HOẶC Freelancer.
   */
  static async getDealsByAddress(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const address = req.query.address as string;

      if (!address || address.trim() === '') {
        res.status(400).json({
          success: false,
          error: 'Vui lòng cung cấp tham số query address ví hợp lệ.',
        });
        return;
      }

      const deals = await DealService.getDealsByAddress(address.trim());

      res.status(200).json({
        success: true,
        count: deals.length,
        data: deals,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/deals/:id
   * Lấy thông tin chi tiết của 1 Deal (theo UUID id hoặc dealIdOnChain).
   */
  static async getDealById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = req.params.id as string;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Thiếu ID hợp đồng.',
        });
        return;
      }

      const deal = await DealService.getDealById(id);

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
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/deals/sync
   * Đồng bộ dữ liệu Deal từ Frontend sau khi một giao dịch Soroban hoạn thành thành công.
   */
  static async syncDeal(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
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

      const syncedDeal = await DealService.syncDeal(parseResult.data);

      res.status(200).json({
        success: true,
        message: 'Đồng bộ Deal thành công.',
        data: syncedDeal,
      });
    } catch (error) {
      next(error);
    }
  }
}
