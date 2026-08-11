"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const prisma_1 = require("./config/prisma");
const errorHandler_1 = require("./middleware/errorHandler");
const dealRoutes_1 = __importDefault(require("./routes/dealRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const eventSubscriber_1 = require("./services/eventSubscriber");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 4000;
// 1. Middlewares
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// 2. Welcome & Health check endpoints
app.get('/', (req, res) => {
    res.status(200).json({
        name: 'StellarPact Backend API Services',
        version: '1.0.0',
        status: 'ONLINE',
        documentation: {
            health: 'GET /health',
            deals: {
                getByAddress: 'GET /api/deals?address={wallet_address}',
                getById: 'GET /api/deals/:id',
                syncOnChain: 'POST /api/deals/sync',
            },
            users: {
                connectWallet: 'POST /api/users/connect',
                getProfile: 'GET /api/users/:address',
                updateProfile: 'PUT /api/users/:address',
            },
        },
    });
});
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'UP',
        service: 'StellarPact Backend Service',
        timestamp: new Date().toISOString(),
    });
});
// 3. API Routes
app.use('/api/deals', dealRoutes_1.default);
app.use('/api/users', userRoutes_1.default);
// 4. Global Error Handler
app.use(errorHandler_1.errorHandler);
// 5. Khởi chạy Server & Event Subscriber
app.listen(PORT, () => {
    console.log(`🌐 [Server] StellarPact Backend đang chạy tại http://localhost:${PORT}`);
    // Khởi động Soroban Event Polling Subscriber
    eventSubscriber_1.eventSubscriber.start();
});
// 6. Graceful Shutdown Handler
const gracefulShutdown = async (signal) => {
    console.log(`\n🛑 [Server] Nhận tín hiệu ${signal}. Đang dọn dẹp tài nguyên...`);
    eventSubscriber_1.eventSubscriber.stop();
    await prisma_1.prisma.$disconnect();
    console.log('✅ [Server] Đã đóng kết nối Database. Server dừng an toàn.');
    process.exit(0);
};
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
