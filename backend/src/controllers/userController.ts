import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { UserService } from '../services/userService';

const connectWalletSchema = z.object({
  address: z.string().min(1, 'Địa chỉ ví không được để trống'),
  name: z.string().optional(),
  avatarUrl: z.string().optional(),
  email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
});

const updateUserSchema = z.object({
  name: z.string().optional(),
  email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
  avatarUrl: z.string().optional(),
  role: z.enum(['CLIENT', 'FREELANCER', 'BOTH']).optional(),
});

export class UserController {
  /**
   * POST /api/users/connect
   * Đăng ký / Lưu trữ thông tin khi người dùng kết nối ví Stellar.
   */
  static async connectWallet(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const parseResult = connectWalletSchema.safeParse(req.body);

      if (!parseResult.success) {
        res.status(400).json({
          success: false,
          error: 'Dữ liệu không hợp lệ.',
          details: parseResult.error.format(),
        });
        return;
      }

      const user = await UserService.connectWallet(parseResult.data);

      res.status(200).json({
        success: true,
        message: 'Kết nối ví và lưu thông tin người dùng thành công.',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/users/:address
   * Lấy thông tin hồ sơ người dùng theo địa chỉ ví.
   */
  static async getUserByAddress(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const address = req.params.address as string;

      if (!address || address.trim() === '') {
        res.status(400).json({
          success: false,
          error: 'Địa chỉ ví không hợp lệ.',
        });
        return;
      }

      const user = await UserService.getUserByAddress(address);

      if (!user) {
        res.status(404).json({
          success: false,
          error: `Không tìm thấy thông tin người dùng với ví: ${address}`,
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/users/:address
   * Cập nhật hồ sơ người dùng.
   */
  static async updateUserProfile(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const address = req.params.address as string;
      const parseResult = updateUserSchema.safeParse(req.body);

      if (!parseResult.success) {
        res.status(400).json({
          success: false,
          error: 'Dữ liệu cập nhật không hợp lệ.',
          details: parseResult.error.format(),
        });
        return;
      }

      const updatedUser = await UserService.updateUserProfile(
        address,
        parseResult.data
      );

      res.status(200).json({
        success: true,
        message: 'Cập nhật thông tin thành công.',
        data: updatedUser,
      });
    } catch (error) {
      next(error);
    }
  }
}
