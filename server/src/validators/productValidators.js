import { body } from 'express-validator';

export const productValidator = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 150 }),
  body('sku').trim().notEmpty().withMessage('SKU is required'),
  body('category').notEmpty().withMessage('Category is required').isMongoId(),
  body('purchasePrice').isFloat({ min: 0 }).withMessage('Purchase price must be >= 0'),
  body('sellingPrice').isFloat({ min: 0 }).withMessage('Selling price must be >= 0'),
  body('stock').isInt({ min: 0 }).withMessage('Stock must be >= 0'),
  body('lowStockThreshold').isInt({ min: 0 }).withMessage('Low-stock threshold must be >= 0'),
  body('status').optional().isIn(['active', 'inactive']),
];