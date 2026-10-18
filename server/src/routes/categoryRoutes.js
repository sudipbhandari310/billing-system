import { Router } from 'express';
import * as controller from '../controllers/categoryController.js';
import asyncHandler from '../utils/asyncHandler.js';
import protect from '../middleware/auth.js';
import authorize from '../middleware/role.js';
import validate from '../middleware/validate.js';
import { categoryValidator } from '../validators/categoryValidators.js';

const router = Router();

router.use(protect);

router.get('/', asyncHandler(controller.list));
router.post('/', authorize('admin', 'staff'), categoryValidator, validate, asyncHandler(controller.create));
router.put('/:id', authorize('admin', 'staff'), categoryValidator, validate, asyncHandler(controller.update));
router.delete('/:id', authorize('admin'), asyncHandler(controller.remove));

export default router;