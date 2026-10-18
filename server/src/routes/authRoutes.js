import { Router } from 'express';
import * as controller from '../controllers/authController.js';
import asyncHandler from '../utils/asyncHandler.js';
import validate from '../middleware/validate.js';
import { registerValidator, loginValidator } from '../validators/authValidators.js';
import protect from '../middleware/auth.js';
import authorize from '../middleware/role.js';

const router = Router();

router.post('/register', protect, authorize('admin'), registerValidator, validate, asyncHandler(controller.register));
router.post('/login', loginValidator, validate, asyncHandler(controller.login));
router.get('/me', protect, asyncHandler(controller.me));

export default router;