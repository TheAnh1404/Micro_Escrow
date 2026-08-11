"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const router = (0, express_1.Router)();
// Endpoint: POST /api/users/connect -> Đăng ký/Đồng bộ ví người dùng
router.post('/connect', userController_1.UserController.connectWallet);
// Endpoint: GET /api/users/:address -> Lấy thông tin chi tiết hồ sơ người dùng
router.get('/:address', userController_1.UserController.getUserByAddress);
// Endpoint: PUT /api/users/:address -> Cập nhật hồ sơ người dùng (Name, Avatar, Email, Role)
router.put('/:address', userController_1.UserController.updateUserProfile);
exports.default = router;
