import { Router } from 'express';
import * as controller from '../controllers/userController.js';
import asyncHandler from '../utils/asyncHandler.js';
import protect from '../middleware/auth.js';
import authorize from '../middleware/role.js';

const router = Router();

router.use(protect);

router.get('/', authorize('admin'), asyncHandler(controller.list));
router.get('/:id', authorize('admin'), asyncHandler(controller.get));
router.put('/:id', authorize('admin'), asyncHandler(controller.update));
router.delete('/:id', authorize('admin'), asyncHandler(controller.remove));

export default router;