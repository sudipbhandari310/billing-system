import { Router } from 'express';
import * as controller from '../controllers/invoiceController.js';
import asyncHandler from '../utils/asyncHandler.js';
import protect from '../middleware/auth.js';
import authorize from '../middleware/role.js';
import validate from '../middleware/validate.js';
import {
  createInvoiceValidator,
  updatePaymentValidator,
} from '../validators/invoiceValidators.js';

const router = Router();

router.use(protect);

router.get('/', asyncHandler(controller.list));
router.get('/export.csv', asyncHandler(controller.exportCsv));
router.post('/', authorize('admin', 'staff'), createInvoiceValidator, validate, asyncHandler(controller.create));
router.get('/:id', asyncHandler(controller.get));
router.get('/:id/pdf', asyncHandler(controller.preview));
router.get('/:id/download', asyncHandler(controller.download));
router.patch('/:id/cancel', authorize('admin', 'staff'), asyncHandler(controller.cancel));
router.patch('/:id/payment', authorize('admin', 'staff'), updatePaymentValidator, validate, asyncHandler(controller.updatePayment));

export default router;