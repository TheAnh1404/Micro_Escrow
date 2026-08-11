import { Router } from 'express';
import { DealController } from '../controllers/dealController';

const router = Router();

// Endpoint 1: GET /api/deals?address={wallet_address}
router.get('/', DealController.getDealsByAddress);

// Endpoint 2: GET /api/deals/:id
router.get('/:id', DealController.getDealById);

// Endpoint 3: POST /api/deals/sync
router.post('/sync', DealController.syncDeal);

export default router;
