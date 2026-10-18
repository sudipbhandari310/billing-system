import { Router } from 'express';
import * as controller from '../controllers/customerController.js';
import asyncHandler from '../utils/asyncHandler.js';
import protect from '../middleware/auth.js';
import authorize from '../middleware/role.js';
import validate from '../middleware/validate.js';
import { customerValidator } from '../validators/customerValidators.js';

const router = Router();

router.use(protect);

router.get('/', asyncHandler(controller.list));
router.get('/:id', asyncHandler(controller.get));
router.get('/:id/history', asyncHandler(controller.history));
router.post('/', authorize('admin', 'staff'), customerValidator, validate, asyncHandler(controller.create));
router.put('/:id', authorize('admin', 'staff'), customerValidator, validate, asyncHandler(controller.update));
router.delete('/:id', authorize('admin'), asyncHandler(controller.remove));

export default router;