"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const zod_1 = require("zod");
const userService_1 = require("../services/userService");
const connectWalletSchema = zod_1.z.object({
    address: zod_1.z.string().min(1, 'Địa chỉ ví không được để trống'),
    name: zod_1.z.string().optional(),
    avatarUrl: zod_1.z.string().optional(),
    email: zod_1.z.string().email('Email không hợp lệ').optional().or(zod_1.z.literal('')),
});
const updateUserSchema = zod_1.z.object({
    name: zod_1.z.string().optional(),
    email: zod_1.z.string().email('Email không hợp lệ').optional().or(zod_1.z.literal('')),
    avatarUrl: zod_1.z.string().optional(),
    role: zod_1.z.enum(['CLIENT', 'FREELANCER', 'BOTH']).optional(),
});
class UserController {
    /**
     * POST /api/users/connect
     * Đăng ký / Lưu trữ thông tin khi người dùng kết nối ví Stellar.
     */
    static async connectWallet(req, res, next) {
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
            const user = await userService_1.UserService.connectWallet(parseResult.data);
            res.status(200).json({
                success: true,
                message: 'Kết nối ví và lưu thông tin người dùng thành công.',
                data: user,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/users/:address
     * Lấy thông tin hồ sơ người dùng theo địa chỉ ví.
     */
    static async getUserByAddress(req, res, next) {
        try {
            const address = req.params.address;
            if (!address || address.trim() === '') {
                res.status(400).json({
                    success: false,
                    error: 'Địa chỉ ví không hợp lệ.',
                });
                return;
            }
            const user = await userService_1.UserService.getUserByAddress(address);
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
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * PUT /api/users/:address
     * Cập nhật hồ sơ người dùng.
     */
    static async updateUserProfile(req, res, next) {
        try {
            const address = req.params.address;
            const parseResult = updateUserSchema.safeParse(req.body);
            if (!parseResult.success) {
                res.status(400).json({
                    success: false,
                    error: 'Dữ liệu cập nhật không hợp lệ.',
                    details: parseResult.error.format(),
                });
                return;
            }
            const updatedUser = await userService_1.UserService.updateUserProfile(address, parseResult.data);
            res.status(200).json({
                success: true,
                message: 'Cập nhật thông tin thành công.',
                data: updatedUser,
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.UserController = UserController;
