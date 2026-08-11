"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dealController_1 = require("../controllers/dealController");
const router = (0, express_1.Router)();
// Endpoint 1: GET /api/deals?address={wallet_address}
router.get('/', dealController_1.DealController.getDealsByAddress);
// Endpoint 2: GET /api/deals/:id
router.get('/:id', dealController_1.DealController.getDealById);
// Endpoint 3: POST /api/deals/sync
router.post('/sync', dealController_1.DealController.syncDeal);
exports.default = router;
