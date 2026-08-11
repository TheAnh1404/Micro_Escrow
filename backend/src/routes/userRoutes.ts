import { Router } from 'express';
import { UserController } from '../controllers/userController';

const router = Router();

// Endpoint: POST /api/users/connect -> Đăng ký/Đồng bộ ví người dùng
router.post('/connect', UserController.connectWallet);

// Endpoint: GET /api/users/:address -> Lấy thông tin chi tiết hồ sơ người dùng
router.get('/:address', UserController.getUserByAddress);

// Endpoint: PUT /api/users/:address -> Cập nhật hồ sơ người dùng (Name, Avatar, Email, Role)
router.put('/:address', UserController.updateUserProfile);

export default router;
