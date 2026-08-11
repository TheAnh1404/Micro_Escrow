import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { prisma } from './config/prisma';
import { errorHandler } from './middleware/errorHandler';
import dealRoutes from './routes/dealRoutes';
import userRoutes from './routes/userRoutes';
import { eventSubscriber } from './services/eventSubscriber';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// 1. Middlewares
app.use(cors());
app.use(express.json());

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
app.use('/api/deals', dealRoutes);
app.use('/api/users', userRoutes);

// 4. Global Error Handler
app.use(errorHandler);

// 5. Khởi chạy Server & Event Subscriber
app.listen(PORT, () => {
  console.log(`🌐 [Server] StellarPact Backend đang chạy tại http://localhost:${PORT}`);

  // Khởi động Soroban Event Polling Subscriber
  eventSubscriber.start();
});

// 6. Graceful Shutdown Handler
const gracefulShutdown = async (signal: string) => {
  console.log(`\n🛑 [Server] Nhận tín hiệu ${signal}. Đang dọn dẹp tài nguyên...`);
  eventSubscriber.stop();
  await prisma.$disconnect();
  console.log('✅ [Server] Đã đóng kết nối Database. Server dừng an toàn.');
  process.exit(0);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
