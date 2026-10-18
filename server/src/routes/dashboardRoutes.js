import { Router } from 'express';
import * as controller from '../controllers/dashboardController.js';
import asyncHandler from '../utils/asyncHandler.js';
import protect from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.get('/summary', asyncHandler(controller.summary));
router.get('/sales-last-30-days', asyncHandler(controller.salesLast30Days));
router.get('/top-products', asyncHandler(controller.topSellingProducts));
router.get('/sales-by-category', asyncHandler(controller.salesByCategory));
router.get('/recent-invoices', asyncHandler(controller.recentInvoices));
router.get('/low-stock', asyncHandler(controller.lowStock));
router.get('/all', asyncHandler(controller.all));

export default router;