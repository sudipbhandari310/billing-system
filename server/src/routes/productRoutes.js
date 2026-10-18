import { Router } from 'express';
import * as controller from '../controllers/productController.js';
import { streamProductsCsv } from '../utils/csv.js';
import * as productService from '../services/productService.js';
import asyncHandler from '../utils/asyncHandler.js';
import protect from '../middleware/auth.js';
import authorize from '../middleware/role.js';
import validate from '../middleware/validate.js';
import { productValidator } from '../validators/productValidators.js';

const router = Router();

router.use(protect);

router.get('/', asyncHandler(controller.list));
router.get('/all', asyncHandler(controller.listAll));
router.get('/export.csv', asyncHandler(async (req, res) => {
  const products = await productService.listAll({
    search: req.query.search || '',
    category: req.query.category,
    stockStatus: req.query.stockStatus,
  });
  streamProductsCsv(res, products);
}));
router.get('/:id', asyncHandler(controller.get));
router.post('/', authorize('admin', 'staff'), productValidator, validate, asyncHandler(controller.create));
router.put('/:id', authorize('admin', 'staff'), productValidator, validate, asyncHandler(controller.update));
router.delete('/:id', authorize('admin'), asyncHandler(controller.remove));

export default router;