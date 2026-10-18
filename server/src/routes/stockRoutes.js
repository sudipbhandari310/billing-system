import { Router } from 'express';
import * as controller from '../controllers/stockController.js';
import asyncHandler from '../utils/asyncHandler.js';
import protect from '../middleware/auth.js';
import authorize from '../middleware/role.js';
import validate from '../middleware/validate.js';
import { adjustValidator } from '../validators/stockValidators.js';

const router = Router();

router.use(protect);

router.get('/movements', asyncHandler(controller.list));
router.post('/adjust', authorize('admin', 'staff'), adjustValidator, validate, asyncHandler(controller.adjust));

export default router;